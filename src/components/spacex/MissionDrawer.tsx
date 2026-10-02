"use client";

import { useRef } from "react";
import { useModal } from "@/hooks/useModal";
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
 * `PlayerDetailDrawer`: a CSS entrance from `@starting-style`, a focus trap, Escape/backdrop close, and body-scroll lock while open. Adds
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
  const panelRef = useRef<HTMLDivElement>(null);
  const isOpen = Boolean(launchId);
  useModal(panelRef, isOpen, onClose, { resetKey: launchId });

  const status = detail ? deriveMissionCardStatus(detail) : null;
  const accent = status ? MISSION_STATUS_ACCENT_VAR[status] : "var(--c97-accent)";

  return (
    <>
      {isOpen ? (
        <div className="c97-enter-fade fixed inset-0 z-[60] flex justify-end">
          <button
            type="button"
            aria-label="Close mission detail"
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default"
            style={{ background: "color-mix(in srgb, var(--c97-ink) 34%, transparent)" }}
            tabIndex={-1}
          />
          <aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={detail ? `${detail.name} detail` : "Mission detail"}
            tabIndex={-1}
            data-testid="mission-detail-panel"
            data-c97-surface="paper"
            className="c97-enter-slide-x relative flex h-full w-full max-w-[30rem] flex-col overflow-y-auto border-l border-[var(--c97-rule)] bg-[var(--c97-surface)] outline-none"
          >
            <div className="relative border-b border-[var(--c97-rule)] px-5 pb-4.5 pt-6">
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ background: accent }}
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close mission detail"
                className="tap-target absolute right-3 top-3 shrink-0 border border-[var(--c97-rule)] bg-[var(--c97-surface)] text-[var(--c97-ink-2)] transition hover:border-[color-mix(in_srgb,var(--c97-ink)_30%,var(--c97-rule))] hover:text-[var(--c97-ink)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>

              {detail ? (
                <div className="flex items-center gap-4 pr-10">
                  <div
                    className="h-[74px] w-[74px] shrink-0 overflow-hidden border border-[var(--c97-rule)]"
                    style={{ background: "var(--c97-field)" }}
                  >
                    <MissionPatchEmblem seed={detail.id} accent={accent} className="h-full w-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-3xs uppercase tracking-[0.1em] text-[var(--c97-ink-2)]">
                      Flight #{detail.flightNumber} · {detail.launchpadName ?? "Pad TBD"}
                    </p>
                    <h2 className="c97-serif c97-h3 truncate" style={{ marginTop: "var(--c97-sp-1)" }}>
                      {detail.name}
                    </h2>
                    {status ? (
                      <span
                        className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-3xs uppercase tracking-[0.08em]"
                        style={{ color: accent }}
                      >
                        <span aria-hidden="true" className="h-1.5 w-1.5 bg-current" />
                        {MISSION_STATUS_LABEL[status]}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="pr-10 text-sm text-[var(--c97-ink-2)]">
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
            />

            {detail ? (
              <div className="border-t border-[color-mix(in_srgb,var(--c97-rule)_55%,transparent)] px-5 py-4">
                <h3 className="mb-3.5 font-mono text-3xs font-semibold uppercase tracking-[0.12em] text-[var(--c97-ink-2)]">
                  T-0 sequence
                </h3>
                <MissionSequenceTimeline rocketName={detail.rocketName} upcoming={detail.upcoming} />
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}
