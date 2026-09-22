/** Temporary focus mode never overwrites persisted panel preferences. */
export class WorkspaceFocus {
  constructor() { this.panels = new Map(); this.active = false; this.changing = false; this.listeners = new Set(); }
  register(panel) {
    this.panels.set(panel, panel.isOpen());
    panel.subscribe(open => {
      if (open && this.active && !this.changing) {
        this.panels.set(panel, true);
        this.set(false);
      }
    });
    if (this.active) panel.setOpen(false, false, false);
  }
  subscribe(listener) { this.listeners.add(listener); listener(this.active); }
  set(active) {
    if (active === this.active) return;
    this.active = active;
    this.changing = true;
    try {
      for (const [panel, saved] of this.panels) {
        if (active) this.panels.set(panel, panel.isOpen());
        panel.setOpen(active ? false : saved, false, false);
      }
    } finally { this.changing = false; }
    this.listeners.forEach(listener => listener(active));
  }
}
export const workspaceFocus = new WorkspaceFocus();
