/**
 * Two-thumb range slider over whole-number stops. Thumbs follow the pointer while dragging
 * and settle onto the nearest stop when released.
 * @param {{ min: number, max: number, from: number, to: number, label: string, origin?: number | null, scaleLabel?: (value: number) => string, formatValue: (value: number) => string, onInput?: (range: { from: number, to: number }) => void, onChange?: (range: { from: number, to: number }) => void }} options
 */
export function createRangeSlider({ min, max, from, to, label, origin = null, scaleLabel = String, formatValue, onInput, onChange }) {
  const range = { from, to };
  const root = document.createElement("div");
  root.className = "range-slider";
  const percent = (value) => ((value - min) / (max - min)) * 100;
  const stops = Array.from({ length: max - min + 1 }, (_, index) => min + index);
  root.innerHTML = `
    <div class="range-track">
      <div class="range-rail"></div>
      <div class="range-fill"></div>
      ${stops.map((value) => `<span class="range-stop${value === origin ? " is-origin" : ""}" data-value="${value}" style="left:${percent(value)}%"></span>`).join("")}
      <div class="range-thumb" data-thumb="from" role="slider" tabindex="0"></div>
      <div class="range-thumb" data-thumb="to" role="slider" tabindex="0"></div>
    </div>
    <div class="range-scale" aria-hidden="true">
      ${stops.map((value) => (scaleLabel(value) ? `<button type="button" tabindex="-1" class="range-scale-label" data-value="${value}" style="left:${percent(value)}%">${scaleLabel(value)}</button>` : "")).join("")}
    </div>`;
  const track = /** @type {HTMLElement} */ (root.querySelector(".range-track"));
  const fill = /** @type {HTMLElement} */ (root.querySelector(".range-fill"));
  const thumbs = {
    from: /** @type {HTMLElement} */ (root.querySelector('[data-thumb="from"]')),
    to: /** @type {HTMLElement} */ (root.querySelector('[data-thumb="to"]')),
  };
  let dragging = null;
  let dragPercent = 0;
  let pointerStartPercent = null;

  const render = () => {
    const fromPercent = dragging === "from" ? dragPercent : percent(range.from);
    const toPercent = dragging === "to" ? dragPercent : percent(range.to);
    thumbs.from.style.left = `${fromPercent}%`;
    thumbs.to.style.left = `${toPercent}%`;
    fill.style.left = `${Math.min(fromPercent, toPercent)}%`;
    fill.style.width = `${Math.abs(toPercent - fromPercent)}%`;
    for (const [name, thumb] of Object.entries(thumbs)) {
      const value = range[name];
      thumb.setAttribute("aria-label", `${label} ${name}`);
      thumb.setAttribute("aria-valuemin", String(name === "from" ? min : range.from));
      thumb.setAttribute("aria-valuemax", String(name === "to" ? max : range.to));
      thumb.setAttribute("aria-valuenow", String(value));
      thumb.setAttribute("aria-valuetext", formatValue(value));
    }
    root.querySelectorAll("[data-value]").forEach((element) => {
      const value = Number(/** @type {HTMLElement} */ (element).dataset.value);
      element.classList.toggle("in-range", value >= range.from && value <= range.to);
    });
  };

  const valueAt = (clientX) => {
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return { percentValue: ratio * 100, stop: Math.round(min + ratio * (max - min)) };
  };

  const setThumb = (name, value, commit) => {
    const bounded = name === "from" ? Math.min(Math.max(value, min), range.to) : Math.max(Math.min(value, max), range.from);
    const changed = range[name] !== bounded;
    range[name] = bounded;
    render();
    if (changed) onInput?.({ ...range });
    if (commit) onChange?.({ ...range });
  };

  track.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    const { percentValue, stop } = valueAt(event.clientX);
    const target = /** @type {HTMLElement} */ (event.target).closest(".range-thumb");
    const fromDistance = Math.abs(percent(range.from) - percentValue);
    const toDistance = Math.abs(percent(range.to) - percentValue);
    dragging = target ? /** @type {HTMLElement} */ (target).dataset.thumb : fromDistance < toDistance || (fromDistance === toDistance && percentValue < percent(range.from)) ? "from" : "to";
    // Stacked thumbs: let the first drag direction decide which one moves.
    pointerStartPercent = target && range.from === range.to ? percentValue : null;
    track.setPointerCapture(event.pointerId);
    root.classList.add("is-dragging");
    thumbs[dragging].classList.add("is-active");
    thumbs[dragging].focus({ preventScroll: true });
    dragPercent = dragging === "from" ? Math.min(percentValue, percent(range.to)) : Math.max(percentValue, percent(range.from));
    setThumb(dragging, stop, false);
  });
  track.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const { percentValue, stop } = valueAt(event.clientX);
    if (pointerStartPercent !== null && Math.abs(percentValue - pointerStartPercent) > 0.5) {
      const direction = percentValue < pointerStartPercent ? "from" : "to";
      if (direction !== dragging) {
        thumbs[dragging].classList.remove("is-active");
        dragging = direction;
        thumbs[dragging].classList.add("is-active");
      }
      pointerStartPercent = null;
    }
    dragPercent = dragging === "from" ? Math.min(percentValue, percent(range.to)) : Math.max(percentValue, percent(range.from));
    setThumb(dragging, stop, false);
  });
  const endDrag = () => {
    if (!dragging) return;
    thumbs[dragging].classList.remove("is-active");
    dragging = null;
    pointerStartPercent = null;
    root.classList.remove("is-dragging");
    render();
    onChange?.({ ...range });
  };
  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);

  for (const [name, thumb] of Object.entries(thumbs)) {
    thumb.addEventListener("keydown", (event) => {
      const steps = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 };
      if (event.key in steps) setThumb(name, range[name] + steps[event.key], true);
      else if (event.key === "Home") setThumb(name, min, true);
      else if (event.key === "End") setThumb(name, max, true);
      else return;
      event.preventDefault();
    });
  }
  root.querySelectorAll(".range-scale-label").forEach((button) => button.addEventListener("click", () => {
    const value = Number(/** @type {HTMLElement} */ (button).dataset.value);
    const name = Math.abs(value - range.from) <= Math.abs(value - range.to) && value <= range.to ? "from" : "to";
    setThumb(name, value, true);
  }));

  render();
  return { element: root, getValue: () => ({ ...range }) };
}
