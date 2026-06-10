import type { WorldCupGroup, WorldCupStandingRow } from "@/types/worldCup";

/**
 * Number of third-placed teams that advance to the Round of 32. The 48-team
 * 2026 format sends the top two from each group plus the eight best
 * third-placed teams into the knockout stage.
 */
export const THIRD_PLACE_QUALIFY_COUNT = 8;

export interface ThirdPlaceRow {
  teamId: string;
  name: string;
  code: string;
  crest: string | null;
  /** Letter of the group the team finished third in. */
  group: string;
  /** 1-based rank across all third-placed teams, best first. */
  rank: number;
  played: number;
  points: number;
  goalDifference: number;
  goalsFor: number;
  /** True when the team currently sits in a qualifying slot. */
  qualifies: boolean;
}

function selectThirdPlaced(group: WorldCupGroup): WorldCupStandingRow | null {
  return (
    group.standings.find((entry) => entry.rank === 3) ??
    group.standings[2] ??
    null
  );
}

/**
 * Ranks the third-placed team from every group against each other, mirroring
 * the order FIFA uses to choose the eight best third-placed teams: points, then
 * goal difference, then goals scored. Team name is a final deterministic
 * fallback so the output is stable before any matches are played.
 */
export function getThirdPlaceRace(groups: WorldCupGroup[]): ThirdPlaceRow[] {
  const thirdPlaced = groups
    .map((group) => {
      const row = selectThirdPlaced(group);
      if (!row) return null;
      return { group: group.letter || group.name, row };
    })
    .filter(
      (item): item is { group: string; row: WorldCupStandingRow } =>
        item !== null
    );

  thirdPlaced.sort((a, b) => {
    if (b.row.points !== a.row.points) return b.row.points - a.row.points;
    if (b.row.goalDifference !== a.row.goalDifference) {
      return b.row.goalDifference - a.row.goalDifference;
    }
    if (b.row.goalsFor !== a.row.goalsFor) {
      return b.row.goalsFor - a.row.goalsFor;
    }
    return a.row.name.localeCompare(b.row.name);
  });

  return thirdPlaced.map(({ group, row }, index) => ({
    teamId: row.teamId,
    name: row.name,
    code: row.code,
    crest: row.crest,
    group,
    rank: index + 1,
    played: row.played,
    points: row.points,
    goalDifference: row.goalDifference,
    goalsFor: row.goalsFor,
    qualifies: index < THIRD_PLACE_QUALIFY_COUNT,
  }));
}

/** True once at least one third-placed team has played a match. */
export function hasThirdPlaceRaceStarted(rows: ThirdPlaceRow[]): boolean {
  return rows.some((row) => row.played > 0);
}
