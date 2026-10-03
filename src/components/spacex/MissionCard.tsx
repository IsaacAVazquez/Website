"use client";

import { ChevronRight, LoaderCircle } from "lucide-react";
import type { MissionLaunchCard } from "@/types/spacex";
import { MissionPatchEmblem } from "./MissionPatchEmblem";
import { deriveMissionCardStatus, MISSION_STATUS_ACCENT_VAR, MISSION_STATUS_LABEL } from "./missionEmblem";
import { formatMissionScheduleLabel } from "./formatters";

interface MissionCardProps {
  launch: MissionLaunchCard;
  isSelected: boolean;
  isBusy: boolean;
  onSelect: (id: string) => void;
}

/**
 * One tile in the filterable mission grid: an original generated patch
 * emblem, a status badge, and a fused 2x2 meta grid built from the fields
 * `MissionLaunchCard` actually carries (rocket, launchpad, payload count,
 * core count) — orbit/booster/recovery detail lives only on the per-launch
 * detail record and isn't fetched for every card, so this doesn't fabricate
 * those fields at the card level.
 */
export function MissionCard({ launch, isSelected, isBusy, onSelect }: MissionCardProps) {
  const status = deriveMissionCardStatus(launch);
  const accent = MISSION_STATUS_ACCENT_VAR[status];

  const metaCells = [
    { key: "Launchpad", value: launch.launchpadName ?? "Pending" },
    { key: "Location", value: launch.launchpadLocation ?? "Pending" },
    { key: "Payloads", value: `${launch.payloadCount}` },
    { key: "Cores", value: `${launch.coreCount}` },
  ];

  return (
    <button
      type="button"
      onClick={() => onSelect(launch.id)}
      aria-label={`${launch.name} detail`}
      data-testid={`mission-card-${launch.id}`}
      className={`flex flex-col overflow-hidden border bg-[var(--c97-surface)] text-left transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 ${
        isSelected
          ? "border-[var(--c97-accent)]"
          : "border-[var(--c97-rule)] hover:border-[color-mix(in_srgb,var(--c97-ink)_20%,var(--c97-rule))]"
      }`}
    >
      <div className="flex items-start justify-between" style={{ paddingInline: "var(--c97-sp-2)", paddingTop: "var(--c97-sp-2)", paddingBottom: "var(--c97-sp-0)", gap: "var(--c97-sp-1)" }}>
        <div
          data-testid={`mission-board-visual-${launch.id}`}
          className="grid h-[62px] w-[62px] shrink-0 place-items-center overflow-hidden border border-[var(--c97-rule)]"
          style={{ background: "var(--c97-field)" }}
        >
          <MissionPatchEmblem seed={launch.id} accent={accent} className="h-full w-full" />
        </div>
        <span
          className="inline-flex shrink-0 items-center font-mono text-3xs uppercase tracking-[0.08em]"
          style={{ color: accent, gap: "var(--c97-sp-0)", paddingTop: "var(--c97-sp-0)" }}
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 bg-current" />
          {MISSION_STATUS_LABEL[status]}
        </span>
      </div>

      <div className="flex flex-col border-b border-[color-mix(in_srgb,var(--c97-rule)_55%,transparent)]" style={{ paddingInline: "var(--c97-sp-2)", paddingTop: "var(--c97-sp-1)", paddingBottom: "var(--c97-sp-2)", gap: "var(--c97-sp-0)" }}>
        <span className="font-mono text-3xs uppercase tracking-[0.1em] text-[var(--c97-ink-2)]">
          Flight #{launch.flightNumber} · {launch.rocketName ?? "Rocket TBD"}
        </span>
        <h4 className="c97-serif c97-h3">
          {launch.name}
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-px bg-[color-mix(in_srgb,var(--c97-rule)_55%,transparent)]">
        {metaCells.map((cell) => (
          <div key={cell.key} className="min-w-0 bg-[var(--c97-surface)]" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)" }}>
            <div className="font-mono text-3xs uppercase tracking-[0.1em] text-[var(--c97-ink-2)]">
              {cell.key}
            </div>
            <div className="truncate text-sm font-semibold tabular-nums text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-0)" }}>
              {cell.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between font-mono text-3xs text-[var(--c97-ink-2)]" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
        <span className="truncate">{formatMissionScheduleLabel(launch)}</span>
        <span className="inline-flex shrink-0 items-center text-[var(--c97-ink)]" style={{ gap: "var(--c97-sp-0)" }}>
          {launch.upcoming ? "Preview" : "Debrief"}
          {isBusy && isSelected ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </span>
      </div>
    </button>
  );
}
