/** Presentation-only expansion state. Never changes workspace/project/chat data. */
export class WorkspaceExpansion {
  constructor() { this.collapsed = new Set(); }
  isExpanded(kind, id) { return !this.collapsed.has(`${kind}:${id}`); }
  toggle(kind, id) {
    const key = `${kind}:${id}`;
    if (this.collapsed.has(key)) this.collapsed.delete(key);
    else this.collapsed.add(key);
  }
  expandPath(workspaceId, projectId) {
    this.collapsed.delete(`workspace:${workspaceId}`);
    this.collapsed.delete(`project:${projectId}`);
  }
  allCollapsed(workspaces) {
    return workspaces.length > 0 && workspaces.every(workspace => !this.isExpanded("workspace", workspace.id));
  }
  toggleAll(workspaces) {
    if (this.allCollapsed(workspaces)) this.collapsed.clear();
    else for (const workspace of workspaces) {
      this.collapsed.add(`workspace:${workspace.id}`);
      for (const project of workspace.projects || []) this.collapsed.add(`project:${project.id}`);
    }
  }
}
