import type { TextObject } from '../types/pdf';

export interface SampledColors {
  id: string;
  color: string;
  backgroundColor: string;
  underline?: boolean;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Accurately samples the true background color behind a text box and the actual
 * color of the text glyphs directly from the rendered PDF canvas.
 */
export function samplePageColors(
  ctx: CanvasRenderingContext2D,
  objects: TextObject[],
  pageHeightPt: number,
  scale: number,
  canvasWidth: number,
  canvasHeight: number
): SampledColors[] {
  const results: SampledColors[] = [];

  for (const obj of objects) {
    if (obj.isModified) continue;

    const bounds = obj.originalBounds || {
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
    };

    const leftPx = Math.max(0, Math.min(canvasWidth - 1, Math.round(bounds.x * scale)));
    const topPx = Math.max(
      0,
      Math.min(canvasHeight - 1, Math.round((pageHeightPt - (bounds.y + bounds.height)) * scale))
    );
    const widthPx = Math.max(2, Math.min(canvasWidth - leftPx, Math.round(bounds.width * scale)));
    const heightPx = Math.max(2, Math.min(canvasHeight - topPx, Math.round(bounds.height * scale)));

    if (widthPx <= 2 || heightPx <= 2) continue;

    try {
      // 1. Detect background color by sampling perimeter pixels around the text box
      const perimeterSamples: [number, number, number][] = [];
      const samplePoints = [
        [Math.max(0, leftPx - 1), Math.max(0, topPx - 1)],
        [Math.min(canvasWidth - 1, leftPx + widthPx), Math.max(0, topPx - 1)],
        [Math.max(0, leftPx - 1), Math.min(canvasHeight - 1, topPx + heightPx)],
        [Math.min(canvasWidth - 1, leftPx + widthPx), Math.min(canvasHeight - 1, topPx + heightPx)],
        [Math.round(leftPx + widthPx / 2), Math.max(0, topPx - 1)],
        [Math.round(leftPx + widthPx / 2), Math.min(canvasHeight - 1, topPx + heightPx)],
      ];

      for (const [px, py] of samplePoints) {
        const p = ctx.getImageData(px, py, 1, 1).data;
        if (p[3] > 30) {
          perimeterSamples.push([p[0], p[1], p[2]]);
        }
      }

      let bgR = 255;
      let bgG = 255;
      let bgB = 255;

      if (perimeterSamples.length > 0) {
        bgR = Math.round(perimeterSamples.reduce((sum, c) => sum + c[0], 0) / perimeterSamples.length);
        bgG = Math.round(perimeterSamples.reduce((sum, c) => sum + c[1], 0) / perimeterSamples.length);
        bgB = Math.round(perimeterSamples.reduce((sum, c) => sum + c[2], 0) / perimeterSamples.length);
      }

      const backgroundColor = rgbToHex(bgR, bgG, bgB);

      // 2. Detect text color by finding the pixels inside the bounding box with highest contrast against bg
      const textImgData = ctx.getImageData(leftPx, topPx, widthPx, heightPx);
      const data = textImgData.data;

      let maxContrast = 0;
      let bestR = bgR > 128 ? 0 : 255;
      let bestG = bgG > 128 ? 0 : 255;
      let bestB = bgB > 128 ? 0 : 255;

      const contrastingPixels: [number, number, number, number][] = [];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 50) continue;

        const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
        if (diff > 35) {
          contrastingPixels.push([r, g, b, diff]);
          if (diff > maxContrast) {
            maxContrast = diff;
          }
        }
      }

      if (contrastingPixels.length > 0) {
        const threshold = maxContrast * 0.75;
        const topPixels = contrastingPixels.filter((p) => p[3] >= threshold);
        if (topPixels.length > 0) {
          bestR = Math.round(topPixels.reduce((acc, p) => acc + p[0], 0) / topPixels.length);
          bestG = Math.round(topPixels.reduce((acc, p) => acc + p[1], 0) / topPixels.length);
          bestB = Math.round(topPixels.reduce((acc, p) => acc + p[2], 0) / topPixels.length);
        }
      }

      const textColor = rgbToHex(bestR, bestG, bestB);

      // 3. Detect underline stroke near baseline
      let hasUnderline = false;
      const underlineY = Math.min(canvasHeight - 1, topPx + Math.round(heightPx * 0.90));
      const testWidth = Math.min(widthPx, 80);
      let underlineHits = 0;
      for (let x = leftPx; x < leftPx + testWidth; x += 2) {
        const p = ctx.getImageData(x, underlineY, 1, 1).data;
        const diff = Math.abs(p[0] - bgR) + Math.abs(p[1] - bgG) + Math.abs(p[2] - bgB);
        if (diff > 40) {
          underlineHits++;
        }
      }
      if (underlineHits > (testWidth / 2) * 0.65) {
        hasUnderline = true;
      }

      results.push({
        id: obj.id,
        color: textColor,
        backgroundColor,
        underline: hasUnderline || undefined,
      });
    } catch {
      // Ignore sampling errors, fallback cleanly
    }
  }

  return results;
}
