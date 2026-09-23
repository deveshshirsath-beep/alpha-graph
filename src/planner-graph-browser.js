import { relationshipsForType, searchEntities } from "./planner-discovery.js";
import { safeCssColor } from "./sanitize.js";
import { SearchDropdown } from "./search-dropdown.js";
import { icon } from "./ui-controls.js";

const label = (value) => String(value).replaceAll("-", " ").replaceAll("_", " ");
const count = (value) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const element = (tag, className = "", text = "") => {
  const item = document.createElement(tag);
  item.className = className;
  item.textContent = text;
  return item;
};

async function readCatalog(url, signal) {
  const response = await fetch(url, { signal, credentials: "same-origin" });
  if (!response.ok) throw new Error(`Could not load entities (${response.status})`);
  if (response.headers.get("content-encoding")?.includes("gzip") || !url.endsWith(".gz")) return response.json();
  if (!response.body || typeof DecompressionStream === "undefined") throw new Error("This browser cannot decode compressed entity catalogs.");
  return new Response(response.body.pipeThrough(new DecompressionStream("gzip"))).json();
}

/** Uses the same manifest and on-demand entity catalogs as the V2 viewer. */
export class PlannerGraphBrowser {
  constructor({ onChange }) {
    const q = (selector) => document.querySelector(selector);
    this.onChange = onChange;
    this.typeSelect = /** @type {HTMLSelectElement} */ (q("#planner-browse-type"));
    this.search = /** @type {HTMLInputElement} */ (q("#planner-browse-search"));
    this.results = q("#planner-browse-results");
    this.relationships = q("#planner-browse-relationships");
    this.status = q("#planner-browse-status");
    this.entityCount = q("#planner-browse-count");
    this.relationCount = q("#planner-browse-relation-count");
    this.meta = null;
    this.manifest = null;
    this.manifestUrl = "";
    this.entryId = "";
    this.type = "";
    this.entity = null;
    this.relationship = "";
    this.cache = new Map();
    this.limit = 6;
    this.request = 0;
    this.controller = new AbortController();
    this.typeSelect.addEventListener("change", () => this.selectType(this.typeSelect.value));
    this.search.addEventListener("input", () => { this.limit = 6; this.renderResults(); });
    this.dropdown = new SearchDropdown({ input: this.search, button: q("#planner-browse-dropdown"), label: "Entity suggestions",
      getOptions: query => {
        if (!this.meta) return [];
        if (!this.type) return Object.keys(this.meta.counts).filter(type => label(type).toLowerCase().includes(label(query).toLowerCase().trim()))
          .map(type => ({ label: label(type), detail: `${count(this.meta.counts[type])} entities · choose type`, type }));
        return searchEntities(this.cache.get(this.type) || [], query).map(entity => ({ label: entity.name || entity.id, detail: entity.id, entity }));
      },
      onSelect: async option => {
        if (option.entity) { this.entity = option.entity; this.notify(); this.renderResults(); }
        else {
          await this.selectType(option.type);
          if (this.type === option.type && document.activeElement === this.search) this.dropdown.open();
        }
      },
      emptyMessage: () => this.type && !this.cache.has(this.type) ? "Loading entities…" : "No matching entities or types.",
    });
    q("#planner-browse-reset").addEventListener("click", () => this.clear());
  }

  notify() { this.onChange({ type: this.type, entity: this.entity, relationship: this.relationship }, this.meta); }

  async load(entry) {
    if (this.entryId === entry?.id && this.manifest) return;
    this.controller.abort();
    this.controller = new AbortController();
    const signal = this.controller.signal;
    this.entryId = entry?.id || "";
    this.manifest = this.meta = null;
    this.cache.clear();
    this.clear();
    this.typeSelect.disabled = this.search.disabled = true;
    this.typeSelect.replaceChildren(new Option("Loading entity types…", ""));
    this.status.textContent = "Loading graph schema…";
    try {
      if (!entry?.manifest) throw new Error("No graph manifest is registered for this dataset.");
      this.manifestUrl = new URL(entry.manifest, new URL("/graph-data/", location.href)).href;
      const response = await fetch(this.manifestUrl, { signal });
      if (!response.ok) throw new Error(`Could not load graph schema (${response.status})`);
      const manifest = await response.json();
      if (signal.aborted) return;
      if (!manifest.meta?.counts || !manifest.catalogChunks) throw new Error("This dataset has no searchable entity catalog.");
      this.manifest = manifest;
      this.meta = manifest.meta;
      this.typeSelect.replaceChildren(new Option("All entity types", ""));
      Object.keys(this.meta.counts).sort().forEach((type) => this.typeSelect.append(new Option(`${label(type)} · ${count(this.meta.counts[type])}`, type)));
      this.typeSelect.disabled = this.search.disabled = false;
      this.entityCount.textContent = `${Object.keys(this.meta.counts).length} types`;
      this.renderResults();
      this.renderRelationships();
      this.notify();
    } catch (error) {
      if (signal.aborted) return;
      this.status.textContent = error instanceof Error ? error.message : String(error);
      this.typeSelect.replaceChildren(new Option("Entity browser unavailable", ""));
      const retry = element("button", "planner-browse-more", "Retry loading graph");
      retry.addEventListener("click", () => this.load(entry));
      this.results.replaceChildren(retry);
    }
  }

  clear() {
    this.dropdown?.close();
    this.type = "";
    this.entity = null;
    this.relationship = "";
    this.search.value = "";
    this.typeSelect.value = "";
    this.request++;
    this.limit = 6;
    this.renderResults();
    this.renderRelationships();
    this.notify();
  }

  async selectType(type) {
    this.dropdown.close();
    const request = ++this.request;
    this.type = type;
    this.typeSelect.value = type;
    this.entity = null;
    this.search.value = "";
    this.limit = 6;
    if (!relationshipsForType(this.meta || {}, type).some((row) => row.relationship === this.relationship)) this.relationship = "";
    this.notify();
    this.renderRelationships();
    this.renderResults();
    if (!type || this.cache.has(type)) return;
    try {
      await this.entitiesForType(type);
      if (request === this.request) this.renderResults();
    } catch (error) {
      if (error?.name === "AbortError" || request !== this.request) return;
      this.status.textContent = error instanceof Error ? error.message : String(error);
      const retry = element("button", "planner-browse-more", "Retry entity search");
      retry.addEventListener("click", () => this.selectType(type));
      this.results.replaceChildren(retry);
    }
  }

  /** Shared read-only lookup: Assist must not change the sidebar's selection. */
  async entitiesForType(type) {
    if (this.cache.has(type)) return this.cache.get(type);
    const signal = this.controller.signal;
    const manifestUrl = this.manifestUrl;
    const chunk = this.manifest?.catalogChunks[type];
    if (!chunk?.file) throw new Error("No entity catalog is available for this type.");
    const entities = await readCatalog(new URL(chunk.file, manifestUrl).href, signal);
    if (signal.aborted || manifestUrl !== this.manifestUrl) throw new DOMException("Dataset changed", "AbortError");
    if (!Array.isArray(entities)) throw new Error("The entity catalog is not a list.");
    this.cache.set(type, entities);
    return entities;
  }

  marker(type) {
    const dot = element("i", "planner-browse-dot");
    const style = this.meta?.typeStyles?.[type] || {};
    for (const [theme, field] of [["dark", "darkColor"], ["light", "lightColor"], ["ocean", "oceanColor"], ["sunset", "sunsetColor"]]) {
      dot.style.setProperty(`--browse-${theme}`, safeCssColor(style[field] || style.color, "#8185a3"));
    }
    return dot;
  }

  renderResults() {
    this.dropdown?.refresh();
    this.results.replaceChildren();
    this.search.placeholder = this.type ? `Search ${label(this.type).toLowerCase()} names or IDs…` : "Find an entity type…";
    if (!this.meta) { this.entityCount.textContent = "—"; return; }
    if (!this.type) {
      this.status.textContent = "Choose a type to search its entities and questions.";
      const term = this.search.value.toLowerCase().replaceAll("-", " ").trim();
      const types = Object.keys(this.meta.counts).filter((type) => label(type).toLowerCase().includes(term));
      const layers = { ...this.meta.layers };
      const assigned = new Set(Object.values(layers).flat());
      const other = types.filter((type) => !assigned.has(type));
      if (other.length) layers.OTHER = other;
      for (const [layer, members] of Object.entries(layers)) {
        const visible = /** @type {string[]} */ (members).filter((type) => types.includes(type));
        if (!visible.length) continue;
        const group = element("details", "planner-browse-layer");
        group.open = Boolean(term);
        const summary = element("summary");
        summary.append(element("span", "", `${({ BUSINESS: "Business", API: "API", RUNTIME: "Runtime", OTHER: "Other" })[layer] || label(layer)} Layer`), element("small", "", `${visible.length}`));
        group.append(summary);
        visible.forEach((type) => {
          const button = element("button", "planner-browse-type");
          button.type = "button";
          button.append(this.marker(type), element("span", "", label(type)), element("small", "", count(this.meta.counts[type])));
          button.addEventListener("click", () => this.selectType(type));
          group.append(button);
        });
        this.results.append(group);
      }
      if (!types.length) this.status.textContent = "No entity types match. Clear the search to browse all types.";
      return;
    }
    if (!this.cache.has(this.type)) { this.status.textContent = `Loading ${label(this.type).toLowerCase()} entities…`; return; }
    const entries = searchEntities(this.cache.get(this.type), this.search.value);
    const visible = entries.slice(0, this.limit);
    this.status.textContent = entries.length ? `${visible.length} of ${entries.length.toLocaleString()} entities · select to personalize questions` : "No entities match this name or ID.";
    for (const entity of visible) {
      const button = element("button", `planner-browse-entity${entity.id === this.entity?.id ? " active" : ""}`);
      button.type = "button";
      button.title = `${entity.name || entity.id}\n${entity.id}`;
      button.setAttribute("aria-pressed", String(entity.id === this.entity?.id));
      const text = element("span");
      text.append(element("strong", "", entity.name || entity.id), element("small", "", entity.id));
      button.append(this.marker(entity.type), text);
      button.addEventListener("click", () => { this.entity = entity; this.notify(); this.renderResults(); });
      this.results.append(button);
    }
    if (visible.length < entries.length) {
      const more = element("button", "planner-browse-more", `Show more · ${entries.length - visible.length} remaining`);
      more.addEventListener("click", () => { this.limit += 20; this.renderResults(); });
      this.results.append(more);
    }
  }

  renderRelationships() {
    this.relationships.replaceChildren();
    const relationships = relationshipsForType(this.meta || {}, this.type);
    this.relationCount.textContent = String(relationships.length);
    this.relationships.append(element("p", "planner-browse-note", this.type ? "Counts across this entity type, not the selected entity." : "Graph-wide counts from the active dataset."));
    for (const item of relationships) {
      const button = element("button", `planner-browse-type${this.relationship === item.relationship ? " active" : ""}`);
      button.type = "button";
      button.setAttribute("aria-pressed", String(this.relationship === item.relationship));
      button.title = item.signatures.map((row) => `${row.source} → ${row.relationship} → ${row.target} · ${row.count}`).join("\n");
      const relationIcon = element("i", "planner-browse-relation-icon");
      relationIcon.append(icon("arrow-up-right"));
      button.append(relationIcon, element("span", "", label(item.relationship)), element("small", "", count(item.count)));
      button.addEventListener("click", () => { this.relationship = this.relationship === item.relationship ? "" : item.relationship; this.notify(); this.renderRelationships(); });
      this.relationships.append(button);
      if (this.relationship === item.relationship) {
        const paths = element("div", "planner-browse-paths");
        for (const row of item.signatures) paths.append(element("span", "", `${label(row.source)} → ${label(row.target)}`));
        this.relationships.append(paths);
      }
    }
    if (!relationships.length) this.relationships.append(element("p", "planner-browse-note", "No populated relationship signatures for this selection."));
  }
}
