import { describe, expect, it } from "vitest";
import { escapeHtml, safeCssColor } from "../../src/sanitize.js";

describe("safe dynamic rendering", () => {
  it("escapes entity and relationship labels before HTML insertion", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">&')).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;");
  });

  it("accepts supported CSS colors and rejects injected declarations", () => {
    expect(safeCssColor("#12aBcD")).toBe("#12aBcD");
    expect(safeCssColor("rgb(12, 24, 36)")).toBe("rgb(12, 24, 36)");
    expect(safeCssColor("#fff;position:fixed", "#000000")).toBe("#000000");
  });
});
