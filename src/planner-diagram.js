import { entityConnections, resultPage } from "./planner-results.js";

const nodeName = (node) => String(node.name || node.label || node.attributes?.name || node.id);
const sourceId = (edge) => String(edge.sourceId ?? edge.source);
const targetId = (edge) => String(edge.targetId ?? edge.target);
const relationName = (edge) => String(edge.relationshipType || edge.type || edge.label || "RELATED");

/** Preserve actual directed edges, including parallel edges and self loops. */
export function diagramSlice(graph, focusId = "", page = 0) {
  const focus = graph.nodes.find((node) => String(node.id) === focusId);
  if (!focus) return { nodes: graph.nodes, edges: graph.edges, focusId: "", page: 0, pages: 1, start: 0, end: graph.edges.length, total: graph.edges.length };
  const connections = entityConnections(graph, focusId);
  const selection = resultPage(connections.map((entry) => [entry]), "", page, 6);
  const nodes = new Map([[String(focus.id), focus]]);
  selection.rows.forEach(([entry]) => nodes.set(String(entry.node.id), entry.node));
  return { ...selection, nodes: [...nodes.values()], edges: selection.rows.map(([entry]) => entry.edge), focusId };
}

/** Deterministic, generously spaced radial positions. No forces or random drift. */
export function diagramLayout(nodes, focusId = "") {
  const positions = new Map();
  if (!nodes.length) return positions;
  const root = nodes.find((node) => String(node.id) === focusId) || nodes[0];
  positions.set(String(root.id), { x: 0, y: 0 });
  const others = nodes.filter((node) => node !== root);
  const radius = Math.max(250, others.length * 210 / (2 * Math.PI));
  others.forEach((node, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / others.length;
    positions.set(String(node.id), { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  });
  return positions;
}

export function diagramEdgePath(source, target, lane = 0, self = false, labelRatio = .5) {
  if (self) {
    const reach = 85 + Math.abs(lane) * 40;
    return { d: `M ${source.x + 15} ${source.y - 18} C ${source.x + reach} ${source.y - 150}, ${source.x + reach + 90} ${source.y + 70}, ${source.x + 26} ${source.y + 6}`, x: source.x + reach + 38, y: source.y - 70 };
  }
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy) || 1;
  const ux = dx / distance;
  const uy = dy / distance;
  const bend = lane * 70;
  const cx = (source.x + target.x) / 2 - uy * bend;
  const cy = (source.y + target.y) / 2 + ux * bend;
  return {
    d: `M ${source.x + ux * 26} ${source.y + uy * 26} Q ${cx} ${cy} ${target.x - ux * 29} ${target.y - uy * 29}`,
    x: (1 - labelRatio) ** 2 * source.x + 2 * (1 - labelRatio) * labelRatio * cx + labelRatio ** 2 * target.x,
    y: (1 - labelRatio) ** 2 * source.y + 2 * (1 - labelRatio) * labelRatio * cy + labelRatio ** 2 * target.y,
  };
}

const svg = (name, attributes = {}, text = "") => {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  if (text) element.textContent = text;
  return element;
};

function wrap(value, limit) {
  const lines = [];
  let line = "";
  for (const word of String(value).split(/\s+/)) {
    if (line && line.length + word.length + 1 > limit) { lines.push(line); line = ""; }
    if (word.length > limit) {
      if (line) { lines.push(line); line = ""; }
      for (let i = 0; i < word.length; i += limit) lines.push(word.slice(i, i + limit));
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

/** A theme-aware diagram; scoped pages keep sidebar labels readable, overview retains every node. */
export class PlannerDiagram {
  constructor({ onSelect, layerForNode }) {
    const q = (id) => document.querySelector(id);
    this.panel = /** @type {HTMLElement} */ (q("#planner-diagram-panel"));
    this.canvas = /** @type {HTMLElement} */ (q("#planner-diagram-canvas"));
    this.svg = /** @type {SVGSVGElement} */ (q("#planner-diagram-svg"));
    this.picker = /** @type {HTMLSelectElement} */ (q("#planner-diagram-focus"));
    this.empty = /** @type {HTMLElement} */ (q("#planner-diagram-empty"));
    this.navigation = /** @type {HTMLElement} */ (q("#planner-diagram-navigation"));
    this.previous = /** @type {HTMLButtonElement} */ (q("#planner-diagram-previous"));
    this.next = /** @type {HTMLButtonElement} */ (q("#planner-diagram-next"));
    this.detail = q("#planner-diagram-detail");
    this.scope = q("#planner-diagram-scope");
    this.count = q("#planner-diagram-count");
    this.scaleLabel = q("#planner-diagram-scale");
    this.expandButton = q("#planner-diagram-expand");
    this.onSelect = onSelect;
    this.layerForNode = layerForNode;
    this.graph = { nodes: [], edges: [], rootNodeIds: [] };
    this.focusId = "";
    this.page = 0;
    this.size = { width: 400, height: 600 };
    this.bounds = { x: 0, y: 0, width: 400, height: 600 };
    this.transform = { scale: 1, x: 0, y: 0 };
    this.picker.addEventListener("change", () => { this.focusId = this.picker.value; this.page = 0; this.render(); });
    this.previous.addEventListener("click", () => { this.page--; this.render(); });
    this.next.addEventListener("click", () => { this.page++; this.render(); });
    q("#planner-diagram-in").addEventListener("click", () => this.zoom(1.25));
    q("#planner-diagram-out").addEventListener("click", () => this.zoom(.8));
    q("#planner-diagram-fit").addEventListener("click", () => this.fit());
    q("#planner-diagram-readable").addEventListener("click", () => this.zoom(1 / this.transform.scale));
    this.expandButton.addEventListener("click", () => this.expand(!this.panel.classList.contains("expanded")));
    this.panel.addEventListener("keydown", (event) => { if (event.key === "Escape") this.expand(false); });
    this.svg.addEventListener("keydown", (event) => {
      if (event.target !== this.svg) return;
      if (["+", "=", "-", "0", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) event.preventDefault();
      if (event.key === "+" || event.key === "=") this.zoom(1.25);
      if (event.key === "-") this.zoom(.8);
      if (event.key === "0") this.fit();
      if (event.key.startsWith("Arrow")) {
        this.transform.x += event.key === "ArrowLeft" ? 40 : event.key === "ArrowRight" ? -40 : 0;
        this.transform.y += event.key === "ArrowUp" ? 40 : event.key === "ArrowDown" ? -40 : 0;
        this.applyTransform();
      }
    });
    this.svg.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.zoom(event.deltaY < 0 ? 1.12 : 1 / 1.12, this.point(event.clientX, event.clientY));
    }, { passive: false });
    let pointer = null;
    this.svg.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || (event.target instanceof Element && event.target.closest("[role=button]"))) return;
      pointer = { id: event.pointerId, point: this.point(event.clientX, event.clientY), ...this.transform };
      this.svg.setPointerCapture(event.pointerId);
      this.svg.classList.add("dragging");
    });
    this.svg.addEventListener("pointermove", (event) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const point = this.point(event.clientX, event.clientY);
      this.transform.x = pointer.x + point.x - pointer.point.x;
      this.transform.y = pointer.y + point.y - pointer.point.y;
      this.applyTransform();
    });
    const end = () => { pointer = null; this.svg.classList.remove("dragging"); };
    this.svg.addEventListener("pointerup", end);
    this.svg.addEventListener("pointercancel", end);
    this.resizeObserver = new ResizeObserver(() => this.render());
    this.resizeObserver.observe(this.canvas);
    this.textObserver = new MutationObserver(() => this.render());
    this.textObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-text-size"] });
  }

  setGraph(graph) {
    this.graph = graph;
    this.focusId = graph.rootNodeIds?.find((id) => graph.nodes.some((node) => String(node.id) === String(id))) || String(graph.nodes[0]?.id || "");
    // Small results are naturally readable as a complete diagram.
    if (graph.nodes.length <= 8) this.focusId = "";
    this.page = 0;
    this.picker.replaceChildren(new Option("All returned nodes", ""));
    graph.nodes.forEach((node) => this.picker.append(new Option(nodeName(node), String(node.id))));
    this.picker.value = this.focusId;
    this.picker.disabled = !graph.nodes.length;
    this.empty.hidden = graph.nodes.length > 0;
    this.count.textContent = `${graph.nodes.length} nodes · ${graph.edges.length} edges`;
    this.detail.textContent = "Drag to pan · Scroll to zoom · Select an entity or relationship";
    this.render();
  }

  expand(open) {
    const changed = this.panel.classList.contains("expanded") !== open;
    this.panel.classList.toggle("expanded", open);
    this.expandButton.setAttribute("aria-expanded", String(open));
    this.expandButton.setAttribute("aria-label", open ? "Collapse map" : "Expand map");
    this.expandButton.querySelector("span").textContent = open ? "Collapse" : "Expand";
    if (changed) this.expandButton.focus();
  }

  focus(id) {
    this.focusId = String(id);
    this.page = 0;
    this.picker.value = this.focusId;
    this.render();
  }

  render() {
    if (!this.canvas.clientWidth || !this.canvas.clientHeight) return;
    this.size = { width: this.canvas.clientWidth, height: this.canvas.clientHeight };
    this.svg.setAttribute("viewBox", `0 0 ${this.size.width} ${this.size.height}`);
    this.svg.replaceChildren();
    const selection = diagramSlice(this.graph, this.focusId, this.page);
    this.page = selection.page;
    this.navigation.hidden = !selection.nodes.length;
    this.previous.disabled = selection.page === 0;
    this.next.disabled = selection.page + 1 >= selection.pages;
    this.previous.hidden = this.next.hidden = !selection.focusId;
    this.scope.textContent = selection.focusId
      ? `${selection.total ? `${selection.start + 1}–${selection.end}` : "0"} of ${selection.total} connections · ${selection.nodes.length} nodes shown`
      : `All ${selection.nodes.length} returned nodes · Expand or zoom for detail`;
    if (!selection.nodes.length) return;
    const positions = diagramLayout(selection.nodes, selection.focusId || this.graph.rootNodeIds?.[0]);
    const fontScale = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
    const defs = svg("defs");
    const marker = svg("marker", { id: "planner-diagram-arrow", viewBox: "0 0 12 12", refX: 10, refY: 6, markerWidth: 8, markerHeight: 8, orient: "auto" });
    marker.append(svg("path", { d: "M 2 2 L 10 6 L 2 10", class: "planner-diagram-arrow" }));
    defs.append(marker);
    this.svg.append(defs);
    const viewport = svg("g", { class: "planner-diagram-viewport" });
    const paths = svg("g");
    const labels = svg("g");
    const nodes = svg("g");
    const pairs = new Map();
    selection.edges.forEach((edge) => {
      const key = [sourceId(edge), targetId(edge)].sort().join("\0");
      if (!pairs.has(key)) pairs.set(key, []);
      pairs.get(key).push(edge);
    });
    selection.edges.forEach((edge) => {
      const source = positions.get(sourceId(edge));
      const target = positions.get(targetId(edge));
      if (!source || !target) return;
      const siblings = pairs.get([sourceId(edge), targetId(edge)].sort().join("\0"));
      const index = siblings.indexOf(edge);
      const lane = (index - (siblings.length - 1) / 2) * (sourceId(edge) > targetId(edge) ? -1 : 1);
      const rootId = selection.focusId || this.graph.rootNodeIds?.[0] || String(selection.nodes[0].id);
      const ratio = sourceId(edge) === rootId ? .65 : targetId(edge) === rootId ? .35 : .5;
      const geometry = diagramEdgePath(source, target, sourceId(edge) === targetId(edge) ? index : lane, sourceId(edge) === targetId(edge), ratio);
      const relation = relationName(edge);
      const sourceNode = selection.nodes.find((node) => String(node.id) === sourceId(edge));
      const targetNode = selection.nodes.find((node) => String(node.id) === targetId(edge));
      const description = `${nodeName(sourceNode)} → ${relation} → ${nodeName(targetNode)}`;
      const path = svg("path", { d: geometry.d, class: "planner-diagram-edge", "marker-end": "url(#planner-diagram-arrow)" });
      path.append(svg("title", {}, description));
      paths.append(path);
      const label = svg("g", { class: "planner-diagram-relation", transform: `translate(${geometry.x} ${geometry.y})`, role: "button", tabindex: 0, "aria-label": description });
      const lines = wrap(relation.replace(/[_-]/g, " ").toLowerCase(), 22);
      const width = Math.max(...lines.map((line) => line.length)) * 7.2 * fontScale + 22;
      const height = lines.length * 17 * fontScale + 12;
      label.append(svg("rect", { x: -width / 2, y: -height / 2, width, height, rx: 5 }));
      const text = svg("text", { "text-anchor": "middle", "font-size": 12 * fontScale });
      lines.forEach((line, i) => text.append(svg("tspan", { x: 0, y: (i - (lines.length - 1) / 2) * 17 * fontScale + 4 }, line)));
      label.append(text, svg("title", {}, description));
      this.activate(label, () => { this.detail.textContent = description; });
      labels.append(label);
    });
    selection.nodes.forEach((node) => {
      const point = positions.get(String(node.id));
      const root = String(node.id) === (selection.focusId || this.graph.rootNodeIds?.[0]);
      const group = svg("g", { class: `planner-diagram-node ${this.layerForNode(node).toLowerCase()}${root ? " root" : ""}`, transform: `translate(${point.x} ${point.y})`, role: "button", tabindex: 0, "aria-label": `${nodeName(node)} · ${node.type || "Entity"}`, "data-node-id": node.id });
      group.append(svg("circle", { r: 27, class: "planner-diagram-halo" }), svg("circle", { r: 19, class: "planner-diagram-dot" }));
      const lines = wrap(nodeName(node), 26);
      const text = svg("text", { "text-anchor": "middle", "font-size": 16 * fontScale });
      const labelY = point.y < -20 ? -37 - (lines.length - 1) * 21 * fontScale : 49;
      lines.forEach((line, i) => text.append(svg("tspan", { x: 0, y: labelY + i * 21 * fontScale }, line)));
      group.append(text, svg("title", {}, `${nodeName(node)}\n${node.type || "Entity"}\n${node.id}`));
      this.activate(group, () => {
        this.svg.querySelectorAll(".planner-diagram-node.selected").forEach((item) => item.classList.remove("selected"));
        group.classList.add("selected");
        this.detail.textContent = `${nodeName(node)} · ${node.type || "Entity"}. Double-click to explore its connections.`;
        this.onSelect(node.id);
      });
      group.addEventListener("dblclick", () => { this.focusId = String(node.id); this.picker.value = this.focusId; this.page = 0; this.render(); });
      nodes.append(group);
    });
    viewport.append(paths, labels, nodes);
    this.svg.append(viewport);
    const box = viewport.getBBox();
    this.bounds = { x: box.x - 32, y: box.y - 32, width: box.width + 64, height: box.height + 100 };
    this.fit();
  }

  activate(element, callback) {
    element.addEventListener("click", callback);
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); callback(); }
    });
  }

  point(clientX, clientY) {
    const rect = this.svg.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  fit() {
    const scale = Math.min(1.25, this.size.width / this.bounds.width, this.size.height / this.bounds.height);
    this.transform = { scale, x: (this.size.width - this.bounds.width * scale) / 2 - this.bounds.x * scale, y: (this.size.height - this.bounds.height * scale) / 2 - this.bounds.y * scale };
    this.applyTransform();
  }

  zoom(factor, point = { x: this.size.width / 2, y: this.size.height / 2 }) {
    const previous = this.transform;
    const scale = Math.max(.04, Math.min(4, previous.scale * factor));
    this.transform = { scale, x: point.x - (point.x - previous.x) * scale / previous.scale, y: point.y - (point.y - previous.y) * scale / previous.scale };
    this.applyTransform();
  }

  applyTransform() {
    const { scale, x, y } = this.transform;
    this.svg.querySelector(".planner-diagram-viewport")?.setAttribute("transform", `translate(${x} ${y}) scale(${scale})`);
    this.scaleLabel.textContent = `${Math.round(scale * 100)}%`;
    this.canvas.style.backgroundSize = `${40 * scale}px ${40 * scale}px`;
    this.canvas.style.backgroundPosition = `${x}px ${y}px`;
  }
}
