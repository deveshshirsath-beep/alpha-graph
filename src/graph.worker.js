import { assertValidGraphDocument } from "./graph-schema.js";
import { computeLayouts } from "./graph-layouts.js";

const TYPE_SIZES = {
  "BUSINESS-AREA": 8.5,
  "BUSINESS-DOMAIN": 7.5,
  "BUSINESS-CAPABILITY": 5.8,
  "SERVICE-DOMAIN": 5.8,
  TEAMS: 6.5,
  OPERATION: 4.8,
  DATABASE: 8,
  EVENT: 7,
  APPLICATION: 8,
  CONSUMER: 6,
  API: 5.4,
  "API-VERSION": 4.5,
  ENDPOINT: 4.6,
  SCHEMA: 3.8,
  FIELD: 2.1,
};

const TYPE_COLOR_OVERRIDES = {
  "BUSINESS-AREA": ["#ffc657", "#bb6800", "#26c6da", "#ffc04d"],
  "BUSINESS-DOMAIN": ["#ffad46", "#c86500", "#21add1", "#ff963f"],
  "SERVICE-DOMAIN": ["#f39445", "#ad5200", "#168fbf", "#ff7048"],
  "BUSINESS-CAPABILITY": ["#ff764f", "#c23d25", "#3979d4", "#f44f6f"],
  TEAMS: ["#ff4f7b", "#bd284c", "#6758d9", "#d84eff"],
  APPLICATION: ["#8d68ff", "#6941d8", "#3d6df2", "#9757f5"],
  API: ["#557dff", "#315bc8", "#2389f2", "#755bea"],
  "API-VERSION": ["#7370ff", "#5545ce", "#12a1e5", "#9252dc"],
  ENDPOINT: ["#00bfff", "#007cad", "#00b8d4", "#bd4dcc"],
  "HTTP-METHOD": ["#00d2e8", "#00859a", "#00c9bc", "#dc49ad"],
  SECURITY: ["#19d6b4", "#007f6b", "#17b89c", "#ef4d8d"],
  EXPOSURE: ["#4fe0a2", "#138158", "#48ba80", "#fb5e70"],
  PCI: ["#8edf72", "#47872c", "#73b96a", "#ff7859"],
  PII: ["#c5db5c", "#74841d", "#99b95f", "#ff9250"],
  GATEWAY: ["#ffd052", "#a97600", "#5ea9b7", "#ffad4a"],
  MICROSERVICE: ["#ffae52", "#b65d10", "#4b97c2", "#ff824f"],
  WORKFLOW: ["#ff8466", "#bc4029", "#527fd0", "#f55b73"],
  "QUERY-PARAMETER": ["#20d2cb", "#008b86", "#15b8b0", "#d653a7"],
  "PATH-PARAMETER": ["#6b8fff", "#3f5fbd", "#2c9cca", "#aa54d1"],
  HEADER: ["#4f9cff", "#246bb9", "#2685bc", "#c858bf"],
  "STATUS-CODE": ["#22c6e8", "#097b9c", "#15a9ad", "#e15a9d"],
  SCHEMA: ["#9b5cff", "#7536c7", "#536fd0", "#f05b8d"],
  FIELD: ["#d64fff", "#972fb9", "#655dc8", "#ff6a70"],
  CONSUMER: ["#ef59ff", "#b32ac5", "#774fc5", "#ff884f"],
  OPERATION: ["#00e4c0", "#007f78", "#00b7aa", "#ff5f87"],
  DATABASE: ["#00d8a2", "#008060", "#18a887", "#e4539c"],
  EVENT: ["#75df72", "#318433", "#5ea66b", "#c65bb2"],
};

const GRADIENT_TYPES = new Set([
  "BUSINESS-AREA", "BUSINESS-DOMAIN", "APPLICATION", "API", "DATABASE", "EVENT", "SCHEMA",
]);

const TYPE_ORDER = [
  "BUSINESS-AREA", "BUSINESS-DOMAIN", "SERVICE-DOMAIN", "BUSINESS-CAPABILITY", "TEAMS",
  "APPLICATION", "API", "API-VERSION", "ENDPOINT", "OPERATION", "HTTP-METHOD", "SECURITY", "EXPOSURE",
  "PCI", "PII", "GATEWAY", "MICROSERVICE", "WORKFLOW", "QUERY-PARAMETER", "PATH-PARAMETER", "HEADER",
  "STATUS-CODE", "SCHEMA", "FIELD", "CONSUMER", "DATABASE", "EVENT",
];

const RELATION_COLORS = {
  "OWNS": ["#ff9955", "#bb5728"],
  "IMPLEMENTS": ["#8b6cff", "#6748c7"],
  "EXPOSES": ["#00c9ff", "#007fa9"],
  "CALLS": ["#25d9c7", "#078a80"],
  "ROUTES-TO": ["#32d7ff", "#087e9f"],
  "CONNECTS-TO": ["#19d6ae", "#087d69"],
  "READS-FROM": ["#9a76ff", "#694bb6"],
  "WRITES-TO": ["#f15cff", "#a832b0"],
  "UPDATES-TO": ["#ff6d9d", "#b93662"],
  "PRODUCES": ["#64df9a", "#24815a"],
  "CONSUMES": ["#ffb64d", "#a8670c"],
  "CLASSIFIED-AS": ["#f2a94f", "#a96718"],
  "HAS-PROPERTY": ["#916bdb", "#a08ac8"],
  "CONTAINS": ["#477cd0", "#5c78a5"],
  "RETURNS": ["#358dcf", "#4e7595"],
  "ACCEPTS": ["#2aa8ba", "#4f7f86"],
};

function hash(input) {
  let result = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    result ^= input.charCodeAt(i);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function tint(hex, amount) {
  const value = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (value >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (value & 255) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function hslToHex(hue, saturation, lightness) {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const section = hue / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));
  const [red, green, blue] = section < 1 ? [chroma, x, 0] : section < 2 ? [x, chroma, 0] : section < 3 ? [0, chroma, x] : section < 4 ? [0, x, chroma] : section < 5 ? [x, 0, chroma] : [chroma, 0, x];
  const match = l - chroma / 2;
  const channel = (value) => Math.round((value + match) * 255).toString(16).padStart(2, "0");
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

function generatedPalette(type, layer) {
  const layerHue = layer === "BUSINESS" ? 28 : layer === "API" ? 235 : layer === "RUNTIME" ? 165 : hash(layer) % 360;
  const hue = (layerHue + (hash(type) % 71) - 35 + 360) % 360;
  const oceanHue = 178 + (hash(type) % 64);
  const sunsetHue = (338 + (hash(type) % 76)) % 360;
  return [hslToHex(hue, 82, 63), hslToHex(hue, 76, 40), hslToHex(oceanHue, 78, 54), hslToHex(sunsetHue, 84, 62)];
}

function generatedRelationshipPalette(relationship) {
  const hue = (195 + (hash(relationship) % 120)) % 360;
  return [hslToHex(hue, 70, 58), hslToHex(hue, 45, 48)];
}

function prepare(raw) {
  const totals = {};
  const layerTypeSets = {};
  const nodeTypesById = new Map();
  for (const node of raw.nodes) {
    const type = node.type || "UNKNOWN";
    const layer = node.layer || "UNKNOWN";
    totals[type] = (totals[type] || 0) + 1;
    if (!layerTypeSets[layer]) layerTypeSets[layer] = new Set();
    layerTypeSets[layer].add(type);
    nodeTypesById.set(node.id, type);
  }
  const preferredLayers = ["BUSINESS", "API", "RUNTIME"];
  const layerOrder = [...preferredLayers.filter((layer) => layerTypeSets[layer]), ...Object.keys(layerTypeSets).filter((layer) => !preferredLayers.includes(layer)).sort()];
  const typeRank = new Map(TYPE_ORDER.map((type, index) => [type, index]));
  const layers = {};
  for (const layer of layerOrder) {
    layers[layer] = [...layerTypeSets[layer]].sort((first, second) => {
      const firstRank = typeRank.has(first) ? typeRank.get(first) : Number.MAX_SAFE_INTEGER;
      const secondRank = typeRank.has(second) ? typeRank.get(second) : Number.MAX_SAFE_INTEGER;
      return firstRank - secondRank || first.localeCompare(second);
    });
  }
  const dynamicTypeOrder = Object.values(layers).flat();
  const dynamicTypeRank = new Map(dynamicTypeOrder.map((type, index) => [type, index]));
  const degree = {};
  for (const edge of raw.edges) {
    degree[edge.sourceId] = (degree[edge.sourceId] || 0) + 1;
    degree[edge.targetId] = (degree[edge.targetId] || 0) + 1;
  }

  // Each entity's structural parent (area → domain, app → API, schema →
  // field …) drives the cluster shapes in graph-layouts.js. The coordinates
  // are generated once during chunk preparation, so the browser only reads them.
  const parentPriorities = {
    "HAS-PROPERTY": 120,
    CONTAINS: 115,
    OWNS: 100,
    EXPOSES: 95,
    ACCEPTS: 90,
    RETURNS: 90,
    SUPPORTS: 85,
    IMPLEMENTS: 80,
    "HAS-EXPOSURE": 80,
    "CLASSIFIED-AS": 80,
    "DEPLOYED-TO": 75,
    PRODUCES: 70,
  };
  const structuralParents = new Map();
  const structuralParentPriority = new Map();
  for (const edge of raw.edges) {
    if (edge.relationshipType === "SUBSCRIBES" && nodeTypesById.has(edge.sourceId) && nodeTypesById.has(edge.targetId)) {
      structuralParents.set(edge.sourceId, edge.targetId);
      structuralParentPriority.set(edge.sourceId, 72);
      continue;
    }
    const priority = parentPriorities[edge.relationshipType];
    if (!priority || !nodeTypesById.has(edge.sourceId) || !nodeTypesById.has(edge.targetId)) continue;
    if ((structuralParentPriority.get(edge.targetId) || 0) >= priority) continue;
    structuralParents.set(edge.targetId, edge.sourceId);
    structuralParentPriority.set(edge.targetId, priority);
  }
  const layouts = computeLayouts({
    nodes: raw.nodes.map((node) => ({ id: node.id, type: node.type || "UNKNOWN" })),
    nodeTypesById,
    structuralParents,
    typeRank: dynamicTypeRank,
    layerOrder,
    layers,
    labelForType: (type) => type.split("-").map((word, index) => (["API", "HTTP", "PCI", "PII"].includes(word) ? word : index ? word.toLowerCase() : word.charAt(0) + word.slice(1).toLowerCase())).join(" "),
  });

  const nodes = raw.nodes.map((node) => {
    const type = node.type || "UNKNOWN";
    const layer = node.layer || "UNKNOWN";
    const seed = hash(node.id);
    const layout = layouts.positions.get(node.id);
    const palette = TYPE_COLOR_OVERRIDES[type] || generatedPalette(type, layer);
    const darkColor = tint(palette[0], (seed % 19) - 9);
    const lightColor = tint(palette[1], (seed % 13) - 6);
    const oceanColor = tint(palette[2] || palette[0], (seed % 11) - 5);
    const sunsetColor = tint(palette[3] || palette[0], (seed % 11) - 5);

    return {
      key: node.id,
      attributes: {
        x: layout.donutX,
        y: layout.donutY,
        semanticX: layout.donutX,
        semanticY: layout.donutY,
        ...layout,
        size: (TYPE_SIZES[type] || 3.1) + Math.min(5.5, Math.log2((degree[node.id] || 0) + 1) * 0.68),
        importance: degree[node.id] || 0,
        color: darkColor,
        darkColor,
        lightColor,
        oceanColor,
        sunsetColor,
        label: node.name || node.id,
        name: node.name || node.id,
        type: GRADIENT_TYPES.has(type) ? "gradient" : "circle",
        entityType: type,
        layer,
        properties: node.properties || null,
      },
    };
  });

  const edgeTypes = {};
  const relationshipSchema = new Map();
  const edges = raw.edges.map((edge) => {
    const relationship = edge.relationshipType || "RELATED-TO";
    edgeTypes[relationship] = (edgeTypes[relationship] || 0) + 1;
    const sourceType = nodeTypesById.get(edge.sourceId) || "UNKNOWN";
    const targetType = nodeTypesById.get(edge.targetId) || "UNKNOWN";
    const schemaKey = `${sourceType}\u0000${relationship}\u0000${targetType}`;
    const schemaEntry = relationshipSchema.get(schemaKey) || { source: sourceType, relationship, target: targetType, count: 0 };
    schemaEntry.count += 1;
    relationshipSchema.set(schemaKey, schemaEntry);
    const relationshipPalette = RELATION_COLORS[relationship] || generatedRelationshipPalette(relationship);
    return {
      key: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      attributes: {
        relationshipType: relationship,
        properties: edge.properties || null,
        size: 0.45,
        color: relationshipPalette[0],
        darkColor: relationshipPalette[0],
        lightColor: relationshipPalette[1],
      },
    };
  });

  return {
    nodes,
    edges,
    meta: {
      generatedAt: raw.generatedAt,
      graphVersion: raw.graphVersion,
      counts: totals,
      edgeCounts: edgeTypes,
      layers,
      layerOrder,
      planes: layouts.planes,
      relationshipSchema: [...relationshipSchema.values()].sort((first, second) => second.count - first.count),
      totalNodes: nodes.length,
      totalEdges: edges.length,
    },
  };
}

async function readGraphText(data) {
  if (data.compressedUrl && typeof DecompressionStream !== "undefined") {
    try {
      const compressedResponse = await fetch(data.compressedUrl);
      if (compressedResponse.ok && compressedResponse.body) {
        self.postMessage({ kind: "progress", progress: 18, label: "Decompressing graph stream" });
        const stream = compressedResponse.body.pipeThrough(new DecompressionStream("gzip"));
        return await new Response(stream).text();
      }
    } catch {
      // Fall through to the uncompressed source for older browsers or development setups.
    }
  }
  const response = await fetch(data.url);
  if (!response.ok) throw new Error(`Graph request failed (${response.status})`);
  return response.text();
}

async function handleWorkerMessage({ data }) {
  try {
    self.postMessage({ kind: "progress", progress: 8, label: "Loading graph data" });
    const text = await readGraphText(data);
    self.postMessage({ kind: "progress", progress: 24, label: "Parsing graph data" });
    const raw = JSON.parse(text);
    self.postMessage({ kind: "progress", progress: 35, label: "Validating graph schema" });
    assertValidGraphDocument(raw);
    self.postMessage({ kind: "progress", progress: 42, label: "Indexing entities" });
    self.postMessage({ kind: "progress", progress: 58, label: "Calculating semantic layout" });
    const result = prepare(raw);
    self.postMessage({ kind: "catalog", meta: result.meta });
    const nodeTotal = result.nodes.length;
    const edgeTotal = result.edges.length;
    const batchSize = 4000;
    let sentNodes = 0;
    while (result.nodes.length) {
      const nodes = result.nodes.splice(0, batchSize);
      sentNodes += nodes.length;
      self.postMessage({ kind: "node-batch", nodes, processed: sentNodes, total: nodeTotal });
    }
    let sentEdges = 0;
    while (result.edges.length) {
      const edges = result.edges.splice(0, batchSize);
      sentEdges += edges.length;
      self.postMessage({ kind: "edge-batch", edges, processed: sentEdges, total: edgeTotal });
    }
    self.postMessage({ kind: "ready" });
  } catch (error) {
    self.postMessage({ kind: "error", message: error instanceof Error ? error.message : String(error) });
  }
}

if (typeof self !== "undefined") self.onmessage = handleWorkerMessage;

export { handleWorkerMessage, prepare };
