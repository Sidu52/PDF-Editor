import { StandardFonts } from 'pdf-lib';
import { SUPPORTED_FONT_FAMILIES, DEFAULT_FONT_FAMILY_ID } from '../constants/fonts';
import type { FontFamilyOption } from '../types/fonts';

/**
 * Service for typography lookup and standard font mapping.
 */
export class FontManager {
  /**
   * Retrieves font configuration by identifier.
   */
  public static getFontConfig(fontId: string): FontFamilyOption {
    const found = SUPPORTED_FONT_FAMILIES.find((f) => f.id === fontId);
    if (found) return found;
    return SUPPORTED_FONT_FAMILIES.find((f) => f.id === DEFAULT_FONT_FAMILY_ID)!;
  }

  /**
   * Maps a font selection and style (bold, italic) to pdf-lib's StandardFonts enum.
   */
  public static resolveStandardPdfFont(
    fontId: string,
    bold: boolean,
    italic: boolean
  ): StandardFonts {
    const config = this.getFontConfig(fontId);

    if (config.id === 'times' || config.id === 'georgia') {
      if (bold && italic) return StandardFonts.TimesRomanBoldItalic;
      if (bold) return StandardFonts.TimesRomanBold;
      if (italic) return StandardFonts.TimesRomanItalic;
      return StandardFonts.TimesRoman;
    }

    if (config.id === 'courier') {
      if (bold && italic) return StandardFonts.CourierBoldOblique;
      if (bold) return StandardFonts.CourierBold;
      if (italic) return StandardFonts.CourierOblique;
      return StandardFonts.Courier;
    }

    // Default to Helvetica/Arial family
    if (bold && italic) return StandardFonts.HelveticaBoldOblique;
    if (bold) return StandardFonts.HelveticaBold;
    if (italic) return StandardFonts.HelveticaOblique;
    return StandardFonts.Helvetica;
  }

  /**
   * Generates CSS font string for preview rendering.
   */
  public static getCssFontFamily(fontId: string): string {
    return this.getFontConfig(fontId).cssFamily;
  }
}
