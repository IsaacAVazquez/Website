"use client";

import { InstrumentTape, type InstrumentTapeItem } from "@/components/editorial/InstrumentTape";
import type { MissionLaunchCard } from "@/types/spacex";
import { deriveVehicleFamily, VEHICLE_SHORT_CODE } from "@/lib/spacexVehicleFamily";
import { DISPLAY_TIME_ZONE, formatStableDateTime } from "@/lib/date-formatters";

// launch.dateUtc is a real instant and this shows a clock time, so it's
// pinned to the display zone and names it, since the compact tape entry
// doesn't otherwise say which zone.
const SCHEDULE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: DISPLAY_TIME_ZONE,
  timeZoneName: "short",
});

function shortCode(rocketName: string | null): string {
  return VEHICLE_SHORT_CODE[deriveVehicleFamily(rocketName)];
}

interface MissionLaunchTapeProps {
  /** Past launches, most-recent-first; only entries with a known outcome are shown. */
  recentLaunches: MissionLaunchCard[];
  /** Upcoming launches, soonest-first. */
  upcomingLaunches: MissionLaunchCard[];
}

/**
 * Sticky-free launch ticker: recent outcomes (OK in positive, FAIL in
 * negative) followed by upcoming windows, in one horizontal mono strip. The
 * launch-dialect version of the investments quote tape, built on the shared
 * InstrumentTape primitive.
 */
export function MissionLaunchTape({ recentLaunches, upcomingLaunches }: MissionLaunchTapeProps) {
  const results = recentLaunches.filter((launch) => launch.success !== null).slice(0, 8);
  const upcoming = upcomingLaunches.slice(0, 4);
  const latestFlightNumber = results[0]?.flightNumber ?? null;

  const items: InstrumentTapeItem[] = [
    ...results.map((launch) => ({
      key: `result-${launch.id}`,
      content: (
        <>
          <span className="font-medium text-[var(--c97-ink)]">{launch.name}</span>
          <span className="text-3xs uppercase tracking-[0.06em] text-[var(--c97-ink-2)]">
            {shortCode(launch.rocketName)}
          </span>
          <span
            className="inline-flex items-center text-3xs font-semibold uppercase tracking-[0.08em]"
            style={{ color: launch.success ? "var(--c97-positive)" : "var(--c97-negative)", gap: "var(--c97-sp-0)" }}
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 bg-current" />
            {launch.success ? "OK" : "Fail"}
          </span>
        </>
      ),
    })),
    ...upcoming.map((launch) => ({
      key: `upcoming-${launch.id}`,
      content: (
        <>
          <span className="text-[var(--c97-ink-2)]">{launch.name}</span>
          <span className="text-3xs uppercase tracking-[0.06em] text-[var(--c97-ink-2)]">
            {shortCode(launch.rocketName)}
          </span>
          <span className="text-3xs text-[color-mix(in_srgb,var(--c97-ink-2)_72%,var(--c97-ink))]">
            {launch.hasExactTime ? formatStableDateTime(SCHEDULE_FORMATTER, new Date(launch.dateUtc)) : "TBD"}
          </span>
        </>
      ),
    })),
  ];

  return (
    <section
      aria-label="Launch tape"
      className="overflow-hidden border border-[var(--c97-rule)] bg-[color-mix(in_srgb,var(--c97-field)_62%,var(--c97-surface))]"
      // InstrumentTape takes no style prop and its band has no padding or fill of its own, so the inset sits here.
      style={{ paddingInline: "var(--c97-sp-1)" }}
    >
      <InstrumentTape
        ariaLabel="Recent launch outcomes and upcoming launch windows"
        label={
          <span className="inline-flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
            <span aria-hidden="true" className="h-1.5 w-1.5 bg-[var(--c97-accent)]" />
            {latestFlightNumber ? `Latest · Flight ${latestFlightNumber}` : "Launch tape"}
          </span>
        }
        items={items}
        emptyFallback={
          <p className="text-sm text-[var(--c97-ink-2)]" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-2)" }}>
            No recent outcomes or upcoming windows are available from the current snapshot.
          </p>
        }
      />
    </section>
  );
}
