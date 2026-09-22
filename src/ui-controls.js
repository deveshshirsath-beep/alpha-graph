import { PHOSPHOR } from './phosphor-icons.js';

// Alpha's icon names mapped onto Phosphor glyphs, the icon family used by the sigma reference.
// Only these trusted glyphs enter the DOM; graph labels and option names always use textContent.
const GLYPHS = {
  entity: 'cube', layers: 'stack', network: 'graph', filter: 'sliders-horizontal', route: 'path', catalog: 'files',
  shield: 'shield-check', team: 'users', sunset: 'sun-horizon', close: 'x', search: 'magnifying-glass',
  reset: 'arrow-counter-clockwise', focus: 'crosshair', fit: 'corners-out', chevron: 'caret-down', arrows: 'arrows-left-right',
  depth: 'tree-structure', grip: 'dots-six-vertical', collapse: 'arrows-in-line-vertical', expand: 'arrows-out-line-vertical',
  help: 'question', 'text-size': 'text-aa', 'panel-left-close': 'sidebar-simple', 'panel-left-open': 'sidebar-simple',
  'panel-right-close': 'sidebar-simple', 'panel-right-open': 'sidebar-simple',
};

// Explicit fills keep glyphs visible under older rules that style icon SVGs as outlines.
export function paintIcon(svg, name) {
  svg.classList.add('ui-icon');
  svg.classList.toggle('ui-icon-flip', name.startsWith('panel-right'));
  svg.setAttribute('viewBox', '0 0 256 256');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = PHOSPHOR[GLYPHS[name] || name] || PHOSPHOR.cube;
  svg.querySelectorAll('path').forEach(path => { path.setAttribute('fill', 'currentColor'); path.setAttribute('stroke', 'none'); });
  return svg;
}

export function icon(name = 'entity') {
  return paintIcon(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), name);
}

/** Swaps `img[data-inline-svg]` for its own SVG markup, so the illustration's --illo-* colors follow the theme. */
export async function inlineIllustrations(root = document) {
  await Promise.all([...root.querySelectorAll('img[data-inline-svg]')].map(async (image) => {
    try {
      const response = await fetch(image.getAttribute('src') || '');
      if (!response.ok) return;
      const svg = new DOMParser().parseFromString(await response.text(), 'image/svg+xml').documentElement;
      if (svg.nodeName !== 'svg') return;
      for (const name of ['width', 'height']) if (image.hasAttribute(name)) svg.setAttribute(name, image.getAttribute(name) || '');
      svg.classList.add('illustration');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      image.replaceWith(document.importNode(svg, true));
    } catch { /* The plain image stays as the fallback. */ }
  }));
}

export function setButtonContent(button, name, label) {
  const span = document.createElement('span');
  span.className = 'action-label';
  span.textContent = label;
  button.replaceChildren(icon(name), span);
  button.classList.add('icon-action');
}

// Zoom, query and traversal controls carry their own markup, as in sigma.
const actions = {
  'empty-reset': ['reset', 'Reset filters'],
  'focus-neighbors': ['focus', 'Focus network'], 'add-to-traversal': ['plus', 'Add to traversal'],
  'close-inspector': ['close', 'Close'], 'close-shortcuts': ['close', 'Close'], 'open-shortcuts': ['help', 'Keyboard shortcuts'],
};

function decorateButtons() {
  for (const button of document.querySelectorAll('button')) {
    if (button.querySelector('.ui-icon')) continue;
    if (actions[button.id]) {
      setButtonContent(button, .../** @type {[string, string]} */ (actions[button.id]));
    } else if (button.matches('[data-theme-choice]')) {
      const name = { light: 'sun', dark: 'moon', ocean: 'waves', sunset: 'sunset' }[button.getAttribute('data-theme-choice')];
      setButtonContent(button, name, button.textContent.trim());
    } else if (button.matches('.layer-tab, .search-result, .search-type-suggestion, .condition-suggestions button, .connection-row, .selection-chip')) {
      const marker = button.querySelector('i');
      if (marker) {
        marker.replaceChildren(icon(button.matches('.layer-tab') ? 'layers' : 'entity'));
        marker.classList.add('entity-icon');
      }
    }
  }
}

function optionIcon(select, option) {
  if (select.id === 'theme-select') return { light: 'sun', dark: 'moon', ocean: 'waves', sunset: 'sunset' }[option.value] || 'sun';
  if (select.id === 'text-size-select') return 'text-size';
  if (select.id === 'graph-select') return 'database';
  if (select.classList.contains('condition-relationship')) return 'link';
  if (select.getAttribute('aria-label') === 'Condition operator') return 'filter';
  if (/SECURITY|PCI|PII/.test(option.value)) return 'shield';
  if (/TEAMS|CONSUMER/.test(option.value)) return 'team';
  if (/DATABASE/.test(option.value)) return 'database';
  if (/API|ENDPOINT|HTTP|HEADER|PARAMETER/.test(option.value)) return 'code';
  if (/BUSINESS|DOMAIN/.test(option.value)) return 'layers';
  if (/OPERATION|EVENT|GATEWAY|WORKFLOW/.test(option.value)) return 'route';
  return 'entity';
}

const controllers = new Map();
let openDropdown = null;
let nextDropdownId = 0;

function enhanceSelect(select) {
  const wrapper = document.createElement('div');
  wrapper.className = 'select-control';
  wrapper.dataset.selectId = select.id || select.className || 'operator';
  select.before(wrapper);
  wrapper.append(select);
  // Keep the native control as the app's data/event source, not a duplicate tab stop.
  select.hidden = true;
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'select-trigger';
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  const label = select.getAttribute('aria-label') || select.labels?.[0]?.textContent.trim() || 'Choose option';
  trigger.setAttribute('aria-label', label);
  wrapper.append(trigger);
  const menu = document.createElement('div');
  menu.className = 'select-menu';
  menu.hidden = true;
  const heading = document.createElement('div');
  heading.className = 'select-menu-heading';
  heading.textContent = label;
  const list = document.createElement('div');
  list.className = 'select-options';
  list.id = `select-options-${++nextDropdownId}`;
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', label);
  trigger.setAttribute('aria-controls', list.id);
  menu.append(heading, list);
  document.querySelector('#app').append(menu);
  let active = -1;
  let signature = '';
  let typeBuffer = '';
  let lastTyped = 0;
  let rows = [];
  const parentScrollPositions = new Map();

  const position = () => {
    if (menu.hidden) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 260), 420, window.innerWidth - 16);
    menu.style.width = `${width}px`;
    menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    const useBelow = below >= Math.min(360, menu.scrollHeight) || below >= above;
    const available = Math.max(80, Math.min(420, useBelow ? below : above));
    list.style.maxHeight = `${Math.max(40, available - 42)}px`;
    menu.style.top = `${useBelow ? rect.bottom + 7 : Math.max(8, rect.top - menu.offsetHeight - 7)}px`;
  };
  const close = (restoreFocus = false) => {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    if (openDropdown === controller) openDropdown = null;
    if (restoreFocus && trigger.isConnected) trigger.focus();
  };
  const activate = (index) => {
    if (index < 0 || !rows[index]) return;
    active = index;
    rows.forEach((row, i) => row.classList.toggle('is-active', i === index));
    trigger.setAttribute('aria-activedescendant', rows[index].id);
    // Scroll only the option list. scrollIntoView also scrolls clipping ancestors
    // and can dispatch a delayed panel scroll that dismisses a just-opened menu.
    const top = rows[index].offsetTop;
    const bottom = top + rows[index].offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  };
  const choose = (index) => {
    if (!select.options[index] || select.options[index].disabled || select.disabled) return;
    select.selectedIndex = index;
    close(true);
    sync();
    // Existing handlers keep all graph loading, filtering and query semantics.
    select.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const rebuild = () => {
    list.replaceChildren();
    rows = [];
    let previousGroup = '';
    [...select.options].forEach((option, index) => {
      const group = option.parentElement instanceof HTMLOptGroupElement ? option.parentElement.label : '';
      if (group && group !== previousGroup) {
        const title = document.createElement('div');
        title.className = 'select-option-group';
        title.setAttribute('role', 'presentation');
        title.textContent = group;
        list.append(title);
      }
      previousGroup = group;
      const row = document.createElement('div');
      row.className = 'select-option';
      row.id = `${list.id}-${index}`;
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(index === select.selectedIndex));
      row.setAttribute('aria-disabled', String(option.disabled));
      row.dataset.value = option.value;
      row.style.setProperty('--option-hue', String((index * 47 + 155) % 360));
      const name = document.createElement('span');
      name.textContent = option.textContent;
      const tick = icon('check');
      tick.classList.add('selected-check');
      row.append(icon(optionIcon(select, option)), name, tick);
      row.addEventListener('pointerdown', event => event.preventDefault());
      row.addEventListener('click', () => choose(index));
      list.append(row);
      rows.push(row);
    });
  };
  const sync = () => {
    const option = select.selectedOptions[0];
    const next = JSON.stringify([select.disabled, select.value, [...select.options].map(item => [item.value, item.textContent, item.disabled])]);
    if (next === signature) return;
    signature = next;
    trigger.disabled = select.disabled;
    setButtonContent(trigger, optionIcon(select, option || { value: '' }), option?.textContent || 'Choose option…');
    trigger.append(icon('chevron'));
    trigger.lastElementChild.classList.add('select-chevron');
    trigger.title = option?.textContent || label;
    if (select.disabled) close();
    else if (!menu.hidden) { rebuild(); position(); activate(select.selectedIndex); }
  };
  const open = () => {
    if (select.disabled) return;
    openDropdown?.close();
    sync();
    rebuild();
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    openDropdown = controller;
    parentScrollPositions.clear();
    for (let parent = wrapper.parentElement; parent; parent = parent.parentElement) {
      parentScrollPositions.set(parent, [parent.scrollLeft, parent.scrollTop]);
    }
    position();
    activate(Math.max(0, select.selectedIndex));
  };
  trigger.addEventListener('click', () => menu.hidden ? open() : close());
  trigger.addEventListener('keydown', event => {
    const key = event.key;
    if (key === 'Tab') { close(); return; }
    if (key === 'Escape' && !menu.hidden) { event.preventDefault(); event.stopPropagation(); close(true); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
      if (menu.hidden) { open(); return; }
      if (key === 'Enter' || key === ' ') { choose(active); return; }
      const step = key === 'ArrowUp' ? -1 : 1;
      let next = key === 'Home' ? 0 : key === 'End' ? rows.length - 1 : Math.max(0, Math.min(rows.length - 1, active + step));
      while (select.options[next]?.disabled) next += step;
      activate(next);
    } else if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      if (menu.hidden) open();
      typeBuffer = performance.now() - lastTyped < 700 ? typeBuffer + key : key;
      lastTyped = performance.now();
      const match = [...select.options].findIndex(option => !option.disabled && option.textContent.toLowerCase().startsWith(typeBuffer.toLowerCase()));
      activate(match);
    }
  });
  trigger.addEventListener('blur', () => close());
  select.addEventListener('change', sync);
  const controller = {
    sync, close, position, wrapper, menu,
    onParentScroll(target) {
      const previous = parentScrollPositions.get(target);
      // Focus can enqueue a scroll event before the menu opens. Ignore that
      // event if the panel has not actually moved since we positioned the menu.
      if (previous && (previous[0] !== target.scrollLeft || previous[1] !== target.scrollTop)) close();
    },
    destroy() { close(); menu.remove(); select.removeEventListener('change', sync); },
  };
  controllers.set(select, controller);
  sync();
}

export function syncDropdowns() {
  for (const [select, controller] of controllers) {
    if (!select.isConnected) { controller.destroy(); controllers.delete(select); }
    else controller.sync();
  }
}

export function initializeUIControls() {
  document.querySelectorAll('svg[data-icon]').forEach(svg => paintIcon(svg, /** @type {SVGElement} */ (svg).dataset.icon || ''));
  const enhance = () => {
    for (const select of document.querySelectorAll('select')) {
      if (!controllers.has(select)) enhanceSelect(select);
    }
    syncDropdowns();
    decorateButtons();
  };
  enhance();
  // Newly added query cards and dataset options receive the same controls.
  const observer = new MutationObserver(enhance);
  observer.observe(document.querySelector('#app'), { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'selected'] });
  document.addEventListener('pointerdown', event => {
    if (openDropdown && !openDropdown.wrapper.contains(event.target) && !openDropdown.menu.contains(event.target)) openDropdown.close();
  });
  document.addEventListener('scroll', event => {
    if (openDropdown && event.target instanceof Element && event.target.matches('.sidebar, .query-dock, .inspector')) openDropdown.onParentScroll(event.target);
  }, true);
  window.addEventListener('resize', () => openDropdown?.position());
}
