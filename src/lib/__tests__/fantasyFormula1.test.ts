import {
  buildFantasyFormula1Assets,
  EMPTY_FANTASY_FORMULA1_LINEUP,
  FANTASY_FORMULA1_BUDGET,
  FANTASY_FORMULA1_CONSTRUCTOR_SLOTS,
  FANTASY_FORMULA1_DRIVER_SLOTS,
  optimizeFantasyFormula1Lineups,
  summarizeFantasyFormula1Lineup,
} from "@/lib/fantasyFormula1";
import type { Formula1MeetingSummary, Formula1Snapshot } from "@/types/formula1";

const bahrainMeeting: Formula1MeetingSummary = {
  key: "1282",
  name: "Bahrain Grand Prix",
  officialName: "FORMULA 1 BAHRAIN GRAND PRIX 2026",
  location: "Sakhir",
  countryName: "Bahrain",
  countryCode: "BRN",
  countryFlag: null,
  circuitKey: "63",
  circuitShortName: "Sakhir",
  circuitType: "Permanent",
  circuitImage: null,
  gmtOffset: "03:00:00",
  startAt: "2026-04-10T11:30:00+00:00",
  endAt: "2026-04-12T17:00:00+00:00",
  status: "completed",
  hasSprint: false,
  raceSessionKey: "11261",
  raceStartsAt: "2026-04-12T15:00:00+00:00",
  sessions: [],
  classification: [
    {
      position: 1,
      driverNumber: 4,
      driverName: "Lando Norris",
      broadcastName: "L NORRIS",
      acronym: "NOR",
      teamName: "McLaren",
      teamColor: null,
      headshotUrl: null,
      lapsCompleted: 57,
      points: 25,
      status: "classified",
      statusLabel: "Finished",
      gapToLeaderLabel: "Leader",
      durationLabel: "1:30:00.000",
    },
    {
      position: 2,
      driverNumber: 63,
      driverName: "George Russell",
      broadcastName: "G RUSSELL",
      acronym: "RUS",
      teamName: "Mercedes",
      teamColor: null,
      headshotUrl: null,
      lapsCompleted: 57,
      points: 18,
      status: "classified",
      statusLabel: "Finished",
      gapToLeaderLabel: "+5.000s",
      durationLabel: null,
    },
  ],
  podium: [],
  resultPublished: true,
};

function createSnapshot(overrides: Partial<Formula1Snapshot> = {}): Formula1Snapshot {
  const base: Formula1Snapshot = {
    sourceLabel: "OpenF1 historical snapshot",
    sourceUrls: {
      docs: "https://openf1.org/docs/",
      apiBase: "https://openf1.org/",
      meetings: "https://api.openf1.org/v1/meetings",
      sessions: "https://api.openf1.org/v1/sessions",
      drivers: "https://api.openf1.org/v1/drivers",
      driverStandings: "https://api.openf1.org/v1/championship_drivers",
      constructorStandings: "https://api.openf1.org/v1/championship_teams",
    },
    season: 2026,
    generatedAt: "2026-04-15T00:00:00.000Z",
    defaultMeetingKey: "1283",
    standingsMeetingKey: "1282",
    meetings: [bahrainMeeting],
    driverStandings: [
      {
        position: 1,
        previousPosition: 2,
        driverNumber: 4,
        driverName: "Lando Norris",
        broadcastName: "L NORRIS",
        acronym: "NOR",
        teamName: "McLaren",
        teamColor: null,
        headshotUrl: null,
        points: 90,
        pointsBeforeRace: 65,
        pointsDelta: 25,
      },
      {
        position: 2,
        previousPosition: 3,
        driverNumber: 63,
        driverName: "George Russell",
        broadcastName: "G RUSSELL",
        acronym: "RUS",
        teamName: "Mercedes",
        teamColor: null,
        headshotUrl: null,
        points: 72,
        pointsBeforeRace: 54,
        pointsDelta: 18,
      },
      {
        position: 3,
        previousPosition: 4,
        driverNumber: 16,
        driverName: "Charles Leclerc",
        broadcastName: "C LECLERC",
        acronym: "LEC",
        teamName: "Ferrari",
        teamColor: null,
        headshotUrl: null,
        points: 55,
        pointsBeforeRace: 43,
        pointsDelta: 12,
      },
      {
        position: 4,
        previousPosition: 5,
        driverNumber: 12,
        driverName: "Kimi Antonelli",
        broadcastName: "K ANTONELLI",
        acronym: "ANT",
        teamName: "Mercedes",
        teamColor: null,
        headshotUrl: null,
        points: 40,
        pointsBeforeRace: 32,
        pointsDelta: 8,
      },
      {
        position: 5,
        previousPosition: 6,
        driverNumber: 87,
        driverName: "Oliver Bearman",
        broadcastName: "O BEARMAN",
        acronym: "BEA",
        teamName: "Haas",
        teamColor: null,
        headshotUrl: null,
        points: 25,
        pointsBeforeRace: 19,
        pointsDelta: 6,
      },
      {
        position: 6,
        previousPosition: 7,
        driverNumber: 77,
        driverName: "Valtteri Bottas",
        broadcastName: "V BOTTAS",
        acronym: "BOT",
        teamName: "Cadillac",
        teamColor: null,
        headshotUrl: null,
        points: 8,
        pointsBeforeRace: 6,
        pointsDelta: 2,
      },
      {
        position: 7,
        previousPosition: 8,
        driverNumber: 18,
        driverName: "Lance Stroll",
        broadcastName: "L STROLL",
        acronym: "STR",
        teamName: "Aston Martin",
        teamColor: null,
        headshotUrl: null,
        points: 4,
        pointsBeforeRace: 3,
        pointsDelta: 1,
      },
      {
        position: 8,
        previousPosition: 9,
        driverNumber: 14,
        driverName: "Fernando Alonso",
        broadcastName: "F ALONSO",
        acronym: "ALO",
        teamName: "Aston Martin",
        teamColor: null,
        headshotUrl: null,
        points: 2,
        pointsBeforeRace: 1,
        pointsDelta: 1,
      },
    ],
    constructorStandings: [
      {
        position: 1,
        previousPosition: 1,
        teamName: "McLaren",
        teamColor: null,
        points: 130,
        pointsBeforeRace: 90,
        pointsDelta: 40,
      },
      {
        position: 2,
        previousPosition: 2,
        teamName: "Mercedes",
        teamColor: null,
        points: 112,
        pointsBeforeRace: 86,
        pointsDelta: 26,
      },
      {
        position: 3,
        previousPosition: 4,
        teamName: "Cadillac",
        teamColor: null,
        points: 18,
        pointsBeforeRace: 12,
        pointsDelta: 6,
      },
      {
        position: 4,
        previousPosition: 4,
        teamName: "Aston Martin",
        teamColor: null,
        points: 4,
        pointsBeforeRace: 3,
        pointsDelta: 1,
      },
    ],
    seasonMetrics: {
      season: 2026,
      totalRaces: 24,
      completedRaces: 4,
      upcomingRaces: 20,
      sprintWeekends: 6,
    },
    nextMeeting: null,
    lastCompletedMeeting: bahrainMeeting,
  };

  return { ...base, ...overrides };
}

describe("fantasyFormula1", () => {
  it("builds driver and constructor assets with model prices and projections", () => {
    const assets = buildFantasyFormula1Assets(createSnapshot());

    expect(assets.filter((asset) => asset.kind === "driver")).toHaveLength(8);
    expect(assets.filter((asset) => asset.kind === "constructor")).toHaveLength(4);
    expect(assets[0]).toEqual(
      expect.objectContaining({
        id: "driver-4",
        price: expect.any(Number),
        projectedPoints: expect.any(Number),
        valueRating: expect.any(Number),
      })
    );
  });

  it("returns complete optimized lineups inside the budget", () => {
    const assets = buildFantasyFormula1Assets(createSnapshot());
    const [candidate] = optimizeFantasyFormula1Lineups(assets);

    expect(candidate).toBeDefined();
    expect(candidate.drivers).toHaveLength(FANTASY_FORMULA1_DRIVER_SLOTS);
    expect(candidate.constructors).toHaveLength(FANTASY_FORMULA1_CONSTRUCTOR_SLOTS);
    expect(candidate.totalPrice).toBeLessThanOrEqual(FANTASY_FORMULA1_BUDGET);
    expect(candidate.isComplete).toBe(true);
  });

  it("honors locked assets while optimizing", () => {
    const assets = buildFantasyFormula1Assets(createSnapshot());
    const lockedAsset = assets.find((asset) => asset.id === "driver-77");

    expect(lockedAsset).toBeDefined();

    const [candidate] = optimizeFantasyFormula1Lineups(assets, [lockedAsset!.id]);

    expect(candidate.assets.map((asset) => asset.id)).toContain(lockedAsset!.id);
  });

  it("returns no candidates when locked picks make the lineup impossible", () => {
    const assets = buildFantasyFormula1Assets(createSnapshot());
    const tooManyDrivers = assets
      .filter((asset) => asset.kind === "driver")
      .map((asset) => asset.id);

    expect(optimizeFantasyFormula1Lineups(assets, tooManyDrivers)).toEqual([]);
  });

  it("falls back to the last published classification when standings are empty", () => {
    const assets = buildFantasyFormula1Assets(
      createSnapshot({
        driverStandings: [],
        constructorStandings: [],
      })
    );

    expect(assets.map((asset) => asset.id)).toEqual([
      "driver-4",
      "driver-63",
      "constructor-mclaren",
      "constructor-mercedes",
    ]);
  });

  it("summarizes empty and unavailable lineups without crashing", () => {
    const summary = summarizeFantasyFormula1Lineup([], EMPTY_FANTASY_FORMULA1_LINEUP);

    expect(summary.totalPrice).toBe(0);
    expect(summary.projectedPoints).toBe(0);
    expect(summary.isComplete).toBe(false);
  });
});
