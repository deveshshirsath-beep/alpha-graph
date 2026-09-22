import { describe, expect, it, vi } from 'vitest';
import { connectPanelToggle } from '../../src/panel-toggle.js';

function setup(saved = {}, compactMode = false) {
  const values = new Map(Object.entries(saved));
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const button = () => {
    const attributes = new Map(), listeners = new Map();
    return { hidden: false, focus: vi.fn(), setAttribute: (key, value) => attributes.set(key, value),
      getAttribute: key => attributes.get(key), addEventListener: (name, fn) => listeners.set(name, fn), click: () => listeners.get('click')() };
  };
  const inside = {};
  const panel = { id: 'test-panel', hidden: false, inert: false, contains: element => element === inside, width: 480, draft: 'Keep this draft' };
  const toggle = button(), reopen = button(), rail = button(), onChange = vi.fn();
  let mediaChanged;
  const compact = { matches: compactMode, addEventListener: (_event, fn) => { mediaChanged = fn; } };
  const options = { panel, toggles: [toggle, rail], reopen: [reopen], label: 'evidence explorer', storageKey: 'panel', storage: () => storage, activeElement: () => null, compact, onChange };
  const controller = connectPanelToggle(options);
  return { panel, toggle, rail, reopen, values, onChange, controller, options, inside, setCompact: value => { compact.matches = value; mediaChanged(); } };
}

describe('side-panel visibility', () => {
  it('collapses completely, exposes a reopening control and restores without changing content or width', () => {
    const { panel, toggle, rail, reopen, controller, values } = setup();
    expect(reopen.hidden).toBe(true);
    toggle.click();
    expect(panel.hidden && panel.inert).toBe(true);
    expect(reopen.hidden).toBe(false);
    expect(reopen.focus).toHaveBeenCalled();
    expect(rail.getAttribute('aria-expanded')).toBe('false');
    expect(reopen.getAttribute('aria-label')).toBe('Expand evidence explorer');
    expect(reopen.getAttribute('aria-controls')).toBe('test-panel');
    expect(values.get('panel')).toBe('collapsed');
    reopen.click();
    expect(controller.isOpen()).toBe(true);
    expect(panel.hidden || panel.inert).toBe(false);
    expect(toggle.focus).toHaveBeenCalled();
    expect(panel.width).toBe(480);
    expect(panel.draft).toBe('Keep this draft');
    rail.click();
    expect(panel.hidden).toBe(true);
  });

  it('restores a saved desktop preference and isolates compact preferences', () => {
    const { panel, controller, setCompact, values } = setup({ panel: 'collapsed' });
    expect(panel.hidden).toBe(true);
    controller.setOpen(true);
    setCompact(true);
    expect(panel.hidden).toBe(true);
    expect(values.get('panel')).toBe('open');
    controller.setOpen(true);
    expect(values.get('panel:compact')).toBe('open');
    setCompact(false);
    expect(panel.hidden).toBe(false);
  });

  it('starts compact panels closed without overwriting the desktop default', () => {
    const { panel, setCompact, values } = setup({}, true);
    expect(panel.hidden).toBe(true);
    expect(values.size).toBe(0);
    setCompact(false);
    expect(panel.hidden).toBe(false);
  });

  it('handles invalid/blocked storage and moves focus out of a hidden panel', () => {
    const { options, panel, reopen, inside } = setup({ panel: 'invalid' });
    const controller = connectPanelToggle({ ...options, activeElement: () => inside, storage: () => { throw new Error('blocked'); } });
    expect(panel.hidden).toBe(false);
    expect(() => controller.setOpen(false)).not.toThrow();
    expect(reopen.focus).toHaveBeenCalled();
  });
});
