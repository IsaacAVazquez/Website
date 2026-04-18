import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { golfSnapshot } from "@/data/golfSnapshot";
import { GolfClient } from "../golf-client";
import { DEFAULT_GOLF_STATE } from "../golf-state";

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
  const snapshot = golfSnapshot.playerSnapshots[playerId];

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
        summary={golfSnapshot.summary}
        initialPlayerSnapshot={getPlayerSnapshot("scottie-scheffler")}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "PGA Tour Pulse" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Harbour Town Classic" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Scottie Scheffler" })).toBeInTheDocument();
    expect(screen.getByText(/This page is a checked-in tournament snapshot/i)).toBeInTheDocument();
  });

  it("updates the route when the user changes views or selects another player", async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams("view=players");

    render(
      <GolfClient
        initialState={DEFAULT_GOLF_STATE}
        summary={golfSnapshot.summary}
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
        summary={golfSnapshot.summary}
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
        summary={golfSnapshot.summary}
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
        summary={golfSnapshot.summary}
        initialPlayerSnapshot={null}
      />
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Unable to load golf player snapshot.")
    );
  });
});
