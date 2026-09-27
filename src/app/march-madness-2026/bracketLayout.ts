import type { RegionData, RoundOneMatchup } from "./march-madness-data";

export type BracketRoundKey = "r1" | "r2" | "s16" | "e8";

export interface BracketSlot {
  name: string;
  seed: number | null;
}

export interface BracketGame {
  round: BracketRoundKey;
  /** Position within the round, 0-based. */
  index: number;
  /** Vertical centre of this game's slot, as a fraction (0..1) of the region's full bracket height. */
  y: number;
  slots: [BracketSlot, BracketSlot];
  /** Which slot the pick favors, or null when the matchup is missing or malformed. */
  winnerIndex: 0 | 1 | null;
  tags: string[];
  /** Only the Elite Eight game carries an editorial note instead of tags. */
  note?: string;
  /** True when the picked winner is seeded worse (a higher seed number) than the team it beat. Never true when either seed is unknown. */
  isUpset: boolean;
  /** The two feeder games' y-centres from the previous round, in game order. Null for the first round. */
  feederY: [number, number] | null;
}

export interface RegionBracketLayout {
  region: string;
  champion: string | null;
  games: BracketGame[];
}

/** A later-round matchup or the Elite Eight game, which carries a `note` instead of `tags`. */
interface MatchupLike {
  t1?: string;
  t2?: string;
  w?: number;
  tags?: string[];
}

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

/** Seeds are only printed on round one, so later rounds look their team's seed up from it. */
function seedLookup(r1: RoundOneMatchup[]): Map<string, number> {
  const seeds = new Map<string, number>();
  for (const game of r1) {
    if (game?.t1) seeds.set(game.t1, game.s1);
    if (game?.t2) seeds.set(game.t2, game.s2);
  }
  return seeds;
}

function winnerIndexOf(w: number | undefined): 0 | 1 | null {
  if (w === 1) return 0;
  if (w === 2) return 1;
  return null;
}

/** True only when both seeds are known and the pick favours the worse (higher-numbered) seed. */
function isUpsetPick(
  winnerIndex: 0 | 1 | null,
  seed1: number | null,
  seed2: number | null
): boolean {
  if (winnerIndex === null || seed1 === null || seed2 === null) return false;
  const winnerSeed = winnerIndex === 0 ? seed1 : seed2;
  const loserSeed = winnerIndex === 0 ? seed2 : seed1;
  return winnerSeed > loserSeed;
}

/** Round one games are evenly spaced; a game's feeder pair is always {2*index, 2*index + 1} of the round before it. */
function feederYOf(previousRound: BracketGame[], index: number): [number, number] | null {
  const a = previousRound[index * 2];
  const b = previousRound[index * 2 + 1];
  if (!a || !b) return null;
  return [a.y, b.y];
}

function laterRoundGame(
  round: BracketRoundKey,
  index: number,
  matchup: MatchupLike | undefined,
  seeds: Map<string, number>,
  feederY: [number, number] | null,
  totalInRound: number,
  note?: string
): BracketGame {
  const t1 = matchup?.t1 ?? "";
  const t2 = matchup?.t2 ?? "";
  const seed1 = t1 ? seeds.get(t1) ?? null : null;
  const seed2 = t2 ? seeds.get(t2) ?? null : null;
  const winnerIndex = winnerIndexOf(matchup?.w);

  return {
    round,
    index,
    // `y` is a fraction (0..1) of the region's full bracket height (see
    // BracketGame.y). When the previous round is missing this game's feeder
    // pair (a malformed round), fall back to an even fractional spacing
    // rather than a raw `index + 0.5`, which is only in range for the first
    // game and pushes every later one far below the chart.
    y: feederY ? (feederY[0] + feederY[1]) / 2 : (index + 0.5) / Math.max(totalInRound, 1),
    slots: [
      { name: t1, seed: seed1 },
      { name: t2, seed: seed2 },
    ],
    winnerIndex,
    tags: asArray(matchup?.tags),
    note,
    isUpset: isUpsetPick(winnerIndex, seed1, seed2),
    feederY,
  };
}

/**
 * Lays out one region's bracket from the first round to the Elite Eight as a
 * flat list of positioned games: each team's seed (looked up from round one
 * for the later rounds, which carry team names only), the picked winner, an
 * upset flag, and the y-centres needed to draw the connecting lines between
 * rounds. A malformed or missing round degrades to an empty list of games for
 * that round rather than throwing, so an incomplete region still lays out
 * whatever rounds it has.
 */
export function regionBracket(data: RegionData | null | undefined): RegionBracketLayout {
  const r1Source = asArray(data?.r1);
  const seeds = seedLookup(r1Source);
  const total = Math.max(r1Source.length, 1);

  const r1Games: BracketGame[] = r1Source.map((game, index) => {
    const seed1 = typeof game?.s1 === "number" ? game.s1 : null;
    const seed2 = typeof game?.s2 === "number" ? game.s2 : null;
    const winnerIndex = winnerIndexOf(game?.w);

    return {
      round: "r1",
      index,
      y: (index + 0.5) / total,
      slots: [
        { name: game?.t1 ?? "", seed: seed1 },
        { name: game?.t2 ?? "", seed: seed2 },
      ],
      winnerIndex,
      tags: asArray(game?.tags),
      isUpset: isUpsetPick(winnerIndex, seed1, seed2),
      feederY: null,
    };
  });

  const r2Source = asArray(data?.r2);
  const r2Games: BracketGame[] = r2Source.map((game, index) =>
    laterRoundGame("r2", index, game, seeds, feederYOf(r1Games, index), r2Source.length)
  );

  const s16Source = asArray(data?.s16);
  const s16Games: BracketGame[] = s16Source.map((game, index) =>
    laterRoundGame("s16", index, game, seeds, feederYOf(r2Games, index), s16Source.length)
  );

  const e8Source = data?.e8;
  const e8Games: BracketGame[] = e8Source
    ? [laterRoundGame("e8", 0, e8Source, seeds, feederYOf(s16Games, 0), 1, e8Source.note)]
    : [];

  return {
    region: data?.region ?? "",
    champion: data?.winner ?? null,
    games: [...r1Games, ...r2Games, ...s16Games, ...e8Games],
  };
}
