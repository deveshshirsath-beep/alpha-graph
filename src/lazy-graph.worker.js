async function readCompressedJson(url) {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`Graph chunk request failed (${response.status})`);
  // Servers that advertise Content-Encoding have already asked fetch to decode
  // the body. Only decompress manually on static hosts that serve .gz as bytes.
  if (response.headers.get("content-encoding")?.includes("gzip")) return response.json();
  if (typeof DecompressionStream === "undefined" || !response.body) throw new Error("This browser does not support streamed gzip graph chunks");
  const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text());
}

function resolveChunkUrl(manifestUrl, filename) {
  return new URL(filename, manifestUrl).href;
}

function validateManifest(manifest) {
  if (!manifest || manifest.formatVersion !== 11 || !manifest.meta || !manifest.catalogChunks || !manifest.layerChunks || !Array.isArray(manifest.edgeChunks)) {
    throw new Error("Invalid graph chunk manifest");
  }
  return manifest;
}

let manifest = null;
let manifestUrl = "";
const loadedCatalogTypes = new Set();

async function initialize(data) {
  manifestUrl = data.manifestUrl;
  const response = await fetch(manifestUrl, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`Graph manifest request failed (${response.status})`);
  manifest = validateManifest(await response.json());
  self.postMessage({ kind: "catalog", meta: manifest.meta, sourceDigest: manifest.sourceDigest });
  self.postMessage({ kind: "catalog-ready" });
}

async function loadCatalog(data) {
  if (!manifest) throw new Error("Graph catalog has not initialized");
  const requestedTypes = [...new Set(data.types)].filter((type) => manifest.catalogChunks[type]);
  for (const type of requestedTypes) {
    if (loadedCatalogTypes.has(type)) continue;
    const chunk = manifest.catalogChunks[type];
    const catalog = await readCompressedJson(resolveChunkUrl(manifestUrl, chunk.file));
    const batchSize = 5000;
    for (let index = 0; index < catalog.length; index += batchSize) {
      self.postMessage({ kind: "search-batch", items: catalog.slice(index, index + batchSize), processed: Math.min(index + batchSize, catalog.length), total: catalog.length });
    }
    loadedCatalogTypes.add(type);
  }
  self.postMessage({ kind: "catalog-types-ready", requestId: data.requestId, types: requestedTypes });
}

async function loadView(data) {
  if (!manifest) throw new Error("Graph catalog has not initialized");
  const requestedLayers = [...new Set(data.layers)].filter((layer) => manifest.layerChunks[layer]);
  if (!requestedLayers.length) throw new Error("No valid graph layers were requested");
  const requestedSet = new Set(requestedLayers);
  self.postMessage({ kind: "view-reset", requestId: data.requestId, layers: requestedLayers });

  let processedLayers = 0;
  for (const layer of requestedLayers) {
    const chunk = manifest.layerChunks[layer];
    const nodes = await readCompressedJson(resolveChunkUrl(manifestUrl, chunk.file));
    const batchSize = 4000;
    for (let index = 0; index < nodes.length; index += batchSize) self.postMessage({ kind: "node-batch", nodes: nodes.slice(index, index + batchSize), requestId: data.requestId });
    processedLayers += 1;
    self.postMessage({ kind: "view-progress", requestId: data.requestId, progress: Math.round((processedLayers / requestedLayers.length) * 55), label: `Loaded ${layer} entities` });
  }

  const edgeChunks = manifest.edgeChunks.filter((chunk) => chunk.layers.every((layer) => requestedSet.has(layer)));
  let processedEdgeChunks = 0;
  for (const chunk of edgeChunks) {
    const edges = await readCompressedJson(resolveChunkUrl(manifestUrl, chunk.file));
    const batchSize = 4000;
    for (let index = 0; index < edges.length; index += batchSize) self.postMessage({ kind: "edge-batch", edges: edges.slice(index, index + batchSize), requestId: data.requestId });
    processedEdgeChunks += 1;
    self.postMessage({ kind: "view-progress", requestId: data.requestId, progress: 55 + Math.round((processedEdgeChunks / Math.max(1, edgeChunks.length)) * 43), label: "Linking requested relationships" });
  }
  self.postMessage({ kind: "view-ready", requestId: data.requestId, layers: requestedLayers });
}

self.onmessage = async ({ data }) => {
  try {
    if (data.kind === "initialize") await initialize(data);
    else if (data.kind === "load-catalog") await loadCatalog(data);
    else if (data.kind === "load-view") await loadView(data);
  } catch (error) {
    self.postMessage({ kind: "error", requestId: data.requestId, message: error instanceof Error ? error.message : String(error) });
  }
};
