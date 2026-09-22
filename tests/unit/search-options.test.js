import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { catalogSearchOptions, searchOptionPage } from "../../src/search-options.js";
import { parseQuestionTemplates } from "../../src/planner-discovery.js";

const samples = { tree: { business: { inventory: { questions: ["Which business areas exist?", "List the teams."] } }, api: { overview: { questions: ["Which APIs exist?"] } } } };
describe("searchable catalog dropdown", () => {
  it("offers categorized choices and filters case-insensitively", () => {
    expect(catalogSearchOptions(samples)).toHaveLength(3);
    expect(catalogSearchOptions(samples, {}, {}, " BUSINESS ")).toMatchObject([{ label: "Which business areas exist?", detail: "business / inventory", personalized: false }]);
    expect(catalogSearchOptions(samples, {}, {}, "unknown")).toEqual([]);
    expect(catalogSearchOptions(null)).toEqual([]);
  });
  it("preserves entity-bound questions and unresolved parameters", () => {
    const templates = parseQuestionTemplates(readFileSync(new URL("../../public/question-catalogs/merged-graph-v4-questions.yaml", import.meta.url), "utf8"));
    const meta = { counts: { DATABASE: 9, OPERATION: 100 }, layers: { RUNTIME: ["DATABASE", "OPERATION"] } };
    const options = catalogSearchOptions({ ...samples, ...templates }, { type: "DATABASE", entity: { id: "db:1", name: "Example DB", type: "DATABASE" } }, meta, "operations read from");
    expect(options.some(option => option.label === "Which operations read from Example DB?" && option.personalized && option.item.bound.includes("database"))).toBe(true);
    const drafts = catalogSearchOptions(templates, { type: "DATABASE" }, meta, "operations read from");
    expect(drafts.some(option => option.item.remaining.includes("database"))).toBe(true);
  });
  it("caps visible choices without losing the true result count or duplicate-name identities", () => {
    const options = Array.from({ length: 90 }, (_, id) => ({ label: "Shared name", entity: { id } }));
    const page = searchOptionPage(options);
    expect(page.options).toHaveLength(30);
    expect(page.total).toBe(90);
    expect(page.options[0].entity.id).not.toBe(page.options[1].entity.id);
    expect(searchOptionPage([])).toEqual({ options: [], total: 0 });
  });
});
