import React, { useState, useEffect } from 'react';
import { usePdfEditor } from './hooks/usePdfEditor';
import { UploadArea } from './components/UploadArea/UploadArea';
import { PdfToolbar } from './components/PdfToolbar/PdfToolbar';
import { PageThumbnails } from './components/PageThumbnails/PageThumbnails';
import { PdfViewer } from './components/PdfViewer/PdfViewer';
import { PropertiesPanel } from './components/PropertiesPanel/PropertiesPanel';
import { AlertBanner } from './components/AlertBanner/AlertBanner';
import { MESSAGES } from './constants/messages';
import './App.css';

export const App: React.FC = () => {
  const {
    file,
    pdfBytes,
    pdfDoc,
    documentSummary,
    currentPage,
    zoom,
    toolMode,
    textObjects,
    isLoading,
    loadingMessage,
    error,
    scannedPdfWarning,
    selectedTextIds,
    editingTextId,
    selectedTextObject,
    selectedTextObjects,
    canUndo,
    canRedo,
    clipboardCount,
    loadPdf,
    loadSampleDocument,
    setCurrentPage,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    setToolMode,
    selectText,
    startEditing,
    stopEditing,
    updateTextObject,
    updateMultipleTextObjects,
    updateSelectedProperties,
    addNewText,
    deleteText,
    copySelected,
    pasteClipboard,
    undo,
    redo,
    exportPdf,
    clearError,
  } = usePdfEditor();

  const [dismissedScannedWarning, setDismissedScannedWarning] = useState(false);
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

  // Auto-open properties drawer when user selects an element on mobile/tablet
  useEffect(() => {
    if (selectedTextIds.length > 0 && typeof window !== 'undefined' && window.innerWidth <= 1024) {
      setIsPropertiesOpen(true);
    }
  }, [selectedTextIds]);

  // Fit Width calculation based on current viewport
  const handleFitWidth = () => {
    if (!documentSummary) return;
    const page = documentSummary.pages.find((p) => p.pageNumber === currentPage);
    if (!page) return;
    const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth <= 1024;
    const sidebarAllowance = isMobileOrTablet ? 24 : (220 + 320 + 60);
    const availableWidth = window.innerWidth - sidebarAllowance;
    const fitZoom = Math.max(0.3, Math.min(2.5, availableWidth / page.width));
    setZoom(Math.round(fitZoom * 10) / 10);
  };

  // If no file loaded yet, render the upload screen
  if (!file || !documentSummary || !pdfBytes || !pdfDoc) {
    return (
      <UploadArea
        onFileSelect={loadPdf}
        onTrySample={loadSampleDocument}
        isLoading={isLoading}
        loadingMessage={loadingMessage}
        errorMessage={error}
      />
    );
  }

  return (
    <div className="app-layout">
      {/* Top Application Toolbar */}
      <PdfToolbar
        fileName={file.name}
        fileSize={file.size}
        currentPage={currentPage}
        pageCount={documentSummary.pageCount}
        zoom={zoom}
        toolMode={toolMode}
        canUndo={canUndo}
        canRedo={canRedo}
        hasSelection={selectedTextIds.length > 0}
        selectedCount={selectedTextIds.length}
        clipboardCount={clipboardCount}
        isThumbnailsOpen={isThumbnailsOpen}
        isPropertiesOpen={isPropertiesOpen}
        onToggleThumbnails={() => setIsThumbnailsOpen((prev) => !prev)}
        onToggleProperties={() => setIsPropertiesOpen((prev) => !prev)}
        onPageChange={setCurrentPage}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onFitWidth={handleFitWidth}
        onToolModeChange={setToolMode}
        onDeleteSelected={() => deleteText()}
        onCopySelected={copySelected}
        onPaste={pasteClipboard}
        onUndo={undo}
        onRedo={redo}
        onExportPdf={exportPdf}
        isExporting={isLoading}
      />

      {/* Scanned PDF warning if applicable */}
      {scannedPdfWarning && !dismissedScannedWarning && (
        <AlertBanner
          type="warning"
          title={MESSAGES.scannedWarning.title}
          message={MESSAGES.scannedWarning.description}
          onClose={() => setDismissedScannedWarning(true)}
        />
      )}

      {/* Error notification banner if any */}
      {error && (
        <AlertBanner
          type="error"
          message={error}
          onClose={clearError}
        />
      )}

      {/* 3-Column Studio Workspace */}
      <div className="workspace-layout">
        {/* Left: Page Thumbnails Navigation */}
        <PageThumbnails
          pages={documentSummary.pages}
          currentPage={currentPage}
          pdfDoc={pdfDoc}
          isOpen={isThumbnailsOpen}
          onClose={() => setIsThumbnailsOpen(false)}
          onSelectPage={setCurrentPage}
        />

        {/* Center: Main Scrollable PDF Viewport */}
        <PdfViewer
          pages={documentSummary.pages}
          pdfDoc={pdfDoc}
          currentPage={currentPage}
          zoom={zoom}
          toolMode={toolMode}
          textObjects={textObjects}
          selectedTextIds={selectedTextIds}
          selectedTextObjects={selectedTextObjects}
          editingTextId={editingTextId}
          onPageChange={setCurrentPage}
          onSelectText={selectText}
          onStartEditing={startEditing}
          onStopEditing={stopEditing}
          onAddNewText={addNewText}
          onUpdateText={updateTextObject}
          onUpdateMultipleTextObjects={updateMultipleTextObjects}
        />

        {/* Right: Typography & Properties Inspector */}
        <PropertiesPanel
          selectedText={selectedTextObject}
          selectedObjects={selectedTextObjects}
          isOpen={isPropertiesOpen}
          onClose={() => setIsPropertiesOpen(false)}
          onUpdateText={updateTextObject}
          onUpdateMultipleProperties={updateSelectedProperties}
          onDeleteSelected={deleteText}
          onCopySelected={copySelected}
        />

        {/* Off-canvas Drawers Dimming Backdrop */}
        {(isThumbnailsOpen || isPropertiesOpen) && (
          <div
            className="drawer-backdrop"
            onClick={() => {
              setIsThumbnailsOpen(false);
              setIsPropertiesOpen(false);
            }}
          />
        )}
      </div>

      {/* Global Processing / Exporting Modal Spinner */}
      {isLoading && (
        <div className="modal-backdrop">
          <div className="loading-card">
            <div className="spinner" />
            <p className="loading-text">{loadingMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
