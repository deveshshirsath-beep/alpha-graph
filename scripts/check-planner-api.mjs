/** Read-only smoke test for the merged-graph-v4 API contract; never modifies a graph. */
import assert from "node:assert/strict";
import { PlannerApi, resultPagination } from "../src/planner-api.js";
import { returnedResultTables, showResultDiagrams } from "../src/planner-results.js";

const base = process.env.GRAPH_QA_API_URL || "http://127.0.0.1:8000";
const graphId = process.env.GRAPH_QA_TEST_GRAPH_ID || "merged-graph-v4";
const api = new PlannerApi({ fetchImpl: (path, options) => fetch(new URL(path, base), {
  ...options, headers: { ...options.headers, ...(process.env.GRAPH_QA_BEARER_TOKEN ? { Authorization: `Bearer ${process.env.GRAPH_QA_BEARER_TOKEN}` } : {}) },
}) });
const answer = question => api.answer(graphId, question, []);

const count = await answer("How many operations exist?");
assert.equal(count.status, "answered");
assert.equal(showResultDiagrams(count), false);
assert.deepEqual(returnedResultTables(count), []);
const expected = count.evidenceResult.rows[0].count;
assert.ok(expected > 100, "This smoke fixture needs more than one operation page");

const initial = await answer("Give me the list of all operations.");
const seen = new Set();
let current = initial, pages = 0;
while (true) {
  assert.equal(current.status, "answered");
  const page = resultPagination(current);
  assert.equal(page.totalItems, expected);
  assert.equal(page.totalIsExact, true);
  assert.equal(current.snapshotFingerprint, initial.snapshotFingerprint);
  assert.equal(returnedResultTables(current).at(-1).rows.length, page.returnedItems);
  for (const row of current.evidenceResult.rows) {
    assert.ok(row.id && !seen.has(row.id), "Each operation must occur once across pages");
    seen.add(row.id);
  }
  pages += 1;
  if (!page.hasMore) break;
  assert.ok(page.nextOffset > page.offset && pages < 500, "Pagination must advance within the smoke-test limit");
  current = await api.page(initial, page.nextOffset);
}
assert.equal(seen.size, expected);
console.log(`PASS: exact count and complete pagination (${expected} operations, ${pages} pages)`);

const inventory = await answer("Which business areas and APIs exist?");
assert.equal(inventory.status, "answered");
assert.equal(returnedResultTables(inventory)[0].title, "Inventory by entity type");
assert.equal(returnedResultTables(inventory)[0].rows.length, 2);
console.log("PASS: multi-type inventory summaries and full returned tables");

const question = "List operations under Loan API";
const clarification = await answer(question);
assert.equal(clarification.status, "clarification_required");
const id = clarification.clarification.entities[0].candidates[0].id;
const selected = await api.answer(graphId, question, [id]);
assert.equal(selected.status, "answered");
assert.ok(selected.resolvedEntities.some(group => group.selectedIds.includes(id)));
console.log("PASS: ambiguity resolved only with the selected exact entity ID");

assert.equal((await answer("List operations under utterly-absent-zzzzscope")).status, "no_match");
assert.equal((await answer("List operations classified as PII and not PII")).status, "no_evidence");
assert.equal((await answer("Delete all APIs")).status, "unsupported");
console.log("PASS: no-match, no-evidence and unsupported-write outcomes remain distinct");
