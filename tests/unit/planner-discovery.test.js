import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bindQuestion, parseQuestionCatalog, parseQuestionTemplates, parameterTypes, questionAnchor, questionParameters, relevantCatalogQuestions, relationshipsForType, searchEntities } from "../../src/planner-discovery.js";

const catalog = parseQuestionTemplates(readFileSync(new URL("../../public/question-catalogs/merged-graph-v4-questions.yaml", import.meta.url), "utf8"));
const meta = {
  counts: { DATABASE: 9, EVENT: 5, OPERATION: 1932, API: 1842, "API-VERSION": 1842, "BUSINESS-AREA": 14, TEAMS: 68, PII: 1, PCI: 1, FIELD: 52935, SCHEMA: 3909 },
  layers: { BUSINESS: ["BUSINESS-AREA", "TEAMS"], API: ["API", "API-VERSION", "PII", "PCI", "FIELD", "SCHEMA"], RUNTIME: ["DATABASE", "EVENT", "OPERATION"] },
  edgeCounts: { "READS-FROM": 1642, CALLS: 286, "DELETE-FROM": 0 },
  relationshipSchema: [{ source: "OPERATION", relationship: "READS-FROM", target: "DATABASE", count: 1640 }, { source: "EVENT", relationship: "READS-FROM", target: "DATABASE", count: 2 }, { source: "OPERATION", relationship: "CALLS", target: "OPERATION", count: 273 }],
};
const database = { id: "db:banking", name: "banking_demo-postgres", type: "DATABASE" };

describe("entity-aware catalog discovery", () => {
  it("loads all 320 sidebar samples without treating catalog metadata as questions", () => {
    const samples = parseQuestionCatalog(readFileSync(new URL("../../public/question-catalogs/merged-graph-v4-questions.yaml", import.meta.url), "utf8"));
    const count = value => (value.questions?.length || 0) + Object.entries(value).filter(([key]) => key !== "questions").reduce((sum, [, child]) => sum + count(child), 0);
    expect(samples.total).toBe(320);
    expect(Object.keys(samples.tree)).toEqual(["business", "api", "runtime"]);
    expect(Object.values(samples.tree).map(count)).toEqual([80, 130, 110]);
    expect(samples.tree.business.inventory_and_coverage.questions[0]).toBe("Which business areas, business domains, service domains, business capabilities, and teams exist?");
    expect(() => parseQuestionCatalog("layers:\n  business:\n")).toThrow("Sample question catalog not found");
  });
  it("loads every actual template, its category and stored relationship direction", () => {
    expect(catalog.templates).toHaveLength(529);
    expect(catalog.templates.find((item) => item.question === "Which operations read from {database}?")).toMatchObject({ layer: "runtime", category: "direct_reverse_edges", path: "DATABASE <-[READS-FROM]- OPERATION" });
    expect(catalog.templates.some((item) => item.question.includes("Unsupported"))).toBe(false);
  });
  it("files each question under the one entity type it asks about", () => {
    const anchor = (question, extra = {}) => questionAnchor({ question, ...extra }, catalog.definitions, meta);
    expect(anchor("Which operations read from {database}?", { path: "DATABASE <-[READS-FROM]- OPERATION" })).toBe("DATABASE");
    expect(anchor("What is the shortest evidence path from {team_or_capability_or_business_area} to {api_or_operation}?")).toBe("TEAMS");
    expect(anchor("Which API versions have no endpoints?")).toBe("API-VERSION");
    expect(anchor("Which Business-layer nodes match {name_or_text}?", { layer: "business" })).toBe("BUSINESS-AREA");
  });
  it("binds only compatible entity selectors and keeps required properties or collections explicit", () => {
    const result = bindQuestion("Compare {database} with {event}, on {host}, for {runtime_node_set} within {max_depth} hops.", database, catalog.definitions, meta);
    expect(result.question).toBe("Compare banking_demo-postgres with {event}, on {host}, for {runtime_node_set} within {max_depth} hops.");
    expect(result.remaining).toEqual(["event", "host", "runtime_node_set", "max_depth"]);
    expect(result.bound).toEqual(["database"]);
    expect(parameterTypes("api_version", catalog.definitions, meta)).toEqual(["API-VERSION"]);
    expect(parameterTypes("api_or_operation", catalog.definitions, meta)).not.toContain("API-VERSION");
  });
  it("handles composite selectors, aliases and literal dollar signs safely", () => {
    expect(bindQuestion("Trace {database_or_event} and {name_or_text}.", { ...database, name: "a$&b" }, catalog.definitions, meta).question).toBe("Trace a$&b and a$&b.");
    expect(parameterTypes("classification", catalog.definitions, meta)).toEqual(["PII", "PCI"]);
    expect(parameterTypes("team", catalog.definitions, meta)).toEqual(["TEAMS"]);
    expect(parameterTypes("business_or_api_root", catalog.definitions, meta)).toContain("BUSINESS-AREA");
    expect(parameterTypes("host", catalog.definitions, meta)).toEqual([]);
    expect(parameterTypes("service", catalog.definitions, meta)).toEqual([]);
  });
  it("finds database-read templates across layers without replacing operation parameters", () => {
    const result = relevantCatalogQuestions(catalog, { type: "DATABASE", entity: database, relationship: "READS-FROM" }, meta);
    expect(result.templates.some((item) => item.question === "Which operations read from banking_demo-postgres?")).toBe(true);
    expect(result.templates.some((item) => item.question.includes("business areas"))).toBe(true);
    expect(result.templates.every((item) => !item.bound.includes("operation"))).toBe(true);
    expect(result.templates.some((item) => item.template === "Which databases and tables does {operation} read from?")).toBe(false);
  });
  it("keeps catalog examples unchanged and recognizes named examples through template shapes", () => {
    const combined = { ...catalog, tree: { runtime: { direct_reverse_edges: { questions: ["Which operations read from hierarchy_v6-postgres?", "Which operations call another-operation?"] } } } };
    const result = relevantCatalogQuestions(combined, { type: "DATABASE", entity: database, relationship: "READS-FROM" }, meta);
    expect(result.samples.map((item) => item.question)).toEqual(["Which operations read from hierarchy_v6-postgres?"]);
  });
  it("filters by type before selecting a name and searches filled prompts", () => {
    const scoped = relevantCatalogQuestions(catalog, { type: "DATABASE" }, meta, "operations read from");
    expect(scoped.templates[0].remaining).toContain("database");
    expect(relevantCatalogQuestions(catalog, { type: "DATABASE", entity: database }, meta, "banking_demo").templates.length).toBeGreaterThan(10);
    expect(relevantCatalogQuestions(catalog, { type: "DATABASE", entity: database }, meta, "nothing_matches_here").templates).toEqual([]);
    expect(relevantCatalogQuestions(catalog, { type: "DATABASE" }, meta).templates.some((item) => item.question === "Which Business-layer nodes match {name_or_text}?")).toBe(false);
  });
  it("retains missing values for explicit editing and handles a templates-only catalog", () => {
    expect(questionParameters("Read {database} and {database}, depth {max_depth}." )).toEqual(["database", "max_depth"]);
    expect(questionParameters("Which operations does /v1/accounts/{account_id} contain?")).toEqual([]);
    expect(questionParameters("Trace {endpoint} to /v1/accounts/{id}.")).toEqual(["endpoint"]);
    expect(bindQuestion("Read {database}", null, catalog.definitions, meta).remaining).toEqual(["database"]);
    expect(relevantCatalogQuestions(catalog, { relationship: "READS-FROM" }, meta).templates.length).toBeGreaterThan(0);
  });
  it("searches names and exact IDs without dropping duplicate names", () => {
    const entities = [{ ...database, id: "db:one" }, { ...database, id: "db:two" }, { id: "db:other", name: "other" }];
    expect(searchEntities(entities, "banking demo")).toHaveLength(2);
    expect(searchEntities(entities, "db:two")).toEqual([entities[1]]);
    expect(searchEntities(entities, "absent")).toEqual([]);
  });
  it("uses actual populated signatures and counts without double-counting same-type edges", () => {
    expect(relationshipsForType(meta, "DATABASE")).toMatchObject([{ relationship: "READS-FROM", count: 1642 }]);
    expect(relationshipsForType(meta, "OPERATION").find((row) => row.relationship === "CALLS").count).toBe(273);
    expect(relationshipsForType(meta).some((row) => row.relationship === "DELETE-FROM")).toBe(false);
    expect(relationshipsForType(meta, "UNKNOWN")).toEqual([]);
  });
});
