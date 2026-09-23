/**
 * Drag handles: each resizer's line is as tall as the panel it resizes, not the whole column.
 * The resizer and its panel are siblings in the same grid, so their rects share one coordinate space.
 */

/** The visible surface of a panel: the floating card inside it when there is one. */
function surfaceOf(panel) {
  return panel.querySelector(".query-card") || panel;
}

function syncLine(resizer, panel) {
  const surface = surfaceOf(panel);
  if (!surface.isConnected || resizer.offsetParent === null) return;
  const line = resizer.getBoundingClientRect();
  const target = surface.getBoundingClientRect();
  if (!target.height) return;
  resizer.style.setProperty("--line-top", `${Math.max(0, Math.round(target.top - line.top))}px`);
  resizer.style.setProperty("--line-height", `${Math.round(target.height)}px`);
}

export function initializePanelChrome(root = document) {
  const pairs = [];
  for (const resizer of root.querySelectorAll(".panel-resizer[aria-controls]")) {
    const panel = root.getElementById(resizer.getAttribute("aria-controls"));
    if (panel) pairs.push([resizer, panel]);
  }
  if (!pairs.length) return;

  const sync = () => pairs.forEach(([resizer, panel]) => syncLine(resizer, panel));
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(sync);
    for (const [, panel] of pairs) {
      observer.observe(panel);
      const surface = surfaceOf(panel);
      if (surface !== panel) observer.observe(surface);
    }
  }
  window.addEventListener("resize", sync);
  // Card surfaces appear and resize as views switch, so re-measure after each paint settles.
  document.addEventListener("transitionend", sync);
  requestAnimationFrame(sync);
  setTimeout(sync, 400);
}
