import { icon } from "./ui-controls.js";
import { parameterTypes, searchEntities } from "./planner-discovery.js";
import { entityTypeLabel, typeMark } from "./planner-entity-map.js";
import { placeholderProse } from "./planner-questions.js";

const LIMIT = 50;

function element(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/**
 * Sigma's entity picker for question placeholders. It opens under a composer token,
 * lists that placeholder's entities, and hands the choice back to fill the token.
 */
export class PlannerSlotPicker {
  constructor({ getContext, loadEntities, onPick }) {
    this.getContext = getContext;
    this.loadEntities = loadEntities;
    this.onPick = onPick;
    this.popover = null;
    this.token = null;
    this.name = "";
    this.sorted = new Map();
    this.request = 0;
    document.addEventListener("pointerdown", (event) => {
      if (this.popover && event.target instanceof Node && !this.popover.contains(event.target) && !this.token?.contains(event.target)) this.close();
    });
    window.addEventListener("resize", () => this.position());
  }

  typesFor(name) {
    const { definitions, meta } = this.getContext();
    return parameterTypes(name, definitions || {}, meta || {}).filter((type) => meta?.counts?.[type]);
  }

  /** @param {HTMLElement} token */
  open(token) {
    const name = token.dataset.token || "";
    const types = this.typesFor(name);
    if (!types.length) return;
    this.close();
    this.token = token;
    this.name = name;
    token.classList.add("is-open");
    token.setAttribute("aria-expanded", "true");
    const popover = element("div", "planner-slot-picker");
    popover.setAttribute("role", "dialog");
    popover.setAttribute("aria-label", `Choose ${placeholderProse(name)}`);
    this.header = element("div", "slot-picker-header");
    const search = element("label", "slot-picker-search");
    this.search = /** @type {HTMLInputElement} */ (element("input"));
    this.search.type = "search";
    this.search.autocomplete = "off";
    search.append(icon("search"), this.search);
    this.list = element("div", "slot-picker-list");
    this.list.setAttribute("role", "listbox");
    this.footer = element("div", "slot-picker-footer");
    popover.append(this.header, search, this.list, this.footer);
    popover.addEventListener("keydown", (event) => this.onKey(event));
    document.querySelector("#app")?.append(popover);
    this.popover = popover;
    if (types.length === 1) this.showEntities(types[0], null);
    else this.showTypes(types);
  }

  close() {
    this.request++;
    this.popover?.remove();
    this.popover = null;
    this.token?.classList.remove("is-open");
    this.token?.setAttribute("aria-expanded", "false");
  }

  position() {
    if (!this.popover || !this.token) return;
    const rect = this.token.getBoundingClientRect();
    const width = Math.min(Math.max(320, Math.round(rect.width)), window.innerWidth - 16);
    const height = this.popover.offsetHeight;
    const below = window.innerHeight - rect.bottom - 8;
    this.popover.style.width = `${width}px`;
    this.popover.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
    this.popover.style.top = `${below >= Math.min(height, 320) || below >= rect.top ? rect.bottom + 6 : Math.max(8, rect.top - height - 6)}px`;
  }

  options(rows, onChoose) {
    this.list.replaceChildren(...rows.map((row, index) => {
      const option = element("button", "slot-picker-option");
      option.type = "button";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(index === 0));
      const text = element("span", "slot-picker-option-text");
      text.append(element("span", "slot-picker-option-label", row.label));
      if (row.description) text.append(element("span", "slot-picker-option-description", row.description));
      option.append(row.mark, text);
      if (row.meta) option.append(element("span", "slot-picker-option-meta", row.meta));
      option.addEventListener("pointerdown", (event) => event.preventDefault());
      option.addEventListener("click", () => onChoose(row.value));
      return option;
    }));
    this.position();
  }

  empty(message) {
    this.list.replaceChildren(element("p", "slot-picker-empty", message));
    this.position();
  }

  showTypes(types) {
    const { meta } = this.getContext();
    this.header.hidden = true;
    this.footer.hidden = true;
    this.search.value = "";
    this.search.placeholder = "Search entity types";
    const draw = () => {
      const query = this.search.value.trim().toLowerCase();
      const rows = types.filter((type) => entityTypeLabel(type).toLowerCase().includes(query))
        .map((type) => ({ value: type, label: entityTypeLabel(type), meta: (meta?.counts?.[type] || 0).toLocaleString(), mark: typeMark(type, meta) }));
      if (rows.length) this.options(rows, (type) => this.showEntities(type, types));
      else this.empty("No entity types match");
    };
    this.search.oninput = draw;
    draw();
    this.search.focus();
  }

  async showEntities(type, types) {
    const { meta } = this.getContext();
    const request = ++this.request;
    const label = entityTypeLabel(type);
    this.header.hidden = false;
    this.header.classList.toggle("no-back", !types);
    this.header.replaceChildren();
    if (types) {
      const back = element("button", "slot-picker-back");
      back.type = "button";
      back.setAttribute("aria-label", "Back to entity types");
      back.append(icon("caret-left"));
      back.addEventListener("click", () => this.showTypes(types));
      this.header.append(back);
    }
    this.header.append(typeMark(type, meta), element("span", "slot-picker-title", label), element("span", "slot-picker-count", (meta?.counts?.[type] || 0).toLocaleString()));
    this.search.value = "";
    this.search.placeholder = `Search ${label.toLowerCase()}s`;
    this.search.oninput = null;
    this.footer.hidden = true;
    this.empty(`Loading ${label.toLowerCase()}s…`);
    this.search.focus();
    let entities;
    try {
      if (!this.sorted.has(type)) this.sorted.set(type, [...await this.loadEntities(type)].sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id))));
      entities = this.sorted.get(type);
    } catch (error) {
      if (request === this.request) this.empty(error instanceof Error ? error.message : "Entities could not be loaded.");
      return;
    }
    if (request !== this.request) return;
    const draw = () => {
      const matches = this.search.value.trim() ? searchEntities(entities, this.search.value) : entities;
      const shown = matches.slice(0, LIMIT);
      if (!shown.length) this.empty(`No matching ${label.toLowerCase()}s`);
      else this.options(shown.map((entity) => ({ value: entity, label: String(entity.name || entity.id), description: String(entity.id), mark: typeMark(type, meta) })), (entity) => this.pick({ ...entity, type: entity.type || type }));
      this.footer.hidden = matches.length <= shown.length;
      this.footer.textContent = `Showing ${shown.length} of ${matches.length.toLocaleString()}. Keep typing to narrow.`;
      this.position();
    };
    this.search.oninput = draw;
    draw();
  }

  pick(entity) {
    const token = this.token;
    this.close();
    if (token) this.onPick(token, entity);
  }

  onKey(event) {
    const options = /** @type {HTMLElement[]} */ ([...this.list.querySelectorAll(".slot-picker-option")]);
    const current = options.findIndex((option) => option.getAttribute("aria-selected") === "true");
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      const token = this.token;
      this.close();
      token?.focus();
    } else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && options.length) {
      event.preventDefault();
      const next = (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
      options.forEach((option, index) => option.setAttribute("aria-selected", String(index === next)));
      options[next].scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter" && options[Math.max(0, current)] && event.target === this.search) {
      event.preventDefault();
      options[Math.max(0, current)].click();
    }
  }
}
