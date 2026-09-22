import { assistQuestions, assistParameter, resolveAssistQuestion } from "./planner-assist-search.js";
import { searchEntities } from "./planner-discovery.js";
import { icon } from "./ui-controls.js";
import "./planner-assist.css";

const title = value => String(value).replace(/[_-]+/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()).replace(/\bApi\b/g, "API");
const element = (tag, className = "", text = "") => {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
};
function button(text, onClick, className = "") {
  const node = document.createElement("button");
  node.type = "button";
  node.className = className;
  node.textContent = text;
  node.addEventListener("click", onClick);
  return node;
}

/** A catalog-backed assistant. It prepares drafts; it never submits a graph query. */
export class PlannerAssist {
  constructor({ root, trigger, getData, loadEntities, retryGraph, onUse }) {
    this.getData = getData;
    this.loadEntities = loadEntities;
    this.retryGraph = retryGraph;
    this.onUse = onUse;
    this.trigger = trigger;
    this.layer = "";
    this.limit = 8;
    this.version = 0;
    this.values = {};
    this.fields = [];
    this.dialog = document.createElement("dialog");
    this.dialog.id = "planner-assist-dialog";
    this.dialog.className = "planner-assist";
    this.dialog.setAttribute("aria-labelledby", "planner-assist-title");
    this.dialog.setAttribute("aria-describedby", "planner-assist-description");
    this.dialog.innerHTML = `
      <header class="planner-assist-header"><div><h2 id="planner-assist-title">Question Assist</h2><p id="planner-assist-description">Find a catalog question. I’ll help you fill in the details.</p></div><button type="button" data-assist-close aria-label="Close Question Assist"></button></header>
      <div class="planner-assist-scroll">
        <section data-assist-browse>
          <label class="planner-assist-search-label" for="planner-assist-search">What would you like to explore?</label>
          <div class="planner-assist-search"><input id="planner-assist-search" type="search" placeholder="Try “what depends on a database?”" autocomplete="off"><button type="button" data-assist-find>Find Questions</button></div>
          <div class="planner-assist-topics" aria-label="Suggested topics"></div>
          <div class="planner-assist-filters" role="group" aria-label="Filter questions by layer"></div>
          <p class="planner-assist-status" role="status" aria-live="polite"></p>
          <div class="planner-assist-results"></div>
          <button type="button" class="planner-assist-more" data-assist-more>Show More Questions</button>
        </section>
        <section data-assist-setup hidden>
          <button type="button" class="planner-assist-back" data-assist-back>← Back to Questions</button>
          <p class="planner-assist-template"></p>
          <p class="planner-assist-guidance"></p>
          <div class="planner-assist-fields"></div>
          <div class="planner-assist-preview"><strong>Question Preview</strong><p></p></div>
        </section>
      </div>
      <footer class="planner-assist-footer"><span data-assist-note></span><button type="button" class="planner-assist-use" hidden>Use Question</button></footer>`;
    root.append(this.dialog);
    const q = selector => this.dialog.querySelector(selector);
    this.search = q("#planner-assist-search");
    this.browse = q("[data-assist-browse]");
    this.setup = q("[data-assist-setup]");
    this.status = q(".planner-assist-status");
    this.results = q(".planner-assist-results");
    this.more = q("[data-assist-more]");
    this.fieldList = q(".planner-assist-fields");
    this.preview = q(".planner-assist-preview p");
    this.use = q(".planner-assist-use");
    this.note = q("[data-assist-note]");
    this.guidance = q(".planner-assist-guidance");
    this.template = q(".planner-assist-template");
    q("[data-assist-close]").append(icon("close"));
    q("[data-assist-close]").addEventListener("click", () => this.dialog.close());
    this.dialog.addEventListener("close", () => {
      this.version++;
      trigger.setAttribute("aria-expanded", "false");
    });
    q("[data-assist-back]").addEventListener("click", () => { this.showBrowse(); this.search.focus(); });
    const search = () => { this.limit = 8; this.renderResults(); };
    this.search.addEventListener("input", search);
    this.search.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); search(); this.results.querySelector("button")?.focus(); } });
    q("[data-assist-find]").addEventListener("click", () => { search(); this.results.querySelector("button")?.focus(); });
    for (const [name, query] of [["Ownership", "who owns"], ["Dependencies", "depends"], ["Data & PII", "PII"], ["Blast Radius", "blast radius"]]) {
      q(".planner-assist-topics").append(button(name, () => { this.search.value = query; search(); }));
    }
    for (const layer of ["", "business", "api", "runtime"]) {
      const filter = button(layer ? title(layer) : "All Layers", () => { this.layer = layer; search(); });
      filter.dataset.layer = layer;
      q(".planner-assist-filters").append(filter);
    }
    this.more.addEventListener("click", () => { this.limit += 8; this.renderResults(); });
    this.use.addEventListener("click", () => {
      const result = this.resolve();
      if (!result.complete) { this.fields.find(field => result.errors[field.spec.parameter])?.input.focus(); return; }
      this.dialog.close();
      onUse(result);
    });
    trigger.prepend(icon("catalog"));
  }

  open(draft = "") {
    this.data = this.getData();
    this.layer = "";
    this.search.value = draft;
    this.showBrowse();
    this.dialog.showModal();
    this.trigger.setAttribute("aria-expanded", "true");
    const template = this.data.catalog?.templates.find(item => item.question === draft);
    if (template) this.choose(template);
    else this.search.focus();
  }

  refresh() {
    if (!this.dialog.open) return;
    this.data = this.getData();
    this.showBrowse();
  }

  showBrowse() {
    this.version++;
    this.browse.hidden = false;
    this.setup.hidden = true;
    this.use.hidden = true;
    this.limit = 8;
    this.renderResults();
  }

  renderResults() {
    this.results.replaceChildren();
    this.dialog.querySelectorAll("[data-layer]").forEach(node => node.setAttribute("aria-pressed", String(node.getAttribute("data-layer") === this.layer)));
    const catalog = this.data.catalog;
    const items = assistQuestions(catalog, this.search.value, this.layer);
    this.status.textContent = !catalog ? "The question catalog is loading or unavailable for this dataset. Try again once it is ready."
      : !items.length ? "No catalog questions match. Try fewer words, a suggested topic, or another layer."
      : `${items.length} catalog questions · showing ${Math.min(items.length, this.limit)}. Choose one to continue.`;
    this.note.textContent = `From ${this.data.graphName} · catalog suggestions, not generated answers.`;
    for (const item of items.slice(0, this.limit)) {
      const row = button("", () => this.choose(item), "planner-assist-question");
      row.append(element("span", "", item.question), element("small", "", `${title(item.layer)} · ${title(item.category)} · ${item.parameters.length ? `${item.parameters.length} ${item.parameters.length === 1 ? "value" : "values"} to fill` : "Ready to use"}`));
      this.results.append(row);
    }
    this.more.hidden = items.length <= this.limit;
    if (!items.length && catalog) this.results.append(button("Browse All Questions", () => { this.search.value = ""; this.layer = ""; this.renderResults(); }));
  }

  choose(item) {
    this.version++;
    this.data = this.getData();
    this.item = item;
    this.values = {};
    this.fields = [];
    this.fieldList.replaceChildren();
    this.browse.hidden = true;
    this.setup.hidden = false;
    this.use.hidden = false;
    this.template.textContent = item.question;
    this.preview.textContent = item.question;
    const parameters = item.parameters || assistQuestions({ templates: [item] })[0].parameters;
    this.guidance.textContent = parameters.length ? "Fill in the values below. Entity suggestions come from your active graph; exact IDs are kept with the question." : "This catalog question is ready. Add it to your draft, then review and run.";
    this.note.textContent = "Use Question replaces your draft. Nothing runs until you send it.";
    if (parameters.length && !this.data.meta) {
      this.guidance.textContent = "The graph’s entity catalog is not ready. Load it before filling in this question.";
      const version = this.version;
      this.fieldList.append(button("Retry Loading Entities", async () => { await this.retryGraph(); this.data = this.getData(); if (version === this.version && this.dialog.open) this.choose(item); }));
      this.use.disabled = true;
      return;
    }
    parameters.forEach(parameter => this.addField(assistParameter(parameter, this.data.catalog.definitions, this.data.meta)));
    this.updatePreview();
    (this.fields[0]?.input || this.use).focus();
  }

  addField(spec) {
    const field = element("div", "planner-assist-field");
    const label = element("label", "", title(spec.parameter));
    const input = document.createElement("input");
    input.id = `planner-assist-value-${spec.parameter}`;
    input.type = spec.numeric ? "number" : "text";
    input.autocomplete = "off";
    if (spec.numeric) { input.min = "0"; input.step = "1"; }
    input.placeholder = spec.types.length ? "Search by name or exact ID…" : spec.numeric ? "Number of hops" : "Enter a value…";
    label.htmlFor = input.id;
    const hint = element("p", "planner-assist-hint", spec.description);
    hint.id = `${input.id}-hint`;
    const error = element("p", "planner-assist-error");
    error.id = `${input.id}-error`;
    input.setAttribute("aria-describedby", `${hint.id} ${error.id}`);
    const choices = element("div", "planner-assist-entities");
    const selected = element("div", "planner-assist-selected");
    const model = { spec, input, choices, selected, error, entities: null, loading: false, failed: false };
    this.fields.push(model);
    input.addEventListener("input", () => {
      if (!spec.types.length) this.values[spec.parameter] = input.value;
      else if (!spec.multiple) delete this.values[spec.parameter];
      this.renderSelected(model);
      this.updatePreview();
      if (spec.types.length) this.renderEntities(model);
    });
    input.addEventListener("focus", () => { if (spec.types.length) this.showEntities(model); });
    input.addEventListener("keydown", event => {
      if (event.key === "ArrowDown") { event.preventDefault(); choices.querySelector("button")?.focus(); }
    });
    field.addEventListener("focusout", event => {
      if (!field.contains(event.relatedTarget)) choices.hidden = true;
    });
    field.append(label, hint, selected, input, choices, error);
    this.fieldList.append(field);
  }

  async showEntities(field) {
    field.choices.hidden = false;
    if (field.entities) { this.renderEntities(field); return; }
    if (field.loading) return;
    const version = this.version;
    field.loading = true;
    field.failed = false;
    field.choices.replaceChildren(element("p", "planner-assist-hint", "Loading graph entities…"));
    try {
      const catalogs = await Promise.all(field.spec.types.map(type => this.loadEntities(type)));
      if (version !== this.version || !this.dialog.open) return;
      field.entities = catalogs.flat();
      this.renderEntities(field);
    } catch {
      if (version !== this.version || !this.dialog.open) return;
      field.failed = true;
      field.choices.replaceChildren(element("p", "planner-assist-error", "Could not load graph entities."), button("Retry Entity Search", () => this.showEntities(field)));
    } finally { field.loading = false; }
  }

  renderEntities(field) {
    if (!field.entities) { if (!field.loading) this.showEntities(field); return; }
    field.choices.hidden = false;
    field.choices.replaceChildren();
    const selected = this.values[field.spec.parameter];
    const selectedIds = new Set(Array.isArray(selected) ? selected.map(entity => entity.id) : []);
    const matches = searchEntities(field.entities, field.input.value).filter(entity => !selectedIds.has(entity.id));
    field.choices.append(element("p", "planner-assist-hint", matches.length ? `${matches.length} matches${matches.length > 5 ? " · showing 5; type to narrow" : ""}` : "No matching entities. Try another name or ID."));
    matches.slice(0, 5).forEach(entity => {
      const choice = button("", () => {
        this.values[field.spec.parameter] = field.spec.multiple ? [...(this.values[field.spec.parameter] || []), entity] : entity;
        field.input.value = field.spec.multiple ? "" : entity.name || entity.id;
        this.renderSelected(field);
        this.updatePreview();
        field.input.focus();
        if (field.spec.multiple) this.renderEntities(field);
        else field.choices.hidden = true;
      });
      choice.append(element("span", "", entity.name || entity.id), element("small", "", `${title(entity.type)} · ${entity.id}`));
      field.choices.append(choice);
    });
  }

  renderSelected(field) {
    field.selected.replaceChildren();
    const value = this.values[field.spec.parameter];
    const entities = Array.isArray(value) ? value : value && typeof value === "object" ? [value] : [];
    entities.forEach(entity => {
      const chip = button(`${entity.name || entity.id} ×`, () => {
        if (field.spec.multiple) this.values[field.spec.parameter] = entities.filter(item => item.id !== entity.id);
        else { delete this.values[field.spec.parameter]; field.input.value = ""; }
        this.renderSelected(field); this.updatePreview(); field.input.focus();
      });
      chip.title = entity.id;
      chip.setAttribute("aria-label", `Remove ${entity.name || entity.id}`);
      field.selected.append(chip);
    });
  }

  resolve() { return resolveAssistQuestion(this.item.question, this.values, this.data.catalog.definitions, this.data.meta || {}); }

  updatePreview() {
    const result = this.resolve();
    this.preview.textContent = result.question;
    this.use.disabled = !result.complete;
    for (const field of this.fields) {
      const message = result.errors[field.spec.parameter];
      field.error.textContent = message || "";
      field.input.setAttribute("aria-invalid", String(Boolean(message)));
    }
  }
}
