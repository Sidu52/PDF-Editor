import { PDFDocument, rgb, StandardFonts, PDFFont, degrees } from 'pdf-lib';
import type { TextObject } from '../types/pdf';
import { FontManager } from './fontManager';
import { hexToNormalizedRgb } from '../utils/colors';
import { DEFAULT_COVER_BACKGROUND_COLOR } from '../constants/colors';

/**
 * Word wraps text to a maximum width based on font metrics.
 */
function wrapTextToWidth(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (!para || para.trim().length === 0) {
      lines.push('');
      continue;
    }

    // Do not wrap if paragraph comfortably fits within width (+15pt font metric tolerance)
    const totalParaWidth = font.widthOfTextAtSize(para, fontSize);
    if (maxWidth <= 0 || totalParaWidth <= maxWidth + 15) {
      lines.push(para);
      continue;
    }

    const words = para.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (maxWidth > 40 && testWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines;
}

/**
 * Robustly sanitizes text against a specific PDFFont so that only characters
 * valid for the font's encoding are emitted, replacing unencodable characters with
 * safe equivalents.
 */
function sanitizeForFont(font: PDFFont, text: string): string {
  // Normalize whitespace: tabs to spaces, remove carriage returns
  const normalized = text.replace(/\t/g, '  ').replace(/\r/g, '');
  let result = '';

  for (const char of normalized) {
    // If it's a newline, preserve it for line-splitting
    if (char === '\n') {
      result += '\n';
      continue;
    }

    try {
      font.encodeText(char);
      result += char;
    } catch {
      // Map common typographic characters to standard ASCII equivalents
      switch (char) {
        case '‘':
        case '’':
        case '`':
          result += "'";
          break;
        case '“':
        case '”':
          result += '"';
          break;
        case '–':
        case '—':
          result += '-';
          break;
        case '…':
          result += '...';
          break;
        case '•':
        case '·':
          result += '*';
          break;
        case '€':
          result += 'EUR';
          break;
        case '£':
          result += 'GBP';
          break;
        case '©':
          result += '(c)';
          break;
        case '®':
          result += '(R)';
          break;
        case '™':
          result += '(TM)';
          break;
        default:
          result += '?';
          break;
      }
    }
  }

  return result;
}

export class PdfExporter {
  /**
   * Modifies the original PDF document by:
   * 1. Redacting original text areas that were edited, moved, or deleted.
   * 2. Drawing modified or new text elements at their updated positions.
   * Unmodified text runs and existing vector graphics/images remain completely untouched.
   */
  public static async exportModifiedPdf(
    originalData: Uint8Array | ArrayBuffer,
    textObjects: TextObject[]
  ): Promise<Blob> {
    const loadBytes =
      originalData instanceof Uint8Array
        ? new Uint8Array(originalData)
        : new Uint8Array(originalData.slice(0));

    const pdfDoc = await PDFDocument.load(loadBytes, {
      ignoreEncryption: true,
      updateMetadata: true,
    });

    const fontCache = new Map<StandardFonts, PDFFont>();

    const getOrEmbedFont = async (fontEnum: StandardFonts): Promise<PDFFont> => {
      let cached = fontCache.get(fontEnum);
      if (!cached) {
        cached = await pdfDoc.embedFont(fontEnum);
        fontCache.set(fontEnum, cached);
      }
      return cached;
    };

    const pageCount = pdfDoc.getPageCount();

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      const pageNumber = pageIndex + 1;
      const page = pdfDoc.getPage(pageIndex);
      const pageObjects = textObjects.filter((obj) => obj.pageNumber === pageNumber);

      for (const obj of pageObjects) {
        const hasOriginal = !!obj.originalBounds;

        const isModified =
          obj.isModified ||
          obj.isDeleted ||
          obj.isNew ||
          (obj.originalText !== undefined && obj.text !== obj.originalText) ||
          (hasOriginal &&
            (Math.abs(obj.x - obj.originalBounds!.x) > 0.5 ||
              Math.abs(obj.y - obj.originalBounds!.y) > 0.5));

        // Skip completely unmodified items: they already exist in the original PDF!
        if (!isModified && !obj.isNew) {
          continue;
        }

        // Step 1: Cover original text if it was modified, moved, or deleted using matching background color
        if (hasOriginal && isModified && obj.originalBounds) {
          const coverBgHex = obj.backgroundColor || DEFAULT_COVER_BACKGROUND_COLOR;
          const coverBg = hexToNormalizedRgb(coverBgHex);
          page.drawRectangle({
            x: Math.max(0, obj.originalBounds.x - 1),
            y: Math.max(0, obj.originalBounds.y - 1),
            width: obj.originalBounds.width + 2,
            height: obj.originalBounds.height + 2,
            color: rgb(coverBg.r, coverBg.g, coverBg.b),
          });
        }

        // Step 2: Skip drawing if deleted or empty
        if (obj.isDeleted || !obj.text || obj.text.trim().length === 0) {
          continue;
        }

        // Step 3: Draw updated or newly added text
        const fontEnum = FontManager.resolveStandardPdfFont(
          obj.fontFamily,
          obj.bold,
          obj.italic
        );
        const embeddedFont = await getOrEmbedFont(fontEnum);
        const textColor = hexToNormalizedRgb(obj.color);
        const sanitizedFullText = sanitizeForFont(embeddedFont, obj.text);

        // Wrap and split multi-line text by width and newlines
        const lines = wrapTextToWidth(sanitizedFullText, embeddedFont, obj.fontSize, obj.width);
        const lineHeight = obj.fontSize * 1.2;

        // Baseline calculation: DOM text renders from the top of the box downwards.
        // In PDF coordinates (0,0 bottom-left), the top of the box is (obj.y + obj.height).
        // The first line baseline is at: topOfBox - fontAscent (approx 0.82 of fontSize for standard fonts).
        const topOfBox = obj.y + obj.height;
        const fontAscent = obj.fontSize * 0.82;
        const firstLineBaselineY = topOfBox - fontAscent;
        const rotationDegrees = obj.rotation ? degrees(obj.rotation) : undefined;

        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
          const line = lines[lineIdx];
          if (line.length === 0) continue;

          let drawX = obj.x;
          const measuredWidth = embeddedFont.widthOfTextAtSize(line, obj.fontSize);

          if (obj.alignment === 'center') {
            drawX = obj.x + Math.max(0, (obj.width - measuredWidth) / 2);
          } else if (obj.alignment === 'right') {
            drawX = obj.x + Math.max(0, obj.width - measuredWidth);
          }

          const currentLineY = firstLineBaselineY - lineIdx * lineHeight;

          page.drawText(line, {
            x: drawX,
            y: currentLineY,
            size: obj.fontSize,
            font: embeddedFont,
            color: rgb(textColor.r, textColor.g, textColor.b),
            rotate: rotationDegrees,
          });

          // Draw underline if enabled
          if (obj.underline) {
            page.drawRectangle({
              x: drawX,
              y: currentLineY - Math.max(1, obj.fontSize * 0.12),
              width: measuredWidth,
              height: Math.max(0.75, obj.fontSize * 0.07),
              color: rgb(textColor.r, textColor.g, textColor.b),
              rotate: rotationDegrees,
            });
          }
        }
      }
    }

    const modifiedBytes = await pdfDoc.save();
    return new Blob([modifiedBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  }
}
