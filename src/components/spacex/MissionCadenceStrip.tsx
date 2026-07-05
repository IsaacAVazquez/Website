import type { MissionControlCadence } from "@/types/spacex";

interface MissionCadenceStripProps {
  cadence: MissionControlCadence | null;
}

/**
 * Launch cadence pulse — launches per month, trailing 12, newest bar in
 * signal. Optional: renders nothing when the snapshot hasn't computed a
 * cadence series yet (e.g. a refresh that hit the wider historical fetch's
 * rate limit), matching the fail-soft snapshot convention rather than
 * showing a chart full of zeros. Hidden below the point the mirror's own
 * design drops it (narrow viewports have no room for a 12-bar chart next to
 * the page head).
 */
export function MissionCadenceStrip({ cadence }: MissionCadenceStripProps) {
  if (!cadence || cadence.points.length === 0) {
    return null;
  }

  const max = Math.max(1, ...cadence.points.map((point) => point.count));

  return (
    <div className="hidden min-[761px]:block" aria-label="Launches per month">
      <div className="flex h-11 items-end gap-[3px]">
        {cadence.points.map((point, index) => (
          <span
            key={point.monthKey}
            title={`${point.label}: ${point.count} launch${point.count === 1 ? "" : "es"}`}
            className="w-[9px] rounded-t-[1px]"
            style={{
              height: `${Math.max(4, Math.round((point.count / max) * 100))}%`,
              background:
                index === cadence.points.length - 1
                  ? "var(--home-signal)"
                  : "color-mix(in srgb, var(--home-ink) 20%, var(--home-paper))",
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 font-mono text-3xs uppercase tracking-[0.1em] text-[var(--home-ink-muted)]">
        <span>Launches / month</span>
        <span>{cadence.rangeLabel}</span>
      </div>
    </div>
  );
}
