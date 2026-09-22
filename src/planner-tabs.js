/**
 * Exclusive panels with roving tab focus and standard horizontal-tab keys.
 * @param {Array<{id: string, button: HTMLElement, panel: HTMLElement}>} tabs
 * @param {(id: string) => void} onChange
 */
export function connectPanelTabs(tabs, onChange = () => {}) {
  function select(id, focus = false) {
    const target = tabs.find(tab => tab.id === id);
    if (!target) return false;
    tabs.forEach(tab => {
      const active = tab === target;
      tab.button.setAttribute("aria-selected", String(active));
      tab.button.tabIndex = active ? 0 : -1;
      tab.panel.hidden = !active;
    });
    onChange(id);
    if (focus) target.button.focus();
    return true;
  }

  tabs.forEach((tab, index) => {
    tab.button.addEventListener("click", () => select(tab.id));
    tab.button.addEventListener("keydown", event => {
      const targets = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
      if (!(event.key in targets)) return;
      event.preventDefault();
      select(tabs[targets[event.key]].id, true);
    });
  });
  const initial = tabs.find(tab => tab.button.getAttribute("aria-selected") === "true") || tabs[0];
  if (initial) select(initial.id);
  return { select };
}
