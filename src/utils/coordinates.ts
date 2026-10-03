import type { BoundingBox } from '../types/pdf';

export interface ScreenBoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Converts PDF coordinates (bottom-left origin, PDF points)
 * to screen DOM coordinates (top-left origin, pixels scaled by zoom).
 */
export function pdfToScreenCoordinates(
  pdfX: number,
  pdfY: number,
  pdfWidth: number,
  pdfHeight: number,
  pageHeightPt: number,
  zoom: number
): ScreenBoundingBox {
  const left = pdfX * zoom;
  const top = (pageHeightPt - (pdfY + pdfHeight)) * zoom;
  const width = Math.max(pdfWidth * zoom, 4);
  const height = Math.max(pdfHeight * zoom, 4);

  return {
    left,
    top,
    width,
    height,
  };
}

/**
 * Converts screen DOM coordinates (top-left origin, pixels scaled by zoom)
 * back to PDF coordinates (bottom-left origin, PDF points).
 */
export function screenToPdfCoordinates(
  screenLeft: number,
  screenTop: number,
  screenWidth: number,
  screenHeight: number,
  pageHeightPt: number,
  zoom: number
): BoundingBox {
  const safeZoom = zoom > 0 ? zoom : 1;
  const widthPt = screenWidth / safeZoom;
  const heightPt = screenHeight / safeZoom;
  const xPt = screenLeft / safeZoom;
  const yPt = pageHeightPt - screenTop / safeZoom - heightPt;

  return {
    x: Math.round(xPt * 100) / 100,
    y: Math.round(yPt * 100) / 100,
    width: Math.round(widthPt * 100) / 100,
    height: Math.round(heightPt * 100) / 100,
  };
}

/**
 * Bounds checking to clamp text boxes within page boundaries.
 */
export function clampPdfBounds(
  box: BoundingBox,
  pageWidthPt: number,
  pageHeightPt: number
): BoundingBox {
  const clampedX = Math.max(0, Math.min(box.x, pageWidthPt - box.width));
  const clampedY = Math.max(0, Math.min(box.y, pageHeightPt - box.height));
  return {
    ...box,
    x: clampedX,
    y: clampedY,
  };
}
