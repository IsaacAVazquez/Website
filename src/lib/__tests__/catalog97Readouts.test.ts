import { readFile } from "fs/promises";
import { getPremierLeagueSummary } from "@/lib/premierLeagueSnapshot";
import { getLaLigaSummarySnapshot } from "@/lib/laLigaSnapshot";
import { getTransitSummary } from "@/lib/bayAreaTransitSnapshot";
import { getSpaceXSnapshot } from "@/lib/spacexSnapshot";
import { getFormula1Summary } from "@/lib/formula1Snapshot";
import { formatPtDay, formatPtTime, getSnapshotReadouts } from "../catalog97Readouts";

jest.mock("fs/promises", () => ({ readFile: jest.fn() }));
jest.mock("@/lib/premierLeagueSnapshot", () => ({ getPremierLeagueSummary: jest.fn() }));
jest.mock("@/lib/laLigaSnapshot", () => ({ getLaLigaSummarySnapshot: jest.fn() }));
jest.mock("@/lib/bayAreaTransitSnapshot", () => ({ getTransitSummary: jest.fn() }));
jest.mock("@/lib/spacexSnapshot", () => ({ getSpaceXSnapshot: jest.fn() }));
jest.mock("@/lib/formula1Snapshot", () => ({ getFormula1Summary: jest.fn() }));

describe("catalog97Readouts time formatting", () => {
  it("prints Pacific daylight time with a Sep abbreviation", () => {
    // 23:39 UTC on 22 Sep is 16:39 PDT the same day.
    expect(formatPtTime("2026-09-22T23:39:00Z")).toBe("22 Sep, 16:39 PT");
    expect(formatPtDay("2026-09-20T01:47:00Z")).toBe("19 Sep");
  });

  it("follows the standard-time offset in winter", () => {
    expect(formatPtTime("2026-01-10T08:05:00Z")).toBe("10 Jan, 00:05 PT");
  });

  it("returns an empty string for an unparseable time", () => {
    expect(formatPtTime("not a date")).toBe("");
  });
});

describe("getSnapshotReadouts", () => {
  const club = (name: string, shortName: string, playedGames: number, won: number, points: number, position: number) => ({
    position,
    team: { name, shortName },
    playedGames,
    won,
    points,
  });

  function serve({
    launch,
    premierLeague,
    laLiga,
    transit,
    investments,
    formula1,
  }: Record<"launch" | "premierLeague" | "laLiga" | "transit" | "investments" | "formula1", unknown>) {
    jest.mocked(getSpaceXSnapshot).mockReturnValue(launch as never);
    jest.mocked(getPremierLeagueSummary).mockResolvedValue(premierLeague as never);
    jest.mocked(getLaLigaSummarySnapshot).mockResolvedValue(laLiga as never);
    jest.mocked(getTransitSummary).mockResolvedValue(transit as never);
    jest.mocked(readFile).mockResolvedValue(JSON.stringify(investments) as never);
    if (formula1 instanceof Error) jest.mocked(getFormula1Summary).mockRejectedValue(formula1);
    else jest.mocked(getFormula1Summary).mockResolvedValue(formula1 as never);
  }

  const launch = {
    generatedAt: "2026-09-22T20:00:00Z",
    summary: {
      nextLaunch: {
        name: "Starlink 12-1",
        rocketName: "Falcon 9 Block 5",
        launchpadName: "Space Launch Complex 40",
        launchpadLocation: "Cape Canaveral SFS, FL, USA",
        dateUtc: "2026-09-25T02:00:00Z",
        hasExactTime: false,
        net: true,
      },
    },
    pastLaunches: [{ name: "Transporter 15", dateUtc: "2026-09-20T01:47:00Z", success: true }],
  };

  it("drops a tile whose snapshot is seeded, incomplete, or unreadable, and keeps the rest", async () => {
    serve({
      launch,
      premierLeague: {
        generatedAt: "2026-09-22T23:39:00Z",
        standings: [club("Arsenal FC", "Arsenal", 5, 4, 13, 1), club("Liverpool FC", "", 5, 4, 12, 2)],
        scorers: [],
      },
      // A table that reads, stamped with a time that does not.
      laLiga: {
        generatedAt: "not a date",
        matchday: 5,
        sourceLabel: "",
        clubs: [{ name: "FC Barcelona", shortName: "Barça", points: 15, won: 5, played: 5, goalDifference: 12 }],
        scorers: [{ name: "Lewandowski", total: 1 }],
      },
      transit: { heroStats: {}, system: { seed: true } },
      investments: { symbols: ["AAPL"], lastUpdated: "2026-09-21T12:00:00Z" },
      formula1: new Error("no snapshot"),
    });

    const readouts = await getSnapshotReadouts();

    expect(readouts.launch).toMatchObject({
      cardLine: "Next: Starlink 12-1, Falcon 9, no earlier than 24 Sep",
      site: "Cape Canaveral SLC-40",
      windowLabel: "No earlier than 24 Sep",
      lastLabel: "Last: Transporter 15, 19 Sep, successful",
    });
    expect(readouts.premierLeague).toMatchObject({
      cardLine: "Matchday 5: Arsenal 13, Liverpool FC 12",
      summary: "Arsenal lead on 13 points.",
    });
    expect(readouts.laLiga?.detail).toBe("Five wins from five, goal difference +12. Lewandowski has 1 goal.");
    expect(readouts.transit).toBeNull();
    expect(readouts.investments).toBeNull();
    expect(Object.keys(readouts.cardLines).sort()).toEqual(["/la-liga", "/premier-league", "/spacex-mission-control"]);
    // Newest first, and La Liga's unreadable time stays out of the log.
    expect(readouts.pullLog).toEqual([
      { label: "Premier League", pulledAt: "2026-09-22T23:39:00Z" },
      { label: "Launches", pulledAt: "2026-09-22T20:00:00Z" },
    ]);
    expect(readouts.latestPull).toBe("2026-09-22T23:39:00Z");
  });

  it("prints the transit, investments, and Formula 1 lines from a full set of snapshots", async () => {
    serve({
      launch: { generatedAt: "2026-09-22T20:00:00Z", summary: null, pastLaunches: [] },
      premierLeague: {
        generatedAt: "2026-09-22T23:39:00Z",
        standings: [club("Arsenal FC", "Arsenal", 5, 5, 15, 1)],
        scorers: [{ name: "Haaland", goals: 7 }],
      },
      laLiga: { generatedAt: "2026-09-22T23:39:00Z", matchday: 5, clubs: [], scorers: [] },
      // BART's feed stamp does not parse here, so the snapshot's own time stands in.
      transit: {
        heroStats: { trainsTracked: 41, activeAdvisories: 1, elevatorOutages: 2, stationCount: 50 },
        system: { seed: false, feedTime: "unreadable", generatedAt: "2026-09-23T17:25:00Z" },
      },
      investments: {
        symbols: ["AAPL", "MSFT", "NVDA", "AMZN", "GOOG"],
        lastUpdated: "2026-09-14T13:00:00Z",
        priceHealth: { recentCount: 2, delayedCount: 2, missingCount: 1, maxAgeDays: 7 },
      },
      formula1: { generatedAt: "2026-09-21T15:00:00Z" },
    });

    const readouts = await getSnapshotReadouts();

    expect(readouts.launch).toBeNull();
    expect(readouts.laLiga).toBeNull();
    expect(readouts.premierLeague?.summary).toBe(
      "Arsenal have won all five. Haaland leads the scorers with 7.",
    );
    expect(readouts.transit).toMatchObject({
      cardLine: "41 trains tracked · feed 23 Sep, 10:25 PT",
      detail: "1 service advisory and 2 elevator outages across 50 stations.",
    });
    expect(readouts.investments).toMatchObject({
      cardLine: "2 prices current, 2 delayed · run 14 Sep",
      detail: "2 more are over seven days old and marked delayed, and 1 has no price yet.",
      staleNote: "Prices older than seven days are marked delayed. On the 14 Sep run that was 2 of 5 symbols.",
    });
    expect(readouts.cardLines["/formula-1"]).toBe("Snapshot 21 Sep, 08:00 PT");
    expect(readouts.pullLog.map((entry) => entry.label)).toEqual([
      "BART",
      "Premier League",
      "Formula 1",
      "Investments",
    ]);
  });
});
