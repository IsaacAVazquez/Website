import type { WorldCupGroup, WorldCupStandingRow } from "@/types/worldCup";
import {
  getThirdPlaceRace,
  hasThirdPlaceRaceStarted,
  THIRD_PLACE_QUALIFY_COUNT,
} from "@/lib/worldCupStandings";

function makeRow(
  overrides: Partial<WorldCupStandingRow> & Pick<WorldCupStandingRow, "rank">
): WorldCupStandingRow {
  return {
    teamId: overrides.teamId ?? `team-${overrides.rank}`,
    name: overrides.name ?? `Team ${overrides.rank}`,
    code: overrides.code ?? "TMM",
    crest: overrides.crest ?? null,
    played: overrides.played ?? 0,
    wins: overrides.wins ?? 0,
    draws: overrides.draws ?? 0,
    losses: overrides.losses ?? 0,
    goalsFor: overrides.goalsFor ?? 0,
    goalsAgainst: overrides.goalsAgainst ?? 0,
    goalDifference: overrides.goalDifference ?? 0,
    points: overrides.points ?? 0,
    form: overrides.form ?? [],
    ...overrides,
  };
}

function makeGroup(
  letter: string,
  thirdPlace: Partial<WorldCupStandingRow>
): WorldCupGroup {
  return {
    letter,
    name: `Group ${letter}`,
    standings: [
      makeRow({ rank: 1, teamId: `${letter}-1`, points: 9 }),
      makeRow({ rank: 2, teamId: `${letter}-2`, points: 6 }),
      makeRow({
        rank: 3,
        teamId: `${letter}-3`,
        name: `Third ${letter}`,
        ...thirdPlace,
      }),
      makeRow({ rank: 4, teamId: `${letter}-4`, points: 0 }),
    ],
  };
}

describe("getThirdPlaceRace", () => {
  it("returns one row per group, ranked by points then goal difference then goals scored", () => {
    const groups: WorldCupGroup[] = [
      makeGroup("A", { played: 3, points: 3, goalDifference: 0, goalsFor: 2 }),
      makeGroup("B", { played: 3, points: 4, goalDifference: 1, goalsFor: 3 }),
      makeGroup("C", { played: 3, points: 3, goalDifference: 1, goalsFor: 5 }),
      makeGroup("D", { played: 3, points: 3, goalDifference: 1, goalsFor: 4 }),
    ];

    const race = getThirdPlaceRace(groups);

    expect(race.map((row) => row.group)).toEqual(["B", "C", "D", "A"]);
    expect(race.map((row) => row.rank)).toEqual([1, 2, 3, 4]);
  });

  it("marks the best eight third-placed teams as qualifying", () => {
    const groups = Array.from({ length: 12 }, (_, index) =>
      makeGroup(String.fromCharCode(65 + index), {
        played: 3,
        // Descending points so group A is best, group L is worst.
        points: 12 - index,
        goalDifference: 12 - index,
        goalsFor: 12 - index,
      })
    );

    const race = getThirdPlaceRace(groups);

    expect(race).toHaveLength(12);
    expect(race.filter((row) => row.qualifies)).toHaveLength(
      THIRD_PLACE_QUALIFY_COUNT
    );
    expect(race.slice(0, 8).every((row) => row.qualifies)).toBe(true);
    expect(race.slice(8).every((row) => !row.qualifies)).toBe(true);
  });

  it("breaks ties deterministically by team name when all stats are equal", () => {
    const groups: WorldCupGroup[] = [
      makeGroup("A", { name: "Zambia" }),
      makeGroup("B", { name: "Argentina" }),
    ];

    const race = getThirdPlaceRace(groups);

    expect(race.map((row) => row.name)).toEqual(["Argentina", "Zambia"]);
  });

  it("skips groups that do not yet have a third-placed team", () => {
    const groups: WorldCupGroup[] = [
      { letter: "A", name: "Group A", standings: [] },
      makeGroup("B", { played: 1, points: 1 }),
    ];

    const race = getThirdPlaceRace(groups);

    expect(race).toHaveLength(1);
    expect(race[0]?.group).toBe("B");
  });
});

describe("hasThirdPlaceRaceStarted", () => {
  it("is false before any matches are played", () => {
    const groups = [makeGroup("A", { played: 0 }), makeGroup("B", { played: 0 })];
    expect(hasThirdPlaceRaceStarted(getThirdPlaceRace(groups))).toBe(false);
  });

  it("is true once a third-placed team has played", () => {
    const groups = [makeGroup("A", { played: 1 }), makeGroup("B", { played: 0 })];
    expect(hasThirdPlaceRaceStarted(getThirdPlaceRace(groups))).toBe(true);
  });
});
