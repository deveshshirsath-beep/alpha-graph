import { icon, syncDropdowns } from "./ui-controls.js";
import { entityTypeLabel } from "./planner-entity-map.js";

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
const TYPE_ORDER = Object.keys(QUESTION_TYPES);
const ACRONYMS = { api: "API", http: "HTTP", pci: "PCI", pii: "PII", sla: "SLA", id: "ID" };

function heading(value) {
  return String(value || "Other").split(/_+/).filter(Boolean).map((word) => ACRONYMS[word] || word[0].toUpperCase() + word.slice(1)).join(" ");
}

export function questionTypeLabel(category) {
  return QUESTION_TYPES[category] || heading(category);
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

const plural = (count, noun) => `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;
const keyOf = (item) => `${item.template || item.question}\u0000${item.question}`;

function cell(className) {
  const td = document.createElement("td");
  td.className = className;
  return td;
}

/**
 * The Questions page: layer cards over one table of the catalog.
 * Search and the two column filters narrow the same rows, and each control only offers values that still have questions.
 */
export class PlannerQuestionBrowser {
  constructor({ root, getQuestions, getOrder, onChoose, onClearFilter = null, markFor = null }) {
    this.root = root;
    this.getQuestions = getQuestions;
    this.getOrder = getOrder;
    this.markFor = markFor;
    this.onChoose = onChoose;
    this.onClearFilter = onClearFilter;
    /** The chosen layer; none shows every layer. */
    this.layer = "";
    this.query = "";
    this.entityType = "";
    this.questionType = "";
    this.filter = null;
    this.selected = "";
    this.layerCards = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll(".qb-layer")]);
    this.search = /** @type {HTMLInputElement} */ (root.querySelector(".qb-search input"));
    this.entitySelect = /** @type {HTMLSelectElement} */ (root.querySelector(".qb-entity-filter"));
    this.typeSelect = /** @type {HTMLSelectElement} */ (root.querySelector(".qb-type-filter"));
    this.body = /** @type {HTMLElement} */ (root.querySelector(".qb-table tbody"));
    this.scroller = /** @type {HTMLElement} */ (root.querySelector(".qb-table-scroll"));
    this.empty = /** @type {HTMLElement} */ (root.querySelector(".qb-empty"));
    this.count = /** @type {HTMLElement} */ (root.querySelector(".qb-count"));
    this.clear = /** @type {HTMLButtonElement} */ (root.querySelector(".qb-clear"));
    this.filterBar = /** @type {HTMLElement} */ (root.querySelector(".qb-filter"));
    this.layerCards.forEach((card) => card.addEventListener("click", () => {
      const layer = card.dataset.layer || "";
      // Choosing the chosen layer again clears it.
      this.layer = this.layer === layer ? "" : layer;
      this.render();
    }));
    this.search.addEventListener("input", () => { this.query = this.search.value.trim().toLowerCase(); this.render(); });
    this.entitySelect.addEventListener("change", () => { this.entityType = this.entitySelect.value; this.render(); });
    this.typeSelect.addEventListener("change", () => { this.questionType = this.typeSelect.value; this.render(); });
    this.clear.addEventListener("click", () => this.reset());
  }

  setFilter(filter) {
    this.filter = filter?.type || filter?.entity || filter?.relationship ? filter : null;
    this.render();
  }

  reset() {
    this.layer = this.query = this.entityType = this.questionType = "";
    this.search.value = "";
    if (this.filter) { this.filter = null; this.onClearFilter?.(); }
    this.render();
  }

  /** Highlights the row whose parameter sheet is open. */
  setSelected(item) {
    this.selected = item ? keyOf(item) : "";
    for (const row of /** @type {HTMLElement[]} */ ([...this.body.children])) row.classList.toggle("is-selected", row.dataset.key === this.selected);
  }

  render() {
    const rank = new Map(this.getOrder().map((type, index) => [type, index]));
    const choices = this.getQuestions(this.filter).map((choice) => ({
      ...choice,
      text: `${choice.item.question.replace(/[{}_]/g, " ")} ${entityTypeLabel(choice.anchor || "")} ${questionTypeLabel(choice.item.category)}`.toLowerCase(),
    }));
    /** Every filter except the one named, so a control lists what the others leave. */
    const passes = (choice, skip = "") => (skip === "layer" || !this.layer || choice.item.layer === this.layer)
      && (skip === "entity" || !this.entityType || choice.anchor === this.entityType)
      && (skip === "type" || !this.questionType || choice.item.category === this.questionType)
      && (!this.query || choice.text.includes(this.query));
    const rows = choices.filter((choice) => passes(choice))
      .sort((a, b) => (rank.get(a.anchor) ?? Infinity) - (rank.get(b.anchor) ?? Infinity) || String(a.anchor).localeCompare(String(b.anchor)));

    for (const card of this.layerCards) {
      const layer = card.dataset.layer || "";
      card.setAttribute("aria-pressed", String(this.layer === layer));
      const small = card.querySelector(".qb-layer-count");
      if (small) small.textContent = plural(choices.filter((choice) => choice.item.layer === layer && passes(choice, "layer")).length, "question");
    }
    const entityTypes = [...new Set(choices.filter((choice) => choice.anchor && passes(choice, "entity")).map((choice) => choice.anchor))]
      .sort((a, b) => (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity) || a.localeCompare(b));
    const questionTypes = [...new Set(choices.filter((choice) => passes(choice, "type")).map((choice) => choice.item.category))]
      .sort((a, b) => (TYPE_ORDER.indexOf(a) + 1 || Infinity) - (TYPE_ORDER.indexOf(b) + 1 || Infinity));
    this.options(this.entitySelect, "All entity types", entityTypes, entityTypeLabel, this.entityType);
    this.options(this.typeSelect, "All question types", questionTypes, questionTypeLabel, this.questionType);
    syncDropdowns();

    this.renderFilter();
    this.body.replaceChildren(...rows.map((choice) => this.row(choice)));
    this.empty.hidden = rows.length > 0;
    const filtered = this.layer || this.query || this.entityType || this.questionType || this.filter;
    this.count.textContent = filtered ? `${rows.length.toLocaleString()} of ${choices.length.toLocaleString()}` : choices.length.toLocaleString();
    this.clear.hidden = !filtered;
    this.scroller.scrollTop = 0;
  }

  /** Rebuilds a filter's options; a chosen value stays listed even when nothing else leaves it any rows. */
  options(select, allLabel, values, label, chosen) {
    const list = chosen && !values.includes(chosen) ? [...values, chosen] : values;
    select.replaceChildren(new Option(allLabel, ""), ...list.map((value) => new Option(label(value), value)));
    select.value = chosen;
  }

  row({ item, personalized, anchor }) {
    const row = document.createElement("tr");
    row.dataset.key = keyOf(item);
    row.classList.toggle("is-selected", row.dataset.key === this.selected);
    const question = document.createElement("button");
    question.type = "button";
    question.className = "qb-question";
    question.title = item.template || item.question;
    const text = document.createElement("span");
    text.className = "qb-question-text";
    appendQuestionProse(text, item.question);
    question.append(text);
    question.addEventListener("click", () => this.onChoose(item, personalized, anchor));
    const entityLabel = () => {
      const label = document.createElement("span");
      label.className = "qb-entity";
      if (anchor && this.markFor) label.append(this.markFor(anchor));
      label.append(document.createTextNode(anchor ? entityTypeLabel(anchor) : "—"));
      return label;
    };
    const tag = () => {
      const label = document.createElement("span");
      label.className = "qb-kind";
      label.textContent = questionTypeLabel(item.category);
      return label;
    };
    // A narrow table folds its two side columns into this line under the question.
    const meta = document.createElement("span");
    meta.className = "qb-question-meta";
    meta.append(entityLabel(), tag());
    const first = cell("qb-cell-question");
    first.append(question, meta);

    const entity = cell("qb-cell-entity");
    entity.append(entityLabel());

    const kind = cell("qb-cell-type");
    const wrap = document.createElement("span");
    wrap.className = "qb-type";
    const go = icon("arrow-up-right");
    go.classList.add("qb-row-go");
    wrap.append(tag(), go);
    kind.append(wrap);

    row.append(first, entity, kind);
    // The whole row answers a click; the question button is its keyboard stop.
    row.addEventListener("click", (event) => { if (!(event.target instanceof Element && event.target.closest("button"))) question.click(); });
    return row;
  }

  renderFilter() {
    this.filterBar.hidden = !this.filter;
    if (!this.filter) { this.filterBar.replaceChildren(); return; }
    const label = document.createElement("span");
    label.textContent = `About ${this.filter.entity?.name || (this.filter.type ? entityTypeLabel(this.filter.type) : heading(this.filter.relationship))}`;
    const clear = document.createElement("button");
    clear.type = "button";
    clear.setAttribute("aria-label", "Show all questions");
    clear.title = "Show all questions";
    clear.append(icon("x"));
    clear.addEventListener("click", () => { this.setFilter(null); this.onClearFilter?.(); });
    this.filterBar.replaceChildren(label, clear);
  }
}
