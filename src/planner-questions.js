import { icon } from "./ui-controls.js";
import { entityTypeLabel } from "./planner-entity-map.js";

const LAYERS = { business: "Business", api: "API", runtime: "Runtime" };
const LAYER_ORDER = Object.keys(LAYERS);
/** Each catalog category as the question type shown beside its questions (sigma's group names). */
const QUESTION_TYPES = {
  inventory_and_coverage: "Inventory & Coverage",
  direct_forward_edges: "Connections",
  direct_reverse_edges: "Dependencies",
  top_down_cross_layer: "Business To Execution",
  bottom_up_reverse_lineage: "Business Lineage",
  blast_radius: "Blast Radius",
  top_down_portfolio_and_contract: "Portfolio & Contracts",
  consumer_control_deployment_and_runtime_scope: "Usage & Deployment",
  reverse_contract_and_portfolio_lineage: "API Lineage",
  compound_risk_and_governance: "Risk & Governance",
  top_down_execution_and_data_lineage: "Execution & Data",
  telemetry_and_operational_observation: "Operations & Activity",
};
const ACRONYMS = { api: "API", http: "HTTP", pci: "PCI", pii: "PII", sla: "SLA", id: "ID" };

function heading(value) {
  return String(value || "Other").split(/_+/).filter(Boolean).map((word) => ACRONYMS[word] || word[0].toUpperCase() + word.slice(1)).join(" ");
}

/** A placeholder read as prose: "{business_node}" becomes "a business node". */
export function placeholderProse(name) {
  const words = name.replace(/_set$/, "").split("_").map((word) => ACRONYMS[word] || word).join(" ");
  if (name.endsWith("_set")) return words;
  return `${/^[aeiou]|^(API|HTTP|SLA)\b/i.test(words) ? "an" : "a"} ${words}`;
}

export function appendQuestionProse(host, text) {
  String(text).split(/(\{[a-z][a-z0-9_]*\})/).forEach((part, index) => {
    if (!(index % 2)) { host.append(document.createTextNode(part)); return; }
    const slot = document.createElement("span");
    slot.className = "qb-slot";
    slot.textContent = placeholderProse(part.slice(1, -1));
    host.append(slot);
  });
}

/** "BUSINESS-AREA -[CONTAINS]-> BUSINESS-DOMAIN" becomes "Business Area → Business Domain". */
export function templateRoute(template) {
  const match = String(template?.path || "").match(/^([A-Z][A-Z0-9-]*)\s+-\[[A-Z0-9_-]+\]->\s+([A-Z][A-Z0-9-]*)$/);
  return match ? `${entityTypeLabel(match[1])} → ${entityTypeLabel(match[2])}` : "";
}

/**
 * The Questions page: layer cards, search, and one section of questions per entity type.
 * The sections follow the entity map's order so the map beside them reads as their table of contents.
 */
export class PlannerQuestionBrowser {
  constructor({ root, getQuestions, getOrder, onChoose, onClearFilter = null, onActiveChange = null, onRender = null, markFor = null }) {
    this.root = root;
    this.getQuestions = getQuestions;
    this.getOrder = getOrder;
    this.markFor = markFor;
    this.onChoose = onChoose;
    this.onClearFilter = onClearFilter;
    this.onActiveChange = onActiveChange;
    this.onRender = onRender;
    this.layer = "";
    this.query = "";
    this.filter = null;
    /** @type {string | null} */
    this.active = "";
    this.pinned = false;
    this.unpin = 0;
    this.layers = /** @type {HTMLElement[]} */ ([...root.querySelectorAll(".qb-layer")]);
    this.search = /** @type {HTMLInputElement} */ (root.querySelector(".qb-search input"));
    this.groups = /** @type {HTMLElement} */ (root.querySelector(".qb-groups"));
    this.filterBar = /** @type {HTMLElement} */ (root.querySelector(".qb-filter"));
    this.layers.forEach((card) => card.addEventListener("click", () => this.setLayer(card.dataset.layer || "")));
    this.search.addEventListener("input", () => { this.query = this.search.value.trim().toLowerCase(); this.render(); });
    let frame = 0;
    this.groups.addEventListener("scroll", () => {
      // A jump from the table of contents keeps its entry lit until the scroll settles.
      if (this.pinned) { this.holdPin(); return; }
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; this.spy(); });
    }, { passive: true });
    for (const type of ["wheel", "touchstart", "pointerdown", "keydown"]) this.groups.addEventListener(type, () => { this.pinned = false; }, { passive: true });
  }

  setLayer(layer) {
    this.layer = layer;
    this.render();
  }

  setFilter(filter) {
    this.filter = filter?.type || filter?.entity || filter?.relationship ? filter : null;
    this.render();
  }

  render() {
    this.layers.forEach((card) => {
      const active = (card.dataset.layer || "") === this.layer;
      card.classList.toggle("active", active);
      card.setAttribute("aria-selected", String(active));
    });
    this.renderFilter();
    const rank = new Map(this.getOrder().map((type, index) => [type, index]));
    const groups = new Map();
    for (const choice of this.getQuestions(this.filter)) {
      const { layer, question } = choice.item;
      if (this.layer && layer !== this.layer) continue;
      if (this.query && !question.toLowerCase().replace(/[{}_]/g, " ").includes(this.query)) continue;
      if (!groups.has(choice.anchor)) groups.set(choice.anchor, []);
      groups.get(choice.anchor).push(choice);
    }
    const sorted = [...groups].sort(([a], [b]) => (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity) || a.localeCompare(b));
    this.groups.replaceChildren(...sorted.map(([type, choices]) => this.group(type, choices)));
    if (!groups.size) {
      const empty = document.createElement("p");
      empty.className = "qb-empty";
      empty.textContent = this.filter ? "No questions match this entity. Try another layer or clear the filter." : "No questions match. Try another search or layer.";
      this.groups.append(empty);
    }
    this.groups.scrollTop = 0;
    this.pinned = false;
    this.onRender?.([...groups.keys()]);
    this.active = null;
    this.spy();
  }

  renderFilter() {
    this.filterBar.hidden = !this.filter;
    if (!this.filter) return;
    const label = document.createElement("span");
    label.textContent = `Questions about ${this.filter.entity?.name || (this.filter.type ? entityTypeLabel(this.filter.type) : heading(this.filter.relationship))}`;
    const clear = document.createElement("button");
    clear.type = "button";
    clear.setAttribute("aria-label", "Show all questions");
    clear.title = "Show all questions";
    clear.append(icon("x"));
    clear.addEventListener("click", () => { this.setFilter(null); this.onClearFilter?.(); });
    this.filterBar.replaceChildren(label, clear);
  }

  group(type, choices) {
    const section = document.createElement("section");
    section.className = "qb-group";
    section.dataset.type = type;
    const head = document.createElement("header");
    head.className = "qb-group-head";
    const copy = document.createElement("div");
    const name = document.createElement("h3");
    name.textContent = type ? entityTypeLabel(type) : "Other Questions";
    if (type && this.markFor) name.prepend(this.markFor(type));
    const detail = document.createElement("p");
    const layers = LAYER_ORDER.filter((layer) => choices.some((choice) => choice.item.layer === layer)).map((layer) => LAYERS[layer]);
    detail.textContent = `${layers.join(", ")} · ${choices.length} Question${choices.length === 1 ? "" : "s"}`;
    copy.append(name, detail);
    const meta = document.createElement("span");
    meta.className = "qb-group-meta";
    meta.textContent = "Question Type";
    head.append(copy, meta);
    section.append(head);
    for (const choice of choices) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "qb-question";
      row.title = choice.item.template || choice.item.question;
      const text = document.createElement("span");
      text.className = "qb-question-text";
      appendQuestionProse(text, choice.item.question);
      const kind = document.createElement("span");
      kind.className = "qb-question-type";
      kind.textContent = QUESTION_TYPES[choice.item.category] || heading(choice.item.category);
      const action = document.createElement("span");
      action.className = "qb-question-action";
      action.append(icon("arrow-up-right"));
      row.append(text, kind, action);
      row.addEventListener("click", () => this.onChoose(choice.item, choice.personalized));
      section.append(row);
    }
    return section;
  }

  /** Lights the section being read: the last one whose heading has reached the top quarter of the list. */
  spy() {
    const sections = /** @type {HTMLElement[]} */ ([...this.groups.querySelectorAll(".qb-group")]);
    if (!sections.length) { this.activate(""); return; }
    const { scrollTop, clientHeight, scrollHeight } = this.groups;
    let current = sections[0];
    if (scrollTop > 0 && scrollTop + clientHeight >= scrollHeight - 2) current = sections[sections.length - 1];
    else {
      const line = scrollTop + Math.min(160, clientHeight / 4);
      for (const section of sections) {
        if (section.offsetTop > line) break;
        current = section;
      }
    }
    this.activate(current.dataset.type || "");
  }

  activate(type) {
    if (type === this.active) return;
    this.active = type;
    this.onActiveChange?.(type);
  }

  holdPin() {
    clearTimeout(this.unpin);
    this.unpin = window.setTimeout(() => { this.pinned = false; }, 150);
  }

  /** Scrolls a type's section to the top of the list, as a table-of-contents link does. */
  scrollToType(type) {
    const section = /** @type {HTMLElement[]} */ ([...this.groups.querySelectorAll(".qb-group")]).find((item) => item.dataset.type === type);
    if (!section) return;
    this.pinned = true;
    this.holdPin();
    this.activate(type);
    this.groups.scrollTo({ top: section.offsetTop, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
}
