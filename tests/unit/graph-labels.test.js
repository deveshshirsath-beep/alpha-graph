import { describe, expect, it, vi } from 'vitest';
import { drawGraphNodeHover, graphLabelPalette } from '../../src/graph-labels.js';

function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255)
    .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}

function contextRecorder() {
  const paints = [];
  const context = {
    fillStyle: '',
    save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), roundRect: vi.fn(), arc: vi.fn(), stroke: vi.fn(),
    measureText: () => ({ width: 160 }),
    fill() { paints.push({ kind: 'background', color: this.fillStyle }); },
    fillText(text) { paints.push({ kind: 'text', color: this.fillStyle, text }); },
  };
  return { context, paints };
}

describe('theme-aware canvas hover labels', () => {
  it.each([.9, 1, 1.1, 1.25, 1.5])('scales hover text and its background at %s', scale => {
    const { context } = contextRecorder();
    drawGraphNodeHover(context, { x: 100, y: 80, size: 5, label: 'API' }, { labelSize: 12 * scale, labelFont: 'sans-serif', labelWeight: '500' }, 'dark');
    expect(parseFloat(context.font.split(' ')[1])).toBeCloseTo(13 * scale);
    expect(context.roundRect.mock.calls[0][3]).toBeCloseTo(13 * scale + 14);
  });

  it.each(['light', 'dark', 'ocean', 'sunset'])('renders a high-contrast overlay in %s', theme => {
    const { context, paints } = contextRecorder();
    const label = '<API> Customer Management';
    drawGraphNodeHover(context, { x: 100, y: 80, size: 5, label }, { labelSize: 12, labelFont: 'sans-serif', labelWeight: '500' }, theme);
    const palette = graphLabelPalette(theme);
    expect(paints).toEqual([{ kind: 'background', color: palette.background }, { kind: 'text', color: palette.text, text: label }]);
    const values = [luminance(palette.text), luminance(palette.background)].sort((a, b) => b - a);
    expect((values[0] + .05) / (values[1] + .05)).toBeGreaterThanOrEqual(7);
    expect(context.save).toHaveBeenCalledOnce();
    expect(context.restore).toHaveBeenCalledOnce();
    expect(context.roundRect).toHaveBeenCalledOnce();
  });

  it('draws only the halo for unlabeled nodes and falls back safely for unknown themes', () => {
    const { context, paints } = contextRecorder();
    drawGraphNodeHover(context, { x: 100, y: 80, size: 5, label: null }, { labelSize: 12, labelFont: 'sans-serif', labelWeight: '500' }, 'unknown');
    expect(graphLabelPalette('unknown')).toEqual(graphLabelPalette('dark'));
    expect(paints).toEqual([{ kind: 'background', color: graphLabelPalette('dark').background }]);
    expect(context.arc).toHaveBeenCalledOnce();
    expect(context.roundRect).not.toHaveBeenCalled();
  });
});
