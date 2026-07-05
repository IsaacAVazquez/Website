"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { MissionControlPanel, MissionLaunchDetail } from "@/types/spacex";
import { MissionDetailPanel } from "./MissionDetailPanel";
import { MissionPatchEmblem } from "./MissionPatchEmblem";
import { MissionSequenceTimeline } from "./MissionSequenceTimeline";
import { deriveMissionCardStatus, MISSION_STATUS_ACCENT_VAR, MISSION_STATUS_LABEL } from "./missionEmblem";

interface MissionDrawerProps {
  /** The currently deep-linked launch id — the drawer is open whenever this is set. */
  launchId: string | null;
  detail: MissionLaunchDetail | null;
  activePanel: MissionControlPanel;
  isLoading: boolean;
  error: string | null;
  onPanelChange: (panel: MissionControlPanel) => void;
  onClose: () => void;
}

/**
 * The mission drill-down as a right-slide overlay drawer, converted from the
 * previous always-docked side panel. Follows the same shape as
 * `PlayerDetailDrawer`: Framer Motion entrance gated by `useReducedMotion`,
 * a focus trap, Escape/backdrop close, and body-scroll lock while open. Adds
 * the identity header (patch, name, badge) and the T-0 sequence timeline;
 * the Overview/Vehicle/Payloads/Links tab body is delegated to
 * `MissionDetailPanel` (unchanged) so its tested behavior carries over.
 */
export function MissionDrawer({
  launchId,
  detail,
  activePanel,
  isLoading,
  error,
  onPanelChange,
  onClose,
}: MissionDrawerProps) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const isOpen = Boolean(launchId);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panel) {
        return;
      }

      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [role="tab"], textarea, input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen, launchId, onClose]);

  const status = detail ? deriveMissionCardStatus(detail) : null;
  const accent = status ? MISSION_STATUS_ACCENT_VAR[status] : "var(--home-signal)";

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[60] flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
          <button
            type="button"
            aria-label="Close mission detail"
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default"
            style={{ background: "color-mix(in srgb, var(--home-ink) 34%, transparent)" }}
            tabIndex={-1}
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={detail ? `${detail.name} detail` : "Mission detail"}
            tabIndex={-1}
            data-testid="mission-detail-panel"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 28 }}
            transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex h-full w-full max-w-[30rem] flex-col overflow-y-auto border-l border-[var(--home-rule)] bg-[var(--home-paper)] shadow-[var(--shadow-xl)] outline-none"
          >
            <div className="relative border-b border-[var(--home-rule)] px-5 pb-4.5 pt-6">
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ background: accent }}
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close mission detail"
                className="tap-target absolute right-3 top-3 shrink-0 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] text-[var(--home-ink-muted)] transition hover:border-[color-mix(in_srgb,var(--home-ink)_30%,var(--home-rule))] hover:text-[var(--home-ink)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>

              {detail ? (
                <div className="flex items-center gap-4 pr-10">
                  <div
                    className="h-[74px] w-[74px] shrink-0 overflow-hidden rounded-full border border-[var(--home-rule)]"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--home-paper-alt) 70%, var(--home-elev-mix)), var(--home-paper-alt))",
                    }}
                  >
                    <MissionPatchEmblem seed={detail.id} accent={accent} className="h-full w-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-3xs uppercase tracking-[0.1em] text-[var(--home-ink-muted)]">
                      Flight #{detail.flightNumber} · {detail.launchpadName ?? "Pad TBD"}
                    </p>
                    <h2 className="mt-1 truncate text-xl font-bold tracking-[-0.02em] text-[var(--home-ink)]">
                      {detail.name}
                    </h2>
                    {status ? (
                      <span
                        className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-3xs uppercase tracking-[0.08em]"
                        style={{ color: accent }}
                      >
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                        {MISSION_STATUS_LABEL[status]}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="pr-10 text-sm text-[var(--home-ink-muted)]">
                  {error ? "Mission detail unavailable." : "Loading mission detail…"}
                </p>
              )}
            </div>

            <MissionDetailPanel
              launch={detail}
              activePanel={activePanel}
              isLoading={isLoading}
              error={error}
              onPanelChange={onPanelChange}
              hideHeader
            />

            {detail ? (
              <div className="border-t border-[color-mix(in_srgb,var(--home-rule)_55%,transparent)] px-5 py-4">
                <h3 className="mb-3.5 font-mono text-3xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                  T-0 sequence
                </h3>
                <MissionSequenceTimeline rocketName={detail.rocketName} upcoming={detail.upcoming} />
              </div>
            ) : null}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
