// Canvas hover labels need their own foreground/background pair: Sigma's
// default white hover surface cannot reuse the light text on a dark graph.
const LABEL_PALETTES = {
  light: { label: '#273047', text: '#20211f', background: '#fffefa', border: '#797c88' },
  dark: { label: '#e8eaff', text: '#f4f6fa', background: '#20242c', border: '#7c8799' },
  ocean: { label: '#e8eaff', text: '#edfcff', background: '#102f3d', border: '#5aa9bb' },
  sunset: { label: '#e8eaff', text: '#fff2eb', background: '#392435', border: '#c18b9f' },
};

export function graphLabelPalette(theme) {
  return LABEL_PALETTES[theme] || LABEL_PALETTES.dark;
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {{x: number, y: number, size: number, label?: string | null}} data
 * @param {{labelSize: number, labelFont: string, labelWeight: string}} settings
 * @param {string} theme
 */
export function drawGraphNodeHover(context, data, settings, theme) {
  const palette = graphLabelPalette(theme);
  const fontSize = settings.labelSize * (13 / 12);
  const radius = data.size + 4;
  const label = typeof data.label === 'string' ? data.label : '';
  context.save();
  context.font = `600 ${fontSize}px ${settings.labelFont}`;
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.fillStyle = palette.background;
  context.strokeStyle = palette.border;
  context.lineWidth = 1;
  context.shadowColor = 'rgba(0, 0, 0, 0.25)';
  context.shadowBlur = 8;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 2;
  context.beginPath();
  if (label) {
    const height = Math.max(fontSize + 14, radius * 2);
    const width = radius * 2 + context.measureText(label).width + 16;
    context.roundRect(data.x - radius, data.y - height / 2, width, height, 8);
  } else {
    context.arc(data.x, data.y, radius, 0, Math.PI * 2);
  }
  context.fill();
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;
  context.stroke();
  if (label) {
    context.fillStyle = palette.text;
    context.fillText(label, data.x + radius + 6, data.y);
  }
  context.restore();
  // Sigma draws the actual node above this canvas, preserving entity colors.
}
