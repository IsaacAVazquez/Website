import type { MissionControlCadence } from "@/types/spacex";
import { DATE_ONLY_TIME_ZONE } from "@/lib/date-formatters";

// The buckets are UTC months, so the day the count stopped is read in UTC too.
const THROUGH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: DATE_ONLY_TIME_ZONE,
});

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
  const lastIndex = cadence.points.length - 1;
  // The newest month is still running, and a series kept from an earlier
  // refresh stops on its own day, so the caption says where the count ends.
  const through = THROUGH_FORMATTER.format(new Date(cadence.generatedAt));
  const countLabel = (index: number) => {
    const point = cadence.points[index];
    return `${point.label}${index === lastIndex ? " to date" : ""}: ${point.count} launch${point.count === 1 ? "" : "es"}`;
  };

  return (
    <div className="sx-cadence max-[760px]:hidden print:hidden">
      <div
        role="img"
        aria-label={`Launches per month, ${cadence.rangeLabel}, counted through ${through}`}
      >
        <div className="flex h-11 items-end" style={{ gap: "var(--c97-sp-0)" }}>
          {cadence.points.map((point, index) => (
            <span
              key={point.monthKey}
              title={countLabel(index)}
              className="w-[9px] "
              style={{
                height: `${Math.max(4, Math.round((point.count / max) * 100))}%`,
                background:
                  index === lastIndex
                    ? "var(--c97-accent)"
                    : "color-mix(in srgb, var(--c97-ink) 20%, var(--c97-surface))",
              }}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between font-mono text-3xs uppercase tracking-[0.1em] text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
          <span>Launches / month</span>
          <span>{`${cadence.rangeLabel}, through ${through}`}</span>
        </div>
      </div>
      {/* The bars' titles are pointer only, so the counts are also a list. */}
      <ul className="sr-only" aria-label="Launches per month">
        {cadence.points.map((point, index) => (
          <li key={point.monthKey}>{countLabel(index)}</li>
        ))}
      </ul>
    </div>
  );
}
