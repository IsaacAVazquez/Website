"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { useModal } from "@/hooks/useModal";
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

  // A tap on iOS does not focus the trigger, so close hands focus back to it
  // by name rather than relying on whatever was focused at open.
  const close = () => {
    onClose();
    returnFocusRef.current?.focus();
  };
  useModal(dialogRef, open, close, closeRef);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] lg:hidden">
      <button
        type="button"
        className="absolute inset-0 h-full w-full"
        style={{ background: "color-mix(in srgb, var(--c97-ink) 48%, transparent)" }}
        onClick={close}
        tabIndex={-1}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        id="best-ball-build-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="best-ball-mobile-build-heading"
        className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto border border-b-0 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4"
        style={{ borderColor: "var(--c97-rule)", background: "var(--c97-surface)" }}
      >
        <div className="sticky top-0 z-10 mb-3 flex justify-end" style={{ background: "var(--c97-surface)" }}>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            className="inline-flex h-11 w-11 items-center justify-center border"
            style={{ borderColor: "var(--c97-rule)", color: "var(--c97-ink)" }}
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
