import { describe, expect, it, vi } from "vitest";
import { WorkspaceFocus } from "../../src/workspace-focus.js";

function panel(initial) {
  let open = initial;
  const listeners = [];
  return { isOpen: () => open, subscribe: listener => listeners.push(listener), setOpen: vi.fn(value => { open = value; listeners.forEach(listener => listener(open)); }) };
}
describe("workspace focus mode", () => {
  it("hides both apps' panels then restores their individual states without persisting", () => {
    const focus = new WorkspaceFocus();
    const panels = [panel(true), panel(false), panel(true), panel(true)];
    panels.forEach(item => focus.register(item));
    focus.set(true);
    expect(panels.every(item => !item.isOpen())).toBe(true);
    focus.set(false);
    expect(panels.map(item => item.isOpen())).toEqual([true, false, true, true]);
    for (const item of panels) expect(item.setOpen).toHaveBeenLastCalledWith(item.isOpen(), false, false);
  });
  it("exits focus when a user reopens a panel, respecting that explicit choice", () => {
    const focus = new WorkspaceFocus(), left = panel(false), right = panel(true);
    focus.register(left); focus.register(right);
    const changed = vi.fn(); focus.subscribe(changed);
    focus.set(true);
    left.setOpen(true);
    expect(focus.active).toBe(false);
    expect([left.isOpen(), right.isOpen()]).toEqual([true, true]);
    expect(changed).toHaveBeenLastCalledWith(false);
  });
  it("includes a panel registered while focus mode is active", () => {
    const focus = new WorkspaceFocus();
    focus.set(true);
    const late = panel(true); focus.register(late);
    expect(late.isOpen()).toBe(false);
    focus.set(false);
    expect(late.isOpen()).toBe(true);
  });
});
