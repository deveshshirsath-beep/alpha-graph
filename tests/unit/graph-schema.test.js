import { describe, expect, it } from "vitest";
import { GraphValidationError, assertValidGraphDocument, validateGraphDocument } from "../../src/graph-schema.js";

const validGraph = {
  graphVersion: "test",
  generatedAt: "2026-09-14",
  nodes: [
    { id: "api:1", name: "Payments", type: "API", layer: "API" },
    { id: "version:1", name: "v1", type: "API-VERSION", layer: "API" },
  ],
  edges: [
    { id: "edge:1", sourceId: "api:1", targetId: "version:1", relationshipType: "CONTAINS" },
  ],
};

describe("graph document validation", () => {
  it("accepts extensible property graph documents", () => {
    expect(validateGraphDocument(validGraph)).toEqual({ valid: true, errors: [] });
    expect(assertValidGraphDocument(validGraph)).toBe(validGraph);
  });

  it("rejects malformed entities", () => {
    const result = validateGraphDocument({ nodes: [{ id: "", layer: "API" }], edges: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("type");
  });

  it("rejects duplicate IDs and dangling relationship endpoints", () => {
    const result = validateGraphDocument({
      nodes: [
        { id: "same", type: "API", layer: "API" },
        { id: "same", type: "API", layer: "API" },
      ],
      edges: [{ id: "edge", sourceId: "same", targetId: "missing", relationshipType: "CONTAINS" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining("duplicate node"), expect.stringContaining("missing target")]));
    expect(() => assertValidGraphDocument({ nodes: [], edges: [{ id: "edge", sourceId: "x", targetId: "y", relationshipType: "LINKS" }] })).toThrow(GraphValidationError);
  });
});
