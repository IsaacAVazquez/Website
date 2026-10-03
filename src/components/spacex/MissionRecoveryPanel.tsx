import type { MissionLaunchDetail } from "@/types/spacex";
import { aggregateMissionRecovery } from "@/lib/spacexRecovery";

interface MissionRecoveryPanelProps {
  launchDetails: Record<string, MissionLaunchDetail>;
}

const TONE_COLOR: Record<"signal" | "ink" | "stone", string> = {
  signal: "var(--c97-accent)",
  ink: "var(--c97-ink)",
  stone: "var(--c97-rule)",
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
      <div className="border border-dashed border-[var(--c97-rule)] bg-[var(--c97-surface)] text-center" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-4)" }}>
        <p className="text-lg font-semibold text-[var(--c97-ink)]">
          No recovery data in the current snapshot.
        </p>
        <p className="mx-auto max-w-[54ch] text-sm leading-6 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
          Launch Library&apos;s booster/landing records aren&apos;t populated for any mission this
          snapshot currently hydrates. The normalizer already maps that data whenever upstream
          provides it, so this panel will fill in on its own the next time a refresh picks up
          populated core records, and nothing here is fabricated in the meantime.
        </p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start" style={{ gap: "var(--c97-sp-2)" }}>
      <div className="border border-[var(--c97-rule)] bg-[var(--c97-surface)]">
        <h3 className="c97-serif c97-h3" style={{ paddingInline: "var(--c97-sp-2)", paddingTop: "var(--c97-sp-2)" }}>
          Recovery split
        </h3>
        <p className="font-mono text-3xs uppercase tracking-[0.08em] text-[var(--c97-ink-2)]" style={{ paddingInline: "var(--c97-sp-2)", paddingTop: "var(--c97-sp-0)" }}>
          {recovery.total} recovery attempt{recovery.total === 1 ? "" : "s"} in the hydrated sample
        </p>
        <div className="flex flex-col" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
          {recovery.split.map((bucket) => (
            <div key={bucket.label} className="grid grid-cols-[88px_1fr_auto] items-center" style={{ gap: "var(--c97-sp-1)" }}>
              <span className="font-mono text-2xs uppercase tracking-[0.04em] text-[var(--c97-ink-2)]">
                {bucket.label}
              </span>
              <span className="h-2 overflow-hidden bg-[var(--c97-field)]">
                <span
                  className="block h-full "
                  style={{
                    width: `${Math.round((bucket.count / recovery.total) * 100)}%`,
                    background: TONE_COLOR[bucket.tone],
                  }}
                />
              </span>
              <span className="font-mono text-sm tabular-nums text-[var(--c97-ink)]">
                {bucket.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-[var(--c97-rule)] bg-[var(--c97-surface)]">
        <h3 className="c97-serif c97-h3" style={{ paddingInline: "var(--c97-sp-2)", paddingTop: "var(--c97-sp-2)" }}>
          Fleet leaders
        </h3>
        <p className="font-mono text-3xs uppercase tracking-[0.08em] text-[var(--c97-ink-2)]" style={{ paddingInline: "var(--c97-sp-2)", paddingTop: "var(--c97-sp-0)" }}>
          Boosters by flights flown, in the hydrated sample
        </p>
        <div style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)" }}>
          {recovery.fleetLeaders.map((leader, index) => (
            <div
              key={leader.serial}
              className="grid grid-cols-[22px_minmax(0,1fr)_auto_auto] items-center border-b border-[color-mix(in_srgb,var(--c97-rule)_50%,transparent)] last:border-b-0" style={{ paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}
            >
              <span className="font-mono text-sm text-[var(--c97-ink-2)]">{index + 1}</span>
              <span className="truncate font-mono text-sm text-[var(--c97-ink)]">
                {leader.serial}
              </span>
              <span className="truncate text-xs text-[var(--c97-ink-2)]">
                last · {leader.lastMissionName}
              </span>
              <span className="font-mono text-base tabular-nums text-[var(--c97-ink)]">
                {leader.flights}
                <span className="text-2xs text-[var(--c97-ink-2)]" style={{ marginLeft: "var(--c97-sp-0)" }}>flts</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
