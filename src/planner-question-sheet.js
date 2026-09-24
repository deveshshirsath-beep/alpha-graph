import { icon } from "./ui-controls.js";
import { entityTypeLabel } from "./planner-entity-map.js";
import { placeholderProse, questionTypeLabel } from "./planner-questions.js";
import { questionParameters } from "./planner-discovery.js";

const ACRONYMS = { api: "API", http: "HTTP", pci: "PCI", pii: "PII", sla: "SLA", id: "ID" };

function element(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/** "{business_area_or_domain}" labels its field "Business area or domain". */
function fieldLabel(name) {
  const words = name.split("_").map((word) => ACRONYMS[word] || word).join(" ");
  return words[0].toUpperCase() + words.slice(1);
}

/**
 * The Questions page's side sheet. A question with parameters collects its values here,
 * then Ask AI hands the filled question to chat and Copy puts its text on the clipboard.
 */
export class PlannerQuestionSheet {
  /**
   * @param {{ root: HTMLElement, typesFor: (name: string) => string[], markFor: (type: string) => Element,
   *   describe: (name: string) => string, openPicker: (field: HTMLElement) => void,
   *   onAsk: (item: any, values: Map<string, { entity?: any, text?: string }>) => void, onClose?: () => void }} options
   */
  constructor({ root, typesFor, markFor, describe, openPicker, onAsk, onClose = () => {} }) {
    this.root = root;
    this.typesFor = typesFor;
    this.markFor = markFor;
    this.describe = describe;
    this.openPicker = openPicker;
    this.onAsk = onAsk;
    this.onClose = onClose;
    this.item = null;
    /** @type {string[]} */
    this.params = [];
    /** @type {Map<string, { entity?: any, text?: string }>} */
    this.values = new Map();
    this.question = /** @type {HTMLElement} */ (root.querySelector(".qb-sheet-question"));
    this.meta = /** @type {HTMLElement} */ (root.querySelector(".qb-sheet-meta"));
    this.fields = /** @type {HTMLElement} */ (root.querySelector(".qb-sheet-params"));
    this.ask = /** @type {HTMLButtonElement} */ (root.querySelector(".qb-sheet-ask"));
    this.copy = /** @type {HTMLButtonElement} */ (root.querySelector(".qb-sheet-copy"));
    root.querySelector(".qb-sheet-close")?.addEventListener("click", () => this.close());
    this.ask.addEventListener("click", () => { if (this.item && this.complete()) this.onAsk(this.item, new Map(this.values)); });
    this.copy.addEventListener("click", () => this.copyText());
    root.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      this.close();
    });
  }

  get isOpen() {
    return !this.root.hidden;
  }

  /**
   * @param {any} item a catalog question: `template` keeps its placeholders
   * @param {Map<string, { entity?: any, text?: string }>} [prefill] values already known, such as the entity being browsed
   */
  open(item, prefill = new Map()) {
    this.item = item;
    this.params = questionParameters(item.template || item.question);
    this.values = new Map([...prefill].filter(([name]) => this.params.includes(name)));
    this.root.hidden = false;
    const type = element("span", "qb-sheet-type");
    if (item.anchor) type.append(this.markFor(item.anchor), element("span", "", entityTypeLabel(item.anchor)));
    this.meta.replaceChildren(...(item.anchor ? [type] : []), element("span", "qb-tag", questionTypeLabel(item.category)));
    this.fields.replaceChildren(...this.params.map((name) => this.field(name)));
    this.update();
    this.root.querySelector(".qb-sheet-body")?.scrollTo({ top: 0 });
    this.nextField()?.focus({ preventScroll: true });
  }

  close() {
    if (!this.isOpen) return;
    this.root.hidden = true;
    this.item = null;
    this.onClose();
  }

  field(name) {
    const wrap = element("div", "qb-param");
    const id = `qb-param-${name}`;
    const label = element("label", "qb-param-label", fieldLabel(name));
    label.htmlFor = id;
    wrap.append(label);
    if (this.typesFor(name).length) {
      const trigger = element("button", "qb-param-field");
      trigger.id = id;
      /** @type {HTMLButtonElement} */ (trigger).type = "button";
      trigger.dataset.token = name;
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.setAttribute("aria-expanded", "false");
      trigger.addEventListener("click", () => this.openPicker(trigger));
      this.paint(trigger);
      wrap.append(trigger);
    } else {
      const input = /** @type {HTMLInputElement} */ (element("input", "qb-param-input"));
      input.id = id;
      input.type = "text";
      input.autocomplete = "off";
      input.dataset.token = name;
      input.placeholder = name.endsWith("_set") ? "Two or more IDs, separated by commas" : `Enter ${placeholderProse(name)}`;
      input.value = this.values.get(name)?.text || "";
      input.addEventListener("input", () => {
        const value = input.value.trim();
        if (value) this.values.set(name, { text: value });
        else this.values.delete(name);
        this.update();
      });
      input.addEventListener("keydown", (event) => { if (event.key === "Enter" && this.complete()) this.ask.click(); });
      wrap.append(input);
      const hint = this.describe(name);
      if (hint) wrap.append(element("p", "qb-param-hint", hint));
    }
    return wrap;
  }

  /** @param {HTMLElement} trigger */
  paint(trigger) {
    const name = trigger.dataset.token || "";
    const entity = this.values.get(name)?.entity;
    const types = this.typesFor(name);
    const lead = (entity?.type || types.length === 1) ? this.markFor(entity?.type || types[0]) : icon("entity");
    lead.classList.add("qb-param-mark");
    const text = element("span", "qb-param-value", entity ? String(entity.name || entity.id) : `Choose ${placeholderProse(name)}`);
    const caret = icon("chevron");
    caret.classList.add("qb-param-caret");
    trigger.replaceChildren(lead, text, caret);
    trigger.classList.toggle("is-empty", !entity);
    trigger.title = entity ? `${entity.name || entity.id} · ${entity.id}` : "";
  }

  /** Fills an entity field from the picker and moves on to the next empty one. */
  fill(trigger, entity) {
    this.values.set(trigger.dataset.token || "", { entity });
    this.paint(trigger);
    this.update();
    (this.nextField() || this.ask).focus({ preventScroll: true });
  }

  nextField() {
    return /** @type {HTMLElement | undefined} */ ([...this.fields.querySelectorAll("[data-token]")]
      .find((field) => !this.values.has(/** @type {HTMLElement} */ (field).dataset.token || "")));
  }

  complete() {
    return this.params.every((name) => this.values.has(name));
  }

  /** The question as it will be asked: chosen names in place of their placeholders. */
  text() {
    return String(this.item?.template || this.item?.question || "").replace(/\{([a-z][a-z0-9_]*)\}/g, (placeholder, name) => {
      const value = this.values.get(name);
      return value ? String(value.entity ? value.entity.name || value.entity.id : value.text) : placeholderProse(name);
    });
  }

  update() {
    this.question.replaceChildren();
    String(this.item?.template || this.item?.question || "").split(/(\{[a-z][a-z0-9_]*\})/).forEach((part, index) => {
      if (!(index % 2)) { this.question.append(document.createTextNode(part)); return; }
      const name = part.slice(1, -1);
      const value = this.values.get(name);
      const slot = element("span", `qb-sheet-slot${value ? " is-filled" : ""}`,
        value ? String(value.entity ? value.entity.name || value.entity.id : value.text) : placeholderProse(name));
      this.question.append(slot);
    });
    const missing = this.params.filter((name) => !this.values.has(name)).length;
    this.ask.disabled = missing > 0;
    this.ask.title = missing ? `Choose ${missing} more value${missing === 1 ? "" : "s"} first` : "Ask AI in chat";
  }

  async copyText() {
    const label = this.copy.getAttribute("aria-label") || "";
    try {
      await navigator.clipboard.writeText(this.text());
      this.copy.replaceChildren(icon("check"));
      this.copy.title = "Copied";
    } catch {
      this.copy.title = "Copy failed";
    }
    window.setTimeout(() => { this.copy.replaceChildren(icon("copy")); this.copy.title = label; }, 1400);
  }
}
