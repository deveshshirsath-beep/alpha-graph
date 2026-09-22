import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { assertValidGraphDocument } from "../src/graph-schema.js";
import { prepare } from "../src/graph.worker.js";
import { graphSources } from "./graph-source.mjs";

const gzipAsync = promisify(gzip);
const CHUNK_FORMAT_VERSION = 11;
const REGISTRY_FORMAT_VERSION = 10;
const outputUrl = new URL("../public/graph-data/", import.meta.url);
const temporaryUrl = new URL("../public/graph-data.tmp/", import.meta.url);
const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "graph";
const hash = (value) => createHash("sha256").update(String(value)).digest("hex");
const fileKey = (value) => `${slug(value)}-${hash(value).slice(0, 8)}`;

const sources = await Promise.all(graphSources.map(async (source) => {
  const details = await stat(source.url);
  const fingerprint = hash(`${source.url.href}\0${details.size}\0${Math.round(details.mtimeMs)}`);
  return { ...source, fingerprint, id: `${slug(source.name)}-${hash(source.url.href).slice(0, 8)}` };
}));
const collectionFingerprint = hash(JSON.stringify(sources.map(({ id, fingerprint }) => ({ id, fingerprint }))));

try {
  const currentRegistry = JSON.parse(await readFile(new URL("index.json", outputUrl), "utf8"));
  if (currentRegistry.formatVersion === REGISTRY_FORMAT_VERSION && currentRegistry.collectionFingerprint === collectionFingerprint) {
    console.log(`${sources.length} graph dataset${sources.length === 1 ? " is" : "s are"} current.`);
    process.exit(0);
  }
} catch {
  // Generate the first registry or replace an outdated one.
}

async function writeCompressedJson(directoryUrl, filename, value) {
  const content = JSON.stringify(value);
  await writeFile(new URL(filename, directoryUrl), await gzipAsync(content, { level: 9 }));
  return Buffer.byteLength(content);
}

async function buildGraph(source) {
  console.log(`Validating and chunking ${source.label}…`);
  let raw;
  try {
    raw = JSON.parse(await readFile(source.url, "utf8"));
  } catch (error) {
    throw new Error(`Could not parse ${source.label}: ${error.message}`, { cause: error });
  }
  try {
    assertValidGraphDocument(raw);
  } catch (error) {
    throw new Error(`Invalid graph ${source.label}: ${error.message}`, { cause: error });
  }
  const prepared = prepare(raw);
  const graphOutputUrl = new URL(`${source.id}/`, temporaryUrl);
  await mkdir(graphOutputUrl, { recursive: true });

  const layerByNode = new Map(prepared.nodes.map((node) => [node.key, node.attributes.layer]));
  const nodesByLayer = new Map();
  const catalogByType = new Map();
  for (const node of prepared.nodes) {
    const layer = node.attributes.layer;
    if (!nodesByLayer.has(layer)) nodesByLayer.set(layer, []);
    nodesByLayer.get(layer).push(node);
    const type = node.attributes.entityType;
    if (!catalogByType.has(type)) catalogByType.set(type, []);
    catalogByType.get(type).push({
      id: node.key,
      name: node.attributes.name,
      type,
      layer,
      color: node.attributes.color,
      darkColor: node.attributes.darkColor,
      lightColor: node.attributes.lightColor,
      oceanColor: node.attributes.oceanColor,
      sunsetColor: node.attributes.sunsetColor,
    });
  }

  const edgesByLayerPair = new Map();
  for (const edge of prepared.edges) {
    const sourceLayer = layerByNode.get(edge.source) || "UNKNOWN";
    const targetLayer = layerByNode.get(edge.target) || "UNKNOWN";
    const pair = JSON.stringify([sourceLayer, targetLayer].sort());
    if (!edgesByLayerPair.has(pair)) edgesByLayerPair.set(pair, { layers: [...new Set([sourceLayer, targetLayer])], edges: [] });
    edgesByLayerPair.get(pair).edges.push(edge);
  }

  const layerChunks = {};
  for (const [layer, nodes] of nodesByLayer) {
    const filename = `nodes-${fileKey(layer)}.json.gz`;
    const uncompressedBytes = await writeCompressedJson(graphOutputUrl, filename, nodes);
    layerChunks[layer] = { file: filename, nodes: nodes.length, uncompressedBytes };
  }

  const edgeChunks = [];
  for (const [pair, entry] of edgesByLayerPair) {
    const filename = `edges-${fileKey(pair)}.json.gz`;
    const uncompressedBytes = await writeCompressedJson(graphOutputUrl, filename, entry.edges);
    edgeChunks.push({ file: filename, layers: entry.layers, edges: entry.edges.length, uncompressedBytes });
  }

  const catalogChunks = {};
  const typeStyles = {};
  for (const [type, items] of catalogByType) {
    const filename = `catalog-${fileKey(type)}.json.gz`;
    const uncompressedBytes = await writeCompressedJson(graphOutputUrl, filename, items);
    catalogChunks[type] = { file: filename, entities: items.length, layer: items[0]?.layer, uncompressedBytes };
    const sample = items[0] || {};
    typeStyles[type] = {
      entityType: type,
      layer: sample.layer,
      color: sample.color,
      darkColor: sample.darkColor,
      lightColor: sample.lightColor,
      oceanColor: sample.oceanColor,
      sunsetColor: sample.sunsetColor,
    };
  }

  const manifest = {
    formatVersion: CHUNK_FORMAT_VERSION,
    sourceFingerprint: source.fingerprint,
    sourceName: source.label,
    name: source.name,
    generatedAt: new Date().toISOString(),
    sourceDigest: hash(JSON.stringify({ graphVersion: raw.graphVersion, generatedAt: raw.generatedAt, nodes: raw.nodes.length, edges: raw.edges.length })),
    meta: { ...prepared.meta, typeStyles },
    catalogChunks,
    layerChunks,
    edgeChunks,
  };
  await writeFile(new URL("manifest.json", graphOutputUrl), `${JSON.stringify(manifest, null, 2)}\n`);
  return {
    id: source.id,
    name: source.name,
    sourceName: source.label,
    manifest: `${source.id}/manifest.json`,
    graphVersion: prepared.meta.graphVersion,
    generatedAt: prepared.meta.generatedAt,
    totalNodes: prepared.meta.totalNodes,
    totalEdges: prepared.meta.totalEdges,
  };
}

await rm(temporaryUrl, { recursive: true, force: true });
await mkdir(temporaryUrl, { recursive: true });
const graphs = [];
for (const source of sources) graphs.push(await buildGraph(source));
const registry = {
  formatVersion: REGISTRY_FORMAT_VERSION,
  collectionFingerprint,
  generatedAt: new Date().toISOString(),
  defaultGraphId: graphs[0].id,
  graphs,
};
await writeFile(new URL("index.json", temporaryUrl), `${JSON.stringify(registry, null, 2)}\n`);

if (existsSync(outputUrl)) await rm(outputUrl, { recursive: true, force: true });
await rename(temporaryUrl, outputUrl);
console.log(`Prepared ${graphs.length} selectable graph dataset${graphs.length === 1 ? "" : "s"}.`);
