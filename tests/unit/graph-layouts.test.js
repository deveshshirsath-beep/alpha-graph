import { describe, expect, it } from "vitest";
import { prepare } from "../../src/graph.worker.js";

/** A small estate: areas → domains, apps → APIs → versions → endpoints → operations, schemas → fields. */
function sampleGraph() {
  const nodes = [];
  const edges = [];
  const node = (id, type, layer) => nodes.push({ id, name: id, type, layer });
  const edge = (sourceId, relationshipType, targetId) => edges.push({ id: `${sourceId}-${targetId}`, sourceId, targetId, relationshipType });
  for (let area = 0; area < 3; area += 1) {
    node(`area${area}`, "BUSINESS-AREA", "BUSINESS");
    for (let domain = 0; domain < 4; domain += 1) {
      node(`domain${area}.${domain}`, "BUSINESS-DOMAIN", "BUSINESS");
      edge(`area${area}`, "CONTAINS", `domain${area}.${domain}`);
    }
  }
  for (let app = 0; app < 4; app += 1) {
    node(`app${app}`, "APPLICATION", "API");
    for (let api = 0; api < 6; api += 1) {
      const id = `api${app}.${api}`;
      node(id, "API", "API");
      node(`${id}.v`, "API-VERSION", "API");
      node(`${id}.e`, "ENDPOINT", "API");
      node(`${id}.o`, "OPERATION", "RUNTIME");
      edge(`app${app}`, "EXPOSES", id);
      edge(id, "CONTAINS", `${id}.v`);
      edge(`${id}.v`, "CONTAINS", `${id}.e`);
      edge(`${id}.e`, "CONTAINS", `${id}.o`);
      node(`${id}.s`, "SCHEMA", "API");
      edge(`${id}.o`, "ACCEPTS", `${id}.s`);
      for (let field = 0; field < 5; field += 1) {
        node(`${id}.s.f${field}`, "FIELD", "API");
        edge(`${id}.s`, "HAS-PROPERTY", `${id}.s.f${field}`);
      }
    }
  }
  node("db", "DATABASE", "RUNTIME");
  node("model", "ANALYTIC-MODEL", "DATA");
  return { graphVersion: "test", generatedAt: "2026-09-29", nodes, edges };
}

function overlaps(nodes, xKey, yKey, slotKey, samePlaneOnly = false) {
  let count = 0;
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      if (samePlaneOnly && a.plane !== b.plane) continue;
      if (Math.hypot(a[xKey] - b[xKey], a[yKey] - b[yKey]) < a[slotKey] + b[slotKey] - 1e-6) count += 1;
    }
  }
  return count;
}

describe("graph layouts", () => {
  const prepared = prepare(sampleGraph());
  const attributes = prepared.nodes.map((node) => node.attributes);

  it("gives every entity finite coordinates in all three views, including unknown types", () => {
    for (const node of attributes) {
      for (const key of ["semanticX", "semanticY", "v1X", "v1Y", "hierarchyX", "hierarchyY", "planeFlatX", "planeFlatY"]) {
        expect(Number.isFinite(node[key]), `${node.label} ${key}`).toBe(true);
      }
    }
  });

  it("keeps neighbouring entities inside their own slots in the donut and on each plane", () => {
    expect(overlaps(attributes, "semanticX", "semanticY", "donutSlot")).toBe(0);
    expect(overlaps(attributes, "hierarchyX", "hierarchyY", "hierarchySlot", true)).toBe(0);
    expect(overlaps(attributes, "planeFlatX", "planeFlatY", "planeFlatSlot", true)).toBe(0);
  });

  it("puts small entity types on a shared plane", () => {
    const planes = prepared.meta.planes;
    const runtime = planes.filter((plane) => plane.layer === "RUNTIME");
    expect(runtime).toHaveLength(1);
    expect(runtime[0].types).toEqual(["OPERATION", "DATABASE"]);
    expect(planes.every((plane, index) => plane.index === index)).toBe(true);
  });
});
