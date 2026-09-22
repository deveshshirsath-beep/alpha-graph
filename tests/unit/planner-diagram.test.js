import { describe, expect, it } from "vitest";
import { diagramSlice, diagramLayout, diagramEdgePath } from "../../src/planner-diagram.js";

const graph = {
  nodes: [{ id: "db" }, ...Array.from({ length: 46 }, (_, index) => ({ id: `op-${index}` }))],
  edges: Array.from({ length: 46 }, (_, index) => ({ sourceId: `op-${index}`, targetId: "db", relationshipType: "READS-FROM" })),
};
describe("result diagram", () => {
  it("keeps all returned nodes and directed edges in overview", () => {
    expect(diagramSlice(graph).nodes).toHaveLength(47);
    expect(diagramSlice(graph).edges).toEqual(graph.edges);
    expect(diagramSlice(graph, "missing").nodes).toEqual(graph.nodes);
  });
  it("makes every connection reachable in readable, explicitly scoped pages", () => {
    const pages = Array.from({ length: 8 }, (_, page) => diagramSlice(graph, "db", page));
    expect(pages.flatMap((page) => page.edges)).toHaveLength(46);
    expect(new Set(pages.flatMap((page) => page.edges))).toHaveProperty("size", 46);
    expect(pages[0]).toMatchObject({ start: 0, end: 6, total: 46, pages: 8 });
    expect(pages[0].nodes).toHaveLength(7);
    expect(pages[7]).toMatchObject({ start: 42, end: 46 });
    expect(diagramSlice(graph, "op-45").edges[0]).toBe(graph.edges[45]);
  });
  it("places all entities deterministically with generous center spacing", () => {
    const layout = diagramLayout(graph.nodes, "db");
    expect(layout.size).toBe(47);
    expect(layout.get("db")).toEqual({ x: 0, y: 0 });
    expect(layout).toEqual(diagramLayout(graph.nodes, "db"));
    const points = [...layout.values()];
    for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
      expect(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)).toBeGreaterThan(200);
    }
    expect(diagramLayout([]).size).toBe(0);
  });
  it("renders directional arrows, distinct parallel lanes and self loops", () => {
    const a = { x: 0, y: 0 }, b = { x: 250, y: 0 };
    expect(diagramEdgePath(a, b).d).toBe("M 26 0 Q 125 0 221 0");
    expect(diagramEdgePath(a, b, -.5).d).not.toBe(diagramEdgePath(a, b, .5).d);
    expect(diagramEdgePath(a, a, 0, true).d).toContain(" C ");
    expect(diagramEdgePath(a, a, 0, true).d).not.toBe(diagramEdgePath(a, a, 1, true).d);
    expect(diagramSlice({ nodes: [{ id: "self" }], edges: [{ source: "self", target: "self" }] }, "self").edges).toHaveLength(1);
  });
});
