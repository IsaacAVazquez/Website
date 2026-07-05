"use client";

import { getTierRailIntensity } from "@/lib/fantasyUtils";

interface TierBreakSeparatorProps {
  tier: number;
  /** Rank cliff to the previous tier, when known — surfaced as a "↓ N" hint. */
  gap?: number;
}

/**
 * A thin labeled rule inserted between list rows whenever consecutive players
 * cross a tier boundary. It turns the otherwise-flat list into the same
 * tier-chunked read the dedicated tier view gives, without leaving list view.
 * The tag itself is graded by the same tier-rail intensity as the row rail,
 * so the break tag darkens near the top of the board and fades further down.
 */
export function TierBreakSeparator({ tier, gap }: TierBreakSeparatorProps) {
  const intensity = getTierRailIntensity(tier);

  return (
    <li role="presentation" className="flex items-center gap-3 px-1 py-1.5">
      <span
        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-[0.14em]"
        style={{
          borderColor: `color-mix(in srgb, var(--home-signal) ${intensity}%, var(--home-rule))`,
          // A softer fraction of the same intensity — the full value reads
          // fine as a border but would be an overpowering fill at tier 1.
          background: `color-mix(in srgb, var(--home-signal) ${Math.round(intensity / 5)}%, var(--home-paper))`,
          color: "var(--home-ink)",
        }}
      >
        Tier {tier}
      </span>
      <span className="h-px flex-1" style={{ background: "var(--home-rule)" }} aria-hidden="true" />
      {gap && gap > 0 ? (
        <span className="text-2xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--home-ink-muted)" }}>
          ↓ {gap} {gap === 1 ? "rank" : "ranks"}
        </span>
      ) : null}
    </li>
  );
}
