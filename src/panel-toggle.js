/** A visibility preference never changes the panel's content or saved width. */
export function connectPanelToggle({ panel, toggles, reopen, label, storageKey, onChange = (_open) => {}, compact = null, compactOpen = false, storage = () => globalThis.localStorage, activeElement = () => document.activeElement }) {
  const key = () => storageKey + (compact?.matches ? ':compact' : '');
  const read = () => {
    try {
      const saved = storage().getItem(key());
      if (saved === 'open' || saved === 'collapsed') return saved === 'open';
    } catch { /* Visibility remains usable with storage blocked. */ }
    return compact?.matches ? compactOpen : true;
  };
  let open = read();
  const listeners = new Set();
  const render = () => {
    panel.hidden = !open;
    panel.inert = !open;
    for (const button of [...toggles, ...reopen]) {
      button.setAttribute('aria-controls', panel.id);
      button.setAttribute('aria-expanded', String(open));
      const action = `${open ? 'Collapse' : 'Expand'} ${label}`;
      button.setAttribute('aria-label', action);
      button.setAttribute('title', action);
    }
    reopen.forEach(button => { button.hidden = open; });
    onChange(open);
    listeners.forEach(listener => listener(open));
  };
  const setOpen = (value, focus = false, persist = true) => {
    const focusWasInside = panel.contains(activeElement());
    open = Boolean(value);
    if (persist) {
      try { storage().setItem(key(), open ? 'open' : 'collapsed'); } catch { /* Optional preference. */ }
    }
    render();
    if (focus || (!open && focusWasInside)) (open ? toggles[0] : reopen[0] || toggles[0])?.focus({ preventScroll: true });
  };
  toggles.forEach(button => button.addEventListener('click', () => setOpen(!open, true)));
  reopen.forEach(button => button.addEventListener('click', () => setOpen(true, true)));
  // Compact layouts have their own preference and do not overwrite desktop state.
  compact?.addEventListener('change', () => setOpen(read(), false, false));
  render();
  return { setOpen, isOpen: () => open, subscribe: listener => { listeners.add(listener); } };
}
