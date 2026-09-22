import { assertValidGraphDocument } from "./graph-schema.js";

const TYPE_LAYOUT = {
  "BUSINESS-AREA": [-1650, -430, 310],
  "BUSINESS-DOMAIN": [-1440, -80, 420],
  "BUSINESS-CAPABILITY": [-1080, 250, 580],
  "SERVICE-DOMAIN": [-760, -130, 560],
  TEAMS: [-1120, -560, 350],
  OPERATION: [-80, -20, 720],
  DATABASE: [-260, -760, 210],
  EVENT: [170, -760, 180],
  APPLICATION: [470, -610, 260],
  CONSUMER: [850, -720, 350],
  GATEWAY: [520, -260, 120],
  MICROSERVICE: [300, -260, 120],
  WORKFLOW: [120, -450, 120],
  API: [570, -50, 760],
  "API-VERSION": [940, 180, 730],
  ENDPOINT: [1270, -80, 760],
  "HTTP-METHOD": [1440, -610, 170],
  EXPOSURE: [1130, -710, 150],
  SECURITY: [1380, -760, 120],
  PCI: [1580, -760, 100],
  PII: [1740, -760, 100],
  SCHEMA: [1780, 140, 1050],
  "STATUS-CODE": [1470, 650, 680],
  HEADER: [2180, -400, 1250],
  "PATH-PARAMETER": [2050, 760, 680],
  "QUERY-PARAMETER": [1540, 980, 260],
  FIELD: [3050, 220, 2300],
};

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

const LAYER_COLUMN = { BUSINESS: -1500, API: 0, RUNTIME: 1500 };

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
  const dynamicLayerColumn = Object.fromEntries(layerOrder.map((layer, index) => [layer, layerOrder.length === 1 ? 0 : (index - (layerOrder.length - 1) / 2) * 1500]));
  const degree = {};
  for (const edge of raw.edges) {
    degree[edge.sourceId] = (degree[edge.sourceId] || 0) + 1;
    degree[edge.targetId] = (degree[edge.targetId] || 0) + 1;
  }

  // Build the reference constellation: schema/field solar systems form the
  // outer shell, API descendants create a cool-colored core, business groups
  // occupy the lower-left interior, and runtime entities form a warm cluster
  // toward the bottom. The coordinates are deterministic and generated once
  // during chunk preparation, so the browser only has to render them.
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
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const nodesByType = new Map();
  for (const node of raw.nodes) {
    const type = node.type || "UNKNOWN";
    if (!nodesByType.has(type)) nodesByType.set(type, []);
    nodesByType.get(type).push(node);
  }
  const sortedType = (type) => (nodesByType.get(type) || []).slice().sort((first, second) => first.id.localeCompare(second.id));
  const semanticPositions = new Map();
  const setSemanticPosition = (nodeId, x, y) => {
    semanticPositions.set(nodeId, { x, y });
  };
  const spiralPoint = (index, spacing, phase = 0, aspect = 1) => {
    if (!index) return { x: 0, y: 0 };
    const angle = phase + index * goldenAngle;
    const radius = spacing * Math.sqrt(index);
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * aspect };
  };
  const ancestorCache = new Map();
  const findAncestorOfType = (nodeId, ancestorType) => {
    const cacheKey = `${ancestorType}\u0000${nodeId}`;
    if (ancestorCache.has(cacheKey)) return ancestorCache.get(cacheKey);
    let current = nodeId;
    const seen = new Set();
    let result = null;
    for (let depth = 0; depth < 24 && current && !seen.has(current); depth += 1) {
      seen.add(current);
      if (nodeTypesById.get(current) === ancestorType) {
        result = current;
        break;
      }
      current = structuralParents.get(current);
    }
    ancestorCache.set(cacheKey, result);
    return result;
  };

  // Outer donut: every schema is a green hub and its nested fields stay close
  // to it. The annular distribution preserves the continuous constellation
  // while the wider radius and local spacing keep individual nodes readable.
  const schemas = sortedType("SCHEMA");
  const fieldsBySchema = new Map();
  const orphanFields = [];
  for (const field of sortedType("FIELD")) {
    const schemaId = findAncestorOfType(field.id, "SCHEMA");
    if (!schemaId) orphanFields.push(field);
    else {
      if (!fieldsBySchema.has(schemaId)) fieldsBySchema.set(schemaId, []);
      fieldsBySchema.get(schemaId).push(field);
    }
  }
  const orderedSchemas = schemas.slice().sort((first, second) => {
    const sizeDifference = (fieldsBySchema.get(second.id)?.length || 0) - (fieldsBySchema.get(first.id)?.length || 0);
    return sizeDifference || hash(first.id) - hash(second.id);
  });
  const outerMin = 2150;
  const outerMax = 3400;
  orderedSchemas.forEach((schema, index) => {
    const fraction = (index + 0.5) / Math.max(1, orderedSchemas.length);
    const shellRadius = Math.sqrt(outerMin ** 2 + fraction * (outerMax ** 2 - outerMin ** 2));
    const shellAngle = index * goldenAngle - Math.PI / 2;
    const centerX = Math.cos(shellAngle) * shellRadius;
    const centerY = Math.sin(shellAngle) * shellRadius;
    setSemanticPosition(schema.id, centerX, centerY);
    const fields = fieldsBySchema.get(schema.id) || [];
    const phase = ((hash(schema.id) % 360) / 180) * Math.PI;
    fields.forEach((field, fieldIndex) => {
      const localIndex = fieldIndex + 1;
      const localAngle = phase + localIndex * goldenAngle;
      const localRadius = 6.2 * Math.sqrt(localIndex) * (0.9 + ((hash(field.id) >>> 8) % 21) / 100);
      setSemanticPosition(field.id, centerX + Math.cos(localAngle) * localRadius, centerY + Math.sin(localAngle) * localRadius);
    });
  });
  orphanFields.forEach((field, index) => {
    const angle = index * goldenAngle;
    const radius = 3480 + 3.6 * Math.sqrt(index);
    setSemanticPosition(field.id, Math.cos(angle) * radius, Math.sin(angle) * radius);
  });

  // API core: applications are communities; APIs and their structural
  // descendants make the dense blue/cyan center of the system map.
  const applications = sortedType("APPLICATION");
  const applicationCenters = new Map();
  applications.forEach((application, index) => {
    const point = spiralPoint(index, 185, -0.7, 0.9);
    const center = { x: point.x, y: point.y + 180 };
    applicationCenters.set(application.id, center);
    setSemanticPosition(application.id, center.x, center.y);
  });
  const orphanApplicationCenter = { x: 0, y: 180 };
  const apisByApplication = new Map();
  for (const api of sortedType("API")) {
    const applicationId = findAncestorOfType(api.id, "APPLICATION") || "__orphan_application__";
    if (!apisByApplication.has(applicationId)) apisByApplication.set(applicationId, []);
    apisByApplication.get(applicationId).push(api);
  }
  const apiCenters = new Map();
  for (const [applicationId, apis] of apisByApplication) {
    const applicationCenter = applicationCenters.get(applicationId) || orphanApplicationCenter;
    const phase = ((hash(applicationId) % 360) / 180) * Math.PI;
    apis.forEach((api, index) => {
      const point = spiralPoint(index, 23, phase, 0.92);
      const center = { x: applicationCenter.x + point.x, y: applicationCenter.y + point.y };
      apiCenters.set(api.id, center);
      setSemanticPosition(api.id, center.x, center.y);
    });
  }
  const coreDescendantsByApi = new Map();
  for (const type of ["API-VERSION", "ENDPOINT"]) {
    for (const node of sortedType(type)) {
      const apiId = findAncestorOfType(node.id, "API");
      if (!apiId) continue;
      if (!coreDescendantsByApi.has(apiId)) coreDescendantsByApi.set(apiId, []);
      coreDescendantsByApi.get(apiId).push(node);
    }
  }
  for (const [apiId, descendants] of coreDescendantsByApi) {
    const center = apiCenters.get(apiId) || orphanApplicationCenter;
    const phase = ((hash(apiId) % 360) / 180) * Math.PI;
    descendants.forEach((node, index) => {
      const point = spiralPoint(index + 1, 7.2, phase);
      setSemanticPosition(node.id, center.x + point.x, center.y + point.y);
    });
  }

  // Business communities occupy the lower-left interior.
  const businessMembersByArea = new Map();
  for (const type of ["BUSINESS-DOMAIN", "SERVICE-DOMAIN", "BUSINESS-CAPABILITY"]) {
    for (const node of sortedType(type)) {
      const areaId = findAncestorOfType(node.id, "BUSINESS-AREA") || "__orphan_area__";
      if (!businessMembersByArea.has(areaId)) businessMembersByArea.set(areaId, []);
      businessMembersByArea.get(areaId).push(node);
    }
  }
  sortedType("BUSINESS-AREA").forEach((area, index) => {
    const offset = spiralPoint(index, 205, 2.45, 0.8);
    const center = { x: -920 + offset.x, y: -620 + offset.y };
    setSemanticPosition(area.id, center.x, center.y);
    const members = businessMembersByArea.get(area.id) || [];
    const phase = ((hash(area.id) % 360) / 180) * Math.PI;
    members.forEach((member, memberIndex) => {
      const point = spiralPoint(memberIndex + 1, 15, phase);
      setSemanticPosition(member.id, center.x + point.x, center.y + point.y);
    });
  });
  (businessMembersByArea.get("__orphan_area__") || []).forEach((member, index) => {
    const point = spiralPoint(index, 18, 1.8);
    setSemanticPosition(member.id, -620 + point.x, -520 + point.y);
  });
  sortedType("TEAMS").forEach((team, index) => {
    const point = spiralPoint(index, 34, 2.2, 0.78);
    setSemanticPosition(team.id, -1180 + point.x, -1020 + point.y);
  });

  // Runtime cluster remains compact beneath the center so it reads as a warm
  // accent inside the donut rather than breaking the outer ring.
  const operationDatabase = new Map();
  for (const edge of raw.edges) {
    if (nodeTypesById.get(edge.sourceId) === "OPERATION" && nodeTypesById.get(edge.targetId) === "DATABASE" && !operationDatabase.has(edge.sourceId)) {
      operationDatabase.set(edge.sourceId, edge.targetId);
    }
  }
  const databases = sortedType("DATABASE").sort((first, second) => (degree[second.id] || 0) - (degree[first.id] || 0));
  const databaseCenters = new Map();
  databases.forEach((database, index) => {
    const angle = index ? -Math.PI / 2 + ((index - 1) / Math.max(1, databases.length - 1)) * Math.PI * 2 : 0;
    const radius = index ? 390 : 0;
    const center = { x: 280 + Math.cos(angle) * radius, y: -2460 + Math.sin(angle) * radius * 0.62 };
    databaseCenters.set(database.id, center);
    setSemanticPosition(database.id, center.x, center.y);
  });
  const operationsByDatabase = new Map();
  for (const operation of sortedType("OPERATION")) {
    const databaseId = operationDatabase.get(operation.id) || "__runtime__";
    if (!operationsByDatabase.has(databaseId)) operationsByDatabase.set(databaseId, []);
    operationsByDatabase.get(databaseId).push(operation);
  }
  for (const [databaseId, operations] of operationsByDatabase) {
    const center = databaseCenters.get(databaseId) || { x: 520, y: -1870 };
    const phase = ((hash(databaseId) % 360) / 180) * Math.PI;
    operations.forEach((operation, index) => {
      const point = spiralPoint(index + 1, 13.4, phase, 0.86);
      setSemanticPosition(operation.id, center.x + point.x, center.y + point.y);
    });
  }
  sortedType("EVENT").forEach((event, index) => {
    const point = spiralPoint(index, 105, 0.4, 0.7);
    setSemanticPosition(event.id, 920 + point.x, -1900 + point.y);
  });

  // Supporting API metadata forms distinct concentric bands. Small gaps
  // between ranges are intentional and keep the donut layers readable.
  const placeTypeInAnnulus = (type, minRadius, maxRadius, phase) => {
    const items = sortedType(type);
    items.forEach((item, index) => {
      const fraction = (index + 0.5) / Math.max(1, items.length);
      const radius = Math.sqrt(minRadius ** 2 + fraction * (maxRadius ** 2 - minRadius ** 2));
      const angle = phase + index * goldenAngle;
      setSemanticPosition(item.id, Math.cos(angle) * radius, Math.sin(angle) * radius);
    });
  };
  placeTypeInAnnulus("QUERY-PARAMETER", 660, 880, -2.1);
  placeTypeInAnnulus("STATUS-CODE", 940, 1190, -0.9);
  placeTypeInAnnulus("PATH-PARAMETER", 1300, 1580, 1.25);
  placeTypeInAnnulus("HEADER", 1710, 1980, 0.2);
  sortedType("CONSUMER").forEach((consumer, index) => {
    const point = spiralPoint(index, 42, 2.4, 0.82);
    setSemanticPosition(consumer.id, -1080 + point.x, 210 + point.y);
  });
  const infrastructureTypes = ["HTTP-METHOD", "SECURITY", "EXPOSURE", "PCI", "PII", "GATEWAY", "MICROSERVICE", "WORKFLOW"];
  const infrastructureNodes = infrastructureTypes.flatMap((type) => sortedType(type));
  infrastructureNodes.forEach((node, index) => {
    const angle = index * goldenAngle + 0.8;
    const radius = 290 + 58 * Math.sqrt(index);
    setSemanticPosition(node.id, 380 + Math.cos(angle) * radius, -80 + Math.sin(angle) * radius);
  });

  const indexes = {};
  const nodes = raw.nodes.map((node) => {
    const type = node.type || "UNKNOWN";
    const layer = node.layer || "UNKNOWN";
    const index = indexes[type] || 0;
    indexes[type] = index + 1;
    const layerTypes = layers[layer] || [type];
    const rankWithinLayer = Math.max(0, layerTypes.indexOf(type));
    const fallbackAngle = (rankWithinLayer / Math.max(1, layerTypes.length)) * Math.PI * 2 - Math.PI / 2;
    const fallbackCenter = dynamicLayerColumn[layer] || 0;
    const [v1CenterX, v1CenterY, spread] = TYPE_LAYOUT[type] || [fallbackCenter + Math.cos(fallbackAngle) * 720, Math.sin(fallbackAngle) * 720, Math.max(180, Math.min(900, 130 + Math.sqrt(totals[type]) * 7))];
    const fraction = (index + 0.5) / totals[type];
    const seed = hash(node.id);
    const angle = index * 2.399963 + ((seed % 1000) / 1000) * 0.5;
    const radius = spread * 1.28 * Math.sqrt(fraction) * (0.82 + ((seed >>> 10) % 100) / 280);
    const fallbackPoint = spiralPoint(index, 24, fallbackAngle);
    const semanticPosition = semanticPositions.get(node.id) || { x: fallbackCenter + fallbackPoint.x, y: fallbackPoint.y };
    const semanticX = semanticPosition.x;
    const semanticY = semanticPosition.y;
    const v1X = v1CenterX * 1.16 + Math.cos(angle) * radius;
    const v1Y = v1CenterY * 1.08 + Math.sin(angle) * radius;
    const rank = dynamicTypeRank.get(type) || 0;
    const layerCenter = LAYER_COLUMN[layer] ?? dynamicLayerColumn[layer] ?? 0;
    const layerAngle = angle + rank * 0.31;
    const hierarchyX = layerCenter + Math.cos(layerAngle) * radius * 0.78;
    const hierarchyY = (rank - (dynamicTypeOrder.length - 1) / 2) * 220 + Math.sin(layerAngle) * radius * 0.48;
    const palette = TYPE_COLOR_OVERRIDES[type] || generatedPalette(type, layer);
    const darkColor = tint(palette[0], (seed % 19) - 9);
    const lightColor = tint(palette[1], (seed % 13) - 6);
    const oceanColor = tint(palette[2] || palette[0], (seed % 11) - 5);
    const sunsetColor = tint(palette[3] || palette[0], (seed % 11) - 5);

    return {
      key: node.id,
      attributes: {
        x: semanticX,
        y: semanticY,
        semanticX,
        semanticY,
        v1X,
        v1Y,
        hierarchyX,
        hierarchyY,
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
