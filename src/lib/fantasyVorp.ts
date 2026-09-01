export const FANTASY_VORP_TEAM_SIZES = [10, 12, 14] as const;
export type FantasyVorpTeamSize = (typeof FANTASY_VORP_TEAM_SIZES)[number];
export type FantasyVorpTeamSizeKey = `${FantasyVorpTeamSize}`;

import type { Player } from "@/types";

export interface FantasyVorpRankingEntry {
  playerId: string;
  rank: number;
  value: number;
}

export type FantasyVorpRankings = Partial<
  Record<FantasyVorpTeamSizeKey, FantasyVorpRankingEntry[]>
>;

export interface FantasyVorpSourceMetadata {
  provider: string;
  asOf: string;
  urls: Partial<Record<FantasyVorpTeamSizeKey, string>>;
  matchedCounts: Partial<Record<FantasyVorpTeamSizeKey, number>>;
}

export function isFantasyVorpTeamSize(value: unknown): value is FantasyVorpTeamSize {
  return FANTASY_VORP_TEAM_SIZES.includes(value as FantasyVorpTeamSize);
}

export function fantasyVorpTeamSizeKey(
  teamSize: FantasyVorpTeamSize
): FantasyVorpTeamSizeKey {
  return String(teamSize) as FantasyVorpTeamSizeKey;
}

function getFantasyVorpRanking(
  rankings: FantasyVorpRankings | null | undefined,
  teamSize: FantasyVorpTeamSize
): readonly FantasyVorpRankingEntry[] {
  return rankings?.[fantasyVorpTeamSizeKey(teamSize)] ?? [];
}

export function buildFantasyVorpIndex(
  rankings: FantasyVorpRankings | null | undefined,
  teamSize: FantasyVorpTeamSize
): Map<string, FantasyVorpRankingEntry> {
  return new Map(
    getFantasyVorpRanking(rankings, teamSize).map((entry) => [
      entry.playerId,
      entry,
    ])
  );
}

/**
 * The rankings board's VORP order: VORP rank, then consensus rank, then id.
 * Returns a sorted copy so the server seed and the client sort identically.
 */
export function sortPlayersByVorpRank(
  players: readonly Player[],
  index: ReadonlyMap<string, FantasyVorpRankingEntry>
): Player[] {
  return [...players].sort((left, right) => {
    const leftRank = index.get(left.id)?.rank ?? Number.POSITIVE_INFINITY;
    const rightRank = index.get(right.id)?.rank ?? Number.POSITIVE_INFINITY;
    return (
      leftRank - rightRank ||
      Number(left.rankEcr ?? left.averageRank) - Number(right.rankEcr ?? right.averageRank) ||
      left.id.localeCompare(right.id)
    );
  });
}
