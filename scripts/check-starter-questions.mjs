/** Live read-only API assertions against independent lookups in the source graph. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PlannerApi } from "../src/planner-api.js";
import { starterQuestionsForGraph } from "../src/planner-starters.js";

const base = process.env.GRAPH_QA_API_URL || "http://127.0.0.1:8000";
const graph = JSON.parse(await readFile(process.env.GRAPH_QA_TEST_GRAPH_PATH || "merged-graph-v4.json", "utf8"));
const nodes = new Map(graph.nodes.map(node => [node.id, node]));
const edges = new Map(graph.edges.map(edge => [edge.id, edge]));
const api = new PlannerApi({ fetchImpl: (path, options) => fetch(new URL(path, base), {
  ...options, headers: { ...options.headers, ...(process.env.GRAPH_QA_BEARER_TOKEN ? { Authorization: `Bearer ${process.env.GRAPH_QA_BEARER_TOKEN}` } : {}) },
}) });
const ofType = (...types) => new Set(graph.nodes.filter(node => types.includes(node.type)).map(node => node.id));
const named = (name, type) => {
  const matches = graph.nodes.filter(node => node.name === name && node.type === type);
  assert.equal(matches.length, 1, `Fixture must resolve ${name} uniquely`);
  return new Set([matches[0].id]);
};
function hop(input, relationship, type, reverse = false) {
  return new Set(graph.edges.filter(edge => edge.relationshipType === relationship
    && input.has(reverse ? edge.targetId : edge.sourceId)
    && nodes.get(reverse ? edge.sourceId : edge.targetId)?.type === type)
    .map(edge => reverse ? edge.sourceId : edge.targetId));
}
const domainApis = domains => hop(hop(hop(hop(domains, "CONTAINS", "SERVICE-DOMAIN"), "CONTAINS", "BUSINESS-CAPABILITY"), "IMPLEMENTS", "APPLICATION", true), "EXPOSES", "API");
const operations = apis => hop(hop(hop(apis, "CONTAINS", "API-VERSION"), "CONTAINS", "ENDPOINT"), "CONTAINS", "OPERATION");
const portfolio = domainApis(hop(named("Accounts and Deposits", "BUSINESS-AREA"), "CONTAINS", "BUSINESS-DOMAIN"));
const scoped = operations(portfolio);
const cards = operations(domainApis(named("Cards", "BUSINESS-DOMAIN")));
const pii = hop(ofType("PII"), "CLASSIFIED-AS", "OPERATION", true);
const pci = hop(ofType("PCI"), "CLASSIFIED-AS", "OPERATION", true);
const subset = predicate => new Set([...scoped].filter(predicate));
const expected = {
  inventory: ofType("APPLICATION", "API"),
  "api-count": ofType("API"),
  portfolio,
  "database-readers": hop(named("banking_demo-postgres", "DATABASE"), "READS-FROM", "OPERATION", true),
  "both-classifications": subset(id => pii.has(id) && pci.has(id)),
  "classification-exclusion": subset(id => pii.has(id) && !pci.has(id)),
  "exclusive-classifications": subset(id => pii.has(id) !== pci.has(id)),
  "portfolio-comparison": new Set([...scoped, ...cards]),
};
for (const item of starterQuestionsForGraph("merged-graph-v4")) {
  const result = await api.answer("merged-graph-v4", item.question, []);
  assert.equal(result.status, "answered", item.question);
  assert.ok(result.answer.length > 40 && result.requestId && result.snapshotFingerprint);
  const rows = result.evidenceResult.rows;
  const count = item.id === "api-count" ? rows[0].count : result.evidenceResult.metadata.pagination.totalItems;
  assert.equal(count, expected[item.id].size, `Independent graph total: ${item.id}`);
  assert.ok(count > 0 && rows.length > 0, `Nonempty evidence: ${item.id}`);
  if (item.id !== "api-count") {
    assert.equal(result.evidenceResult.metadata.pagination.totalIsExact, true);
    assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
    for (const row of rows) assert.ok(expected[item.id].has(row.id), `Every returned row must satisfy all conditions: ${item.id}`);
  }
  const visibleIds = new Set(result.matchedGraph.nodes.map(node => node.id));
  for (const id of visibleIds) assert.ok(nodes.has(id), "Evidence node exists in source graph");
  for (const edge of result.matchedGraph.edges) {
    assert.ok(visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId), "No dangling evidence edges");
    const source = edges.get(edge.id);
    assert.ok(source && source.sourceId === edge.sourceId && source.targetId === edge.targetId && source.relationshipType === edge.relationshipType, "Traceable source edge");
  }
  const operators = result.plan.steps.filter(step => step.op === "set").map(step => step.set_operator);
  if (item.id === "both-classifications") assert.ok(operators.includes("intersection"));
  if (item.id === "classification-exclusion") assert.ok(operators.includes("difference"));
  if (item.id === "exclusive-classifications") for (const op of ["union", "intersection", "difference"]) assert.ok(operators.includes(op));
  if (item.id === "portfolio-comparison") {
    assert.ok(result.plan.steps.some(step => step.op === "compare"));
    assert.equal(result.evidenceResult.metadata.intersectionCount, [...scoped].filter(id => cards.has(id)).length);
    for (const row of rows) assert.equal(row.presentCount, Number(scoped.has(row.id)) + Number(cards.has(row.id)), "Comparison membership is source-backed");
  }
  console.log(JSON.stringify({ id: item.id, status: result.status, total: count, returnedRows: rows.length, nodes: visibleIds.size, edges: result.matchedGraph.edges.length, planner: result.plannerProvider, answer: result.answerProvider, summary: result.answer.split("\n\n")[0], warnings: result.warnings }));
}
console.log("PASS: all eight starter questions, exact independent totals, all returned row predicates, and source-backed evidence edges");
