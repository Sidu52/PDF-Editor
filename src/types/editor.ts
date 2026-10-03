import type { TextObject, PdfDocumentSummary } from './pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export type ToolMode = 'select' | 'addText' | 'hand';

export type HistoryActionType =
  | 'MODIFY_TEXT'
  | 'MOVE_TEXT'
  | 'STYLE_CHANGE'
  | 'ADD_TEXT'
  | 'DELETE_TEXT'
  | 'BATCH_UPDATE';

export interface HistoryRecord {
  type: HistoryActionType;
  description: string;
  timestamp: number;
  before: TextObject[];
  after: TextObject[];
}

export interface PdfEditorState {
  file: File | null;
  pdfBytes: Uint8Array | null;
  pdfDoc: PDFDocumentProxy | null;
  documentSummary: PdfDocumentSummary | null;
  currentPage: number;
  zoom: number;
  toolMode: ToolMode;
  selectedTextId: string | null;
  editingTextId: string | null;
  textObjects: TextObject[];
  history: HistoryRecord[];
  historyIndex: number;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  scannedPdfWarning: boolean;
}
