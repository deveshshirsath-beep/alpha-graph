import { describe, expect, it } from "vitest";
import { returnedResultTable, returnedResultTables, resultNarrative, resultPage, entityConnections, showResultDiagrams } from "../../src/planner-results.js";

const graph = {
  nodes: [{ id: "db", name: "Database", type: "DATABASE" }, ...Array.from({ length: 46 }, (_, index) => ({ id: `op-${index}`, name: `Operation ${index}`, type: "OPERATION" }))],
  edges: Array.from({ length: 46 }, (_, index) => ({ sourceId: `op-${index}`, targetId: "db", relationshipType: "READS-FROM" })),
  rootNodeIds: ["db"], resultNodeIds: Array.from({ length: 46 }, (_, index) => `op-${index}`),
};

describe("complete returned results", () => {
  it("preserves inventory totals and expands the 20-row presentation to the returned API page", () => {
    const rows = graph.nodes.slice(1).map(node => ({ ...node, "properties.httpMethod": "GET" }));
    const summary = { title: "Inventory by entity type", columns: ["Entity type", "Count"], rows: [["Operation", "1932"], ["API", "1842"]], totalRows: 2, truncated: false };
    const result = { graphId: "graph", matchedGraph: graph, evidenceResult: { rows }, presentation: { schemaVersion: "1.0", tables: [summary, { title: "Results", columns: ["Name", "Type", "HTTP method"], rows: rows.slice(0, 20).map(row => [row.name, "Operation", "GET"]), totalRows: rows.length, truncated: true }] } };
    const tables = returnedResultTables(result);
    expect(tables[0]).toMatchObject({ ...summary, summary: true });
    expect(tables[1].rows).toHaveLength(46);
    expect(tables[1].rows.at(-1)).toEqual(["Operation 45", "Operation", "GET"]);
    expect(returnedResultTables({ ...result, presentation: null, summaryTables: [tables[0]] })).toHaveLength(2);
  });

  it("respects explicitly omitted tables and count-only answers even when show_diagrams is true", () => {
    const base = { graphId: "graph", matchedGraph: graph, evidenceResult: { rows: [{ count: 1932 }] } };
    const count = { ...base, presentation: { schemaVersion: "1.0", profile: { kind: "count", show_diagrams: true }, tables: [] } };
    expect(returnedResultTables(count)).toEqual([]);
    expect(showResultDiagrams(count)).toBe(false);
    expect(returnedResultTables({ ...base, displayProfile: { show_tables: false } })).toEqual([]);
    expect(returnedResultTables({ ...base, presentation: { schemaVersion: "1.0", tables: [] } })).toEqual([]);
    expect(showResultDiagrams({ presentation: { profile: { show_diagrams: false } } })).toBe(false);
    expect(showResultDiagrams(undefined)).toBe(true);
  });

  it("retains unfamiliar authoritative presentation columns instead of inventing a mapping", () => {
    const table = { title: "Results", columns: ["Future column"], rows: [["Authoritative"]], truncated: true, totalRows: 46 };
    expect(returnedResultTables({ graphId: "graph", matchedGraph: graph, evidenceResult: { rows: graph.nodes }, presentation: { schemaVersion: "1.0", tables: [table] } })[0].rows).toEqual(table.rows);
  });

  it("recovers all 46 result entities from old chats, excluding the context database", () => {
    const table = returnedResultTable({ matchedGraph: graph });
    expect(table.rows).toHaveLength(46);
    expect(table.rows.at(-1)).toEqual(["Operation 45", "Operation"]);
    expect(table.rows.flat()).not.toContain("Database");
    const message = { content: "Found 46.\nCaveat: API limit.\n\n## Matched entities\n\n| Name | Type |\n|---|---|\n| Operation 0 | Operation |\n\n_Showing 20 of 46 rows within the presentation limit._", result: { matchedGraph: graph } };
    expect(resultNarrative(message, table)).toBe("Found 46.\nCaveat: API limit.\n");
  });

  it("retains aggregate fields and every row beyond the Markdown preview", () => {
    const rows = Array.from({ length: 65 }, (_, index) => ({ name: `API ${index}`, fanIn: index, sourceId: "db", optional: null }));
    const table = returnedResultTable({ matchedGraph: graph, evidenceResult: { rows }, presentation: { tables: [{ title: "Highest-impact results", rows: rows.slice(0, 20) }] } });
    expect(table.rows).toHaveLength(65);
    expect(table.columns).toHaveLength(4);
    expect(table.rows[64]).toEqual(["API 64", "64", "Database", "—"]);
  });

  it("pages through every entry once, supports show-all and searches beyond page one", () => {
    const rows = returnedResultTable({ matchedGraph: graph }).rows;
    expect([0, 1, 2].flatMap((page) => resultPage(rows, "", page).rows)).toEqual(rows);
    expect(resultPage(rows, "", 0, rows.length).rows).toHaveLength(46);
    expect(resultPage(rows, "Operation 45", 3)).toMatchObject({ total: 1, page: 0, rows: [rows[45]] });
    expect(resultPage(rows, "absent", 2)).toMatchObject({ total: 0, page: 0, rows: [] });
  });

  it("does not rewrite unrelated tables in legacy answers", () => {
    const message = { content: "## Results\n\n| Count |\n| --- |\n| 799 |", result: { matchedGraph: graph } };
    expect(resultNarrative(message, returnedResultTable(message.result))).toBe(message.content);
  });

  it("includes every impact category, including identifiers absent from the graph", () => {
    const table = returnedResultTable({ matchedGraph: graph, evidenceResult: { kind: "impact", metadata: { directImpactIds: ["op-0"], transitiveImpactIds: ["outside"], contextRollupIds: ["db"] } } });
    expect(table.rows.map((row) => row[0])).toEqual(["Direct", "Transitive", "Context"]);
    expect(table.rows[1][1]).toBe("outside");
  });
});

describe("map neighborhoods", () => {
  it("exposes all 46 database connections, with correct direction", () => {
    const connections = entityConnections(graph, "db");
    expect(connections).toHaveLength(46);
    expect(connections.every((connection) => connection.direction === "in")).toBe(true);
    expect(entityConnections(graph, "op-45")[0]).toMatchObject({ direction: "out", node: { id: "db" } });
  });

  it("retains parallel and self edges, and ignores dangling endpoints", () => {
    const fixture = { nodes: graph.nodes, edges: [{ source: "db", target: "db" }, { source: "db", target: "op-0", type: "A" }, { source: "db", target: "op-0", type: "B" }, { source: "db", target: "missing" }] };
    expect(entityConnections(fixture, "db").map((connection) => connection.direction)).toEqual(["self", "out", "out"]);
    expect(entityConnections(fixture, "op-1")).toEqual([]);
  });
});
