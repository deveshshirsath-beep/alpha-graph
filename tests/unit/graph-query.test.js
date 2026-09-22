import Graph from "graphology";
import { describe, expect, it } from "vitest";
import { conditionReadiness, evaluateGraphConditions, traceGraphPaths } from "../../src/graph-query.js";

const rules = [["OPERATION", "READS-FROM", "DATABASE"], ["OPERATION", "WRITES-TO", "DATABASE"]];
function fixture() {
  const graph = new Graph({ type: "directed", multi: true });
  for (const id of ["db1", "db2", "op1", "op2", "op3"]) graph.addNode(id, { entityType: id.startsWith("db") ? "DATABASE" : "OPERATION" });
  for (const [key, source, target, relationshipType] of [
    ["r1", "op1", "db1", "READS-FROM"], ["r2", "op2", "db1", "READS-FROM"],
    ["r3", "op2", "db2", "READS-FROM"], ["r4", "op3", "db2", "READS-FROM"],
    ["w1", "op3", "db1", "WRITES-TO"], ["r1b", "op1", "db1", "READS-FROM"],
  ]) graph.addEdgeWithKey(key, source, target, { relationshipType });
  return graph;
}
const condition = (nodeId, operator = "AND", ruleKey = "in:0", entityType = "DATABASE") => ({ nodeId, entityType, operator, ruleKey });
const reads = new Set(["READS-FROM"]);

describe("viewer condition drafts", () => {
  it("does not count a blank card as a ready condition or allow empty queries", () => {
    expect(conditionReadiness([])).toEqual({ ready: 0, drafts: 0, canRun: false, label: "0 conditions" });
    expect(conditionReadiness([condition("")])).toMatchObject({ ready: 0, drafts: 1, canRun: false });
    expect(conditionReadiness([condition("db1"), condition("")])).toMatchObject({ ready: 1, drafts: 1, canRun: false });
    expect(conditionReadiness([condition("db1")]).canRun).toBe(true);
    expect(() => evaluateGraphConditions(fixture(), [], rules)).toThrow(/Complete/);
  });
  it("matches incoming edges of the chosen type and preserves parallel evidence edges", () => {
    const result = evaluateGraphConditions(fixture(), [condition("db1")], rules);
    expect([...result.matches].sort()).toEqual(["op1", "op2"]);
    expect(result.edges.size).toBe(3);
    expect(result.nodes.size).toBe(3);
  });
  it("matches outgoing edges", () => {
    expect([...evaluateGraphConditions(fixture(), [condition("op2", "AND", "out:0", "OPERATION")], rules).matches]).toEqual(["db1", "db2"]);
  });
  it("intersects AND and unions OR without unrelated evidence", () => {
    const and = evaluateGraphConditions(fixture(), [condition("db1"), condition("db2")], rules);
    expect([...and.matches]).toEqual(["op2"]);
    expect([...and.edges].sort()).toEqual(["r2", "r3"]);
    const or = evaluateGraphConditions(fixture(), [condition("db1"), condition("db2", "OR")], rules);
    expect([...or.matches].sort()).toEqual(["op1", "op2", "op3"]);
    expect(or.edges.size).toBe(5);
  });
  it("handles zero matches, missing entities and invalid relationship selections", () => {
    expect(evaluateGraphConditions(fixture(), [condition("db2", "AND", "in:1")], rules).matches.size).toBe(0);
    expect(() => evaluateGraphConditions(fixture(), [condition("missing")], rules)).toThrow(/no longer available/);
    expect(() => evaluateGraphConditions(fixture(), [condition("db1", "AND", "in:99")], rules)).toThrow(/no longer available/);
  });
});

describe("viewer path explorer", () => {
  it("respects direction, hop depth and enabled relationship types", () => {
    const graph = fixture();
    expect(traceGraphPaths(graph, ["db1"], "out", 2, reads).nodes.size).toBe(1);
    expect([...traceGraphPaths(graph, ["db1"], "in", 1, reads).nodes].sort()).toEqual(["db1", "op1", "op2"]);
    expect(traceGraphPaths(graph, ["db1"], "both", 2, reads).nodes.has("db2")).toBe(true);
    expect(traceGraphPaths(graph, ["db1"], "both", 3, reads).nodes.has("op3")).toBe(true);
    expect(traceGraphPaths(graph, ["db1"], "both", 2, new Set()).edges.size).toBe(0);
  });
  it("only reports truncation if an additional entity is actually omitted", () => {
    const exact = traceGraphPaths(fixture(), ["db1"], "in", 1, reads, 3);
    expect(exact.truncated).toBe(false);
    expect(exact.edges.size).toBe(3);
    const limited = traceGraphPaths(fixture(), ["db1"], "both", 3, reads, 3);
    expect(limited.truncated).toBe(true);
    expect(limited.nodes.size).toBe(3);
  });
  it("rejects empty or missing starting entities", () => {
    expect(() => traceGraphPaths(fixture(), [], "both", 2, reads)).toThrow(/starting entity/);
    expect(() => traceGraphPaths(fixture(), ["missing"], "both", 2, reads)).toThrow(/starting entity/);
  });
});
