"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";

export function BestBallBuildSheet({
  open,
  onClose,
  returnFocusRef,
  children,
}: {
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        returnFocusRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open, returnFocusRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] lg:hidden">
      <button
        type="button"
        className="absolute inset-0 h-full w-full"
        style={{ background: "color-mix(in srgb, var(--home-ink) 48%, transparent)" }}
        onClick={() => {
          onClose();
          returnFocusRef.current?.focus();
        }}
        tabIndex={-1}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        id="best-ball-build-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="best-ball-mobile-build-heading"
        className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[var(--radius-3xl)] border border-b-0 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 shadow-[var(--shadow-xl)]"
        style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}
      >
        <div className="sticky top-0 z-10 mb-3 flex justify-end" style={{ background: "var(--home-paper)" }}>
          <button
            ref={closeRef}
            type="button"
            onClick={() => {
              onClose();
              returnFocusRef.current?.focus();
            }}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border"
            style={{ borderColor: "var(--home-rule)", color: "var(--home-ink)" }}
            aria-label="Close my build"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
