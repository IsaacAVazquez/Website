import { act, fireEvent, render, screen, within } from "@testing-library/react";

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

// In the app the drawer and the tray load the first time they are needed.
// Here they are the real components, mounted directly, so these tests stay
// about the board and stay synchronous. The loading itself is covered in
// DeferredPlayerDetailDrawer.test.tsx.
jest.mock("@/components/fantasy/DeferredPlayerDetailDrawer", () => ({
  DeferredPlayerDetailDrawer: jest.requireActual("@/components/fantasy/PlayerDetailDrawer")
    .PlayerDetailDrawer,
}));
jest.mock("@/components/fantasy/DeferredCompareTray", () => ({
  DeferredCompareTray: jest.requireActual("@/components/fantasy/CompareTray").CompareTray,
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
    jest.useRealTimers();
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  /** A BBM VII lens whose ranking and ADP sources carry the given dates. */
  function renderDatedBoard(dates: { now: string; generatedAt: string; ranking: string; adp: string }) {
    jest.useFakeTimers({ now: new Date(dates.now) });
    currentSearchParams = new URLSearchParams("contest=bbm-vii");
    mockUseBestBallSnapshot.mockReturnValue({
      snapshot: {
        ...snapshot,
        generatedAt: dates.generatedAt,
        rankingSource: { ...snapshot.rankingSource, asOf: dates.ranking },
        adpSource: { ...snapshot.adpSource, provider: "Underdog ADP via Hayden Winks", asOf: dates.adp },
      },
      isLoading: false,
      error: null,
      retry: mockRetry,
    });
    return render(<BestBallClient initialState={{ contest: "bbm-vii", position: "all", query: "" }} />);
  }

  it("keeps the refresh-window warning for a dated source before Week 1", () => {
    renderDatedBoard({
      now: "2026-08-20T12:00:00.000Z",
      generatedAt: "2026-08-20T09:00:00.000Z",
      ranking: "2026-08-01T12:00:00.000Z",
      adp: "2026-08-01T12:00:00.000Z",
    });

    const card = screen.getByText(
      "One or more best ball sources are older than the normal refresh window. Check the dates before using this board in a live room."
    );
    expect(card).toHaveAttribute("role", "status");
    expect(screen.queryByText(/kept for reference rather than refreshed/)).not.toBeInTheDocument();
    expect(screen.queryByText(/frozen reference/)).not.toBeInTheDocument();
  });

  it("dates the frozen board instead of warning about a refresh window once the season opens", () => {
    // The committed 2026 board read on Sep 11: consensus Sep 1, ADP Sep 10.
    renderDatedBoard({
      now: "2026-09-11T12:00:00.000Z",
      generatedAt: "2026-09-11T09:24:17.592Z",
      ranking: "2026-09-01T11:20:54.000Z",
      adp: "2026-09-10T15:52:40.059Z",
    });

    const card = screen.getByText(
      "This consensus is dated Sep 1, 2026 and the Underdog ADP Sep 10, 2026, and neither will move again now that the market has closed at kickoff. The board stays as a frozen reference for next summer, and the draft tracker keeps Draft Outlook and its exact player cards paused because they need a current consensus."
    );
    expect(card).toHaveAttribute("role", "status");
    expect(screen.queryByText(/refresh window|live room/)).not.toBeInTheDocument();
    // The Week 1 note above it is untouched and no longer contradicted.
    expect(screen.getByText(/kept for reference rather than refreshed/)).toBeInTheDocument();
  });

  it("renders the selected contest, moves quarterbacks for Superflex, and exposes the sourced fields", () => {
    const { container } = render(
      <BestBallClient initialState={{ contest: "superflex", position: "all", query: "" }} />,
    );

    // The client renders one root element, with nothing before it.
    expect(container.firstChild).toHaveAttribute("data-testid", "best-ball-shell");
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

  it("leads with the room summary and opens the build guidance on request where the rail sits above the board", () => {
    render(<BestBallClient initialState={{ contest: "bbm-vii", position: "all", query: "" }} />);
    const format = screen.getByRole("region", { name: "Selected format" });
    const cell = (label: string) => within(format).getByText(label).parentElement as HTMLElement;
    expect(cell("The room")).not.toHaveClass("hidden");
    for (const label of ["How I read it", "2026 build range", "What I would watch"]) {
      // Closed below 1200px, where the rail is above the board, and open beside it.
      expect(cell(label)).toHaveClass("hidden", "min-[1200px]:block");
    }
    const toggle = within(format).getByRole("button", { name: "Show build guidance" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(within(format).getByRole("button", { name: "Hide build guidance" })).toHaveAttribute("aria-expanded", "true");
    expect(cell("How I read it")).not.toHaveClass("hidden");
    // All eight contest choices stay in the one group.
    expect(within(screen.getByRole("group", { name: "Best ball contest" })).getAllByRole("button")).toHaveLength(8);
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
    expect(controls).toHaveClass("ffb-sticky");
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

  it("prints each provider's name once in the board-order sentence and the source line", () => {
    // The committed snapshot's names already say what they supply.
    renderDatedBoard({
      now: "2026-08-20T12:00:00.000Z",
      generatedAt: "2026-08-20T09:00:00.000Z",
      ranking: "2026-08-19T12:00:00.000Z",
      adp: "2026-08-19T12:00:00.000Z",
    });
    expect(
      screen.getByText(/^Board order follows current Underdog ADP via Hayden Winks · value is ADP minus/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Hayden Winks ADP/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Underdog via Hayden Winks standard slate" })).toBeInTheDocument();
    const sourceLine = screen.getByText(/^Snapshot built Aug 20, 2026/);
    expect(sourceLine).toHaveTextContent(
      "Snapshot built Aug 20, 2026 · rankings FantasyPros PPR best ball · 6 experts · ADP Underdog via Hayden Winks standard slate · Week 17 ESPN",
    );
  });

  it("does not repeat PPR best ball after a provider that already says it, and counts one expert as one", () => {
    mockUseBestBallSnapshot.mockReturnValue({
      snapshot: {
        ...snapshot,
        rankingSource: {
          ...snapshot.rankingSource,
          provider: "FantasyPros public PPR best ball consensus",
          expertCount: 1,
        },
      },
      isLoading: false,
      error: null,
      retry: mockRetry,
    });
    render(<BestBallClient initialState={{ contest: "superflex", position: "all", query: "" }} />);
    expect(
      screen.getByRole("link", { name: "FantasyPros public PPR best ball consensus · 1 expert" }),
    ).toBeInTheDocument();
  });

  it("says loading while the snapshot loads, and makes no claim about ADP", () => {
    currentSearchParams = new URLSearchParams("contest=bbm-vii");
    mockUseBestBallSnapshot.mockReturnValue({ snapshot: null, isLoading: true, error: null, retry: mockRetry });
    render(<BestBallClient initialState={{ contest: "bbm-vii", position: "all", query: "" }} />);

    expect(screen.getByText("Loading players")).toHaveAttribute("aria-live", "polite");
    expect(screen.queryByText(/unavailable or stale/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Board order/)).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    // The head line holds its place with the one part that needs no snapshot.
    expect(screen.getByText("8 contest lenses")).toBeInTheDocument();
    expect(screen.queryByText(/ranked$/)).not.toBeInTheDocument();
  });

  it("says the rankings are unavailable after a failed load, with no count of zero and no ADP claim", () => {
    currentSearchParams = new URLSearchParams("contest=bbm-vii");
    mockUseBestBallSnapshot.mockReturnValue({
      snapshot: null,
      isLoading: false,
      error: "Best ball rankings are unavailable right now.",
      retry: mockRetry,
    });
    render(<BestBallClient initialState={{ contest: "bbm-vii", position: "all", query: "" }} />);

    const count = screen.getByText("Rankings unavailable");
    expect(count).not.toHaveAttribute("aria-live");
    expect(screen.queryByText(/0 of 0/)).not.toBeInTheDocument();
    expect(screen.queryByText(/unavailable or stale/)).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search best ball rankings" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "All" })).toBeDisabled();
  });

  it("counts a round from the whole filtered board and prints a count only when the round is not full", () => {
    currentSearchParams = new URLSearchParams("contest=eliminator");
    const many = Array.from({ length: 100 }, (_, index) => ({
      id: `p-${index + 1}`,
      name: `Player ${index + 1}`,
      team: "BUF",
      // One tight end, at rank 13, so the tight end board holds a round of one.
      position: index === 12 ? "TE" : "WR",
      averageRank: index + 1,
      rankEcr: index + 1,
      positionRank: index + 1,
      standardDeviation: 1,
      byeWeek: 7,
    }));
    mockUseBestBallSnapshot.mockReturnValue({
      snapshot: { ...snapshot, players: many },
      isLoading: false,
      error: null,
      retry: mockRetry,
    });
    const { rerender } = render(
      <BestBallClient initialState={{ contest: "eliminator", position: "all", query: "" }} />,
    );

    expect(screen.getByText("100 of 100 on this board")).toBeInTheDocument();
    // Eighty rows are mounted, so round 7 shows eight of its twelve, and it is still a full round.
    const board = screen.getByTestId("best-ball-board");
    expect(board.querySelectorAll("ul > li")).toHaveLength(80);
    const round7 = screen.getByRole("region", { name: "Round 7" });
    expect(round7.querySelectorAll("li")).toHaveLength(8);
    expect(within(round7).getByRole("heading", { level: 3 })).toHaveTextContent(/^Round 7 Picks 73–84$/);
    expect(within(screen.getByRole("region", { name: "Round 1" })).getByRole("heading")).toHaveTextContent(
      /^Round 1 Picks 1–12$/,
    );
    expect(screen.getByRole("button", { name: "Show the next 20 players" })).toBeInTheDocument();

    currentSearchParams = new URLSearchParams("contest=eliminator&position=te");
    rerender(<BestBallClient initialState={{ contest: "eliminator", position: "TE", query: "" }} />);
    expect(screen.getByText("1 of 100 on this board")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Round 2" })).getByRole("heading")).toHaveTextContent(
      /^Round 2 1 player Picks 13–24$/,
    );
  });

  it("names each value inside its own cell and tones a gap of three picks or more", () => {
    currentSearchParams = new URLSearchParams("contest=bbm-vii");
    render(<BestBallClient initialState={{ contest: "bbm-vii", position: "all", query: "" }} />);

    // Bijan Robinson: ADP 32 against ECR 30. Josh Allen: ADP 47 against ECR 50.
    const bijan = screen.getByRole("button", { name: "Open Bijan Robinson details" }).closest("li") as HTMLElement;
    const cells = (row: HTMLElement) =>
      Array.from(row.querySelectorAll(":scope > span")).map((cell) => cell.textContent?.replace(/\s+/g, " ").trim());
    expect(cells(bijan)).toEqual(["1", "RB1", "Bijan Robinson", "ATL", "ADP 32", "ECR 30", "Value +2.0", "Bye 11", "W17 NO"]);
    expect(within(bijan).getByTitle("Priced about even with the PPR reference")).toHaveClass("ffb-is-flat");

    const allen = screen.getByRole("button", { name: "Open Josh Allen details" }).closest("li") as HTMLElement;
    expect(cells(allen)).toEqual(["2", "QB1", "Josh Allen", "BUF", "ADP 47", "ECR 50", "Value -3.0", "Bye 7", "W17 MIA"]);
    const gap = within(allen).getByTitle("The market takes him 3.0 picks before the PPR reference");
    expect(gap).toHaveClass("ffb-is-strong", "ffb-warn");
    // A phone row keeps ADP over value on a lens with a current ADP.
    expect(within(allen).getByTitle("Current Underdog average draft position")).toHaveClass("ffb-m-top");
    expect(gap).toHaveClass("ffb-m-sub");
  });

  it("keeps the consensus rank as the phone's number on a lens with no ADP, and mutes Week 17 in Sit and Go", () => {
    currentSearchParams = new URLSearchParams("contest=sit-and-go");
    render(<BestBallClient initialState={{ contest: "sit-and-go", position: "all", query: "" }} />);

    const bijan = screen.getByRole("button", { name: "Open Bijan Robinson details" }).closest("li") as HTMLElement;
    expect(within(bijan).getByTitle("PPR best ball expert consensus rank")).toHaveClass("ffb-m-top");
    expect(within(bijan).getByTitle("Current Underdog average draft position")).not.toHaveClass("ffb-m-top");
    expect(within(bijan).getByTitle("No matching room price in this snapshot")).not.toHaveClass("ffb-m-sub");
    expect(
      within(bijan).getByTitle("Week 17 correlation does not move this board in Sit and Go"),
    ).toHaveClass("ffb-is-flat");
    expect(within(screen.getByTestId("best-ball-board-controls")).getByText("ECR")).toHaveClass("ffb-only-phone");
  });

  it("returns focus to the control a cleared filter belongs to", () => {
    const { rerender } = render(
      <BestBallClient initialState={{ contest: "superflex", position: "all", query: "" }} />,
    );
    const search = screen.getByRole("searchbox", { name: "Search best ball rankings" });
    // The URL write waits on a timer this test never runs, so the mocked URL stays as it is.
    fireEvent.change(search, { target: { value: "zzz" } });
    expect(screen.getByText("No players match on this board.")).toBeInTheDocument();
    expect(screen.getByText("0 of 2 on this board")).toBeInTheDocument();

    // The empty state's button, which prints the words, then the field's own, which is an icon.
    expect(screen.getAllByRole("button", { name: "Clear search" })).toHaveLength(2);
    act(() => {
      fireEvent.click(screen.getByText("Clear search"));
    });
    expect(search).toHaveValue("");
    expect(search).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();

    act(() => {
      search.blur();
      fireEvent.change(search, { target: { value: "allen" } });
    });
    expect(search).not.toHaveFocus();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    });
    expect(search).toHaveFocus();

    // No tight end in the fixture, so the tight end board is empty with no query typed.
    currentSearchParams = new URLSearchParams("contest=superflex&position=te");
    rerender(<BestBallClient initialState={{ contest: "superflex", position: "TE", query: "" }} />);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Show all positions" }));
    });
    expect(screen.getByRole("radio", { name: "All" })).toHaveFocus();
    expect(mockReplace).toHaveBeenLastCalledWith("/fantasy-football/best-ball?contest=superflex", { scroll: false });
  });

  it("holds the drawer's pick advice back in season and prints it on a current preseason board", () => {
    const verdict = /Take him on schedule|Value if he lasts to your pick|Plan the reach or let him go|Too few mock selections/;
    // Every source the lens uses has to be current and complete, the Week 17 schedule included.
    const week17Opponents = Object.fromEntries(
      Array.from({ length: 32 }, (_, index) => [`T${index}`, `T${(index + 1) % 32}`]),
    );
    const dated = (now: string, asOf: string) => {
      jest.useFakeTimers({ now: new Date(now) });
      currentSearchParams = new URLSearchParams("contest=bbm-vii");
      mockUseBestBallSnapshot.mockReturnValue({
        snapshot: {
          ...snapshot,
          generatedAt: asOf,
          week17Opponents,
          rankingSource: { ...snapshot.rankingSource, asOf },
          adpSource: { ...snapshot.adpSource, asOf },
          scheduleSource: { ...snapshot.scheduleSource, asOf },
        },
        isLoading: false,
        error: null,
        retry: mockRetry,
      });
      return render(<BestBallClient initialState={{ contest: "bbm-vii", position: "all", query: "" }} />);
    };

    const preseason = dated("2026-08-20T12:00:00.000Z", "2026-08-20T09:00:00.000Z");
    fireEvent.click(screen.getByRole("button", { name: "Open Bijan Robinson details" }));
    expect(screen.getByRole("dialog", { name: "Bijan Robinson detail" })).toHaveTextContent(verdict);
    preseason.unmount();

    // Week 2, with every source read that morning: the dates are current and the season is under way.
    dated("2026-09-20T12:00:00.000Z", "2026-09-20T09:00:00.000Z");
    fireEvent.click(screen.getByRole("button", { name: "Open Bijan Robinson details" }));
    const drawer = screen.getByRole("dialog", { name: "Bijan Robinson detail" });
    expect(drawer).not.toHaveTextContent(verdict);
    expect(within(drawer).getByText("Board rank 1")).toBeInTheDocument();
  });
});
