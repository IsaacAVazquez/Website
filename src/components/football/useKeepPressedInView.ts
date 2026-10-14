import { useEffect, type RefObject } from "react";

/** A pill's focus ring is 2px wide at a 3px offset, so it needs 5px on each side. */
const RING_ROOM = 5;

/** Centres `pill` in `row` unless it already sits inside the row with room for its focus ring. */
function centreInRow(row: HTMLElement, pill: HTMLElement): void {
  const rowBox = row.getBoundingClientRect();
  const box = pill.getBoundingClientRect();
  if (box.left >= rowBox.left + RING_ROOM && box.right <= rowBox.right - RING_ROOM) return;
  row.scrollLeft = Math.max(0, row.scrollLeft + box.left + box.width / 2 - (rowBox.left + rowBox.width / 2));
}

/**
 * A board's view switch scrolls sideways in one row on a phone, so a shared
 * link, a reload, or Back can open it with the pressed pill off screen. This
 * centres that pill whenever the pressed one changes and is not fully in
 * view, and does the same for a pill that takes keyboard focus, which
 * Chromium leaves where it is once 32px of it shows. It moves the row's own
 * scroll and never the page, which `scrollIntoView` can.
 */
export function useKeepPressedInView(rowRef: RefObject<HTMLElement | null>, activeId: string): void {
  useEffect(() => {
    const row = rowRef.current;
    const pressed = row?.querySelector<HTMLElement>('[aria-pressed="true"], [aria-selected="true"]');
    if (row && pressed) centreInRow(row, pressed);
  }, [rowRef, activeId]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    // A pointer press is left alone, since moving the pill out from under the pointer loses the click.
    const onFocus = (event: FocusEvent) => {
      const pill = event.target;
      if (pill instanceof HTMLElement && pill !== row && pill.matches(":focus-visible")) centreInRow(row, pill);
    };
    row.addEventListener("focusin", onFocus);
    return () => row.removeEventListener("focusin", onFocus);
  }, [rowRef]);
}
