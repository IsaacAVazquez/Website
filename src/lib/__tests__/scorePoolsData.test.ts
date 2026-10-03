/**
 * @jest-environment node
 */
import {
  appendOddsEntry,
  buildScorePoolsSnapshotData,
  normalizeTeamName,
  MAX_ODDS_HISTORY,
  type ScorePoolLeagueSource,
} from "../scorePoolsData";
import {
  manualOddsToEntry,
  parseScorePoolsCsv,
} from "../scorePools/providers/manual";
import type {
  ScorePoolLeagueSnapshot,
  ScorePoolsSnapshot,
  SnapshotFixture,
  SnapshotOddsEntry,
} from "@/types/scorePools";

function entry(home: number, fetchedAt: string): SnapshotOddsEntry {
  return {
    fetchedAt,
    bookmaker: "book",
    manual: false,
    moneyline: { home, draw: 3.2, away: 2.9 },
    totals: { line: 2.5, over: 1.9, under: 1.9 },
  };
}

describe("team name normalization (tiered exact, never fuzzy)", () => {
  it("strips punctuation, diacritics, and club suffixes", () => {
    expect(normalizeTeamName("Atlético Madrid")).toBe("atletico madrid");
    expect(normalizeTeamName("Brighton & Hove Albion FC")).toBe("brighton hove albion");
    expect(normalizeTeamName("A.F.C. Bournemouth")).toBe("a f c bournemouth");
    expect(normalizeTeamName("Sevilla FC")).toBe(normalizeTeamName("Sevilla"));
  });

  it("does not equate genuinely different names", () => {
    expect(normalizeTeamName("Manchester United")).not.toBe(
      normalizeTeamName("Manchester City"),
    );
  });
});

describe("odds history append", () => {
  it("appends when prices move and keeps the old entry", () => {
    const history = appendOddsEntry([entry(2.6, "t1")], entry(2.5, "t2"));
    expect(history).toHaveLength(2);
    expect(history[0].moneyline.home).toBe(2.6);
    expect(history[1].moneyline.home).toBe(2.5);
  });

  it("refreshes the timestamp instead of duplicating unchanged prices", () => {
    const history = appendOddsEntry([entry(2.6, "t1")], entry(2.6, "t2"));
    expect(history).toHaveLength(1);
    expect(history[0].fetchedAt).toBe("t2");
  });

  it("caps the history at the newest entries", () => {
    let history: SnapshotOddsEntry[] = [];
    for (let i = 0; i < MAX_ODDS_HISTORY + 10; i++) {
      history = appendOddsEntry(history, entry(2 + i * 0.01, `t${i}`));
    }
    expect(history).toHaveLength(MAX_ODDS_HISTORY);
    expect(history[history.length - 1].fetchedAt).toBe(`t${MAX_ODDS_HISTORY + 9}`);
  });
});

describe("manual odds conversion", () => {
  it("converts non-decimal formats at entry time", () => {
    // One format per entry, applied to every price in it.
    const american = manualOddsToEntry(
      { moneyline: { home: "+150", draw: "+240", away: "-120" }, format: "american" },
      "now",
    );
    expect(american.moneyline.home).toBeCloseTo(2.5, 10);
    expect(american.moneyline.draw).toBeCloseTo(3.4, 10);
    expect(american.manual).toBe(true);
    expect(american.fetchedAt).toBe("now");

    const fractional = manualOddsToEntry(
      { moneyline: { home: "6/4", draw: "12/5", away: "15/8" }, format: "fractional" },
      "now",
    );
    expect(fractional.moneyline.home).toBeCloseTo(2.5, 10);
    expect(fractional.moneyline.draw).toBeCloseTo(3.4, 10);
  });

  it("keeps two-way markets two-way", () => {
    const converted = manualOddsToEntry({ moneyline: { home: 1.8, away: 2.1 } }, "now");
    expect(converted.moneyline.draw).toBeNull();
    expect(converted.totals).toBeNull();
  });
});

describe("CSV fallback parsing", () => {
  const header =
    "fixtureId,homeTeam,awayTeam,kickoff,knockout,stage,mlHome,mlDraw,mlAway,totalLine,totalOver,totalUnder,format,bookmaker,fetchedAt";

  it("parses fixtures with odds from a well-formed sheet", () => {
    const rows = parseScorePoolsCsv(
      [
        header,
        "f1,Alpha,Beta,2026-08-01T19:00:00Z,true,Semifinal,2.4,3.2,3.1,2.5,1.95,1.87,decimal,book,2026-07-30T09:00:00Z",
        "f2,Gamma,Delta,2026-08-02T19:00:00Z,,,1.5,4.2,7.0,,,,,,",
      ].join("\n"),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].knockout).toBe(true);
    expect(rows[0].odds?.totals?.line).toBe(2.5);
    expect(rows[1].knockout).toBe(false);
    expect(rows[1].odds?.totals).toBeUndefined();
  });

  it("fails loudly on missing required columns or cells", () => {
    expect(() => parseScorePoolsCsv("homeTeam,awayTeam\nA,B")).toThrow(/fixtureId/);
    expect(() =>
      parseScorePoolsCsv([header, "f1,Alpha,,2026-08-01T19:00:00Z,,,2.4,3.2,3.1,,,,,,"].join("\n")),
    ).toThrow(/row 2/);
  });

  it("ignores comments and blank lines", () => {
    const rows = parseScorePoolsCsv(
      ["# hand-entered before the semi", header, "", "f1,Alpha,Beta,2026-08-01T19:00:00Z,,,2.4,3.2,3.1,,,,,,"].join(
        "\n",
      ),
    );
    expect(rows).toHaveLength(1);
  });
});

// ─── Snapshot build orchestration ────────────────────────────────────────────

const NOW = "2026-08-01T12:00:00.000Z";
const minutesFromNow = (minutes: number) =>
  new Date(new Date(NOW).getTime() + minutes * 60_000).toISOString();

type Route = unknown[] | Error | string | number;

interface Routes {
  fixtures?: Route;
  standings?: Route;
  injuries?: Route;
  lineups?: Route;
  odds?: Route;
}

function routeResponse(route: Route | undefined, wrap: boolean): Response {
  if (route instanceof Error || typeof route === "string") throw route;
  if (typeof route === "number") return new Response("", { status: route });
  const body = wrap ? { errors: [], response: route ?? [] } : (route ?? []);
  return new Response(JSON.stringify(body), { status: 200 });
}

/** Answers each provider endpoint from `routes`, so the real adapters run. */
function routerFetch(routes: Routes) {
  return jest.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("the-odds-api.com")) return routeResponse(routes.odds, false);
    if (url.includes("/fixtures/lineups")) return routeResponse(routes.lineups, true);
    if (url.includes("/fixtures?")) return routeResponse(routes.fixtures, true);
    if (url.includes("/standings")) return routeResponse(routes.standings, true);
    if (url.includes("/injuries")) return routeResponse(routes.injuries, true);
    throw new Error(`unexpected url ${url}`);
  });
}

function apiFixture(
  id: number,
  kickoff: string,
  home: string,
  away: string,
  options: { short?: string; round?: string; score?: [number, number] } = {},
) {
  const goals = options.score
    ? { home: options.score[0], away: options.score[1] }
    : { home: null, away: null };
  return {
    fixture: { id, date: kickoff, status: { short: options.short ?? "NS" } },
    league: { round: options.round ?? "Regular Season - 1" },
    teams: { home: { name: home }, away: { name: away } },
    goals,
    score: {
      fulltime: goals,
      extratime: { home: null, away: null },
      penalty: { home: null, away: null },
    },
  };
}

function oddsEvent(home: string, away: string, commence: string, homePrice = 2.1) {
  return {
    id: `${home}-${away}`,
    commence_time: commence,
    home_team: home,
    away_team: away,
    bookmakers: [
      {
        key: "pinnacle",
        title: "Pinnacle",
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: home, price: homePrice },
              { name: away, price: 3.6 },
              { name: "Draw", price: 3.3 },
            ],
          },
          {
            key: "totals",
            outcomes: [
              { name: "Over", price: 1.9, point: 2.5 },
              { name: "Under", price: 1.95, point: 2.5 },
            ],
          },
        ],
      },
    ],
  };
}

function source(overrides: Partial<ScorePoolLeagueSource> = {}): ScorePoolLeagueSource {
  return {
    key: "epl",
    name: "Premier League",
    sport: "soccer",
    season: "2026-27",
    theOddsApiSportKey: "soccer_epl",
    apiFootball: { leagueId: 39, season: 2026 },
    knockoutRoundPattern: null,
    teamAliases: {},
    ...overrides,
  };
}

function snapshotFixture(overrides: Partial<SnapshotFixture> = {}): SnapshotFixture {
  return {
    id: "af-3",
    kickoff: minutesFromNow(3 * 24 * 60),
    homeTeam: "Gamma",
    awayTeam: "Delta",
    stage: null,
    round: "Regular Season - 1",
    knockout: false,
    status: "scheduled",
    result: null,
    lineupsConfirmed: null,
    injuryNotes: [],
    odds: [],
    ...overrides,
  };
}

function previousLeague(overrides: Partial<ScorePoolLeagueSnapshot> = {}): ScorePoolLeagueSnapshot {
  return {
    key: "epl",
    name: "Premier League",
    sport: "soccer",
    season: "2026-27",
    sources: { fixtures: "API-Football", odds: "The Odds API" },
    generatedAt: "2026-07-31T12:00:00.000Z",
    sample: false,
    notes: [],
    fixtures: [],
    standings: [],
    ...overrides,
  };
}

const previousOf = (...leagues: ScorePoolLeagueSnapshot[]): ScorePoolsSnapshot => ({
  generatedAt: "2026-07-31T12:00:00.000Z",
  leagues,
});

const KEYS = { theOddsApi: "odds-key", apiFootball: "af-key" };

function build(overrides: Partial<Parameters<typeof buildScorePoolsSnapshotData>[0]> = {}) {
  return buildScorePoolsSnapshotData({
    leagues: [source()],
    manualLeagues: [],
    csvFixturesByLeague: {},
    previous: null,
    keys: KEYS,
    now: NOW,
    ...overrides,
  });
}

describe("buildScorePoolsSnapshotData, provider leagues", () => {
  it("assembles fixtures, results, standings, odds, injuries, and imminent lineups", async () => {
    const eleven = Array.from({ length: 11 }, (_, i) => ({ player: { id: i } }));
    const fetchImpl = routerFetch({
      fixtures: [
        apiFixture(3, minutesFromNow(3 * 24 * 60), "Gamma", "Delta", { round: "Quarter-finals" }),
        apiFixture(1, minutesFromNow(60), "Alpha", "Beta"),
        apiFixture(2, minutesFromNow(-24 * 60), "Alpha", "Delta", { short: "FT", score: [2, 1] }),
      ],
      standings: [
        {
          league: {
            standings: [[{ rank: 1, team: { name: "Alpha" }, points: 3, all: { played: 1 } }]],
          },
        },
      ],
      injuries: [
        { player: { name: "A1", reason: "Knee" }, team: { name: "Alpha" } },
        { player: { name: "B1" }, team: { name: "Beta" } },
      ],
      lineups: [
        { team: { name: "Alpha" }, startXI: eleven },
        { team: { name: "Beta" }, startXI: eleven },
      ],
      odds: [
        oddsEvent("Gamma FC", "Delta", minutesFromNow(3 * 24 * 60)),
        oddsEvent("Nobody", "Delta", minutesFromNow(3 * 24 * 60)),
      ],
    });

    const snapshot = await build({ fetchImpl: fetchImpl as unknown as typeof fetch });

    expect(snapshot.generatedAt).toBe(NOW);
    expect(snapshot.leagues).toHaveLength(1);
    const [league] = snapshot.leagues;
    expect(league).toMatchObject({
      key: "epl",
      name: "Premier League",
      sport: "soccer",
      season: "2026-27",
      sources: { fixtures: "API-Football", odds: "The Odds API" },
      generatedAt: NOW,
      sample: false,
    });
    expect(league.standings[0].rows[0].team).toBe("Alpha");
    // Sorted by kickoff.
    expect(league.fixtures.map((fixture) => fixture.id)).toEqual(["af-2", "af-1", "af-3"]);

    const [finished, imminent, later] = league.fixtures;
    expect(finished.status).toBe("finished");
    expect(finished.result?.ninetyMinutes).toEqual({ home: 2, away: 1 });
    // Injury notes only land on scheduled games.
    expect(finished.injuryNotes).toEqual([]);
    expect(imminent.injuryNotes).toEqual(["Alpha: A1 (Knee)", "Beta: B1"]);
    expect(imminent.lineupsConfirmed).toBe(true);
    expect(later.lineupsConfirmed).toBeNull();
    // The default knockout pattern reads the round name.
    expect(later.knockout).toBe(true);
    expect(imminent.knockout).toBe(false);
    // "Gamma FC" normalizes to "gamma", so the odds land without an alias.
    expect(later.odds).toEqual([
      {
        fetchedAt: NOW,
        bookmaker: "pinnacle",
        manual: false,
        moneyline: { home: 2.1, draw: 3.3, away: 3.6 },
        totals: { line: 2.5, over: 1.9, under: 1.95 },
      },
    ]);
    expect(league.notes).toEqual([
      "1 odds event(s) had no matching fixture; add teamAliases if names differ between providers.",
    ]);
    const lineupCalls = fetchImpl.mock.calls.filter(([url]) => String(url).includes("lineups"));
    expect(lineupCalls).toHaveLength(1);
    expect(String(lineupCalls[0][0])).toContain("fixture=1");
  });

  it("matches odds through team aliases and a custom knockout pattern", async () => {
    const fetchImpl = routerFetch({
      fixtures: [
        apiFixture(3, minutesFromNow(3 * 24 * 60), "Gamma", "Delta", { round: "Leg 2" }),
      ],
      odds: [oddsEvent("Gama", "Delta", minutesFromNow(3 * 24 * 60))],
    });
    const snapshot = await build({
      leagues: [source({ teamAliases: { Gama: "Gamma" }, knockoutRoundPattern: "leg" })],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const [fixture] = snapshot.leagues[0].fixtures;
    expect(fixture.knockout).toBe(true);
    expect(fixture.odds).toHaveLength(1);
    expect(snapshot.leagues[0].notes).toEqual([]);
  });

  it("drops odds more than 48 hours from kickoff and picks the nearest of two meetings", async () => {
    const first = minutesFromNow(2 * 24 * 60);
    const second = minutesFromNow(30 * 24 * 60);
    const fetchImpl = routerFetch({
      fixtures: [
        apiFixture(10, first, "Gamma", "Delta"),
        apiFixture(11, second, "Gamma", "Delta"),
      ],
      odds: [
        oddsEvent("Gamma", "Delta", minutesFromNow(30 * 24 * 60 + 60), 1.8),
        oddsEvent("Gamma", "Delta", minutesFromNow(15 * 24 * 60)),
      ],
    });
    const snapshot = await build({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const [early, late] = snapshot.leagues[0].fixtures;
    expect(early.odds).toEqual([]);
    expect(late.odds[0].moneyline.home).toBe(1.8);
    expect(snapshot.leagues[0].notes[0]).toMatch(/^1 odds event/);
  });

  it("caps lineup checks at five imminent provider fixtures and skips games too far either side", async () => {
    const fetchImpl = routerFetch({
      fixtures: [
        apiFixture(200, minutesFromNow(-20), "Late", "Kick"),
        ...[10, 20, 30, 40, 50, 60].map((offset, i) =>
          apiFixture(100 + i, minutesFromNow(offset), `Home${i}`, `Away${i}`),
        ),
        apiFixture(201, minutesFromNow(-40), "Too", "Old"),
        apiFixture(202, minutesFromNow(200), "Too", "Far"),
      ],
      lineups: [],
    });
    const snapshot = await build({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const lineupUrls = fetchImpl.mock.calls
      .map(([url]) => String(url))
      .filter((url) => url.includes("lineups"));
    expect(lineupUrls).toHaveLength(5);
    expect(lineupUrls.some((url) => url.includes("fixture=200"))).toBe(true);
    expect(lineupUrls.some((url) => url.includes("fixture=201"))).toBe(false);
    expect(lineupUrls.some((url) => url.includes("fixture=202"))).toBe(false);
    // Checked in provider order, so the sixth game inside the window is the one left out.
    expect(lineupUrls.some((url) => url.includes("fixture=105"))).toBe(false);
    const late = snapshot.leagues[0].fixtures.find((fixture) => fixture.id === "af-200");
    expect(late?.lineupsConfirmed).toBe(false);
  });

  it("caps combined injury notes at eight per fixture", async () => {
    const injuries = ["Alpha", "Beta"].flatMap((team) =>
      [1, 2, 3, 4, 5].map((n) => ({ player: { name: `${team}${n}` }, team: { name: team } })),
    );
    const fetchImpl = routerFetch({
      fixtures: [apiFixture(1, minutesFromNow(24 * 60), "Alpha", "Beta")],
      injuries,
    });
    const snapshot = await build({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const notes = snapshot.leagues[0].fixtures[0].injuryNotes;
    expect(notes).toHaveLength(8);
    expect(notes[0]).toBe("Alpha: Alpha1");
    expect(notes[7]).toBe("Beta: Beta3");
  });

  it("skips injuries and lineups quietly when those feeds fail", async () => {
    const fetchImpl = routerFetch({
      fixtures: [apiFixture(1, minutesFromNow(60), "Alpha", "Beta")],
      injuries: 403,
      lineups: new Error("lineups down"),
    });
    const snapshot = await build({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const [fixture] = snapshot.leagues[0].fixtures;
    expect(fixture.injuryNotes).toEqual([]);
    expect(fixture.lineupsConfirmed).toBeNull();
    expect(snapshot.leagues[0].notes).toEqual([]);
  });

  it("degrades to manual entry with notes when no provider keys are set", async () => {
    const fetchImpl = jest.fn();
    const snapshot = await build({
      keys: { theOddsApi: null, apiFootball: null },
      manualLeagues: [
        {
          key: "epl",
          name: "Premier League (manual)",
          fixtures: [
            {
              id: "m1",
              kickoff: minutesFromNow(60),
              homeTeam: "Alpha",
              awayTeam: "Beta",
              odds: { moneyline: { home: 2, draw: 3.2, away: 3.8 } },
            },
          ],
          standings: [{ group: null, rows: [] }],
        },
      ],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    const [league] = snapshot.leagues;
    expect(league.sources).toEqual({ fixtures: "manual entry", odds: "manual entry" });
    expect(league.notes).toEqual([
      "Live fixtures are not connected, so this league only shows games entered by hand.",
      "Live odds are not connected, so odds come from hand entries only.",
    ]);
    expect(league.fixtures.map((fixture) => fixture.id)).toEqual(["m1"]);
    expect(league.fixtures[0].odds[0].manual).toBe(true);
    expect(league.standings).toEqual([{ group: null, rows: [] }]);
  });

  it("adds no connection notes when a league has no provider configured", async () => {
    const snapshot = await build({
      leagues: [source({ apiFootball: null, theOddsApiSportKey: null })],
    });
    expect(snapshot.leagues[0].notes).toEqual([]);
    expect(snapshot.leagues[0].fixtures).toEqual([]);
  });

  it("keeps the previous league when the fixtures fetch fails, replacing any older failure note", async () => {
    const fetchImpl = routerFetch({ fixtures: 500 });
    const prior = previousLeague({
      notes: ["Refresh failed at yesterday; showing the previous snapshot.", "Season starts soon."],
      fixtures: [snapshotFixture()],
    });
    const snapshot = await build({
      previous: previousOf(prior),
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const [league] = snapshot.leagues;
    expect(league.fixtures).toEqual(prior.fixtures);
    expect(league.generatedAt).toBe(prior.generatedAt);
    expect(league.notes).toEqual([
      "Season starts soon.",
      `Refresh failed at ${NOW}; showing the previous snapshot. (API-Football responded 500 for /fixtures?league=39&season=2026)`,
    ]);
  });

  it("keeps the previous league when standings fail after fixtures succeed", async () => {
    const fetchImpl = routerFetch({
      fixtures: [apiFixture(1, minutesFromNow(60), "Alpha", "Beta")],
      standings: "standings exploded",
    });
    const prior = previousLeague({ fixtures: [snapshotFixture()] });
    const snapshot = await build({
      previous: previousOf(prior),
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(snapshot.leagues[0].fixtures).toEqual(prior.fixtures);
    expect(snapshot.leagues[0].notes[0]).toMatch(/\(standings exploded\)$/);
  });

  it("notes a fixtures failure and carries on with manual games when there is no previous league", async () => {
    const fetchImpl = routerFetch({ fixtures: "boom", odds: [] });
    const snapshot = await build({
      csvFixturesByLeague: {
        epl: [{ id: "csv1", kickoff: minutesFromNow(60), homeTeam: "Alpha", awayTeam: "Beta" }],
      },
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const [league] = snapshot.leagues;
    expect(league.notes).toEqual(["Fixtures fetch failed: boom"]);
    expect(league.sources).toEqual({ fixtures: "manual entry", odds: "The Odds API" });
    expect(league.fixtures.map((fixture) => fixture.id)).toEqual(["csv1"]);
  });

  it("reports thrown values that are not Error objects as text", async () => {
    const fetchImpl = routerFetch({ fixtures: new Error("af down"), odds: "odds offline" });
    const snapshot = await build({ fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(snapshot.leagues[0].notes).toEqual([
      "Fixtures fetch failed: af down",
      "Odds fetch failed: odds offline. Existing odds history is preserved.",
    ]);
    expect(snapshot.leagues[0].sources).toEqual({ fixtures: "manual entry", odds: "manual entry" });
  });

  it("notes an odds failure and keeps the existing history", async () => {
    const fetchImpl = routerFetch({
      fixtures: [apiFixture(3, minutesFromNow(3 * 24 * 60), "Gamma", "Delta")],
      odds: new Error("odds down"),
    });
    const priorOdds = entry(2.4, "2026-07-31T12:00:00.000Z");
    const snapshot = await build({
      previous: previousOf(previousLeague({ fixtures: [snapshotFixture({ odds: [priorOdds] })] })),
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const [league] = snapshot.leagues;
    expect(league.sources.odds).toBe("manual entry");
    expect(league.notes).toEqual([
      "Odds fetch failed: odds down. Existing odds history is preserved.",
    ]);
    expect(league.fixtures[0].odds).toEqual([priorOdds]);
  });

  it("replays this run's odds onto the previous history and carries lineups and injury notes forward", async () => {
    const kickoff = minutesFromNow(3 * 24 * 60);
    const soon = minutesFromNow(60);
    const eleven = Array.from({ length: 11 }, (_, i) => ({ player: { id: i } }));
    const fetchImpl = routerFetch({
      fixtures: [
        apiFixture(3, kickoff, "Gamma", "Delta"),
        apiFixture(4, soon, "Alpha", "Beta"),
      ],
      odds: [oddsEvent("Gamma", "Delta", kickoff, 2.0), oddsEvent("Alpha", "Beta", soon, 2.1)],
      injuries: [{ player: { name: "A9" }, team: { name: "Alpha" } }],
      lineups: [
        { team: { name: "Alpha" }, startXI: eleven },
        { team: { name: "Beta" }, startXI: eleven },
      ],
    });
    const changed = entry(2.4, "2026-07-31T12:00:00.000Z");
    const unchanged: SnapshotOddsEntry = {
      fetchedAt: "2026-07-31T12:00:00.000Z",
      bookmaker: "pinnacle",
      manual: false,
      moneyline: { home: 2.1, draw: 3.3, away: 3.6 },
      totals: { line: 2.5, over: 1.9, under: 1.95 },
    };
    const snapshot = await build({
      previous: previousOf(
        previousLeague({
          fixtures: [
            snapshotFixture({
              odds: [changed],
              lineupsConfirmed: true,
              injuryNotes: ["Gamma: G1"],
            }),
            snapshotFixture({
              id: "af-4",
              kickoff: soon,
              homeTeam: "Alpha",
              awayTeam: "Beta",
              odds: [unchanged],
              lineupsConfirmed: false,
              injuryNotes: ["Alpha: old note"],
            }),
          ],
        }),
      ),
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const [alpha, gamma] = snapshot.leagues[0].fixtures;
    expect(gamma.odds.map((odds) => odds.moneyline.home)).toEqual([2.4, 2.0]);
    // This run's lineups and injury notes win over the carried ones.
    expect(alpha.lineupsConfirmed).toBe(true);
    expect(alpha.injuryNotes).toEqual(["Alpha: A9"]);
    expect(gamma.lineupsConfirmed).toBe(true);
    expect(gamma.injuryNotes).toEqual(["Gamma: G1"]);
    // Unchanged prices refresh the timestamp instead of growing the history.
    expect(alpha.odds).toEqual([{ ...unchanged, fetchedAt: NOW }]);
  });

  it("merges manual entries into provider fixtures by id or by teams within 48 hours", async () => {
    const kickoff = minutesFromNow(3 * 24 * 60);
    const fetchImpl = routerFetch({
      fixtures: [
        apiFixture(3, kickoff, "Gamma", "Delta"),
        apiFixture(5, minutesFromNow(-24 * 60), "Alpha", "Beta", { short: "FT", score: [1, 0] }),
        apiFixture(6, minutesFromNow(-2 * 24 * 60), "Sevilla FC", "Betis"),
        apiFixture(7, minutesFromNow(-3 * 24 * 60), "Theta", "Iota"),
      ],
    });
    const snapshot = await build({
      keys: { apiFootball: "af-key", theOddsApi: null },
      manualLeagues: [
        {
          key: "epl",
          name: "ignored",
          fixtures: [
            // Same id: adds hand odds, overrides knockout.
            {
              id: "af-3",
              kickoff,
              homeTeam: "Gamma",
              awayTeam: "Delta",
              knockout: true,
              odds: { moneyline: { home: "+150", draw: "+220", away: "+180" }, format: "american" },
            },
            // Teams within 48h of a provider game that already has a result: result kept.
            {
              id: "manual-ab",
              kickoff: minutesFromNow(-23 * 60),
              homeTeam: "Alpha",
              awayTeam: "Beta",
              result: { ninetyMinutes: { home: 3, away: 3 } },
            },
            // Teams match after normalization; the provider has no result, so the manual one lands.
            {
              id: "manual-sb",
              kickoff: minutesFromNow(-2 * 24 * 60 + 30),
              homeTeam: "Sevilla",
              awayTeam: "Betis",
              result: {
                ninetyMinutes: { home: 1, away: 1 },
                afterExtraTime: { home: 2, away: 1 },
              },
            },
            // Shootout winner without an extra-time score.
            {
              id: "af-7",
              kickoff: minutesFromNow(-3 * 24 * 60),
              homeTeam: "Theta",
              awayTeam: "Iota",
              result: { ninetyMinutes: { home: 0, away: 0 }, penaltyWinner: "away" },
            },
            // No match anywhere: appended as its own fixture.
            { id: "manual-new", kickoff: minutesFromNow(10 * 24 * 60), homeTeam: "Eps", awayTeam: "Zeta" },
          ],
        },
      ],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const [league] = snapshot.leagues;
    const byId = new Map(league.fixtures.map((fixture) => [fixture.id, fixture]));
    expect(league.fixtures).toHaveLength(5);
    expect(byId.get("af-7")?.result).toEqual({
      ninetyMinutes: { home: 0, away: 0 },
      afterExtraTime: null,
      penaltyWinner: "away",
    });

    const gamma = byId.get("af-3");
    expect(gamma?.knockout).toBe(true);
    expect(gamma?.odds).toHaveLength(1);
    expect(gamma?.odds[0].manual).toBe(true);
    expect(gamma?.odds[0].moneyline.home).toBeCloseTo(2.5, 10);

    expect(byId.get("af-5")?.result?.ninetyMinutes).toEqual({ home: 1, away: 0 });

    const sevilla = byId.get("af-6");
    expect(sevilla?.status).toBe("finished");
    expect(sevilla?.result).toEqual({
      ninetyMinutes: { home: 1, away: 1 },
      afterExtraTime: { home: 2, away: 1 },
      penaltyWinner: null,
    });
    expect(byId.has("manual-new")).toBe(true);
    expect(league.notes).toContain("Result for Sevilla vs Betis came from a manual entry.");
    expect(league.notes).toContain("Live odds are not connected, so odds come from hand entries only.");
  });

  it("prefers provider standings over manual ones", async () => {
    const fetchImpl = routerFetch({
      fixtures: [],
      standings: [
        { league: { standings: [[{ rank: 1, team: { name: "Alpha" }, points: 3, all: { played: 1 } }]] } },
      ],
    });
    const snapshot = await build({
      keys: { apiFootball: "af-key", theOddsApi: null },
      manualLeagues: [
        { key: "epl", name: "x", fixtures: [], standings: [{ group: "manual", rows: [] }] },
      ],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(snapshot.leagues[0].standings[0].rows[0].team).toBe("Alpha");
  });
});

describe("buildScorePoolsSnapshotData, manual leagues", () => {
  it("builds manual-only leagues with defaults, CSV merges, and carried history", async () => {
    const priorOdds = entry(2.6, "2026-07-31T12:00:00.000Z");
    const snapshot = await build({
      leagues: [],
      manualLeagues: [
        {
          key: "cup",
          name: "Office Cup",
          notes: ["Hand-entered."],
          allKnockout: true,
          fixtures: [
            {
              id: "c2",
              kickoff: minutesFromNow(2 * 24 * 60),
              homeTeam: "Alpha",
              awayTeam: "Beta",
              result: { ninetyMinutes: { home: 0, away: 0 }, penaltyWinner: "home" },
            },
            { id: "c1", kickoff: minutesFromNow(24 * 60), homeTeam: "Gamma", awayTeam: "Delta" },
          ],
        },
      ],
      csvFixturesByLeague: {
        cup: [
          {
            id: "c1",
            kickoff: minutesFromNow(24 * 60),
            homeTeam: "Gamma",
            awayTeam: "Delta",
            knockout: false,
            odds: { moneyline: { home: 2.6, draw: 3.2, away: 2.9 }, totals: { line: 2.5, over: 1.9, under: 1.9 }, bookmaker: "book" },
          },
        ],
      },
      previous: previousOf(
        previousLeague({ key: "cup", fixtures: [snapshotFixture({ id: "c1", odds: [priorOdds] })] }),
      ),
    });
    const [league] = snapshot.leagues;
    expect(league).toMatchObject({
      key: "cup",
      name: "Office Cup",
      sport: "soccer",
      season: null,
      sources: { fixtures: "manual entry", odds: "manual entry" },
      generatedAt: NOW,
      sample: false,
      notes: ["Hand-entered."],
      standings: [],
    });
    expect(league.fixtures.map((fixture) => fixture.id)).toEqual(["c1", "c2"]);
    const [c1, c2] = league.fixtures;
    // CSV overrode knockout; the CSV prices matched the carried entry, so only the time moved.
    expect(c1.knockout).toBe(false);
    expect(c1.odds).toEqual([{ ...priorOdds, fetchedAt: NOW }]);
    expect(c2.knockout).toBe(true);
    expect(c2.status).toBe("finished");
    expect(c2.result?.penaltyWinner).toBe("home");
  });

  it("keeps explicit sport, season, sample, and standings", async () => {
    const snapshot = await build({
      leagues: [],
      manualLeagues: [
        {
          key: "demo",
          name: "Demo",
          sport: "hockey",
          season: "2026",
          sample: true,
          fixtures: [],
          standings: [{ group: "A", rows: [] }],
        },
      ],
    });
    expect(snapshot.leagues[0]).toMatchObject({
      sport: "hockey",
      season: "2026",
      sample: true,
      notes: [],
      standings: [{ group: "A", rows: [] }],
    });
  });

  it("builds a manual league only once when a provider league shares its key", async () => {
    const snapshot = await build({
      keys: { theOddsApi: null, apiFootball: null },
      manualLeagues: [{ key: "epl", name: "Manual EPL", fixtures: [] }],
    });
    expect(snapshot.leagues.map((league) => league.key)).toEqual(["epl"]);
    expect(snapshot.leagues[0].name).toBe("Premier League");
  });

  it("stamps the current time when no clock is injected", async () => {
    jest.useFakeTimers({ now: new Date("2026-09-01T00:00:00.000Z") });
    try {
      const snapshot = await buildScorePoolsSnapshotData({
        leagues: [],
        manualLeagues: [],
        csvFixturesByLeague: {},
        previous: null,
        keys: { theOddsApi: null, apiFootball: null },
      });
      expect(snapshot).toEqual({ generatedAt: "2026-09-01T00:00:00.000Z", leagues: [] });
    } finally {
      jest.useRealTimers();
    }
  });

  it("falls back to the global fetch when none is injected", async () => {
    const spy = jest
      .spyOn(global, "fetch")
      .mockImplementation(async () => new Response(JSON.stringify([]), { status: 200 }));
    try {
      const snapshot = await build({
        leagues: [source({ apiFootball: null })],
        keys: { theOddsApi: "odds-key", apiFootball: null },
      });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(snapshot.leagues[0].sources.odds).toBe("The Odds API");
    } finally {
      spy.mockRestore();
    }
  });
});
