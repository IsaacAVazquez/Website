/**
 * @jest-environment node
 */
import { getMlbSummary } from "../mlbData";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// ---- Fixtures -------------------------------------------------------------

const AL_LEAGUE_ID = 103;
const NL_LEAGUE_ID = 104;

function teamsPayload() {
  return {
    teams: [
      {
        id: 147,
        name: "New York Yankees",
        teamName: "Yankees",
        shortName: "NY Yankees",
        locationName: "New York",
        abbreviation: "NYY",
        league: { id: AL_LEAGUE_ID, name: "American League" },
        division: { id: 201, name: "American League East" },
        venue: { name: "Yankee Stadium" },
        firstYearOfPlay: "1903",
      },
      {
        id: 111,
        name: "Boston Red Sox",
        teamName: "Red Sox",
        shortName: "Boston",
        locationName: "Boston",
        abbreviation: "BOS",
        league: { id: AL_LEAGUE_ID, name: "American League" },
        division: { id: 201, name: "American League East" },
        venue: { name: "Fenway Park" },
        firstYearOfPlay: "1901",
      },
      {
        id: 119,
        name: "Los Angeles Dodgers",
        teamName: "Dodgers",
        shortName: "LA Dodgers",
        locationName: "Los Angeles",
        abbreviation: "LAD",
        league: { id: NL_LEAGUE_ID, name: "National League" },
        division: { id: 203, name: "National League West" },
        venue: { name: "Dodger Stadium" },
        firstYearOfPlay: "1884",
      },
      // A team in neither AL nor NL (e.g. a spring/other league) must be dropped.
      {
        id: 999,
        name: "Phantom Club",
        teamName: "Phantoms",
        abbreviation: "PHA",
        league: { id: 160, name: "Cactus League" },
        division: { id: 999, name: "Cactus West" },
        venue: { name: "Nowhere Park" },
        firstYearOfPlay: "2099",
      },
    ],
  };
}

function standingsPayload() {
  return {
    records: [
      {
        league: { id: AL_LEAGUE_ID, name: "American League" },
        division: { id: 201, name: "American League East" },
        teamRecords: [
          {
            team: { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
            divisionRank: "2",
            leagueRank: "3",
            wildCardRank: "1",
            divisionGamesBack: "4.0",
            wildCardGamesBack: "-",
            wins: 50,
            losses: 40,
            winningPercentage: ".556",
            runsScored: 420,
            runsAllowed: 390,
            runDifferential: 30,
            streak: { streakCode: "W2" },
            records: {
              splitRecords: [
                { type: "lastTen", wins: 6, losses: 4 },
                { type: "home", wins: 28, losses: 18 },
              ],
            },
          },
          {
            team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
            divisionRank: "1",
            leagueRank: "1",
            wildCardRank: null,
            divisionGamesBack: "-",
            wildCardGamesBack: "-",
            wins: 55,
            losses: 35,
            winningPercentage: ".611",
            runsScored: 460,
            runsAllowed: 360,
            runDifferential: 100,
            streak: { streakCode: "W4" },
            records: {
              splitRecords: [{ type: "lastTen", wins: 7, losses: 3 }],
            },
          },
        ],
      },
      {
        league: { id: NL_LEAGUE_ID, name: "National League" },
        division: { id: 203, name: "National League West" },
        teamRecords: [
          {
            team: { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" },
            divisionRank: "1",
            leagueRank: "1",
            wildCardRank: null,
            divisionGamesBack: "-",
            wildCardGamesBack: "-",
            wins: 58,
            losses: 32,
            winningPercentage: ".644",
            runsScored: 480,
            runsAllowed: 350,
            runDifferential: 130,
            streak: { streakCode: "L1" },
            records: { splitRecords: [{ type: "lastTen", wins: 5, losses: 5 }] },
          },
        ],
      },
    ],
  };
}

function recentSchedulePayload() {
  return {
    dates: [
      {
        date: "2026-06-19",
        games: [
          {
            gamePk: 700001,
            gameDate: "2026-06-19T23:05:00Z",
            gameType: "R",
            status: { abstractGameState: "Final", detailedState: "Final" },
            teams: {
              home: {
                team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
                score: 6,
                isWinner: true,
              },
              away: {
                team: { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
                score: 3,
                isWinner: false,
              },
            },
          },
        ],
      },
      {
        date: "2026-06-20",
        games: [
          {
            gamePk: 700002,
            gameDate: "2026-06-20T23:05:00Z",
            gameType: "R",
            status: { abstractGameState: "Final", detailedState: "Final" },
            teams: {
              home: {
                team: { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
                score: 2,
                isWinner: false,
              },
              away: {
                team: { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" },
                score: 5,
                isWinner: true,
              },
            },
          },
          // A non-final game inside the recent window must be excluded.
          {
            gamePk: 700003,
            gameDate: "2026-06-20T20:00:00Z",
            gameType: "R",
            status: { abstractGameState: "Live", detailedState: "In Progress" },
            teams: {
              home: {
                team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
                score: 1,
              },
              away: {
                team: { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" },
                score: 1,
              },
            },
          },
        ],
      },
    ],
  };
}

function upcomingSchedulePayload() {
  return {
    dates: [
      {
        date: "2026-06-24",
        games: [
          {
            gamePk: 800001,
            gameDate: "2026-06-24T23:05:00Z",
            gameType: "R",
            status: { abstractGameState: "Preview", detailedState: "Scheduled" },
            teams: {
              home: {
                team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
              },
              away: {
                team: { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" },
              },
            },
          },
        ],
      },
      {
        date: "2026-06-25",
        games: [
          {
            gamePk: 800002,
            gameDate: "2026-06-25T23:05:00Z",
            gameType: "R",
            status: { abstractGameState: "Preview", detailedState: "Scheduled" },
            teams: {
              home: {
                team: { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
              },
              away: {
                team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
              },
            },
          },
        ],
      },
    ],
  };
}

function leadersPayload(category: string) {
  // Use distinct values so we can confirm the right category routed through.
  const value = category === "battingAverage" ? "0.345" : "30";
  return {
    leagueLeaders: [
      {
        leaderCategory: category,
        statGroup: "hitting",
        season: "2026",
        leaders: [
          {
            rank: 1,
            value,
            person: { id: 5001, fullName: "Aaron Judge" },
            team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
            numGames: 90,
          },
          {
            rank: 2,
            value: category === "battingAverage" ? "0.330" : "28",
            person: { id: 5002, fullName: "Mookie Betts" },
            team: { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" },
            numGames: 88,
          },
          // Malformed entry (missing person name) must be dropped.
          {
            rank: 3,
            value: "27",
            person: { id: 5003, fullName: null },
            team: { id: 111, abbreviation: "BOS" },
            numGames: 85,
          },
        ],
      },
    ],
  };
}

// ---- Routing --------------------------------------------------------------

function routeFetch(input: RequestInfo | URL): Response {
  const url = typeof input === "string" ? input : input.toString();

  if (url.includes("/teams?")) {
    return jsonResponse(teamsPayload());
  }
  if (url.includes("/standings?")) {
    return jsonResponse(standingsPayload());
  }
  if (url.includes("/stats/leaders?")) {
    const match = url.match(/leaderCategories=([^&]+)/);
    const category = match ? decodeURIComponent(match[1]) : "homeRuns";
    return jsonResponse(leadersPayload(category));
  }
  if (url.includes("/schedule?")) {
    // Distinguish recent vs upcoming windows by the startDate query param.
    // Recent window starts in the past (startDate < today); upcoming starts today/future.
    const startMatch = url.match(/startDate=([^&]+)/);
    const endMatch = url.match(/endDate=([^&]+)/);
    const start = startMatch ? startMatch[1] : "";
    const end = endMatch ? endMatch[1] : "";
    // Recent schedule's endDate is yesterday (offset -1); upcoming's startDate is today (offset 0).
    // The recent window's start is strictly before its end and both are in the past.
    const today = new Date().toISOString().slice(0, 10);
    if (end < today || end === undefined) {
      return jsonResponse(recentSchedulePayload());
    }
    if (start >= today) {
      return jsonResponse(upcomingSchedulePayload());
    }
    // Fallback: treat as recent.
    return jsonResponse(recentSchedulePayload());
  }

  throw new Error(`Unexpected fetch URL in test: ${url}`);
}

describe("getMlbSummary", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("builds a summary with sorted standings, normalized leaders, and split schedule", async () => {
    jest
      .spyOn(global, "fetch")
      .mockImplementation(async (input: RequestInfo | URL) =>
        routeFetch(input)
      );

    const summary = await getMlbSummary();

    // --- Teams: AL/NL only, non-MLB league dropped, sorted by shortName. ---
    expect(summary.teams).toHaveLength(3);
    expect(summary.teams.some((t) => t.abbreviation === "PHA")).toBe(false);
    const shortNames = summary.teams.map((t) => t.shortName);
    expect([...shortNames].sort((a, b) => a.localeCompare(b))).toEqual(
      shortNames
    );
    const yankees = summary.teams.find((t) => t.id === "147");
    expect(yankees).toMatchObject({
      name: "New York Yankees",
      shortName: "Yankees",
      abbreviation: "NYY",
      league: "AL",
      division: "AL East",
      venue: "Yankee Stadium",
    });
    expect(yankees?.logo).toContain("147.svg");

    // --- Standings: populated and sorted by league, division, divisionRank. ---
    expect(summary.standings).toHaveLength(3);
    // AL sorts before NL; within AL East, divisionRank 1 (Yankees) precedes 2 (Red Sox).
    expect(summary.standings.map((r) => r.code)).toEqual([
      "NYY",
      "BOS",
      "LAD",
    ]);
    const yankeesRow = summary.standings[0];
    expect(yankeesRow.wins).toBe(55);
    expect(yankeesRow.losses).toBe(35);
    expect(yankeesRow.pct).toBeCloseTo(0.611, 3);
    expect(yankeesRow.divisionRank).toBe(1);
    expect(yankeesRow.gamesBack).toBe(0); // "-" parses to 0
    expect(yankeesRow.runDifferential).toBe(100);
    expect(yankeesRow.streak).toBe("W4");
    expect(yankeesRow.last10).toBe("7-3");

    const redSoxRow = summary.standings[1];
    expect(redSoxRow.gamesBack).toBe(4); // "4.0" parses to 4
    expect(redSoxRow.wildCardRank).toBe(1);
    expect(redSoxRow.last10).toBe("6-4");

    // --- Recent games: only FINISHED, sorted newest-first. ---
    expect(summary.recentGames).toHaveLength(2);
    expect(summary.recentGames.every((g) => g.status === "FINISHED")).toBe(
      true
    );
    // 06-20 game is newer than 06-19 game.
    expect(summary.recentGames[0].id).toBe("700002");
    expect(summary.recentGames[1].id).toBe("700001");
    // Winner derivation from scores.
    const yanksWin = summary.recentGames.find((g) => g.id === "700001");
    expect(yanksWin?.score.winner).toBe("HOME_TEAM");
    expect(yanksWin?.score.home).toBe(6);
    expect(yanksWin?.score.away).toBe(3);
    // Known-team enrichment: home team shortName comes from team lookup.
    expect(yanksWin?.homeTeam.shortName).toBe("Yankees");

    // --- Upcoming games: only non-FINISHED, sorted oldest-first. ---
    expect(summary.upcomingGames).toHaveLength(2);
    expect(
      summary.upcomingGames.every((g) => g.status !== "FINISHED")
    ).toBe(true);
    expect(summary.upcomingGames[0].id).toBe("800001");
    expect(summary.upcomingGames[1].id).toBe("800002");

    // --- Leaders: normalized, malformed entries dropped, perGame derived. ---
    const hr = summary.hittingLeaders.homeRuns;
    expect(hr).toHaveLength(2); // third entry (null name) dropped
    expect(hr[0]).toMatchObject({
      rank: 1,
      name: "Aaron Judge",
      teamId: "147",
      teamCode: "NYY",
      total: 30,
      games: 90,
    });
    expect(hr[0].perGame).toBeCloseTo(30 / 90, 5);

    const avg = summary.hittingLeaders.battingAverage;
    expect(avg[0].total).toBeCloseTo(0.345, 3);

    expect(summary.pitchingLeaders.earnedRunAverage).toHaveLength(2);
    expect(summary.pitchingLeaders.strikeouts[0].name).toBe("Aaron Judge");

    // --- Misc shape. ---
    expect(typeof summary.season).toBe("string");
    expect(typeof summary.generatedAt).toBe("string");
  });

  it("handles empty and malformed upstream feeds gracefully", async () => {
    jest
      .spyOn(global, "fetch")
      .mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("/teams?")) {
          // No teams at all.
          return jsonResponse({ teams: [] });
        }
        if (url.includes("/standings?")) {
          // Missing records key entirely.
          return jsonResponse({});
        }
        if (url.includes("/stats/leaders?")) {
          // Empty leaderboard group.
          return jsonResponse({ leagueLeaders: [] });
        }
        if (url.includes("/schedule?")) {
          // Null dates.
          return jsonResponse({ dates: null });
        }
        throw new Error(`Unexpected fetch URL in test: ${url}`);
      });

    const summary = await getMlbSummary();

    expect(summary.teams).toEqual([]);
    expect(summary.standings).toEqual([]);
    expect(summary.recentGames).toEqual([]);
    expect(summary.upcomingGames).toEqual([]);
    expect(summary.hittingLeaders.homeRuns).toEqual([]);
    expect(summary.hittingLeaders.runsBattedIn).toEqual([]);
    expect(summary.hittingLeaders.battingAverage).toEqual([]);
    expect(summary.pitchingLeaders.earnedRunAverage).toEqual([]);
    expect(summary.pitchingLeaders.wins).toEqual([]);
    expect(summary.pitchingLeaders.strikeouts).toEqual([]);
    expect(typeof summary.season).toBe("string");
  });
});
