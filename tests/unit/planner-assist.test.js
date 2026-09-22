import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseQuestionTemplates } from "../../src/planner-discovery.js";
import { assistQuestions, assistParameter, resolveAssistQuestion } from "../../src/planner-assist-search.js";

const catalog = parseQuestionTemplates(readFileSync(new URL("../../public/question-catalogs/merged-graph-v4-questions.yaml", import.meta.url), "utf8"));
const meta = { counts: { API: 2, "API-VERSION": 2, DATABASE: 2, EVENT: 1, OPERATION: 2 }, layers: { API: ["API", "API-VERSION"], RUNTIME: ["OPERATION", "DATABASE", "EVENT"] } };
const db = { id: "db:one", name: "bank$&", type: "DATABASE" };
const db2 = { id: "db:two", name: "bank$&", type: "DATABASE" };

describe("catalog question assistance", () => {
  it("browses all real templates for a generic assistance request", () => {
    expect(assistQuestions(catalog, "What questions can I ask?")).toHaveLength(529);
    expect(assistQuestions(null)).toEqual([]);
  });
  it("matches natural phrasing across question words and catalog context", () => {
    const results = assistQuestions(catalog, "Help me find questions about database reads");
    expect(results.some(item => item.question === "Which operations read from {database}?")).toBe(true);
    expect(results.every(item => catalog.templates.some(template => template.question === item.question))).toBe(true);
    expect(assistQuestions(catalog, "unicorns on mars")).toEqual([]);
  });
  it("understands common topic terms and respects layer filters", () => {
    expect(assistQuestions(catalog, "ownership").length).toBeGreaterThan(0);
    expect(assistQuestions(catalog, "sensitive").some(item => item.question.includes("PII"))).toBe(true);
    expect(assistQuestions(catalog, "impact", "runtime").every(item => item.layer === "runtime")).toBe(true);
    expect(assistQuestions(catalog, "dependencies").length).toBeGreaterThan(0);
  });
  it("includes samples without duplicates and keeps template parameters", () => {
    const question = catalog.templates[0].question;
    const results = assistQuestions({ ...catalog, tree: { api: { inventory: { questions: [question, "A ready sample question?"] } } } });
    expect(results.filter(item => item.question === question)).toHaveLength(1);
    expect(results.find(item => item.question === "A ready sample question?").parameters).toEqual([]);
    expect(results.find(item => item.question === "Which operations read from {database}?").parameters).toEqual(["database"]);
  });
  it("distinguishes entity selectors, collections, properties and numeric values", () => {
    expect(assistParameter("database_or_event", catalog.definitions, meta).types).toEqual(["DATABASE", "EVENT"]);
    expect(assistParameter("runtime_node_set", catalog.definitions, meta)).toMatchObject({ multiple: true, types: meta.layers.RUNTIME });
    expect(assistParameter("api_version_set", catalog.definitions, meta).types).toEqual(["API-VERSION"]);
    expect(assistParameter("api_name", catalog.definitions, meta).types).toEqual([]);
    expect(assistParameter("name_or_text", catalog.definitions, meta).types).toEqual([]);
    expect(assistParameter("max_depth", catalog.definitions, meta).numeric).toBe(true);
  });
  it("fills repeated values literally and retains exact entity identity", () => {
    const result = resolveAssistQuestion("Trace {database} on {host} to {database} within {max_depth} hops.", { database: db, host: "host$&", max_depth: "0" }, catalog.definitions, meta);
    expect(result).toMatchObject({ complete: true, question: "Trace bank$& on host$& to bank$& within 0 hops.", entities: [db], errors: {} });
  });
  it("rejects missing values, unresolved placeholders, wrong types and invalid depth", () => {
    expect(resolveAssistQuestion("Read {database}", { database: "bank" }, catalog.definitions, meta).complete).toBe(false);
    expect(resolveAssistQuestion("Read {database}", { database: { ...db, type: "API" } }, catalog.definitions, meta).complete).toBe(false);
    for (const max_depth of ["", "-1", "1.5", "NaN", "{max_depth}"]) expect(resolveAssistQuestion("Depth {max_depth}", { max_depth }, catalog.definitions, meta).complete).toBe(false);
  });
  it("requires distinct set members and uses IDs to disambiguate duplicate names", () => {
    expect(resolveAssistQuestion("Compare {runtime_node_set}", { runtime_node_set: [db, db] }, catalog.definitions, meta).complete).toBe(false);
    expect(resolveAssistQuestion("Compare {runtime_node_set}", { runtime_node_set: [db, db2] }, catalog.definitions, meta)).toMatchObject({ question: "Compare db:one, db:two", complete: true, entities: [db, db2] });
  });
  it("carries multiple independent parameter entities to the query context", () => {
    const api = { id: "api:one", name: "Loans", type: "API" };
    expect(resolveAssistQuestion("Trace {api} to {database}", { api, database: db }, catalog.definitions, meta)).toMatchObject({ complete: true, entities: [api, db] });
    expect(resolveAssistQuestion("Which APIs exist?", {}, catalog.definitions, meta)).toMatchObject({ complete: true, entities: [], question: "Which APIs exist?" });
  });
});
