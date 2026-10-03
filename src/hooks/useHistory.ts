import { useState, useCallback } from 'react';
import type { TextObject } from '../types/pdf';
import type { HistoryRecord, HistoryActionType } from '../types/editor';
import { EDITOR_CONFIG } from '../constants/config';

export interface UseHistoryReturn {
  history: HistoryRecord[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  pushState: (
    type: HistoryActionType,
    description: string,
    before: TextObject[],
    after: TextObject[]
  ) => void;
  undo: () => TextObject[] | null;
  redo: () => TextObject[] | null;
  resetHistory: (initialState: TextObject[]) => void;
}

export function useHistory(_initialObjects: TextObject[] = []): UseHistoryReturn {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  const pushState = useCallback(
    (
      type: HistoryActionType,
      description: string,
      before: TextObject[],
      after: TextObject[]
    ) => {
      setHistory((prev) => {
        // Discard any redone future states
        const truncated = prev.slice(0, historyIndex + 1);
        const record: HistoryRecord = {
          type,
          description,
          timestamp: Date.now(),
          before,
          after,
        };
        const next = [...truncated, record];
        if (next.length > EDITOR_CONFIG.history.maxRecords) {
          next.shift();
        }
        return next;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, EDITOR_CONFIG.history.maxRecords - 1));
    },
    [historyIndex]
  );

  const undo = useCallback((): TextObject[] | null => {
    if (!canUndo) return null;
    const currentRecord = history[historyIndex];
    setHistoryIndex((prev) => prev - 1);
    return currentRecord.before;
  }, [canUndo, history, historyIndex]);

  const redo = useCallback((): TextObject[] | null => {
    if (!canRedo) return null;
    const nextRecord = history[historyIndex + 1];
    setHistoryIndex((prev) => prev + 1);
    return nextRecord.after;
  }, [canRedo, history, historyIndex]);

  const resetHistory = useCallback((_initialState: TextObject[]) => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  return {
    history,
    historyIndex,
    canUndo,
    canRedo,
    pushState,
    undo,
    redo,
    resetHistory,
  };
}
