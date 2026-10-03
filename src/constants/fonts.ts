import type { FontFamilyOption, StandardFontKey } from '../types/fonts';

export const SUPPORTED_FONT_FAMILIES: readonly FontFamilyOption[] = [
  {
    id: 'helvetica',
    name: 'Helvetica / Arial',
    cssFamily: 'Arial, Helvetica, sans-serif',
    fallbackPdfFont: 'Helvetica',
    boldPdfFont: 'Helvetica-Bold',
    italicPdfFont: 'Helvetica-Oblique',
    boldItalicPdfFont: 'Helvetica-BoldOblique',
  },
  {
    id: 'times',
    name: 'Times New Roman',
    cssFamily: '"Times New Roman", Times, serif',
    fallbackPdfFont: 'Times-Roman',
    boldPdfFont: 'Times-Bold',
    italicPdfFont: 'Times-Italic',
    boldItalicPdfFont: 'Times-BoldItalic',
  },
  {
    id: 'courier',
    name: 'Courier New',
    cssFamily: '"Courier New", Courier, monospace',
    fallbackPdfFont: 'Courier',
    boldPdfFont: 'Courier-Bold',
    italicPdfFont: 'Courier-Oblique',
    boldItalicPdfFont: 'Courier-BoldOblique',
  },
  {
    id: 'georgia',
    name: 'Georgia',
    cssFamily: 'Georgia, serif',
    fallbackPdfFont: 'Times-Roman',
    boldPdfFont: 'Times-Bold',
    italicPdfFont: 'Times-Italic',
    boldItalicPdfFont: 'Times-BoldItalic',
  },
  {
    id: 'verdana',
    name: 'Verdana',
    cssFamily: 'Verdana, Geneva, sans-serif',
    fallbackPdfFont: 'Helvetica',
    boldPdfFont: 'Helvetica-Bold',
    italicPdfFont: 'Helvetica-Oblique',
    boldItalicPdfFont: 'Helvetica-BoldOblique',
  },
] as const;

export const DEFAULT_FONT_FAMILY_ID = 'helvetica';
export const DEFAULT_FONT_SIZE_PT = 14;
export const MIN_FONT_SIZE_PT = 6;
export const MAX_FONT_SIZE_PT = 120;
export const FONT_SIZE_PRESETS = [8, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72] as const;

/**
 * Standard PDF font name mapping helper
 */
export const PDF_STANDARD_FONT_NAMES: Record<StandardFontKey, string> = {
  Helvetica: 'Helvetica',
  'Helvetica-Bold': 'Helvetica-Bold',
  'Helvetica-Oblique': 'Helvetica-Oblique',
  'Helvetica-BoldOblique': 'Helvetica-BoldOblique',
  'Times-Roman': 'Times-Roman',
  'Times-Bold': 'Times-Bold',
  'Times-Italic': 'Times-Italic',
  'Times-BoldItalic': 'Times-BoldItalic',
  Courier: 'Courier',
  'Courier-Bold': 'Courier-Bold',
  'Courier-Oblique': 'Courier-Oblique',
  'Courier-BoldOblique': 'Courier-BoldOblique',
};
