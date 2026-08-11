import { fireEvent, render, screen, within } from "@testing-library/react";

import { BestBallClient } from "../best-ball-client";

const mockReplace = jest.fn();
const mockRetry = jest.fn();
const mockUseBestBallSnapshot = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => currentSearchParams,
}));

jest.mock("@/hooks/useBestBallSnapshot", () => ({
  useBestBallSnapshot: () => mockUseBestBallSnapshot(),
}));

const snapshot = {
  schemaVersion: 2,
  season: 2026,
  generatedAt: "2026-08-09T08:00:00.000Z",
  rankingSource: {
    provider: "FantasyPros",
    url: "https://www.fantasypros.com/nfl/rankings/best-ball-overall.php",
    asOf: "2026-08-08T22:20:10.000Z",
    expertCount: 6,
  },
  adpSource: {
    provider: "PPR Rankings",
    url: "https://pprrankings.com/rankings",
    asOf: "2026-08-08T12:00:00.000Z",
  },
  superflexSource: {
    provider: "FantasyPros",
    url: "https://www.fantasypros.com/nfl/rankings/half-point-ppr-superflex-cheatsheets.php",
    asOf: "2026-08-08T12:00:00.000Z",
  },
  scheduleSource: {
    provider: "ESPN",
    url: "https://www.espn.com/nfl/schedule/_/week/17/year/2026/seasontype/2",
    asOf: "2026-08-08T12:00:00.000Z",
  },
  week17Opponents: { BUF: "MIA", ATL: "NO" },
  players: [
    {
      id: "rb-1",
      name: "Bijan Robinson",
      team: "ATL",
      position: "RB",
      averageRank: 30,
      rankEcr: 30,
      positionRank: 1,
      standardDeviation: 1,
      byeWeek: 11,
      adp: 32,
      superflexRank: 7,
    },
    {
      id: "qb-1",
      name: "Josh Allen",
      team: "BUF",
      position: "QB",
      averageRank: 50,
      rankEcr: 50,
      positionRank: 1,
      standardDeviation: 1,
      byeWeek: 7,
      adp: 47,
      superflexRank: 1,
    },
  ],
};

describe("BestBallClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
    currentSearchParams = new URLSearchParams("contest=superflex");
    mockReplace.mockReset();
    mockRetry.mockReset();
    mockUseBestBallSnapshot.mockReturnValue({
      snapshot,
      isLoading: false,
      error: null,
      retry: mockRetry,
    });
  });

  it("renders the selected contest, moves quarterbacks for Superflex, and exposes the sourced fields", () => {
    const { container } = render(
      <BestBallClient initialState={{ contest: "superflex", position: "all", query: "" }} />,
    );

    expect(container.firstChild).toHaveClass("home-page");
    expect(screen.getByRole("button", { name: "Superflex" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Superflex view" })).toBeVisible();
    expect(screen.getAllByText("Week 17").length).toBeGreaterThan(0);

    const board = screen.getByRole("heading", { name: "Superflex view" }).closest("article");
    const rows = board?.querySelectorAll("ol > li");
    expect(rows).toHaveLength(2);
    expect(within(rows![0] as HTMLElement).getByText("Josh Allen")).toBeVisible();
    expect(within(rows![0] as HTMLElement).getAllByText("NA").length).toBeGreaterThan(0);
    expect(board).toHaveTextContent(/no Superflex room ADP/i);
    expect(
      screen.getByRole("link", { name: /Rankings from FantasyPros · 6 experts/ })
    ).toBeVisible();

    expect(
      screen.getByRole("link", { name: /Open Superflex draft assistant/i }),
    ).toHaveAttribute(
      "href",
      "/fantasy-football/best-ball/draft-tracker?contest=superflex",
    );
  });

  it("keeps contest and filters in the URL", () => {
    render(<BestBallClient initialState={{ contest: "superflex", position: "all", query: "" }} />);

    fireEvent.click(screen.getByRole("button", { name: "Puppy" }));
    expect(mockReplace).toHaveBeenLastCalledWith(
      "/fantasy-football/best-ball?contest=puppy",
      { scroll: false },
    );

    fireEvent.click(screen.getByRole("radio", { name: "WR" }));
    expect(mockReplace).toHaveBeenLastCalledWith(
      expect.stringContaining("position=wr"),
      { scroll: false },
    );
  });

  it("opens the shared queue, note, and compare tools from a best ball row", () => {
    render(<BestBallClient initialState={{ contest: "superflex", position: "all", query: "" }} />);

    fireEvent.click(screen.getByRole("button", { name: "Open Josh Allen details" }));

    const dialog = screen.getByRole("dialog", { name: "Josh Allen detail" });
    expect(within(dialog).getByRole("button", { name: "Add to queue" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Compare" })).toBeInTheDocument();
    expect(within(dialog).getByRole("textbox", { name: "Private note" })).toBeInTheDocument();
  });

  it("labels the Underdog final-pick placeholder as undrafted and hides fake value", () => {
    currentSearchParams = new URLSearchParams("contest=bbm-vii");
    mockUseBestBallSnapshot.mockReturnValue({
      snapshot: {
        ...snapshot,
        players: [
          ...snapshot.players,
          {
            id: "wr-floor",
            name: "Unpriced Receiver",
            team: "SEA",
            position: "WR",
            averageRank: 180,
            rankEcr: 180,
            positionRank: 70,
            standardDeviation: 4,
            byeWeek: 8,
            adp: 215.2,
          },
        ],
      },
      isLoading: false,
      error: null,
      retry: mockRetry,
    });

    render(<BestBallClient initialState={{ contest: "bbm-vii", position: "all", query: "" }} />);

    const row = screen
      .getByRole("button", { name: "Open Unpriced Receiver details" })
      .closest("li");
    expect(row).toHaveTextContent("Undrafted");
    expect(row).not.toHaveTextContent("215.2");
    expect(row).not.toHaveTextContent("+35.2");
    expect(
      screen.getByText(/Players labeled Undrafted are at the contest-floor placeholder/),
    ).toHaveTextContent(/board order falls back to PPR best ball ECR and value stays blank/);
  });

  it("keeps the strategy visible when the rankings request fails", () => {
    mockUseBestBallSnapshot.mockReturnValue({
      snapshot: null,
      isLoading: false,
      error: "Best ball rankings are unavailable right now.",
      retry: mockRetry,
    });

    render(<BestBallClient initialState={{ contest: "superflex", position: "all", query: "" }} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Best ball rankings are unavailable right now.");
    expect(screen.getByRole("heading", { name: /historical patterns/i })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Retry rankings" }));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
});
