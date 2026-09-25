import Graph from "graphology";
import Sigma from "sigma";
import { NodeGradientProgram } from "./rendering.js";
import { drawGraphNodeHover, graphLabelPalette } from "./graph-labels.js";
import { captureException, initializeObservability, startTimer, trackEvent } from "./observability.js";
import { escapeHtml, safeCssColor } from "./sanitize.js";
import { initializeUIControls, setButtonContent, syncDropdowns, icon } from "./ui-controls.js";
import { initializePanelResizing } from "./panel-resize.js";
import { initializePanelChrome } from "./panel-chrome.js";
import { connectPanelToggle } from "./panel-toggle.js";
import { workspaceFocus } from "./workspace-focus.js";
import { initializeTextSizeSettings, textScale } from "./text-size.js";
import { conditionReadiness, evaluateGraphConditions, traceGraphPaths } from "./graph-query.js";
import { entityTypeLabel, typeMark } from "./planner-entity-map.js";
import { attachTourButton, registerTour, setSelect, startTour, waitFor } from "./feature-tour.js";
import { registerAppTour } from "./app-tour.js";
import { PlannerSlotPicker } from "./planner-slot-picker.js";
import { createRangeSlider } from "./range-slider.js";
import { createThinkingOrb } from "./thinking-orb.js";
import "./fonts.css";
import "./styles.css";
import "./workspace-polish.css";
import "./text-size.css";
import "./query-planner.css";
import "./search-controls.css";
import "./panel-toggle.css";
import "./planner-landing.css";
import "./planner-sidebar.css";
import "./shell.css";
import "./planner-context.css";
import "./planner-chat.css";
import "./controls.css";
import "./explorer-panel.css";
import "./panel-resizer.css";
import "./feature-tour.css";
import "./graph-view.css";
import "./scale.css";
import "./query-planner.js";

initializeObservability({
  endpoint: import.meta.env.VITE_OBSERVABILITY_ENDPOINT || "",
  release: import.meta.env.VITE_RELEASE || "development",
});
let finishGraphLoadTimer = startTimer("graph_load");

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const formatNumber = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

const graph = new Graph({ type: "directed", multi: true, allowSelfLoops: true });
let renderer = null;
let graphMeta = null;
let dataWorker = null;
let applicationInitialized = false;
let activeViewRequestId = 0;
let loadedLayers = new Set();
const pendingViewRequests = new Map();
const searchIndexByType = new Map();
const loadedCatalogTypes = new Set();
const pendingCatalogRequests = new Map();
let activeCatalogRequestId = 0;
let graphRegistry = null;
let currentGraphId = "";
let searchDebounceTimer = null;
let toastTimer = null;
let selectedNode = null;
const CONNECTION_PAGE_SIZE = 25;
let visibleConnectionCount = CONNECTION_PAGE_SIZE;
let hoveredNode = null;
let focusedNeighborhood = null;
/** The answer snapshot the canvas was opened from, if it came from chat. */
let chatSnapshot = null;
/** Whether the canvas is filtered to a chat answer's entities, and entities waiting for the graph to finish loading. */
let snapshotFiltered = false;
let pendingSnapshotNodes = null;
let activeLayer = "BUSINESS";
let layerSelected = true;
let activeTheme = ["light", "dark", "ocean", "sunset"].includes(document.documentElement.dataset.theme) ? document.documentElement.dataset.theme : "light";
let edgeGlowContext = null;
let traversalEdges = null;
let conditionalNodes = null;
let conditionalEdges = null;
let currentLayout = "donut";
let layoutAnimation = null;
let minimapDirty = true;
const minimapBase = document.createElement("canvas");
const traversalSelections = new Set();
/** Names and types of traversal starts, which may come from the picker before their layer is loaded. */
const traversalMeta = new Map();
const traversalRange = { from: -2, to: 2 };
let traversalAutoRunTimer = 0;
let traversalRunId = 0;
/** Sigma's entity picker, the same one the chat composer uses, for traversal starts. */
const traversalPicker = new PlannerSlotPicker({
  getContext: () => ({ definitions: {}, meta: graphMeta }),
  loadEntities: async (type) => {
    await ensureCatalogTypes([type]);
    return (searchIndexByType.get(type) || []).map((item) => ({ id: item.id, name: item.name, type }));
  },
  onPick: (_anchor, entity) => addTraversalEntity(entity),
});
const expandedLayers = new Set();
const conditionalConditions = [];
let conditionRevision = 0;
let conditionalBusy = false;
let nextConditionId = 1;
const state = {
  nodeTypes: new Set(),
  edgeTypes: new Set(),
};

const DEFAULT_LAYERS = {
  BUSINESS: ["BUSINESS-AREA", "BUSINESS-DOMAIN", "SERVICE-DOMAIN", "BUSINESS-CAPABILITY", "TEAMS"],
  API: ["APPLICATION", "API", "API-VERSION", "ENDPOINT", "HTTP-METHOD", "SECURITY", "EXPOSURE", "PCI", "PII", "GATEWAY", "MICROSERVICE", "WORKFLOW", "QUERY-PARAMETER", "PATH-PARAMETER", "HEADER", "STATUS-CODE", "SCHEMA", "FIELD", "CONSUMER"],
  RUNTIME: ["OPERATION", "DATABASE", "EVENT"],
};
let LAYERS = DEFAULT_LAYERS;

const RECOMMENDED_RELATIONSHIP_RULES = [
  ["BUSINESS-AREA", "CONTAINS", "BUSINESS-DOMAIN"], ["BUSINESS-DOMAIN", "CONTAINS", "SERVICE-DOMAIN"],
  ["SERVICE-DOMAIN", "CONTAINS", "BUSINESS-CAPABILITY"], ["TEAMS", "OWNS", "BUSINESS-CAPABILITY"],
  ["APPLICATION", "IMPLEMENTS", "BUSINESS-CAPABILITY"], ["APPLICATION", "EXPOSES", "API"],
  ["API", "CONTAINS", "API-VERSION"], ["API-VERSION", "CONTAINS", "ENDPOINT"],
  ["ENDPOINT", "CONTAINS", "OPERATION"], ["OPERATION", "SUPPORTS", "HTTP-METHOD"],
  ["OPERATION", "IMPLEMENTS", "SECURITY"], ["OPERATION", "CLASSIFIED-AS", "PII"], ["OPERATION", "CLASSIFIED-AS", "PCI"],
  ["OPERATION", "HAS-EXPOSURE", "EXPOSURE"], ["OPERATION", "DEPLOYED-TO", "GATEWAY"],
  ["OPERATION", "DEPLOYED-TO", "MICROSERVICE"], ["OPERATION", "DEPLOYED-TO", "WORKFLOW"],
  ["OPERATION", "ACCEPTS", "HEADER"], ["OPERATION", "ACCEPTS", "PATH-PARAMETER"],
  ["OPERATION", "ACCEPTS", "QUERY-PARAMETER"], ["OPERATION", "ACCEPTS", "SCHEMA"],
  ["OPERATION", "RETURNS", "STATUS-CODE"], ["STATUS-CODE", "RETURNS", "SCHEMA"], ["STATUS-CODE", "RETURNS", "HEADER"],
  ["SCHEMA", "HAS-PROPERTY", "FIELD"], ["FIELD", "HAS-PROPERTY", "FIELD"],
  ["CONSUMER", "SUBSCRIBES", "OPERATION"], ["CONSUMER", "SUBSCRIBES", "API"],
  ["OPERATION", "READS-FROM", "DATABASE"], ["OPERATION", "CONNECTS-TO", "DATABASE"],
  ["OPERATION", "WRITES-TO", "DATABASE"], ["OPERATION", "UPDATES-TO", "DATABASE"], ["OPERATION", "DELETE-FROM", "DATABASE"],
  ["OPERATION", "PRODUCES", "EVENT"], ["EVENT", "CONSUMES", "EVENT"], ["EVENT", "READS-FROM", "DATABASE"],
  ["EVENT", "CONNECTS-TO", "DATABASE"], ["EVENT", "WRITES-TO", "DATABASE"], ["EVENT", "UPDATES-TO", "DATABASE"],
  ["EVENT", "DELETE-FROM", "DATABASE"], ["OPERATION", "ROUTES-TO", "OPERATION"], ["GATEWAY", "ROUTES-TO", "MICROSERVICE"],
];
let RELATIONSHIP_RULES = RECOMMENDED_RELATIONSHIP_RULES;

const OCEAN_COLORS = { BUSINESS: "#17c7c9", RUNTIME: "#00a8a8", API: "#348cff" };

// V2 uses a reference-inspired spectrum: citrus/green at the system edge,
// cool blues and violets through the API core, and warm runtime accents.
const V2_ENTITY_COLORS = {
  "BUSINESS-AREA": ["#63d86a", "#28783d", "#65d9c0", "#ffc65a"],
  "BUSINESS-DOMAIN": ["#7332d5", "#5730a1", "#4f8de5", "#b45eff"],
  "SERVICE-DOMAIN": ["#57ce67", "#2d8041", "#45c7a5", "#ff8a62"],
  "BUSINESS-CAPABILITY": ["#54c966", "#287744", "#39b998", "#ff657d"],
  TEAMS: ["#b129d8", "#7e3190", "#6b7cdd", "#dc55ef"],
  APPLICATION: ["#6422d6", "#5432ad", "#397be8", "#a04eff"],
  API: ["#199ee5", "#2466b6", "#19b8ea", "#7164ff"],
  "API-VERSION": ["#2ab9ee", "#277fad", "#22cadf", "#8e63ef"],
  ENDPOINT: ["#44d9d2", "#218d8d", "#36dbc3", "#d050c3"],
  "HTTP-METHOD": ["#5ee0d2", "#318c87", "#56e6cd", "#ee58a8"],
  SECURITY: ["#aeb7bb", "#687276", "#7ccfc4", "#ff6290"],
  EXPOSURE: ["#75d77e", "#3d8148", "#68d1aa", "#ff7773"],
  PCI: ["#d5db67", "#85872b", "#8fc79d", "#ff9360"],
  PII: ["#e0df6b", "#938b2f", "#9bcaa3", "#ffad5b"],
  GATEWAY: ["#aeb5b8", "#687075", "#5eb6c4", "#ffc05c"],
  MICROSERVICE: ["#89949a", "#5b676c", "#5caac5", "#ff8a63"],
  WORKFLOW: ["#768187", "#505b61", "#7188ce", "#ef6780"],
  "QUERY-PARAMETER": ["#50d4c0", "#2c8579", "#46c7b6", "#d561af"],
  "PATH-PARAMETER": ["#69cfe0", "#388394", "#4fafd0", "#b865dd"],
  HEADER: ["#78d46c", "#477c3e", "#52bf9e", "#d660c2"],
  "STATUS-CODE": ["#aab4b7", "#687375", "#58b7b0", "#e467a4"],
  SCHEMA: ["#4bd05d", "#287e3c", "#4dc69f", "#e75d94"],
  FIELD: ["#e3e46a", "#928d24", "#76c68f", "#f27678"],
  CONSUMER: ["#df27bf", "#9c317f", "#8a62c9", "#f18e5c"],
  OPERATION: ["#ed222f", "#ad2935", "#25bca9", "#ff5277"],
  DATABASE: ["#922924", "#702c2c", "#2ba78b", "#d84b94"],
  EVENT: ["#ff5050", "#b73b3b", "#68b76e", "#c966bf"],
};
const DENSE_ANCHOR_TYPES = new Set(["BUSINESS-AREA", "BUSINESS-DOMAIN", "APPLICATION", "API", "SCHEMA", "DATABASE", "EVENT"]);

const els = {
  search: $("#graph-search"),
  searchScope: $("#search-entity-type"),
  searchResults: $("#search-results"),
  typeFilters: $("#type-filters"),
  edgeFilters: $("#edge-filters"),
  conditionList: $("#condition-list"),
  conditionalStatus: $("#conditional-status"),
  loadingPanel: $("#loading-panel"),
  loadingLabel: $("#loading-label"),
  loadingProgress: $("#loading-progress"),
  loadingDetail: $("#loading-detail"),
  graphSelect: $("#graph-select"),
  inspector: $("#inspector"),
  emptyState: $("#empty-state"),
  toast: $("#toast"),
  stageHeader: $("#stage-header"),
  stageTitle: $("#stage-header-title"),
  stageSnapshot: $("#stage-snapshot"),
  stageBack: $("#stage-back"),
};

const ENTITY_LABELS = {
  "BUSINESS-AREA": "Business Area",
  "BUSINESS-DOMAIN": "Business Domain",
  "SERVICE-DOMAIN": "Service Domain",
  "BUSINESS-CAPABILITY": "Business Capability",
  TEAMS: "Teams",
  APPLICATION: "Application",
  API: "API",
  "API-VERSION": "API Version",
  ENDPOINT: "Endpoint",
  "HTTP-METHOD": "HTTP Method",
  SECURITY: "Security",
  EXPOSURE: "Exposure",
  PCI: "PCI",
  PII: "PII",
  GATEWAY: "Gateway",
  MICROSERVICE: "Microservice",
  WORKFLOW: "Workflow",
  "QUERY-PARAMETER": "Query Parameter",
  "PATH-PARAMETER": "Path Parameter",
  HEADER: "Header",
  "STATUS-CODE": "Status Code",
  SCHEMA: "Schema",
  FIELD: "Field",
  CONSUMER: "Consumer",
  OPERATION: "Operation",
  DATABASE: "Database",
  EVENT: "Event",
};
const LAYER_LABELS = { BUSINESS: "Business", API: "API", RUNTIME: "Runtime" };

/** Relationship names in the same Title Case the chat module gives entity types. */
function relationshipLabel(type) {
  return String(type || "").replaceAll("-", " ").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function layerLabel(layer) {
  return LAYER_LABELS[layer] || layer.replaceAll("-", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function layerForType(entityType) {
  return Object.entries(LAYERS).find(([, types]) => types.includes(entityType))?.[0] || activeLayer;
}

function layersForTypes(types) {
  return [...new Set([...types].map(layerForType))];
}

function sameLayerSet(first, second) {
  return first.size === second.size && [...first].every((layer) => second.has(layer));
}

function entityLabel(type) {
  return ENTITY_LABELS[type] || type.replaceAll("-", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pluralEntityLabel(type) {
  const label = entityLabel(type);
  if (["API", "PCI", "PII"].includes(type)) return `${label}s`;
  if (type === "TEAMS") return label;
  if (label.endsWith("y")) return `${label.slice(0, -1)}ies`;
  if (label.endsWith("s")) return label;
  return `${label}s`;
}

function sampleForType(type) {
  return searchIndexByType.get(type)?.[0] || graphMeta?.typeStyles?.[type] || { layer: layerForType(type), color: "#7068ff" };
}

function isNodeVisible(node, attributes = graph.getNodeAttributes(node)) {
  if (conditionalNodes) return conditionalNodes.has(node);
  if (!state.nodeTypes.has(attributes.entityType)) return false;
  if (focusedNeighborhood && !focusedNeighborhood.has(node)) return false;
  return true;
}

function isEdgeVisible(edge, attributes, source, target) {
  if (conditionalEdges && !conditionalEdges.has(edge)) return false;
  if (traversalEdges && !traversalEdges.has(edge)) return false;
  return state.edgeTypes.has(attributes.relationshipType) && isNodeVisible(source) && isNodeVisible(target);
}

function forEachVisibleCandidate(callback) {
  if (conditionalNodes) {
    for (const node of conditionalNodes) callback(node, graph.getNodeAttributes(node));
    return;
  }
  if (focusedNeighborhood) {
    for (const node of focusedNeighborhood) callback(node, graph.getNodeAttributes(node));
    return;
  }
  graph.forEachNode((node, attributes) => {
    if (state.nodeTypes.has(attributes.entityType)) callback(node, attributes);
  });
}

function nodeReducer(node, data) {
  const result = { ...data };
  result.color = themeColor(data);
  if (!isNodeVisible(node, data)) {
    result.hidden = true;
    return result;
  }

  // Pixel-sized nodes quickly merge into a solid mass at 50K+ entities.
  // Scale the overview marks with the loaded view, while keeping selected and
  // hovered nodes large enough to inspect.
  const denseAnchor = DENSE_ANCHOR_TYPES.has(data.entityType);
  const densityScale = graph.order > 50000 ? (denseAnchor ? 0.92 : 0.31) : graph.order > 12000 ? (denseAnchor ? 0.96 : 0.56) : graph.order > 4000 ? 0.76 : 1;
  result.size = Math.max(denseAnchor ? 2.5 : 0.66, data.size * densityScale);

  if (traversalSelections.has(node)) {
    result.size = Math.max(data.size * 1.65, 8);
    result.label = data.label;
    result.forceLabel = true;
    result.zIndex = 4;
  }

  if (selectedNode && !focusedNeighborhood) {
    const related = node === selectedNode || graph.hasEdge(node, selectedNode) || graph.hasEdge(selectedNode, node);
    if (!related) {
      result.color = activeTheme === "light" ? "#dbe1ee" : activeTheme === "sunset" ? "#302033" : "#142837";
      result.label = "";
      result.zIndex = 0;
    } else {
      result.zIndex = node === selectedNode ? 3 : 2;
      result.size = node === selectedNode ? Math.max(data.size * 1.8, 9) : data.size * 1.25;
      result.label = node === selectedNode ? data.label : "";
      result.forceLabel = node === selectedNode;
    }
  } else if (hoveredNode === node) {
    result.size = data.size * 1.5;
    result.label = data.label;
    result.forceLabel = true;
    result.zIndex = 2;
  }
  return result;
}

function edgeReducer(edge, data) {
  const source = graph.source(edge);
  const target = graph.target(edge);
  const result = { ...data };
  if (!isEdgeVisible(edge, data, source, target)) {
    result.hidden = true;
    return result;
  }

  if (traversalEdges) {
    result.hidden = true;
    result.zIndex = 2;
  } else if (selectedNode) {
    const connected = source === selectedNode || target === selectedNode;
    result.hidden = !connected;
    if (connected) {
      result.hidden = true;
      result.zIndex = 2;
    }
  } else {
    result.color = activeTheme === "light" ? "#e5e7ea" : activeTheme === "ocean" ? "#15343d" : activeTheme === "sunset" ? "#3b2632" : "#1d2024";
    result.size = graph.order > 50000 ? 0.16 : activeTheme === "light" ? 0.38 : 0.3;
  }
  return result;
}

function themeColor(attributes) {
  const palette = V2_ENTITY_COLORS[attributes.entityType || attributes.type];
  if (activeTheme === "light") return palette?.[1] || attributes.lightColor || attributes.color;
  if (activeTheme === "ocean") return palette?.[2] || attributes.oceanColor || OCEAN_COLORS[attributes.layer] || attributes.darkColor || attributes.color;
  if (activeTheme === "sunset") return palette?.[3] || attributes.sunsetColor || attributes.darkColor || attributes.color;
  return palette?.[0] || attributes.darkColor || attributes.color;
}

/** Sigma's segmented layout switch: the active option shows its name. */
function setLayoutSwitch(mode) {
  $$(".view-option").forEach((option) => {
    const active = option.dataset.layout === mode;
    option.classList.toggle("active", active);
    option.setAttribute("aria-checked", String(active));
  });
}

function changeVisualizationMode(mode) {
  setLayoutSwitch(mode);
  morphLayout(mode);
}

function edgeHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  return Math.abs(hash);
}

function drawConnectionGlow() {
  if (!renderer || !edgeGlowContext) return;
  const { width, height } = renderer.getDimensions();
  const context = edgeGlowContext;
  context.clearRect(0, 0, width, height);
  if (!selectedNode && !traversalEdges) return;

  let renderedEdges = 0;
  const candidateEdges = traversalEdges || (selectedNode ? new Set(graph.edges(selectedNode)) : new Set());
  for (const edge of candidateEdges) {
    if (renderedEdges >= 1200) break;
    const attrs = graph.getEdgeAttributes(edge);
    const source = graph.source(edge);
    const target = graph.target(edge);
    if (!isEdgeVisible(edge, attrs, source, target)) continue;
    renderedEdges += 1;
    const sourceData = renderer.getNodeDisplayData(source);
    const targetData = renderer.getNodeDisplayData(target);
    if (!sourceData || !targetData) continue;
    const start = renderer.framedGraphToViewport(sourceData);
    const end = renderer.framedGraphToViewport(targetData);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.max(Math.hypot(dx, dy), 1);
    const normalX = -dy / length;
    const normalY = dx / length;
    const seed = edgeHash(edge);
    const bend = Math.min(42, 10 + length * 0.065) * (seed % 2 ? 1 : -1);
    const control = { x: (start.x + end.x) / 2 + normalX * bend, y: (start.y + end.y) / 2 + normalY * bend };
    const sourceColor = themeColor(graph.getNodeAttributes(source));
    const targetColor = themeColor(graph.getNodeAttributes(target));
    const gradient = context.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, sourceColor);
    gradient.addColorStop(0.5, activeTheme === "light" ? "#6b4eff" : activeTheme === "sunset" ? "#ffd27a" : "#bdfcff");
    gradient.addColorStop(1, targetColor);

    context.save();
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.quadraticCurveTo(control.x, control.y, end.x, end.y);
    context.strokeStyle = gradient;
    context.globalAlpha = activeTheme === "light" ? 0.2 : 0.28;
    context.lineWidth = traversalEdges ? 5.5 : 8;
    context.shadowColor = targetColor;
    context.shadowBlur = activeTheme === "dark" ? 18 : 10;
    context.stroke();

    context.beginPath();
    context.moveTo(start.x, start.y);
    context.quadraticCurveTo(control.x, control.y, end.x, end.y);
    context.globalAlpha = 0.94;
    context.lineWidth = traversalEdges ? 1.65 : 2.25;
    context.shadowBlur = 7;
    context.stroke();

    const t = 0.83;
    const arrowX = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * control.x + t * t * end.x;
    const arrowY = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * control.y + t * t * end.y;
    const tangentX = 2 * (1 - t) * (control.x - start.x) + 2 * t * (end.x - control.x);
    const tangentY = 2 * (1 - t) * (control.y - start.y) + 2 * t * (end.y - control.y);
    const angle = Math.atan2(tangentY, tangentX);
    context.translate(arrowX, arrowY);
    context.rotate(angle);
    context.beginPath();
    context.moveTo(6, 0);
    context.lineTo(-4, -3.5);
    context.lineTo(-2, 0);
    context.lineTo(-4, 3.5);
    context.closePath();
    context.fillStyle = activeTheme === "light" ? "#6246e8" : activeTheme === "sunset" ? "#ffe0a3" : "#d8ffff";
    context.globalAlpha = 0.92;
    context.shadowBlur = 5;
    context.fill();
    context.restore();
  }
}

function setTheme(theme, persist = true) {
  activeTheme = ["light", "dark", "ocean", "sunset"].includes(theme) ? theme : "dark";
  document.documentElement.dataset.theme = activeTheme;
  if (persist) {
    try { localStorage.setItem("atlas-v2-theme", activeTheme); } catch { /* Preferences are optional. */ }
  }
  const themeSelect = /** @type {HTMLSelectElement} */ ($("#theme-select"));
  if (themeSelect.value !== activeTheme) { themeSelect.value = activeTheme; syncDropdowns(); }
  minimapDirty = true;
  if (renderer) {
    renderer.setSetting("labelColor", { color: graphLabelPalette(activeTheme).label });
    if (selectedNode) selectNode(selectedNode, false);
    else renderer.refresh();
  }
}

function setLoading(progress, label, detail) {
  els.loadingProgress.style.width = `${progress}%`;
  if (label) els.loadingLabel.textContent = label;
  if (detail) els.loadingDetail.textContent = detail;
}

function updateCounts() {
  let nodeCount = 0;
  const canUseCatalogCounts = !conditionalNodes && !focusedNeighborhood && !traversalEdges && graphMeta?.relationshipSchema;
  if (canUseCatalogCounts) {
    for (const type of state.nodeTypes) nodeCount += graphMeta.counts[type] || 0;
  } else if (conditionalNodes) {
    nodeCount = conditionalNodes.size;
  } else {
    graph.forEachNode((node, attrs) => {
      if (isNodeVisible(node, attrs)) nodeCount += 1;
    });
  }
  els.emptyState.hidden = nodeCount > 0;
  renderStageHeader();
}

/** A dataset's display name, as the picker shows it: "merged-graph-v4" reads "Merged graph v4". */
function datasetLabel(entry) {
  const name = String(entry?.name || entry?.id || "Graph");
  return /\s/.test(name) ? name : name.replaceAll("_", "-").split("-").filter(Boolean).join(" ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
}

/** The canvas header: which graph and snapshot this is, then what the canvas shows right now. */
function renderStageHeader() {
  const entry = graphRegistry?.graphs?.find((candidate) => candidate.id === currentGraphId);
  if (!entry) return;
  // The layers the canvas actually draws, whether picked from a layer tab or the entity tree.
  const layers = Object.keys(LAYERS).filter((layer) => LAYERS[layer].some((type) => state.nodeTypes.has(type)));
  const scope = layers.length === Object.keys(LAYERS).length ? "All layers" : layers.length ? `${layers.map(layerLabel).join(" + ")} layer${layers.length > 1 ? "s" : ""}` : "No layers";
  // Anything but the full graph as it first opens offers a way back to it.
  const atDefault = !chatSnapshot && scope === "All layers" && !conditionalNodes && !traversalEdges && !focusedNeighborhood;
  els.stageBack.hidden = atDefault;
  els.stageTitle.disabled = atDefault;
  els.stageTitle.title = atDefault ? "" : "Back to the full graph";
  els.stageHeader.hidden = false;
  els.stageTitle.textContent = datasetLabel(entry);
  syncSnapshotOptions(entry);
}

/** A snapshot's short code: its dataset id's hash, the same form the chat gives each answer's snapshot. */
function snapshotCode(entry) {
  const tail = String(entry?.id || "").match(/-([0-9a-f]{8})$/i)?.[1];
  if (tail) return tail.slice(0, 4).toUpperCase();
  let hash = 0;
  for (const letter of String(entry?.id || "")) hash = (hash * 31 + letter.charCodeAt(0)) >>> 0;
  return hash.toString(36).toUpperCase().slice(-4).padStart(4, "0");
}

/** The breadcrumb's snapshots: the chat answer's own while the canvas shows it, then every dataset snapshot with its date. */
function syncSnapshotOptions(entry) {
  const rows = graphRegistry.graphs.map((item) => {
    const captured = item.generatedAt ? new Date(item.generatedAt) : null;
    const day = captured && !Number.isNaN(captured.valueOf()) ? captured.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
    return [item.id, `Snapshot ${snapshotCode(item)}`, `${datasetLabel(item)}${day ? ` · captured ${day}` : ""}`];
  });
  if (chatSnapshot) rows.unshift([`chat:${chatSnapshot.code}`, `Snapshot ${chatSnapshot.code}`, `From chat${chatSnapshot.captured ? ` · captured ${chatSnapshot.captured}` : ""}`]);
  const key = JSON.stringify(rows);
  if (els.stageSnapshot.dataset.rows !== key) {
    els.stageSnapshot.dataset.rows = key;
    els.stageSnapshot.replaceChildren(...rows.map(([value, text, sub]) => {
      const option = new Option(text, value);
      option.dataset.sub = sub;
      return option;
    }));
  }
  const value = chatSnapshot ? `chat:${chatSnapshot.code}` : entry.id;
  if (els.stageSnapshot.value !== value) els.stageSnapshot.value = value;
  syncDropdowns();
}

/** Shows only a chat answer's entities and the relationships between them, fitted to the canvas. */
async function showSnapshotNodes(nodes) {
  if (!applicationInitialized) { pendingSnapshotNodes = nodes; return; }
  const graphId = currentGraphId;
  const layers = [...new Set(nodes.map((node) => layerForType(String(node.type || "").toUpperCase())))].filter((layer) => LAYERS[layer]);
  const loaded = await loadGraphView(layers.length ? layers : Object.keys(LAYERS));
  if (loaded.cancelled || loaded.error || graphId !== currentGraphId || !chatSnapshot) return;
  const present = new Set(nodes.map((node) => String(node.id)).filter((id) => graph.hasNode(id)));
  if (!present.size) { renderStageHeader(); return; }
  conditionalNodes = present;
  conditionalEdges = null;
  focusedNeighborhood = null;
  traversalEdges = null;
  snapshotFiltered = true;
  clearSelection(false);
  updateCounts();
  updateFilterUI();
  minimapDirty = true;
  renderer?.refresh();
  fitVisibleGraph();
}

/** Back to the graph as it first opens: every layer, no query, traversal, focus or selection, and no chat snapshot. */
async function resetGraphView() {
  chatSnapshot = null;
  snapshotFiltered = false;
  window.clearTimeout(traversalAutoRunTimer);
  traversalRunId += 1;
  traversalSelections.clear();
  traversalMeta.clear();
  $("#traversal-status").textContent = "";
  conditionalConditions.splice(0);
  conditionRevision += 1;
  renderConditionalFilters();
  updateTraversalUI();
  await showAllLayers();
}

function refresh() {
  updateCounts();
  minimapDirty = true;
  const stage = document.querySelector(".stage");
  stage?.classList.remove("filtering");
  requestAnimationFrame(() => stage?.classList.add("filtering"));
  renderer?.refresh();
  updateFilterUI();
}

/** @returns {Promise<{cancelled?: boolean, error?: string, empty?: boolean, cached?: boolean, layers?: string[]}>} */
function loadGraphView(layers) {
  const requested = new Set(layers.filter((layer) => LAYERS[layer]));
  if (!requested.size) return Promise.resolve({ empty: true });
  if (requested.size && sameLayerSet(requested, loadedLayers) && graph.order) return Promise.resolve({ cached: true });
  const requestId = ++activeViewRequestId;
  for (const [id, resolve] of pendingViewRequests) {
    if (id !== requestId) resolve({ cancelled: true });
  }
  pendingViewRequests.clear();
  document.querySelector(".stage")?.classList.add("data-loading");
  dataWorker.postMessage({ kind: "load-view", requestId, layers: [...requested] });
  return new Promise((resolve) => pendingViewRequests.set(requestId, resolve));
}

function ensureCatalogTypes(types) {
  const requested = [...new Set(types)].filter((type) => type && !loadedCatalogTypes.has(type));
  if (!requested.length) return Promise.resolve({ cached: true });
  const requestId = ++activeCatalogRequestId;
  dataWorker.postMessage({ kind: "load-catalog", requestId, types: requested });
  return new Promise((resolve) => pendingCatalogRequests.set(requestId, resolve));
}

function applyLayerDonutLayout(layer, shouldFit = true) {
  if (!renderer || !LAYERS[layer]?.length || !graph.order) return;
  if (layoutAnimation) cancelAnimationFrame(layoutAnimation);
  layoutAnimation = null;

  const groups = LAYERS[layer]
    .map((type) => ({
      type,
      nodes: graph.filterNodes((node, attributes) => attributes.layer === layer && attributes.entityType === type).sort((first, second) => first.localeCompare(second)),
    }))
    .filter((group) => group.nodes.length);
  const total = groups.reduce((sum, group) => sum + group.nodes.length, 0);
  if (!total) return;

  const outerRadius = Math.max(1250, Math.min(3600, 760 + Math.sqrt(total) * 9.2));
  const innerRadius = outerRadius * (groups.length > 10 ? 0.27 : 0.32);
  const minimumWeight = total * (groups.length > 10 ? 0.006 : 0.024);
  const weights = groups.map((group) => Math.max(group.nodes.length, minimumWeight));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  let cumulativeWeight = 0;

  groups.forEach((group, groupIndex) => {
    const startFraction = cumulativeWeight / totalWeight;
    cumulativeWeight += weights[groupIndex];
    const endFraction = cumulativeWeight / totalWeight;
    const rawInner = Math.sqrt(innerRadius ** 2 + startFraction * (outerRadius ** 2 - innerRadius ** 2));
    const rawOuter = Math.sqrt(innerRadius ** 2 + endFraction * (outerRadius ** 2 - innerRadius ** 2));
    const gap = Math.min((rawOuter - rawInner) * 0.2, outerRadius * 0.012);
    const bandInner = rawInner + gap;
    const bandOuter = Math.max(bandInner + 1, rawOuter - gap);
    const phase = ((edgeHash(`${layer}\u0000${group.type}`) % 360) / 180) * Math.PI;

    group.nodes.forEach((node, index) => {
      const attributes = graph.getNodeAttributes(node);
      const fraction = (index + 0.5) / group.nodes.length;
      const radius = Math.sqrt(bandInner ** 2 + fraction * (bandOuter ** 2 - bandInner ** 2));
      const angleJitter = ((edgeHash(node) % 101) - 50) / 1800;
      const angle = phase + index * goldenAngle + angleJitter;
      attributes.layerDonutX = Math.cos(angle) * radius;
      attributes.layerDonutY = Math.sin(angle) * radius;
      attributes.x = attributes.layerDonutX;
      attributes.y = attributes.layerDonutY;
    });
  });

  currentLayout = "donut";
  setLayoutSwitch("donut");
  const stage = document.querySelector(".stage");
  stage?.classList.add("layer-donut");
  stage?.setAttribute("data-active-layer", layer);
  minimapDirty = true;
  renderer.refresh();
  if (shouldFit) fitVisibleGraph();
}

/** Pressing the active layer again clears the selection, so the canvas shows every layer. */
async function toggleLayer(layer) {
  if (layerSelected && activeLayer === layer) return showAllLayers();
  return selectLayer(layer);
}

async function showAllLayers() {
  layerSelected = false;
  snapshotFiltered = false;
  focusedNeighborhood = null;
  traversalEdges = null;
  conditionalNodes = null;
  conditionalEdges = null;
  if (els.conditionalStatus) els.conditionalStatus.textContent = "";
  state.nodeTypes = new Set(Object.values(LAYERS).flat());
  $$(".layer-tab").forEach((button) => {
    button.classList.remove("active");
    button.setAttribute("aria-selected", "false");
  });
  renderEntityTree();
  clearSelection(false);
  await loadGraphView(Object.keys(LAYERS));
  updateCounts();
  updateFilterUI();
  fitVisibleGraph();
}

async function selectLayer(layer, shouldFit = true) {
  activeLayer = layer;
  layerSelected = true;
  focusedNeighborhood = null;
  traversalEdges = null;
  conditionalNodes = null;
  conditionalEdges = null;
  if (els.conditionalStatus) els.conditionalStatus.textContent = "";
  state.nodeTypes = new Set(LAYERS[layer]);
  $$(".layer-tab").forEach((button) => {
    const active = button.dataset.layer === layer;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  expandedLayers.add(layer);
  if (renderer) trackEvent("layer_selected", { layer, entityTypes: LAYERS[layer].length });
  renderEntityTree();
  clearSelection(false);
  if (dataWorker && (!sameLayerSet(new Set([layer]), loadedLayers) || !graph.order)) {
    await loadGraphView([layer]);
    applyLayerDonutLayout(layer, shouldFit);
    return;
  }
  applyLayerDonutLayout(layer, shouldFit);
  if (shouldFit && renderer) {
    updateCounts();
    updateFilterUI();
  } else {
    refresh();
  }
}

/** Mirrors a relationship row's checkbox into the eye button and the row's muted state. */
function syncRelationshipRow(row) {
  const input = row.querySelector("input");
  const eye = row.querySelector(".visibility-toggle");
  if (!input || !eye) return;
  eye.setAttribute("aria-pressed", String(input.checked));
  row.classList.toggle("is-muted", !input.checked);
}

/** Relationship rows and their paths, so hiding an entity type also hides the relationships that touch it. */
let relationshipGroups = [];

function syncRelationshipVisibility() {
  const visible = (type) => state.nodeTypes.has(type);
  for (const { group, paths } of relationshipGroups) {
    if (!paths.length) continue;
    let live = 0;
    for (const { line, source, target } of paths) {
      const shown = visible(source) && visible(target);
      line.hidden = !shown;
      if (shown) live += 1;
    }
    group.hidden = live === 0;
  }
}

function updateFilterUI() {
  $$("#type-filters input").forEach((input) => {
    input.checked = state.nodeTypes.has(input.value);
    const row = input.closest(".planner-type-row");
    if (row) syncRelationshipRow(row);
  });
  $$("#edge-filters input").forEach((input) => {
    input.checked = state.edgeTypes.has(input.value);
    const row = input.closest(".planner-type-row");
    if (row) syncRelationshipRow(row);
  });
  $$("#type-filters .entity-folder").forEach((folder) => {
    const types = LAYERS[folder.dataset.layer];
    const selected = types.filter((type) => state.nodeTypes.has(type)).length;
    folder.querySelector(".folder-selected").textContent = `${selected}/${types.length}`;
  });
  syncRelationshipVisibility();
}

function renderEntityTree() {
  els.typeFilters.classList.remove("skeleton-list");
  els.typeFilters.replaceChildren();
  for (const [layer, layerTypes] of Object.entries(LAYERS)) {
    const group = document.createElement("div");
    group.className = "entity-group";
    group.style.setProperty("--layer-color", themeColor(sampleForType(layerTypes[0]) || { layer, color: "#7068ff" }));
    const folder = document.createElement("button");
    folder.className = "entity-folder planner-type-row";
    folder.style.setProperty("--depth", "0");
    folder.dataset.layer = layer;
    folder.setAttribute("aria-expanded", String(expandedLayers.has(layer)));
    const folderToggle = document.createElement("span");
    folderToggle.className = "planner-type-toggle";
    folderToggle.append(icon("chevron"));
    const folderEntry = document.createElement("span");
    folderEntry.className = "planner-type-entry";
    const folderMark = document.createElement("span");
    folderMark.className = "folder-mark";
    folderMark.style.setProperty("--layer-color", themeColor(sampleForType(layerTypes[0]) || { layer, color: "#7068ff" }));
    folderMark.append(icon("stack"));
    const folderName = document.createElement("span");
    folderName.className = "planner-type-label";
    folderName.textContent = `${layerLabel(layer)} layer`;
    const folderCount = document.createElement("span");
    folderCount.className = "planner-type-count folder-selected";
    folderCount.textContent = String(layerTypes.length);
    folderEntry.append(folderMark, folderName, folderCount);
    folder.append(folderToggle, folderEntry);
    const children = document.createElement("div");
    children.className = "entity-children";
    children.hidden = !expandedLayers.has(layer);
    folder.addEventListener("click", () => {
      expandedLayers.has(layer) ? expandedLayers.delete(layer) : expandedLayers.add(layer);
      folder.setAttribute("aria-expanded", String(expandedLayers.has(layer)));
      children.hidden = !expandedLayers.has(layer);
    });
    group.append(folder, children);

    for (const type of layerTypes) {
      const count = graphMeta.counts[type] || 0;
      const label = document.createElement("div");
      label.className = "filter-item entity-leaf planner-type-row has-toggle";
      label.style.setProperty("--depth", "1");
      label.innerHTML = `<span class="planner-type-toggle"></span><span class="planner-type-entry"><input type="checkbox" value="${escapeHtml(type)}" tabindex="-1" aria-hidden="true"><span class="planner-type-label">${escapeHtml(entityTypeLabel(type))}</span><span class="planner-type-count">${formatNumber.format(count)}</span></span>`;
      const input = /** @type {HTMLInputElement} */ (label.querySelector("input"));
      input.after(typeMark(type, graphMeta));
      // The same eye as the relationship rows: it replaces the count on hover, and stays put while the type is hidden.
      const eye = document.createElement("button");
      eye.type = "button";
      eye.className = "visibility-toggle";
      eye.setAttribute("aria-label", `Show or hide ${entityTypeLabel(type)}`);
      eye.append(icon("eye"), icon("eye-slash"));
      label.append(eye);
      label.querySelector(".planner-type-entry").addEventListener("click", () => eye.click());
      eye.addEventListener("click", async () => {
        input.checked = !input.checked;
        input.checked ? state.nodeTypes.add(type) : state.nodeTypes.delete(type);
        focusedNeighborhood = null;
        traversalEdges = null;
        clearSelection(false);
        updateCounts();
        updateFilterUI();
        await loadGraphView(layersForTypes(state.nodeTypes));
        fitVisibleGraph();
      });
      children.append(label);
    }
    els.typeFilters.append(group);
  }
  updateFilterUI();
}

function renderLayerTabs() {
  const tabs = $("#layer-tabs");
  tabs.replaceChildren();
  tabs.style.setProperty('--layer-columns', String(Math.min(3, Math.max(1, Object.keys(LAYERS).length))));
  for (const [layer, types] of Object.entries(LAYERS)) {
    const count = types.reduce((sum, type) => sum + (graphMeta.counts[type] || 0), 0);
    const sample = sampleForType(types[0]);
    const button = document.createElement("button");
    const isActive = layerSelected && layer === activeLayer;
    button.className = `layer-tab${isActive ? " active" : ""}`;
    button.dataset.layer = layer;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(isActive));
    button.style.setProperty("--layer-color", themeColor(sample || { layer, color: "#7068ff" }));
    button.innerHTML = `<span class="layer-mark" aria-hidden="true"></span><span>${escapeHtml(layerLabel(layer))}</span><small>${formatNumber.format(count)}</small>`;
    // Choosing the active layer again is the undo: it clears filters back to that layer's own view.
    button.setAttribute("aria-label", isActive ? `Clear the ${layerLabel(layer)} layer filter` : `Show only the ${layerLabel(layer)} layer`);
    button.addEventListener("click", () => toggleLayer(layer));
    tabs.append(button);
  }
}

function makeFilters() {
  populateSearchScopes();
  renderLayerTabs();
  renderEntityTree();
  els.edgeFilters.replaceChildren();
  relationshipGroups = [];
  const recommendedTypes = RELATIONSHIP_RULES.map((rule) => rule[1]);
  const edgeTypes = [...new Set([...Object.keys(graphMeta.edgeCounts), ...recommendedTypes])]
    .map((type) => [type, graphMeta.edgeCounts[type] || 0])
    .sort((a, b) => b[1] - a[1]);
  const observedPaths = new Map((graphMeta.relationshipSchema || []).map((entry) => [`${entry.source}\u0000${entry.relationship}\u0000${entry.target}`, entry.count || 0]));
  for (const [index, [type, count]] of edgeTypes.entries()) {
    // Stable, distinct colors, with accessible contrast in every theme.
    const hue = Math.round(index * 137.508) % 360;
    const label = relationshipLabel(type);
    const paths = RELATIONSHIP_RULES.filter(([, relationship]) => relationship === type)
      .map(([source, , target]) => ({ source, target, count: observedPaths.get(`${source}\u0000${type}\u0000${target}`) || 0 }))
      .sort((first, second) => second.count - first.count);

    const group = document.createElement("div");
    group.className = "relationship-group";
    const row = document.createElement("div");
    row.className = "filter-item planner-type-row has-toggle";
    row.style.setProperty("--depth", "0");
    row.innerHTML = `<span class="planner-type-entry"><input type="checkbox" value="${escapeHtml(type)}"><span class="planner-type-mark relationship-dot" style="--mark-dark:hsl(${hue} 65% 66%);--mark-light:hsl(${hue} 65% 38%);--mark-ocean:hsl(${hue} 70% 62%);--mark-sunset:hsl(${hue} 75% 70%)"></span><span class="planner-type-label">${escapeHtml(label)}</span><span class="planner-type-count">${formatNumber.format(count)}</span></span>`;

    const paneId = `edge-paths-${index}`;
    const expander = document.createElement("button");
    expander.type = "button";
    expander.className = "planner-type-toggle";
    expander.setAttribute("aria-expanded", "false");
    expander.setAttribute("aria-controls", paneId);
    expander.setAttribute("aria-label", `Show the paths that use ${label}`);
    expander.disabled = !paths.length;
    expander.append(icon("chevron"));
    row.prepend(expander);

    // Sigma's eye: it replaces the count on hover, and stays put while the type is hidden.
    const input = /** @type {HTMLInputElement} */ (row.querySelector("input"));
    const eye = document.createElement("button");
    eye.type = "button";
    eye.className = "visibility-toggle";
    eye.setAttribute("aria-label", `Show or hide ${label} relationships`);
    eye.append(icon("eye"), icon("eye-slash"));
    eye.addEventListener("click", () => {
      input.checked = !input.checked;
      input.checked ? state.edgeTypes.add(type) : state.edgeTypes.delete(type);
      syncRelationshipRow(row);
      refresh();
    });
    row.append(eye);

    row.querySelector(".planner-type-entry").addEventListener("click", () => eye.click());

    const pane = document.createElement("div");
    pane.className = "relationship-paths";
    pane.id = paneId;
    pane.hidden = true;
    const entry = { group, paths: [] };
    relationshipGroups.push(entry);
    for (const path of paths) {
      const line = document.createElement("div");
      entry.paths.push({ line, source: path.source, target: path.target });
      line.className = "relationship-path planner-type-row";
      line.style.setProperty("--depth", "1");
      line.innerHTML = `<span class="planner-type-toggle"></span><span class="planner-type-entry"><span class="planner-type-label">${escapeHtml(entityTypeLabel(path.source))} \u2192 ${escapeHtml(entityTypeLabel(path.target))}</span><span class="planner-type-count">${formatNumber.format(path.count)}</span></span>`;
      pane.append(line);
    }
    expander.addEventListener("click", () => {
      const expanded = expander.getAttribute("aria-expanded") === "true";
      expander.setAttribute("aria-expanded", String(!expanded));
      pane.hidden = expanded;
    });

    group.append(row, pane);
    els.edgeFilters.append(group);
    syncRelationshipRow(row);
  }
  syncRelationshipVisibility();
  renderConditionalFilters();
}

function conditionTypeOptions(selectedType) {
  let html = '<option value="">Choose entity type…</option>';
  for (const [layer, types] of Object.entries(LAYERS)) {
    html += `<optgroup label="${escapeHtml(layerLabel(layer))} Layer">`;
    for (const type of types) html += `<option value="${escapeHtml(type)}"${type === selectedType ? " selected" : ""}>${escapeHtml(entityLabel(type))}</option>`;
    html += "</optgroup>";
  }
  return html;
}

function conditionRelationshipOptions(condition) {
  if (!condition.entityType) return '<option value="">Select an entity type first</option>';
  const outgoing = [];
  const incoming = [];
  RELATIONSHIP_RULES.forEach(([source, relationship, target], index) => {
    if (source === condition.entityType) outgoing.push(`<option value="out:${index}"${condition.ruleKey === `out:${index}` ? " selected" : ""}>${escapeHtml(relationshipLabel(relationship))} → ${escapeHtml(entityLabel(target))}</option>`);
    if (target === condition.entityType) incoming.push(`<option value="in:${index}"${condition.ruleKey === `in:${index}` ? " selected" : ""}>${escapeHtml(relationshipLabel(relationship))} ← ${escapeHtml(entityLabel(source))}</option>`);
  });
  let html = '<option value="">Choose relationship…</option>';
  if (outgoing.length) html += `<optgroup label="Outgoing">${outgoing.join("")}</optgroup>`;
  if (incoming.length) html += `<optgroup label="Incoming">${incoming.join("")}</optgroup>`;
  return html;
}

async function renderConditionSuggestions(condition, input, panel) {
  panel.replaceChildren();
  if (!condition.entityType) {
    panel.hidden = true;
    return;
  }
  await ensureCatalogTypes([condition.entityType]);
  if (!input.isConnected || !panel.isConnected || document.activeElement !== input) return;
  const query = input.value.trim().toLowerCase();
  const suggestions = [];
  let available = 0;
  for (const item of searchIndexByType.get(condition.entityType) || []) {
    if (query && !item.searchable.includes(query)) continue;
    available += 1;
    if (suggestions.length < 10) suggestions.push(item);
  }
  const heading = document.createElement("div");
  heading.className = "condition-suggestion-heading";
  heading.innerHTML = `<span>${escapeHtml(entityLabel(condition.entityType))} suggestions</span><small>${available.toLocaleString()} available</small>`;
  panel.append(heading);
  for (const item of suggestions) {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<i style="--node-color:${safeCssColor(themeColor(item))}"></i><span><b></b><small></small></span>`;
    button.querySelector("b").textContent = item.name;
    button.querySelector("small").textContent = item.id;
    button.addEventListener("click", () => {
      condition.nodeId = item.id;
      condition.entityName = item.name;
      input.value = item.name;
      input.classList.add("entity-selected");
      panel.hidden = true;
      updateConditionState(true);
      renderConditionalFilters();
    });
    panel.append(button);
  }
  if (!suggestions.length) {
    const empty = document.createElement("div");
    empty.className = "condition-suggestion-empty";
    empty.textContent = "No matching entities";
    panel.append(empty);
  }
  panel.hidden = false;
}

function updateConditionState(changed = false) {
  if (changed) {
    conditionRevision += 1;
    els.conditionalStatus.textContent = conditionalNodes ? "Draft changed. Run query to update the displayed result." : "";
  }
  const readiness = conditionReadiness(conditionalConditions);
  $("#condition-count").textContent = readiness.label;
  $("#apply-conditions").disabled = conditionalBusy || !readiness.canRun;
  $("#clear-conditions").disabled = !conditionalConditions.length && !conditionalNodes;
  syncDropdowns();
}

function renderConditionalFilters() {
  els.conditionList.replaceChildren();
  // Run and the status row belong to a section that has conditions; the description always stays.
  const empty = !conditionalConditions.length;
  $("#apply-conditions").hidden = empty;
  $(".conditional-section .status-row").hidden = empty;
  conditionalConditions.forEach((condition, index) => {
    const card = document.createElement("div");
    card.className = "condition-card";
    card.dataset.conditionId = condition.id;

    const header = document.createElement("div");
    header.className = "condition-card-header";
    if (index === 0) {
      header.innerHTML = `<span>Condition 1</span><button type="button" class="icon-button" aria-label="Remove condition" title="Remove condition"></button>`;
    } else {
      header.innerHTML = `<span>Condition ${index + 1}</span><select aria-label="Condition operator"><option value="AND"${condition.operator === "AND" ? " selected" : ""}>AND</option><option value="OR"${condition.operator === "OR" ? " selected" : ""}>OR</option></select><button type="button" class="icon-button" aria-label="Remove condition" title="Remove condition"></button>`;
      header.querySelector("select").addEventListener("change", (event) => { condition.operator = /** @type {HTMLSelectElement} */ (event.currentTarget).value; updateConditionState(true); });
    }
    const remove = header.querySelector("button");
    remove.append(icon("x"));
    remove.addEventListener("click", () => removeConditionalCondition(condition.id));

    const typeSelect = document.createElement("select");
    typeSelect.className = "condition-type";
    typeSelect.setAttribute("aria-label", "Condition entity type");
    typeSelect.innerHTML = conditionTypeOptions(condition.entityType);
    typeSelect.addEventListener("change", async (event) => {
      condition.entityType = /** @type {HTMLSelectElement} */ (event.currentTarget).value;
      condition.nodeId = "";
      condition.entityName = "";
      condition.ruleKey = "";
      updateConditionState(true);
      renderConditionalFilters();
      const nextCard = els.conditionList.querySelector(`[data-condition-id="${condition.id}"]`);
      const nextInput = nextCard?.querySelector(".condition-entity-input");
      const nextPanel = nextCard?.querySelector(".condition-suggestions");
      if (condition.entityType && nextInput && nextPanel) {
        nextInput.focus();
      }
    });

    const entityWrap = document.createElement("div");
    entityWrap.className = "condition-entity-wrap";
    const entityField = document.createElement("div");
    entityField.className = "condition-entity-field";
    entityField.append(icon("search"));
    const entityInput = document.createElement("input");
    entityInput.className = `condition-entity-input${condition.nodeId ? " entity-selected" : ""}`;
    entityInput.type = "search";
    entityInput.placeholder = condition.entityType ? `Choose ${entityLabel(condition.entityType)}…` : "Select an entity type first";
    entityInput.value = condition.entityName || "";
    entityInput.disabled = !condition.entityType;
    entityInput.setAttribute("aria-label", "Find a graph entity");
    const suggestionPanel = document.createElement("div");
    suggestionPanel.className = "condition-suggestions";
    suggestionPanel.hidden = true;
    entityInput.addEventListener("focus", () => renderConditionSuggestions(condition, entityInput, suggestionPanel));
    entityInput.addEventListener("input", () => {
      condition.nodeId = "";
      condition.entityName = entityInput.value;
      entityInput.classList.remove("entity-selected");
      updateConditionState(true);
      window.clearTimeout(condition.suggestionTimer);
      condition.suggestionTimer = window.setTimeout(() => renderConditionSuggestions(condition, entityInput, suggestionPanel), 110);
    });
    entityField.append(entityInput);
    entityWrap.append(entityField, suggestionPanel);

    const relationshipSelect = document.createElement("select");
    relationshipSelect.className = "condition-relationship";
    relationshipSelect.setAttribute("aria-label", "Condition relationship");
    relationshipSelect.disabled = !condition.entityType;
    relationshipSelect.innerHTML = conditionRelationshipOptions(condition);
    relationshipSelect.addEventListener("change", (event) => { condition.ruleKey = /** @type {HTMLSelectElement} */ (event.currentTarget).value; updateConditionState(true); });

    card.append(header, typeSelect, entityWrap, relationshipSelect);
    els.conditionList.append(card);
  });
  updateConditionState();
}

function addConditionalCondition() {
  conditionalConditions.push({ id: nextConditionId++, operator: "AND", entityType: "", nodeId: "", entityName: "", ruleKey: "" });
  updateConditionState(true);
  renderConditionalFilters();
  els.conditionList.lastElementChild?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function removeConditionalCondition(id) {
  const index = conditionalConditions.findIndex((condition) => condition.id === id);
  if (index >= 0) conditionalConditions.splice(index, 1);
  updateConditionState(true);
  renderConditionalFilters();
}

async function applyConditionalFilters() {
  if (conditionalBusy || !conditionReadiness(conditionalConditions).canRun) {
    els.conditionalStatus.textContent = "Complete the entity type, entity, and relationship in every condition.";
    return;
  }
  const revision = conditionRevision;
  const graphId = currentGraphId;
  const conditions = conditionalConditions.map(condition => ({ ...condition }));
  conditionalBusy = true;
  updateConditionState();
  try {
    const requiredLayers = new Set();
    for (const condition of conditions) {
      requiredLayers.add(layerForType(condition.entityType));
      const [, rawIndex] = condition.ruleKey.split(":");
      const [sourceType, , targetType] = RELATIONSHIP_RULES[Number(rawIndex)];
      requiredLayers.add(layerForType(sourceType));
      requiredLayers.add(layerForType(targetType));
    }
    els.conditionalStatus.textContent = "Loading required relationship layers…";
    const loaded = await loadGraphView([...requiredLayers]);
    if (revision !== conditionRevision || graphId !== currentGraphId || loaded.cancelled) return;
    if (loaded.error) throw new Error(loaded.error);
    const { nodes, edges, matches, relationships } = evaluateGraphConditions(graph, conditions, RELATIONSHIP_RULES);
    for (const relationship of relationships) state.edgeTypes.add(relationship);
    conditionalNodes = nodes;
    conditionalEdges = edges;
    snapshotFiltered = false;
    focusedNeighborhood = null;
    traversalEdges = null;
    clearSelection(false);
    els.conditionalStatus.textContent = `${matches.size.toLocaleString()} matching entities · ${edges.size.toLocaleString()} relationships`;
    trackEvent("conditional_filter_applied", { conditions: conditionalConditions.length, matchedNodes: matches.size, matchedEdges: edges.size });
    updateCounts();
    updateFilterUI();
    minimapDirty = true;
    fitVisibleGraph();
  } catch (error) {
    els.conditionalStatus.textContent = `Query could not run: ${error.message}`;
    captureException(error, { source: "query-builder" });
  } finally {
    conditionalBusy = false;
    updateConditionState();
  }
}

async function clearConditionalFilters() {
  conditionalNodes = null;
  conditionalEdges = null;
  conditionalConditions.splice(0);
  els.conditionalStatus.textContent = "";
  conditionRevision += 1;
  renderConditionalFilters();
  clearSelection(false);
  updateCounts();
  minimapDirty = true;
  await loadGraphView(layersForTypes(state.nodeTypes));
  refresh();
  fitVisibleGraph();
}

function fitVisibleGraph() {
  if (!renderer) return;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  forEachVisibleCandidate((node, attrs) => {
    minX = Math.min(minX, attrs.x);
    maxX = Math.max(maxX, attrs.x);
    minY = Math.min(minY, attrs.y);
    maxY = Math.max(maxY, attrs.y);
  });
  if (!Number.isFinite(minX)) {
    renderer.setCustomBBox(null);
    renderer.refresh();
    return;
  }
  const xPadding = Math.max((maxX - minX) * 0.08, 60);
  const yPadding = Math.max((maxY - minY) * 0.08, 60);
  renderer.setCustomBBox({ x: [minX - xPadding, maxX + xPadding], y: [minY - yPadding, maxY + yPadding] });
  minimapDirty = true;
  renderer.refresh();
  renderer.getCamera().animatedReset({ duration: 650 });
}

/** Moves the camera so a node sits in the middle of the canvas the entity sheet leaves visible. */
function revealNode(node, zoomIn = false) {
  const data = renderer?.getNodeDisplayData(node);
  if (!data) return;
  const camera = renderer.getCamera();
  const state = camera.getState();
  const ratio = zoomIn ? Math.min(state.ratio, 0.12) : state.ratio;
  const { width, height } = renderer.getDimensions();
  const canvas = $("#sigma-container").getBoundingClientRect();
  const sheet = els.inspector.classList.contains("open") ? els.inspector.getBoundingClientRect() : null;
  const covered = sheet && sheet.width ? Math.max(0, Math.min(canvas.right - sheet.left, canvas.width)) : 0;
  // Centred on the node the camera would show it mid-canvas; shifting by half the covered strip shows it mid-visible.
  const target = renderer.viewportToFramedGraph({ x: width / 2 + covered / 2, y: height / 2 }, { cameraState: { ...state, x: data.x, y: data.y, ratio } });
  camera.animate({ x: target.x, y: target.y, ratio }, { duration: 650 });
}

/** @param {string} node @param {boolean | "pan"} [moveCamera] true zooms in on the node, "pan" only brings it into view */
function selectNode(node, moveCamera = true) {
  if (!graph.hasNode(node) || !isNodeVisible(node)) return;
  if (selectedNode !== node) {
    visibleConnectionCount = CONNECTION_PAGE_SIZE;
    els.inspector.scrollTop = 0;
    const connectionRows = $("#connection-rows");
    if (connectionRows) connectionRows.scrollTop = 0;
  }
  selectedNode = node;
  const attrs = graph.getNodeAttributes(node);
  // The sheet lives in the query column and replaces the card, so the column must be open.
  queryPanelToggle?.setOpen(true, false, false);
  els.inspector.classList.add("open");
  els.inspector.setAttribute("aria-hidden", "false");
  const mark = $("#inspector-mark");
  mark.replaceChildren(icon("cube"));
  mark.style.color = themeColor(attrs);
  $("#inspector-type").textContent = sentenceLabel(attrs.entityType);
  $("#inspector-name").textContent = attrs.name;
  $("#inspector-name").title = attrs.name;
  updateTraversalUI();

  renderInspectorProperties(node, attrs);
  renderInspectorConnections(node);

  if (moveCamera) revealNode(node, moveCamera !== "pan");
  renderer.refresh();
}

function sentenceLabel(value) {
  const words = String(value).replaceAll("-", " ").replaceAll("_", " ").toLowerCase().trim();
  return words ? words[0].toUpperCase() + words.slice(1) : "";
}

function renderInspectorProperties(node, attrs) {
  const properties = $("#inspector-properties");
  const block = document.createElement("div");
  block.className = "entity-block";
  const label = document.createElement("div");
  label.className = "block-label";
  label.textContent = "Metadata";
  block.append(label);
  const rows = {
    Layer: sentenceLabel(attrs.layer),
    "Entity type": sentenceLabel(attrs.entityType),
    Importance: attrs.importance,
    Incoming: formatNumber.format(graph.inDegree(node)),
    Outgoing: formatNumber.format(graph.outDegree(node)),
    ...(attrs.properties || {}),
  };
  for (const [key, value] of Object.entries(rows)) {
    const row = document.createElement("div");
    row.className = "kv-row";
    row.innerHTML = `<span class="kv-key">${escapeHtml(sentenceLabel(key.replace(/([A-Z])/g, " $1")))}</span><span class="kv-values"></span>`;
    row.querySelector(".kv-values").textContent = typeof value === "object" ? JSON.stringify(value) : String(value);
    block.append(row);
  }
  const identity = document.createElement("div");
  identity.className = "entity-block";
  identity.innerHTML = `<div class="block-label">Identifier</div><p id="inspector-id" class="entity-id"></p>`;
  identity.querySelector("#inspector-id").textContent = node;
  properties.replaceChildren(block, identity);
}

function renderInspectorConnections(node) {
  const connections = $("#inspector-connections");
  const previousScrollTop = connections.querySelector(".connection-rows")?.scrollTop || 0;
  connections.replaceChildren();
  // Count unique connected entities, not edges: parallel edges must not inflate
  // the number of remaining rows. Render in batches for high-degree nodes.
  const neighbors = graph.neighbors(node);
  $("#inspector-related").textContent = `${formatNumber.format(neighbors.length)} related`;
  $("#relations-count").textContent = formatNumber.format(neighbors.length);
  const rows = document.createElement("div");
  rows.className = "connection-rows relation-rows";
  rows.id = "connection-rows";
  rows.tabIndex = 0;
  rows.setAttribute("role", "region");
  rows.setAttribute("aria-label", "Connected entities, scroll to browse");
  const status = document.createElement("p");
  status.className = "connection-pagination-status relation-more";
  status.setAttribute("role", "status");
  const more = document.createElement("button");
  more.type = "button";
  more.className = "more-connections link-button with-icon";
  more.setAttribute("aria-controls", rows.id);
  connections.append(rows, status, more);

  let rendered = 0;
  const appendPage = (limit, revealNew = false) => {
    const previousCount = rendered;
    const fragment = document.createDocumentFragment();
    let firstNewRow = null;
    while (rendered < Math.min(limit, neighbors.length)) {
      const neighbor = neighbors[rendered];
      const neighborAttrs = graph.getNodeAttributes(neighbor);
      const connectionEdges = graph.edges(node, neighbor);
      const descriptions = [...new Set(connectionEdges.map((edge) => {
        const direction = graph.source(edge) === node ? "→" : "←";
        return `${direction} ${sentenceLabel(graph.getEdgeAttribute(edge, "relationshipType"))}`;
      }))];
      const relationship = descriptions[0] || "RELATED TO";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "connection-row relation-row";
      button.innerHTML = `<span class="relation-name"></span><small class="relation-kind"></small>`;
      button.prepend(typeMark(String(neighborAttrs.type || ""), graphMeta));
      button.querySelector(".relation-name").textContent = neighborAttrs.name;
      button.querySelector(".relation-kind").textContent = `${relationship}${descriptions.length > 1 ? ` +${descriptions.length - 1}` : ""}`;
      button.title = `${neighborAttrs.name}\n${descriptions.join("\n")}\n${neighbor}`;
      button.addEventListener("click", () => selectNode(neighbor));
      if (!firstNewRow) firstNewRow = button;
      fragment.append(button);
      rendered += 1;
    }
    rows.append(fragment);
    visibleConnectionCount = Math.max(CONNECTION_PAGE_SIZE, rendered);
    const remaining = neighbors.length - rendered;
    status.textContent = neighbors.length ? (remaining ? `${rendered.toLocaleString()} of ${neighbors.length.toLocaleString()}` : "") : "No connected entities in the loaded graph.";
    more.hidden = remaining === 0;
    setButtonContent(more, "plus", `Show ${Math.min(CONNECTION_PAGE_SIZE, remaining)} more`);
    if (revealNew && previousCount && firstNewRow) {
      firstNewRow.focus({ preventScroll: true });
      rows.scrollTo({ top: firstNewRow.offsetTop, behavior: "smooth" });
    }
  };
  more.addEventListener("click", () => appendPage(rendered + CONNECTION_PAGE_SIZE, true));
  appendPage(visibleConnectionCount);
  rows.scrollTop = previousScrollTop;
}

function clearSelection(refreshRenderer = true) {
  selectedNode = null;
  els.inspector.classList.remove("open");
  els.inspector.setAttribute("aria-hidden", "true");
  if (refreshRenderer) renderer?.refresh();
}

function focusNeighborhood() {
  if (!selectedNode) return;
  focusedNeighborhood = new Set([selectedNode, ...graph.neighbors(selectedNode)]);
  updateCounts();
  updateFilterUI();
  fitVisibleGraph();
  showToast(`${focusedNeighborhood.size.toLocaleString()} connected entities in focus`);
}

/** A picked or selected entity as sigma's list row: mark, name, type, and a remove button on hover. */
function entityRow(meta, { detail, removeLabel, onRemove }) {
  const row = document.createElement("div");
  row.className = "entity-row";
  row.setAttribute("role", "listitem");
  row.title = meta.name;
  const text = document.createElement("span");
  text.className = "entity-row-text";
  const name = document.createElement("span");
  name.className = "entity-row-name";
  name.textContent = meta.name;
  const type = document.createElement("span");
  type.className = "entity-row-detail";
  type.textContent = detail;
  text.append(name, type);
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "icon-button entity-row-remove";
  remove.setAttribute("aria-label", removeLabel);
  remove.append(icon("x"));
  remove.addEventListener("click", onRemove);
  row.append(typeMark(meta.type, graphMeta), text, remove);
  return row;
}

function rangeLabel(from, to) {
  const hops = (count) => `${count} ${count === 1 ? "hop" : "hops"}`;
  const parts = [];
  if (from < 0) parts.push(`${hops(-from)} in`);
  if (to > 0) parts.push(`${hops(to)} out`);
  return parts.join(" · ") || "Starting entities only";
}

/** Distance from the starting entities: incoming hops to the left of the origin, outgoing to the right. */
function mountTraversalRange() {
  const host = $("#traversal-range");
  if (!host || host.childElementCount) return;
  const head = document.createElement("div");
  head.className = "range-head";
  const caption = document.createElement("span");
  caption.className = "range-caption";
  caption.textContent = "Distance";
  const readout = document.createElement("span");
  readout.className = "range-readout";
  head.append(caption, readout);
  const draw = ({ from, to }) => { readout.textContent = rangeLabel(from, to); };
  const slider = createRangeSlider({
    min: -4,
    max: 4,
    from: traversalRange.from,
    to: traversalRange.to,
    label: "Hops",
    origin: 0,
    scaleLabel: () => "",
    formatValue: (value) => (value === 0 ? "the starting entities" : `${Math.abs(value)} ${Math.abs(value) === 1 ? "hop" : "hops"} ${value < 0 ? "in" : "out"}`),
    onInput: draw,
    onChange: (range) => {
      draw(range);
      if (range.from === traversalRange.from && range.to === traversalRange.to) return;
      traversalRange.from = range.from;
      traversalRange.to = range.to;
      if (traversalSelections.size) scheduleTraversal(160);
    },
  });
  const legend = document.createElement("div");
  legend.className = "range-legend";
  legend.innerHTML = "<span>Incoming</span><span>Entity</span><span>Outgoing</span>";
  draw(traversalRange);
  host.replaceChildren(head, slider.element, legend);
}

function updateTraversalUI() {
  const list = $("#selection-chips");
  list.replaceChildren(...[...traversalSelections].map((node) => {
    const meta = traversalMeta.get(node) || { name: node, type: "" };
    return entityRow(meta, { detail: entityLabel(meta.type), removeLabel: `Remove ${meta.name} from traversal`, onRemove: () => toggleTraversalNode(node) });
  }));
  $("#traversal-footer").hidden = traversalSelections.size === 0;
  if (selectedNode) {
    const included = traversalSelections.has(selectedNode);
    setButtonContent($("#add-to-traversal"), included ? "check" : "plus", included ? "Added to traversal" : "Add to traversal");
    $("#add-to-traversal").classList.toggle("added", included);
    $("#add-to-traversal").setAttribute("aria-pressed", String(included));
  }
}

/** The traversal applies itself, as in sigma: it re-runs whenever its entities or distance change. */
function scheduleTraversal(delay = 0) {
  window.clearTimeout(traversalAutoRunTimer);
  if (traversalSelections.size) {
    traversalAutoRunTimer = window.setTimeout(runTraversal, delay);
    return;
  }
  traversalRunId += 1;
  $("#traversal-status").textContent = "";
  if (traversalEdges) {
    traversalEdges = null;
    focusedNeighborhood = null;
    selectLayer(activeLayer);
  } else refresh();
}

function addTraversalEntity(entity) {
  const id = String(entity.id);
  if (traversalSelections.has(id)) return;
  traversalSelections.add(id);
  traversalMeta.set(id, { name: String(entity.name || id), type: entity.type || "" });
  updateTraversalUI();
  scheduleTraversal();
}

function toggleTraversalNode(node) {
  if (traversalSelections.has(node)) {
    traversalSelections.delete(node);
    traversalMeta.delete(node);
  } else {
    if (!graph.hasNode(node)) return;
    const attrs = graph.getNodeAttributes(node);
    traversalSelections.add(node);
    traversalMeta.set(node, { name: attrs.name, type: attrs.entityType });
  }
  updateTraversalUI();
  scheduleTraversal(120);
}

async function runTraversal() {
  if (!traversalSelections.size) return;
  const runId = ++traversalRunId;
  const graphId = currentGraphId;
  const { from, to } = traversalRange;
  $("#traversal-status").textContent = "Tracing paths…";
  try {
    const loaded = await loadGraphView(Object.keys(LAYERS));
    if (runId !== traversalRunId || graphId !== currentGraphId || loaded.cancelled) return;
    if (loaded.error) throw new Error(loaded.error);
    conditionalNodes = null;
    conditionalEdges = null;
    els.conditionalStatus.textContent = "";
    const starts = [...traversalSelections].filter((node) => graph.hasNode(node));
    if (!starts.length) throw new Error("these entities aren't in this graph");
    const outward = to > 0 ? traceGraphPaths(graph, starts, "out", to, state.edgeTypes) : null;
    const inward = from < 0 ? traceGraphPaths(graph, starts, "in", -from, state.edgeTypes) : null;
    const nodes = new Set([...starts, ...(outward?.nodes || []), ...(inward?.nodes || [])]);
    const edges = new Set([...(outward?.edges || []), ...(inward?.edges || [])]);
    const truncated = Boolean(outward?.truncated || inward?.truncated);
    for (const node of nodes) state.nodeTypes.add(graph.getNodeAttribute(node, "entityType"));
    focusedNeighborhood = nodes;
    traversalEdges = edges;
    clearSelection(false);
    const reached = nodes.size - starts.length;
    $("#traversal-status").textContent = `${reached.toLocaleString()} ${reached === 1 ? "entity" : "entities"} within ${rangeLabel(from, to).toLowerCase()}${truncated ? " · limited to 5,000" : ""}`;
    trackEvent("traversal_completed", { from, to, startingNodes: starts.length, matchedNodes: reached, matchedEdges: edges.size, truncated });
    updateCounts();
    updateFilterUI();
    minimapDirty = true;
    fitVisibleGraph();
  } catch (error) {
    if (runId !== traversalRunId) return;
    $("#traversal-status").textContent = `Paths could not run: ${error.message}`;
    captureException(error, { source: "path-explorer" });
  } finally {
    updateTraversalUI();
    updateConditionState();
  }
}

function clearTraversal() {
  window.clearTimeout(traversalAutoRunTimer);
  traversalRunId += 1;
  traversalSelections.clear();
  traversalMeta.clear();
  traversalEdges = null;
  focusedNeighborhood = null;
  $("#traversal-status").textContent = "";
  updateTraversalUI();
  selectLayer(activeLayer);
}

function morphLayout(mode) {
  if (!renderer || mode === currentLayout) return;
  if (layoutAnimation) cancelAnimationFrame(layoutAnimation);
  const useLayerDonut = mode === "donut" && loadedLayers.size === 1 && loadedLayers.has(activeLayer);
  const targetPrefix = mode === "hierarchy" ? "hierarchy" : mode === "constellation-v1" ? "v1" : useLayerDonut ? "layerDonut" : "semantic";
  const stage = document.querySelector(".stage");
  stage?.classList.toggle("layer-donut", useLayerDonut);
  const items = [];
  graph.forEachNode((node, attrs) => {
    const targetX = Number.isFinite(attrs[`${targetPrefix}X`]) ? attrs[`${targetPrefix}X`] : attrs.semanticX;
    const targetY = Number.isFinite(attrs[`${targetPrefix}Y`]) ? attrs[`${targetPrefix}Y`] : attrs.semanticY;
    if (isNodeVisible(node, attrs)) items.push({ node, attrs, startX: attrs.x, startY: attrs.y, targetX, targetY });
    else {
      attrs.x = targetX;
      attrs.y = targetY;
    }
  });
  currentLayout = mode;
  const duration = items.length > 20000 ? 360 : 650;
  const start = performance.now();
  stage?.classList.add("layout-morphing");
  const tick = (time) => {
    const raw = Math.min(1, (time - start) / duration);
    const eased = 1 - Math.pow(1 - raw, 3);
    for (const item of items) {
      item.attrs.x = item.startX + (item.targetX - item.startX) * eased;
      item.attrs.y = item.startY + (item.targetY - item.startY) * eased;
    }
    renderer.refresh({ skipIndexation: true, partialGraph: { nodes: items.map((item) => item.node) } });
    if (raw < 1) layoutAnimation = requestAnimationFrame(tick);
    else {
      layoutAnimation = null;
      stage?.classList.remove("layout-morphing");
      minimapDirty = true;
      fitVisibleGraph();
    }
  };
  layoutAnimation = requestAnimationFrame(tick);
}

function drawMinimap() {
  if (!renderer) return;
  const canvas = $("#minimap-canvas");
  const context = canvas.getContext("2d");
  const width = 190;
  const height = 110;
  if (minimapBase.width !== 380) {
    minimapBase.width = 380;
    minimapBase.height = 220;
  }
  if (minimapDirty) {
    const base = minimapBase.getContext("2d");
    base.setTransform(2, 0, 0, 2, 0, 0);
    base.clearRect(0, 0, width, height);
    const paths = new Map();
    const samples = new Map();
    forEachVisibleCandidate((node, attrs) => {
      const data = renderer.getNodeDisplayData(node);
      if (!data) return;
      if (!paths.has(attrs.entityType)) paths.set(attrs.entityType, new Path2D());
      paths.get(attrs.entityType).rect(data.x * width, (1 - data.y) * height, 1.35, 1.35);
      if (!samples.has(attrs.entityType)) samples.set(attrs.entityType, attrs);
    });
    for (const [type, path] of paths) {
      base.fillStyle = themeColor(samples.get(type));
      base.globalAlpha = 0.72;
      base.fill(path);
    }
    minimapDirty = false;
  }
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(minimapBase, 0, 0);
  const topLeft = renderer.viewportToFramedGraph({ x: 0, y: 0 });
  const bottomRight = renderer.viewportToFramedGraph(renderer.getDimensions());
  const x = Math.min(topLeft.x, bottomRight.x) * canvas.width;
  const y = (1 - Math.max(topLeft.y, bottomRight.y)) * canvas.height;
  const rectWidth = Math.abs(bottomRight.x - topLeft.x) * canvas.width;
  const rectHeight = Math.abs(bottomRight.y - topLeft.y) * canvas.height;
  context.strokeStyle = activeTheme === "light" ? "#5d4be0" : "#d9ffff";
  context.lineWidth = 2;
  context.strokeRect(x, y, rectWidth, rectHeight);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function populateSearchScopes() {
  els.searchScope.replaceChildren();
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "All types";
  els.searchScope.append(allOption);
  for (const [layer, types] of Object.entries(LAYERS)) {
    const group = document.createElement("optgroup");
    group.label = `${layerLabel(layer)} Layer`;
    for (const type of types) {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = `${entityLabel(type)} · ${formatNumber.format(graphMeta.counts[type] || 0)}`;
      group.append(option);
    }
    els.searchScope.append(group);
  }
}

function renderSearchDiscovery() {
  els.searchResults.replaceChildren();
  const heading = document.createElement("div");
  heading.className = "search-result-heading";
  heading.innerHTML = "<span>Choose an entity type</span>";
  els.searchResults.append(heading);
  for (const [layer, types] of Object.entries(LAYERS)) {
    const layerHeading = document.createElement("div");
    layerHeading.className = "search-layer-heading";
    layerHeading.textContent = `${layerLabel(layer)} Layer`;
    els.searchResults.append(layerHeading);
    for (const type of types) {
      const sample = sampleForType(type);
      const button = document.createElement("button");
      button.className = "search-type-suggestion";
      button.innerHTML = `<i style="--node-color:${safeCssColor(themeColor(sample || { layer }))}"></i><span>${escapeHtml(entityLabel(type))}</span><small>${formatNumber.format(graphMeta.counts[type] || 0)}</small>`;
      button.addEventListener("click", async () => {
        els.searchScope.value = type;
        syncDropdowns();
        els.search.value = "";
        els.search.placeholder = `Search ${pluralEntityLabel(type).toLowerCase()}`;
        await ensureCatalogTypes([type]);
        handleSearch("");
        els.search.focus();
      });
      els.searchResults.append(button);
    }
  }
  els.searchResults.hidden = false;
}

function handleSearch(query) {
  const normalized = query.trim().toLowerCase();
  const selectedType = els.searchScope.value;
  if (!selectedType) {
    renderSearchDiscovery();
    return;
  }
  const terms = normalized.split(/\s+/);
  const rankedMatches = Array.from({ length: 5 }, () => []);
  let totalMatches = 0;
  const candidates = searchIndexByType.get(selectedType) || [];
  for (const item of candidates) {
    if (!normalized || terms.every((term) => item.searchable.includes(term))) {
      totalMatches += 1;
      const name = item.name.toLowerCase();
      const score = !normalized ? 0
        : name === normalized ? 4
          : name.startsWith(normalized) ? 3
            : name.includes(normalized) ? 2
              : terms.every((term) => name.includes(term)) ? 1 : 0;
      if (rankedMatches[score].length < 30) rankedMatches[score].push(item);
    }
  }
  const matches = rankedMatches
    .map((bucket) => bucket.sort((first, second) => first.name.localeCompare(second.name)))
    .reverse()
    .flat()
    .slice(0, 30);
  els.searchResults.replaceChildren();
  const heading = document.createElement("div");
  heading.className = "search-result-heading";
  const context = selectedType ? entityLabel(selectedType) : "All entities";
  heading.innerHTML = `<span>${normalized ? "Search results" : `${escapeHtml(context)} suggestions`}</span><small>${totalMatches.toLocaleString()} available</small>`;
  els.searchResults.append(heading);
  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "result-empty";
    empty.textContent = `No matching ${selectedType ? pluralEntityLabel(selectedType).toLowerCase() : "entities"}`;
    els.searchResults.append(empty);
  }
  for (const item of matches) {
    const button = document.createElement("button");
    button.className = "search-result";
    button.innerHTML = `<i style="--node-color:${safeCssColor(themeColor(item))}"></i><span><b></b><small></small></span><em>${escapeHtml(item.layer)}</em>`;
    button.querySelector("b").textContent = item.name;
    button.querySelector("small").textContent = `${entityLabel(item.type)} · ${item.id}`;
    button.title = `${item.name} · ${item.id}`;
    button.addEventListener("click", async () => {
      conditionalNodes = null;
      conditionalEdges = null;
      els.conditionalStatus.textContent = "";
      await selectLayer(item.layer, false);
      state.nodeTypes.add(item.type);
      focusedNeighborhood = null;
      updateCounts();
      updateFilterUI();
      fitVisibleGraph();
      selectNode(item.id);
      trackEvent("search_result_selected", { entityType: item.type, layer: item.layer });
      els.searchResults.hidden = true;
      els.search.blur();
    });
    els.searchResults.append(button);
  }
  if (totalMatches > matches.length) {
    const more = document.createElement("div");
    more.className = "search-result-more";
    more.textContent = `Showing the first ${matches.length} of ${totalMatches.toLocaleString()} · type to narrow the list`;
    els.searchResults.append(more);
  }
  els.searchResults.hidden = false;
}

/** Entities and Relationships are the explorer panel's two tabs, with arrow keys between them. */
function wireExplorerTabs(selector = ".explorer-tab") {
  const tabs = /** @type {HTMLButtonElement[]} */ ($$(selector));
  const select = (tab) => {
    for (const item of tabs) {
      const active = item === tab;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
      $(`#${item.getAttribute("aria-controls")}`).hidden = !active;
    }
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const next = tabs[(index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  });
}


/** Presses a slider thumb's arrow key, so a walkthrough moves the real control. */
function nudgeThumb(name, presses, key = "ArrowRight") {
  const thumb = $(`.range-thumb[data-thumb="${name}"]`);
  if (!thumb) return;
  for (let press = 0; press < presses; press += 1) {
    thumb.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  }
}

const firstCard = () => els.conditionList?.querySelector(".condition-card");
const entityOption = () => [...document.querySelectorAll(".slot-picker-option")]
  .find((option) => option.querySelector(".slot-picker-option-description")) || null;

/** The two graph-panel walkthroughs: they drive the real controls, one value per step. */
function registerGraphTours() {
  registerTour("query-builder", {
    title: "Query builder",
    steps: [
      {
        text: "Every filter starts as a condition. Adding one gives you an empty row to fill in.",
        target: () => $("#add-condition"),
        run: () => { $("#add-condition")?.click(); },
        settle: 200,
      },
      {
        text: "First pick the entity type the condition is about — we've chosen the first type this graph has.",
        target: () => firstCard()?.querySelector(".select-control") || firstCard(),
        run: async () => {
          const select = /** @type {HTMLSelectElement | null} */ (await waitFor(() => firstCard()?.querySelector(".condition-type")));
          setSelect(select, "");
        },
        settle: 300,
      },
      {
        text: "Then choose the relationship to follow from that type. Together they read as one sentence.",
        target: () => firstCard()?.querySelectorAll(".select-control")[1] || firstCard(),
        run: async () => {
          const select = /** @type {HTMLSelectElement | null} */ (await waitFor(() => {
            const candidate = firstCard()?.querySelector(".condition-relationship");
            return candidate && !candidate.disabled ? candidate : null;
          }));
          setSelect(select, "");
        },
        settle: 250,
      },
      {
        text: "Run it. The canvas drops everything the condition doesn't match.",
        target: () => $("#apply-conditions"),
        run: () => { const run = $("#apply-conditions"); if (run && !run.disabled) run.click(); },
        settle: 700,
      },
      {
        text: "Clear puts the whole graph back. Add more conditions to narrow further — AND keeps only what matches both, OR adds alternatives.",
        target: () => $("#clear-conditions"),
      },
    ],
  });

  registerTour("traversal", {
    title: "Traversal",
    steps: [
      {
        text: "Traversal follows relationships out from entities you choose. This opens the entity picker.",
        target: () => $("#add-traversal-entity"),
        run: () => { const add = $("#add-traversal-entity"); if (add && !add.disabled) add.click(); },
        settle: 350,
      },
      {
        text: "Pick any entity and it becomes a starting point. Shift-clicking a node on the canvas does the same thing.",
        target: () => entityOption() || document.querySelector(".slot-picker-option") || $("#selection-chips")?.firstElementChild,
        run: async () => {
          // The picker opens on entity types; an entity row is the one carrying its id.
          let option = /** @type {HTMLElement | null} */ (await waitFor(entityOption, 1200));
          if (!option) {
            /** @type {HTMLElement | null} */ (document.querySelector(".slot-picker-option"))?.click();
            option = /** @type {HTMLElement | null} */ (await waitFor(entityOption, 1800));
          }
          option?.click();
        },
        settle: 500,
      },
      {
        text: "Now set how far to trace. The right thumb follows outgoing relationships, the left one incoming — we've gone two hops out.",
        target: () => $(".range-track"),
        run: () => nudgeThumb("to", 2),
        settle: 600,
      },
      {
        text: "The canvas keeps only the paths within that distance. Clear resets the trace and gives you the full graph back.",
        target: () => $("#traversal-footer")?.hidden ? $("#traversal-range") : $("#traversal-footer"),
      },
    ],
  });

  attachTourButton($("#query-heading")?.parentElement, "query-builder", "the query builder");
  attachTourButton($("#traversal-heading")?.parentElement, "traversal", "traversal");
}

function wireControls() {
  $$("button, input, select").forEach((element) => { element.disabled = false; });
  registerGraphTours();
  $("#reset-view")?.addEventListener("click", () => selectLayer(activeLayer));
  $("#empty-reset").addEventListener("click", () => selectLayer(activeLayer));
  $("#add-condition").addEventListener("click", addConditionalCondition);
  $("#apply-conditions").addEventListener("click", applyConditionalFilters);
  $("#clear-conditions").addEventListener("click", clearConditionalFilters);
  wireExplorerTabs();
  wireExplorerTabs(".entity-tab");
  $("#zoom-in").addEventListener("click", () => renderer.getCamera().animatedZoom({ duration: 250 }));
  $("#zoom-out").addEventListener("click", () => renderer.getCamera().animatedUnzoom({ duration: 250 }));
  $("#zoom-fit").addEventListener("click", fitVisibleGraph);
  $("#close-inspector").addEventListener("click", () => clearSelection());
  $("#focus-neighbors").addEventListener("click", focusNeighborhood);
  $("#add-to-traversal").addEventListener("click", () => selectedNode && toggleTraversalNode(selectedNode));
  $("#add-traversal-entity").addEventListener("click", (event) => traversalPicker.open(/** @type {HTMLElement} */ (event.currentTarget)));
  $("#clear-traversal").addEventListener("click", clearTraversal);
  $("#theme-select").addEventListener("change", (event) => setTheme(/** @type {HTMLSelectElement} */ (event.currentTarget).value));
  $$(".view-option").forEach((option) => option.addEventListener("click", () => changeVisualizationMode(option.dataset.layout)));
  $("#minimap-canvas").addEventListener("click", (event) => {
    const rect = /** @type {HTMLCanvasElement} */ (event.currentTarget).getBoundingClientRect();
    renderer.getCamera().animate({ x: (event.clientX - rect.left) / rect.width, y: 1 - (event.clientY - rect.top) / rect.height }, { duration: 450 });
  });
  els.searchScope.addEventListener("change", async (event) => {
    const type = /** @type {HTMLSelectElement} */ (event.currentTarget).value;
    els.search.value = "";
    els.search.placeholder = type ? `Search ${pluralEntityLabel(type).toLowerCase()}` : "Search entities";
    if (type) await ensureCatalogTypes([type]);
    handleSearch("");
    els.search.focus();
  });
  els.search.addEventListener("focus", (event) => handleSearch(/** @type {HTMLInputElement} */ (event.currentTarget).value));
  els.search.addEventListener("input", (event) => {
    const value = /** @type {HTMLInputElement} */ (event.currentTarget).value;
    window.clearTimeout(searchDebounceTimer);
    searchDebounceTimer = window.setTimeout(() => handleSearch(value), 120);
  });
  els.search.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      window.clearTimeout(searchDebounceTimer);
      handleSearch(/** @type {HTMLInputElement} */ (event.currentTarget).value);
      els.searchResults.querySelector("button")?.click();
    }
    if (event.key === "Escape") {
      els.search.value = "";
      els.searchResults.hidden = true;
      els.search.blur();
    }
  });
  document.addEventListener("click", (event) => {
    const target = /** @type {Element | null} */ (event.target instanceof Element ? event.target : null);
    if (!target?.closest(".search-section")) els.searchResults.hidden = true;
    // Selecting a type focuses its entity input. Do not let that same menu
    // click immediately dismiss the newly opened, cached entity suggestions.
    if (!target?.closest(".condition-entity-wrap, .select-menu")) $$(".condition-suggestions").forEach((panel) => { panel.hidden = true; });
  });
  // Single-key shortcuts never fire while typing, including in the chat composer (a contenteditable box).
  const typing = (target) => target instanceof HTMLElement && (target.isContentEditable || Boolean(target.closest("input, textarea, select, [role=combobox]")));
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      els.search.focus();
      els.search.select();
    } else if (event.key === "Escape") {
      clearSelection();
      $("#shortcut-modal").hidden = true;
    } else if (event.key.toLowerCase() === "f" && !typing(event.target)) {
      fitVisibleGraph();
    } else if (event.key === "?" && !typing(event.target)) {
      $("#shortcut-modal").hidden = false;
    }
  });
  $("#close-shortcuts").addEventListener("click", () => { $("#shortcut-modal").hidden = true; });
  $("#shortcut-modal").addEventListener("click", (event) => {
    if (/** @type {Element} */ (event.target).id === "shortcut-modal") /** @type {HTMLElement} */ (event.currentTarget).hidden = true;
  });
  mountTraversalRange();
  updateTraversalUI();
  renderConditionalFilters();
}

let queryPanelToggle = null;

function wireWorkspaceShell() {
  $$('[data-panel-icon]').forEach(button => button.replaceChildren(icon(button.dataset.panelIcon)));
  // The top bar's "?" tours the whole app, ready from the first moment; the ? key still opens the keyboard shortcuts.
  registerAppTour();
  // Loading a graph takes seconds, long enough for a Thinking orb (libraries.dev) in place of the old orbit spinner.
  document.querySelector("#loading-panel .loader-orbit")?.replaceWith(createThinkingOrb({ state: "working", size: 64, label: "Loading the graph…", className: "loading-orb" }));
  $("#open-tour").addEventListener("click", () => startTour("atlas"));
  // Chat says which answer's snapshot it opened the canvas from, or that it opened it plainly.
  for (const button of [els.stageBack, els.stageTitle]) button.addEventListener("click", () => resetGraphView());
  window.addEventListener("atlas:snapshot", (event) => {
    chatSnapshot = /** @type {CustomEvent} */ (event).detail || null;
    if (chatSnapshot?.nodes?.length) { showSnapshotNodes(chatSnapshot.nodes); return; }
    // Arriving without an answer drops any answer filter left from before, so the canvas never shows it unlabelled.
    if (snapshotFiltered) { snapshotFiltered = false; showAllLayers(); return; }
    renderStageHeader();
  });
  const sidebar = $(".sidebar");
  const queryDock = $(".query-dock");
  // Sigma's sidebar never collapses on desktop, so an old saved "collapsed" state must not strand it closed.
  try { localStorage.removeItem("atlas-v2-sidebar"); } catch { /* Optional preference. */ }
  const explorerPanel = connectPanelToggle({
    panel: sidebar, toggles: [$("#explorer-panel-reopen")], reopen: [],
    label: "explorer panel", storageKey: "atlas-v2-sidebar", compact: window.matchMedia("(max-width: 700px)"),
    onChange: open => {
      document.body.classList.toggle("sidebar-collapsed", !open);
      $(".panel-resizer-left").hidden = !open;
      const toggle = $("#explorer-panel-reopen");
      toggle.dataset.panelIcon = open ? "panel-left-close" : "panel-left-open";
      toggle.replaceChildren(icon(toggle.dataset.panelIcon));
    },
  });
  queryPanelToggle = connectPanelToggle({
    panel: queryDock, toggles: [$("#query-panel-toggle")], reopen: [$("#query-panel-reopen")],
    label: "query panel", storageKey: "atlas-v2-query-panel", compact: window.matchMedia("(max-width: 1050px)"),
    onChange: open => {
      document.body.classList.toggle("query-panel-collapsed", !open);
      document.body.classList.toggle("query-dock-open", open);
      $(".panel-resizer-right").hidden = !open;
    },
  });
  workspaceFocus.register(explorerPanel);
  workspaceFocus.register(queryPanelToggle);
}

function initializeRenderer() {
  renderer = new Sigma(graph, $("#sigma-container"), {
    nodeReducer,
    edgeReducer,
    renderEdgeLabels: false,
    enableEdgeEvents: false,
    labelFont: "Geist, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif",
    labelColor: { color: graphLabelPalette(activeTheme).label },
    defaultDrawNodeHover: (context, data, settings) => drawGraphNodeHover(context, data, settings, activeTheme),
    labelSize: 12 * textScale(),
    labelWeight: "500",
    labelDensity: 0.07,
    labelGridCellSize: 170 * textScale(),
    labelRenderedSizeThreshold: 12,
    defaultEdgeColor: "#34383d",
    defaultNodeColor: "#72b5ff",
    hideEdgesOnMove: true,
    zIndex: true,
    allowInvalidContainer: false,
    minCameraRatio: 0.005,
    maxCameraRatio: 4,
    nodeProgramClasses: { gradient: NodeGradientProgram },
  });
  renderer.createCanvasContext("edgeGlow", { beforeLayer: "nodes" });
  edgeGlowContext = renderer.getCanvases().edgeGlow.getContext("2d");
  renderer.resize(true);
  renderer.on("afterRender", drawConnectionGlow);
  renderer.on("afterRender", drawMinimap);
  renderer.on("clickNode", ({ node, event }) => {
    selectNode(node, "pan");
    if (event?.original?.shiftKey) toggleTraversalNode(node);
  });
  renderer.on("clickStage", () => clearSelection());
  renderer.on("enterNode", ({ node }) => {
    hoveredNode = node;
    document.body.classList.add("node-hovered");
    renderer.refresh();
  });
  renderer.on("leaveNode", () => {
    hoveredNode = null;
    document.body.classList.remove("node-hovered");
    renderer.refresh();
  });
}

function addNodeBatch(nodes) {
  for (const node of nodes) graph.addNode(node.key, node.attributes);
}

function addSearchBatch(items) {
  for (const item of items) {
    const searchItem = {
      ...item,
      searchable: `${item.name} ${item.id} ${item.type}`.toLowerCase(),
    };
    if (!searchIndexByType.has(searchItem.type)) searchIndexByType.set(searchItem.type, []);
    searchIndexByType.get(searchItem.type).push(searchItem);
  }
}

function addEdgeBatch(edges) {
  for (const edge of edges) {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) graph.addEdgeWithKey(edge.key, edge.source, edge.target, edge.attributes);
  }
}

function finalizeSearchIndex() {
  for (const items of searchIndexByType.values()) items.sort((first, second) => first.name.localeCompare(second.name));
}

function configureDynamicSchema(meta) {
  if (meta.layers && Object.keys(meta.layers).length) LAYERS = meta.layers;
  activeLayer = LAYERS.BUSINESS ? "BUSINESS" : Object.keys(LAYERS)[0];
  // Every layer starts open in the tree.
  expandedLayers.clear();
  for (const layer of Object.keys(LAYERS)) expandedLayers.add(layer);
  const merged = new Map();
  for (const rule of RECOMMENDED_RELATIONSHIP_RULES) merged.set(rule.join("\u0000"), rule);
  for (const entry of meta.relationshipSchema || []) {
    const rule = [entry.source, entry.relationship, entry.target];
    merged.set(rule.join("\u0000"), rule);
  }
  RELATIONSHIP_RULES = [...merged.values()];
}

async function start() {
  const registryResponse = await fetch(new URL("/graph-data/index.json", location.href), { credentials: "same-origin" });
  if (!registryResponse.ok) throw new Error(`Graph registry request failed (${registryResponse.status})`);
  graphRegistry = await registryResponse.json();
  if (graphRegistry.formatVersion !== 10 || !Array.isArray(graphRegistry.graphs) || !graphRegistry.graphs.length) throw new Error("Invalid or empty graph registry");

  els.graphSelect.replaceChildren();
  for (const entry of graphRegistry.graphs) {
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent = datasetLabel(entry);
    option.title = entry.sourceName;
    // Every dataset is a snapshot, so the picker says when it was captured.
    const captured = entry.generatedAt ? new Date(entry.generatedAt) : null;
    if (captured && !Number.isNaN(captured.valueOf())) {
      option.dataset.sub = `Captured ${captured.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
      option.title = `${entry.sourceName} · ${option.dataset.sub}`;
    }
    els.graphSelect.append(option);
  }

  const openGraph = async (graphId) => {
    const entry = graphRegistry.graphs.find((candidate) => candidate.id === graphId) || graphRegistry.graphs[0];
    // A different dataset is no longer the snapshot an answer was opened from.
    if (currentGraphId && currentGraphId !== entry.id) chatSnapshot = null;
    currentGraphId = entry.id;
    localStorage.setItem("atlas-v2-graph", currentGraphId);
    els.graphSelect.value = currentGraphId;
    els.graphSelect.disabled = true;
    dataWorker?.terminate();
    dataWorker = null;
    for (const resolve of pendingViewRequests.values()) resolve({ cancelled: true });
    for (const resolve of pendingCatalogRequests.values()) resolve({ cancelled: true });
    pendingViewRequests.clear();
    pendingCatalogRequests.clear();
    activeViewRequestId += 1;
    activeCatalogRequestId += 1;
    graph.clear();
    graphMeta = null;
    LAYERS = DEFAULT_LAYERS;
    RELATIONSHIP_RULES = RECOMMENDED_RELATIONSHIP_RULES;
    loadedLayers.clear();
    loadedCatalogTypes.clear();
    searchIndexByType.clear();
    state.nodeTypes.clear();
    state.edgeTypes.clear();
    traversalSelections.clear();
    conditionalConditions.splice(0);
    focusedNeighborhood = null;
    traversalEdges = null;
    conditionalNodes = null;
    conditionalEdges = null;
    selectedNode = null;
    hoveredNode = null;
    conditionRevision += 1;
    clearSelection(false);
    updateTraversalUI();
    els.searchResults.hidden = true;
    els.loadingPanel.classList.remove("complete", "error");
    document.querySelector(".stage")?.classList.add("data-loading");
    setLoading(8, `Opening ${entry.name}`, entry.sourceName);
    finishGraphLoadTimer = startTimer("graph_load", { graphCount: graphRegistry.graphs.length });

    dataWorker = new Worker(new URL("./lazy-graph.worker.js", import.meta.url), { type: "module" });
  dataWorker.onerror = (event) => {
    const message = event.message || "Graph worker crashed";
    captureException(new Error(message), { source: "graph-worker-runtime", file: event.filename, line: event.lineno });
    if (!applicationInitialized) {
      els.loadingPanel.classList.add("error");
      setLoading(100, "Could not open graph", message);
    } else showToast(`Graph worker error · ${message}`);
    els.graphSelect.disabled = false;
  };
  dataWorker.onmessage = async ({ data }) => {
    if (data.kind === "error") {
      captureException(new Error(data.message), { source: "graph-worker" });
      if (!applicationInitialized) {
        els.loadingPanel.classList.add("error");
        setLoading(100, "Could not open graph", data.message);
      } else showToast(`Graph data error · ${data.message}`);
      pendingViewRequests.get(data.requestId)?.({ error: data.message });
      pendingViewRequests.delete(data.requestId);
      pendingCatalogRequests.get(data.requestId)?.({ error: data.message });
      pendingCatalogRequests.delete(data.requestId);
      els.graphSelect.disabled = false;
      return;
    }
    if (data.kind === "catalog") {
      graphMeta = data.meta;
      configureDynamicSchema(graphMeta);
      state.edgeTypes = new Set([...Object.keys(graphMeta.edgeCounts), ...RELATIONSHIP_RULES.map((rule) => rule[1])]);
      setLoading(40, "Loading searchable entity catalog");
      return;
    }
    if (data.kind === "search-batch") {
      addSearchBatch(data.items);
      if (!applicationInitialized) setLoading(40 + Math.round((data.processed / data.total) * 22), `Indexing ${data.processed.toLocaleString()} searchable entities`);
      return;
    }
    if (data.kind === "catalog-types-ready") {
      data.types.forEach((type) => loadedCatalogTypes.add(type));
      finalizeSearchIndex();
      pendingCatalogRequests.get(data.requestId)?.({ types: data.types });
      pendingCatalogRequests.delete(data.requestId);
      return;
    }
    if (data.kind === "catalog-ready") {
      finalizeSearchIndex();
      state.nodeTypes = new Set(Object.values(LAYERS).flat());
      makeFilters();
      $$(".layer-tab").forEach((button) => {
        button.classList.remove("active");
        button.setAttribute("aria-selected", "false");
      });
      updateFilterUI();
      await loadGraphView(Object.keys(LAYERS));
      return;
    }
    if (data.requestId && data.requestId !== activeViewRequestId) return;
    if (data.kind === "view-reset") {
      graph.clear();
      loadedLayers = new Set(data.layers);
      if (data.layers.length !== 1) {
        const stage = document.querySelector(".stage");
        stage?.classList.remove("layer-donut");
        stage?.removeAttribute("data-active-layer");
      }
      conditionalNodes = null;
      conditionalEdges = null;
      focusedNeighborhood = null;
      traversalEdges = null;
      clearSelection(false);
      return;
    }
    if (data.kind === "node-batch") {
      addNodeBatch(data.nodes);
      return;
    }
    if (data.kind === "edge-batch") {
      addEdgeBatch(data.edges);
      return;
    }
    if (data.kind === "view-progress") {
      if (!applicationInitialized) setLoading(62 + Math.round(data.progress * 0.36), data.label);
      return;
    }
    if (data.kind === "view-ready") {
      if (!applicationInitialized) {
        initializeRenderer();
        wireControls();
        setTheme(activeTheme, false);
        applicationInitialized = true;
      }
      updateCounts();
      fitVisibleGraph();
      setLoading(100, "Graph ready");
      document.querySelector(".stage")?.classList.remove("data-loading");
      els.graphSelect.disabled = false;
      pendingViewRequests.get(data.requestId)?.({ layers: data.layers });
      pendingViewRequests.delete(data.requestId);
      if (pendingSnapshotNodes) { const nodes = pendingSnapshotNodes; pendingSnapshotNodes = null; showSnapshotNodes(nodes); }
      if (!els.loadingPanel.classList.contains("complete")) {
        finishGraphLoadTimer({ catalogNodes: graphMeta.totalNodes, loadedNodes: graph.order, loadedEdges: graph.size, layers: data.layers.length });
        requestAnimationFrame(() => {
          els.loadingPanel.classList.add("complete");
        });
      }
    }
  };
    dataWorker.postMessage({ kind: "initialize", manifestUrl: new URL(`/graph-data/${entry.manifest}`, location.href).href });
  };

  // Switching snapshot in the breadcrumb is the same as choosing that dataset in the top bar.
  els.stageSnapshot.addEventListener("change", () => {
    const value = els.stageSnapshot.value;
    if (value.startsWith("chat:")) return;
    // This dataset's own snapshot is the full graph; another dataset's switches to it, as the top bar does.
    if (value === currentGraphId) { resetGraphView(); return; }
    els.graphSelect.value = value;
    els.graphSelect.dispatchEvent(new Event("change", { bubbles: true }));
  });
  els.graphSelect.addEventListener("change", async (event) => {
    await openGraph(/** @type {HTMLSelectElement} */ (event.currentTarget).value);
    trackEvent("graph_dataset_selected", { availableGraphs: graphRegistry.graphs.length });
  });
  const savedGraphId = localStorage.getItem("atlas-v2-graph");
  await openGraph(graphRegistry.graphs.some((entry) => entry.id === savedGraphId) ? savedGraphId : graphRegistry.defaultGraphId);
}

initializeUIControls();
initializeTextSizeSettings(() => {
  if (!renderer) return;
  renderer.setSetting("labelSize", 12 * textScale());
  renderer.setSetting("labelGridCellSize", 170 * textScale());
  renderer.resize(true);
  renderer.refresh();
});
initializePanelResizing(() => {
  if (!renderer) return;
  minimapDirty = true;
  renderer.resize(true);
  renderer.refresh();
});
initializePanelChrome();
wireWorkspaceShell();

start().catch((error) => {
  captureException(error, { source: "graph-registry" });
  els.loadingPanel.classList.add("error");
  setLoading(100, "Could not list graphs", error instanceof Error ? error.message : String(error));
});
