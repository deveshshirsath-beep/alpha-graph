// Deterministic layouts for the three graph views. They run once when graph
// chunks are built, so the browser only reads the finished coordinates.
//
// Every layout works in "units": one unit is the gap between two neighbouring
// leaf entities. Each entity also gets a slot radius in the same units, which
// the renderer uses to cap node sizes so neighbours never overlap.
//
// Constellation Donut — clusters shaped after classic named graphs:
//   business area  → Golomb-style rosette (hub, domains, then capabilities)
//   teams          → Harries–Wong ring (one evenly spaced circle)
//   application    → rosette of Diamond-graph motifs (API · version · endpoint · operation)
//   runtime/infra  → Dürer-style wheel of evenly spaced hubs
//   parameters     → concentric dotted rings
//   schema         → Herschel-style rosette of its fields, packed in rows
// Constellation V1 — a flat galaxy disc: each type is a ring, each
//   application or business area owns an angular wedge across all rings.
// Organizational — stacked planes, one per entity type (small types share a
//   plane). Entities sit on each plane in concentric rings, wedge-ordered.

const TAU = Math.PI * 2;

function hash(input) {
  let result = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    result ^= input.charCodeAt(i);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

/** How many points fit on a circle with at least `spacing` between neighbours in a straight line. */
function ringCapacity(radius, spacing) {
  if (radius <= 0) return 1;
  return Math.max(1, Math.floor(Math.PI / Math.asin(Math.min(1, spacing / (2 * radius)))));
}

/** Hub in the middle, members on concentric rings; the outer ring is spread evenly. */
function rosette(count, spacing, firstRadius = spacing) {
  const points = [];
  let ring = 0;
  let radius = 0;
  while (points.length < count) {
    radius = firstRadius + ring * spacing;
    const capacity = ringCapacity(radius, spacing);
    const take = Math.min(capacity, count - points.length);
    const phase = ring % 2 ? Math.PI / take : 0;
    for (let index = 0; index < take; index += 1) {
      const angle = -Math.PI / 2 + phase + (index / take) * TAU;
      points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }
    ring += 1;
  }
  return { points, radius: count ? radius : 0 };
}

/**
 * Concentric dotted rows starting at innerRadius. Each row is evenly spaced,
 * including the last, so the band stays symmetric. Returns row positions in
 * item order plus the band's outer radius.
 */
function annulus(count, innerRadius, spacing) {
  const points = [];
  let row = 0;
  let radius = innerRadius;
  while (points.length < count) {
    radius = innerRadius + spacing * (row + 0.5);
    const capacity = ringCapacity(radius, spacing);
    const take = Math.min(capacity, count - points.length);
    const phase = row % 2 ? Math.PI / take : 0;
    for (let index = 0; index < take; index += 1) {
      const angle = -Math.PI / 2 + phase + (index / take) * TAU;
      points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, angle, radius });
    }
    row += 1;
  }
  return { points, outer: count ? radius + spacing * 0.5 : innerRadius };
}

/**
 * Places clusters around the centre in rows. A row takes clusters until its
 * circumference is used, then spreads any spare arc evenly so gaps match.
 * Clusters are sorted largest first so each row holds similar sizes.
 */
function clusterRows(clusters, innerRadius, gap, { singleRow = false } = {}) {
  if (!clusters.length) return innerRadius;
  if (clusters.length === 1 && innerRadius === 0) {
    clusters[0].x = 0;
    clusters[0].y = 0;
    return clusters[0].radius + gap;
  }
  const queue = singleRow ? clusters.slice() : clusters.slice().sort((a, b) => b.radius - a.radius || a.order - b.order);
  let start = innerRadius;
  let rowIndex = 0;
  while (queue.length) {
    const rowMax = singleRow ? Math.max(...queue.map((cluster) => cluster.radius)) : queue[0].radius;
    let center = start + rowMax;
    if (singleRow) {
      const needed = queue.reduce((sum, cluster) => sum + cluster.radius * 2 + gap, 0);
      center = Math.max(center, needed / TAU);
    }
    const capacity = TAU * center;
    const row = [];
    let used = 0;
    while (queue.length && (singleRow || used + queue[0].radius * 2 + gap <= capacity || !row.length)) {
      const cluster = queue.shift();
      row.push(cluster);
      used += cluster.radius * 2 + gap;
    }
    // Keep each row in structural order so neighbours stay related.
    row.sort((a, b) => a.order - b.order);
    const phase = -Math.PI / 2 + (rowIndex % 2 ? Math.PI / row.length : 0);
    const placeRow = () => {
      const stretch = TAU * center / used;
      let cursor = 0;
      for (const cluster of row) {
        const arc = (cluster.radius * 2 + gap) * stretch;
        const angle = phase + ((cursor + arc / 2) / (TAU * center)) * TAU;
        cluster.x = Math.cos(angle) * center;
        cluster.y = Math.sin(angle) * center;
        cursor += arc;
      }
    };
    // Spacing is measured along the arc, but neighbours are closer in a
    // straight line; on small rings, widen the ring until they clear.
    placeRow();
    const tooClose = () => row.length > 1 && row.some((cluster, index) => {
      const next = row[(index + 1) % row.length];
      return Math.hypot(cluster.x - next.x, cluster.y - next.y) < cluster.radius + next.radius + gap;
    });
    for (let attempt = 0; attempt < 40 && tooClose(); attempt += 1) {
      center *= 1.08;
      placeRow();
    }
    start = center + rowMax + gap;
    rowIndex += 1;
  }
  return start;
}

/**
 * Builds a parent/child tree from the structural relationships already used
 * elsewhere, and a depth-first order so every subtree is contiguous.
 */
function buildTree(nodes, nodeTypesById, structuralParents, typeRank) {
  const children = new Map();
  const roots = [];
  for (const node of nodes) {
    const parent = structuralParents.get(node.id);
    if (parent && parent !== node.id && nodeTypesById.has(parent)) {
      if (!children.has(parent)) children.set(parent, []);
      children.get(parent).push(node.id);
    } else roots.push(node.id);
  }
  const rank = (id) => typeRank.get(nodeTypesById.get(id)) ?? Number.MAX_SAFE_INTEGER;
  const byRankThenId = (a, b) => rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0);
  for (const list of children.values()) list.sort(byRankThenId);
  roots.sort(byRankThenId);
  const order = new Map();
  const rootOf = new Map();
  const visit = (start) => {
    const stack = [[start, start]];
    while (stack.length) {
      const [id, root] = stack.pop();
      if (order.has(id)) continue;
      order.set(id, order.size);
      rootOf.set(id, root);
      const list = children.get(id);
      if (list) for (let index = list.length - 1; index >= 0; index -= 1) stack.push([list[index], root]);
    }
  };
  for (const root of roots) visit(root);
  // Cycles have no root; start them from their smallest id so nothing is lost.
  for (const node of nodes.slice().sort((a, b) => (a.id < b.id ? -1 : 1))) if (!order.has(node.id)) visit(node.id);
  return { children, order, rootOf };
}

/** Constellation Donut: named-graph motifs arranged in rings, no overlaps. */
function donutLayout({ nodes, nodeTypesById, tree, typeRank }) {
  const place = new Map();
  const set = (id, x, y, slot) => place.set(id, { x, y, slot });
  const byOrder = (a, b) => tree.order.get(a) - tree.order.get(b);
  const idsOfType = (type) => nodes.filter((node) => node.type === type).map((node) => node.id).sort(byOrder);
  const has = (type) => nodes.some((node) => node.type === type);
  const descendants = (id, allowed) => {
    const result = [];
    const stack = [...(tree.children.get(id) || [])].reverse();
    while (stack.length) {
      const child = stack.pop();
      if (place.has(child) || !allowed.has(nodeTypesById.get(child))) continue;
      result.push(child);
      const list = tree.children.get(child);
      if (list) for (let index = list.length - 1; index >= 0; index -= 1) stack.push(list[index]);
    }
    return result;
  };
  const BAND_GAP = 6;
  let radius = 0;

  // 1. Business core — each area is a rosette: domains on the inner ring,
  //    service domains and capabilities on the outer rings.
  const businessMembers = new Set(["BUSINESS-DOMAIN", "SERVICE-DOMAIN", "BUSINESS-CAPABILITY"]);
  const areaClusters = idsOfType("BUSINESS-AREA").map((area) => {
    const members = descendants(area, businessMembers).sort((a, b) => (typeRank.get(nodeTypesById.get(a)) - typeRank.get(nodeTypesById.get(b))) || byOrder(a, b));
    const shape = rosette(members.length, 1.6, 4.2);
    return { hub: area, members, shape, radius: Math.max(3, shape.radius + 0.8), order: tree.order.get(area) };
  });
  if (areaClusters.length) {
    radius = clusterRows(areaClusters, 0, 2, { singleRow: areaClusters.length <= 16 });
    for (const cluster of areaClusters) {
      set(cluster.hub, cluster.x, cluster.y, cluster.members.length ? 3.2 : 2.4);
      cluster.members.forEach((id, index) => set(id, cluster.x + cluster.shape.points[index].x, cluster.y + cluster.shape.points[index].y, 0.8));
    }
    radius += BAND_GAP / 2;
  }

  // 2. Teams — one evenly spaced ring around the business core.
  const ringBand = (ids, spacing, slot = spacing / 2) => {
    const pending = ids.filter((id) => !place.has(id));
    if (!pending.length) return;
    const band = annulus(pending.length, radius, spacing);
    pending.forEach((id, index) => set(id, band.points[index].x, band.points[index].y, slot));
    radius = band.outer + BAND_GAP;
  };
  ringBand(idsOfType("TEAMS"), 2.2, 1);

  // 3. Applications — each is a rosette of diamonds. A diamond is one API
  //    (top) with its version (left), endpoint (right) and operations (bottom).
  const apiChain = new Set(["API-VERSION", "ENDPOINT", "OPERATION"]);
  const diamond = (apiId) => {
    const chain = descendants(apiId, apiChain);
    const version = chain.filter((id) => nodeTypesById.get(id) === "API-VERSION");
    const endpoint = chain.filter((id) => nodeTypesById.get(id) === "ENDPOINT");
    const operations = chain.filter((id) => nodeTypesById.get(id) === "OPERATION");
    const d = 0.9;
    // How far the diamond reaches from its centre, so wide ones get more room.
    const reach = Math.max(d, d + Math.max(version.length, endpoint.length) - 1, Math.hypot((operations.length - 1) / 2, d)) + 0.5;
    return { apiId, version, endpoint, operations, reach };
  };
  const diamondSpacing = (apis) => Math.max(2.9, ...apis.map((item) => item.reach * 2 + 0.05));
  const placeDiamond = (item, cx, cy) => {
    const d = 0.9;
    set(item.apiId, cx, cy + d, 0.45);
    item.version.forEach((id, index) => set(id, cx - d - index, cy, 0.45));
    item.endpoint.forEach((id, index) => set(id, cx + d + index, cy, 0.45));
    const count = item.operations.length;
    item.operations.forEach((id, index) => set(id, cx + (index - (count - 1) / 2), cy - d, 0.45));
  };
  if (has("APPLICATION") || has("API")) {
    const apiSet = new Set(["API"]);
    const appClusters = idsOfType("APPLICATION").map((app) => {
      const apis = descendants(app, apiSet).map(diamond);
      const spacing = diamondSpacing(apis);
      const shape = rosette(apis.length, spacing, spacing + 4.5);
      // The hub fills the space left inside the first ring of diamonds.
      const hubSlot = Math.max(2.4, spacing + 4.5 - Math.max(0, ...apis.map((item) => item.reach)) - 0.5);
      return { hub: app, apis, shape, hubSlot, radius: Math.max(4, shape.radius + spacing / 2), order: tree.order.get(app) };
    });
    const clustered = new Set(appClusters.flatMap((cluster) => cluster.apis.map((item) => item.apiId)));
    const orphanApis = idsOfType("API").filter((id) => !clustered.has(id));
    if (orphanApis.length) {
      const apis = orphanApis.map(diamond);
      const spacing = diamondSpacing(apis);
      const shape = rosette(apis.length, spacing, spacing);
      appClusters.push({ hub: null, apis, shape, radius: shape.radius + 1.6, order: Number.MAX_SAFE_INTEGER });
    }
    radius = clusterRows(appClusters, radius, 3, { singleRow: appClusters.length <= 8 });
    for (const cluster of appClusters) {
      if (cluster.hub) set(cluster.hub, cluster.x, cluster.y, cluster.hubSlot);
      cluster.apis.forEach((item, index) => placeDiamond(item, cluster.x + cluster.shape.points[index].x, cluster.y + cluster.shape.points[index].y));
    }
    radius += BAND_GAP;
  }

  // 4. Consumers, then runtime and infrastructure hubs as one wheel.
  ringBand(idsOfType("CONSUMER"), 2, 0.9);
  const hubTypes = ["DATABASE", "EVENT", "HTTP-METHOD", "SECURITY", "EXPOSURE", "PCI", "PII", "GATEWAY", "MICROSERVICE", "WORKFLOW"];
  ringBand(hubTypes.flatMap(idsOfType), 6, 2.6);

  // 5. Parameters and responses — concentric dotted rings.
  ringBand(idsOfType("QUERY-PARAMETER"), 1.2, 0.55);
  ringBand(idsOfType("PATH-PARAMETER"), 1.1, 0.5);
  ringBand(idsOfType("STATUS-CODE"), 1.1, 0.5);
  ringBand(idsOfType("HEADER"), 1, 0.48);
  ringBand(idsOfType("OPERATION"), 1, 0.48);

  // 6. Outer donut — each schema is a small rosette of its fields.
  if (has("SCHEMA")) {
    const fieldSet = new Set(["FIELD"]);
    const schemaClusters = idsOfType("SCHEMA").map((schema) => {
      const fields = descendants(schema, fieldSet);
      const shape = rosette(fields.length, 1, 1.4);
      return { hub: schema, fields, shape, radius: Math.max(0.8, shape.radius + 0.5), order: tree.order.get(schema) };
    });
    radius = clusterRows(schemaClusters, radius, 0.7);
    for (const cluster of schemaClusters) {
      set(cluster.hub, cluster.x, cluster.y, cluster.fields.length ? 0.7 : 0.5);
      cluster.fields.forEach((id, index) => set(id, cluster.x + cluster.shape.points[index].x, cluster.y + cluster.shape.points[index].y, 0.48));
    }
    radius += BAND_GAP / 2;
  }

  // 7. Anything left (orphans and types this layout does not know) gets its
  //    own dotted ring per type, in hierarchy order.
  const leftover = new Map();
  for (const node of nodes) {
    if (place.has(node.id)) continue;
    if (!leftover.has(node.type)) leftover.set(node.type, []);
    leftover.get(node.type).push(node.id);
  }
  const leftoverTypes = [...leftover.keys()].sort((a, b) => (typeRank.get(a) ?? 1e9) - (typeRank.get(b) ?? 1e9) || a.localeCompare(b));
  for (const type of leftoverTypes) {
    const ids = leftover.get(type).sort(byOrder);
    ringBand(ids, ids.length < 40 ? 3 : 1.2, ids.length < 40 ? 1.2 : 0.55);
  }
  return { place, radius };
}

// Constellation V1 is seen in perspective, so the disc gets a gentle wave
// field: a slow ripple plus a few peaks, like a surface the particles float on.
const WAVE_PEAKS = Array.from({ length: 9 }, (_, index) => {
  const angle = (index / 9) * TAU + 0.35;
  const radius = 560 + ((index * 37) % 10) * 30;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, height: 100 + ((index * 53) % 7) * 16 };
});

function waveHeight(x, y, seed) {
  const radius = Math.hypot(x, y);
  let height = 10 * Math.sin(radius / 26 + Math.atan2(y, x) * 3) * Math.min(1, radius / 300);
  for (const peak of WAVE_PEAKS) height += peak.height * Math.exp(-((x - peak.x) ** 2 + (y - peak.y) ** 2) / (2 * 55 ** 2));
  return height + ((seed >>> 20) % 9) - 4;
}

/** Constellation V1: a galaxy disc — each type a ring, each root a wedge. */
function galaxyLayout({ nodes, tree, typeRank, nodeTypesById }) {
  const place = new Map();
  // Each group of types is its own ring, with a clear gap before the next
  // one outward. The operations ring is kept thin so it shows as a bright line.
  const bands = {
    "BUSINESS-AREA": [0.02, 0.05], "BUSINESS-DOMAIN": [0.07, 0.1], "SERVICE-DOMAIN": [0.12, 0.15], "BUSINESS-CAPABILITY": [0.17, 0.21], TEAMS: [0.235, 0.25],
    "HTTP-METHOD": [0.275, 0.285], SECURITY: [0.275, 0.285], EXPOSURE: [0.275, 0.285], PCI: [0.275, 0.285], PII: [0.275, 0.285], GATEWAY: [0.275, 0.285], MICROSERVICE: [0.275, 0.285], WORKFLOW: [0.275, 0.285],
    APPLICATION: [0.31, 0.32], CONSUMER: [0.345, 0.36], API: [0.385, 0.405], "API-VERSION": [0.43, 0.45], ENDPOINT: [0.475, 0.495],
    OPERATION: [0.525, 0.535], DATABASE: [0.525, 0.535], EVENT: [0.525, 0.535],
    "QUERY-PARAMETER": [0.565, 0.575], "PATH-PARAMETER": [0.6, 0.62], "STATUS-CODE": [0.645, 0.67], HEADER: [0.7, 0.76],
    SCHEMA: [0.79, 0.82], FIELD: [0.85, 1],
  };
  const TWIST = 0.9;
  // Business and API trees each spread their preorder over the full circle,
  // so a root keeps the same wedge on every ring.
  const businessTypes = new Set(["BUSINESS-AREA", "BUSINESS-DOMAIN", "SERVICE-DOMAIN", "BUSINESS-CAPABILITY", "TEAMS"]);
  const groups = [nodes.filter((node) => businessTypes.has(node.type)), nodes.filter((node) => !businessTypes.has(node.type))];
  const unknownTypes = [...new Set(nodes.map((node) => node.type).filter((type) => !bands[type]))].sort((a, b) => (typeRank.get(a) ?? 1e9) - (typeRank.get(b) ?? 1e9) || a.localeCompare(b));
  unknownTypes.forEach((type, index) => {
    const start = 0.2 + (index / Math.max(1, unknownTypes.length)) * 0.8;
    bands[type] = [start, start + 0.7 / Math.max(1, unknownTypes.length)];
  });
  for (const group of groups) {
    const ordered = group.map((node) => node.id).sort((a, b) => tree.order.get(a) - tree.order.get(b));
    ordered.forEach((id, index) => {
      const seed = hash(id);
      const [inner, outer] = bands[nodeTypesById.get(id)];
      // Even spread by area within the band, then a gentle spiral twist so
      // each root's wedge curves like a galaxy arm.
      const fraction = inner + (outer - inner) * Math.sqrt(((seed >>> 10) % 1000) / 1000);
      const angle = -Math.PI / 2 + ((index + 0.5) / ordered.length) * TAU + (((seed % 1000) / 1000) - 0.5) * 0.03 + fraction * TWIST;
      const radius = fraction * 1000;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      place.set(id, { x, y, z: waveHeight(x, y, seed) });
    });
  }
  return { place };
}

/** Organizational: stacked planes. Small types share a plane with their neighbours. */
function planeLayout({ nodes, tree, typeRank, layerOrder, layers, labelForType }) {
  const counts = new Map();
  for (const node of nodes) counts.set(node.type, (counts.get(node.type) || 0) + 1);
  const minimum = Math.max(40, Math.min(600, Math.round(nodes.length * 0.004)));
  const planes = [];
  for (const layer of layerOrder) {
    let current = null;
    const layerPlanes = [];
    for (const type of layers[layer]) {
      if (!counts.get(type)) continue;
      if (!current) {
        current = { layer, types: [], count: 0 };
        layerPlanes.push(current);
      }
      current.types.push(type);
      current.count += counts.get(type);
      if (current.count >= minimum) current = null;
    }
    // A small remainder joins the plane before it rather than stand alone.
    const last = layerPlanes.at(-1);
    if (last && last.count < minimum && layerPlanes.length > 1) {
      layerPlanes.at(-2).types.push(...last.types);
      layerPlanes.at(-2).count += last.count;
      layerPlanes.pop();
    }
    planes.push(...layerPlanes);
  }
  const planeOfType = new Map();
  planes.forEach((plane, index) => {
    plane.index = index;
    plane.label = plane.types.length > 2 ? `${labelForType(plane.types[0])} + ${plane.types.length - 1} more` : plane.types.map(labelForType).join(" · ");
    for (const type of plane.types) planeOfType.set(type, index);
  });

  // Plane geometry, in graph units. Each plane is a square seen at an angle,
  // and planes stack in one vertical column. These are the zoomed-out tilt
  // values; the viewer opens the planes up as you zoom in (PLANE_LEVELS in main.js).
  const SHEAR = 0.32;
  const SQUASH = 0.34;
  const GAP = 220;
  // A plane's size follows how many entities it holds, on a log scale so the
  // largest plane is clearly bigger without dwarfing the rest.
  const MIN_HALF = 650;
  const MAX_HALF = 1700;
  const logCounts = planes.map((plane) => Math.log(Math.max(1, plane.count)));
  const lowest = Math.min(...logCounts);
  const highest = Math.max(...logCounts);
  const halfFor = (count) => (highest === lowest ? MAX_HALF : MIN_HALF + ((Math.log(Math.max(1, count)) - lowest) / (highest - lowest)) * (MAX_HALF - MIN_HALF));
  for (const plane of planes) plane.half = halfFor(plane.count);
  const stackHeight = planes.reduce((sum, plane) => sum + plane.half * 2 * SQUASH, 0) + GAP * Math.max(0, planes.length - 1);
  // Smallest stretch the angled view applies to any direction on the plane,
  // so projected neighbours keep their slots apart.
  const trace = 1 + SHEAR ** 2 + SQUASH ** 2;
  const determinant = SQUASH ** 2;
  const minStretch = Math.sqrt((trace - Math.sqrt(trace ** 2 - 4 * determinant)) / 2);
  const place = new Map();
  let cursor = stackHeight / 2;
  for (const plane of planes) {
    const HALF = plane.half;
    plane.cx = 0;
    plane.cy = cursor - HALF * SQUASH;
    cursor -= HALF * 2 * SQUASH + GAP;
    plane.shear = SHEAR;
    plane.squash = SQUASH;
    // Types stack from the centre outward: smallest counts in the middle.
    const bandTypes = plane.types.slice().sort((a, b) => counts.get(a) - counts.get(b) || (typeRank.get(a) ?? 0) - (typeRank.get(b) ?? 0));
    const total = plane.count;
    const disc = HALF * 0.86;
    const spacing = Math.min(HALF * 0.28, disc * Math.sqrt((Math.PI * 0.82) / Math.max(1, total + bandTypes.length * 12)));
    let inner = total === 1 ? 0 : spacing * 0.2;
    const local = [];
    for (const type of bandTypes) {
      const ids = nodes.filter((node) => node.type === type).map((node) => node.id).sort((a, b) => tree.order.get(a) - tree.order.get(b));
      if (ids.length === 1 && inner === 0) {
        local.push({ id: ids[0], u: 0, v: 0 });
        inner = spacing * 1.5;
        continue;
      }
      const band = annulus(ids.length, inner, spacing);
      // Order rows by angle so each tree root owns one wedge across the band.
      const slots = band.points.map((point, index) => ({ ...point, index })).sort((a, b) => a.angle - b.angle || a.radius - b.radius);
      ids.forEach((id, index) => local.push({ id, u: slots[index].x, v: slots[index].y }));
      inner = band.outer + spacing * 1.2;
    }
    const scale = Math.min(1, disc / Math.max(1, inner - spacing * 1.2));
    plane.spacing = spacing * scale;
    for (const item of local) {
      const u = item.u * scale;
      const v = item.v * scale;
      place.set(item.id, {
        plane: plane.index,
        x: plane.cx + u + v * SHEAR,
        y: plane.cy + v * SQUASH,
        flatX: plane.cx + u,
        flatY: plane.cy + v,
        slot: plane.spacing * 0.5 * minStretch,
        flatSlot: plane.spacing * 0.5,
      });
    }
  }
  const meta = planes.map(({ index, layer, types, count, label, cx, cy, half, shear, squash }) => ({ index, layer, types, count, label, cx, cy, half, shear, squash }));
  return { place, planes: meta, planeOfType };
}

export function computeLayouts({ nodes, nodeTypesById, structuralParents, typeRank, layerOrder, layers, labelForType }) {
  const tree = buildTree(nodes, nodeTypesById, structuralParents, typeRank);
  const donut = donutLayout({ nodes, nodeTypesById, tree, typeRank });
  const galaxy = galaxyLayout({ nodes, tree, typeRank, nodeTypesById });
  const planes = planeLayout({ nodes, tree, typeRank, layerOrder, layers, labelForType });
  // Scale the donut to the same overall size the viewer has always used.
  const donutScale = 3400 / Math.max(1, donut.radius);
  const result = new Map();
  for (const node of nodes) {
    const d = donut.place.get(node.id);
    const g = galaxy.place.get(node.id);
    const p = planes.place.get(node.id);
    result.set(node.id, {
      donutX: d.x * donutScale,
      donutY: d.y * donutScale,
      donutSlot: d.slot * donutScale,
      v1X: g.x * 3.4,
      v1Y: g.y * 3.4,
      v1Z: g.z * 3.4,
      hierarchyX: p.x,
      hierarchyY: p.y,
      hierarchySlot: p.slot,
      planeFlatX: p.flatX,
      planeFlatY: p.flatY,
      planeFlatSlot: p.flatSlot,
      plane: p.plane,
    });
  }
  return { positions: result, planes: planes.planes };
}
