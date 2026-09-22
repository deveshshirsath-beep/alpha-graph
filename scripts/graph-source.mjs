import { readdir, readFile, stat } from "node:fs/promises";
import { basename, extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const configUrl = new URL("../graph.config.json", import.meta.url);
let config = { source: "merged-graph-v4.json", directory: "graphs" };

try {
  config = { ...config, ...JSON.parse(await readFile(configUrl, "utf8")) };
} catch (error) {
  if (error?.code !== "ENOENT") throw new Error(`Invalid graph.config.json: ${error.message}`, { cause: error });
}

const resolvePath = (value) => isAbsolute(value) ? value : resolve(projectRoot, value);
const displayPath = (value) => {
  const relativePath = relative(projectRoot, value);
  return relativePath && !relativePath.startsWith("..") ? relativePath : basename(value);
};
const normalizeEntry = (entry) => {
  const value = typeof entry === "string" ? entry : entry?.path;
  if (typeof value !== "string" || !value.trim()) throw new Error("Every graph source must be a path string or an object with a non-empty path");
  const path = resolvePath(value.trim());
  return {
    path,
    url: pathToFileURL(path),
    label: displayPath(path),
    name: typeof entry === "object" && entry.name ? String(entry.name) : basename(path, extname(path)),
  };
};

async function discoverDirectory(directory) {
  if (!directory) return [];
  const directoryPath = resolvePath(String(directory));
  try {
    const entries = await readdir(directoryPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
      .sort((first, second) => first.name.localeCompare(second.name))
      .map((entry) => normalizeEntry(resolve(directoryPath, entry.name)));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

const configuredEntries = process.env.GRAPH_SOURCE
  ? [normalizeEntry(process.env.GRAPH_SOURCE)]
  : [
      ...(config.source ? [normalizeEntry(config.source)] : []),
      ...(Array.isArray(config.sources) ? config.sources.map(normalizeEntry) : []),
      ...await discoverDirectory(config.directory),
    ];

const uniqueSources = new Map();
for (const entry of configuredEntries) {
  try {
    const details = await stat(entry.path);
    if (details.isFile()) uniqueSources.set(entry.path, entry);
  } catch (error) {
    const isOptionalDefault = entry.label === "merged-graph-v4.json" && configuredEntries.length > 1;
    if (error?.code !== "ENOENT" || !isOptionalDefault) throw new Error(`Graph source not found: ${entry.label}`, { cause: error });
  }
}

export const graphSources = [...uniqueSources.values()];
if (!graphSources.length) throw new Error("No graph JSON files were found. Add a source or place .json files in the configured graph directory.");

// Backward-compatible exports for integrations expecting one source.
export const graphSourcePath = graphSources[0].path;
export const graphSourceUrl = graphSources[0].url;
export const graphSourceLabel = graphSources[0].label;
