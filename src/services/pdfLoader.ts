import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { PdfDocumentSummary, PdfPageDimension } from '../types/pdf';

// Configure pdfjs worker using Vite asset URL resolution
try {
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }
} catch {
  // Fallback for non-browser or test runner environments
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';
}

export class PdfLoader {
  /**
   * Loads a PDF from ArrayBuffer and returns the PDFDocumentProxy.
   */
  public static async loadDocument(data: ArrayBuffer): Promise<PDFDocumentProxy> {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(data),
      useSystemFonts: true,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
      cMapPacked: true,
    });

    return await loadingTask.promise;
  }

  /**
   * Summarizes all pages of the loaded PDF (dimensions, aspect ratio, text presence).
   */
  public static async inspectDocument(
    doc: PDFDocumentProxy,
    fileName: string,
    fileSize: number
  ): Promise<{ summary: PdfDocumentSummary; pages: PDFPageProxy[] }> {
    const pageCount = doc.numPages;
    const pageDimensions: PdfPageDimension[] = [];
    const pageProxies: PDFPageProxy[] = [];
    let totalTextCount = 0;

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await doc.getPage(pageNum);
      pageProxies.push(page);

      // Default unscaled viewport (scale = 1.0 represents 72 pt/inch PDF coordinate space)
      const viewport = page.getViewport({ scale: 1.0 });
      const textContent = await page.getTextContent();
      const hasText = textContent.items.length > 0;
      totalTextCount += textContent.items.length;

      pageDimensions.push({
        pageNumber: pageNum,
        width: viewport.width,
        height: viewport.height,
        aspectRatio: viewport.width / (viewport.height || 1),
        rotation: page.rotate,
        hasText,
      });
    }

    const summary: PdfDocumentSummary = {
      fileName,
      fileSize,
      pageCount,
      isScannedOnly: totalTextCount === 0,
      pages: pageDimensions,
    };

    return { summary, pages: pageProxies };
  }
}
