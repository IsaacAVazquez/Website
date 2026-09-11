import { fireEvent, render, screen, within } from "@testing-library/react";

import { BestBallClient } from "../best-ball-client";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { FANTASY_COMPARE_STORAGE_KEY } from "@/lib/fantasyLocal";

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

// The client checks source freshness against the real clock (stale after four
// days in draft season), so a pinned asOf rots the suite as time passes. Keep
// every source inside the fresh window relative to the run.
const FRESH_AS_OF = new Date(Date.now() - 60 * 60 * 1000).toISOString();

const snapshot = {
  schemaVersion: 2,
  season: 2026,
  generatedAt: FRESH_AS_OF,
  rankingSource: {
    provider: "FantasyPros",
    url: "https://www.fantasypros.com/nfl/rankings/best-ball-overall.php",
    asOf: FRESH_AS_OF,
    expertCount: 6,
  },
  adpSource: {
    provider: "PPR Rankings",
    url: "https://pprrankings.com/rankings",
    asOf: FRESH_AS_OF,
  },
  superflexSource: {
    provider: "FantasyPros",
    url: "https://www.fantasypros.com/nfl/rankings/half-point-ppr-superflex-cheatsheets.php",
    asOf: FRESH_AS_OF,
  },
  scheduleSource: {
    provider: "ESPN",
    url: "https://www.espn.com/nfl/schedule/_/week/17/year/2026/seasontype/2",
    asOf: FRESH_AS_OF,
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
    resetBrowserStorageMemory();
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

  afterEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  it("renders the selected contest, moves quarterbacks for Superflex, and exposes the sourced fields", () => {
    const { container } = render(
      <BestBallClient initialState={{ contest: "superflex", position: "all", query: "" }} />,
    );

    expect(container.firstChild).toHaveClass("home-page");
    expect(screen.getByRole("button", { name: "Superflex" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Superflex", level: 2 })).toBeInTheDocument();
    expect(screen.getAllByText(/Week 17/).length).toBeGreaterThan(0);

    const board = screen.getByTestId("best-ball-board");
    const rows = board.querySelectorAll("ul > li");
    expect(rows).toHaveLength(2);
    expect(within(rows[0] as HTMLElement).getByText("Josh Allen")).toBeVisible();
    expect(within(rows[0] as HTMLElement).getAllByText("NA").length).toBeGreaterThan(0);
    expect(screen.getByText(/no Superflex room ADP/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /FantasyPros PPR best ball · 6 experts/ })
    ).toBeVisible();

    expect(
      screen.getByRole("link", { name: /Draft with this lens/i }),
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
    // The chip is the lens order, not the consensus, and says so.
    expect(within(dialog).getByText("Board rank 1")).toBeInTheDocument();
    expect(within(dialog).queryByText("Rank 1")).not.toBeInTheDocument();
  });

  it("keeps the column labels inside the sticky bar once the board has rows", () => {
    const { rerender } = render(
      <BestBallClient initialState={{ contest: "superflex", position: "all", query: "" }} />,
    );

    const controls = screen.getByTestId("best-ball-board-controls");
    expect(controls).toHaveClass("sticky");
    expect(within(controls).getByText("PPR ECR")).toBeInTheDocument();
    expect(within(controls).getByText("UD ADP")).toBeInTheDocument();
    expect(within(controls).getByText("PPR ECR").closest("[aria-hidden='true']")).not.toBeNull();

    mockUseBestBallSnapshot.mockReturnValue({
      snapshot: null,
      isLoading: false,
      error: "Best ball rankings are unavailable right now.",
      retry: mockRetry,
    });
    rerender(<BestBallClient initialState={{ contest: "superflex", position: "all", query: "" }} />);
    expect(
      within(screen.getByTestId("best-ball-board-controls")).queryByText("PPR ECR"),
    ).not.toBeInTheDocument();
  });

  it("withholds every judgment built on a consensus rank that sits outside its own expert range", () => {
    currentSearchParams = new URLSearchParams("contest=bbm-vii");
    // Six of the top eight by expert average carry a rank_ecr far outside
    // their own [min, max] band, which is the 2026-09-06 FantasyPros shape.
    const divergent = (id: string, name: string, adp: number, rank: number) => ({
      id,
      name,
      team: "DET",
      position: "RB" as const,
      averageRank: rank,
      rankEcr: rank,
      rankAverage: 1.33,
      minRank: 1,
      maxRank: 2,
      tier: 7,
      positionRank: 19,
      standardDeviation: 0.47,
      byeWeek: 6,
      adp,
    });
    mockUseBestBallSnapshot.mockReturnValue({
      snapshot: {
        ...snapshot,
        rankingSource: { ...snapshot.rankingSource, asOf: "2026-09-09T23:22:32.000Z" },
        players: [
          divergent("rb-gibbs", "Jahmyr Gibbs", 1, 54),
          divergent("rb-2", "Second Back", 2.1, 55),
          divergent("rb-3", "Third Back", 4.3, 57),
          divergent("rb-4", "Fourth Back", 5.8, 59),
          divergent("rb-5", "Fifth Back", 7.3, 60),
          divergent("rb-6", "Sixth Back", 7.4, 61),
          {
            id: "wr-chase",
            name: "Ja'Marr Chase",
            team: "CIN",
            position: "WR",
            averageRank: 1,
            rankEcr: 1,
            rankAverage: 3,
            minRank: 1,
            maxRank: 5,
            tier: 1,
            positionRank: 1,
            standardDeviation: 1,
            byeWeek: 6,
            adp: 3.1,
          },
          {
            id: "rb-cmc",
            name: "Christian McCaffrey",
            team: "SF",
            position: "RB",
            averageRank: 2,
            rankEcr: 2,
            rankAverage: 5.25,
            minRank: 2,
            maxRank: 9,
            tier: 1,
            positionRank: 1,
            standardDeviation: 2,
            byeWeek: 8,
            adp: 6.1,
          },
        ],
      },
      isLoading: false,
      error: null,
      retry: mockRetry,
    });

    render(<BestBallClient initialState={{ contest: "bbm-vii", position: "all", query: "" }} />);

    // The board note carries the consensus date and the count of rows it blanks.
    const note = screen.getByTestId("best-ball-consensus-note");
    expect(note).toHaveAttribute("role", "note");
    expect(note).toHaveTextContent(/^Consensus withheld\. The PPR best ball consensus published Sep 9, 2026 disagrees/);
    expect(note).toHaveTextContent("6 of 8 rows on this board print no ECR, value, tier, or position rank");

    // The withheld row keeps the market and loses every derived number.
    const gibbs = screen.getByRole("button", { name: "Open Jahmyr Gibbs details" }).closest("li") as HTMLElement;
    expect(gibbs).toHaveTextContent("Withheld");
    expect(gibbs).not.toHaveTextContent("54");
    expect(gibbs).not.toHaveTextContent("-53.0");
    expect(gibbs).not.toHaveTextContent("RB19");
    expect(
      within(gibbs)
        .getAllByTitle(/sits outside its own expert range, so the board withholds it/)
        .map((cell) => cell.textContent?.replace(/\s+/g, " ").trim()),
    ).toEqual(["ECR Withheld", "Value NA"]);

    // The healthy row beside it still reads.
    const chase = screen.getByRole("button", { name: "Open Ja'Marr Chase details" }).closest("li") as HTMLElement;
    expect(chase).toHaveTextContent("WR1");
    expect(chase).toHaveTextContent("+2.1");

    // The drawer prints no tier, position rank, or reach, and keeps the expert band.
    fireEvent.click(screen.getByRole("button", { name: "Open Jahmyr Gibbs details" }));
    const drawer = screen.getByRole("dialog", { name: "Jahmyr Gibbs detail" });
    expect(within(drawer).getByText("Board rank 1")).toBeInTheDocument();
    expect(within(drawer).queryByText(/Reach/)).not.toBeInTheDocument();
    expect(within(drawer).queryByText("RB 19")).not.toBeInTheDocument();
    expect(within(drawer).queryByText("7")).not.toBeInTheDocument();
    expect(
      within(drawer).getByRole("img", { name: "Expert rank range 1 to 2, average 1.3" }),
    ).toBeInTheDocument();
    fireEvent.click(within(drawer).getByRole("button", { name: "Compare" }));
    fireEvent.click(within(drawer).getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Open Ja'Marr Chase details" }));
    const chaseDrawer = screen.getByRole("dialog", { name: "Ja'Marr Chase detail" });
    fireEvent.click(within(chaseDrawer).getByRole("button", { name: "Compare" }));
    fireEvent.click(within(chaseDrawer).getByRole("button", { name: "Close" }));

    // The modal names the board rank, blanks the withheld cells, and awards no
    // Best on the consensus, position rank, or tier rows.
    fireEvent.click(screen.getByRole("button", { name: /^Compare 2/ }));
    const modal = screen.getByRole("dialog", { name: "Compare players" });
    const cells = (label: string) =>
      within(within(modal).getByRole("rowheader", { name: label }).closest("tr") as HTMLElement)
        .getAllByRole("cell")
        .map((cell) => cell.textContent?.replace(/\s+/g, " ").trim());
    expect(cells("Board rank")).toEqual(["1Best", "3"]);
    expect(cells("Consensus rank")).toEqual(["Withheld", "1"]);
    expect(cells("Position rank")).toEqual(["Withheld", "WR 1"]);
    expect(cells("Tier")).toEqual(["Withheld", "1"]);
    expect(cells("Market ADP")).toEqual(["1.0", "3.1"]);
  });

  it("preserves and lets the user clear redraft-only compare selections", () => {
    window.localStorage.setItem(
      FANTASY_COMPARE_STORAGE_KEY,
      JSON.stringify(["redraft-only-1", "redraft-only-2", "redraft-only-3"])
    );

    render(<BestBallClient initialState={{ contest: "superflex", position: "all", query: "" }} />);

    expect(JSON.parse(window.localStorage.getItem(FANTASY_COMPARE_STORAGE_KEY) ?? "[]"))
      .toEqual(["redraft-only-1", "redraft-only-2", "redraft-only-3"]);
    expect(screen.getByText("3 players are pinned on another fantasy board.")).toHaveAttribute(
      "role",
      "status"
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Josh Allen details" }));
    const dialog = screen.getByRole("dialog", { name: "Josh Allen detail" });
    const compareButton = within(dialog).getByRole("button", { name: "Compare" });
    expect(compareButton).toBeDisabled();
    expect(compareButton).toHaveAttribute("title", "Compare holds 3 players");

    fireEvent.click(screen.getByRole("button", { name: "Clear compare" }));
    expect(compareButton).toBeEnabled();
    fireEvent.click(compareButton);
    expect(JSON.parse(window.localStorage.getItem(FANTASY_COMPARE_STORAGE_KEY) ?? "[]"))
      .toEqual(["qb-1"]);
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
    expect(screen.getByRole("heading", { name: /what has worked/i })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Retry rankings" }));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
});
