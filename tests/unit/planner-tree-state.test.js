import { describe, it, expect } from "vitest";
import { WorkspaceExpansion } from "../../src/planner-tree-state.js";

const workspaces = [{ id: "w1", projects: [{ id: "p1" }, { id: "p2" }] }, { id: "w2", projects: [{ id: "p3" }] }];
describe("workspace tree expansion", () => {
  it("collapses and expands every branch without changing document data", () => {
    const tree = new WorkspaceExpansion();
    const before = JSON.stringify(workspaces);
    tree.toggleAll(workspaces);
    expect(tree.allCollapsed(workspaces)).toBe(true);
    expect(tree.isExpanded("project", "p2")).toBe(false);
    tree.toggleAll(workspaces);
    expect(tree.isExpanded("workspace", "w1")).toBe(true);
    expect(tree.isExpanded("project", "p3")).toBe(true);
    expect(JSON.stringify(workspaces)).toBe(before);
  });
  it("lets individual branches reopen after Collapse All", () => {
    const tree = new WorkspaceExpansion();
    tree.toggleAll(workspaces);
    tree.toggle("workspace", "w1");
    expect(tree.allCollapsed(workspaces)).toBe(false);
    expect(tree.isExpanded("project", "p1")).toBe(false);
    tree.toggle("project", "p1");
    expect(tree.isExpanded("project", "p1")).toBe(true);
  });
  it("reveals a selected or newly created chat's path only", () => {
    const tree = new WorkspaceExpansion();
    tree.toggleAll(workspaces);
    tree.expandPath("w1", "p2");
    expect(tree.isExpanded("workspace", "w1")).toBe(true);
    expect(tree.isExpanded("project", "p2")).toBe(true);
    expect(tree.isExpanded("project", "p1")).toBe(false);
    expect(tree.isExpanded("workspace", "w2")).toBe(false);
    expect(new WorkspaceExpansion().allCollapsed([])).toBe(false);
  });
});
