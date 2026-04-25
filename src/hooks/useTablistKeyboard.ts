"use client";

import { useCallback, type KeyboardEvent } from "react";

/**
 * Manages roving keyboard navigation for a horizontal tablist (WCAG 2.1).
 * Returns an onKeyDown handler — bind it to each tab button and pass the
 * tab's index. ArrowLeft/Right wrap; Home/End jump to ends; Enter/Space
 * activate the focused tab (callers should also keep their onClick handlers).
 */
export function useTablistKeyboard<T>(
  items: ReadonlyArray<T>,
  getKey: (item: T) => string,
  onSelect: (item: T) => void,
) {
  return useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const last = items.length - 1;
      let nextIndex: number | null = null;

      switch (event.key) {
        case "ArrowRight":
          nextIndex = index === last ? 0 : index + 1;
          break;
        case "ArrowLeft":
          nextIndex = index === 0 ? last : index - 1;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = last;
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          onSelect(items[index]);
          return;
        default:
          return;
      }

      event.preventDefault();
      const target = event.currentTarget;
      const list = target.closest('[role="tablist"]');
      if (!list || nextIndex === null) return;
      const next = list.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex];
      if (next) {
        next.focus();
        onSelect(items[nextIndex]);
      }
    },
    [items, getKey, onSelect],
  );
}
