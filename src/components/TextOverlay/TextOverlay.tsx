import React, { useRef } from 'react';
import type { TextObject } from '../../types/pdf';
import type { ToolMode } from '../../types/editor';
import type { DragPositionsMap } from '../../hooks/useDraggableText';
import type { ResizePosition, ResizeHandleDirection } from '../../hooks/useResizableText';
import { screenToPdfCoordinates } from '../../utils/coordinates';
import { EDITOR_CONFIG } from '../../constants/config';
import { TextItemView } from '../TextItem/TextItemView';
import './TextOverlay.css';

interface TextOverlayProps {
  pageNumber: number;
  pageWidthPt: number;
  pageHeightPt: number;
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

export const TextOverlay: React.FC<TextOverlayProps> = ({
  pageNumber,
  pageWidthPt,
  pageHeightPt,
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
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    if (toolMode === 'addText') {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const pdfCoords = screenToPdfCoordinates(
        clickX,
        clickY,
        EDITOR_CONFIG.newText.defaultWidthPt * zoom,
        EDITOR_CONFIG.newText.defaultHeightPt * zoom,
        pageHeightPt,
        zoom
      );

      onAddNewText(pageNumber, pdfCoords.x, pdfCoords.y);
    } else {
      onSelectText(null);
    }
  };

  const pageObjects = textObjects.filter((t) => t.pageNumber === pageNumber);

  return (
    <div
      ref={containerRef}
      className={`text-overlay-container mode-${toolMode === 'addText' ? 'add-text' : 'select'}`}
      onClick={handleContainerClick}
    >
      {pageObjects.map((obj) => (
        <TextItemView
          key={obj.id}
          textObject={obj}
          pageWidthPt={pageWidthPt}
          pageHeightPt={pageHeightPt}
          zoom={zoom}
          isSelected={selectedTextIds.includes(obj.id)}
          isEditing={obj.id === editingTextId}
          isDragging={obj.id === draggedObjectId || (draggedObjectId !== null && selectedTextIds.includes(obj.id))}
          dragPositions={dragPositions}
          resizePosition={resizePosition}
          allSelectedObjects={allSelectedObjects}
          onSelect={onSelectText}
          onStartEditing={onStartEditing}
          onStopEditing={onStopEditing}
          onStartDrag={onStartDrag}
          onStartResize={onStartResize}
          onUpdateText={onUpdateText}
        />
      ))}
    </div>
  );
};
