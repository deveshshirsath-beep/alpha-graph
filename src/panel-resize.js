import { icon } from './ui-controls.js';
import { followSidebarWidth, shareSidebarWidth } from './sidebar-width.js';

const STORAGE_KEY = 'atlas-v2-panel-widths';

export function initializePanelResizing(onResize) {
  const workspace = /** @type {HTMLElement} */ (document.querySelector('.workspace'));
  const handles = {
    left: /** @type {HTMLElement} */ (document.querySelector('.panel-resizer-left')),
    right: /** @type {HTMLElement} */ (document.querySelector('.panel-resizer-right')),
  };
  const defaults = { left: window.innerWidth <= 1280 ? 300 : 320, right: window.innerWidth <= 1280 ? 360 : 400 };
  const preferred = { ...defaults };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    for (const side of ['left', 'right']) {
      if (Number.isFinite(saved?.[side])) preferred[side] = Math.max(260, Math.min(600, saved[side]));
    }
  } catch { /* Resizing remains available without storage. */ }
  let frame = 0;
  let drag = null;
  const sizes = { ...preferred };
  const isDesktop = () => window.innerWidth > 1050;
  const isMobile = () => window.innerWidth <= 700;
  const collapsed = side => document.body.classList.contains(side === 'left' ? 'sidebar-collapsed' : 'query-panel-collapsed');
  const limits = side => {
    const width = workspace.clientWidth;
    const min = side === 'left' ? 260 : 300;
    const otherSide = side === 'left' ? 'right' : 'left';
    const other = collapsed(otherSide) ? 0 : sizes[otherSide];
    const dividers = Number(!collapsed('left')) + Number(!collapsed('right'));
    const room = isDesktop() ? width - other - dividers - 340
      : side === 'right' || isMobile() ? width - 20 : width - 1 - 200;
    return { min: Math.min(min, Math.max(180, room)), max: Math.max(Math.min(min, Math.max(180, room)), Math.min(600, room)) };
  };
  const scheduleResize = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; onResize(); });
  };
  const apply = () => {
    // Start from bounded minima when adapting to a narrower viewport.
    sizes.left = 260;
    sizes.right = 300;
    for (const side of ['left', 'right']) {
      const { min, max } = limits(side);
      sizes[side] = Math.round(Math.min(max, Math.max(min, preferred[side])));
      workspace.style.setProperty(side === 'left' ? '--explorer-width' : '--query-width', `${sizes[side]}px`);
    }
    for (const side of ['left', 'right']) {
      const { min, max } = limits(side);
      handles[side].setAttribute('aria-valuemin', String(Math.round(min)));
      handles[side].setAttribute('aria-valuemax', String(Math.round(max)));
      handles[side].setAttribute('aria-valuenow', String(sizes[side]));
      handles[side].setAttribute('aria-valuetext', `${sizes[side]} pixels wide`);
    }
    scheduleResize();
  };
  const persist = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferred)); } catch { /* Optional preference. */ }
    shareSidebarWidth('graph', sizes.left);
  };
  const change = (side, value) => {
    const { min, max } = limits(side);
    preferred[side] = Math.min(max, Math.max(min, value));
    apply();
  };
  const finish = (cancel = false) => {
    if (!drag) return;
    const previous = drag;
    drag = null;
    if (cancel) { preferred[previous.side] = previous.original; apply(); }
    else persist();
    document.body.classList.remove('panel-is-resizing');
    handles[previous.side].classList.remove('is-dragging');
    if (handles[previous.side].hasPointerCapture(previous.pointerId)) handles[previous.side].releasePointerCapture(previous.pointerId);
  };
  for (const [side, handle] of Object.entries(handles)) {
    handle.querySelector('.resize-grip').append(icon('grip'));
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      handle.focus();
      drag = { side, pointerId: event.pointerId, x: event.clientX, width: sizes[side], original: preferred[side] };
      handle.setPointerCapture(event.pointerId);
      handle.classList.add('is-dragging');
      document.body.classList.add('panel-is-resizing');
    });
    handle.addEventListener('pointermove', event => {
      if (!drag || drag.side !== side) return;
      change(side, drag.width + (event.clientX - drag.x) * (side === 'left' ? 1 : -1));
    });
    handle.addEventListener('pointerup', () => finish());
    handle.addEventListener('pointercancel', () => finish(true));
    handle.addEventListener('lostpointercapture', () => finish());
    handle.addEventListener('dblclick', () => { change(side, defaults[side]); persist(); });
    handle.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const { min, max } = limits(side);
      const delta = (event.key === 'ArrowRight' ? 1 : -1) * (side === 'left' ? 1 : -1) * (event.shiftKey ? 40 : 16);
      change(side, event.key === 'Home' ? min : event.key === 'End' ? max : sizes[side] + delta);
      persist();
    });
  }
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && drag) { event.stopPropagation(); finish(true); } }, true);
  followSidebarWidth('graph', (width) => {
    preferred.left = Math.max(260, Math.min(600, width));
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferred)); } catch { /* Optional preference. */ }
    apply();
  });
  new ResizeObserver(apply).observe(workspace);
  const collapseState = () => `${collapsed('left')}:${collapsed('right')}`;
  let wasCollapsed = collapseState();
  new MutationObserver(() => {
    // Hover/growth classes must not cause another expensive Sigma resize.
    const nowCollapsed = collapseState();
    if (nowCollapsed !== wasCollapsed) { wasCollapsed = nowCollapsed; apply(); }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  apply();
}
