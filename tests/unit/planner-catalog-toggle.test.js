import { describe, expect, it, vi } from "vitest";
import { connectCatalogExpansion } from "../../src/planner-catalog-toggle.js";

function setup() {
  const element = () => {
    const attributes = new Map(), listeners = new Map();
    return { disabled: false, title: "", replaceChildren: vi.fn(),
      setAttribute: (key, value) => attributes.set(key, value), getAttribute: key => attributes.get(key),
      addEventListener: (name, callback) => listeners.set(name, callback), fire: name => listeners.get(name)() };
  };
  const root = { ...element(), id: "question-tree", groups: [], querySelectorAll: () => root.groups };
  const addGroup = (open, parent = root, details = false) => {
    const classes = new Set(open ? ["expanded"] : []), toggle = element();
    toggle.setAttribute("aria-expanded", String(open));
    const group = { open, parentElement: parent, toggle,
      matches: () => details, querySelector: () => toggle,
      classList: { contains: key => classes.has(key), toggle: (key, value) => value ? classes.add(key) : classes.delete(key) } };
    root.groups.push(group);
    return group;
  };
  const button = element();
  const controller = connectCatalogExpansion(root, button, name => name);
  return { root, button, controller, addGroup };
}

describe("catalog expand/collapse control", () => {
  it("repeatedly collapses and expands every level with matching labels and icons", () => {
    const { root, button, controller, addGroup } = setup();
    const layer = addGroup(true);
    addGroup(false, layer);
    addGroup(true);
    controller.sync();
    expect(button.getAttribute("aria-label")).toBe("Collapse all question groups");
    expect(button.getAttribute("aria-controls")).toBe(root.id);
    for (const open of [false, true, false, true]) {
      button.fire("click");
      expect(root.groups.every(group => group.classList.contains("expanded") === open)).toBe(true);
      expect(root.groups.every(group => group.toggle.getAttribute("aria-expanded") === String(open))).toBe(true);
      expect(button.getAttribute("aria-expanded")).toBe(String(open));
      expect(button.title).toBe(`${open ? "Collapse" : "Expand"} all question groups`);
      expect(button.replaceChildren).toHaveBeenLastCalledWith(open ? "collapse" : "expand");
    }
  });

  it("offers expand when layers are individually closed, even if hidden descendants remain open", () => {
    const { root, button, addGroup } = setup();
    const layer = addGroup(false);
    addGroup(true, layer);
    root.fire("click");
    expect(button.getAttribute("aria-label")).toBe("Expand all question groups");
    button.fire("click");
    expect(layer.classList.contains("expanded")).toBe(true);
    layer.classList.toggle("expanded", false);
    addGroup(true);
    root.fire("click");
    expect(button.getAttribute("aria-label")).toBe("Collapse all question groups");
  });

  it("toggles entity-scoped details and follows native disclosure changes", () => {
    const { root, button, controller, addGroup } = setup();
    const first = addGroup(true, root, true), second = addGroup(false, root, true);
    controller.sync();
    button.fire("click");
    expect([first.open, second.open]).toEqual([false, false]);
    button.fire("click");
    expect([first.open, second.open]).toEqual([true, true]);
    first.open = second.open = false;
    root.fire("toggle");
    expect(button.title).toBe("Expand all question groups");
  });

  it("disables an empty catalog and resynchronizes when search or dataset replaces its groups", () => {
    const { root, button, controller, addGroup } = setup();
    expect(button.disabled).toBe(true);
    addGroup(true);
    controller.sync();
    expect(button.disabled).toBe(false);
    expect(button.title).toBe("Collapse all question groups");
    root.groups = [];
    controller.sync();
    expect(button.disabled).toBe(true);
    addGroup(false);
    controller.sync();
    expect(button.disabled).toBe(false);
    expect(button.title).toBe("Expand all question groups");
  });
});
