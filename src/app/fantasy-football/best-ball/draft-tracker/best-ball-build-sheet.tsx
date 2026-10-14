"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { useModal } from "@/hooks/useModal";
import { X } from "lucide-react";

/**
 * The build sheet: the rail's content as a bottom sheet, for every width where
 * the rail is not beside the list (below 1200px). It mounts only while open,
 * so the build panel is in the page once.
 */
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
  // by name and does not rely on whatever was focused at open.
  const close = () => {
    onClose();
    returnFocusRef.current?.focus();
  };
  useModal(dialogRef, open, close, { initialFocusRef: closeRef });

  if (!open) return null;

  return (
    <div className="ffb-overlay ffb-overlay-sheet ffb-enter-fade min-[1200px]:hidden">
      <button type="button" className="ffb-scrim" onClick={close} tabIndex={-1} aria-hidden="true" />
      <div
        ref={dialogRef}
        id="best-ball-build-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="best-ball-mobile-build-heading"
        className="ffb-sheet ffb-enter-rise"
      >
        <div className="ffb-panel-head ffb-br-sheet-head">
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            className="ffb-iconbtn ffb-iconbtn-edge"
            aria-label="Close my build"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="ffb-panel-body ffb-br-sheet-body">{children}</div>
      </div>
    </div>
  );
}
