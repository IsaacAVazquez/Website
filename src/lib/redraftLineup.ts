import type { RedraftLineupSettings } from "@/types";

export const DEFAULT_REDRAFT_LINEUP: RedraftLineupSettings = {
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1,
  FLEX: 1,
  K: 1,
  DST: 1,
};

export const REDRAFT_LINEUP_PRESETS = [
  {
    id: "traditional",
    label: "2 WR + flex",
    description: "1 QB, 2 RB, 2 WR, 1 TE, 1 flex, K, and DST.",
    lineup: DEFAULT_REDRAFT_LINEUP,
  },
  {
    id: "three-wr",
    label: "3 WR + flex",
    description: "Adds a third starting WR while keeping K and DST.",
    lineup: { ...DEFAULT_REDRAFT_LINEUP, WR: 3 },
  },
  {
    id: "three-wr-no-kdst",
    label: "3 WR, no K/DST",
    description: "Uses two flex spots and no kicker or team defense.",
    lineup: { ...DEFAULT_REDRAFT_LINEUP, WR: 3, FLEX: 2, K: 0, DST: 0 },
  },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  description: string;
  lineup: RedraftLineupSettings;
}>;

const LIMITS = {
  RB: { min: 1, max: 3 },
  WR: { min: 1, max: 4 },
  TE: { min: 1, max: 2 },
  FLEX: { min: 0, max: 3 },
  K: { min: 0, max: 1 },
  DST: { min: 0, max: 1 },
} as const;

function clampInteger(value: unknown, minimum: number, maximum: number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return minimum;
  return Math.min(maximum, Math.max(minimum, Math.round(parsed)));
}

export function normalizeRedraftLineup(
  lineup: Partial<RedraftLineupSettings> | null | undefined
): RedraftLineupSettings {
  return {
    QB: 1,
    RB: clampInteger(lineup?.RB ?? DEFAULT_REDRAFT_LINEUP.RB, LIMITS.RB.min, LIMITS.RB.max),
    WR: clampInteger(lineup?.WR ?? DEFAULT_REDRAFT_LINEUP.WR, LIMITS.WR.min, LIMITS.WR.max),
    TE: clampInteger(lineup?.TE ?? DEFAULT_REDRAFT_LINEUP.TE, LIMITS.TE.min, LIMITS.TE.max),
    FLEX: clampInteger(
      lineup?.FLEX ?? DEFAULT_REDRAFT_LINEUP.FLEX,
      LIMITS.FLEX.min,
      LIMITS.FLEX.max
    ),
    K: clampInteger(lineup?.K ?? DEFAULT_REDRAFT_LINEUP.K, LIMITS.K.min, LIMITS.K.max),
    DST: clampInteger(
      lineup?.DST ?? DEFAULT_REDRAFT_LINEUP.DST,
      LIMITS.DST.min,
      LIMITS.DST.max
    ),
  };
}

export function countRedraftStartingSlots(lineup: RedraftLineupSettings): number {
  return Object.values(lineup).reduce((total, slots) => total + slots, 0);
}

export function redraftLineupSummary(lineup: RedraftLineupSettings): string {
  return `${lineup.QB} QB, ${lineup.RB} RB, ${lineup.WR} WR, ${lineup.TE} TE, ${lineup.FLEX} FLEX, ${lineup.K} K, and ${lineup.DST} DST`;
}

interface RedraftRosterTarget {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  K: number;
  DST: number;
}

/**
 * A transparent roster-count baseline derived from the user's exact lineup
 * and draft length. It is guidance for covering weekly slots, not a claim
 * about a single winning construction.
 */
export function getRedraftRosterTarget(
  lineup: RedraftLineupSettings,
  rounds: number
): RedraftRosterTarget {
  const starterSlots = countRedraftStartingSlots(lineup);
  const roomForBackupQb = rounds >= starterSlots + 4;
  const roomForBackupTe = rounds >= starterSlots + 5;
  const QB = lineup.QB + (roomForBackupQb ? 1 : 0);
  const TE = lineup.TE + (roomForBackupTe ? 1 : 0);
  const fixed = QB + TE + lineup.K + lineup.DST;
  const skillSlots = Math.max(lineup.RB + lineup.WR, rounds - fixed);

  let RB = Math.max(lineup.RB, Math.round(skillSlots * 0.45));
  let WR = Math.max(lineup.WR, skillSlots - RB);
  while (RB + WR > skillSlots) {
    if (WR > lineup.WR && WR >= RB) WR -= 1;
    else if (RB > lineup.RB) RB -= 1;
    else break;
  }
  while (RB + WR < skillSlots) {
    if (WR <= RB) WR += 1;
    else RB += 1;
  }

  return { QB, RB, WR, TE, K: lineup.K, DST: lineup.DST };
}
