"use client";

import { X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { useModal } from "@/hooks/useModal";

/**
 * The named drawer a selected team or player opens in on the golf, MLB, NBA,
 * and NFL routes, so the result of a tap shows in the current view. It is the
 * same overlay as `ClubDrawer` (a sheet from the bottom on a phone and a side
 * panel from `sm`, `role="dialog"`, with focus, Escape, scroll lock, and the
 * return of focus to the opener all from `useModal`), with the body left to
 * the route because the four detail shapes share nothing past a name.
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
    <div className="c97-enter-fade fixed inset-0 z-[var(--c97-z-drawer)] flex items-end justify-center sm:items-stretch sm:justify-end">
      <button
        type="button"
        aria-label={`Close ${title} detail`}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
        style={{ background: "color-mix(in srgb, var(--c97-ink) 34%, transparent)" }}
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} detail`}
        data-testid={testId}
        data-c97-surface="paper"
        tabIndex={-1}
        className="c97-enter-slide-x relative max-h-[88dvh] w-full overflow-y-auto border outline-none sm:h-full sm:max-h-none sm:w-[27rem]"
        style={{ borderColor: "var(--c97-rule)", padding: "var(--c97-sp-3)" }}
      >
        <div className="flex items-start" style={{ gap: "var(--c97-sp-2)" }}>
          {lead}
          <h2 className="c97-serif c97-h3 min-w-0 flex-1">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center border text-[var(--c97-ink-2)] transition-colors hover:text-[var(--c97-ink)]"
            style={{ borderColor: "var(--c97-rule)", background: "var(--c97-surface)" }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
