import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { createSampleInvoicePdf } from '../services/sampleDocument';
import { PdfExporter } from '../services/pdfExporter';
import type { TextObject } from '../types/pdf';

describe('PdfExporter Integration', () => {
  it('modifies, covers original text, adds new text, and exports a valid PDF', async () => {
    // 1. Generate base sample invoice bytes
    const sampleBytes = await createSampleInvoicePdf();
    expect(sampleBytes.byteLength).toBeGreaterThan(1000);

    // 2. Prepare modified and new text objects
    const testObjects: TextObject[] = [
      {
        id: 'modified-item-1',
        pageNumber: 1,
        text: 'MODIFIED INVOICE 99999',
        originalText: 'INV-2026-8849',
        x: 160,
        y: 657,
        width: 150,
        height: 18,
        fontFamily: 'helvetica',
        fontSize: 14,
        color: '#ff0000',
        bold: true,
        italic: false,
        alignment: 'left',
        isModified: true,
        originalBounds: {
          x: 160,
          y: 657,
          width: 100,
          height: 18,
        },
      },
      {
        id: 'new-item-2',
        pageNumber: 1,
        text: 'PAID IN FULL - THANK YOU',
        x: 200,
        y: 100,
        width: 200,
        height: 24,
        fontFamily: 'times',
        fontSize: 18,
        color: '#059669',
        bold: true,
        italic: true,
        alignment: 'center',
        isNew: true,
      },
      {
        id: 'deleted-item-3',
        pageNumber: 1,
        text: 'October 18, 2026',
        originalText: 'October 18, 2026',
        x: 160,
        y: 617,
        width: 100,
        height: 14,
        fontFamily: 'helvetica',
        fontSize: 11,
        color: '#000000',
        bold: false,
        italic: false,
        alignment: 'left',
        isDeleted: true,
        originalBounds: {
          x: 160,
          y: 617,
          width: 100,
          height: 14,
        },
      },
    ];

    // 3. Export modified PDF
    const exportedBlob = await PdfExporter.exportModifiedPdf(
      sampleBytes.buffer as ArrayBuffer,
      testObjects
    );

    expect(exportedBlob).toBeDefined();
    expect(exportedBlob.size).toBeGreaterThan(1000);
    expect(exportedBlob.type).toBe('application/pdf');

    // 4. Verify exported PDF is structurally valid by reloading with pdf-lib
    const exportedArrayBuffer = await exportedBlob.arrayBuffer();
    const reloadedDoc = await PDFDocument.load(exportedArrayBuffer);

    expect(reloadedDoc.getPageCount()).toBe(2);
    const page1 = reloadedDoc.getPage(0);
    const { width, height } = page1.getSize();
    expect(width).toBe(612);
    expect(height).toBe(792);
  });

  it('safely handles multi-line text, tabs, smart quotes, and unencodable characters', async () => {
    const sampleBytes = await createSampleInvoicePdf();
    const testObjects: TextObject[] = [
      {
        id: 'multiline-item',
        pageNumber: 1,
        text: 'Line 1: Special "quotes" & tabs\t\nLine 2: Euro € and em—dash',
        x: 100,
        y: 400,
        width: 300,
        height: 40,
        fontFamily: 'courier',
        fontSize: 12,
        color: '#1e3a8a',
        bold: false,
        italic: false,
        alignment: 'left',
        isNew: true,
      },
    ];

    const exportedBlob = await PdfExporter.exportModifiedPdf(
      sampleBytes.buffer as ArrayBuffer,
      testObjects
    );

    expect(exportedBlob).toBeDefined();
    expect(exportedBlob.size).toBeGreaterThan(1000);

    const reloadedDoc = await PDFDocument.load(await exportedBlob.arrayBuffer());
    expect(reloadedDoc.getPageCount()).toBe(2);
  });
});
