/** Semantic API regressions with independent joins against the source snapshot. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PlannerApi } from "../src/planner-api.js";

const base = process.env.GRAPH_QA_API_URL || "http://127.0.0.1:4173";
const graph = JSON.parse(await readFile("merged-graph-v4.json", "utf8"));
const api = new PlannerApi({ fetchImpl: (path, options) => fetch(new URL(path, base), {
  ...options, headers: { ...options.headers, ...(process.env.GRAPH_QA_BEARER_TOKEN ? { Authorization: `Bearer ${process.env.GRAPH_QA_BEARER_TOKEN}` } : {}) },
}) });
const byType = type => graph.nodes.filter(node => node.type === type);
const hop = (ids, relation, reverse = false) => new Set(graph.edges
  .filter(edge => edge.relationshipType === relation && ids.has(reverse ? edge.targetId : edge.sourceId))
  .map(edge => reverse ? edge.sourceId : edge.targetId));
async function allIds(label, question, expected, selected = []) {
  const initial = await api.answer("merged-graph-v4", question, selected);
  let result = initial;
  const actual = new Set();
  let pages = 0;
  for (; pages < 100; pages++) {
    assert.equal(result.status, expected.size ? "answered" : "no_evidence", label);
    const page = result.evidenceResult.metadata.pagination;
    assert.equal(page.totalItems, expected.size, label + " total");
    assert.equal(page.totalIsExact, true);
    for (const row of result.evidenceResult.rows) {
      assert.ok(!actual.has(row.id), label + " duplicate row");
      actual.add(row.id);
    }
    if (!page.hasMore) break;
    assert.ok(page.nextOffset > page.offset);
    result = await api.page(initial, page.nextOffset);
    assert.equal(result.snapshotFingerprint, initial.snapshotFingerprint);
  }
  assert.deepEqual(actual, expected, label + " exact membership across every page");
  console.log(JSON.stringify({ check: label, total: actual.size, pages: pages + 1, status: initial.status }));
}
for (const layer of ["Business", "API", "Runtime"]) {
  const expected = {};
  for (const node of graph.nodes.filter(node => node.layer === layer.toUpperCase())) expected[node.type] = (expected[node.type] || 0) + 1;
  const result = await api.answer("merged-graph-v4", "How many nodes of each " + layer + "-layer type exist?", []);
  assert.equal(result.status, "answered");
  assert.deepEqual(Object.fromEntries(result.evidenceResult.rows.map(row => [row.type, row.count])), expected);
  const total = Object.values(expected).reduce((sum, value) => sum + value, 0);
  assert.ok(result.answer.includes(total.toLocaleString("en-US") + " entities"), "Narrative must count entities, not aggregate rows");
  console.log(JSON.stringify({ check: layer + " grouped counts", total, types: Object.keys(expected).length }));
}
const search = await api.answer("merged-graph-v4", "Which Business-layer nodes match fraud?", []);
assert.equal(search.status, "answered");
assert.ok(search.evidenceResult.rows.length);
assert.ok(search.evidenceResult.rows.every(row => row.layer === "BUSINESS"));
console.log(JSON.stringify({ check: "Business-only search", returned: search.evidenceResult.rows.length }));
for (const [label, type, parent] of [["service domains", "SERVICE-DOMAIN", "business domain"], ["business capabilities", "BUSINESS-CAPABILITY", "service domain"]]) {
  const expected = new Set(byType(type).filter(node => hop(new Set([node.id]), "CONTAINS", true).size !== 1).map(node => node.id));
  await allIds(label + " parent exceptions", "Which " + label + " have no parent " + parent + ", or more than one parent?", expected);
}
const question = "Which business areas, domains, capabilities, and capability-owning teams appear in the reverse business-context rollup of Mortgage Loan API?";
const ambiguous = await api.answer("merged-graph-v4", question, []);
assert.equal(ambiguous.status, "clarification_required");
const roots = byType("API").filter(node => node.name === "Mortgage Loan API");
assert.equal(roots.length, 2);
for (const root of roots) {
  const caps = hop(hop(new Set([root.id]), "EXPOSES", true), "IMPLEMENTS");
  const teams = hop(caps, "OWNS", true);
  const domains = hop(hop(caps, "CONTAINS", true), "CONTAINS", true);
  const areas = hop(domains, "CONTAINS", true);
  await allIds("Mortgage Loan API " + root.id, question, new Set([...areas, ...domains, ...caps, ...teams]), [root.id]);
}
const capabilities = hop(hop(hop(new Set(["BUSINESS-AREA:accounts-and-deposits"]), "CONTAINS"), "CONTAINS"), "CONTAINS");
const applications = hop(capabilities, "IMPLEMENTS", true);
const apis = hop(applications, "EXPOSES");
const endpoints = hop(hop(apis, "CONTAINS"), "CONTAINS");
const operations = hop(endpoints, "CONTAINS");
await allIds("Complete business estate", "What is the complete capability, application, API, endpoint, and operation estate under Accounts and Deposits?", new Set([...capabilities, ...applications, ...apis, ...endpoints, ...operations]));
await allIds("Capability-owning teams", "Which teams own capabilities implemented by payments-app?", hop(hop(new Set(["APPLICATION:payments-app"]), "IMPLEMENTS"), "OWNS", true));
const unfilled = await api.answer("merged-graph-v4", "Which operations read from {database}?", []);
assert.equal(unfilled.status, "clarification_required");
assert.equal(unfilled.plan.reason_code, "question_parameters_required");
assert.deepEqual(unfilled.plan.steps, []);
console.log("PASS: catalog semantic regressions, exact full-page membership, ambiguity, and unfinished-input safety");

// Compound-family oracles deliberately use direct source-edge joins, not the
// planner's compiler, path finder, or returned plan as the expected answer.
const idsOf = nodes => new Set(nodes.map(node => node.id));
const intersection = (a, b) => new Set([...a].filter(id => b.has(id)));
const pii = hop(idsOf(byType("PII")), "CLASSIFIED-AS", true);
const pci = hop(idsOf(byType("PCI")), "CLASSIFIED-AS", true);
const classified = new Set([...pii, ...pci]);
const external = hop(idsOf(byType("EXPOSURE").filter(node => node.name === "External")), "HAS-EXPOSURE", true);
await allIds("External PII conjunction", "Which External operations are classified as PII?", intersection(external, pii));
await allIds("External PCI conjunction", "Which External operations are classified as PCI?", intersection(external, pci));
const event = byType("EVENT").find(node => node.name === "banking.api.events-unknown");
assert.ok(event);
await allIds("PII/PCI event producers", "Which PII or PCI operations produce banking.api.events-unknown?", intersection(classified, hop(new Set([event.id]), "PRODUCES", true)), [event.id]);
const unsubscribed = new Set([...classified].filter(id => hop(new Set([id]), "SUBSCRIBES", true).size === 0));
await allIds("Classified operations without consumers", "Which PII or PCI operations have no subscribing consumer?", unsubscribed);
const requiredProperties = ["httpMethod", "path", "service", "serviceCategory", "operationId"];
const missing = idsOf(byType("OPERATION").filter(node => requiredProperties.some(key => node.properties?.[key] == null || String(node.properties[key]).trim() === "")));
await allIds("Missing/blank operation properties", "Which operations have missing or blank httpMethod, path, service, serviceCategory, or operationId properties?", missing);
const multipleStatus = idsOf(byType("OPERATION").filter(node => hop(new Set([node.id]), "RETURNS").size > 1));
await allIds("Distinct status-code neighbors", "Which operations return multiple modeled status codes?", multipleStatus);
const multiParent = idsOf(byType("SERVICE-DOMAIN").filter(node => hop(new Set([node.id]), "CONTAINS", true).size > 1));
await allIds("Multiply referenced service domains", "Which service domains are referenced by multiple business domains?", multiParent);
const crosses = idsOf(byType("BUSINESS-CAPABILITY").filter(node => hop(new Set([node.id]), "CONTAINS", true).size > 1));
await allIds("Cross-boundary capabilities", "Which capabilities cross service-domain boundaries?", crosses);
const shared = idsOf(byType("BUSINESS-DOMAIN").filter(node => [...hop(new Set([node.id]), "CONTAINS")].some(id => hop(new Set([id]), "CONTAINS", true).size > 1)));
await allIds("Overlapping domain membership", "Which business domains share or overlap in service-domain membership?", shared);
const spanning = idsOf(byType("APPLICATION").filter(node => {
  const services = hop(hop(new Set([node.id]), "IMPLEMENTS"), "CONTAINS", true);
  const domains = hop(services, "CONTAINS", true);
  return [services, domains, hop(domains, "CONTAINS", true)].some(ids => ids.size > 1);
}));
await allIds("Applications spanning business boundaries", "Which applications span multiple service domains, business domains, or business areas through the capabilities they implement?", spanning);
const governedOperations = hop(idsOf(byType("SECURITY").filter(node => node.name === "OAuth 2")), "IMPLEMENTS", true);
const governedApis = hop(hop(hop(governedOperations, "CONTAINS", true), "CONTAINS", true), "CONTAINS", true);
const governedCapabilities = hop(hop(governedApis, "EXPOSES", true), "IMPLEMENTS");
await allIds("Security-governed business context", "Which business capabilities are associated with operations governed by OAuth 2?", governedCapabilities);
// Reverse runtime dependency paths include callers, not just direct database users.
const database = byType("DATABASE").find(node => node.name === "banking_demo-postgres");
assert.ok(database);
const runtimeRelations = new Set(["CALLS", "ROUTES-TO", "SUBSCRIBES", "READS-FROM", "CONNECTS-TO", "WRITES-TO", "UPDATES-TO", "DELETE-FROM", "CONSUMES", "PRODUCES"]);
const upstream = new Set([database.id]);
let frontier = new Set([database.id]);
for (let depth = 0; depth < 6 && frontier.size; depth++) {
  const next = new Set(graph.edges.filter(edge => runtimeRelations.has(edge.relationshipType) && frontier.has(edge.targetId) && !upstream.has(edge.sourceId)).map(edge => edge.sourceId));
  for (const id of next) upstream.add(id);
  frontier = next;
}
const upstreamOperations = intersection(upstream, idsOf(byType("OPERATION")));
await allIds("Database-upstream runtime paths", "Starting from banking_demo-postgres, which operations are upstream?", upstreamOperations, [database.id]);
const coverage = await api.answer("merged-graph-v4", "What percentage of each business hierarchy level is linked to its expected parent and child types?", []);
assert.equal(coverage.status, "answered");
const hierarchy = ["BUSINESS-AREA", "BUSINESS-DOMAIN", "SERVICE-DOMAIN", "BUSINESS-CAPABILITY"];
const expectedCoverage = [];
for (const { reverse, types, alias } of [{ reverse: true, types: hierarchy.slice(1), alias: "parentCoverageRatio" }, { reverse: false, types: hierarchy.slice(0, -1), alias: "childCoverageRatio" }]) {
  for (const type of types) {
    const nodes = byType(type);
    const connected = nodes.filter(node => hop(new Set([node.id]), "CONTAINS", reverse).size > 0).length;
    expectedCoverage.push({ type, entityCount: nodes.length, [alias]: connected / nodes.length });
  }
}
assert.deepEqual(coverage.evidenceResult.rows, expectedCoverage);
console.log("PASS: compound catalog families match independent full-snapshot joins and coverage denominators");
