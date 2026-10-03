import { useState, useCallback, useRef } from 'react';
import type { TextObject } from '../types/pdf';
import { clampPdfBounds } from '../utils/coordinates';

export interface DragPositionItem {
  id: string;
  x: number;
  y: number;
}

export type DragPositionsMap = Record<string, { x: number; y: number }>;

interface DragState {
  isDragging: boolean;
  objectId: string | null;
  pageHeightPt: number;
  pageWidthPt: number;
  zoom: number;
}

interface UseDraggableTextProps {
  onDragEnd: (updatedObjects: TextObject[]) => void;
}

export function useDraggableText({ onDragEnd }: UseDraggableTextProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    objectId: null,
    pageHeightPt: 0,
    pageWidthPt: 0,
    zoom: 1,
  });

  const [dragPositions, setDragPositions] = useState<DragPositionsMap>({});
  const activeTargetsRef = useRef<TextObject[]>([]);
  const startMouseRef = useRef<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 });
  const initialPositionsRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});

  const startDrag = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
      target: TextObject,
      allSelectedTargets: TextObject[],
      pageWidthPt: number,
      pageHeightPt: number,
      zoom: number
    ) => {
      e.stopPropagation();

      const isTouch = 'touches' in e;
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;

      // If clicked target is part of multi-selection, drag all selected items together
      const targetsToDrag =
        allSelectedTargets.length > 1 && allSelectedTargets.some((t) => t.id === target.id)
          ? allSelectedTargets
          : [target];

      activeTargetsRef.current = targetsToDrag.map((t) => ({ ...t }));
      startMouseRef.current = { clientX, clientY };

      const initMap: Record<string, { x: number; y: number; width: number; height: number }> = {};
      const posMap: DragPositionsMap = {};

      for (const t of targetsToDrag) {
        initMap[t.id] = { x: t.x, y: t.y, width: t.width, height: t.height };
        posMap[t.id] = { x: t.x, y: t.y };
      }

      initialPositionsRef.current = initMap;

      setDragState({
        isDragging: true,
        objectId: target.id,
        pageWidthPt,
        pageHeightPt,
        zoom,
      });

      setDragPositions(posMap);

      const handlePointerMove = (moveEvent: MouseEvent | TouchEvent) => {
        if (activeTargetsRef.current.length === 0) return;

        const curX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
        const curY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

        const deltaX = curX - startMouseRef.current.clientX;
        const deltaY = curY - startMouseRef.current.clientY;

        const deltaPdfX = deltaX / zoom;
        const deltaPdfY = -(deltaY / zoom);

        const nextPositions: DragPositionsMap = {};
        const updatedList: TextObject[] = [];

        for (const t of activeTargetsRef.current) {
          const init = initialPositionsRef.current[t.id];
          if (!init) continue;

          const newX = Math.round((init.x + deltaPdfX) * 10) / 10;
          const newY = Math.round((init.y + deltaPdfY) * 10) / 10;

          const clamped = clampPdfBounds(
            {
              x: newX,
              y: newY,
              width: init.width,
              height: init.height,
            },
            pageWidthPt,
            pageHeightPt
          );

          nextPositions[t.id] = { x: clamped.x, y: clamped.y };
          updatedList.push({
            ...t,
            x: clamped.x,
            y: clamped.y,
            isModified: true,
          });
        }

        activeTargetsRef.current = updatedList;
        setDragPositions(nextPositions);
      };

      const handlePointerUp = () => {
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
        window.removeEventListener('touchmove', handlePointerMove);
        window.removeEventListener('touchend', handlePointerUp);
        window.removeEventListener('touchcancel', handlePointerUp);

        if (activeTargetsRef.current.length > 0) {
          onDragEnd(activeTargetsRef.current);
        }

        setDragState((prev) => ({ ...prev, isDragging: false, objectId: null }));
        setDragPositions({});
        activeTargetsRef.current = [];
      };

      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
      window.addEventListener('touchcancel', handlePointerUp);
    },
    [onDragEnd]
  );

  return {
    isDragging: dragState.isDragging,
    draggedObjectId: dragState.objectId,
    dragPositions,
    startDrag,
  };
}
