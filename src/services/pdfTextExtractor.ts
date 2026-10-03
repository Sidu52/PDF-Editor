import type { PDFPageProxy } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import type { TextObject } from '../types/pdf';

interface RawItemInfo {
  str: string;
  x: number; // PDF points
  y: number; // PDF baseline points
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
}

export class PdfTextExtractor {
  /**
   * Extracts text items from a PDF page and groups them into cohesive editable text objects.
   */
  public static async extractPageText(
    page: PDFPageProxy,
    pageNumber: number
  ): Promise<TextObject[]> {
    const textContent = await page.getTextContent();
    const fontStyles = (textContent as unknown as { styles?: Record<string, { fontFamily?: string }> }).styles || {};
    const rawItems: RawItemInfo[] = [];

    for (const item of textContent.items) {
      if (!('str' in item)) continue;
      const textItem = item as TextItem;
      const str = textItem.str;
      if (!str || str.trim().length === 0) continue;

      const transform = textItem.transform; // [a, b, c, d, tx, ty]
      const tx = transform[4];
      const ty = transform[5];
      const fontSize = Math.max(
        6,
        Math.round(Math.hypot(transform[0], transform[1]) * 10) / 10
      );
      const width = textItem.width || fontSize * 0.5 * str.length;
      const height = textItem.height > 0 ? textItem.height : fontSize;

      const styleObj = textItem.fontName ? fontStyles[textItem.fontName] : undefined;
      const resolvedFontName = (styleObj?.fontFamily || textItem.fontName || '').trim();

      rawItems.push({
        str,
        x: Math.round(tx * 100) / 100,
        y: Math.round(ty * 100) / 100,
        width: Math.round(width * 100) / 100,
        height: Math.round(height * 100) / 100,
        fontSize,
        fontName: resolvedFontName,
      });
    }

    if (rawItems.length === 0) {
      return [];
    }

    // Sort items top-to-bottom (descending Y in PDF coordinates), then left-to-right (ascending X)
    rawItems.sort((a, b) => {
      const yDiff = b.y - a.y;
      if (Math.abs(yDiff) > 3) return yDiff;
      return a.x - b.x;
    });

    // Group adjacent items on the same baseline into cohesive text objects
    const groupedObjects: TextObject[] = [];
    let currentGroup: RawItemInfo[] = [];

    const commitGroup = (group: RawItemInfo[]) => {
      if (group.length === 0) return;

      const combinedText = group.map((item) => item.str).join('');
      if (combinedText.trim().length === 0) return;

      const first = group[0];
      const last = group[group.length - 1];

      const minX = first.x;
      const maxX = last.x + last.width;
      const totalWidth = Math.max(8, maxX - minX);

      // In PDF coordinates, ty is the text baseline.
      // Descent is approximately 0.25 * fontSize, Ascent is approximately 0.85 * fontSize.
      const maxFontSize = Math.max(...group.map((i) => i.fontSize));
      const descent = maxFontSize * 0.25;
      const ascent = maxFontSize * 0.85;
      const totalHeight = ascent + descent;
      const bottomY = first.y - descent;

      const fontNameLower = first.fontName.toLowerCase();
      const bold =
        fontNameLower.includes('bold') ||
        fontNameLower.includes('black') ||
        fontNameLower.includes('heavy') ||
        fontNameLower.includes('medium') ||
        fontNameLower.includes('semibold') ||
        fontNameLower.includes('demibold') ||
        fontNameLower.includes('w6') ||
        fontNameLower.includes('w7') ||
        fontNameLower.includes('w8') ||
        fontNameLower.includes('w9') ||
        fontNameLower.includes('700') ||
        fontNameLower.includes('800') ||
        fontNameLower.includes('900');

      const italic =
        fontNameLower.includes('italic') ||
        fontNameLower.includes('oblique');

      let fontFamily = 'helvetica';
      if (
        fontNameLower.includes('times') ||
        fontNameLower.includes('serif') ||
        fontNameLower.includes('georgia') ||
        fontNameLower.includes('cambria') ||
        fontNameLower.includes('garamond')
      ) {
        fontFamily = 'times';
      } else if (
        fontNameLower.includes('courier') ||
        fontNameLower.includes('mono') ||
        fontNameLower.includes('consolas') ||
        fontNameLower.includes('menlo') ||
        fontNameLower.includes('code')
      ) {
        fontFamily = 'courier';
      }

      const id = `page-${pageNumber}-txt-${Math.round(minX)}-${Math.round(bottomY)}-${Math.random().toString(36).substring(2, 7)}`;

      groupedObjects.push({
        id,
        pageNumber,
        text: combinedText,
        originalText: combinedText,
        x: Math.round(minX * 100) / 100,
        y: Math.round(bottomY * 100) / 100,
        width: Math.round(totalWidth * 100) / 100,
        height: Math.round(totalHeight * 100) / 100,
        fontFamily,
        fontSize: Math.round(maxFontSize),
        color: '#000000',
        bold,
        italic,
        alignment: 'left',
        originalBounds: {
          x: Math.round(minX * 100) / 100,
          y: Math.round(bottomY * 100) / 100,
          width: Math.round(totalWidth * 100) / 100,
          height: Math.round(totalHeight * 100) / 100,
        },
      });
    };

    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];

      if (currentGroup.length === 0) {
        currentGroup.push(item);
        continue;
      }

      const prev = currentGroup[currentGroup.length - 1];
      const sameBaseline = Math.abs(item.y - prev.y) <= 3;
      const prevRight = prev.x + prev.width;
      const horizontalGap = item.x - prevRight;

      // Group if on same baseline and gap is reasonably close (e.g. <= 1.2 * fontSize)
      const allowedGap = Math.max(prev.fontSize, item.fontSize) * 1.2;
      const isConsecutive = horizontalGap >= -2 && horizontalGap <= allowedGap;

      if (sameBaseline && isConsecutive) {
        currentGroup.push(item);
      } else {
        commitGroup(currentGroup);
        currentGroup = [item];
      }
    }

    commitGroup(currentGroup);
    return groupedObjects;
  }
}
