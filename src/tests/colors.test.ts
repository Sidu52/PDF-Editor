import { describe, it, expect } from 'vitest';
import { hexToNormalizedRgb, rgbToHex } from '../utils/colors';

describe('Color Utilities', () => {
  it('converts hex to normalized rgb values between 0 and 1', () => {
    const black = hexToNormalizedRgb('#000000');
    expect(black.r).toBe(0);
    expect(black.g).toBe(0);
    expect(black.b).toBe(0);

    const white = hexToNormalizedRgb('#ffffff');
    expect(white.r).toBe(1);
    expect(white.g).toBe(1);
    expect(white.b).toBe(1);

    const red = hexToNormalizedRgb('#ff0000');
    expect(red.r).toBe(1);
    expect(red.g).toBe(0);
    expect(red.b).toBe(0);

    const blue = hexToNormalizedRgb('#2563eb');
    expect(blue.r).toBeCloseTo(0.145, 2);
    expect(blue.g).toBeCloseTo(0.388, 2);
    expect(blue.b).toBeCloseTo(0.921, 2);
  });

  it('converts 255-scale RGB to hex', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(37, 99, 235)).toBe('#2563eb');
  });
});
