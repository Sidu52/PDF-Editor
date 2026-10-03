import React, { useRef, useEffect } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import type { PdfPageDimension, TextObject } from '../../types/pdf';
import type { ToolMode } from '../../types/editor';
import type { DragPositionsMap } from '../../hooks/useDraggableText';
import type { ResizePosition, ResizeHandleDirection } from '../../hooks/useResizableText';
import { TextOverlay } from '../TextOverlay/TextOverlay';
import { samplePageColors } from '../../utils/canvasColorSampler';
import './PdfPage.css';

interface PdfPageProps {
  pageDimension: PdfPageDimension;
  pdfDoc: PDFDocumentProxy | null;
  zoom: number;
  toolMode: ToolMode;
  textObjects: TextObject[];
  selectedTextIds: string[];
  editingTextId: string | null;
  draggedObjectId: string | null;
  dragPositions: DragPositionsMap;
  resizePosition: ResizePosition | null;
  allSelectedObjects: TextObject[];
  onSelectText: (id: string | null, isMulti?: boolean) => void;
  onStartEditing: (id: string) => void;
  onStopEditing: () => void;
  onStartDrag: (
    e: React.MouseEvent | React.TouchEvent,
    item: TextObject,
    allSelectedTargets: TextObject[],
    pageWidthPt: number,
    pageHeightPt: number,
    zoom: number
  ) => void;
  onStartResize: (
    e: React.MouseEvent | React.TouchEvent,
    target: TextObject,
    direction: ResizeHandleDirection,
    zoom: number
  ) => void;
  onAddNewText: (pageNumber: number, xPt: number, yPt: number) => void;
  onUpdateText: (updated: Partial<TextObject> & { id: string }, description?: string) => void;
}

export const PdfPage: React.FC<PdfPageProps> = ({
  pageDimension,
  pdfDoc,
  zoom,
  toolMode,
  textObjects,
  selectedTextIds,
  editingTextId,
  draggedObjectId,
  dragPositions,
  resizePosition,
  allSelectedObjects,
  onSelectText,
  onStartEditing,
  onStopEditing,
  onStartDrag,
  onStartResize,
  onAddNewText,
  onUpdateText,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  const displayWidth = Math.round(pageDimension.width * zoom);
  const displayHeight = Math.round(pageDimension.height * zoom);

  useEffect(() => {
    if (!canvasRef.current || !pdfDoc) return;

    let isCancelled = false;

    const renderPdfCanvas = async () => {
      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignore cancel exception
          }
        }

        const pageProxy = await pdfDoc.getPage(pageDimension.pageNumber);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const viewport = pageProxy.getViewport({ scale: zoom * dpr });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport,
          canvas,
        };

        const renderTask = pageProxy.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;

        // Sample real text colors and background colors directly from the rendered canvas
        try {
          const sampled = samplePageColors(
            ctx,
            textObjects.filter((t) => t.pageNumber === pageDimension.pageNumber && !t.isModified),
            pageDimension.height,
            zoom * dpr,
            viewport.width,
            viewport.height
          );
          for (const s of sampled) {
            const target = textObjects.find((t) => t.id === s.id);
            if (target && !target.isModified) {
              target.color = s.color;
              target.backgroundColor = s.backgroundColor;
              if (s.underline) {
                target.underline = true;
              }
            }
          }
        } catch {
          // Ignore sampling errors
        }
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'name' in err && err.name === 'RenderingCancelledException') {
          return;
        }
        console.error('Error rendering page:', err);
      }
    };

    renderPdfCanvas();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, pageDimension.pageNumber, zoom, displayWidth, displayHeight]);

  return (
    <div
      className="pdf-page-container"
      style={{
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
      }}
      id={`page-section-${pageDimension.pageNumber}`}
    >
      <canvas ref={canvasRef} className="pdf-canvas" />

      <TextOverlay
        pageNumber={pageDimension.pageNumber}
        pageWidthPt={pageDimension.width}
        pageHeightPt={pageDimension.height}
        zoom={zoom}
        toolMode={toolMode}
        textObjects={textObjects}
        selectedTextIds={selectedTextIds}
        editingTextId={editingTextId}
        draggedObjectId={draggedObjectId}
        dragPositions={dragPositions}
        resizePosition={resizePosition}
        allSelectedObjects={allSelectedObjects}
        onSelectText={onSelectText}
        onStartEditing={onStartEditing}
        onStopEditing={onStopEditing}
        onStartDrag={onStartDrag}
        onStartResize={onStartResize}
        onAddNewText={onAddNewText}
        onUpdateText={onUpdateText}
      />
    </div>
  );
};
