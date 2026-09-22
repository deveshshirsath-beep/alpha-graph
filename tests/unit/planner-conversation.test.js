import { describe, expect, it } from "vitest";
import { chronologicalMessages, messageTimestamp } from "../../src/planner-conversation.js";

describe("timestamped conversations", () => {
  it("orders saved questions and answers by ISO timestamp, stably for ties", () => {
    const question = { id: "q", createdAt: "2026-09-20T10:00:00Z" };
    const answer = { id: "a", createdAt: "2026-09-20T10:00:04Z", replyTo: "q" };
    const followup = { id: "f", createdAt: "2026-09-20T15:30:04+05:30" };
    const original = [answer, question, followup];
    expect(chronologicalMessages(original).map((message) => message.id)).toEqual(["q", "a", "f"]);
    expect(original[0]).toBe(answer);
  });
  it("keeps undated legacy entries in their slots and never invents timestamps", () => {
    const legacy = { id: "old" };
    expect(chronologicalMessages([{ id: "late", createdAt: "2026-09-20" }, legacy, { id: "early", createdAt: "2026-09-19" }]).map((message) => message.id)).toEqual(["early", "old", "late"]);
    for (const value of [undefined, null, "", "invalid"]) expect(messageTimestamp(value)).toBeNull();
  });
  it("retains exact instants for machine-readable dates and readable local labels", () => {
    const result = messageTimestamp("2026-09-20T15:30:04+05:30", "en-GB");
    expect(result.iso).toBe("2026-09-20T10:00:04.000Z");
    expect(result.label).toContain("2026");
    expect(result.full).toContain("September");
  });
});
