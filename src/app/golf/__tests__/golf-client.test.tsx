import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GolfPlayerSnapshot, GolfSummary } from "@/types/golf";
import { GolfClient } from "../golf-client";
import { DEFAULT_GOLF_STATE } from "../golf-state";

// The golf snapshot in src/data is refreshed by an automated job, so importing
// it directly would couple these tests to whichever tournament happens to be
// live and break CI on every refresh. A fixed in-test fixture keeps the tests
// deterministic regardless of the committed snapshot.
const testSummary: GolfSummary = {
  tournament: {
    id: "harbour-town-classic-2026",
    name: "Harbour Town Classic",
    tour: "PGA Tour",
    course: "Harbour Town Golf Links",
    coursePar: 71,
    location: "Hilton Head Island, South Carolina",
    startDate: "2026-04-16",
    endDate: "2026-04-19",
    roundLabel: "Round 2 complete",
    status: "Cut line is set and Saturday pairings are next.",
    fieldSize: 132,
    cutLine: -1,
    cutState: "made",
    cutCount: 76,
    generatedAt: "2026-04-16T19:05:00.000Z",
  },
  heroStats: {
    leaderName: "Scottie Scheffler",
    leaderScore: -8,
    playersUnderPar: 40,
    cutLine: -1,
    cutState: "made",
    cutCount: 76,
    fieldSize: 132,
  },
  leaderboard: [
    {
      playerId: "scottie-scheffler",
      playerName: "Scottie Scheffler",
      country: "United States",
      position: "1",
      totalToPar: -8,
      today: -3,
      thru: "F",
      status: "In clubhouse",
      roundScores: [66, 68],
      movement: 2,
    },
    {
      playerId: "justin-thomas",
      playerName: "Justin Thomas",
      country: "United States",
      position: "T2",
      totalToPar: -6,
      today: -2,
      thru: "F",
      status: "In clubhouse",
      roundScores: [67, 69],
      movement: 1,
    },
  ],
  players: [
    { id: "scottie-scheffler", name: "Scottie Scheffler", country: "United States", position: "1" },
    { id: "justin-thomas", name: "Justin Thomas", country: "United States", position: "T2" },
  ],
};

const testPlayerSnapshots: Record<string, GolfPlayerSnapshot> = {
  "scottie-scheffler": {
    player: { id: "scottie-scheffler", name: "Scottie Scheffler", country: "United States" },
    tournamentStatus: {
      position: "1",
      totalToPar: -8,
      today: -3,
      thru: "F",
      status: "In clubhouse",
      movement: 2,
      nextTeeTime: null,
    },
    roundByRound: [
      { round: 1, score: 66, relativeToPar: -5 },
      { round: 2, score: 68, relativeToPar: -3 },
    ],
    scoring: { birdies: 11, bogeys: 3, pars: 22, eagles: 1, doubleBogeys: 0 },
    generatedAt: "2026-04-16T19:05:00.000Z",
  },
  "justin-thomas": {
    player: { id: "justin-thomas", name: "Justin Thomas", country: "United States" },
    tournamentStatus: {
      position: "T2",
      totalToPar: -6,
      today: -2,
      thru: "F",
      status: "Tee time set",
      movement: 1,
      nextTeeTime: "12:20 PM ET",
    },
    roundByRound: [
      { round: 1, score: 67, relativeToPar: -4 },
      { round: 2, score: 69, relativeToPar: -2 },
    ],
    scoring: { birdies: 9, bogeys: 3, pars: 24, eagles: 0, doubleBogeys: 0 },
    generatedAt: "2026-04-16T19:05:00.000Z",
  },
};

const mockPush = jest.fn();
const mockReplace = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function getPlayerSnapshot(playerId: string) {
  const snapshot = testPlayerSnapshots[playerId];

  if (!snapshot) {
    throw new Error(`Missing player snapshot for ${playerId}`);
  }

  return snapshot;
}

function makeOkResponse(payload: object) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  };
}

describe("GolfClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
    mockFetch.mockReset();
  });

  it("renders the hero shell with the default leaderboard selection", () => {
    render(
      <GolfClient
        initialState={DEFAULT_GOLF_STATE}
        summary={testSummary}
        initialPlayerSnapshot={getPlayerSnapshot("scottie-scheffler")}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "PGA Tour Pulse" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Harbour Town Classic" })).toBeInTheDocument();
    // A plain visit marks the leader's row and opens no drawer.
    const board = screen.getByRole("region", { name: /full leaderboard/i });
    expect(within(board).getByRole("row", { name: /Scottie Scheffler/ })).toHaveAttribute(
      "aria-current",
      "true"
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(/This page is a checked-in tournament snapshot/i)).toBeInTheDocument();
  });

  it("hides the scoring split when the feed sent no hole counts", () => {
    const scottie = getPlayerSnapshot("scottie-scheffler");
    // The split is in the player drawer, which a link that names a player opens.
    currentSearchParams = new URLSearchParams("player=scottie-scheffler");
    render(
      <GolfClient
        initialState={DEFAULT_GOLF_STATE}
        summary={testSummary}
        initialPlayerSnapshot={{
          ...scottie,
          scoring: { birdies: 0, bogeys: 0, pars: 0, eagles: 0, doubleBogeys: 0 },
        }}
      />
    );

    expect(screen.queryByText("Birdies")).not.toBeInTheDocument();
    expect(screen.getByText(/no birdie, par, or bogey counts for this event/i)).toBeInTheDocument();
  });

  it("updates the route when the user changes views or selects another player", async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams("view=players");

    render(
      <GolfClient
        initialState={DEFAULT_GOLF_STATE}
        summary={testSummary}
        initialPlayerSnapshot={getPlayerSnapshot("scottie-scheffler")}
      />
    );

    await user.click(screen.getByRole("tab", { name: "Leaderboard" }));

    expect(mockPush).toHaveBeenCalledWith("/golf", {
      scroll: false,
    });

    await user.click(screen.getByRole("button", { name: /Justin Thomas/i }));

    expect(mockPush).toHaveBeenCalledWith("/golf?view=players&player=justin-thomas", {
      scroll: false,
    });
  });

  it("canonicalizes invalid player params back to a clean golf URL", async () => {
    currentSearchParams = new URLSearchParams("player=bad-id");

    render(
      <GolfClient
        initialState={DEFAULT_GOLF_STATE}
        summary={testSummary}
        initialPlayerSnapshot={getPlayerSnapshot("scottie-scheffler")}
      />
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/golf", {
        scroll: false,
      })
    );
  });

  it("lazy-loads a deep-linked player snapshot when it was not preloaded", async () => {
    currentSearchParams = new URLSearchParams("player=justin-thomas");
    mockFetch.mockResolvedValue(makeOkResponse(getPlayerSnapshot("justin-thomas")));

    render(
      <GolfClient
        initialState={DEFAULT_GOLF_STATE}
        summary={testSummary}
        initialPlayerSnapshot={null}
      />
    );

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith("/api/golf/players/justin-thomas", expect.any(Object))
    );

    await waitFor(() =>
      expect(screen.getByText(/Next round tee time 12:20 PM ET/i)).toBeInTheDocument()
    );

    expect(screen.getByRole("heading", { level: 2, name: "Justin Thomas" })).toBeInTheDocument();
  });

  it("shows the player detail error state when the API request fails", async () => {
    currentSearchParams = new URLSearchParams("player=justin-thomas");
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        error: "Unable to load golf player snapshot.",
      }),
    });

    render(
      <GolfClient
        initialState={DEFAULT_GOLF_STATE}
        summary={testSummary}
        initialPlayerSnapshot={null}
      />
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Unable to load golf player snapshot.")
    );
  });

  it("opens the picked player in a drawer and returns focus on Escape", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue(makeOkResponse(getPlayerSnapshot("justin-thomas")));
    // The router is a mock, so a push has to be fed back in as the next
    // search params for the page to see the URL it asked for.
    mockPush.mockImplementation((href: string) => {
      currentSearchParams = new URLSearchParams(href.split("?")[1] ?? "");
    });
    const ui = () => (
      <GolfClient
        initialState={DEFAULT_GOLF_STATE}
        summary={testSummary}
        initialPlayerSnapshot={getPlayerSnapshot("scottie-scheffler")}
      />
    );
    const view = render(ui());

    const opener = screen.getByRole("button", { name: /Justin Thomas/i });
    await user.click(opener);
    view.rerender(ui());

    const drawer = await screen.findByRole("dialog", { name: "Justin Thomas detail" });
    await waitFor(() =>
      expect(within(drawer).getByText(/Next round tee time 12:20 PM ET/i)).toBeInTheDocument()
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("prints the first 20 players and the whole field on request", async () => {
    const user = userEvent.setup();
    const field = Array.from({ length: 25 }, (_, index) => ({
      ...testSummary.leaderboard[0]!,
      playerId: `player-${index + 1}`,
      playerName: `Player ${index + 1}`,
      position: `${index + 1}`,
    }));
    const board = () => screen.getByRole("region", { name: /full leaderboard/i });

    render(
      <GolfClient
        initialState={DEFAULT_GOLF_STATE}
        summary={{ ...testSummary, leaderboard: field }}
        initialPlayerSnapshot={null}
      />
    );

    expect(within(board()).getAllByRole("button")).toHaveLength(20);

    await user.click(screen.getByRole("button", { name: "Show all 25 players" }));
    expect(within(board()).getAllByRole("button")).toHaveLength(25);

    await user.click(screen.getByRole("button", { name: "Show the top 20" }));
    expect(within(board()).getAllByRole("button")).toHaveLength(20);
  });
});
