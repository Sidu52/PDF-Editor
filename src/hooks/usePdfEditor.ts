import { useState, useCallback, useEffect } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { TextObject, PdfDocumentSummary } from '../types/pdf';
import type { ToolMode, HistoryActionType } from '../types/editor';
import { PdfLoader } from '../services/pdfLoader';
import { PdfTextExtractor } from '../services/pdfTextExtractor';
import { PdfExporter } from '../services/pdfExporter';
import { createSampleInvoicePdf } from '../services/sampleDocument';
import { useHistory } from './useHistory';
import { useTextSelection } from './useTextSelection';
import { EDITOR_CONFIG } from '../constants/config';
import { MESSAGES } from '../constants/messages';
import { triggerFileDownload, getEditedFilename } from '../utils/file';

export function usePdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [documentSummary, setDocumentSummary] = useState<PdfDocumentSummary | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(EDITOR_CONFIG.zoom.default);
  const [toolMode, setToolMode] = useState<ToolMode>('select');

  const [textObjects, setTextObjects] = useState<TextObject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [scannedPdfWarning, setScannedPdfWarning] = useState<boolean>(false);

  const history = useHistory(textObjects);
  const selection = useTextSelection(textObjects);

  // Helper to commit state change and record in history
  const commitTextObjects = useCallback(
    (
      newObjects: TextObject[],
      actionType: HistoryActionType,
      description: string
    ) => {
      history.pushState(actionType, description, textObjects, newObjects);
      setTextObjects(newObjects);
    },
    [history, textObjects]
  );

  // Load PDF file from File object or ArrayBuffer
  const loadPdf = useCallback(
    async (fileToLoad: File | { name: string; size: number; bytes: ArrayBuffer }) => {
      setIsLoading(true);
      setError(null);
      setScannedPdfWarning(false);
      setLoadingMessage(MESSAGES.loading.parsingDocument);

      try {
        let fileObj: File;
        let originalUint8: Uint8Array;

        if (fileToLoad instanceof File) {
          fileObj = fileToLoad;
          const buffer = await fileToLoad.arrayBuffer();
          originalUint8 = new Uint8Array(buffer);
        } else {
          originalUint8 = new Uint8Array(fileToLoad.bytes);
          fileObj = new File([new Uint8Array(originalUint8)], fileToLoad.name, { type: 'application/pdf' });
        }

        // Pass an independent copy to pdfjsLib so originalUint8 is never transferred/detached
        const disposableCopy = new Uint8Array(originalUint8);
        const docProxy = await PdfLoader.loadDocument(disposableCopy.buffer);
        const { summary, pages } = await PdfLoader.inspectDocument(
          docProxy,
          fileObj.name,
          fileObj.size
        );

        setLoadingMessage(MESSAGES.loading.extractingText);

        const extractedObjects: TextObject[] = [];
        for (const pageProxy of pages) {
          const pageTexts = await PdfTextExtractor.extractPageText(
            pageProxy,
            pageProxy.pageNumber
          );
          extractedObjects.push(...pageTexts);
        }

        setFile(fileObj);
        setPdfBytes(new Uint8Array(originalUint8));
        setPdfDoc(docProxy);
        setDocumentSummary(summary);
        setTextObjects(extractedObjects);
        history.resetHistory(extractedObjects);
        selection.clearSelection();
        setCurrentPage(1);
        setZoom(EDITOR_CONFIG.zoom.default);
        setToolMode('select');

        if (summary.isScannedOnly) {
          setScannedPdfWarning(true);
        }
      } catch (err: unknown) {
        console.error('Failed to load PDF document:', err);
        setError(MESSAGES.upload.corruptedError);
      } finally {
        setIsLoading(false);
      }
    },
    [history, selection]
  );

  // Load the built-in sample invoice PDF
  const loadSampleDocument = useCallback(async () => {
    setIsLoading(true);
    setLoadingMessage(MESSAGES.loading.parsingDocument);
    try {
      const sampleBytes = await createSampleInvoicePdf();
      await loadPdf({
        name: 'sample-invoice.pdf',
        size: sampleBytes.byteLength,
        bytes: sampleBytes.buffer as ArrayBuffer,
      });
    } catch (err) {
      console.error('Failed to create sample invoice:', err);
      setError('Failed to generate sample invoice PDF.');
      setIsLoading(false);
    }
  }, [loadPdf]);

  const [clipboard, setClipboard] = useState<TextObject[]>([]);

  // Copy currently selected text objects to internal clipboard
  const copySelected = useCallback(() => {
    if (selection.selectedTextObjects.length === 0) return;
    setClipboard(selection.selectedTextObjects.map((t) => ({ ...t })));
  }, [selection.selectedTextObjects]);

  // Paste objects from clipboard
  const pasteClipboard = useCallback(() => {
    if (clipboard.length === 0) return;
    const newObjects: TextObject[] = [];
    const newIds: string[] = [];

    for (const item of clipboard) {
      const newId = `pasted-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      newIds.push(newId);
      newObjects.push({
        ...item,
        id: newId,
        pageNumber: currentPage,
        x: item.x + EDITOR_CONFIG.clipboard.pasteOffsetXPt,
        y: item.y + EDITOR_CONFIG.clipboard.pasteOffsetYPt,
        originalBounds: undefined,
        originalText: undefined,
        isNew: true,
        isModified: true,
        isDeleted: false,
      });
    }

    const next = [...textObjects, ...newObjects];
    commitTextObjects(next, 'ADD_TEXT', `Paste ${newObjects.length} text object(s)`);
    // Select newly pasted items
    selection.selectText(newIds[0]);
    for (let i = 1; i < newIds.length; i++) {
      selection.selectText(newIds[i], true);
    }
  }, [clipboard, commitTextObjects, currentPage, selection, textObjects]);

  // Update multiple text objects (e.g. after group drag)
  const updateMultipleTextObjects = useCallback(
    (updatedList: TextObject[], historyDescription = 'Move multiple text elements') => {
      setTextObjects((prev) => {
        const updateMap = new Map(
          updatedList.map((item) => [item.id, { ...item, isModified: true }])
        );
        const next = prev.map((item) => updateMap.get(item.id) || item);
        history.pushState('MOVE_TEXT', historyDescription, prev, next);
        return next;
      });
    },
    [history]
  );

  // Update properties for all currently selected text objects
  const updateSelectedProperties = useCallback(
    (props: Partial<TextObject>, historyDescription = 'Update selected properties') => {
      if (selection.selectedTextIds.length === 0) return;
      setTextObjects((prev) => {
        const next = prev.map((item) => {
          if (selection.selectedTextIds.includes(item.id)) {
            if (props.fontSize && props.fontSize !== item.fontSize) {
              const topOfBox = item.y + item.height;
              const scaleFactor = props.fontSize / (item.fontSize || props.fontSize);
              const newHeight = Math.max(props.fontSize * 1.2, Math.round(item.height * scaleFactor * 10) / 10);
              const newWidth = Math.max(item.width, Math.round(item.width * scaleFactor * 10) / 10);
              const newY = Math.round((topOfBox - newHeight) * 10) / 10;
              return { ...item, ...props, height: newHeight, width: newWidth, y: newY, isModified: true };
            }
            return { ...item, ...props, isModified: true };
          }
          return item;
        });
        history.pushState('STYLE_CHANGE', historyDescription, prev, next);
        return next;
      });
    },
    [history, selection.selectedTextIds]
  );

  // Update a single text object's properties
  const updateTextObject = useCallback(
    (
      updated: Partial<TextObject> & { id: string },
      historyDescription = 'Update text property'
    ) => {
      setTextObjects((prev) => {
        const next = prev.map((item) => {
          if (item.id === updated.id) {
            return { ...item, ...updated, isModified: true };
          }
          return item;
        });

        history.pushState('STYLE_CHANGE', historyDescription, prev, next);
        return next;
      });
    },
    [history]
  );

  // Add new text box on current page at specified PDF coordinates
  const addNewText = useCallback(
    (pageNumber: number, xPt: number, yPt: number) => {
      const newId = `new-txt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newObject: TextObject = {
        id: newId,
        pageNumber,
        text: 'Click here to edit text',
        x: xPt,
        y: yPt,
        width: EDITOR_CONFIG.newText.defaultWidthPt,
        height: EDITOR_CONFIG.newText.defaultHeightPt,
        fontFamily: EDITOR_CONFIG.newText.defaultFontFamily,
        fontSize: EDITOR_CONFIG.newText.defaultFontSizePt,
        color: EDITOR_CONFIG.newText.defaultColor,
        bold: false,
        italic: false,
        underline: EDITOR_CONFIG.newText.defaultUnderline,
        alignment: EDITOR_CONFIG.newText.defaultAlignment,
        rotation: EDITOR_CONFIG.newText.defaultRotationDegrees,
        isNew: true,
      };

      const nextObjects = [...textObjects, newObject];
      commitTextObjects(nextObjects, 'ADD_TEXT', 'Add new text box');
      selection.selectText(newId);
      setToolMode('select');
    },
    [commitTextObjects, selection, textObjects]
  );

  // Delete selected or specified text
  const deleteText = useCallback(
    (idToDelete?: string) => {
      const targetIds = idToDelete ? [idToDelete] : selection.selectedTextIds;
      if (targetIds.length === 0) return;

      const next = textObjects
        .map((t) => {
          if (targetIds.includes(t.id)) {
            if (t.isNew) return null;
            return { ...t, isDeleted: true };
          }
          return t;
        })
        .filter(Boolean) as TextObject[];

      commitTextObjects(next, 'DELETE_TEXT', `Delete ${targetIds.length} text object(s)`);
      selection.clearSelection();
    },
    [commitTextObjects, selection, textObjects]
  );

  // Undo action
  const handleUndo = useCallback(() => {
    const prevState = history.undo();
    if (prevState) {
      setTextObjects(prevState);
    }
  }, [history]);

  // Redo action
  const handleRedo = useCallback(() => {
    const nextState = history.redo();
    if (nextState) {
      setTextObjects(nextState);
    }
  }, [history]);

  // Export modified PDF
  const exportPdf = useCallback(async () => {
    if (!pdfBytes || !file) return;

    setIsLoading(true);
    setLoadingMessage(MESSAGES.loading.exportingPdf);

    try {
      const safeDataToExport = new Uint8Array(pdfBytes);
      const exportedBlob = await PdfExporter.exportModifiedPdf(safeDataToExport, textObjects);
      const downloadName = getEditedFilename(file.name);
      triggerFileDownload(exportedBlob, downloadName);
    } catch (err: unknown) {
      console.error('Export failed:', err);
      const errMsg = err instanceof Error ? err.message : 'Please check that all fonts and edits are valid.';
      setError(`Export failed: ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  }, [file, pdfBytes, textObjects]);

  // Zoom helpers
  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(EDITOR_CONFIG.zoom.max, Math.round((prev + EDITOR_CONFIG.zoom.step) * 10) / 10));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(EDITOR_CONFIG.zoom.min, Math.round((prev - EDITOR_CONFIG.zoom.step) * 10) / 10));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(EDITOR_CONFIG.zoom.default);
  }, []);

  // Keyboard shortcut listeners (Undo, Redo, Delete, Copy, Paste, Underline, Select All)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isInput) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (ctrlKey && e.key.toLowerCase() === 'c') {
        if (selection.selectedTextIds.length > 0) {
          e.preventDefault();
          copySelected();
        }
      } else if (ctrlKey && e.key.toLowerCase() === 'v') {
        if (clipboard.length > 0) {
          e.preventDefault();
          pasteClipboard();
        }
      } else if (ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selection.selectAll(currentPage);
      } else if (ctrlKey && e.key.toLowerCase() === 'u') {
        if (selection.selectedTextObject) {
          e.preventDefault();
          updateSelectedProperties({ underline: !selection.selectedTextObject.underline });
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection.selectedTextIds.length > 0) {
          e.preventDefault();
          deleteText();
        }
      } else if (e.key.toLowerCase() === 'v') {
        setToolMode('select');
      } else if (e.key.toLowerCase() === 't') {
        setToolMode('addText');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    clipboard.length,
    copySelected,
    currentPage,
    deleteText,
    handleRedo,
    handleUndo,
    pasteClipboard,
    selection,
    updateSelectedProperties,
  ]);

  return {
    file,
    pdfBytes,
    pdfDoc,
    fileBytes: pdfBytes ? pdfBytes.buffer : null,
    documentSummary,
    currentPage,
    zoom,
    toolMode,
    textObjects,
    isLoading,
    loadingMessage,
    error,
    scannedPdfWarning,
    selectedTextId: selection.selectedTextId,
    selectedTextIds: selection.selectedTextIds,
    editingTextId: selection.editingTextId,
    selectedTextObject: selection.selectedTextObject,
    selectedTextObjects: selection.selectedTextObjects,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    clipboardCount: clipboard.length,
    loadPdf,
    loadSampleDocument,
    setCurrentPage,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    setToolMode,
    selectText: selection.selectText,
    selectAll: selection.selectAll,
    startEditing: selection.startEditing,
    stopEditing: selection.stopEditing,
    clearSelection: selection.clearSelection,
    updateTextObject,
    updateMultipleTextObjects,
    updateSelectedProperties,
    addNewText,
    deleteText,
    copySelected,
    pasteClipboard,
    undo: handleUndo,
    redo: handleRedo,
    exportPdf,
    clearError: () => setError(null),
  };
}
