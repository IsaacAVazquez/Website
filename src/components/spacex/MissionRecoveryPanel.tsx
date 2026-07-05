import type { MissionLaunchDetail } from "@/types/spacex";
import { aggregateMissionRecovery } from "@/lib/spacexRecovery";

interface MissionRecoveryPanelProps {
  launchDetails: Record<string, MissionLaunchDetail>;
}

const TONE_COLOR: Record<"signal" | "ink" | "stone", string> = {
  signal: "var(--home-signal)",
  ink: "var(--home-ink)",
  stone: "var(--home-stone)",
};

/**
 * Landing-method split (droneship / return-to-pad / expended) plus a
 * fleet-leaders list of boosters by flights flown. Gated on real core data:
 * Launch Library's `launcher_stage`/landing payload is currently empty for
 * every SpaceX launch this snapshot hydrates, so this renders an honest
 * empty state instead of fabricating a chart. `normalizeCores` in
 * spacexData.ts already maps the field whenever upstream populates it — no
 * further builder change is needed for this panel to start working on its
 * own once that happens.
 */
export function MissionRecoveryPanel({ launchDetails }: MissionRecoveryPanelProps) {
  const recovery = aggregateMissionRecovery(launchDetails);

  if (!recovery) {
    return (
      <div className="rounded-[var(--radius-3xl)] border border-dashed border-[var(--home-rule)] bg-[var(--home-paper)] px-5 py-10 text-center">
        <p className="text-lg font-semibold text-[var(--home-ink)]">
          No recovery data in the current snapshot.
        </p>
        <p className="mx-auto mt-2 max-w-[54ch] text-sm leading-6 text-[var(--home-ink-muted)]">
          Launch Library&apos;s booster/landing records aren&apos;t populated for any mission this
          snapshot currently hydrates. The normalizer already maps that data whenever upstream
          provides it, so this panel will fill in on its own the next time a refresh picks up
          populated core records — nothing here is fabricated in the meantime.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
      <div className="rounded-[var(--radius-lg)] border border-[var(--home-rule)] bg-[var(--home-paper)]">
        <h3 className="px-4 pt-4 text-base font-bold tracking-[-0.01em] text-[var(--home-ink)] sm:px-5">
          Recovery split
        </h3>
        <p className="px-4 pt-1 font-mono text-3xs uppercase tracking-[0.08em] text-[var(--home-ink-muted)] sm:px-5">
          {recovery.total} recovery attempt{recovery.total === 1 ? "" : "s"} in the hydrated sample
        </p>
        <div className="space-y-2.5 px-4 py-4 sm:px-5">
          {recovery.split.map((bucket) => (
            <div key={bucket.label} className="grid grid-cols-[88px_1fr_auto] items-center gap-3">
              <span className="font-mono text-2xs uppercase tracking-[0.04em] text-[var(--home-ink-muted)]">
                {bucket.label}
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-[var(--home-paper-alt)]">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.round((bucket.count / recovery.total) * 100)}%`,
                    background: TONE_COLOR[bucket.tone],
                  }}
                />
              </span>
              <span className="font-mono text-sm tabular-nums text-[var(--home-ink)]">
                {bucket.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--home-rule)] bg-[var(--home-paper)]">
        <h3 className="px-4 pt-4 text-base font-bold tracking-[-0.01em] text-[var(--home-ink)] sm:px-5">
          Fleet leaders
        </h3>
        <p className="px-4 pt-1 font-mono text-3xs uppercase tracking-[0.08em] text-[var(--home-ink-muted)] sm:px-5">
          Boosters by flights flown, in the hydrated sample
        </p>
        <div className="px-4 py-2 sm:px-5">
          {recovery.fleetLeaders.map((leader, index) => (
            <div
              key={leader.serial}
              className="grid grid-cols-[22px_minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-[color-mix(in_srgb,var(--home-rule)_50%,transparent)] py-3 last:border-b-0"
            >
              <span className="font-mono text-sm text-[var(--home-ink-muted)]">{index + 1}</span>
              <span className="truncate font-mono text-sm text-[var(--home-ink)]">
                {leader.serial}
              </span>
              <span className="truncate text-xs text-[var(--home-ink-muted)]">
                last · {leader.lastMissionName}
              </span>
              <span className="font-mono text-base tabular-nums text-[var(--home-ink)]">
                {leader.flights}
                <span className="ml-1 text-2xs text-[var(--home-ink-muted)]">flts</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
