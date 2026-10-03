import { useState, useCallback } from 'react';
import type { TextObject } from '../types/pdf';

export interface UseTextSelectionReturn {
  selectedTextIds: string[];
  selectedTextId: string | null;
  editingTextId: string | null;
  selectedTextObject: TextObject | null;
  selectedTextObjects: TextObject[];
  selectText: (id: string | null, isMulti?: boolean) => void;
  selectAll: (pageNumber?: number) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;
  clearSelection: () => void;
}

export function useTextSelection(textObjects: TextObject[]): UseTextSelectionReturn {
  const [selectedTextIds, setSelectedTextIds] = useState<string[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const selectedTextId = selectedTextIds.length > 0 ? selectedTextIds[0] : null;

  const selectedTextObjects = textObjects.filter(
    (item) => selectedTextIds.includes(item.id) && !item.isDeleted
  );

  const selectedTextObject = selectedTextObjects.length > 0 ? selectedTextObjects[0] : null;

  const selectText = useCallback((id: string | null, isMulti = false) => {
    if (!id) {
      setSelectedTextIds([]);
      setEditingTextId(null);
      return;
    }

    if (isMulti) {
      setSelectedTextIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
      setEditingTextId(null);
    } else {
      setSelectedTextIds([id]);
      setEditingTextId(null);
    }
  }, []);

  const selectAll = useCallback(
    (pageNumber?: number) => {
      const targets = pageNumber
        ? textObjects.filter((t) => t.pageNumber === pageNumber && !t.isDeleted)
        : textObjects.filter((t) => !t.isDeleted);
      setSelectedTextIds(targets.map((t) => t.id));
      setEditingTextId(null);
    },
    [textObjects]
  );

  const startEditing = useCallback((id: string) => {
    setSelectedTextIds([id]);
    setEditingTextId(id);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingTextId(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTextIds([]);
    setEditingTextId(null);
  }, []);

  return {
    selectedTextIds,
    selectedTextId,
    editingTextId,
    selectedTextObject,
    selectedTextObjects,
    selectText,
    selectAll,
    startEditing,
    stopEditing,
    clearSelection,
  };
}
