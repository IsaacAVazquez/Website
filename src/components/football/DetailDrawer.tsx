"use client";

import { X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { useModal } from "@/hooks/useModal";
import "./detail-drawer.css";

/**
 * The named drawer a selected team or player opens in on the golf, MLB, NBA,
 * and NFL routes, so the result of a tap shows in the current view. It is the
 * same overlay as `ClubDrawer` (a sheet from the bottom on a phone and a side
 * panel from 640px, `role="dialog"`, with focus, Escape, scroll lock, and the
 * return of focus to the opener all from `useModal`), with the body left to
 * the route because the four detail shapes share nothing past a name. It sets
 * no surface of its own, so it prints in the palette of the route root it is
 * rendered inside.
 */
export function DetailDrawer({
  open,
  title,
  lead,
  onClose,
  resetKey,
  testId,
  children,
}: {
  open: boolean;
  /** The team or player name. It prints as the heading and names the dialog. */
  title: string;
  /** A crest or other mark set ahead of the heading. */
  lead?: ReactNode;
  onClose: () => void;
  /** The selected id, so a new selection in an open drawer takes focus again. */
  resetKey?: unknown;
  /** Optional `data-testid` on the drawer panel, for e2e coverage. */
  testId?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useModal(panelRef, open, onClose, { resetKey });

  if (!open) return null;

  return (
    <div className="dd-overlay c97-enter-fade">
      <button
        type="button"
        aria-label={`Close ${title} detail`}
        onClick={onClose}
        className="dd-backdrop"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} detail`}
        data-testid={testId}
        tabIndex={-1}
        className="dd-panel c97-enter-slide-x"
      >
        <div className="dd-head">
          {lead}
          <h2 className="dd-title">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="dd-close">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
