// URL path parameters are literal graph data, not unfinished catalog inputs.
const parameterPattern = /(?<![/\w])\{([a-z][a-z0-9_]*)\}/g;
const words = (value) => String(value || "").toLowerCase().replace(/[_-]+/g, " ");
const escapePattern = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Parse the sample tree used by both the UI and end-to-end catalog checks. */
export function parseQuestionCatalog(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(line => line.trim() === "sample_questions_by_category:");
  if (start < 0) throw new Error("Sample question catalog not found");
  const root = {}, pathByIndent = new Map();
  let total = 0;
  for (const line of lines.slice(start + 1)) {
    if (!line.trim()) continue;
    const keyMatch = line.match(/^(\s*)([a-z][a-z0-9_]*):\s*$/);
    if (keyMatch) {
      const indent = keyMatch[1].length;
      if (indent < 2) break;
      const key = keyMatch[2];
      const path = [...(indent === 2 ? [] : pathByIndent.get(indent - 2) || []), key];
      pathByIndent.set(indent, path);
      for (const stored of pathByIndent.keys()) if (stored > indent) pathByIndent.delete(stored);
      let target = root;
      for (const segment of path) target = target[segment] ||= {};
      continue;
    }
    const item = line.match(/^(\s*)-\s+(.+)$/);
    if (!item) continue;
    const indent = [...pathByIndent.keys()].filter(value => value <= item[1].length).sort((a, b) => b - a)[0];
    const path = pathByIndent.get(indent);
    if (!path || path.length < 2) continue;
    let target = root;
    for (const segment of path) target = target[segment];
    (target.questions ||= []).push(yamlScalar(item[2].trim()));
    total++;
  }
  if (!total) throw new Error("Question catalog is empty");
  return { tree: root, total };
}

export function questionParameters(question) {
  return [...new Set([...String(question).matchAll(parameterPattern)].map((match) => match[1]))];
}

function yamlScalar(value) {
  if (value.startsWith('"')) {
    try { return JSON.parse(value); } catch { return value.slice(1, -1); }
  }
  return value.startsWith("'") ? value.slice(1, -1).replace(/''/g, "'") : value;
}

/** Read only the catalog's documented question blocks; descriptions are never executable instructions. */
export function parseQuestionTemplates(text) {
  const definitions = {};
  const templates = [];
  const lines = text.split(/\r?\n/);
  let inLayers = false, layer = "", category = "", section = "", path = "", questionIndent = -1;
  for (const line of lines) {
    const definition = line.match(/^\s*"\{([a-z0-9_]+)\}":\s*(.+)$/);
    if (definition) definitions[definition[1]] = yamlScalar(definition[2]);
    if (line === "layers:") { inLayers = true; continue; }
    if (!inLayers || !line.trim()) continue;
    if (/^\S/.test(line)) { inLayers = false; continue; }
    const indent = line.length - line.trimStart().length;
    const key = line.trim().match(/^([a-z_]+):\s*$/)?.[1];
    if (indent <= questionIndent) questionIndent = -1;
    if (indent === 2 && key) { layer = key; category = section = path = ""; }
    if (indent === 4 && key) { category = key; section = path = ""; }
    if (indent === 6 && key && !["questions", "relationship_groups", "path_patterns"].includes(key)) { section = key; path = ""; }
    const pathMatch = line.trim().match(/^- path:\s*(.+)$/);
    if (pathMatch) path = yamlScalar(pathMatch[1]);
    if (key === "questions") { questionIndent = indent; continue; }
    const question = line.trim().match(/^-\s+(.+)$/);
    if (questionIndent >= 0 && indent > questionIndent && question) {
      templates.push({ question: yamlScalar(question[1]), layer, category, section, path });
    }
  }
  return { templates, definitions };
}

export function parameterTypes(parameter, definitions = {}, meta = {}) {
  const types = Object.keys(meta.counts || {});
  if (parameter.endsWith("_set")) return [];
  if (parameter === "name_or_text") return types;
  const aliases = { team: ["TEAMS"], security_control: ["SECURITY"], classification: ["PII", "PCI"], deployment_target: ["GATEWAY", "MICROSERVICE", "WORKFLOW"], runtime_target: ["OPERATION", "DATABASE", "EVENT"], api_name: ["API"] };
  if (aliases[parameter]) return aliases[parameter].filter((type) => types.includes(type));
  const direct = parameter.toUpperCase().replaceAll("_", "-");
  if (types.includes(direct)) return [direct];
  if (parameter.includes("_or_") || ["contract_element", "response_element"].includes(parameter)) {
    const tokens = /** @type {string[]} */ (String(definitions[parameter] || "").match(/\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*\b/g) || []);
    if (parameter === "business_or_api_root") tokens.push(...(meta.layers?.BUSINESS || []));
    return types.filter((type) => tokens.includes(type));
  }
  // Host, service, query, table name and path are properties, not entity selectors.
  return [];
}

export function bindQuestion(question, entity, definitions = {}, meta = {}) {
  if (!entity) return { question, remaining: questionParameters(question), bound: [] };
  const bound = [];
  const rendered = question.replace(parameterPattern, (placeholder, parameter) => {
    if (!parameterTypes(parameter, definitions, meta).includes(entity.type)) return placeholder;
    bound.push(parameter);
    return String(entity.name || entity.label || entity.id);
  });
  return { question: rendered, remaining: questionParameters(rendered), bound: [...new Set(bound)] };
}

function typePattern(type) {
  const name = words(type === "TEAMS" ? "team" : type);
  const plural = name.endsWith("y") ? `${escapePattern(name.slice(0, -1))}(?:y|ies)` : `${escapePattern(name)}s?`;
  return new RegExp(`\\b${plural}\\b`, "i");
}

function mentionsType(question, type) {
  return typePattern(type).test(words(question));
}

/**
 * The one entity type a catalog question is asked about: where its relationship starts,
 * else its first entity input, else the first type it names, else its layer's first type.
 */
export function questionAnchor(template, definitions = {}, meta = {}) {
  const types = Object.keys(meta.counts || {});
  const start = String(template.path || "").match(/^[A-Z][A-Z0-9-]*/)?.[0];
  if (start && types.includes(start)) return start;
  const rank = Object.values(meta.layers || {}).flat();
  const byRank = (list) => [...list].sort((a, b) => (rank.indexOf(a) + 1 || Infinity) - (rank.indexOf(b) + 1 || Infinity));
  for (const parameter of questionParameters(template.question)) {
    if (parameter === "name_or_text") continue;
    // "{team_or_capability}" is about its first-named type.
    const [type] = [...parameterTypes(parameter.split("_or_")[0], definitions, meta), ...byRank(parameterTypes(parameter, definitions, meta))];
    if (type) return type;
  }
  const text = words(template.question);
  let first = { type: "", index: Infinity, length: 0 };
  for (const type of types) {
    const match = typePattern(type).exec(text);
    // "API versions" names API Version, not API.
    if (match && (match.index < first.index || (match.index === first.index && match[0].length > first.length))) first = { type, index: match.index, length: match[0].length };
  }
  return first.type || meta.layers?.[String(template.layer || "").toUpperCase()]?.[0] || "";
}

export function matchesRelationship(question, relationship) {
  if (!relationship) return true;
  const term = words(relationship);
  const text = words(question);
  if (text.includes(term)) return true;
  const stems = {
    "READS-FROM": "read", "WRITES-TO": "writ", "UPDATES-TO": "updat", "CONNECTS-TO": "connect", "DEPLOYED-TO": "deploy", "HAS-PROPERTY": "propert", "CLASSIFIED-AS": "classif", "HAS-EXPOSURE": "expos", "ROUTES-TO": "rout", "CALLS": "call", "CONSUMES": "consum", "PRODUCES": "produc", "SUBSCRIBES": "subscrib", "CONTAINS": "contain", "IMPLEMENTS": "implement", "OWNS": "own", "EXPOSES": "expos", "ACCEPTS": "accept", "RETURNS": "return", "SUPPORTS": "support",
  };
  return stems[relationship] ? new RegExp(`\\b${stems[relationship]}[a-z]*\\b`).test(text) : false;
}

export function relevantCatalogQuestions(catalog, context, meta, search = "") {
  const { type = "", entity = null, relationship = "" } = context;
  const definitions = catalog.definitions || {};
  const applicable = (catalog.templates || []).filter((template) => {
    const parameters = questionParameters(template.question);
    const typed = parameters.filter((parameter) => parameterTypes(parameter, definitions, meta).length);
    if (type && typed.length === 1 && typed[0] === "name_or_text" && !(meta.layers?.[(template.layer || "").toUpperCase()] || []).includes(type)) return false;
    const typeMatch = !type || typed.some((parameter) => parameterTypes(parameter, definitions, meta).includes(type))
      || (!typed.length && mentionsType(template.question, type));
    return typeMatch && matchesRelationship(`${template.path} ${template.question}`, relationship);
  });
  const priority = (item) => (item.bound.length ? 30 : questionParameters(item.template).length ? 20 : 0)
    + (item.category.startsWith("direct_") ? 10 : item.category === "inventory_and_coverage" ? 5 : 0) - item.remaining.length * 2;
  const templates = applicable.map((template) => ({ ...template, ...bindQuestion(template.question, entity, definitions, meta), template: template.question }))
    .sort((a, b) => priority(b) - priority(a));
  const skeletons = applicable.map((template) => new RegExp(`^${template.question.split(parameterPattern).map((part, i) => i % 2 ? ".+?" : escapePattern(part)).join("")}$`, "i"));
  const samples = [];
  const collect = (node, path = []) => {
    for (const question of node.questions || []) {
      if ((!type || mentionsType(question, type) || skeletons.some((pattern) => pattern.test(question))) && matchesRelationship(question, relationship)) {
        samples.push({ question, layer: path[0] || "", category: path.slice(1).join(" / ") });
      }
    }
    Object.entries(node).forEach(([key, child]) => { if (key !== "questions" && child && typeof child === "object") collect(child, [...path, key]); });
  };
  collect(catalog.tree || {});
  const matchesSearch = (item) => words(`${item.question} ${item.category}`).includes(words(search).trim());
  const filled = new Set(templates.map((item) => item.question));
  return { templates: templates.filter(matchesSearch), samples: samples.filter((item) => !filled.has(item.question) && matchesSearch(item)) };
}

export function searchEntities(entities, search) {
  const term = words(search).trim();
  return entities.filter((entity) => words(`${entity.name || entity.label || ""} ${entity.id}`).includes(term));
}

export function relationshipsForType(meta, type = "") {
  return Object.entries(meta.edgeCounts || {}).filter(([, count]) => Number(count) > 0).map(([relationship, count]) => {
    const signatures = (meta.relationshipSchema || []).filter((row) => row.relationship === relationship && (!type || row.source === type || row.target === type));
    return { relationship, count: type ? signatures.reduce((sum, row) => sum + row.count, 0) : Number(count), signatures };
  }).filter((item) => !type || item.signatures.length).sort((a, b) => b.count - a.count);
}
