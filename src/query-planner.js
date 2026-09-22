import { returnedResultTables, resultNarrative, showResultDiagrams, isScalarCount } from "./planner-results.js";
import { PlannerTypeMap, buildEntityMapRows, entityTypeLabel, typeMark } from "./planner-entity-map.js";
import { PlannerDiagram } from "./planner-diagram.js";
import { chronologicalMessages, messageTimestamp } from "./planner-conversation.js";
import { PlannerGraphBrowser } from "./planner-graph-browser.js";
import { bindQuestion, parameterTypes, parseQuestionCatalog, parseQuestionTemplates, questionAnchor, questionParameters, relevantCatalogQuestions } from "./planner-discovery.js";
import { icon, inlineIllustrations, syncDropdowns } from "./ui-controls.js";
import { SearchDropdown } from "./search-dropdown.js";
import { catalogSearchOptions } from "./search-options.js";
import { PlannerApi, resultPagination } from "./planner-api.js";
import { connectPanelToggle } from "./panel-toggle.js";
import { connectCatalogExpansion } from "./planner-catalog-toggle.js";
import { PlannerQuestionBrowser, appendQuestionProse, templateRoute } from "./planner-questions.js";
import { followSidebarWidth, shareSidebarWidth } from "./sidebar-width.js";
import { PlannerSlotPicker } from "./planner-slot-picker.js";
import { createComposer } from "./planner-composer.js";
import { SAMPLE_PROJECTS } from "./planner-samples.js";
import { workspaceFocus } from "./workspace-focus.js";

const q = (selector, root = document) => root.querySelector(selector);
const qa = (selector, root = document) => [...root.querySelectorAll(selector)];

const planner = q("#planner-workspace");
const viewer = q("main.workspace");

const ui = {
  open: q("#planner-mode-toggle"),
  close: q("#planner-back-to-viewer"),
  graphSelect: q("#graph-select"),
  catalogCount: q("#planner-catalog-count"),
  catalogPanel: q("#planner-catalog-panel"),
  workspacesPanel: q("#planner-workspaces-panel"),
  questionSearch: q("#planner-question-search"),
  questionTree: q("#planner-question-tree"),
  collapseCatalog: q("#planner-collapse-catalog"),
  workspaceTree: q("#planner-workspace-tree"),
  addWorkspace: q("#planner-add-workspace"),
  newChatNav: q("#planner-new-chat-nav"),
  chatScroll: q("#planner-chat-scroll"),
  emptyChat: q("#planner-empty-chat"),
  messages: q("#planner-messages"),
  form: q("#planner-query-form"),
  prompt: q("#planner-prompt"),
  run: q("#planner-run"),
  composerStatus: q("#planner-composer-status"),
  libraryResizer: q("#planner-library-resizer"),
  contextResizer: q("#planner-context-resizer"),
  entityTree: q("#planner-entity-tree"),
  followups: q("#planner-followups"),
};

const state = {
  registry: null,
  graphEntry: null,
  catalog: null,
  workspaces: [],
  activeWorkspaceId: localStorage.getItem("atlas-planner-workspace") || "",
  activeProjectId: localStorage.getItem("atlas-planner-project") || "",
  activeChatId: localStorage.getItem("atlas-planner-chat") || "",
  matchedGraph: null,
  selectedEntityIds: [],
  requestController: null,
  requestContext: null,
  pageRequests: new Set(),
  remoteStore: null,
  browseContext: { type: "", entity: null, relationship: "" },
  discoveryMeta: null,
  promptEntities: [],
};

let typeMap;
let questionBrowser;
let slotPicker;
let askEntities;
let suggestionLayer = "business";
const composer = createComposer(ui.prompt, {
  onSubmit: () => ui.form.requestSubmit(),
  onTokenClick: (token) => slotPicker?.open(token),
  onChange: () => renderPromptContext(),
});
/** Entities chosen into prompt tokens; deleting the token takes the entity out of the question too. */
const tokenEntityIds = new Set();
let diagram;
let graphBrowser;
let catalogDropdown;
let catalogExpansion;
let catalogRequest = 0;
let scrollToLatestOnOpen = false;

const LAYER_TYPES = {
  BUSINESS: new Set(["BUSINESS-AREA", "BUSINESS-DOMAIN", "SERVICE-DOMAIN", "BUSINESS-CAPABILITY", "TEAMS"]),
  API: new Set(["APPLICATION", "API", "API-VERSION", "ENDPOINT", "HTTP-METHOD", "SECURITY", "EXPOSURE", "PCI", "PII", "GATEWAY", "MICROSERVICE", "WORKFLOW", "QUERY-PARAMETER", "PATH-PARAMETER", "HEADER", "STATUS-CODE", "SCHEMA", "FIELD", "CONSUMER"]),
  RUNTIME: new Set(["OPERATION", "DATABASE", "EVENT"]),
};

function makeId(prefix) {
  const token = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${token}`;
}

function now() {
  return new Date().toISOString();
}

function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bApi\b/g, "API");
}

function entityLayer(node) {
  const explicit = String(node?.layer || node?.attributes?.layer || "").toUpperCase();
  if (["BUSINESS", "API", "RUNTIME"].includes(explicit)) return explicit;
  const type = String(node?.type || node?.attributes?.type || "").toUpperCase();
  return Object.entries(LAYER_TYPES).find(([, types]) => types.has(type))?.[0] || "API";
}

function entityType(node) {
  return String(node?.type || node?.attributes?.type || "ENTITY");
}

function entityName(node) {
  return String(node?.name || node?.label || node?.attributes?.name || node?.attributes?.label || node?.id || "Unknown entity");
}

function normalizeGraph(graph) {
  const value = graph && typeof graph === "object" ? graph : {};
  return {
    ...value,
    nodes: Array.isArray(value.nodes) ? value.nodes : [],
    edges: Array.isArray(value.edges) ? value.edges : [],
    rootNodeIds: Array.isArray(value.rootNodeIds) ? value.rootNodeIds.map(String) : [],
    resultNodeIds: Array.isArray(value.resultNodeIds) ? value.resultNodeIds.map(String) : [],
  };
}

function activeWorkspace() {
  return state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId) || null;
}

function activeProject() {
  return activeWorkspace()?.projects?.find((project) => project.id === state.activeProjectId) || null;
}

function activeChat() {
  return activeProject()?.chats?.find((chat) => chat.id === state.activeChatId) || null;
}

class PlannerDocuments {
  constructor() {
    this.remote = null;
    this.storageKey = "atlas-planner-documents-v1";
  }

  readLocal() {
    try {
      const value = JSON.parse(localStorage.getItem(this.storageKey) || "{}");
      return {
        workspaces: Array.isArray(value.workspaces) ? value.workspaces : [],
        projects: value.projects && typeof value.projects === "object" ? value.projects : {},
        chats: value.chats && typeof value.chats === "object" ? value.chats : {},
      };
    } catch {
      return { workspaces: [], projects: {}, chats: {} };
    }
  }

  writeLocal(value) {
    localStorage.setItem(this.storageKey, JSON.stringify(value));
  }

  async request(method, path, body) {
    if (this.remote === false) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if (!response.ok) {
        if ([404, 405, 501].includes(response.status)) this.remote = false;
        return null;
      }
      this.remote = true;
      return response.status === 204 ? {} : await response.json();
    } catch {
      this.remote = false;
      return null;
    } finally { clearTimeout(timeout); }
  }

  async listWorkspaces() {
    const remote = await this.request("GET", "/app-api/workspaces");
    if (remote) return remote.items || [];
    return this.readLocal().workspaces;
  }

  async createWorkspace(name) {
    const remote = await this.request("POST", "/app-api/workspaces", { name });
    if (remote) return remote;
    const db = this.readLocal();
    const document = { id: makeId("workspace"), name, createdAt: now(), updatedAt: now() };
    db.workspaces.push(document);
    db.projects[document.id] = [];
    this.writeLocal(db);
    return document;
  }

  async updateWorkspace(id, changes) {
    const remote = await this.request("PATCH", `/app-api/workspaces/${encodeURIComponent(id)}`, changes);
    if (remote) return remote;
    const db = this.readLocal();
    const item = db.workspaces.find((workspace) => workspace.id === id);
    if (item) Object.assign(item, changes, { updatedAt: now() });
    this.writeLocal(db);
    return item;
  }

  async deleteWorkspace(id) {
    const remote = await this.request("DELETE", `/app-api/workspaces/${encodeURIComponent(id)}`);
    if (remote) return;
    const db = this.readLocal();
    db.workspaces = db.workspaces.filter((workspace) => workspace.id !== id);
    delete db.projects[id];
    Object.keys(db.chats).filter((key) => key.startsWith(`${id}:`)).forEach((key) => delete db.chats[key]);
    this.writeLocal(db);
  }

  async listProjects(workspaceId) {
    const remote = await this.request("GET", `/app-api/workspaces/${encodeURIComponent(workspaceId)}/projects`);
    if (remote) return remote.items || [];
    return this.readLocal().projects[workspaceId] || [];
  }

  async createProject(workspaceId, name) {
    const path = `/app-api/workspaces/${encodeURIComponent(workspaceId)}/projects`;
    const remote = await this.request("POST", path, { name });
    if (remote) return remote;
    const db = this.readLocal();
    const document = { id: makeId("project"), workspaceId, name, createdAt: now(), updatedAt: now() };
    if (!db.projects[workspaceId]) db.projects[workspaceId] = [];
    db.projects[workspaceId].push(document);
    db.chats[`${workspaceId}:${document.id}`] = [];
    this.writeLocal(db);
    return document;
  }

  async updateProject(workspaceId, id, changes) {
    const path = `/app-api/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(id)}`;
    const remote = await this.request("PATCH", path, changes);
    if (remote) return remote;
    const db = this.readLocal();
    const item = (db.projects[workspaceId] || []).find((project) => project.id === id);
    if (item) Object.assign(item, changes, { updatedAt: now() });
    this.writeLocal(db);
    return item;
  }

  async deleteProject(workspaceId, id) {
    const path = `/app-api/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(id)}`;
    const remote = await this.request("DELETE", path);
    if (remote) return;
    const db = this.readLocal();
    db.projects[workspaceId] = (db.projects[workspaceId] || []).filter((project) => project.id !== id);
    delete db.chats[`${workspaceId}:${id}`];
    this.writeLocal(db);
  }

  async listChats(workspaceId, projectId) {
    const path = `/app-api/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}/chats`;
    const remote = await this.request("GET", path);
    if (remote) return remote.items || [];
    return this.readLocal().chats[`${workspaceId}:${projectId}`] || [];
  }

  async createChat(workspaceId, projectId, title = "New graph chat") {
    const path = `/app-api/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}/chats`;
    const remote = await this.request("POST", path, { title, graphId: currentApiGraphId(), messages: [] });
    if (remote) return remote;
    const db = this.readLocal();
    const key = `${workspaceId}:${projectId}`;
    const document = { id: makeId("chat"), workspaceId, projectId, title, graphId: currentApiGraphId(), messages: [], createdAt: now(), updatedAt: now() };
    if (!db.chats[key]) db.chats[key] = [];
    db.chats[key].push(document);
    this.writeLocal(db);
    return document;
  }

  async updateChat(workspaceId, projectId, id, changes) {
    const path = `/app-api/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}/chats/${encodeURIComponent(id)}`;
    const remote = await this.request("PATCH", path, changes);
    if (remote) return remote;
    const db = this.readLocal();
    const item = (db.chats[`${workspaceId}:${projectId}`] || []).find((chat) => chat.id === id);
    if (item) Object.assign(item, changes, { updatedAt: now() });
    this.writeLocal(db);
    return item;
  }

  async deleteChat(workspaceId, projectId, id) {
    const path = `/app-api/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}/chats/${encodeURIComponent(id)}`;
    const remote = await this.request("DELETE", path);
    if (remote) return;
    const db = this.readLocal();
    const key = `${workspaceId}:${projectId}`;
    db.chats[key] = (db.chats[key] || []).filter((chat) => chat.id !== id);
    this.writeLocal(db);
  }
}

const documents = new PlannerDocuments();
const plannerApi = new PlannerApi();

function cancelPlannerRequests() {
  state.requestController?.abort();
  state.pageRequests.forEach(controller => controller.abort());
  state.pageRequests.clear();
}

function currentApiGraphId() {
  return state.graphEntry?.name || String(ui.graphSelect?.value || "").replace(/-[0-9a-f]{8}$/i, "") || "merged-graph-v4";
}

let modeSwitchTimer = 0;
const modeSwitch = (shell) => /** @type {HTMLElement | null} */ (shell?.querySelector(".mode-switch"));

// Like sigma's single switch: the visible thumb slides first, the views swap once it has landed,
// and the incoming view's switch is already in place so nothing jumps.
function setPlannerMode(open) {
  if (modeSwitchTimer || document.body.classList.contains("planner-mode") === open) return;
  const mode = open ? "chat" : "graph";
  const outgoing = modeSwitch(open ? viewer : planner);
  const incoming = modeSwitch(open ? planner : viewer);
  if (outgoing) outgoing.dataset.active = mode;
  if (incoming) { incoming.classList.add("is-instant"); incoming.dataset.active = mode; }
  const settle = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 320;
  modeSwitchTimer = window.setTimeout(() => {
    modeSwitchTimer = 0;
    swapPlannerMode(open);
    requestAnimationFrame(() => {
      incoming?.classList.remove("is-instant");
      if (!outgoing) return;
      outgoing.classList.add("is-instant");
      outgoing.dataset.active = open ? "graph" : "chat";
      requestAnimationFrame(() => outgoing.classList.remove("is-instant"));
    });
  }, settle);
}

function swapPlannerMode(open) {
  planner.hidden = !open;
  viewer.hidden = false;
  document.body.classList.toggle("planner-mode", open);
  ui.open?.classList.toggle("active", open);
  ui.open?.setAttribute("aria-pressed", String(open));
  if (open) {
    composer.focus();
    if (scrollToLatestOnOpen) {
      ui.chatScroll.scrollTop = ui.chatScroll.scrollHeight;
      scrollToLatestOnOpen = false;
    }
  }
  // Canvas and diagram resizing waits for the new view to fade in, so it never competes with the animation.
  window.setTimeout(() => window.dispatchEvent(new Event("resize")), 360);
}

function countQuestions(node) {
  if (!node || typeof node !== "object") return 0;
  return (Array.isArray(node.questions) ? node.questions.length : 0)
    + Object.entries(node).reduce((sum, [key, value]) => key === "questions" ? sum : sum + countQuestions(value), 0);
}

function filterCatalogNode(node, term) {
  if (!term) return node;
  const result = {};
  if (Array.isArray(node.questions)) {
    const questions = node.questions.filter((question) => question.toLowerCase().includes(term));
    if (questions.length) result.questions = questions;
  }
  Object.entries(node).forEach(([key, value]) => {
    if (key === "questions") return;
    const child = filterCatalogNode(value, term);
    if (countQuestions(child)) result[key] = child;
  });
  return result;
}

function placeholderTypes(name) {
  const meta = graphBrowser?.meta || state.discoveryMeta || {};
  return parameterTypes(name, state.catalog?.definitions || {}, meta).filter((type) => meta.counts?.[type]);
}

/** Composer token label for a placeholder that takes an entity; other placeholders stay as typed text. */
function tokenLabel(name) {
  const types = placeholderTypes(name);
  if (!types.length) return null;
  if (types.length === 1) return entityTypeLabel(types[0]);
  const acronyms = { api: "API", http: "HTTP", pci: "PCI", pii: "PII", sla: "SLA", id: "ID" };
  return name.replace(/_set$/, "").split("_").map((word, index) => acronyms[word] || (index ? word : word[0].toUpperCase() + word.slice(1))).join(" ");
}

function openNextToken() {
  const token = composer.emptyTokens()[0];
  if (token) slotPicker?.open(token);
}

function setPrompt(question, copy = false) {
  tokenEntityIds.clear();
  composer.setTemplate(question, tokenLabel);
  setPromptEntity(null);
  ui.composerStatus.textContent = "";
  composer.focus();
  qa(".planner-question.active").forEach((button) => button.classList.toggle("active", button.dataset.question === question));
  if (copy && navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(question).catch(() => {});
}

function setPromptEntity(entity) {
  setPromptEntities(entity ? [entity] : []);
}

function setPromptEntities(entities) {
  state.promptEntities = entities;
  state.selectedEntityIds = entities.map(entity => String(entity.id));
  renderPromptContext();
}

/** Context the prompt's text doesn't already show as a token (a diagram pick or a follow-up) sits in one pill in the composer. */
function renderPromptContext() {
  const shown = new Set(composer.filledIds());
  const removed = [...tokenEntityIds].filter((id) => !shown.has(id));
  if (removed.length) {
    removed.forEach((id) => tokenEntityIds.delete(id));
    state.promptEntities = (state.promptEntities || []).filter((entity) => !removed.includes(String(entity.id)));
    state.selectedEntityIds = state.promptEntities.map((entity) => String(entity.id));
  }
  const hidden = (state.promptEntities || []).filter((entity) => !shown.has(String(entity.id)));
  const pill = q("#planner-prompt-context");
  const label = q("#planner-prompt-context-label");
  pill.hidden = !hidden.length;
  label.replaceChildren();
  // Many nodes of one name (the 11 Credit Card API nodes) read as that one name.
  const names = [...new Set(hidden.map(entityName))];
  if (names.length === 1) label.append(typeMark(entityType(hidden[0]), state.discoveryMeta), document.createTextNode(names[0]));
  else if (hidden.length) label.textContent = `${hidden.length} entities`;
  pill.title = `Asking about ${names.join(", ")}${hidden.length > names.length ? ` (${hidden.length} entities)` : ""}`;
}

function chooseCatalogQuestion(item, personalized = false) {
  setPrompt(item.question, true);
  if (personalized && item.bound.length) setPromptEntity(state.browseContext.entity);
  if (personalized && item.remaining.length) {
    ui.composerStatus.textContent = `Fill ${item.remaining.map(key => `{${key}}`).join(", ")} before running.`;
    openNextToken();
  }
}

function renderContextCatalog(search) {
  const context = state.browseContext;
  const { templates, samples } = relevantCatalogQuestions(state.catalog, context, state.discoveryMeta || {}, search);
  ui.catalogCount.textContent = String(templates.length + samples.length);
  const addGroup = (heading, items, personalized) => {
    if (!items.length) return;
    const group = document.createElement("details");
    group.className = "planner-context-questions";
    group.open = true;
    const summary = document.createElement("summary");
    summary.textContent = `${titleCase(heading)} · ${items.length}`;
    const note = document.createElement("p");
    note.textContent = personalized ? (context.entity ? "Entity names are filled in. The exact ID is supplied as query context." : "Choose an entity below to fill the placeholders, or edit them in the prompt.") : heading === "Related catalog examples" ? "Catalog examples keep their original names; they are not scoped to your selected entity." : "These questions concern the entity type, not an individual entity.";
    const list = document.createElement("div");
    let visible = 0;
    const more = document.createElement("button");
    more.type = "button";
    more.className = "planner-browse-more";
    const show = () => {
      const limit = Math.min(items.length, visible + 12);
      for (const item of items.slice(visible, limit)) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "planner-personalized-question";
        const title = document.createElement("small");
        title.textContent = `${titleCase(item.category)}${personalized && item.remaining.length ? ` · ${item.remaining.length} value${item.remaining.length > 1 ? "s" : ""} needed` : ""}`;
        const text = document.createElement("span");
        text.textContent = item.question;
        button.append(title, text);
        button.title = item.template || "Copy this catalog example to the prompt";
        button.addEventListener("click", () => chooseCatalogQuestion(item, personalized));
        list.append(button);
      }
      visible = limit;
      more.hidden = visible >= items.length;
      more.textContent = `Show more questions · ${items.length - visible} remaining`;
    };
    more.addEventListener("click", show);
    group.append(summary, note, list, more);
    ui.questionTree.append(group);
    show();
  };
  addGroup(context.entity ? "Questions for this entity" : "Parameterized catalog questions", templates.filter((item) => questionParameters(item.template).length), true);
  addGroup("Type-wide catalog questions", templates.filter((item) => !questionParameters(item.template).length), false);
  addGroup("Related catalog examples", samples, false);
  if (!templates.length && !samples.length) {
    const empty = document.createElement("div");
    empty.className = "planner-tree-empty";
    empty.textContent = "No catalog questions match this selection. Clear a filter or ask your own question.";
    ui.questionTree.append(empty);
  }
}

function createCatalogSection(name, node, level, layer, forceOpen) {
  const section = document.createElement("div");
  section.className = `planner-tree-section level-${Math.min(level, 1)}`;
  // Reveal each layer's categories by default; search may expand deeper matches.
  const shouldOpen = forceOpen || level === 0;
  section.classList.toggle("expanded", shouldOpen);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "planner-tree-toggle";
  toggle.setAttribute("aria-expanded", String(shouldOpen));
  toggle.replaceChildren(icon("chevron"));
  const dot = document.createElement("i");
  dot.className = `planner-tree-dot ${layer}`;
  const label = document.createElement("strong");
  label.textContent = titleCase(name);
  const count = document.createElement("small");
  count.textContent = String(countQuestions(node));
  toggle.append(dot, label, count);
  toggle.addEventListener("click", () => {
    const expanded = section.classList.toggle("expanded");
    toggle.setAttribute("aria-expanded", String(expanded));
  });

  const children = document.createElement("div");
  children.className = "planner-tree-children";
  Object.entries(node).forEach(([key, value]) => {
    if (key !== "questions") children.append(createCatalogSection(key, value, level + 1, layer, forceOpen));
  });
  (node.questions || []).forEach((question) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "planner-question";
    button.textContent = question;
    button.dataset.question = question;
    button.title = "Add to prompt and copy to clipboard";
    button.addEventListener("click", () => setPrompt(question, true));
    children.append(button);
  });
  section.append(toggle, children);
  return section;
}

function renderCatalog(search = "") {
  catalogDropdown?.refresh();
  ui.questionTree.replaceChildren();
  const context = state.browseContext;
  const scoped = Boolean(context.type || context.relationship);
  q("#planner-show-related-questions").hidden = !scoped;
  q("#planner-show-related-questions").title = context.entity ? `View questions for ${entityName(context.entity)}` : "View questions for this selection";
  q("#planner-questions-nav").classList.toggle("has-context", scoped);
  q("#planner-catalog-context").hidden = !scoped;
  q("#planner-catalog-context-title").textContent = context.entity ? entityName(context.entity) : titleCase(context.type || "All entity types");
  q("#planner-catalog-context-detail").textContent = [context.entity ? context.type : "", context.relationship || "Relevant questions"].filter(Boolean).join(" · ");
  q("#planner-catalog-context-title").title = context.entity?.id || "";
  if (!state.catalog) {
    const empty = document.createElement("div");
    empty.className = "planner-tree-empty";
    empty.textContent = "No question catalog is registered for this graph. Add a matching *-questions.yaml file to question-catalogs.";
    ui.questionTree.append(empty);
    ui.catalogCount.textContent = "0";
    catalogExpansion?.sync();
    return;
  }
  if (scoped) { renderContextCatalog(search); catalogExpansion?.sync(); return; }
  const term = search.trim().toLowerCase();
  const tree = filterCatalogNode(state.catalog.tree, term);
  const entries = Object.entries(tree).filter(([, node]) => countQuestions(node));
  entries.forEach(([layer, node]) => ui.questionTree.append(createCatalogSection(layer, node, 0, layer, Boolean(term))));
  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "planner-tree-empty";
    empty.textContent = "No questions match this search.";
    ui.questionTree.append(empty);
  }
  ui.catalogCount.textContent = String(countQuestions(tree));
  catalogExpansion?.sync();
}

async function loadCatalog() {
  const request = ++catalogRequest;
  const graphName = currentApiGraphId();
  state.catalog = null;
  renderCatalog(ui.questionSearch.value);
  renderHome();
  renderSuggestions();
  try {
    const response = await fetch(`/question-catalogs/${encodeURIComponent(graphName)}-questions.yaml`, { cache: "no-cache" });
    if (!response.ok) throw new Error(String(response.status));
    const text = await response.text();
    if (request !== catalogRequest) return;
    const templateCatalog = parseQuestionTemplates(text);
    let samples;
    try { samples = parseQuestionCatalog(text); } catch {
      if (!templateCatalog.templates.length) throw new Error("No catalog questions found");
      samples = { tree: {}, total: 0 };
    }
    state.catalog = { ...samples, ...templateCatalog };
    typeMap?.render();
    renderSuggestions();
    questionBrowser?.render();
  } catch {
    if (request !== catalogRequest) return;
    state.catalog = null;
  }
  renderCatalog(ui.questionSearch.value);
}

async function loadGraphRegistry() {
  try {
    const response = await fetch("/graph-data/index.json");
    state.registry = response.ok ? await response.json() : null;
  } catch {
    state.registry = null;
  }
  syncGraphEntry();
}

function syncGraphEntry() {
  cancelPlannerRequests();
  const selectedId = ui.graphSelect?.value || state.registry?.defaultGraphId;
  state.graphEntry = state.registry?.graphs?.find((entry) => entry.id === selectedId)
    || state.registry?.graphs?.[0]
    || { id: selectedId, name: String(selectedId || "merged-graph-v4").replace(/-[0-9a-f]{8}$/i, ""), sourceName: "merged-graph-v4.json" };
  loadCatalog();
  graphBrowser?.load(state.graphEntry);
  renderActiveChat();
}

const SAMPLE_CHATS_KEY = "atlas-sample-chats-v1";

function sampleReply(answer, user, graphId, createdAt) {
  const narrative = [answer.narrative, answer.bullets.map((text) => `- ${text}`).join("\n")].join("\n\n");
  const presentation = { schemaVersion: "1.0", narrative, profile: { show_tables: true, show_diagrams: true }, tables: [{ ...answer.table, totalRows: answer.table.rows.length }], chips: answer.chips, note: answer.note, reasoning: answer.reasoning };
  const matchedGraph = { ...answer.graph, rootNodeIds: sampleRootIds(answer) };
  return { id: makeId("message"), role: "assistant", replyTo: user.id, content: narrative, createdAt, graphId, result: { status: "answered", graphId, presentation, matchedGraph, followUpQuestions: answer.followUps } };
}

/** Sigma-style demo projects, added once per browser next to whatever the user already has. */
/** A sample answer's subject: the nodes of its first chip's type, e.g. every Credit Card API node. */
function sampleRootIds(answer) {
  const type = String(answer.chips?.[0]?.label || "").trim().toUpperCase().replace(/\s+/g, "-");
  const roots = answer.graph.nodes.filter((node) => String(node.type || "").toUpperCase() === type);
  return (roots.length ? roots : answer.graph.nodes.slice(0, 1)).map((node) => String(node.id));
}

/** Samples seeded by earlier versions get reasoning in place of Cypher and their real subject as follow-up context. */
async function upgradeSampleChats() {
  const answers = new Map(SAMPLE_PROJECTS.flatMap((sample) => sample.chats).filter((item) => item.answer).map((item) => [item.question, item.answer]));
  for (const workspace of state.workspaces) for (const project of workspace.projects || []) for (const chat of project.chats || []) {
    const answer = answers.get(chat.title);
    const reply = answer && (chat.messages || []).find((message) => message.role === "assistant" && message.result?.presentation);
    if (!reply) continue;
    const roots = sampleRootIds(answer);
    const graph = reply.result.matchedGraph || {};
    const presentation = { ...reply.result.presentation, reasoning: answer.reasoning };
    delete presentation.cypher;
    if (!reply.result.presentation.cypher && String(graph.rootNodeIds) === String(roots)) continue;
    reply.result = { ...reply.result, presentation, matchedGraph: { ...graph, rootNodeIds: roots } };
    await documents.updateChat(workspace.id, project.id, chat.id, { title: chat.title, graphId: chat.graphId, messages: chat.messages });
  }
}

async function seedSampleChats() {
  let seeded;
  try { seeded = localStorage.getItem(SAMPLE_CHATS_KEY); } catch { return; }
  if (seeded) { await upgradeSampleChats(); return; }
  const workspace = state.workspaces[0];
  if (!workspace) return;
  const graphId = currentApiGraphId();
  let stamp = Date.now() - 86_400_000;
  let first = null;
  for (const sample of SAMPLE_PROJECTS) {
    const project = { ...(await documents.createProject(workspace.id, sample.name)), chats: [] };
    for (const item of sample.chats) {
      const chat = await documents.createChat(workspace.id, project.id, item.question);
      const createdAt = new Date(stamp += 60_000).toISOString();
      const user = { id: makeId("message"), role: "user", content: item.question, createdAt, graphId };
      const reply = item.answer ? sampleReply(item.answer, user, graphId, createdAt)
        : { id: makeId("message"), role: "assistant", replyTo: user.id, content: "This sample question hasn't been run yet. Restore it to the prompt to run it against the planner.", createdAt, retry: { question: item.question, graphId, entities: [] } };
      Object.assign(chat, { title: item.question, graphId, messages: [user, reply] });
      await documents.updateChat(workspace.id, project.id, chat.id, { title: chat.title, graphId, messages: chat.messages });
      project.chats.push(chat);
    }
    workspace.projects.push(project);
    first ||= project;
  }
  try { localStorage.setItem(SAMPLE_CHATS_KEY, "1"); } catch { /* Seeding again later only adds duplicates. */ }
  if (first) Object.assign(state, { activeWorkspaceId: workspace.id, activeProjectId: first.id, activeChatId: first.chats[0]?.id || "" });
}

async function hydrateDocuments() {
  const workspaces = await documents.listWorkspaces();
  state.workspaces = await Promise.all(workspaces.map(async (workspace) => {
    const projects = await documents.listProjects(workspace.id);
    const hydratedProjects = await Promise.all(projects.map(async (project) => ({
      ...project,
      chats: await documents.listChats(workspace.id, project.id),
    })));
    return { ...workspace, projects: hydratedProjects };
  }));

  if (!state.workspaces.length) {
    const workspace = await documents.createWorkspace("My workspace");
    const project = await documents.createProject(workspace.id, "Graph exploration");
    const chat = await documents.createChat(workspace.id, project.id);
    state.workspaces = [{ ...workspace, projects: [{ ...project, chats: [chat] }] }];
  }
  await seedSampleChats();

  const workspace = state.workspaces.find((item) => item.id === state.activeWorkspaceId) || state.workspaces[0];
  state.activeWorkspaceId = workspace.id;
  if (!workspace.projects.length) {
    const project = await documents.createProject(workspace.id, "Graph exploration");
    project.chats = [await documents.createChat(workspace.id, project.id)];
    workspace.projects.push(project);
  }
  const project = workspace.projects.find((item) => item.id === state.activeProjectId) || workspace.projects[0];
  state.activeProjectId = project.id;
  if (!project.chats.length) project.chats.push(await documents.createChat(workspace.id, project.id));
  state.activeChatId = project.chats.find((item) => item.id === state.activeChatId)?.id || project.chats[0].id;
  rememberSelection();
  renderWorkspaceTree();
  renderActiveChat();
}

function rememberSelection() {
  localStorage.setItem("atlas-planner-workspace", state.activeWorkspaceId);
  localStorage.setItem("atlas-planner-project", state.activeProjectId);
  localStorage.setItem("atlas-planner-chat", state.activeChatId);
}

function actionButton(label, title, action, ids) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.title = title;
  button.setAttribute("aria-label", title);
  button.dataset.action = action;
  Object.entries(ids).forEach(([key, value]) => { button.dataset[key] = value; });
  return button;
}

function menuButton(label, items, ids) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "planner-row-action";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-haspopup", "menu");
  button.append(icon("chevron"));
  button.addEventListener("click", () => openRowMenu(button, items, ids));
  return button;
}

let rowMenu = null;
function closeRowMenu() {
  rowMenu?.remove();
  rowMenu = null;
}

function openRowMenu(anchor, items, ids) {
  closeRowMenu();
  const menu = document.createElement("div");
  menu.className = "planner-row-menu";
  menu.setAttribute("role", "menu");
  for (const [label, action] of items) {
    const item = actionButton(label, label, action, ids);
    item.setAttribute("role", "menuitem");
    item.addEventListener("click", () => { closeRowMenu(); handleDocumentAction(item); });
    menu.append(item);
  }
  q("#app").append(menu);
  const rect = anchor.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 4}px`;
  menu.style.left = `${Math.max(8, rect.right - menu.offsetWidth)}px`;
  rowMenu = menu;
  menu.querySelector("button")?.focus();
}

// Sigma's project list: projects only, and the active project lists its chats.
function renderWorkspaceTree() {
  ui.workspaceTree.replaceChildren();
  for (const workspace of state.workspaces) {
    for (const project of workspace.projects || []) {
      const ids = { workspaceId: workspace.id, projectId: project.id };
      const active = project.id === state.activeProjectId;
      const row = document.createElement("div");
      row.className = `planner-project-row${active ? " active" : ""}`;
      const open = actionButton("", project.name, "select-project", ids);
      open.className = "planner-project-open";
      const name = document.createElement("span");
      name.textContent = project.name;
      open.append(icon(active ? "folder-open" : "folder"), name);
      if (active) open.setAttribute("aria-current", "true");
      const add = actionButton("", `New chat in ${project.name}`, "add-chat", ids);
      add.className = "planner-row-action";
      add.append(icon("plus"));
      row.append(open, add, menuButton(`Rename or delete ${project.name}`, [["Rename", "rename-project"], ["Delete", "delete-project"]], ids));
      ui.workspaceTree.append(row);
      if (!active) continue;
      if (!project.chats?.length) {
        const empty = document.createElement("p");
        empty.className = "planner-chat-empty";
        empty.textContent = "No chats yet";
        ui.workspaceTree.append(empty);
      }
      for (const chat of project.chats || []) {
        const chatIds = { ...ids, chatId: chat.id };
        const title = chat.title || "New graph chat";
        const chatRow = document.createElement("div");
        chatRow.className = `planner-chat-row${chat.id === state.activeChatId ? " active" : ""}`;
        const openChat = actionButton(title, title, "select-chat", chatIds);
        openChat.className = "planner-chat-open";
        if (chat.id === state.activeChatId) openChat.setAttribute("aria-current", "true");
        chatRow.append(openChat, menuButton(`Rename or delete ${title}`, [["Rename", "rename-chat"], ["Delete", "delete-chat"]], chatIds));
        ui.workspaceTree.append(chatRow);
      }
    }
  }
}

async function selectDocument(workspaceId, projectId = "", chatId = "") {
  cancelPlannerRequests();
  setQuestionsPage(false);
  const workspace = state.workspaces.find((item) => item.id === workspaceId);
  if (!workspace) return;
  state.activeWorkspaceId = workspace.id;
  const project = workspace.projects.find((item) => item.id === projectId) || workspace.projects[0];
  if (project) state.activeProjectId = project.id;
  const chat = project?.chats.find((item) => item.id === chatId) || project?.chats[0];
  if (chat) state.activeChatId = chat.id;
  rememberSelection();
  renderWorkspaceTree();
  renderActiveChat();
}

/** The sidebar's Search: chats across every project, newest first, matched on chat and project names. */
function renderChatSearch(query) {
  const host = q("#planner-chat-search-results");
  const workspace = activeWorkspace();
  const needle = query.trim().toLowerCase();
  const matches = (workspace?.projects || []).flatMap((project) => (project.chats || []).map((chat) => ({ project, chat })))
    .filter(({ project, chat }) => !needle || `${chat.title || ""} ${project.name || ""}`.toLowerCase().includes(needle))
    .sort((a, b) => String(b.chat.updatedAt || "").localeCompare(String(a.chat.updatedAt || "")));
  host.replaceChildren(...matches.slice(0, 50).map(({ project, chat }) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "planner-chat-search-row";
    const title = document.createElement("span");
    title.textContent = chat.title || "New graph chat";
    const where = document.createElement("small");
    where.textContent = project.name || "Project";
    row.append(icon("chat-circle-dots"), title, where);
    row.addEventListener("click", () => selectDocument(workspace.id, project.id, chat.id));
    return row;
  }));
  if (matches.length) return;
  const empty = document.createElement("p");
  empty.className = "planner-chat-search-empty";
  empty.textContent = needle ? "No chats match your search." : "No chats yet.";
  host.append(empty);
}

async function newChat() {
  cancelPlannerRequests();
  setQuestionsPage(false);
  const workspace = activeWorkspace();
  const project = activeProject();
  if (!workspace || !project) return;
  const chat = await documents.createChat(workspace.id, project.id);
  project.chats.unshift(chat);
  state.activeChatId = chat.id;
  rememberSelection();
  renderWorkspaceTree();
  renderActiveChat();
  composer.focus();
}

async function handleDocumentAction(button) {
  const { action, workspaceId, projectId, chatId } = button.dataset;
  if (action?.startsWith("select-")) {
    await selectDocument(workspaceId, projectId, chatId);
    return;
  }
  const workspace = state.workspaces.find((item) => item.id === workspaceId);
  const project = workspace?.projects.find((item) => item.id === projectId);
  const chat = project?.chats.find((item) => item.id === chatId);
  if (action === "add-project" && workspace) {
    const name = window.prompt("Project name", "New project")?.trim();
    if (!name) return;
    const created = await documents.createProject(workspace.id, name);
    created.chats = [await documents.createChat(workspace.id, created.id)];
    workspace.projects.push(created);
    await selectDocument(workspace.id, created.id, created.chats[0].id);
  } else if (action === "add-chat" && workspace && project) {
    state.activeWorkspaceId = workspace.id;
    state.activeProjectId = project.id;
    await newChat();
  } else if (action === "rename-workspace" && workspace) {
    const name = window.prompt("Workspace name", workspace.name)?.trim();
    if (name) Object.assign(workspace, await documents.updateWorkspace(workspace.id, { name }));
  } else if (action === "rename-project" && workspace && project) {
    const name = window.prompt("Project name", project.name)?.trim();
    if (name) Object.assign(project, await documents.updateProject(workspace.id, project.id, { name }));
  } else if (action === "rename-chat" && workspace && project && chat) {
    const title = window.prompt("Chat title", chat.title)?.trim();
    if (title) Object.assign(chat, await documents.updateChat(workspace.id, project.id, chat.id, { title }));
  } else if (action === "delete-workspace" && workspace && window.confirm(`Delete workspace “${workspace.name}” and all of its projects and chats?`)) {
    await documents.deleteWorkspace(workspace.id);
    state.workspaces = state.workspaces.filter((item) => item.id !== workspace.id);
    if (!state.workspaces.length) await hydrateDocuments();
    else await selectDocument(state.workspaces[0].id);
  } else if (action === "delete-project" && workspace && project && window.confirm(`Delete project “${project.name}” and its chats?`)) {
    await documents.deleteProject(workspace.id, project.id);
    workspace.projects = workspace.projects.filter((item) => item.id !== project.id);
    if (!workspace.projects.length) {
      const created = await documents.createProject(workspace.id, "Graph exploration");
      created.chats = [await documents.createChat(workspace.id, created.id)];
      workspace.projects.push(created);
    }
    await selectDocument(workspace.id, workspace.projects[0].id);
  } else if (action === "delete-chat" && workspace && project && chat && window.confirm(`Delete chat “${chat.title}”?`)) {
    await documents.deleteChat(workspace.id, project.id, chat.id);
    project.chats = project.chats.filter((item) => item.id !== chat.id);
    if (!project.chats.length) project.chats.push(await documents.createChat(workspace.id, project.id));
    await selectDocument(workspace.id, project.id, project.chats[0].id);
  }
  renderWorkspaceTree();
  renderActiveChat();
}

function appendInlineMarkdown(target, value) {
  const expression = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let cursor = 0;
  let match = expression.exec(value);
  while (match) {
    if (match.index > cursor) target.append(document.createTextNode(value.slice(cursor, match.index)));
    const element = document.createElement(match[2] ? "strong" : "code");
    element.textContent = match[2] || match[3];
    target.append(element);
    cursor = match.index + match[0].length;
    match = expression.exec(value);
  }
  if (cursor < value.length) target.append(document.createTextNode(value.slice(cursor)));
}

function renderMarkdown(target, value) {
  target.classList.add("markdown");
  const lines = String(value || "").split(/\r?\n/);
  let list = null;
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      list = null;
      index += 1;
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      list = null;
      const element = document.createElement(`h${Math.min(heading[1].length + 2, 6)}`);
      element.className = "answer-heading";
      appendInlineMarkdown(element, heading[2]);
      target.append(element);
      index += 1;
      continue;
    }
    const bullet = line.match(/^\s*(?:([-*])|\d+[.)])\s+(.+)$/);
    if (bullet) {
      const tag = bullet[1] ? "UL" : "OL";
      if (list?.tagName !== tag) {
        list = document.createElement(tag.toLowerCase());
        list.className = "answer-list";
        target.append(list);
      }
      const item = document.createElement("li");
      appendInlineMarkdown(item, bullet[2]);
      list.append(item);
      index += 1;
      continue;
    }
    const isTable = line.trim().startsWith("|") && lines[index + 1]?.match(/^\s*\|?[\s:|-]+\|\s*$/);
    if (isTable) {
      list = null;
      const tableWrap = document.createElement("div");
      tableWrap.className = "answer-table";
      const scroller = document.createElement("div");
      scroller.className = "answer-table-scroll";
      tableWrap.append(scroller);
      const table = document.createElement("table");
      const head = document.createElement("thead");
      const body = document.createElement("tbody");
      const cells = (row) => row.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
      const headRow = document.createElement("tr");
      cells(line).forEach((cell) => {
        const th = document.createElement("th");
        appendInlineMarkdown(th, cell);
        headRow.append(th);
      });
      head.append(headRow);
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        const row = document.createElement("tr");
        cells(lines[index]).forEach((cell) => {
          const td = document.createElement("td");
          appendInlineMarkdown(td, cell);
          row.append(td);
        });
        body.append(row);
        index += 1;
      }
      table.append(head, body);
      scroller.append(table);
      target.append(tableWrap);
      continue;
    }
    list = null;
    const paragraph = document.createElement("p");
    appendInlineMarkdown(paragraph, line);
    target.append(paragraph);
    index += 1;
  }
}

/** The first column's entity type when its header names one, for sigma's colored marks. */
function columnType(label) {
  const type = String(label || "").trim().toUpperCase().replace(/\s+/g, "-");
  const counts = state.discoveryMeta?.counts || {};
  return counts[type] != null ? type : counts[`${type}S`] != null ? `${type}S` : "";
}

/** Sigma's results table: a count and a search bar over a scrolling table. */
function renderResultTable(data) {
  const section = document.createElement("section");
  section.className = "answer-table";
  section.setAttribute("aria-label", data.title);
  const bar = document.createElement("div");
  bar.className = "answer-table-bar";
  const count = document.createElement("span");
  count.className = "answer-table-count";
  count.setAttribute("role", "status");
  const search = document.createElement("label");
  search.className = "answer-table-search";
  search.hidden = data.rows.length <= 5;
  const input = document.createElement("input");
  input.type = "search";
  input.placeholder = "Search rows";
  input.autocomplete = "off";
  input.setAttribute("aria-label", `Search ${data.title.toLowerCase()}`);
  search.append(icon("search"), input);
  bar.append(count, search);
  const numeric = data.columns.map((_, column) => data.rows.length > 0 && data.rows.every((row) => /^-?[\d,]+(\.\d+)?%?$|^$/.test(String(row[column] ?? "").trim())));
  const mono = data.columns.map((column) => /^(.+ )?id$/i.test(String(column).trim()));
  const markType = columnType(data.columns[0]);
  const table = document.createElement("table");
  const headRow = table.createTHead().insertRow();
  data.columns.forEach((column, index) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = column;
    if (numeric[index]) th.className = "is-numeric";
    headRow.append(th);
  });
  const body = table.createTBody();
  const rows = data.rows.map((row) => {
    const tr = body.insertRow();
    row.forEach((cell, index) => {
      const td = tr.insertCell();
      if (numeric[index]) td.className = "is-numeric";
      if (mono[index]) { td.classList.add("is-mono"); td.title = String(cell); }
      if (index === 0 && markType) {
        const name = document.createElement("span");
        name.className = "answer-table-name";
        const text = document.createElement("span");
        text.textContent = String(cell);
        name.append(typeMark(markType, state.discoveryMeta), text);
        td.append(name);
      } else td.textContent = String(cell);
    });
    return { tr, text: row.join(" ").toLowerCase() };
  });
  const scroller = document.createElement("div");
  scroller.className = "answer-table-scroll";
  scroller.append(table);
  const empty = document.createElement("p");
  empty.className = "answer-table-empty";
  empty.textContent = "No rows match your search";
  const title = titleCase(data.title);
  const filter = () => {
    const needle = input.value.trim().toLowerCase();
    let shown = 0;
    for (const row of rows) {
      row.tr.hidden = Boolean(needle) && !row.text.includes(needle);
      if (!row.tr.hidden) shown += 1;
    }
    const loaded = data.rows.length;
    const returned = data.truncated && data.totalRows > loaded ? ` · ${Number(data.totalRows).toLocaleString()} returned` : "";
    count.textContent = `${title} · ${needle ? `${shown.toLocaleString()} of ` : ""}${loaded.toLocaleString()} ${loaded === 1 ? "row" : "rows"}${returned}`;
    empty.hidden = shown > 0;
  };
  input.addEventListener("input", filter);
  section.append(bar, scroller, empty);
  filter();
  return section;
}

function renderApiDetails(body, message) {
  const result = message.result;
  if (!result) return;
  const warnings = [...(result.warnings || [])];
  if (result.matchedGraph?.truncated && showResultDiagrams(result)) warnings.unshift(`Graph preview is partial: ${result.matchedGraph.returnedNodeCount ?? result.matchedGraph.nodes.length} of ${result.matchedGraph.matchedNodeCount ?? "matched"} nodes shown.`);
  if (result.presentation?.profile?.certainty === "partial" || resultPagination(result)?.totalIsExact === false) warnings.unshift("Partial evidence: totals are a lower bound, not a complete inventory.");
  if (warnings.length) {
    const notice = document.createElement("details");
    notice.className = "planner-api-notice";
    const summary = document.createElement("summary");
    summary.textContent = `Evidence Notes · ${warnings.length}`;
    notice.open = warnings.some(text => /partial|truncat|limit|fallback|degrad/i.test(text));
    notice.append(summary);
    [...new Set(warnings)].forEach(text => { const p = document.createElement("p"); p.textContent = text; notice.append(p); });
    body.append(notice);
  }
  if (result.clarification?.entities?.length) {
    const section = document.createElement("section");
    section.className = "planner-clarification";
    section.setAttribute("aria-label", "Clarify your question");
    const heading = document.createElement("strong");
    heading.textContent = "Choose the Intended Entities";
    section.append(heading);
    const selected = new Map();
    const groups = result.clarification.entities;
    const use = document.createElement("button");
    use.type = "button";
    use.textContent = "Use Selection in Question";
    const update = () => { use.disabled = currentApiGraphId() !== result.graphId || groups.some(group => !selected.has(group.key)); };
    for (const group of groups) {
      const label = document.createElement("p");
      label.textContent = group.message || `Choose a match for ${group.mention || group.key}.`;
      section.append(label);
      for (const candidate of group.candidates || []) {
        if (!candidate?.id) continue;
        const choice = document.createElement("button");
        choice.type = "button";
        const name = document.createElement("span");
        name.textContent = `${candidate.name || "Unnamed entity"} · ${titleCase(candidate.type)}`;
        const context = document.createElement("small");
        context.textContent = candidate.id;
        choice.append(name, context);
        choice.title = candidate.id;
        choice.setAttribute("aria-pressed", "false");
        choice.dataset.resolutionKey = group.key;
        choice.addEventListener("click", () => {
          selected.set(group.key, candidate);
          section.querySelectorAll("[data-resolution-key]").forEach(button => { if (button.getAttribute("data-resolution-key") === group.key) button.setAttribute("aria-pressed", String(button === choice)); });
          update();
        });
        section.append(choice);
      }
      if (!group.candidates?.length) {
        const note = document.createElement("p"); note.textContent = "No matching entities were found. Edit the original question or use Assist to choose a known entity."; section.append(note);
      }
    }
    use.addEventListener("click", () => {
      const original = activeChat()?.messages?.find(item => item.id === message.replyTo);
      if (!original || currentApiGraphId() !== result.graphId) return;
      setPrompt(original.content);
      const resolved = (result.resolvedEntities || []).filter(group => group.status === "resolved").flatMap(group => (group.selectedIds || []).map(id => group.candidates?.find(candidate => candidate.id === id) || { id, name: group.mention }));
      setPromptEntities([...new Map([...resolved, ...selected.values()].map(entity => [entity.id, entity])).values()]);
      ui.composerStatus.textContent = "Clarification selected · review and run the same question";
    });
    update(); section.append(use); body.append(section);
  }
}

function renderApiTables(host, message) {
  const initial = message.result || {};
  let current = initial;
  const previousOffsets = [];
  const render = () => {
    const tables = returnedResultTables(current);
    host.replaceChildren(...tables.map(renderResultTable));
    const page = resultPagination(current);
    if (!page || !tables.length || (!page.hasMore && !previousOffsets.length && page.totalIsExact && page.totalItems === page.returnedItems)) return;
    const footer = document.createElement("div");
    footer.className = "planner-server-pagination";
    const label = document.createElement("span");
    label.setAttribute("role", "status");
    label.textContent = `${page.returnedItems ? page.offset + 1 : 0}–${page.offset + page.returnedItems} of ${page.totalIsExact ? "" : "at least "}${page.totalItems} matches · search covers loaded rows only${page.offset ? " · table page changed; saved answer and evidence map are unchanged" : ""}`;
    footer.append(label);
    const changePage = async (offset, back, buttons) => {
      const controller = new AbortController(); state.pageRequests.add(controller);
      buttons.forEach(button => { button.disabled = true; });
      label.textContent = "Loading result page…";
      try {
        const next = await plannerApi.page(initial, offset, controller.signal);
        if (controller.signal.aborted || !host.isConnected || currentApiGraphId() !== initial.graphId) return;
        if (back) previousOffsets.pop(); else previousOffsets.push(page.offset);
        current = { ...next, displayProfile: initial.presentation?.profile, summaryTables: returnedResultTables(initial).filter(table => table.summary) };
        render();
      } catch (error) {
        if (controller.signal.aborted || !host.isConnected) return;
        render();
        const errorLabel = document.createElement("p"); errorLabel.className = "planner-api-notice"; errorLabel.setAttribute("role", "alert"); errorLabel.textContent = error.message; host.append(errorLabel);
      } finally { state.pageRequests.delete(controller); }
    };
    const previous = document.createElement("button"), next = document.createElement("button");
    previous.type = next.type = "button";
    previous.textContent = "Previous API Page"; next.textContent = "Next API Page";
    previous.disabled = !previousOffsets.length || currentApiGraphId() !== initial.graphId;
    next.disabled = !page.hasMore || page.nextOffset === null || currentApiGraphId() !== initial.graphId;
    previous.addEventListener("click", () => changePage(previousOffsets.at(-1), true, [previous, next]));
    next.addEventListener("click", () => changePage(page.nextOffset, false, [previous, next]));
    if (page.hasMore || previousOffsets.length) footer.append(previous, next);
    if (page.hasMore && page.nextOffset === null) label.textContent += " · API evidence limits prevent advancing; narrow the question.";
    host.append(footer);
  };
  render();
}

/** How an answer was reached: a sample's own steps, or read from what the planner matched and returned. */
function answerReasoning(result) {
  const presentation = result?.presentation || {};
  if (Array.isArray(presentation.reasoning)) return presentation.reasoning.map(String).filter(Boolean);
  const steps = [];
  for (const group of result?.resolvedEntities || []) {
    const count = group.selectedIds?.length || 0;
    if (count) steps.push(`Matched “${group.mention || group.key}” to ${count === 1 ? "one entity" : `${count.toLocaleString()} entities`} in the graph.`);
  }
  const graph = normalizeGraph(result?.matchedGraph);
  const relations = [...new Set(graph.edges.map((edge) => edge.relationshipType || edge.type).filter(Boolean))];
  if (relations.length) steps.push(`Followed ${relations.slice(0, 3).join(", ")}${relations.length > 3 ? ` and ${relations.length - 3} more` : ""} relationships across ${graph.nodes.length.toLocaleString()} entities.`);
  const rows = returnedResultTables(result).reduce((sum, table) => sum + Number(table.totalRows ?? table.rows?.length ?? 0), 0);
  if (rows) steps.push(`Returned ${rows.toLocaleString()} ${rows === 1 ? "row" : "rows"} as evidence.`);
  return steps;
}

function renderAnswerExtras(host, message) {
  const presentation = message.result?.presentation || {};
  if (presentation.note) {
    const quote = document.createElement("blockquote");
    quote.className = "answer-quote";
    quote.textContent = presentation.note;
    host.append(quote);
  }
  const reasoning = answerReasoning(message.result);
  if (reasoning.length) {
    const block = document.createElement("section");
    block.className = "answer-code answer-reasoning";
    block.setAttribute("aria-label", "Reasoning");
    const head = document.createElement("div");
    head.className = "answer-code-head";
    const label = document.createElement("span");
    label.append(icon("lightbulb"), document.createTextNode("Reasoning"));
    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = "Copy";
    copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(reasoning.map((step, index) => `${index + 1}. ${step}`).join("\n")); copy.textContent = "Copied"; } catch { copy.textContent = "Copy failed"; }
      window.setTimeout(() => { copy.textContent = "Copy"; }, 1500);
    });
    head.append(label, copy);
    const steps = document.createElement("ol");
    steps.className = "answer-reasoning-steps";
    steps.append(...reasoning.map((step) => { const item = document.createElement("li"); item.textContent = step; return item; }));
    block.append(head, steps);
    host.append(block);
  }
  if (message.result?.matchedGraph?.nodes?.length) {
    const open = document.createElement("button");
    open.type = "button";
    open.className = "answer-open-graph";
    open.append(icon("graph"), document.createTextNode("Open Atlas Graph"));
    open.addEventListener("click", () => setPlannerMode(false));
    host.append(open);
  }
}

/** Sigma-style follow-up pills after every answer; choosing one keeps the answer's entities as context. */
function renderFollowupPills(host, message) {
  const graph = normalizeGraph(message.result?.matchedGraph);
  if (!graph.nodes.length || isScalarCount(message.result)) return;
  const questions = [...new Set([...(message.result?.followUpQuestions || []), ...followUpQuestions(graph)])].slice(0, 4);
  if (!questions.length) return;
  const label = document.createElement("p");
  label.className = "answer-followups-label";
  label.textContent = "Suggested follow-up questions";
  const row = document.createElement("div");
  row.className = "answer-followups";
  row.setAttribute("aria-label", "Follow-up questions");
  for (const question of questions) {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "answer-followup";
    pill.append(icon("arrow-bend-down-right"), document.createTextNode(question));
    pill.addEventListener("click", () => useFollowUp(question, graph));
    row.append(pill);
  }
  host.append(label, row);
}

function renderHome() {
  const select = /** @type {HTMLSelectElement | null} */ (ui.graphSelect);
  q("#planner-home-title").textContent = select?.selectedOptions?.[0]?.textContent || "Graph";
  const meta = state.discoveryMeta;
  const format = (value) => (Number.isFinite(value) ? value.toLocaleString() : "—");
  q("#planner-stat-nodes").textContent = format(meta?.totalNodes);
  q("#planner-stat-apis").textContent = format(meta?.counts?.API);
  q("#planner-stat-relations").textContent = format(meta?.totalEdges);
}

/** Sigma's suggested questions: one relationship question per group in the chosen layer. */
function renderSuggestions() {
  qa(".suggestion-layer").forEach((tab) => {
    const active = tab.dataset.layer === suggestionLayer;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  const seen = new Set();
  const picks = (state.catalog?.templates || []).filter((template) => template.layer === suggestionLayer && template.category === "direct_forward_edges"
    && templateRoute(template) && questionParameters(template.question).length && !seen.has(template.path) && seen.add(template.path)).slice(0, 4);
  q("#planner-suggestion-list").replaceChildren(...picks.map((template) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "suggestion-row";
    const text = document.createElement("span");
    text.className = "suggestion-text";
    appendQuestionProse(text, template.question);
    const route = document.createElement("span");
    route.className = "suggestion-path";
    route.textContent = templateRoute(template);
    row.append(text, route);
    row.addEventListener("click", () => chooseCatalogQuestion({ ...template, ...bindQuestion(template.question, null), template: template.question }, true));
    return row;
  }));
}

function questionsFor(filter) {
  if (!state.catalog) return [];
  const meta = state.discoveryMeta || {};
  const items = filter ? relevantCatalogQuestions(state.catalog, filter, meta).templates
    : (state.catalog.templates || []).map((template) => ({ ...template, ...bindQuestion(template.question, null), template: template.question }));
  return items.map((item) => ({ item, personalized: questionParameters(item.template).length > 0, anchor: questionAnchor({ ...item, question: item.template }, state.catalog.definitions, meta) }));
}

/** Entity types in the entity map's order: the Questions page's sections follow it. */
function entityMapOrder() {
  const meta = state.discoveryMeta;
  return meta?.counts ? buildEntityMapRows(Object.keys(meta.counts), meta.relationshipSchema).map((row) => row.type) : [];
}

function setQuestionsPage(open, options = {}) {
  planner.classList.toggle("questions-open", open);
  q("#planner-questions-page").hidden = !open;
  const nav = q("#planner-questions-nav");
  nav.classList.toggle("active", open);
  nav.setAttribute("aria-pressed", String(open));
  if (!open || !questionBrowser) return;
  if (options.layer !== undefined) questionBrowser.layer = options.layer;
  if (options.filter === undefined) { questionBrowser.render(); return; }
  questionBrowser.setFilter(options.filter);
}

function renderMessage(message) {
  const article = document.createElement("article");
  article.className = `planner-message ${message.role}${message.error ? " error" : ""}`;
  const avatar = document.createElement("div");
  avatar.className = "planner-message-avatar";
  if (message.role === "user") avatar.textContent = "You";
  else {
    const logo = document.createElement("img");
    logo.src = "/brand/apiwiz-logo.png";
    logo.alt = "";
    logo.width = 28;
    logo.height = 24;
    avatar.setAttribute("aria-hidden", "true");
    avatar.append(logo);
  }
  const body = document.createElement("div");
  body.className = "planner-message-body";
  const author = document.createElement("strong");
  author.textContent = message.role === "user" ? "You" : "Atlas Query Planner";
  const header = document.createElement("div");
  header.className = "planner-message-header";
  header.append(author);
  const timestamp = messageTimestamp(message.createdAt);
  if (timestamp) {
    const time = document.createElement("time");
    time.dateTime = timestamp.iso;
    time.textContent = timestamp.label;
    time.title = timestamp.full;
    header.append(time);
  }
  article.dataset.messageId = message.id || "";
  if (message.replyTo) article.dataset.replyTo = message.replyTo;
  const content = document.createElement("div");
  content.className = "planner-message-content";
  if (message.role === "assistant") {
    const tables = returnedResultTables(message.result);
    const narrative = document.createElement("div");
    renderMarkdown(narrative, resultNarrative(message, tables[0]));
    const results = document.createElement("div");
    renderApiTables(results, message);
    content.append(narrative, results);
    renderAnswerExtras(content, message);
    renderFollowupPills(content, message);
  } else content.textContent = message.content;
  body.append(header, content);
  renderApiDetails(body, message);
  if (message.retry) {
    const retry = document.createElement("button");
    retry.type = "button"; retry.className = "planner-restore-question"; retry.textContent = "Restore Question to Retry";
    retry.disabled = message.retry.graphId !== currentApiGraphId();
    retry.addEventListener("click", () => { setPrompt(message.retry.question); setPromptEntities(message.retry.entities || []); });
    body.append(retry);
  }
  if (message.meta) {
    const meta = document.createElement("div");
    meta.className = "planner-message-meta";
    meta.textContent = message.meta;
    body.append(meta);
  }
  if (message.role === "assistant" && message.result?.matchedGraph?.nodes?.length && !isScalarCount(message.result)) {
    const graph = normalizeGraph(message.result.matchedGraph);
    const questions = message.result.followUpQuestions || followUpQuestions(graph);
    const reference = document.createElement("details");
    reference.className = "planner-next-questions";
    reference.open = true;
    const summary = document.createElement("summary");
    summary.textContent = `Suggested Next Questions · ${questions.length}`;
    const note = document.createElement("p");
    note.textContent = "Reference for this answer · Choose a question to edit before running.";
    reference.append(summary, note);
    questions.forEach((question) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = question;
      button.addEventListener("click", () => useFollowUp(question, graph));
      reference.append(button);
    });
    body.append(reference);
  }
  article.append(avatar, body);
  return article;
}

function renderActiveChat() {
  const workspace = activeWorkspace();
  const project = activeProject();
  const chat = activeChat();
  const messages = chronologicalMessages(Array.isArray(chat?.messages) ? chat.messages : []);
  const landing = q("#planner-landing");
  const dock = q("#planner-composer-dock");
  const hasMessages = messages.length > 0;
  landing.hidden = hasMessages;
  dock.hidden = !hasMessages;
  if (hasMessages) dock.append(ui.form);
  else landing.insertBefore(ui.form, q("#planner-suggestions"));
  ui.emptyChat.hidden = messages.length > 0;
  q("#planner-suggestions").hidden = messages.length > 0;
  ui.chatScroll.classList.toggle("has-messages", messages.length > 0);
  ui.messages.replaceChildren(...messages.map(renderMessage));
  if (chat && state.requestContext?.chatId === chat.id && messages.at(-1)?.role === "user") ui.messages.append(thinkingMessage());
  if (chat?.saveError) {
    const notice = document.createElement("div");
    notice.className = "planner-api-notice";
    notice.setAttribute("role", "alert");
    notice.textContent = "This conversation has unsaved changes. Keep this tab open and retry saving. The query result is still available above. ";
    const retry = document.createElement("button");
    retry.type = "button"; retry.textContent = "Retry Saving"; retry.className = "planner-restore-question";
    retry.addEventListener("click", async () => { retry.disabled = true; documents.remote = null; await persistChat(workspace.id, project.id, chat, chat.graphId || currentApiGraphId()); });
    notice.append(retry); ui.messages.append(notice);
  }
  const latestResultMessage = [...messages].reverse().find(message => message.result?.matchedGraph && (!message.result.graphId || message.result.graphId === currentApiGraphId()));
  const latestResult = latestResultMessage?.result?.matchedGraph;
  renderMatchedGraph(latestResult || null);
  if (isScalarCount(latestResultMessage?.result)) renderFollowups(normalizeGraph(null));
  if (!showResultDiagrams(latestResultMessage?.result)) {
    diagram?.setGraph(normalizeGraph(null));
    q("#planner-diagram-empty strong").textContent = "Diagram Hidden";
    q("#planner-diagram-empty span").textContent = "This answer is presented without a diagram.";
  } else {
    q("#planner-diagram-empty strong").textContent = "Your evidence, connected";
    q("#planner-diagram-empty span").textContent = "Run a question to explore its returned graph.";
  }
  scrollToLatestOnOpen = planner.hidden && hasMessages;
  window.requestAnimationFrame(() => { ui.chatScroll.scrollTop = hasMessages ? ui.chatScroll.scrollHeight : 0; });
}

/** Sigma's thinking state while the planner reads the graph. */
function thinkingMessage() {
  const row = document.createElement("div");
  row.className = "planner-thinking";
  row.setAttribute("role", "status");
  const dots = document.createElement("span");
  dots.className = "thinking-dots";
  dots.setAttribute("aria-hidden", "true");
  dots.append(...[0, 1, 2].map(() => document.createElement("i")));
  const label = document.createElement("span");
  label.textContent = `Reading ${/** @type {HTMLSelectElement | null} */ (ui.graphSelect)?.selectedOptions?.[0]?.textContent || "the graph"}…`;
  row.append(dots, label);
  return row;
}

async function persistChat(workspaceId, projectId, chat, graphId) {
  chat.updatedAt = now();
  chat.graphId = graphId;
  try {
    const saved = await documents.updateChat(workspaceId, projectId, chat.id, { title: chat.title, graphId, messages: chat.messages });
    chat.saveError = !saved;
  } catch { chat.saveError = true; }
  renderWorkspaceTree();
  if (activeChat()?.id === chat.id && currentApiGraphId() === graphId) renderActiveChat();
}

function graphSummary(payload) {
  const graph = normalizeGraph(payload?.matchedGraph);
  const status = payload?.status ? titleCase(payload.status) : "Answered";
  const provider = payload?.answerProvider || payload?.plannerProvider || "query planner";
  return `${status} · ${graph.nodes.length} nodes · ${graph.edges.length} edges · ${provider}`;
}

async function runQuestion(question) {
  const chat = activeChat();
  if (!chat || !question.trim() || state.requestController) return;
  const selectedEntityIds = [...state.selectedEntityIds];
  const selectedEntities = state.promptEntities.length ? [...state.promptEntities] : selectedEntityIds.map(id => ({ id }));
  const graphId = currentApiGraphId();
  const workspaceId = activeWorkspace().id;
  const projectId = activeProject().id;
  const persist = () => persistChat(workspaceId, projectId, chat, graphId);
  const controller = new AbortController();
  state.requestController = controller;
  state.requestContext = { chatId: chat.id, graphId };
  const isCurrent = () => activeChat()?.id === chat.id && currentApiGraphId() === graphId;
  const text = question.trim();
  const firstUserMessage = !(chat.messages || []).some((message) => message.role === "user");
  const userMessage = { id: makeId("message"), role: "user", content: text, createdAt: now(), selectedEntityIds, graphId };
  chat.messages = [...(chat.messages || []), userMessage];
  if (firstUserMessage) chat.title = text.length > 62 ? `${text.slice(0, 59)}…` : text;
  renderActiveChat();
  ui.run.disabled = true;
  ui.run.classList.add("loading");
  ui.run.setAttribute("aria-label", "Running query");
  q("#planner-cancel").hidden = false;
  ui.composerStatus.textContent = "";

  try {
    await persist();
    const payload = await plannerApi.answer(graphId, text, selectedEntityIds, controller.signal);
    if (controller.signal.aborted) throw new DOMException("Query cancelled", "AbortError");
    const graph = normalizeGraph(payload.matchedGraph);
    const assistant = {
      id: makeId("message"),
      role: "assistant",
      content: payload.answer || payload.message || "The query completed without a narrative answer.",
      meta: `${graphSummary({ ...payload, matchedGraph: graph })} · ${graphId} · Request ${payload.requestId}`,
      createdAt: now(),
      replyTo: userMessage.id,
      result: { ...payload, matchedGraph: graph, followUpQuestions: payload.status === "answered" && graph.nodes.length ? followUpQuestions(graph) : [] },
    };
    chat.messages.push(assistant);
    await persist();
  } catch (error) {
    const cancelled = error?.name === "AbortError";
    const assistant = { id: makeId("message"), role: "assistant", replyTo: userMessage.id, content: cancelled ? "Query cancelled. No response was applied. The server may still finish processing it." : error instanceof Error ? error.message : String(error), error: !cancelled, cancelled, meta: `${cancelled ? "Cancelled" : "Query failed"} · ${graphId}`, retry: { graphId, question: text, entities: selectedEntities }, createdAt: now() };
    chat.messages.push(assistant);
    await persist();
  } finally {
    ui.run.disabled = false;
    ui.run.classList.remove("loading");
    ui.run.setAttribute("aria-label", "Run query");
    q("#planner-cancel").hidden = true;
    if (state.requestController === controller) { state.requestController = null; state.requestContext = null; }
    if (isCurrent()) composer.focus();
  }
}

function selectEntity(id) {
  const node = state.matchedGraph?.nodes.find((item) => String(item.id) === String(id));
  setPromptEntity(node || { id });
}

function renderEntityTree(graph) {
  ui.entityTree.replaceChildren();
  if (!graph.nodes.length) {
    const empty = document.createElement("div");
    empty.className = "planner-tree-empty";
    empty.textContent = "Run a query to browse result entities.";
    ui.entityTree.append(empty);
    return;
  }
  const grouped = new Map();
  graph.nodes.forEach((node) => {
    const key = `${entityLayer(node)}|${entityType(node)}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(node);
  });
  [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([key, nodes]) => {
    const [layer, type] = key.split("|");
    const group = document.createElement("div");
    group.className = "planner-entity-group";
    const folder = document.createElement("button");
    folder.type = "button";
    folder.className = "planner-entity-folder";
    folder.setAttribute("aria-expanded", "true");
    folder.innerHTML = '<i>⌄</i><i class="planner-doc-icon"></i>';
    const label = document.createElement("strong");
    label.textContent = `${titleCase(layer)} / ${titleCase(type)}`;
    const count = document.createElement("small");
    count.textContent = String(nodes.length);
    folder.append(label, count);
    const children = document.createElement("div");
    children.className = "planner-entity-children";
    nodes.forEach((node) => {
      const leaf = document.createElement("button");
      leaf.type = "button";
      leaf.className = `planner-entity-leaf ${layer.toLowerCase()}`;
      const dot = document.createElement("i");
      const text = document.createElement("span");
      text.textContent = entityName(node);
      leaf.append(dot, text);
      leaf.addEventListener("click", () => { switchContextTab("diagram"); diagram?.focus(node.id); syncDropdowns(); });
      children.append(leaf);
    });
    folder.addEventListener("click", () => {
      const open = folder.getAttribute("aria-expanded") === "true";
      folder.setAttribute("aria-expanded", String(!open));
      children.hidden = open;
    });
    group.append(folder, children);
    ui.entityTree.append(group);
  });
}

function followUpQuestions(graph) {
  const roots = graph.nodes.filter((node) => graph.rootNodeIds.includes(String(node.id)));
  const types = [...new Set(graph.nodes.map(entityType))];
  const relationships = [...new Set(graph.edges.map((edge) => edge.relationshipType || edge.type).filter(Boolean))];
  const root = roots[0] || graph.nodes[0];
  const name = root ? entityName(root) : "this result";
  return [
    `What is the direct versus transitive impact around ${name}?`,
    `Which business capabilities and teams are connected to ${name}?`,
    relationships.length ? `Show the evidence paths that use ${relationships.slice(0, 3).join(", ")}.` : "Show the evidence paths behind this result.",
    types.length ? `Which ${types.slice(0, 3).map(titleCase).join(", ")} entities have the highest fan-in in this result?` : "Which entities have the highest fan-in in this result?",
    "What is missing or truncated in this result, and which additional graph evidence would be needed?",
  ];
}

function renderFollowups(graph) {
  ui.followups.replaceChildren();
  if (!graph.nodes.length) {
    const empty = document.createElement("div");
    empty.className = "planner-context-empty";
    const strong = document.createElement("strong");
    strong.textContent = "No follow-ups yet";
    const span = document.createElement("span");
    span.textContent = "Run a graph question first.";
    empty.append(strong, span);
    ui.followups.append(empty);
    return;
  }
  followUpQuestions(graph).forEach((question) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "planner-followup";
    const label = document.createElement("span");
    label.textContent = question;
    const arrow = document.createElement("i");
    arrow.replaceChildren(icon("arrow-right"));
    button.append(label, arrow);
    button.addEventListener("click", () => useFollowUp(question, graph));
    ui.followups.append(button);
  });
}

function useFollowUp(question, graph) {
  setPrompt(question);
  const roots = graph.nodes.filter((node) => graph.rootNodeIds.includes(String(node.id)));
  setPromptEntities(roots.length ? roots : graph.nodes.slice(0, 1));
}

function renderMatchedGraph(value) {
  const graph = normalizeGraph(value);
  state.matchedGraph = graph;
  state.selectedEntityIds = state.promptEntities.map(entity => String(entity.id));
  diagram?.setGraph(graph);
  renderEntityTree(graph);
  renderFollowups(graph);
}

function switchContextTab(target) {
  qa("[data-context-tab]").forEach((button) => {
    const active = button.dataset.contextTab === target;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  q("#planner-type-map-panel").hidden = target !== "map";
  q("#planner-diagram-panel").hidden = target !== "diagram";
  if (target !== "diagram") diagram?.expand(false);
  q("#planner-entities-panel").hidden = target !== "entities";
  q("#planner-followups-panel").hidden = target !== "followups";
}

function initializePlannerPanelResizing() {
  const settings = [
    { element: ui.libraryResizer, property: "--planner-library-width", key: "atlas-planner-library-width", initial: 340, min: 270, max: 500, direction: 1, shared: true },
    { element: ui.contextResizer, property: "--planner-context-width", key: "atlas-planner-context-width", initial: 480, min: 440, max: 640, direction: -1 },
  ];
  const setWidth = (setting, width, persist = false) => {
    const safeWidth = Math.max(setting.min, Math.min(setting.max, Math.round(width)));
    planner.style.setProperty(setting.property, `${safeWidth}px`);
    setting.element?.setAttribute("aria-valuenow", String(safeWidth));
    setting.element?.setAttribute("aria-valuemin", String(setting.min));
    setting.element?.setAttribute("aria-valuemax", String(setting.max));
    setting.element?.setAttribute("aria-valuetext", `${safeWidth} pixels`);
    if (persist) localStorage.setItem(setting.key, String(safeWidth));
    if (persist && setting.shared) shareSidebarWidth("chat", safeWidth);
    return safeWidth;
  };
  settings.forEach((setting) => {
    if (!setting.element) return;
    setting.element.querySelector(".resize-grip").append(icon("grip"));
    let width = Number(localStorage.getItem(setting.key)) || setting.initial;
    width = setWidth(setting, width);
    if (setting.shared) {
      shareSidebarWidth("chat", width);
      followSidebarWidth("chat", (next) => { width = setWidth(setting, next); localStorage.setItem(setting.key, String(width)); });
    }
    const finish = () => {
      setting.element.classList.remove("is-dragging");
      document.body.classList.remove("panel-is-resizing");
      localStorage.setItem(setting.key, String(width));
      if (setting.shared) shareSidebarWidth("chat", width);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
    let startX = 0;
    let startWidth = width;
    const move = (event) => { width = setWidth(setting, startWidth + (event.clientX - startX) * setting.direction); };
    setting.element.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      setting.element.focus();
      startX = event.clientX;
      startWidth = width;
      setting.element.classList.add("is-dragging");
      document.body.classList.add("panel-is-resizing");
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", finish, { once: true });
      window.addEventListener("pointercancel", finish, { once: true });
    });
    setting.element.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") width = setWidth(setting, setting.initial, true);
      else width = setWidth(setting, width + (event.key === "ArrowRight" ? 12 : -12) * setting.direction, true);
    });
    setting.element.addEventListener("dblclick", () => { width = setWidth(setting, setting.initial, true); });
  });
}


function wirePlanner() {
  for (const [side, label, breakpoint] of [["library", "sidebar", 780], ["context", "evidence explorer", 1040]]) {
    // Sigma's sidebar has no desktop collapse, so an old saved "collapsed" state must not strand it closed.
    if (side === "library") try { localStorage.removeItem("atlas-planner-library-visibility"); } catch { /* Optional preference. */ }
    workspaceFocus.register(connectPanelToggle({
      panel: q(`#planner-${side}`), toggles: [q(`#planner-${side}-toggle`)], reopen: [q(`#planner-${side}-reopen`)].filter(Boolean),
      label, storageKey: `atlas-planner-${side}-visibility`, compact: window.matchMedia(`(max-width: ${breakpoint}px)`),
      onChange: open => {
        planner.classList.toggle(`${side}-collapsed`, !open);
        q(`#planner-${side}-resizer`).hidden = !open;
        if (!open && side === "context") diagram?.expand(false);
        if (side === "library") {
          const toggle = q("#planner-library-toggle");
          toggle.dataset.panelIcon = open ? "panel-left-close" : "panel-left-open";
          toggle.replaceChildren(icon(toggle.dataset.panelIcon));
        }
      },
    }));
  }
  qa("[data-planner-heading-icon]").forEach(element => element.append(icon(element.dataset.plannerHeadingIcon)));
  const library = q("#planner-library");
  const drillViews = {
    entities: { title: "Search chats", panel: q("#planner-chat-search-panel"), opener: q("#planner-search-nav") },
  };
  const showLibraryView = (view, focus = false) => {
    const previous = drillViews[library.dataset.view];
    library.dataset.view = view;
    Object.entries(drillViews).forEach(([id, { panel }]) => { panel.hidden = id !== view; });
    if (drillViews[view]) q("#planner-drill-title").textContent = drillViews[view].title;
    catalogDropdown?.close();
    graphBrowser?.dropdown.close();
    if (focus) (drillViews[view] ? q("#planner-drill-back") : previous?.opener)?.focus();
  };
  Object.entries(drillViews).forEach(([view, { opener }]) => opener.addEventListener("click", () => showLibraryView(view, true)));
  const chatSearch = /** @type {HTMLInputElement} */ (q("#planner-chat-search"));
  chatSearch.addEventListener("input", () => renderChatSearch(chatSearch.value));
  chatSearch.addEventListener("keydown", (event) => { if (event.key === "Escape") { event.preventDefault(); showLibraryView("home", true); } });
  q("#planner-search-nav").addEventListener("click", () => { chatSearch.value = ""; renderChatSearch(""); chatSearch.focus(); });
  q("#planner-chat-search-results").addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest(".planner-chat-search-row")) showLibraryView("home");
  });
  q("#planner-drill-back").append(icon("chevron"));
  q("#planner-drill-back").addEventListener("click", () => showLibraryView("home", true));
  ui.catalogPanel.hidden = true;
  q("#planner-questions-nav").addEventListener("click", () => setQuestionsPage(!planner.classList.contains("questions-open")));
  q("#planner-show-related-questions").addEventListener("click", () => { showLibraryView("home"); setQuestionsPage(true, { filter: { ...state.browseContext } }); });
  qa(".suggestion-layer").forEach((tab) => tab.addEventListener("click", () => { suggestionLayer = tab.dataset.layer || "business"; renderSuggestions(); }));
  q("#planner-home-dataset").addEventListener("click", () => /** @type {HTMLElement | null} */ (document.querySelector(".graph-picker .select-trigger"))?.click());
  q("#planner-question-bank").addEventListener("click", () => setQuestionsPage(true));
  qa(".mode-switch").forEach(group => group.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    qa(".mode-switch-option", group).find(option => option !== event.target)?.focus();
  }));
  catalogExpansion = connectCatalogExpansion(ui.questionTree, ui.collapseCatalog);
  ui.addWorkspace.append(icon("plus"));
  catalogDropdown = new SearchDropdown({ input: ui.questionSearch, button: q("#planner-question-dropdown"), label: "Question suggestions",
    getOptions: search => catalogSearchOptions(state.catalog, state.browseContext, state.discoveryMeta || {}, search),
    onSelect: option => chooseCatalogQuestion(option.item, option.personalized),
    emptyMessage: () => state.catalog ? "No matching questions. Try another search or clear an entity filter." : "No question catalog is available for this graph.",
  });
  const openSearch = q("#planner-open-catalog-search");
  const closeSearch = q("#planner-close-catalog-search");
  openSearch.append(icon("search"));
  closeSearch.append(icon("close"));
  const setCatalogSearchOpen = (open) => {
    q("#planner-catalog-label").hidden = open;
    q("#planner-catalog-search").hidden = !open;
    openSearch.setAttribute("aria-expanded", String(open));
    if (open) ui.questionSearch.focus();
    else {
      catalogDropdown.close();
      ui.questionSearch.value = "";
      renderCatalog();
      openSearch.focus({ preventScroll: true });
    }
  };
  openSearch.addEventListener("click", () => setCatalogSearchOpen(true));
  closeSearch.addEventListener("click", () => setCatalogSearchOpen(false));
  ui.questionSearch.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setCatalogSearchOpen(false); }
  });
  graphBrowser = new PlannerGraphBrowser({ onChange: (context, meta) => {
    const changedEntity = state.browseContext.entity?.id !== context.entity?.id || state.browseContext.type !== context.type;
    const changedMeta = state.discoveryMeta !== meta;
    state.browseContext = context;
    state.discoveryMeta = meta;
    typeMap?.setMeta(meta);
    askEntities?.setMeta(meta);
    // Sections are grouped by this graph's entity types.
    if (changedMeta && planner.classList.contains("questions-open")) questionBrowser?.render();
    renderHome();
    if (!meta || (!context.type && !context.relationship)) setPromptEntity(null);
    else if (changedEntity) {
      // Browsing another entity must not silently attach its ID to an existing draft.
      setPromptEntity(composer.value() ? null : context.entity);
    }
    renderCatalog(ui.questionSearch.value);
  } });
  q("#planner-catalog-context-clear").addEventListener("click", () => graphBrowser.clear());
  q("#planner-prompt-context-clear").addEventListener("click", () => {
    const shown = new Set(composer.filledIds());
    setPromptEntities(state.promptEntities.filter((entity) => shown.has(String(entity.id))));
    composer.focus();
  });
  ui.open?.addEventListener("click", () => setPlannerMode(true));
  ui.close?.addEventListener("click", () => setPlannerMode(false));
  ui.graphSelect?.addEventListener("change", () => window.setTimeout(syncGraphEntry, 0));
  const contextIcons = { map: "layers", diagram: "network", entities: "entity", followups: "route" };
  qa("[data-context-tab]").forEach((button) => {
    const label = document.createElement("span");
    label.textContent = button.textContent.trim();
    button.replaceChildren(icon(contextIcons[button.dataset.contextTab]), label);
    button.addEventListener("click", () => switchContextTab(button.dataset.contextTab));
  });
  ui.questionSearch.addEventListener("input", () => renderCatalog(ui.questionSearch.value));
  ui.addWorkspace.addEventListener("click", () => {
    const workspace = activeWorkspace() || state.workspaces[0];
    if (workspace) handleDocumentAction(actionButton("", "New project", "add-project", { workspaceId: workspace.id }));
  });
  document.addEventListener("pointerdown", (event) => { if (rowMenu && !(event.target instanceof Node && rowMenu.contains(event.target))) closeRowMenu(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeRowMenu(); });
  ui.workspaceTree.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("button[data-action]") : null;
    if (button) handleDocumentAction(button);
  });
  ui.newChatNav.addEventListener("click", newChat);
  ui.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = composer.value();
    if (!question || state.requestController) return;
    const remaining = questionParameters(question);
    if (remaining.length) {
      ui.composerStatus.textContent = `Fill ${remaining.map((key) => `{${key}}`).join(", ")} before running.`;
      openNextToken();
      return;
    }
    composer.clear();
    runQuestion(question);
  });
  q("#planner-cancel").addEventListener("click", () => state.requestController?.abort());
  initializePlannerPanelResizing();
  typeMap = new PlannerTypeMap({
    panel: q("#planner-type-map-panel"),
    getQuestions: type => state.catalog ? relevantCatalogQuestions(state.catalog, { type }, state.discoveryMeta || {}) : { templates: [], samples: [] },
    onChoose: chooseCatalogQuestion,
  });
  questionBrowser = new PlannerQuestionBrowser({
    root: q("#planner-questions-page"),
    getQuestions: questionsFor,
    getOrder: entityMapOrder,
    markFor: (type) => typeMark(type, state.discoveryMeta),
    onChoose: (item, personalized) => { setQuestionsPage(false); chooseCatalogQuestion(item, personalized); },
    onActiveChange: (type) => askEntities?.setActive(type),
    onRender: (types) => askEntities?.setAvailable(types),
  });
  slotPicker = new PlannerSlotPicker({
    getContext: () => ({ definitions: state.catalog?.definitions, meta: graphBrowser?.meta || state.discoveryMeta }),
    loadEntities: (type) => graphBrowser.entitiesForType(type),
    onPick: (token, entity) => {
      const replaced = token.dataset.id;
      composer.fillToken(token, entity, typeMark(entity.type, graphBrowser?.meta || state.discoveryMeta));
      tokenEntityIds.add(String(entity.id));
      setPromptEntities([...(state.promptEntities || []).filter((item) => ![replaced, String(entity.id)].includes(String(item.id))), entity]);
      const remaining = questionParameters(composer.value());
      ui.composerStatus.textContent = remaining.length ? `Fill ${remaining.map((key) => `{${key}}`).join(", ")} before running.` : "";
      if (composer.emptyTokens().length) openNextToken();
      else composer.focus();
    },
  });
  askEntities = new PlannerTypeMap({ panel: q("#planner-ask-entities-panel"), onNavigate: (type) => questionBrowser.scrollToType(type), fullCounts: true });
  diagram = new PlannerDiagram({ onSelect: selectEntity, layerForNode: entityLayer });
}

async function initializeQueryPlanner() {
  if (!planner || !viewer) return;
  wirePlanner();
  swapPlannerMode(true);
  inlineIllustrations(planner);
  await Promise.all([loadGraphRegistry(), hydrateDocuments()]);
}

initializeQueryPlanner().catch((error) => {
  console.error("Query Planner initialization failed", error);
  ui.composerStatus.textContent = "Planner unavailable";
});
