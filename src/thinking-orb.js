import { MODE_FRAMES, paintFrame, resolvePreset } from "thinking-orbs/engine";

/**
 * Libraries.dev Thinking orbs without React: the package's framework-free engine drawn on our own canvas,
 * with the same loop as its React component (DPR up to 2, paused off-screen or in a hidden tab, one still
 * frame under reduced motion). Sizes are the tuned 20 (inline with text) and 64 (standalone).
 * @param {{ state?: string, size?: 20 | 64, label?: string, className?: string }} options
 */
export function createThinkingOrb({ state = "working", size = 20, label = "", className = "" } = {}) {
  const canvas = document.createElement("canvas");
  canvas.className = `thinking-orb ${className}`.trim();
  canvas.style.width = canvas.style.height = `${size}px`;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", label || `${state}…`);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = canvas.height = Math.round(size * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const { mode, speed, opts } = resolvePreset(/** @type {any} */ (state), size);
  const frameFn = MODE_FRAMES[mode];
  // Every theme but light is a dark surface, so the dots read light on it.
  const isDark = () => document.documentElement.dataset.theme !== "light";
  const draw = (t) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    paintFrame(ctx, frameFn(size, t, opts), isDark());
  };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { draw(0.6); return canvas; }

  let raf = 0;
  let visible = true;
  const loop = () => {
    // A removed orb stops itself: the steps swap it for a check as soon as they finish.
    if (!canvas.isConnected) { stop(); return; }
    draw((performance.now() / 1000) * speed);
    raf = requestAnimationFrame(loop);
  };
  const start = () => { if (!raf && visible && document.visibilityState !== "hidden") raf = requestAnimationFrame(loop); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; if (!canvas.isConnected) cleanup(); };
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? start() : stop(); });
  const onVisibility = () => (document.visibilityState === "hidden" ? stop() : start());
  const cleanup = () => { io.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  io.observe(canvas);
  document.addEventListener("visibilitychange", onVisibility);
  draw((performance.now() / 1000) * speed);
  start();
  return canvas;
}
