import { describe, expect, it, vi } from "vitest";
import { connectPanelTabs } from "../../src/planner-tabs.js";

function setup() {
  const tabs = ["questions", "entities"].map(id => {
    const attributes = new Map();
    const listeners = new Map();
    return { id, panel: { hidden: false }, button: {
      tabIndex: 0, focus: vi.fn(),
      setAttribute: (key, value) => attributes.set(key, value),
      getAttribute: key => attributes.get(key),
      addEventListener: (name, callback) => listeners.set(name, callback),
      fire: (name, event = {}) => listeners.get(name)(event),
    } };
  });
  const changed = vi.fn();
  return { tabs, changed, controller: connectPanelTabs(tabs, changed) };
}

describe("Planner discovery tabs", () => {
  it("shows only one panel and keeps one tab in the keyboard sequence", () => {
    const { tabs, controller } = setup();
    expect(tabs.map(tab => tab.panel.hidden)).toEqual([false, true]);
    tabs[1].button.fire("click");
    expect(tabs.map(tab => tab.panel.hidden)).toEqual([true, false]);
    expect(tabs.map(tab => tab.button.tabIndex)).toEqual([-1, 0]);
    expect(tabs[1].button.getAttribute("aria-selected")).toBe("true");
    expect(controller.select("missing")).toBe(false);
    expect(tabs[1].panel.hidden).toBe(false);
  });

  it("supports arrow wraparound, Home and End with visible keyboard focus", () => {
    const { tabs } = setup();
    for (const [from, key, to] of [[0, "ArrowLeft", 1], [1, "ArrowRight", 0], [0, "End", 1], [1, "Home", 0]]) {
      const event = { key, preventDefault: vi.fn() };
      tabs[from].button.fire("keydown", event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(tabs[to].button.focus).toHaveBeenCalled();
      expect(tabs[to].panel.hidden).toBe(false);
    }
  });

  it("lets related-question navigation switch panels without changing their content", () => {
    const { tabs, controller, changed } = setup();
    tabs[0].panel.query = "deposits";
    controller.select("entities");
    controller.select("questions", true);
    expect(changed).toHaveBeenLastCalledWith("questions");
    expect(tabs[0].panel.query).toBe("deposits");
    expect(tabs[0].button.focus).toHaveBeenCalled();
  });
});
