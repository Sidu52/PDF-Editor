export interface NormalizedRgb {
  r: number; // 0 to 1
  g: number; // 0 to 1
  b: number; // 0 to 1
}

/**
 * Converts a hex string (e.g. '#2563EB' or '2563eb') to normalized 0..1 RGB values
 * for use in pdf-lib's rgb() function.
 */
export function hexToNormalizedRgb(hex: string): NormalizedRgb {
  const sanitized = hex.replace('#', '').trim();
  const validHex = sanitized.length === 3
    ? sanitized.split('').map((c) => c + c).join('')
    : sanitized.padEnd(6, '0').slice(0, 6);

  const num = parseInt(validHex, 16);
  if (isNaN(num)) {
    return { r: 0, g: 0, b: 0 };
  }

  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  return { r, g, b };
}

/**
 * Converts RGB 0..255 to hex string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
