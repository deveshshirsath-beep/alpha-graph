import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const readResolvedSource = (override) => spawnSync(
  process.execPath,
  ["--input-type=module", "--eval", 'const source = await import("./scripts/graph-source.mjs"); console.log(source.graphSourceLabel);'],
  {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, ...(override ? { GRAPH_SOURCE: override } : {}) },
  },
);

describe("configurable graph source", () => {
  it("uses graph.config.json by default", () => {
    const result = readResolvedSource();
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("merged-graph-v4.json");
  });

  it("accepts an arbitrary filename from GRAPH_SOURCE", () => {
    const result = readResolvedSource("tests/fixtures/arbitrary graph.snapshot");
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("tests/fixtures/arbitrary graph.snapshot");
  });
});
