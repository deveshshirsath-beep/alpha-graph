import { icon } from "./ui-controls.js";
import { safeCssColor } from "./sanitize.js";
import { questionParameters } from "./planner-discovery.js";

/* Entity map from the sigma reference: containment parents, display order, labels and marker shapes.
   Colors come from Alpha's per-theme type styles in the dataset manifest. */
const KINDS = {
  "BUSINESS-AREA": ["Business Area", "hexagon"], "BUSINESS-DOMAIN": ["Business Domain", "hexagon"], "SERVICE-DOMAIN": ["Service Domain", "hexagon"],
  "BUSINESS-CAPABILITY": ["Business Capability", "circle"], TEAMS: ["Team", "pentagon"], APPLICATION: ["Application", "square"],
  API: ["API", "circle"], "API-VERSION": ["API Version", "circle"], ENDPOINT: ["Endpoint", "circle"], OPERATION: ["Operation", "circle"],
  CONSUMER: ["Consumer", "circle"], "STATUS-CODE": ["Status Code", "circle"], HEADER: ["Header", "triangle"],
  "PATH-PARAMETER": ["Path Parameter", "triangle"], "QUERY-PARAMETER": ["Query Parameter", "triangle"], "HTTP-METHOD": ["HTTP Method", "square"],
  SECURITY: ["Security", "pentagon"], EXPOSURE: ["Exposure", "pentagon"], PCI: ["PCI", "pentagon"], PII: ["PII", "pentagon"],
  SCHEMA: ["Schema", "triangle"], FIELD: ["Field", "circle"], GATEWAY: ["Gateway", "square"], WORKFLOW: ["Workflow", "square"],
  MICROSERVICE: ["Microservice", "circle"], SERVER: ["Server", "square"], DATABASE: ["Database", "square"], EVENT: ["Event", "circle"],
};

const PARENTS = {
  "BUSINESS-DOMAIN": "BUSINESS-AREA", "SERVICE-DOMAIN": "BUSINESS-DOMAIN", "BUSINESS-CAPABILITY": "SERVICE-DOMAIN",
  TEAMS: "BUSINESS-CAPABILITY", APPLICATION: "BUSINESS-CAPABILITY", API: "APPLICATION", "API-VERSION": "API",
  ENDPOINT: "API-VERSION", OPERATION: "ENDPOINT", SCHEMA: "OPERATION", FIELD: "SCHEMA",
  ...Object.fromEntries(["STATUS-CODE", "HEADER", "PATH-PARAMETER", "QUERY-PARAMETER", "HTTP-METHOD", "SECURITY", "EXPOSURE", "PCI", "PII",
    "CONSUMER", "EVENT", "GATEWAY", "MICROSERVICE", "WORKFLOW", "SERVER", "DATABASE"].map((type) => [type, "OPERATION"])),
};

const ORDER = [
  "BUSINESS-AREA", "BUSINESS-DOMAIN", "SERVICE-DOMAIN", "BUSINESS-CAPABILITY", "TEAMS", "APPLICATION",
  "API", "API-VERSION", "ENDPOINT", "OPERATION", "SCHEMA", "FIELD", "STATUS-CODE", "HEADER",
  "PATH-PARAMETER", "QUERY-PARAMETER", "HTTP-METHOD", "SECURITY", "EXPOSURE", "PCI", "PII",
  "CONSUMER", "EVENT", "GATEWAY", "MICROSERVICE", "WORKFLOW", "SERVER", "DATABASE",
];

// Phosphor shape geometry (256 × 256), as used by the sigma reference.
const SHAPES = {
  circle: "M232,128A104,104,0,1,1,128,24,104.13,104.13,0,0,1,232,128Z",
  hexagon: "M232,80.18v95.64a16,16,0,0,1-8.32,14l-88,48.17a15.88,15.88,0,0,1-15.36,0l-88-48.17a16,16,0,0,1-8.32-14V80.18a16,16,0,0,1,8.32-14l88-48.17a15.88,15.88,0,0,1,15.36,0l88,48.17A16,16,0,0,1,232,80.18Z",
  pentagon: "M231.26,105.19l-32,107.54-.06.17A15.94,15.94,0,0,1,184,224H72A15.94,15.94,0,0,1,56.8,212.9l-.06-.17-32-107.54a16,16,0,0,1,5.7-17.63l87.92-68.31.18-.14a15.93,15.93,0,0,1,18.92,0l.18.14,87.92,68.31A16,16,0,0,1,231.26,105.19Z",
  square: "M224,48V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H208A16,16,0,0,1,224,48Z",
  triangle: "M236.78,211.81A24.34,24.34,0,0,1,215.45,224H40.55a24.34,24.34,0,0,1-21.33-12.19,23.51,23.51,0,0,1,0-23.72L106.65,36.22a24.76,24.76,0,0,1,42.7,0L236.8,188.09A23.51,23.51,0,0,1,236.78,211.81Z",
};

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function entityTypeLabel(type) {
  return KINDS[type]?.[0] || String(type || "Entity").replaceAll("-", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Rows for the entity types present in a graph, nested by containment.
 * @param {string[]} types
 * @param {{ source: string, target: string }[]} relationshipSchema
 * @returns {{ type: string, depth: number, hasChildren: boolean, ancestors: string[] }[]}
 */
export function buildEntityMapRows(types, relationshipSchema = []) {
  const present = new Set(types);
  const rank = new Map(ORDER.map((type, index) => [type, index]));
  const parentOf = (type) => {
    let parent = PARENTS[type];
    while (parent && !present.has(parent)) parent = PARENTS[parent];
    if (parent) return parent;
    if (KINDS[type]) return null;
    // Unknown types hang off a related known type so new schema entries still appear.
    const related = relationshipSchema.find((entry) => (entry.source === type && present.has(entry.target) && entry.target !== type)
      || (entry.target === type && present.has(entry.source) && entry.source !== type));
    if (!related) return null;
    const candidate = related.source === type ? related.target : related.source;
    return KINDS[candidate] ? candidate : null;
  };
  const children = new Map();
  const roots = [];
  for (const type of present) {
    const parent = parentOf(type);
    if (parent) children.set(parent, [...(children.get(parent) || []), type]);
    else roots.push(type);
  }
  const byRank = (first, second) => (rank.get(first) ?? Number.MAX_SAFE_INTEGER) - (rank.get(second) ?? Number.MAX_SAFE_INTEGER) || first.localeCompare(second);
  const rows = [];
  const visit = (type, depth, ancestors) => {
    const nested = (children.get(type) || []).sort(byRank);
    rows.push({ type, depth, hasChildren: nested.length > 0, ancestors });
    for (const child of nested) visit(child, depth + 1, [...ancestors, type]);
  };
  roots.sort(byRank).forEach((type) => visit(type, 0, []));
  return rows;
}

function element(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function button(className) {
  const node = element("button", className);
  node.type = "button";
  return node;
}

export function typeMark(type, meta) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("planner-type-mark");
  svg.setAttribute("viewBox", "0 0 256 256");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const style = meta?.typeStyles?.[type] || {};
  for (const [theme, field] of [["dark", "darkColor"], ["light", "lightColor"], ["ocean", "oceanColor"], ["sunset", "sunsetColor"]]) {
    svg.style.setProperty(`--mark-${theme}`, safeCssColor(style[field] || style.color, "#8185a3"));
  }
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", SHAPES[KINDS[type]?.[1]] || SHAPES.circle);
  svg.append(path);
  return svg;
}

function heading(category) {
  return String(category || "Other").split(/_+/).filter(Boolean).map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

function questionText(text) {
  const span = element("span", "planner-type-question-text");
  String(text).split(/(\{[a-z][a-z0-9_]*\})/).forEach((part, index) => {
    span.append(index % 2 ? element("span", "planner-type-slot", part.slice(1, -1).replaceAll("_", " ")) : document.createTextNode(part));
  });
  return span;
}

/** Sigma's chat Entity map: browse entity types, then pick one of its catalog questions. */
export class PlannerTypeMap {
  constructor({ panel, getQuestions = null, onChoose = null, onNavigate = null, fullCounts = false }) {
    this.panel = panel;
    this.getQuestions = getQuestions;
    this.onChoose = onChoose;
    // With onNavigate the tree is a table of contents: a type jumps to its section elsewhere instead of listing its questions.
    this.onNavigate = onNavigate;
    this.fullCounts = fullCounts;
    this.active = "";
    /** @type {Set<string> | null} */
    this.available = null;
    this.meta = null;
    this.type = "";
    this.rows = [];
    this.collapsed = new Set();
    this.render();
  }

  setMeta(meta) {
    if (meta === this.meta) return;
    this.meta = meta;
    this.type = "";
    this.render();
  }

  show(type) {
    this.type = type;
    this.render();
    this.panel.scrollTop = 0;
  }

  /** The table-of-contents entry being read; a collapsed type lights its nearest visible ancestor. */
  setActive(type) {
    if (type === this.active) return;
    this.active = type;
    this.markActive(true);
  }

  /** Types that have a section to jump to; the rest stay in the tree for structure but are dimmed. */
  setAvailable(types) {
    this.available = types ? new Set(types) : null;
    this.render();
  }

  render() {
    this.panel.replaceChildren(this.type && this.meta && !this.onNavigate ? this.questionView() : this.treeView());
    this.markActive(false);
  }

  markActive(reveal) {
    const items = /** @type {HTMLElement[]} */ ([...this.panel.querySelectorAll(".planner-type-row")]);
    const shown = (type) => items.find((item) => item.dataset.type === type);
    const ancestors = this.rows.find((row) => row.type === this.active)?.ancestors || [];
    const target = shown(this.active) || [...ancestors].reverse().map(shown).find(Boolean);
    for (const item of items) {
      item.classList.toggle("is-active", item === target);
      const entry = item.querySelector(".planner-type-entry");
      if (item === target) entry?.setAttribute("aria-current", "location");
      else entry?.removeAttribute("aria-current");
    }
    if (!reveal || !target) return;
    // Keep the lit entry in view, as a long table of contents does.
    const box = this.panel.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    const offset = rect.top < box.top + 8 ? rect.top - box.top - 8 : rect.bottom > box.bottom - 8 ? rect.bottom - box.bottom + 8 : 0;
    if (offset) this.panel.scrollBy({ top: offset, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  treeView() {
    if (!this.meta?.counts) return element("p", "planner-type-empty", "Loading entity types…");
    const tree = element("div", "planner-type-tree");
    tree.setAttribute("role", "tree");
    tree.setAttribute("aria-label", "Entity map");
    const items = [];
    const lightGuides = (type = "", depth = 0) => items.forEach((item) => {
      const lit = Boolean(type) && item.dataset.ancestors.split(" ").includes(type);
      item.classList.toggle("guide-lit", lit);
      if (lit) item.style.setProperty("--guide-index", String(depth));
    });
    this.rows = buildEntityMapRows(Object.keys(this.meta.counts), this.meta.relationshipSchema);
    for (const row of this.rows) {
      if (row.ancestors.some((ancestor) => this.collapsed.has(ancestor))) continue;
      const label = entityTypeLabel(row.type);
      const unavailable = Boolean(this.available && !this.available.has(row.type));
      const item = element("div", `planner-type-row${unavailable ? " is-unavailable" : ""}`);
      item.dataset.type = row.type;
      item.setAttribute("role", "treeitem");
      item.setAttribute("aria-level", String(row.depth + 1));
      item.style.setProperty("--depth", String(row.depth));
      item.dataset.ancestors = row.ancestors.join(" ");
      if (row.hasChildren) {
        const expanded = !this.collapsed.has(row.type);
        item.setAttribute("aria-expanded", String(expanded));
        const toggle = button("planner-type-toggle");
        toggle.setAttribute("aria-expanded", String(expanded));
        toggle.setAttribute("aria-label", `${expanded ? "Collapse" : "Expand"} ${label}`);
        toggle.append(icon("chevron"));
        toggle.addEventListener("click", () => {
          if (expanded) this.collapsed.add(row.type);
          else this.collapsed.delete(row.type);
          this.render();
        });
        item.append(toggle);
      } else item.append(element("span", "planner-type-toggle"));
      const entry = button("planner-type-entry");
      entry.title = !this.onNavigate ? `Questions about ${label}` : unavailable ? `No questions start from ${label}` : `Go to ${label} questions`;
      entry.disabled = unavailable;
      const total = this.meta.counts[row.type] || 0;
      const count = element("span", "planner-type-count", this.fullCounts ? total.toLocaleString() : compact.format(total));
      count.title = total.toLocaleString();
      entry.append(typeMark(row.type, this.meta), element("span", "planner-type-label", label), count);
      entry.addEventListener("click", () => {
        if (this.onNavigate) this.onNavigate(row.type);
        else this.show(row.type);
      });
      item.addEventListener("mouseenter", () => lightGuides(row.type, row.depth));
      item.append(entry);
      tree.append(item);
      items.push(item);
    }
    tree.addEventListener("mouseleave", () => lightGuides());
    return tree;
  }

  questionView() {
    const view = element("div", "planner-type-questions");
    const label = entityTypeLabel(this.type);
    const crumbs = element("nav", "planner-type-crumbs");
    crumbs.setAttribute("aria-label", "Entity map path");
    const back = button("planner-type-crumb");
    back.append(icon("layers"), element("span", "", "Entity map"));
    back.addEventListener("click", () => this.show(""));
    const caret = icon("chevron");
    caret.classList.add("planner-type-caret");
    const current = element("span", "planner-type-crumb current");
    current.setAttribute("aria-current", "page");
    current.append(typeMark(this.type, this.meta), element("span", "", label));
    crumbs.append(back, caret, current);

    const { templates, samples } = this.getQuestions(this.type);
    const choices = [...templates.map((item) => ({ item, personalized: questionParameters(item.template).length > 0 })),
      ...samples.map((item) => ({ item, personalized: false }))];
    const head = element("div", "planner-type-head");
    const title = element("div", "planner-type-head-title");
    title.append(typeMark(this.type, this.meta), element("span", "", label));
    head.append(title, element("p", "", `${choices.length} question${choices.length === 1 ? "" : "s"} about ${label.toLowerCase()} in the catalog`));
    view.append(crumbs, head);
    if (!choices.length) view.append(element("p", "planner-type-empty", "No catalog questions mention this type yet."));

    const groups = new Map();
    for (const choice of choices) {
      const name = heading(choice.item.category);
      groups.set(name, [...(groups.get(name) || []), choice]);
    }
    for (const [name, list] of groups) {
      const group = element("div", "planner-type-group");
      group.append(element("span", "", name), element("span", "planner-type-count", String(list.length)));
      view.append(group);
      for (const { item, personalized } of list) {
        const row = button("planner-type-question");
        row.title = item.template || item.question;
        row.append(icon("help"), questionText(item.question));
        row.addEventListener("click", () => this.onChoose(item, personalized));
        view.append(row);
      }
    }
    return view;
  }
}
