"use client";

import { InstrumentTape, type InstrumentTapeItem } from "@/components/editorial";
import type { MissionLaunchCard } from "@/types/spacex";
import { deriveVehicleFamily, VEHICLE_SHORT_CODE } from "@/lib/spacexVehicleFamily";

const SCHEDULE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
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
          <span className="font-medium text-[var(--home-ink)]">{launch.name}</span>
          <span className="text-3xs uppercase tracking-[0.06em] text-[var(--home-ink-muted)]">
            {shortCode(launch.rocketName)}
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-3xs font-semibold uppercase tracking-[0.08em]"
            style={{ color: launch.success ? "var(--home-positive)" : "var(--home-negative)" }}
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
            {launch.success ? "OK" : "Fail"}
          </span>
        </>
      ),
    })),
    ...upcoming.map((launch) => ({
      key: `upcoming-${launch.id}`,
      content: (
        <>
          <span className="text-[var(--home-ink-muted)]">{launch.name}</span>
          <span className="text-3xs uppercase tracking-[0.06em] text-[var(--home-ink-muted)]">
            {shortCode(launch.rocketName)}
          </span>
          <span className="text-3xs text-[color-mix(in_srgb,var(--home-ink-muted)_72%,var(--home-ink))]">
            {launch.hasExactTime ? SCHEDULE_FORMATTER.format(new Date(launch.dateUtc)) : "TBD"}
          </span>
        </>
      ),
    })),
  ];

  return (
    <section
      aria-label="Launch tape"
      className="overflow-hidden rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_62%,var(--home-paper))]"
    >
      <InstrumentTape
        className="px-3"
        ariaLabel="Recent launch outcomes and upcoming launch windows"
        label={
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--home-signal)]" />
            {latestFlightNumber ? `Latest · Flight ${latestFlightNumber}` : "Launch tape"}
          </span>
        }
        items={items}
        emptyFallback={
          <p className="px-4 py-3.5 text-sm text-[var(--home-ink-muted)]">
            No recent outcomes or upcoming windows are available from the current snapshot.
          </p>
        }
      />
    </section>
  );
}
