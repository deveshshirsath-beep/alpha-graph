import { questionParameters, relevantCatalogQuestions } from "./planner-discovery.js";

const title = value => String(value || "").replaceAll("_", " ").replaceAll("-", " ");

/** Keep the dropdown's question scope identical to the catalog tree. */
export function catalogSearchOptions(catalog, context = {}, meta = {}, query = "") {
  if (!catalog) return [];
  if (context.type || context.relationship) {
    const { templates, samples } = relevantCatalogQuestions(catalog, context, meta, query);
    return [...templates.map(item => ({ item, personalized: questionParameters(item.template).length > 0 })),
      ...samples.map(item => ({ item, personalized: false }))].map(choice => ({
      ...choice, label: choice.item.question,
      detail: `${title(choice.item.category)}${choice.personalized && choice.item.remaining.length ? ` · ${choice.item.remaining.length} values needed` : ""}`,
    }));
  }
  const options = [];
  const visit = (node, path = []) => {
    for (const question of node.questions || []) options.push({ label: question, detail: path.map(title).join(" / "), item: { question }, personalized: false });
    for (const [name, child] of Object.entries(node)) if (name !== "questions") visit(child, [...path, name]);
  };
  visit(catalog.tree || {});
  const term = query.trim().toLowerCase();
  return options.filter(option => option.label.toLowerCase().includes(term));
}

export function searchOptionPage(options, limit = 30) {
  return { options: options.slice(0, limit), total: options.length };
}
