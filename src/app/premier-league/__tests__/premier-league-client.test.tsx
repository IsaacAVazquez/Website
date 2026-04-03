import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PremierLeagueClient } from "../premier-league-client";
import { DEFAULT_PREMIER_LEAGUE_STATE } from "../premier-league-state";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockFetch = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => true,
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
global.fetch = mockFetch as unknown as typeof fetch;

function createJsonResponse(body: unknown, init?: ResponseInit) {
  return Promise.resolve(
    {
      ok: (init?.status ?? 200) >= 200 && (init?.status ?? 200) < 300,
      status: init?.status ?? 200,
      json: async () => body,
    } as Response
  );
}

function flushPromises() {
  return act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

const summaryPayload = {
  competition: {
    code: "PL",
    name: "Premier League",
    areaName: "England",
    emblem: null,
    seasonLabel: "2025/26",
    currentMatchday: 31,
    winner: null,
  },
  standings: [
    {
      position: 1,
      playedGames: 31,
      won: 22,
      draw: 5,
      lost: 4,
      points: 71,
      goalsFor: 70,
      goalsAgainst: 28,
      goalDifference: 42,
      team: {
        id: "57",
        name: "Arsenal FC",
        shortName: "Arsenal",
        tla: "ARS",
        crest: null,
        venue: "Emirates Stadium",
      },
    },
    {
      position: 2,
      playedGames: 31,
      won: 21,
      draw: 6,
      lost: 4,
      points: 69,
      goalsFor: 68,
      goalsAgainst: 30,
      goalDifference: 38,
      team: {
        id: "65",
        name: "Manchester City FC",
        shortName: "Man City",
        tla: "MCI",
        crest: null,
        venue: "Etihad Stadium",
      },
    },
  ],
  recentFixtures: [
    {
      id: "1001",
      utcDate: "2026-04-02T18:45:00.000Z",
      status: "FINISHED",
      matchday: 31,
      stage: "REGULAR_SEASON",
      homeTeam: {
        id: "57",
        name: "Arsenal FC",
        shortName: "Arsenal",
        tla: "ARS",
        crest: null,
      },
      awayTeam: {
        id: "61",
        name: "Chelsea FC",
        shortName: "Chelsea",
        tla: "CHE",
        crest: null,
      },
      score: {
        winner: "HOME_TEAM" as const,
        home: 2,
        away: 1,
      },
    },
  ],
  upcomingFixtures: [
    {
      id: "1002",
      utcDate: "2026-04-09T16:30:00.000Z",
      status: "SCHEDULED",
      matchday: 32,
      stage: "REGULAR_SEASON",
      homeTeam: {
        id: "65",
        name: "Manchester City FC",
        shortName: "Man City",
        tla: "MCI",
        crest: null,
      },
      awayTeam: {
        id: "57",
        name: "Arsenal FC",
        shortName: "Arsenal",
        tla: "ARS",
        crest: null,
      },
      score: {
        winner: null,
        home: null,
        away: null,
      },
    },
  ],
  teams: [
    {
      id: "57",
      name: "Arsenal FC",
      shortName: "Arsenal",
      tla: "ARS",
      crest: null,
      venue: "Emirates Stadium",
    },
    {
      id: "65",
      name: "Manchester City FC",
      shortName: "Man City",
      tla: "MCI",
      crest: null,
      venue: "Etihad Stadium",
    },
  ],
  generatedAt: "2026-04-03T00:00:00.000Z",
};

const teamPayload = {
  team: {
    id: "57",
    name: "Arsenal FC",
    shortName: "Arsenal",
    tla: "ARS",
    crest: null,
    venue: "Emirates Stadium",
    founded: 1886,
    clubColors: "Red / White",
    website: "https://www.arsenal.com",
    address: null,
  },
  recentFixtures: summaryPayload.recentFixtures,
  upcomingFixtures: summaryPayload.upcomingFixtures,
  form: {
    sequence: ["W", "D", "W", "L", "W"],
    wins: 3,
    draws: 1,
    losses: 1,
    points: 10,
    goalsFor: 9,
    goalsAgainst: 5,
  },
  generatedAt: "2026-04-03T00:00:00.000Z",
};

describe("PremierLeagueClient", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
    mockFetch.mockReset();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("hydrates from URL params and preserves the selected club across tab switches", async () => {
    currentSearchParams = new URLSearchParams("view=team&team=57");
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/premier-league/summary")) {
        return createJsonResponse(summaryPayload);
      }

      if (url.includes("/api/premier-league/teams/57")) {
        return createJsonResponse(teamPayload);
      }

      throw new Error(`Unhandled request: ${url}`);
    });

    await act(async () => {
      root.render(<PremierLeagueClient initialState={DEFAULT_PREMIER_LEAGUE_STATE} />);
    });
    await flushPromises();

    expect(container.querySelector('[data-testid="premier-league-selected-team"]')?.textContent).toBe(
      "Arsenal FC"
    );

    await act(async () => {
      const button = Array.from(container.querySelectorAll('button[role="tab"]')).find((tab) =>
        tab.textContent?.includes("Fixtures")
      ) as HTMLButtonElement | undefined;
      button?.click();
    });

    expect(mockPush).toHaveBeenCalledWith("/premier-league?view=fixtures&team=57", {
      scroll: false,
    });
  });

  it("canonicalizes invalid query params back to the default route", async () => {
    currentSearchParams = new URLSearchParams("view=bad&team=invalid");
    mockFetch.mockResolvedValue(createJsonResponse(summaryPayload));

    await act(async () => {
      root.render(<PremierLeagueClient initialState={DEFAULT_PREMIER_LEAGUE_STATE} />);
    });
    await flushPromises();

    expect(mockReplace).toHaveBeenCalledWith("/premier-league", { scroll: false });
  });

  it("loads the selected club after a team picker change and shows the loading state", async () => {
    let resolveTeamRequest: ((value: Response) => void) | null = null;

    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/premier-league/summary")) {
        return createJsonResponse(summaryPayload);
      }

      if (url.includes("/api/premier-league/teams/57")) {
        return new Promise<Response>((resolve) => {
          resolveTeamRequest = resolve;
        });
      }

      throw new Error(`Unhandled request: ${url}`);
    });

    await act(async () => {
      root.render(<PremierLeagueClient initialState={DEFAULT_PREMIER_LEAGUE_STATE} />);
    });
    await flushPromises();

    await act(async () => {
      const button = Array.from(container.querySelectorAll('button[role="tab"]')).find((tab) =>
        tab.textContent?.includes("Club View")
      ) as HTMLButtonElement | undefined;
      button?.click();
    });

    expect(mockPush).toHaveBeenCalledWith("/premier-league?view=team", {
      scroll: false,
    });

    currentSearchParams = new URLSearchParams("view=team");
    await act(async () => {
      root.render(<PremierLeagueClient initialState={DEFAULT_PREMIER_LEAGUE_STATE} />);
    });
    await flushPromises();

    await act(async () => {
      const select = container.querySelector(
        '[data-testid="premier-league-team-select"]'
      ) as HTMLSelectElement | null;
      if (!select) {
        throw new Error("Missing team select");
      }

      select.value = "57";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(mockPush).toHaveBeenCalledWith("/premier-league?view=team&team=57", {
      scroll: false,
    });

    currentSearchParams = new URLSearchParams("view=team&team=57");
    await act(async () => {
      root.render(<PremierLeagueClient initialState={DEFAULT_PREMIER_LEAGUE_STATE} />);
    });

    expect(container.textContent).toContain("Loading club snapshot...");

    await act(async () => {
      resolveTeamRequest?.({
        ok: true,
        status: 200,
        json: async () => teamPayload,
      } as Response);
    });
    await flushPromises();

    expect(container.querySelector('[data-testid="premier-league-selected-team"]')?.textContent).toBe(
      "Arsenal FC"
    );
  });

  it("renders the summary error state when the internal API fails", async () => {
    mockFetch.mockResolvedValue(
      {
        ok: false,
        status: 503,
        json: async () => ({
          error: "Premier League data source is not configured.",
        }),
      } as Response
    );

    await act(async () => {
      root.render(<PremierLeagueClient initialState={DEFAULT_PREMIER_LEAGUE_STATE} />);
    });
    await flushPromises();

    expect(container.textContent).toContain("Unable to load Premier League data.");
    expect(container.textContent).toContain("Premier League data source is not configured.");
  });
});
