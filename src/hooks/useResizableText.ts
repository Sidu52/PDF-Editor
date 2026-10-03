import { useState, useCallback, useRef } from 'react';
import type { TextObject } from '../types/pdf';
import { EDITOR_CONFIG } from '../constants/config';

export type ResizeHandleDirection = 'e' | 's' | 'se';

export interface ResizePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseResizableTextProps {
  onResizeEnd: (updatedObject: TextObject) => void;
}

export function useResizableText({ onResizeEnd }: UseResizableTextProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizePosition, setResizePosition] = useState<ResizePosition | null>(null);

  const activeTargetRef = useRef<TextObject | null>(null);
  const startMouseRef = useRef<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 });
  const initialBoxRef = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const startResize = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
      target: TextObject,
      direction: ResizeHandleDirection,
      zoom: number
    ) => {
      e.stopPropagation();
      if ('preventDefault' in e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }

      const isTouch = 'touches' in e;
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;

      activeTargetRef.current = { ...target };
      startMouseRef.current = { clientX, clientY };
      initialBoxRef.current = {
        x: target.x,
        y: target.y,
        width: target.width,
        height: target.height,
      };

      setIsResizing(true);
      setResizePosition({
        id: target.id,
        x: target.x,
        y: target.y,
        width: target.width,
        height: target.height,
      });

      const handlePointerMove = (moveEvent: MouseEvent | TouchEvent) => {
        if (!activeTargetRef.current) return;

        const curX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
        const curY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

        const deltaScreenX = curX - startMouseRef.current.clientX;
        const deltaScreenY = curY - startMouseRef.current.clientY;

        const deltaWidthPt = deltaScreenX / zoom;
        const deltaHeightPt = deltaScreenY / zoom;

        let newWidth = initialBoxRef.current.width;
        let newHeight = initialBoxRef.current.height;
        let newY = initialBoxRef.current.y;

        if (direction === 'e' || direction === 'se') {
          newWidth = Math.max(
            EDITOR_CONFIG.resize.minWidthPt,
            Math.round((initialBoxRef.current.width + deltaWidthPt) * 10) / 10
          );
        }

        if (direction === 's' || direction === 'se') {
          newHeight = Math.max(
            EDITOR_CONFIG.resize.minHeightPt,
            Math.round((initialBoxRef.current.height + deltaHeightPt) * 10) / 10
          );
          // In PDF coordinates, top of box is (y + height). Moving bottom down reduces y
          newY = Math.round((initialBoxRef.current.y - (newHeight - initialBoxRef.current.height)) * 10) / 10;
        }

        activeTargetRef.current = {
          ...activeTargetRef.current,
          x: initialBoxRef.current.x,
          y: newY,
          width: newWidth,
          height: newHeight,
          isModified: true,
        };

        setResizePosition({
          id: target.id,
          x: initialBoxRef.current.x,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      };

      const handlePointerUp = () => {
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
        window.removeEventListener('touchmove', handlePointerMove);
        window.removeEventListener('touchend', handlePointerUp);
        window.removeEventListener('touchcancel', handlePointerUp);

        if (activeTargetRef.current) {
          onResizeEnd(activeTargetRef.current);
        }

        setIsResizing(false);
        setResizePosition(null);
        activeTargetRef.current = null;
      };

      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
      window.addEventListener('touchcancel', handlePointerUp);
    },
    [onResizeEnd]
  );

  return {
    isResizing,
    resizePosition,
    startResize,
  };
}
