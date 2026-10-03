/**
 * Domain types for PDF documents, pages, and editable text objects.
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextObject {
  /** Unique identifier for the text object */
  id: string;
  /** 1-indexed page number where this text belongs */
  pageNumber: number;
  /** Current text content */
  text: string;
  /** Original text if extracted from PDF; undefined if user-added */
  originalText?: string;

  /** PDF coordinates in points (72 points per inch, bottom-left origin) */
  x: number;
  y: number;
  width: number;
  height: number;

  /** Typography styling */
  fontFamily: string;
  fontSize: number;
  color: string; // Hex string, e.g. '#000000'
  /** Sampled background color behind the text, e.g. '#ffffff' or card color */
  backgroundColor?: string;
  bold: boolean;
  italic: boolean;
  underline?: boolean;
  alignment: 'left' | 'center' | 'right';
  /** Rotation in degrees (0, 90, 180, 270, etc.) */
  rotation?: number;

  /** Bounding box of original text in PDF coordinates to cover upon edit/delete */
  originalBounds?: BoundingBox;

  /** Status flags */
  isNew?: boolean;
  isDeleted?: boolean;
  isModified?: boolean;
}

export interface PdfPageDimension {
  pageNumber: number;
  /** Width in PDF points */
  width: number;
  /** Height in PDF points */
  height: number;
  /** Natural aspect ratio (width / height) */
  aspectRatio: number;
  /** Rotation in degrees (0, 90, 180, 270) */
  rotation: number;
  /** Whether extractable text was found on this page */
  hasText: boolean;
}

export interface PdfDocumentSummary {
  fileName: string;
  fileSize: number;
  pageCount: number;
  isScannedOnly: boolean;
  pages: PdfPageDimension[];
}
