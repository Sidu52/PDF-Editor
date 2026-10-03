import React, { useRef, useEffect } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfPageDimension, TextObject } from '../../types/pdf';
import type { ToolMode } from '../../types/editor';
import { PdfPage } from '../PdfPage/PdfPage';
import { useDraggableText } from '../../hooks/useDraggableText';
import { useResizableText } from '../../hooks/useResizableText';
import './PdfViewer.css';

interface PdfViewerProps {
  pages: PdfPageDimension[];
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  zoom: number;
  toolMode: ToolMode;
  textObjects: TextObject[];
  selectedTextIds: string[];
  selectedTextObjects: TextObject[];
  editingTextId: string | null;
  onPageChange: (page: number) => void;
  onSelectText: (id: string | null, isMulti?: boolean) => void;
  onStartEditing: (id: string) => void;
  onStopEditing: () => void;
  onAddNewText: (pageNumber: number, xPt: number, yPt: number) => void;
  onUpdateText: (updated: Partial<TextObject> & { id: string }, description?: string) => void;
  onUpdateMultipleTextObjects: (updatedList: TextObject[], description?: string) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  pages,
  pdfDoc,
  currentPage,
  zoom,
  toolMode,
  textObjects,
  selectedTextIds,
  selectedTextObjects,
  editingTextId,
  onPageChange,
  onSelectText,
  onStartEditing,
  onStopEditing,
  onAddNewText,
  onUpdateText,
  onUpdateMultipleTextObjects,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Hook for dragging selected text elements with real-time live position & group movement
  const { isDragging, draggedObjectId, dragPositions, startDrag } = useDraggableText({
    onDragEnd: (updatedList) => {
      if (updatedList.length === 1) {
        onUpdateText(
          { id: updatedList[0].id, x: updatedList[0].x, y: updatedList[0].y },
          'Move text element'
        );
      } else if (updatedList.length > 1) {
        onUpdateMultipleTextObjects(updatedList, `Move ${updatedList.length} elements`);
      }
    },
  });

  // Hook for resizing text boxes with live visual feedback
  const { resizePosition, startResize } = useResizableText({
    onResizeEnd: (updated) => {
      onUpdateText(
        {
          id: updated.id,
          x: updated.x,
          y: updated.y,
          width: updated.width,
          height: updated.height,
        },
        'Resize text box'
      );
    },
  });

  // Smooth scroll to page when currentPage changes from external control (e.g. thumbnails)
  useEffect(() => {
    const pageElem = document.getElementById(`page-section-${currentPage}`);
    if (pageElem && containerRef.current) {
      const containerTop = containerRef.current.getBoundingClientRect().top;
      const elemTop = pageElem.getBoundingClientRect().top;
      const isVisible =
        elemTop >= containerTop &&
        elemTop <= containerTop + containerRef.current.clientHeight;

      if (!isVisible) {
        pageElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentPage]);

  // Track scroll position to update currentPage indicator
  const handleScroll = () => {
    if (!containerRef.current) return;
    const containerTop = containerRef.current.scrollTop;
    const containerHeight = containerRef.current.clientHeight;
    const centerLine = containerTop + containerHeight / 3;

    for (const page of pages) {
      const el = document.getElementById(`page-section-${page.pageNumber}`);
      if (el) {
        const top = el.offsetTop;
        const bottom = top + el.clientHeight;
        if (centerLine >= top && centerLine <= bottom) {
          if (currentPage !== page.pageNumber) {
            onPageChange(page.pageNumber);
          }
          break;
        }
      }
    }
  };

  return (
    <main
      ref={containerRef}
      className="pdf-workspace"
      onScroll={handleScroll}
      onClick={() => onSelectText(null)}
    >
      <div className="pages-scroll-container">
        {pages.map((page) => (
          <PdfPage
            key={page.pageNumber}
            pageDimension={page}
            pdfDoc={pdfDoc}
            zoom={zoom}
            toolMode={toolMode}
            textObjects={textObjects}
            selectedTextIds={selectedTextIds}
            editingTextId={editingTextId}
            draggedObjectId={isDragging ? draggedObjectId : null}
            dragPositions={dragPositions}
            resizePosition={resizePosition}
            allSelectedObjects={selectedTextObjects}
            onSelectText={onSelectText}
            onStartEditing={onStartEditing}
            onStopEditing={onStopEditing}
            onStartDrag={startDrag}
            onStartResize={startResize}
            onAddNewText={onAddNewText}
            onUpdateText={onUpdateText}
          />
        ))}
      </div>
    </main>
  );
};
