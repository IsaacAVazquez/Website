import { useEffect, useRef, type RefObject } from "react";

export const MODAL_FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [role="tab"], [tabindex]:not([tabindex="-1"])';

/**
 * Modal behavior for a panel that stays a plain element rather than a native
 * `<dialog>`, so the caller controls mount, focus, and scroll. While `open`, focus
 * moves into the panel (or `initialFocusRef`), Tab and Shift+Tab wrap inside
 * it, Escape calls `onClose`, and the page behind stops scrolling unless
 * `lockScroll` is false. On close, focus goes back to whatever opened it, unless
 * the caller already moved it somewhere outside the panel. A change to
 * `resetKey` while open (a different club or launch in the same drawer) restarts
 * the trap, so focus moves into the new content.
 *
 * `onClose` is read through a ref, so a parent that passes a fresh arrow on
 * every render does not restart the trap and throw focus back to the panel.
 */
export function useModal(
  panelRef: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
  {
    initialFocusRef,
    lockScroll = true,
    resetKey,
  }: { initialFocusRef?: RefObject<HTMLElement | null>; lockScroll?: boolean; resetKey?: unknown } = {},
) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    // An SVG button (a ladder chart marker) is an SVGElement, and it has to get focus back too.
    const active = document.activeElement;
    const opener = active instanceof HTMLElement || active instanceof SVGElement ? active : null;
    const openedPanel = panelRef.current;
    (initialFocusRef?.current ?? openedPanel)?.focus();
    const previousOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      const panel = panelRef.current;
      if (event.key !== "Tab" || !panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      // Focus on the panel itself, or somewhere outside it, wraps from either end.
      const loose = !active || active === panel || !panel.contains(active);

      if (event.shiftKey && (loose || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (loose || active === last)) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (lockScroll) document.body.style.overflow = previousOverflow;
      const current = document.activeElement;
      const focusIsLoose = !current || current === document.body || Boolean(openedPanel?.contains(current));
      if (focusIsLoose && opener && opener !== document.body && document.contains(opener)) opener.focus();
    };
  }, [open, panelRef, initialFocusRef, lockScroll, resetKey]);
}
