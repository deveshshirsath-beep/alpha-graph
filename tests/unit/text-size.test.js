import { describe, expect, it } from 'vitest';
import { normalizeTextSize, TEXT_SIZE_OPTIONS } from '../../src/text-size.js';

describe('text size preference', () => {
  it('provides the original default plus all four requested sizes', () => {
    expect(TEXT_SIZE_OPTIONS.map(option => option.value)).toEqual(['default', 'small', 'medium', 'large', 'xlarge']);
    for (const option of TEXT_SIZE_OPTIONS) expect(normalizeTextSize(option.value)).toBe(option.value);
  });
  it.each([null, undefined, '', 'unknown', 'XLARGE', '__proto__'])('rejects invalid stored size %s', value => {
    expect(normalizeTextSize(value)).toBe('default');
  });
});
