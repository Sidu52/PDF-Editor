import React, { useRef, useEffect } from 'react';
import { Move } from 'lucide-react';
import type { TextObject } from '../../types/pdf';
import type { DragPositionsMap } from '../../hooks/useDraggableText';
import type { ResizePosition, ResizeHandleDirection } from '../../hooks/useResizableText';
import { pdfToScreenCoordinates } from '../../utils/coordinates';
import { FontManager } from '../../services/fontManager';
import './TextItemView.css';

interface TextItemViewProps {
  textObject: TextObject;
  pageWidthPt: number;
  pageHeightPt: number;
  zoom: number;
  isSelected: boolean;
  isEditing: boolean;
  isDragging: boolean;
  dragPositions: DragPositionsMap;
  resizePosition: ResizePosition | null;
  allSelectedObjects: TextObject[];
  onSelect: (id: string, isMulti?: boolean) => void;
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
  onUpdateText: (updated: Partial<TextObject> & { id: string }, description?: string) => void;
}

export const TextItemView: React.FC<TextItemViewProps> = ({
  textObject,
  pageWidthPt,
  pageHeightPt,
  zoom,
  isSelected,
  isEditing,
  isDragging,
  dragPositions,
  resizePosition,
  allSelectedObjects,
  onSelect,
  onStartEditing,
  onStopEditing,
  onStartDrag,
  onStartResize,
  onUpdateText,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const hasOriginal = !!textObject.originalBounds;

  // Real-time live coordinates if currently dragging or resizing
  const liveDrag = isDragging && dragPositions[textObject.id];
  const isResizingThis = resizePosition && resizePosition.id === textObject.id;

  const currentX = liveDrag ? liveDrag.x : textObject.x;
  const currentY = isResizingThis ? resizePosition.y : liveDrag ? liveDrag.y : textObject.y;
  const currentWidth = isResizingThis ? resizePosition.width : textObject.width;
  const currentHeight = isResizingThis ? resizePosition.height : textObject.height;

  // Check if this item is modified compared to original PDF
  const isModifiedFromOriginal =
    textObject.isNew ||
    textObject.isModified ||
    textObject.isDeleted ||
    (hasOriginal && textObject.text !== textObject.originalText) ||
    (hasOriginal &&
      (Math.abs(textObject.x - textObject.originalBounds!.x) > 0.5 ||
        Math.abs(textObject.y - textObject.originalBounds!.y) > 0.5 ||
        textObject.underline ||
        (textObject.rotation !== undefined && textObject.rotation !== 0)));

  // Should the original PDF canvas text be covered with whiteout patch?
  // YES if it has original bounds AND (it's modified, being dragged, being resized, or currently being edited!)
  const shouldCoverOriginal =
    hasOriginal && (isModifiedFromOriginal || !!liveDrag || isResizingThis || isEditing);

  // When should the DOM text be opaque and visible?
  // ONLY when it's modified, dragged, resized, or being edited!
  // When completely UNMODIFIED and just viewed or selected, DOM text is transparent so the user sees ONLY the original sharp canvas text without any doubling or blur!
  const isDomTextVisible =
    !hasOriginal || isModifiedFromOriginal || !!liveDrag || isResizingThis || isEditing;

  // Calculate screen position for original text cover patch (with 2px safety padding)
  const originalScreen = shouldCoverOriginal && textObject.originalBounds
    ? pdfToScreenCoordinates(
        textObject.originalBounds.x,
        textObject.originalBounds.y,
        textObject.originalBounds.width,
        textObject.originalBounds.height,
        pageHeightPt,
        zoom
      )
    : null;

  // Calculate real-time screen position for the active/moving/resizing text
  const currentScreen = pdfToScreenCoordinates(
    currentX,
    currentY,
    currentWidth,
    currentHeight,
    pageHeightPt,
    zoom
  );

  const cssFontFamily = FontManager.getCssFontFamily(textObject.fontFamily);
  const scaledFontSizePx = textObject.fontSize * zoom;
  const rotationAngle = textObject.rotation || 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      onSelect(textObject.id, true);
    } else {
      onSelect(textObject.id, false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartEditing(textObject.id);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    if (e.button !== 0) return; // Left click only

    if (e.shiftKey) {
      onSelect(textObject.id, true);
      return;
    }

    if (!isSelected) {
      onSelect(textObject.id, false);
    }

    onStartDrag(e, textObject, allSelectedObjects, pageWidthPt, pageHeightPt, zoom);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditing) return;
    if (!isSelected) {
      onSelect(textObject.id, false);
    }
    onStartDrag(e, textObject, allSelectedObjects, pageWidthPt, pageHeightPt, zoom);
  };

  return (
    <>
      {/* 1. Cover patch over original PDF text using sampled background color of box/parent */}
      {shouldCoverOriginal && originalScreen && (
        <div
          className="text-item-cover"
          style={{
            left: `${originalScreen.left - 2}px`,
            top: `${originalScreen.top - 2}px`,
            width: `${originalScreen.width + 4}px`,
            height: `${originalScreen.height + 4}px`,
            backgroundColor: (() => {
              if (textObject.backgroundColor) return textObject.backgroundColor;
              try {
                const pageEl = document.getElementById(`page-section-${textObject.pageNumber}`);
                const canvas = pageEl?.querySelector('canvas') as HTMLCanvasElement | null;
                if (canvas && textObject.originalBounds) {
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    const dpr = canvas.width / (pageWidthPt * zoom);
                    const bounds = textObject.originalBounds;
                    const leftPx = Math.max(0, Math.round(bounds.x * zoom * dpr));
                    const topPx = Math.max(
                      0,
                      Math.round((pageHeightPt - (bounds.y + bounds.height)) * zoom * dpr)
                    );
                    const p = ctx.getImageData(Math.max(0, leftPx - 1), Math.max(0, topPx - 1), 1, 1).data;
                    if (p[3] > 30) {
                      return `#${Math.round(p[0]).toString(16).padStart(2, '0')}${Math.round(p[1]).toString(16).padStart(2, '0')}${Math.round(p[2]).toString(16).padStart(2, '0')}`;
                    }
                  }
                }
              } catch {
                // ignore
              }
              return '#ffffff';
            })(),
          }}
        />
      )}

      {/* 2. Active text element (hidden if marked as deleted) */}
      {!textObject.isDeleted && (
        <div
          className={`text-item-wrapper ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''} ${liveDrag ? 'dragging' : ''}`}
          style={{
            left: `${currentScreen.left}px`,
            top: `${currentScreen.top}px`,
            width: `${currentScreen.width}px`,
            minHeight: `${currentScreen.height}px`,
            fontSize: `${scaledFontSizePx}px`,
            fontFamily: cssFontFamily,
            fontWeight: textObject.bold ? 'bold' : 'normal',
            fontStyle: textObject.italic ? 'italic' : 'normal',
            textDecoration: textObject.underline ? 'underline' : 'none',
            transform: rotationAngle !== 0 ? `rotate(${rotationAngle}deg)` : undefined,
            transformOrigin: 'top left',
            // CRITICAL: Text background is always transparent so it blends seamlessly without white box
            color: isDomTextVisible ? textObject.color : 'transparent',
            textAlign: textObject.alignment,
            transition: liveDrag || isResizingThis ? 'none' : 'outline-color 150ms ease',
            backgroundColor: 'transparent',
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {isEditing ? (
            <textarea
              ref={inputRef}
              className="inline-editor"
              value={textObject.text}
              style={{
                fontSize: `${scaledFontSizePx}px`,
                fontFamily: cssFontFamily,
                color: textObject.color,
                fontWeight: textObject.bold ? 'bold' : 'normal',
                fontStyle: textObject.italic ? 'italic' : 'normal',
                textDecoration: textObject.underline ? 'underline' : 'none',
              }}
              onChange={(e) =>
                onUpdateText(
                  { id: textObject.id, text: e.target.value },
                  'Inline text edit'
                )
              }
              onBlur={onStopEditing}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onStopEditing();
                } else if (e.key === 'Escape') {
                  onStopEditing();
                }
              }}
            />
          ) : (
            <div
              className="text-item-content"
              style={{
                whiteSpace: textObject.text.includes('\n') ? 'pre-wrap' : 'pre',
              }}
            >
              {textObject.text}
            </div>
          )}

          {/* Drag Handle, Resize Handles, & Coordinate Badges when selected */}
          {isSelected && !isEditing && (
            <>
              {/* Drag Handle */}
              <div
                className="drag-handle"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartDrag(e, textObject, allSelectedObjects, pageWidthPt, pageHeightPt, zoom);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  onStartDrag(e, textObject, allSelectedObjects, pageWidthPt, pageHeightPt, zoom);
                }}
                title="Drag to move"
              >
                <Move size={12} />
              </div>

              {/* Edge and Corner Resize Handles */}
              <div
                className="resize-handle handle-e"
                onMouseDown={(e) => onStartResize(e, textObject, 'e', zoom)}
                onTouchStart={(e) => onStartResize(e, textObject, 'e', zoom)}
                title="Drag to resize width"
              />
              <div
                className="resize-handle handle-s"
                onMouseDown={(e) => onStartResize(e, textObject, 's', zoom)}
                onTouchStart={(e) => onStartResize(e, textObject, 's', zoom)}
                title="Drag to resize height"
              />
              <div
                className="resize-handle handle-se"
                onMouseDown={(e) => onStartResize(e, textObject, 'se', zoom)}
                onTouchStart={(e) => onStartResize(e, textObject, 'se', zoom)}
                title="Drag to resize box"
              />

              {/* Badges: Rotation and Dimensions/Coordinates */}
              {rotationAngle !== 0 && (
                <div className="rotation-badge">
                  {rotationAngle}°
                </div>
              )}
              <div className="coord-badge">
                {Math.round(currentWidth)}×{Math.round(currentHeight)} pt • ({Math.round(currentX)}, {Math.round(currentY)})
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
