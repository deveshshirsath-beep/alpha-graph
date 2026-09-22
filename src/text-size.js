export const TEXT_SIZE_OPTIONS = [
  { value: 'default', label: 'Default', description: 'Original · 100%' },
  { value: 'small', label: 'Small', description: 'Compact · 90%' },
  { value: 'medium', label: 'Medium', description: 'Comfortable · 110%' },
  { value: 'large', label: 'Large', description: 'Roomy · 125%' },
  { value: 'xlarge', label: 'X-Large', description: 'Extra readable · 150%' },
];

export function normalizeTextSize(value) {
  return TEXT_SIZE_OPTIONS.some(option => option.value === value) ? value : 'default';
}

// CSS rem sizes and canvas labels share the same computed scale. This also
// respects a browser's custom default font size without scaling the graph itself.
export function textScale() {
  return parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
}

export function initializeTextSizeSettings(onChange) {
  const root = document.documentElement;
  const select = /** @type {HTMLSelectElement} */ (document.querySelector('#text-size-select'));
  root.dataset.textSize = normalizeTextSize(root.dataset.textSize);
  select.replaceChildren(...TEXT_SIZE_OPTIONS.map(option => new Option(`${option.label} · ${option.description.split('· ')[1]}`, option.value, false, option.value === root.dataset.textSize)));
  select.addEventListener('change', () => {
    root.dataset.textSize = normalizeTextSize(select.value);
    try { localStorage.setItem('atlas-v2-text-size', root.dataset.textSize); } catch { /* Applies for this session when storage is unavailable. */ }
    onChange();
  });
}
