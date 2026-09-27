/**
 * The seed ladder shared by the NBA and NFL playoff-picture signatures: a
 * conference ordered by seed and split into bands, with the games-clear gap
 * printed at each band line. Ties count as half a win and half a loss, the
 * standard "games back" treatment.
 */

export interface SeedLadderTeam {
  seed: number;
  wins: number;
  losses: number;
  ties?: number;
}

export interface SeedBandSpec {
  label: string;
  /** Last seed included in this band. Omit on the final band to take the rest. */
  throughSeed?: number;
}

export interface SeedBand<T> {
  label: string;
  teams: T[];
}

export interface SeedLadderLine {
  /** null when either side of the line has no team (a short conference). */
  gamesClear: number | null;
}

export interface SeedLadderResult<T> {
  bands: SeedBand<T>[];
  /** One entry per boundary between adjacent bands, in band order. */
  lines: SeedLadderLine[];
}

function effectiveRecord(team: SeedLadderTeam): { wins: number; losses: number } {
  const half = (team.ties ?? 0) / 2;
  return { wins: team.wins + half, losses: team.losses + half };
}

/** The standard "games back" formula, with `above` as the better-seeded team. */
function gamesClear(above: SeedLadderTeam, below: SeedLadderTeam): number {
  const a = effectiveRecord(above);
  const b = effectiveRecord(below);
  return (a.wins - b.wins + (b.losses - a.losses)) / 2;
}

export function seedLadder<T extends SeedLadderTeam>(
  teams: readonly T[],
  bandSpecs: SeedBandSpec[]
): SeedLadderResult<T> {
  const ordered = [...teams].sort((a, b) => a.seed - b.seed);
  const bands: SeedBand<T>[] = [];
  let cursor = 0;
  for (const spec of bandSpecs) {
    const ceiling = spec.throughSeed ?? Infinity;
    const bandTeams: T[] = [];
    while (cursor < ordered.length && ordered[cursor].seed <= ceiling) {
      bandTeams.push(ordered[cursor]);
      cursor += 1;
    }
    bands.push({ label: spec.label, teams: bandTeams });
  }
  const lines: SeedLadderLine[] = bands.slice(0, -1).map((band, index) => {
    const above = band.teams.at(-1);
    const below = bands[index + 1].teams[0];
    return { gamesClear: above && below ? gamesClear(above, below) : null };
  });
  return { bands, lines };
}

/**
 * The NFL snapshot leaves `seed` null for every team, so seeds are derived
 * per conference: division leaders take one to four in conference-rank
 * order, the next three non-leaders by conference rank take five to seven,
 * and everyone else has no seed. This is the picture if the season ended
 * today, not a published seed.
 */
export interface NflSeedTeam {
  id: string;
  conference: "AFC" | "NFC";
  divisionRank: number;
  conferenceRank: number;
}

export function nflSeeds(teams: readonly NflSeedTeam[]): Map<string, number> {
  const seeds = new Map<string, number>();
  for (const conference of ["AFC", "NFC"] as const) {
    const inConference = teams.filter((team) => team.conference === conference);
    const leaders = inConference
      .filter((team) => team.divisionRank === 1)
      .toSorted((a, b) => a.conferenceRank - b.conferenceRank);
    const wildcards = inConference
      .filter((team) => team.divisionRank !== 1)
      .toSorted((a, b) => a.conferenceRank - b.conferenceRank);
    leaders.slice(0, 4).forEach((team, index) => seeds.set(team.id, index + 1));
    wildcards.slice(0, 3).forEach((team, index) => seeds.set(team.id, index + 5));
  }
  return seeds;
}
