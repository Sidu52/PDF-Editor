/**
 * Typography and font mapping types.
 */

export type StandardFontKey =
  | 'Helvetica'
  | 'Helvetica-Bold'
  | 'Helvetica-Oblique'
  | 'Helvetica-BoldOblique'
  | 'Times-Roman'
  | 'Times-Bold'
  | 'Times-Italic'
  | 'Times-BoldItalic'
  | 'Courier'
  | 'Courier-Bold'
  | 'Courier-Oblique'
  | 'Courier-BoldOblique';

export interface FontFamilyOption {
  id: string;
  name: string;
  cssFamily: string;
  fallbackPdfFont: StandardFontKey;
  boldPdfFont: StandardFontKey;
  italicPdfFont: StandardFontKey;
  boldItalicPdfFont: StandardFontKey;
}

export type TextAlignment = 'left' | 'center' | 'right';
