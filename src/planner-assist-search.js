import { parameterTypes, questionParameters } from "./planner-discovery.js";

const stopWords = new Set("a an the and or to of for from in on at by with is are be do does did can could would should i me my we our you your please help assist find show list tell want need know explore question questions available catalog about what which how who there this that all have has get ask asking".split(" "));
const aliases = {
  owns: "own", owner: "own", owners: "own", ownership: "own",
  dependencies: "depend", dependency: "depend", depends: "depend", dependent: "depend", dependents: "depend",
  reads: "read", reading: "read", writes: "write", writing: "write",
  failures: "outage", failure: "outage", fails: "outage", unavailable: "outage",
  impact: "blast", affected: "blast", impacts: "blast", radius: "blast",
  privacy: "pii", sensitive: "pii", personal: "pii",
  authentication: "security", authorization: "security", auth: "security",
  deployed: "deploy", deployment: "deploy", deployments: "deploy",
};
function tokens(value) {
  return [...new Set((String(value).toLowerCase().match(/[a-z0-9]+/g) || [])
    .filter(word => !stopWords.has(word))
    .map(word => aliases[word] || (word.endsWith("ies") ? `${word.slice(0, -3)}y` : word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word)))];
}

/** Suggestions always come from the active catalog, never invented questions. */
export function assistQuestions(catalog, query = "", layer = "") {
  const items = new Map();
  for (const template of catalog?.templates || []) items.set(template.question, { ...template, kind: "template" });
  const visit = (node, path = []) => {
    for (const question of node.questions || []) {
      if (!items.has(question)) items.set(question, { question, layer: path[0] || "", category: path.slice(1).join(" / "), kind: "example" });
    }
    for (const [key, child] of Object.entries(node)) if (key !== "questions" && child && typeof child === "object") visit(child, [...path, key]);
  };
  visit(catalog?.tree || {});
  const terms = tokens(query);
  return [...items.values()].filter(item => !layer || item.layer === layer).map(item => {
    const primary = tokens(item.question);
    const context = tokens(`${item.layer} ${item.category} ${item.section || ""} ${item.path || ""}`);
    const matched = terms.filter(term => primary.includes(term) || context.includes(term));
    const score = matched.length * 10 + terms.filter(term => primary.includes(term)).length * 3;
    return { ...item, parameters: questionParameters(item.question), score, matches: matched.length };
  }).filter(item => !terms.length || item.matches === terms.length)
    .sort((a, b) => b.score - a.score || (a.kind === "template" ? 0 : 1) - (b.kind === "template" ? 0 : 1));
}

export function assistParameter(parameter, definitions, meta) {
  const multiple = parameter.endsWith("_set");
  let types = parameterTypes(parameter, definitions, meta);
  if (multiple) {
    const layer = parameter.split("_")[0].toUpperCase();
    types = parameter === "api_version_set" ? ["API-VERSION"] : meta.layers?.[layer] || [];
  }
  // These placeholders intentionally match text/properties, not one exact node.
  if (["name_or_text", "api_name"].includes(parameter)) types = [];
  return { parameter, multiple, types, numeric: parameter === "max_depth", description: definitions[parameter] || "Enter a value for this question." };
}

/** Keep values literal (including $&) and exact entity IDs separate from labels. */
export function resolveAssistQuestion(question, values, definitions = {}, meta = {}) {
  const errors = {};
  const entities = new Map();
  const replacements = {};
  for (const parameter of questionParameters(question)) {
    const spec = assistParameter(parameter, definitions, meta);
    const value = values[parameter];
    if (spec.types.length || spec.multiple) {
      const selected = Array.isArray(value) ? value : value && typeof value === "object" ? [value] : [];
      const unique = [...new Map(selected.map(entity => [entity.id, entity])).values()];
      if (unique.length < (spec.multiple ? 2 : 1) || (!spec.multiple && unique.length !== 1) || unique.some(entity => !entity.id || !spec.types.includes(entity.type))) {
        errors[parameter] = spec.multiple ? "Choose at least two different entities from the graph." : "Choose an entity from the suggestions.";
        continue;
      }
      // Collections use explicit IDs, as required by the catalog's set semantics.
      replacements[parameter] = unique.map(entity => spec.multiple ? String(entity.id) : String(entity.name || entity.label || entity.id)).join(", ");
      unique.forEach(entity => entities.set(String(entity.id), entity));
    } else {
      const text = typeof value === "string" ? value.trim() : "";
      if (!text || questionParameters(text).length) errors[parameter] = "Enter a value, not a placeholder.";
      else if (spec.numeric && !/^\d+$/.test(text)) errors[parameter] = "Enter a whole number of hops, zero or greater.";
      else replacements[parameter] = text;
    }
  }
  return {
    question: question.replace(/\{([a-z][a-z0-9_]*)\}/g, (placeholder, parameter) => replacements[parameter] ?? placeholder),
    entities: [...entities.values()], errors, complete: !Object.keys(errors).length,
  };
}
