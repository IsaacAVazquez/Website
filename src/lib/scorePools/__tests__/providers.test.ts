/**
 * @jest-environment node
 */
import { fetchApiFootballFixtures } from "../providers/apiFootball";
import { fetchTheOddsApiEvents } from "../providers/theOddsApi";

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

// The envelope is the one v3.football.api-sports.io returns: `errors` is an
// empty array on success and an object keyed by error kind on a refusal.
function apiFootballEnvelope(overrides: Record<string, unknown>) {
  return {
    get: "fixtures",
    parameters: { league: "39", season: "2026" },
    errors: [],
    results: 0,
    paging: { current: 1, total: 1 },
    response: [],
    ...overrides,
  };
}

const apiFootballFixture = {
  fixture: { id: 1208021, date: "2026-10-10T14:00:00+00:00", status: { short: "NS" } },
  league: { round: "Regular Season - 7" },
  teams: { home: { name: "Arsenal" }, away: { name: "Everton" } },
  goals: { home: null, away: null },
  score: {
    fulltime: { home: null, away: null },
    extratime: { home: null, away: null },
    penalty: { home: null, away: null },
  },
};

const oddsApiEvent = {
  id: "e1",
  sport_key: "soccer_epl",
  commence_time: "2026-10-10T14:00:00Z",
  home_team: "Arsenal",
  away_team: "Everton",
  bookmakers: [
    {
      key: "williamhill",
      title: "William Hill",
      markets: [
        {
          key: "h2h",
          outcomes: [
            { name: "Arsenal", price: 1.4 },
            { name: "Everton", price: 7.5 },
            { name: "Draw", price: 4.6 },
          ],
        },
      ],
    },
    {
      key: "pinnacle",
      title: "Pinnacle",
      markets: [
        {
          key: "h2h",
          outcomes: [
            { name: "Arsenal", price: 1.45 },
            { name: "Everton", price: 7.9 },
            { name: "Draw", price: 4.8 },
          ],
        },
        {
          key: "totals",
          outcomes: [
            { name: "Over", price: 1.85, point: 2.5 },
            { name: "Under", price: 2.02, point: 2.5 },
          ],
        },
      ],
    },
  ],
};

describe("API-Football adapter", () => {
  it("throws the provider's message when a 200 response carries an errors object", async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse(
        apiFootballEnvelope({
          errors: {
            plan: "Free plans do not have access to this season, try from 2022 to 2024.",
          },
        }),
      ),
    );

    await expect(
      fetchApiFootballFixtures(39, 2026, "test-key", fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow(/Free plans do not have access to this season, try from 2022 to 2024\./);
  });

  it("throws when the errors body is a non-empty array", async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse(apiFootballEnvelope({ errors: ["The season field is required."] })),
    );

    await expect(
      fetchApiFootballFixtures(39, 2026, "test-key", fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow(/The season field is required\./);
  });

  it("maps fixtures when the errors body is empty", async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse(apiFootballEnvelope({ results: 1, response: [apiFootballFixture] })),
    );

    const fixtures = await fetchApiFootballFixtures(
      39,
      2026,
      "test-key",
      fetchImpl as unknown as typeof fetch,
    );

    expect(fixtures).toEqual([
      {
        id: "af-1208021",
        kickoff: "2026-10-10T14:00:00.000Z",
        homeTeam: "Arsenal",
        awayTeam: "Everton",
        round: "Regular Season - 7",
        status: "scheduled",
        result: null,
      },
    ]);
  });

  it("sends a request timeout", async () => {
    const fetchImpl = jest.fn(async (_url: string, _init?: RequestInit) =>
      jsonResponse(apiFootballEnvelope({})),
    );

    await fetchApiFootballFixtures(39, 2026, "test-key", fetchImpl as unknown as typeof fetch);

    expect(fetchImpl.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("The Odds API adapter", () => {
  it("sends a request timeout", async () => {
    const fetchImpl = jest.fn(async (_url: string, _init?: RequestInit) => jsonResponse([]));

    await fetchTheOddsApiEvents("soccer_epl", "test-key", fetchImpl as unknown as typeof fetch);

    expect(fetchImpl.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("asks for the eu region only, which costs 2 credits a request", async () => {
    const fetchImpl = jest.fn(async (_url: string, _init?: RequestInit) => jsonResponse([]));

    await fetchTheOddsApiEvents("soccer_epl", "test-key", fetchImpl as unknown as typeof fetch);

    const url = new URL(fetchImpl.mock.calls[0][0]);
    expect(url.searchParams.get("regions")).toBe("eu");
    expect(url.searchParams.get("markets")).toBe("h2h,totals");
  });

  it("reduces an eu response to the sharpest book's three way prices and totals", async () => {
    const fetchImpl = jest.fn(async () => jsonResponse([oddsApiEvent]));

    const events = await fetchTheOddsApiEvents(
      "soccer_epl",
      "test-key",
      fetchImpl as unknown as typeof fetch,
    );

    expect(events).toEqual([
      {
        homeTeam: "Arsenal",
        awayTeam: "Everton",
        commenceTime: "2026-10-10T14:00:00Z",
        bookmaker: "pinnacle",
        moneyline: { home: 1.45, draw: 4.8, away: 7.9 },
        totals: { line: 2.5, over: 1.85, under: 2.02 },
      },
    ]);
  });
});
