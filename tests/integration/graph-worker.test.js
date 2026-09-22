import { afterEach, describe, expect, it, vi } from "vitest";

const originalFetch = globalThis.fetch;
const originalSelf = globalThis.self;

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.self = originalSelf;
  vi.restoreAllMocks();
});

describe("graph worker pipeline", () => {
  it("discovers unknown layers, types, and relationship schemas and streams bounded batches", async () => {
    const document = {
      graphVersion: "future",
      generatedAt: "2026-09-14",
      nodes: [
        { id: "model", name: "Model", type: "ANALYTIC-MODEL", layer: "DATA" },
        { id: "store", name: "Store", type: "FEATURE-STORE", layer: "DATA" },
      ],
      edges: [{ id: "training", sourceId: "model", targetId: "store", relationshipType: "TRAINS-WITH" }],
    };
    const messages = [];
    globalThis.fetch = vi.fn(async () => ({ ok: true, text: async () => JSON.stringify(document) }));
    globalThis.self = { postMessage: (message) => messages.push(message) };
    await import("../../src/graph.worker.js?integration-test");

    await globalThis.self.onmessage({ data: { url: "fixture.json" } });

    const catalog = messages.find((message) => message.kind === "catalog");
    expect(catalog.meta.layers).toEqual({ DATA: ["ANALYTIC-MODEL", "FEATURE-STORE"] });
    expect(catalog.meta.relationshipSchema).toEqual([
      { source: "ANALYTIC-MODEL", relationship: "TRAINS-WITH", target: "FEATURE-STORE", count: 1 },
    ]);
    expect(messages.find((message) => message.kind === "node-batch").nodes).toHaveLength(2);
    expect(messages.find((message) => message.kind === "edge-batch").edges).toHaveLength(1);
    expect(messages.at(-1).kind).toBe("ready");
  });

  it("returns a controlled error for invalid graph input", async () => {
    const messages = [];
    globalThis.fetch = vi.fn(async () => ({ ok: true, text: async () => JSON.stringify({ nodes: [], edges: [{ id: "bad" }] }) }));
    globalThis.self = { postMessage: (message) => messages.push(message) };
    await import("../../src/graph.worker.js?invalid-integration-test");

    await globalThis.self.onmessage({ data: { url: "invalid.json" } });

    expect(messages.at(-1)).toMatchObject({ kind: "error" });
    expect(messages.at(-1).message).toContain("Graph validation failed");
  });
});
