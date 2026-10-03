import { describe, it, expect } from 'vitest';
import {
  pdfToScreenCoordinates,
  screenToPdfCoordinates,
  clampPdfBounds,
} from '../utils/coordinates';

describe('Coordinate Conversion Utilities', () => {
  const pageHeightPt = 792; // standard US letter height in points
  const pageWidthPt = 612;

  it('converts PDF points to screen pixels accurately at 100% zoom', () => {
    const pdfX = 100;
    const pdfY = 200; // baseline/bottom in PDF coordinates
    const pdfWidth = 150;
    const pdfHeight = 20;
    const zoom = 1.0;

    const screen = pdfToScreenCoordinates(
      pdfX,
      pdfY,
      pdfWidth,
      pdfHeight,
      pageHeightPt,
      zoom
    );

    expect(screen.left).toBe(100);
    // top = (792 - (200 + 20)) * 1 = 572
    expect(screen.top).toBe(572);
    expect(screen.width).toBe(150);
    expect(screen.height).toBe(20);
  });

  it('converts PDF points to screen pixels accurately at 150% zoom', () => {
    const pdfX = 100;
    const pdfY = 200;
    const pdfWidth = 150;
    const pdfHeight = 20;
    const zoom = 1.5;

    const screen = pdfToScreenCoordinates(
      pdfX,
      pdfY,
      pdfWidth,
      pdfHeight,
      pageHeightPt,
      zoom
    );

    expect(screen.left).toBe(150);
    expect(screen.top).toBe(572 * 1.5);
    expect(screen.width).toBe(225);
    expect(screen.height).toBe(30);
  });

  it('bidirectionally converts between PDF and screen coordinates without drift', () => {
    const originalPdf = {
      x: 120,
      y: 350,
      width: 180,
      height: 25,
    };
    const zoom = 1.25;

    const screen = pdfToScreenCoordinates(
      originalPdf.x,
      originalPdf.y,
      originalPdf.width,
      originalPdf.height,
      pageHeightPt,
      zoom
    );

    const convertedPdf = screenToPdfCoordinates(
      screen.left,
      screen.top,
      screen.width,
      screen.height,
      pageHeightPt,
      zoom
    );

    expect(convertedPdf.x).toBeCloseTo(originalPdf.x, 1);
    expect(convertedPdf.y).toBeCloseTo(originalPdf.y, 1);
    expect(convertedPdf.width).toBeCloseTo(originalPdf.width, 1);
    expect(convertedPdf.height).toBeCloseTo(originalPdf.height, 1);
  });

  it('clamps bounds to page dimensions', () => {
    const outOfBounds = {
      x: -50,
      y: 900,
      width: 100,
      height: 30,
    };

    const clamped = clampPdfBounds(outOfBounds, pageWidthPt, pageHeightPt);
    expect(clamped.x).toBe(0);
    expect(clamped.y).toBe(pageHeightPt - 30);
  });
});
