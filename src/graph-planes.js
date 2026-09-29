// The Organizational view's planes: drawing them under the graph, and finding
// which plane a click landed on. Plane geometry comes from graph-layouts.js.

/** A plane's four corners in graph coordinates, angled or flat. */
export function planeCorners(plane, flat = false) {
  const { cx, cy, half, shear, squash } = plane;
  const project = (u, v) => (flat ? { x: cx + u, y: cy + v } : { x: cx + u + v * shear, y: cy + v * squash });
  return [project(-half, -half), project(half, -half), project(half, half), project(-half, half)];
}

/** The plane under a graph point. Later planes sit in front, so they win. */
export function planeAtPoint(planes, point, isolated = null) {
  const inside = (plane, flat) => {
    const v = flat ? point.y - plane.cy : (point.y - plane.cy) / plane.squash;
    const u = flat ? point.x - plane.cx : point.x - plane.cx - v * plane.shear;
    return Math.abs(u) <= plane.half && Math.abs(v) <= plane.half;
  };
  if (isolated !== null) {
    const plane = planes.find((item) => item.index === isolated);
    return plane && inside(plane, true) ? plane.index : null;
  }
  for (let index = planes.length - 1; index >= 0; index -= 1) if (inside(planes[index], false)) return planes[index].index;
  return null;
}

/**
 * Draws dashed plane outlines with a faint grid and a label, like stacked
 * sheets. Only the isolated plane is drawn once one is chosen, flat.
 */
export function drawPlanes(context, renderer, planes, { isolated = null, hovered = null, backHovered = false, colors, scale = 1 }) {
  const { width, height } = renderer.getDimensions();
  context.clearRect(0, 0, width, height);
  /** Where the focused plane's back arrow was drawn, in viewport pixels, for click tests. */
  let backButton = null;
  const shown = isolated === null ? planes : planes.filter((plane) => plane.index === isolated);
  const flat = isolated !== null;
  for (const plane of shown) {
    const corners = planeCorners(plane, flat).map((point) => renderer.graphToViewport(point));
    const active = plane.index === hovered || flat;
    context.save();
    context.beginPath();
    corners.forEach((point, index) => (index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y)));
    context.closePath();
    context.fillStyle = active ? colors.fillActive : colors.fill;
    context.fill();

    // Grid: evenly spaced lines between opposite edges.
    context.beginPath();
    const lines = 8;
    const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    for (let step = 1; step < lines; step += 1) {
      const t = step / lines;
      const a = lerp(corners[0], corners[1], t);
      const b = lerp(corners[3], corners[2], t);
      const c = lerp(corners[0], corners[3], t);
      const d = lerp(corners[1], corners[2], t);
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.moveTo(c.x, c.y);
      context.lineTo(d.x, d.y);
    }
    context.strokeStyle = colors.grid;
    context.lineWidth = 1;
    context.stroke();

    context.beginPath();
    corners.forEach((point, index) => (index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y)));
    context.closePath();
    context.setLineDash([6, 5]);
    context.strokeStyle = active ? colors.borderActive : colors.border;
    context.lineWidth = active ? 1.5 : 1.2;
    context.stroke();
    context.setLineDash([]);

    // Label: left of the plane's front corner in the stack, where the fan
    // leaves free space; above the top-left corner once the plane lies flat.
    const anchor = flat ? corners[3] : corners[0];
    const fontSize = Math.round(12 * scale);
    const font = (weight, size) => `${weight} ${size}px Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`;
    context.textAlign = flat ? "left" : "right";
    context.textBaseline = "bottom";
    let labelX = flat ? anchor.x : anchor.x - 12;
    const labelY = flat ? anchor.y - 10 - Math.round(14 * scale) : anchor.y;
    if (flat) {
      // A round back arrow left of the focused plane's name returns to the stack.
      const size = Math.round(28 * scale);
      const top = labelY - fontSize - Math.round(4 * scale);
      backButton = { x: anchor.x, y: top, width: size, height: size };
      context.beginPath();
      context.arc(anchor.x + size / 2, top + size / 2, size / 2, 0, Math.PI * 2);
      context.fillStyle = backHovered ? colors.backHover : colors.back;
      context.fill();
      context.strokeStyle = colors.border;
      context.lineWidth = 1;
      context.stroke();
      const cx = anchor.x + size / 2;
      const cy = top + size / 2;
      const arm = size * 0.2;
      context.beginPath();
      context.moveTo(cx + arm, cy);
      context.lineTo(cx - arm, cy);
      context.moveTo(cx - arm * 0.1, cy - arm * 0.9);
      context.lineTo(cx - arm, cy);
      context.lineTo(cx - arm * 0.1, cy + arm * 0.9);
      context.strokeStyle = colors.labelActive;
      context.lineWidth = 1.6;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.stroke();
      labelX += size + Math.round(10 * scale);
    }
    context.font = font(600, fontSize);
    context.fillStyle = active ? colors.labelActive : colors.label;
    context.fillText(plane.label, labelX, labelY);
    context.font = font(400, Math.round(11 * scale));
    context.fillStyle = colors.muted;
    context.fillText(`${plane.count.toLocaleString()} entities`, labelX, labelY + Math.round(14 * scale));
    context.restore();
  }
  return { backButton };
}
