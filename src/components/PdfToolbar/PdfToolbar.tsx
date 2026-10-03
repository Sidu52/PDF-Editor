import {
  MousePointer,
  Type,
  Trash2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileEdit,
  Copy,
  ClipboardPaste,
  RotateCcw,
  Layers,
  Sliders,
} from 'lucide-react';
import type { ToolMode } from '../../types/editor';
import { formatFileSize } from '../../utils/file';
import { MESSAGES } from '../../constants/messages';
import './PdfToolbar.css';

interface PdfToolbarProps {
  fileName: string;
  fileSize: number;
  currentPage: number;
  pageCount: number;
  zoom: number;
  toolMode: ToolMode;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  selectedCount?: number;
  clipboardCount?: number;
  isThumbnailsOpen?: boolean;
  isPropertiesOpen?: boolean;
  onToggleThumbnails?: () => void;
  onToggleProperties?: () => void;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitWidth: () => void;
  onToolModeChange: (mode: ToolMode) => void;
  onDeleteSelected: () => void;
  onCopySelected?: () => void;
  onPaste?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExportPdf: () => void;
  isExporting?: boolean;
}

export const PdfToolbar: React.FC<PdfToolbarProps> = ({
  fileName,
  fileSize,
  currentPage,
  pageCount,
  zoom,
  toolMode,
  canUndo,
  canRedo,
  hasSelection,
  selectedCount = 0,
  clipboardCount = 0,
  isThumbnailsOpen = false,
  isPropertiesOpen = false,
  onToggleThumbnails,
  onToggleProperties,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitWidth,
  onToolModeChange,
  onDeleteSelected,
  onCopySelected,
  onPaste,
  onUndo,
  onRedo,
  onExportPdf,
  isExporting,
}) => {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <header className="pdf-toolbar">
      {/* Branding and File Metadata */}
      <div className="toolbar-group toolbar-title-section">
        {onToggleThumbnails && (
          <button
            type="button"
            className={`toolbar-btn mobile-drawer-btn ${isThumbnailsOpen ? 'active' : ''}`}
            onClick={onToggleThumbnails}
            title="Toggle Page Thumbnails"
          >
            <Layers size={18} />
            <span className="mobile-btn-label">Pages</span>
          </button>
        )}

        <div className="app-brand">
          <FileEdit size={22} color="#3b82f6" />
          <span className="brand-name">PDF Forge</span>
          <span className="app-brand-badge">PRO</span>
        </div>

        <div className="toolbar-separator brand-separator" />

        <div className="file-info" title={fileName}>
          <span className="file-name">{fileName}</span>
          <span className="file-meta">
            {formatFileSize(fileSize)} • {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </span>
        </div>
      </div>

      {/* Editing Tools */}
      <div className="toolbar-group">
        <button
          type="button"
          className={`toolbar-btn ${toolMode === 'select' ? 'active' : ''}`}
          title={MESSAGES.toolbar.selectTool}
          onClick={() => onToolModeChange('select')}
        >
          <MousePointer size={17} />
          <span>Select</span>
        </button>

        <button
          type="button"
          className={`toolbar-btn ${toolMode === 'addText' ? 'active' : ''}`}
          title={MESSAGES.toolbar.addTextTool}
          onClick={() => onToolModeChange('addText')}
        >
          <Type size={17} />
          <span>Add Text</span>
        </button>

        {onCopySelected && (
          <button
            type="button"
            className="toolbar-btn"
            title="Copy selection (Ctrl+C)"
            disabled={!hasSelection}
            onClick={onCopySelected}
          >
            <Copy size={16} />
            <span>Copy</span>
          </button>
        )}

        {onPaste && (
          <button
            type="button"
            className="toolbar-btn"
            title="Paste text (Ctrl+V)"
            disabled={clipboardCount === 0}
            onClick={onPaste}
          >
            <ClipboardPaste size={16} />
            <span>Paste {clipboardCount > 0 ? `(${clipboardCount})` : ''}</span>
          </button>
        )}

        <button
          type="button"
          className="toolbar-btn toolbar-btn-danger"
          title={MESSAGES.toolbar.deleteTool}
          disabled={!hasSelection}
          onClick={onDeleteSelected}
        >
          <Trash2 size={17} />
          <span>{selectedCount > 1 ? `Delete (${selectedCount})` : 'Delete'}</span>
        </button>

        <div className="toolbar-separator" />

        {/* Undo & Redo */}
        <button
          type="button"
          className="toolbar-btn"
          title={MESSAGES.toolbar.undoTool}
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 size={17} />
        </button>

        <button
          type="button"
          className="toolbar-btn"
          title={MESSAGES.toolbar.redoTool}
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 size={17} />
        </button>
      </div>

      {/* Page Navigation */}
      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous Page"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="page-stepper">
          <input
            type="number"
            min={1}
            max={pageCount}
            value={currentPage}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1 && val <= pageCount) {
                onPageChange(val);
              }
            }}
            className="page-input"
          />
          <span>/ {pageCount}</span>
        </div>

        <button
          type="button"
          className="toolbar-btn"
          disabled={currentPage >= pageCount}
          onClick={() => onPageChange(currentPage + 1)}
          title="Next Page"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-btn"
          onClick={onZoomOut}
          title={MESSAGES.toolbar.zoomOut}
        >
          <ZoomOut size={17} />
        </button>

        <span className="zoom-badge">{zoomPercent}%</span>

        <button
          type="button"
          className="toolbar-btn"
          onClick={onZoomIn}
          title={MESSAGES.toolbar.zoomIn}
        >
          <ZoomIn size={17} />
        </button>

        <button
          type="button"
          className="toolbar-btn"
          onClick={onFitWidth}
          title={MESSAGES.toolbar.fitWidth}
        >
          <Maximize2 size={16} />
        </button>

        <button
          type="button"
          className="toolbar-btn"
          onClick={onResetZoom}
          title="Reset Zoom (100%)"
        >
          <RotateCcw size={16} />
        </button>

        <div className="toolbar-separator" />

        {onToggleProperties && (
          <button
            type="button"
            className={`toolbar-btn mobile-drawer-btn ${isPropertiesOpen ? 'active' : ''}`}
            onClick={onToggleProperties}
            title="Toggle Properties Panel"
          >
            <Sliders size={17} />
            <span className="mobile-btn-label">Format</span>
            {hasSelection && <span className="selection-indicator-dot" />}
          </button>
        )}

        {/* Download Button */}
        <button
          type="button"
          className="btn-download"
          disabled={isExporting}
          onClick={onExportPdf}
          title={MESSAGES.toolbar.download}
        >
          <Download size={17} />
          <span>{isExporting ? 'Exporting...' : MESSAGES.toolbar.download}</span>
        </button>
      </div>
    </header>
  );
};
