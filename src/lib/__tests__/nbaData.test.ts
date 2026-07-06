/**
 * @jest-environment node
 */
import {
  getNbaSummary,
  buildSeasonLabel,
  resolveNbaSeasonEndYear,
  createEmptyNbaSnapshot,
  preservePriorFixtures,
} from "../nbaData";
import type { NbaFixture, NbaTeamSnapshot } from "../../types/nba";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// --- Standings fixture builders -------------------------------------------

interface StandingTeamOptions {
  id: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName?: string;
  location?: string;
  wins: number;
  losses: number;
  winPercent: number;
  logo?: string;
  venue?: string;
}

function makeStandingEntry(opts: StandingTeamOptions) {
  return {
    team: {
      id: opts.id,
      abbreviation: opts.abbreviation,
      displayName: opts.displayName,
      shortDisplayName: opts.shortDisplayName ?? opts.displayName,
      location: opts.location ?? opts.displayName,
      logo: opts.logo ?? `https://logos.example/${opts.abbreviation}.png`,
      venue: { fullName: opts.venue ?? `${opts.displayName} Arena` },
    },
    stats: [
      { name: "wins", value: opts.wins, displayValue: String(opts.wins) },
      { name: "losses", value: opts.losses, displayValue: String(opts.losses) },
      {
        name: "winPercent",
        value: opts.winPercent,
        displayValue: opts.winPercent.toFixed(3),
      },
      { name: "gamesBehind", value: 0, displayValue: "0" },
      { name: "avgPointsFor", value: 115.2, displayValue: "115.2" },
      { name: "avgPointsAgainst", value: 110.1, displayValue: "110.1" },
      { name: "avgPointDifferential", value: 5.1, displayValue: "5.1" },
      { name: "playoffSeed", value: 1, displayValue: "1" },
      { name: "streak", value: 2, displayValue: "W2" },
      { name: "home", displayValue: "20-5" },
      { name: "road", displayValue: "15-10" },
      { name: "lastTenGames", displayValue: "7-3" },
    ],
  };
}

function makeStandingsResponse() {
  return {
    season: { year: 2025, displayName: "2025-26" },
    children: [
      {
        name: "Eastern Conference",
        abbreviation: "East",
        standings: {
          entries: [
            // Intentionally out of order to prove the sort runs.
            makeStandingEntry({
              id: "2",
              abbreviation: "BOS",
              displayName: "Boston Celtics",
              wins: 40,
              losses: 12,
              winPercent: 0.769,
            }),
            makeStandingEntry({
              id: "1",
              abbreviation: "CLE",
              displayName: "Cleveland Cavaliers",
              wins: 45,
              losses: 8,
              winPercent: 0.849,
            }),
          ],
        },
      },
      {
        name: "Western Conference",
        abbreviation: "West",
        standings: {
          entries: [
            makeStandingEntry({
              id: "3",
              abbreviation: "OKC",
              displayName: "Oklahoma City Thunder",
              wins: 44,
              losses: 9,
              winPercent: 0.83,
            }),
            makeStandingEntry({
              id: "4",
              abbreviation: "DEN",
              displayName: "Denver Nuggets",
              wins: 38,
              losses: 15,
              winPercent: 0.717,
            }),
          ],
        },
      },
    ],
  };
}

// --- Scoreboard fixture builders ------------------------------------------

interface EventOptions {
  id: string;
  date: string;
  completed: boolean;
  homeAbbr: string;
  homeName: string;
  awayAbbr: string;
  awayName: string;
  homeScore?: string;
  awayScore?: string;
  homeWinner?: boolean;
  awayWinner?: boolean;
}

function makeEvent(opts: EventOptions) {
  const statusName = opts.completed ? "STATUS_FINAL" : "STATUS_SCHEDULED";
  return {
    id: opts.id,
    date: opts.date,
    status: { type: { name: statusName, completed: opts.completed } },
    season: { type: 2 },
    competitions: [
      {
        status: { type: { name: statusName, completed: opts.completed } },
        competitors: [
          {
            homeAway: "home",
            score: opts.homeScore ?? null,
            winner: opts.homeWinner ?? false,
            team: {
              id: `${opts.id}-h`,
              abbreviation: opts.homeAbbr,
              displayName: opts.homeName,
              shortDisplayName: opts.homeName,
              logo: `https://logos.example/${opts.homeAbbr}.png`,
            },
          },
          {
            homeAway: "away",
            score: opts.awayScore ?? null,
            winner: opts.awayWinner ?? false,
            team: {
              id: `${opts.id}-a`,
              abbreviation: opts.awayAbbr,
              displayName: opts.awayName,
              shortDisplayName: opts.awayName,
              logo: `https://logos.example/${opts.awayAbbr}.png`,
            },
          },
        ],
      },
    ],
  };
}

function makeScoreboardResponse() {
  return {
    season: { year: 2025, type: 2 },
    events: [
      // A finished game (older)
      makeEvent({
        id: "401-finished-1",
        date: "2026-06-20T00:00:00Z",
        completed: true,
        homeAbbr: "BOS",
        homeName: "Boston Celtics",
        awayAbbr: "CLE",
        awayName: "Cleveland Cavaliers",
        homeScore: "110",
        awayScore: "104",
        homeWinner: true,
      }),
      // A finished game (newer) — should sort first in recentFixtures
      makeEvent({
        id: "401-finished-2",
        date: "2026-06-22T00:00:00Z",
        completed: true,
        homeAbbr: "OKC",
        homeName: "Oklahoma City Thunder",
        awayAbbr: "DEN",
        awayName: "Denver Nuggets",
        homeScore: "98",
        awayScore: "120",
        awayWinner: true,
      }),
      // Upcoming games — should be sorted ascending
      makeEvent({
        id: "401-upcoming-late",
        date: "2026-06-28T00:00:00Z",
        completed: false,
        homeAbbr: "DEN",
        homeName: "Denver Nuggets",
        awayAbbr: "BOS",
        awayName: "Boston Celtics",
      }),
      makeEvent({
        id: "401-upcoming-early",
        date: "2026-06-25T00:00:00Z",
        completed: false,
        homeAbbr: "CLE",
        homeName: "Cleveland Cavaliers",
        awayAbbr: "OKC",
        awayName: "Oklahoma City Thunder",
      }),
    ],
  };
}

// --- ByAthlete (leaders) fixture builders ---------------------------------

// The glossary defines the column order per category. The code reads:
//   offensive: avgPoints, points, avgAssists, assists
//   general:   avgRebounds, rebounds, gamesPlayed
function makeByAthleteResponse() {
  return {
    categories: [
      {
        name: "general",
        names: ["gamesPlayed", "avgRebounds", "rebounds"],
      },
      {
        name: "offensive",
        names: ["avgPoints", "points", "avgAssists", "assists"],
      },
    ],
    athletes: [
      {
        athlete: {
          id: "a1",
          displayName: "Star Scorer",
          teamId: "1",
          teamShortName: "cle",
        },
        categories: [
          { name: "general", values: [50, 5.0, 250] },
          { name: "offensive", values: [30.5, 1525, 6.0, 300] },
        ],
      },
      {
        athlete: {
          id: "a2",
          displayName: "Glass Cleaner",
          teamId: "2",
          teamShortName: "bos",
        },
        categories: [
          { name: "general", values: [52, 13.4, 696] },
          { name: "offensive", values: [18.2, 946, 4.0, 208] },
        ],
      },
      {
        athlete: {
          id: "a3",
          displayName: "Floor General",
          teamId: "3",
          teamShortName: "okc",
        },
        categories: [
          { name: "general", values: [48, 4.5, 216] },
          { name: "offensive", values: [22.0, 1056, 11.5, 552] },
        ],
      },
    ],
  };
}

// --- Teams list fixture builders ------------------------------------------

function makeTeamsResponse() {
  const team = (
    id: string,
    abbreviation: string,
    displayName: string
  ) => ({
    team: {
      id,
      abbreviation,
      displayName,
      shortDisplayName: displayName,
      logo: `https://logos.example/${abbreviation}.png`,
      venue: { fullName: `${displayName} Arena` },
    },
  });
  return {
    sports: [
      {
        leagues: [
          {
            teams: [
              team("3", "OKC", "Oklahoma City Thunder"),
              team("1", "CLE", "Cleveland Cavaliers"),
              team("4", "DEN", "Denver Nuggets"),
              team("2", "BOS", "Boston Celtics"),
            ],
          },
        ],
      },
    ],
  };
}

// --- fetch router ----------------------------------------------------------

function routeFetch(payloads: {
  standings: unknown;
  scoreboard: unknown;
  byathlete: unknown;
  teams: unknown;
}) {
  return (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("byathlete")) {
      return Promise.resolve(jsonResponse(payloads.byathlete));
    }
    if (url.includes("/standings")) {
      return Promise.resolve(jsonResponse(payloads.standings));
    }
    if (url.includes("/scoreboard")) {
      return Promise.resolve(jsonResponse(payloads.scoreboard));
    }
    if (url.includes("/teams")) {
      return Promise.resolve(jsonResponse(payloads.teams));
    }
    return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
  };
}

describe("getNbaSummary", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("normalizes standings, leaders, fixtures and teams from the four ESPN feeds", async () => {
    jest.spyOn(global, "fetch").mockImplementation(
      routeFetch({
        standings: makeStandingsResponse(),
        scoreboard: makeScoreboardResponse(),
        byathlete: makeByAthleteResponse(),
        teams: makeTeamsResponse(),
      }) as unknown as typeof fetch
    );

    const summary = await getNbaSummary();

    // Season label is now derived from the pinned calendar season rather than
    // ESPN's (sometimes-rolled) displayName, so it stays a real "YYYY-YY" label.
    expect(summary.season).toMatch(/^\d{4}-\d{2}$/);
    expect(summary.season).toBe(buildSeasonLabel(resolveNbaSeasonEndYear(new Date())));

    // generatedAt is an ISO string — assert shape, not the exact value.
    expect(typeof summary.generatedAt).toBe("string");
    expect(() => new Date(summary.generatedAt).toISOString()).not.toThrow();

    // --- Standings: both conferences populated and sorted by winPercent desc.
    expect(summary.teamsByConference.east).toHaveLength(2);
    expect(summary.teamsByConference.west).toHaveLength(2);

    const east = summary.teamsByConference.east;
    expect(east[0].abbreviation).toBe("CLE"); // .849 sorts above .769
    expect(east[1].abbreviation).toBe("BOS");
    // Position + conferenceSeed are re-derived from the sorted order.
    expect(east[0].position).toBe(1);
    expect(east[0].conferenceSeed).toBe(1);
    expect(east[1].position).toBe(2);
    // winPercent descending across the list.
    expect(east[0].winPercent).toBeGreaterThanOrEqual(east[1].winPercent);

    const west = summary.teamsByConference.west;
    expect(west[0].abbreviation).toBe("OKC"); // .830 sorts above .717
    expect(west[1].abbreviation).toBe("DEN");

    // Normalized numeric fields carry through.
    expect(east[0].wins).toBe(45);
    expect(east[0].losses).toBe(8);
    expect(east[0].gamesPlayed).toBe(53);
    expect(east[0].conference).toBe("east");
    expect(west[0].conference).toBe("west");

    // --- Leaders: scorers/rebounders/assistLeaders normalized + ranked.
    expect(summary.scorers[0].name).toBe("Star Scorer"); // 30.5 ppg
    expect(summary.scorers[0].rank).toBe(1);
    expect(summary.scorers[0].perGame).toBeCloseTo(30.5);
    expect(summary.scorers[0].total).toBe(1525);
    expect(summary.scorers[0].appearances).toBe(50);
    expect(summary.scorers[0].teamAbbreviation).toBe("CLE");
    expect(summary.scorers[0].teamId).toBe("cle");
    // Ranks are sequential.
    expect(summary.scorers.map((s) => s.rank)).toEqual([1, 2, 3]);

    // Rebounders sorted by avgRebounds desc => Glass Cleaner (13.4) first.
    expect(summary.rebounders[0].name).toBe("Glass Cleaner");
    expect(summary.rebounders[0].perGame).toBeCloseTo(13.4);

    // Assist leaders sorted by avgAssists desc => Floor General (11.5) first.
    expect(summary.assistLeaders[0].name).toBe("Floor General");
    expect(summary.assistLeaders[0].perGame).toBeCloseTo(11.5);

    // --- Fixtures: finished vs upcoming split + sorted correctly.
    expect(summary.recentFixtures).toHaveLength(2);
    // Recent sorted by date descending (newest first).
    expect(summary.recentFixtures[0].id).toBe("401-finished-2");
    expect(summary.recentFixtures[1].id).toBe("401-finished-1");
    expect(summary.recentFixtures[0].status).toBe("FINISHED");

    // Winner derivation: away team won 120-98.
    const newest = summary.recentFixtures[0];
    expect(newest.score.home).toBe(98);
    expect(newest.score.away).toBe(120);
    expect(newest.score.winner).toBe("AWAY_TEAM");

    // Home winner derivation on the older game.
    const older = summary.recentFixtures[1];
    expect(older.score.winner).toBe("HOME_TEAM");

    expect(summary.upcomingFixtures).toHaveLength(2);
    // Upcoming sorted by date ascending (soonest first).
    expect(summary.upcomingFixtures[0].id).toBe("401-upcoming-early");
    expect(summary.upcomingFixtures[1].id).toBe("401-upcoming-late");
    expect(summary.upcomingFixtures[0].status).not.toBe("FINISHED");

    // --- Teams list: normalized + alphabetized by shortName.
    expect(summary.teams).toHaveLength(4);
    const teamNames = summary.teams.map((t) => t.shortName);
    expect(teamNames).toEqual([...teamNames].sort((a, b) => a.localeCompare(b)));
    // Conference is matched in from the standings.
    const cle = summary.teams.find((t) => t.abbreviation === "CLE");
    expect(cle?.conference).toBe("east");
    const okc = summary.teams.find((t) => t.abbreviation === "OKC");
    expect(okc?.conference).toBe("west");
  });

  it("handles empty / malformed feeds by returning empty arrays", async () => {
    jest.spyOn(global, "fetch").mockImplementation(
      routeFetch({
        standings: { season: null, children: [] },
        scoreboard: { events: [] },
        byathlete: { categories: [], athletes: [] },
        teams: { sports: [] },
      }) as unknown as typeof fetch
    );

    const summary = await getNbaSummary();

    expect(summary.teamsByConference.east).toEqual([]);
    expect(summary.teamsByConference.west).toEqual([]);
    expect(summary.scorers).toEqual([]);
    expect(summary.rebounders).toEqual([]);
    expect(summary.assistLeaders).toEqual([]);
    expect(summary.recentFixtures).toEqual([]);
    expect(summary.upcomingFixtures).toEqual([]);
    expect(summary.teams).toEqual([]);
    // Even when ESPN returns an empty feed, the season label comes from the
    // pinned calendar season, so it stays a real "YYYY-YY" label.
    expect(summary.season).toBe(buildSeasonLabel(resolveNbaSeasonEndYear(new Date())));
    expect(typeof summary.generatedAt).toBe("string");
  });

  it("drops fixtures missing required fields and athletes with no per-game stat", async () => {
    // A scoreboard event missing the away competitor (incomplete) plus one valid event.
    const scoreboard = {
      season: { year: 2025, type: 2 },
      events: [
        {
          id: "bad-1",
          date: "2026-06-21T00:00:00Z",
          status: { type: { name: "STATUS_FINAL", completed: true } },
          competitions: [
            {
              competitors: [
                {
                  homeAway: "home",
                  score: "100",
                  team: { id: "x", abbreviation: "XXX", displayName: "X" },
                },
                // away competitor absent => normalizeFixture returns null
              ],
            },
          ],
        },
        makeEvent({
          id: "good-1",
          date: "2026-06-22T00:00:00Z",
          completed: true,
          homeAbbr: "BOS",
          homeName: "Boston Celtics",
          awayAbbr: "CLE",
          awayName: "Cleveland Cavaliers",
          homeScore: "110",
          awayScore: "100",
          homeWinner: true,
        }),
      ],
    };

    // An athlete with a zero per-game scoring value is excluded from scorers.
    const byathlete = {
      categories: [
        { name: "general", names: ["gamesPlayed", "avgRebounds", "rebounds"] },
        { name: "offensive", names: ["avgPoints", "points", "avgAssists", "assists"] },
      ],
      athletes: [
        {
          athlete: { id: "z1", displayName: "Bench Warmer", teamShortName: "bos" },
          categories: [
            { name: "general", values: [2, 0, 0] },
            { name: "offensive", values: [0, 0, 0, 0] }, // avgPoints = 0 => dropped
          ],
        },
        {
          // Missing teamShortName => skipped entirely.
          athlete: { id: "z2", displayName: "No Team" },
          categories: [
            { name: "offensive", values: [25, 1000, 5, 200] },
          ],
        },
        {
          athlete: { id: "z3", displayName: "Real Scorer", teamShortName: "cle" },
          categories: [
            { name: "general", values: [50, 6, 300] },
            { name: "offensive", values: [27.3, 1365, 5, 250] },
          ],
        },
      ],
    };

    jest.spyOn(global, "fetch").mockImplementation(
      routeFetch({
        standings: makeStandingsResponse(),
        scoreboard,
        byathlete,
        teams: makeTeamsResponse(),
      }) as unknown as typeof fetch
    );

    const summary = await getNbaSummary();

    // Only the well-formed fixture survives.
    expect(summary.recentFixtures).toHaveLength(1);
    expect(summary.recentFixtures[0].id).toBe("good-1");

    // Only the athlete with a positive per-game scoring average and a team.
    expect(summary.scorers).toHaveLength(1);
    expect(summary.scorers[0].name).toBe("Real Scorer");
    expect(summary.scorers[0].rank).toBe(1);
  });
});

describe("season labelling", () => {
  it("labels the season from ESPN's pinned ending year, not the rolled displayName", () => {
    // ESPN keys the 2025-26 season by its ENDING year (season=2026). During the
    // 2025-26 Finals it rolled the standings feed's `displayName` to "2026-27"
    // while still serving 2025-26 final records, so the committed snapshot read
    // "2026-27". The label must be built from the pinned ending year instead, so
    // 2026 reads "2025-26", not "2026-27".
    expect(buildSeasonLabel(2026)).toBe("2025-26");
    expect(buildSeasonLabel(2027)).toBe("2026-27");
    expect(buildSeasonLabel(2025)).toBe("2024-25");
  });

  it("resolves the NBA season ending year from the calendar (October rollover)", () => {
    // January through September belong to the season that ends this calendar
    // year; October through December belong to the season that tips off this
    // year and ends the next.
    expect(resolveNbaSeasonEndYear(new Date("2026-06-15T00:00:00Z"))).toBe(2026); // Finals
    expect(resolveNbaSeasonEndYear(new Date("2026-07-05T00:00:00Z"))).toBe(2026); // off-season gap
    expect(resolveNbaSeasonEndYear(new Date("2026-09-30T00:00:00Z"))).toBe(2026); // pre-tip
    expect(resolveNbaSeasonEndYear(new Date("2026-10-15T00:00:00Z"))).toBe(2027); // new season
    expect(resolveNbaSeasonEndYear(new Date("2027-01-10T00:00:00Z"))).toBe(2027); // mid new season
  });
});

describe("preservePriorFixtures (off-season fixtures guard)", () => {
  const fixture = (id: string): NbaFixture => ({
    id,
    utcDate: "2026-06-19T00:00:00Z",
    status: "FINISHED",
    matchday: null,
    stage: "Playoffs",
    homeTeam: { id: "1", name: "Home", shortName: "Home", abbreviation: "HOM", crest: null },
    awayTeam: { id: "2", name: "Away", shortName: "Away", abbreviation: "AWY", crest: null },
    score: { winner: "HOME_TEAM", home: 100, away: 98 },
  });

  const teamSnapshot = (
    recentFixtures: NbaFixture[],
    upcomingFixtures: NbaFixture[]
  ): NbaTeamSnapshot => ({
    team: null,
    recentFixtures,
    upcomingFixtures,
    form: { sequence: [], wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 },
    generatedAt: "2026-06-20T00:00:00Z",
  });

  it("carries prior fixtures forward when the fresh build has an empty scoreboard window", () => {
    // Off-season refresh: standings and leaders update but ESPN's scoreboard
    // window is empty. Fixtures must not regress to zero, so the committed
    // snapshot's fixtures are carried forward while the fresh season/standings
    // win — which is what lets the workflow commit the correction on its own.
    const previous = {
      ...createEmptyNbaSnapshot(),
      season: "2025-26",
      recentFixtures: [fixture("g1"), fixture("g2")],
      teamSnapshots: { lal: teamSnapshot([fixture("g1")], []) },
    };
    const next = {
      ...createEmptyNbaSnapshot(),
      season: "2025-26",
      recentFixtures: [],
      upcomingFixtures: [],
      teamSnapshots: { lal: teamSnapshot([], []) },
    };

    const merged = preservePriorFixtures(next, previous);

    expect(merged.recentFixtures.map((f) => f.id)).toEqual(["g1", "g2"]);
    expect(merged.teamSnapshots.lal.recentFixtures).toHaveLength(1);
    // Non-fixture fields still come from the fresh build.
    expect(merged.season).toBe("2025-26");
  });

  it("keeps the fresh fixtures when the new build has its own", () => {
    const previous = {
      ...createEmptyNbaSnapshot(),
      recentFixtures: [fixture("stale")],
    };
    const next = {
      ...createEmptyNbaSnapshot(),
      recentFixtures: [fixture("live1"), fixture("live2")],
      upcomingFixtures: [fixture("live3")],
    };

    const merged = preservePriorFixtures(next, previous);

    expect(merged.recentFixtures.map((f) => f.id)).toEqual(["live1", "live2"]);
    expect(merged.upcomingFixtures.map((f) => f.id)).toEqual(["live3"]);
  });

  it("no-ops when there is no prior snapshot or the prior also has no fixtures", () => {
    const next = createEmptyNbaSnapshot();
    expect(preservePriorFixtures(next, null)).toBe(next);
    expect(preservePriorFixtures(next, createEmptyNbaSnapshot())).toBe(next);
  });
});
