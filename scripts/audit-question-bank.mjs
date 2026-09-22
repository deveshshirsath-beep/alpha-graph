/** Read-only, full-bank API/adapter/rendering audit. Not a semantic correctness oracle. */
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile, appendFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { parseQuestionCatalog, parseQuestionTemplates, questionParameters } from "../src/planner-discovery.js";
import { assistParameter, resolveAssistQuestion } from "../src/planner-assist-search.js";
import { PlannerApi } from "../src/planner-api.js";
import { returnedResultTables, resultNarrative } from "../src/planner-results.js";

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const base = option("--base-url", "http://127.0.0.1:4173");
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname)) throw new Error("Audit must target a local API.");
const report = resolve(option("--output", "docs/question-bank-audit"));
const workerCount = Number(option("--workers", "4"));
assert.ok(Number.isInteger(workerCount) && workerCount >= 1 && workerCount <= 8, "Choose 1–8 audit workers.");
const text = await readFile("public/question-catalogs/merged-graph-v4-questions.yaml", "utf8");
const graph = JSON.parse(await readFile("merged-graph-v4.json", "utf8"));
const catalog = { ...parseQuestionCatalog(text), ...parseQuestionTemplates(text) };
assert.equal(catalog.total, 320);
assert.equal(catalog.templates.length, 529);
const nodes = new Map(graph.nodes.map(node => [node.id, node]));
const edges = new Map(graph.edges.map(edge => [edge.id, edge]));
const degree = new Map();
for (const edge of graph.edges) for (const id of [edge.sourceId, edge.targetId]) degree.set(id, (degree.get(id) || 0) + 1);
const meta = { counts: {}, layers: {} };
for (const node of graph.nodes) {
  meta.counts[node.type] = (meta.counts[node.type] || 0) + 1;
  (meta.layers[node.layer] ||= new Set()).add(node.type);
}
for (const key of Object.keys(meta.layers)) meta.layers[key] = [...meta.layers[key]];
const preferred = new Set(["Accounts and Deposits", "Mortgage Loan API", "payments-app", "banking_demo-postgres", "OAuth 2", "External"]);
const ranked = [...graph.nodes].sort((a, b) => Number(preferred.has(b.name)) - Number(preferred.has(a.name)) || (degree.get(b.id) || 0) - (degree.get(a.id) || 0) || a.id.localeCompare(b.id));
const property = (key, edge = false) => (edge ? graph.edges : ranked).map(item => item.properties?.[key]).flat().find(value => typeof value === "string" && value && value !== "unknown");
const literals = { max_depth: "3", name_or_text: "banking", api_name: "Mortgage Loan API", canonical_path: property("canonicalPath"), host: property("host"),
  service: property("service"), query: property("query", true), table_name: property("tableName", true), table_name_or_query: property("tableName", true) || property("query", true) };
const cases = [];
function samples(node, path = []) {
  for (const question of node.questions || []) cases.push({ kind: "sample", category: path.join(" / "), question, selectedIds: [] });
  for (const [key, child] of Object.entries(node)) if (key !== "questions" && child && typeof child === "object") samples(child, [...path, key]);
}
samples(catalog.tree);
for (const template of catalog.templates) {
  const parameters = questionParameters(template.question);
  const category = [template.layer, template.category, template.section].filter(Boolean).join(" / ");
  for (let variant = 0; variant < (parameters.length ? 2 : 1); variant++) {
    const values = {};
    for (const parameter of parameters) {
      const spec = assistParameter(parameter, catalog.definitions, meta);
      if (spec.types.length || spec.multiple) {
        const options = ranked.filter(node => spec.types.includes(node.type));
        assert.ok(options.length >= (spec.multiple ? 2 : 1), `No fixture for ${parameter}`);
        values[parameter] = spec.multiple ? options.slice(variant, variant + 2) : options[Math.min(variant, options.length - 1)];
      } else {
        assert.ok(literals[parameter], `No literal fixture for ${parameter}`);
        values[parameter] = parameter === "max_depth" && variant ? "0" : literals[parameter];
      }
    }
    const prepared = resolveAssistQuestion(template.question, values, catalog.definitions, meta);
    assert.ok(prepared.complete, JSON.stringify(prepared.errors));
    cases.push({ kind: "template-filled", category, template: template.question, variant, question: prepared.question, selectedIds: prepared.entities.map(entity => entity.id) });
  }
  if (parameters.length) cases.push({ kind: "template-unfilled", category, question: template.question, selectedIds: [] });
}
cases.forEach((item, index) => { item.number = index + 1; });
const api = new PlannerApi({ fetchImpl: (path, options) => fetch(new URL(path, base), { ...options,
  headers: { ...options.headers, ...(process.env.GRAPH_QA_BEARER_TOKEN ? { Authorization: `Bearer ${process.env.GRAPH_QA_BEARER_TOKEN}` } : {}) },
}) });
await mkdir(dirname(report), { recursive: true });
const rows = [];
let cursor = 0, writes = Promise.resolve();
const jsonl = report + ".jsonl";
await writeFile(jsonl, "");
function validate(result) {
  assert.ok(result.requestId && result.snapshotFingerprint);
  const graphResult = result.matchedGraph;
  const visible = new Set(graphResult.nodes.map(node => node.id));
  for (const id of visible) assert.ok(nodes.has(id), `Unknown evidence node ${id}`);
  for (const edge of graphResult.edges) {
    const original = edges.get(edge.id);
    assert.ok(original && original.sourceId === edge.sourceId && original.targetId === edge.targetId && original.relationshipType === edge.relationshipType, "Invented evidence edge");
    assert.ok(visible.has(edge.sourceId) && visible.has(edge.targetId), "Dangling evidence edge");
  }
  const tables = returnedResultTables(result);
  for (const table of tables) {
    assert.ok(table.columns.length > 0);
    assert.ok(table.rows.every(row => row.length === table.columns.length));
  }
  assert.ok(resultNarrative({ result }, tables[0]).trim());
  assert.ok(!result.plan.steps.some(step => step.op === "search" && /\{[a-z_]+\}/.test(step.query || "")), "Unresolved placeholder executed as search");
  return tables;
}
async function run(item) {
  const start = Date.now();
  const record = { ...item, semanticVerified: false };
  try {
    const result = await api.answer("merged-graph-v4", item.question, item.selectedIds);
    const tables = validate(result);
    Object.assign(record, { status: result.status, reason: result.plan.reason_code, planner: result.plannerProvider,
      answer: resultNarrative({ result }, tables[0]), plan: result.plan, rows: result.evidenceResult?.rows,
      tables, warnings: result.warnings, requestId: result.requestId, fingerprint: result.snapshotFingerprint });
    if (item.kind === "template-unfilled") assert.equal(result.status, "clarification_required", "Unfilled template must request parameters");
    if (result.status === "clarification_required" && result.clarification?.entities?.length && item.kind !== "template-unfilled") {
      const selected = [...item.selectedIds];
      for (const group of result.clarification.entities) if (group.candidates?.length) selected.push(group.candidates[0].id);
      if (selected.length > item.selectedIds.length) {
        const retried = await api.answer("merged-graph-v4", item.question, [...new Set(selected)]);
        validate(retried);
        record.clarificationRetry = { selectedIds: selected, status: retried.status, reason: retried.plan.reason_code };
      }
    }
    record.contractPassed = true;
  } catch (error) { record.contractPassed = false; record.error = error.message; }
  record.durationMs = Date.now() - start;
  const completed = rows.push(record);
  writes = writes.then(() => appendFile(jsonl, JSON.stringify(record) + "\n"));
  await writes;
  if (completed % 25 === 0 || completed === cases.length) console.log(JSON.stringify({ completed, total: cases.length, contractFailures: rows.filter(row => !row.contractPassed).length }));
}
console.log(JSON.stringify({ cases: cases.length, samples: 320, templates: 529, instantiatedParameterizedVariants: cases.filter(item => item.kind === "template-filled" && item.template.includes("{")).length }));
await Promise.all(Array.from({ length: workerCount }, async () => {
  while (cursor < cases.length) { const item = cases[cursor++]; await run(item); }
}));
assert.equal(rows.length, cases.length, "Every catalog case must complete");
const counts = values => values.reduce((out, value) => { out[value] = (out[value] || 0) + 1; return out; }, {});
const summary = { total: rows.length, contractFailures: rows.filter(row => !row.contractPassed).length,
  completedAt: new Date().toISOString(), baseUrl: base,
  fingerprints: [...new Set(rows.map(row => row.fingerprint).filter(Boolean))],
  outcomes: Object.fromEntries([...new Set(rows.map(row => row.kind))].map(kind => [kind, counts(rows.filter(row => row.kind === kind).map(row => row.status || "error"))])),
  clarificationRetries: counts(rows.flatMap(row => row.clarificationRetry ? [row.clarificationRetry.status] : [])),
  clarificationReasons: counts(rows.filter(row => row.kind !== "template-unfilled" && row.status === "clarification_required").map(row => row.reason || "entity_ambiguity")),
  plannerCoverageFailures: rows.filter(row => row.kind !== "template-unfilled" && (row.status === "unsupported" || (row.status === "clarification_required" && !["answered", "no_evidence"].includes(row.clarificationRetry?.status)))).length,
  limitation: "Every case checks the HTTP/API adapter, source-backed graph evidence, and table/narrative contract. Answered is NOT proof of semantic correctness. Expected ambiguity/no-evidence requires case review. Parameter fixtures cover two actual values, not all possible combinations. No live OpenAI model is tested when the API uses heuristic planning." };
const clean = value => String(value || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
await writeFile(report + ".md", `# Full question-bank audit\n\n${summary.limitation}\n\n\`\`\`json\n${JSON.stringify(summary, null, 2)}\n\`\`\`\n\n| Case | Kind | Status | After selection | Contract | Question |\n|---|---|---|---|---|---|\n` + rows.sort((a, b) => a.number - b.number).map(row => `| ${row.number} | ${row.kind} | ${row.status || "error"} | ${row.clarificationRetry?.status || ""} | ${row.contractPassed ? "pass" : clean(row.error)} | ${clean(row.question)} |`).join("\n") + "\n");
console.log(JSON.stringify(summary, null, 2));
// A green contract-only run must not be mistaken for full planner coverage.
// Missing roots/conditions need case review even if clarification is legitimate.
if (summary.contractFailures || (!args.includes("--contracts-only") && summary.plannerCoverageFailures)) process.exitCode = 1;
