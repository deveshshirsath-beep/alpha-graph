import { describe, expect, it } from "vitest";
import { starterQuestionsForGraph, STARTER_QUESTIONS } from "../../src/planner-starters.js";

describe("curated starter questions", () => {
  it("provides eight distinct, complete questions including two filled templates", () => {
    const items = starterQuestionsForGraph("merged-graph-v4");
    expect(items).toHaveLength(8);
    expect(new Set(items.map(item => item.id)).size).toBe(8);
    expect(STARTER_QUESTIONS.filter(item => item.template)).toHaveLength(2);
    expect(items.every(item => item.question && !/[{}]|undefined/.test(item.question))).toBe(true);
    expect(items.find(item => item.id === "database-readers").question).toContain("banking_demo-postgres");
    expect(items.find(item => item.id === "exclusive-classifications").question).toContain("(PII or PCI) and not (PII and PCI)");
  });
  it("does not carry fixture-specific entity names into a different dataset", () => {
    const items = starterQuestionsForGraph("another-graph");
    expect(items).toHaveLength(8);
    expect(items.every(item => !/Accounts and Deposits|banking_demo|Cards|[{}]/.test(item.question))).toBe(true);
  });
});
