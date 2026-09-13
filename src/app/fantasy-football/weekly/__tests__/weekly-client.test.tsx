import { fireEvent, render, screen, within } from "@testing-library/react";

import { WeeklyBoardClient } from "../weekly-client";
import { FANTASY_WEEKLY_STARTABLE_DEPTH } from "@/lib/fantasyWeeklySnapshot";
import { getSnapshotStalenessLabel } from "@/lib/fantasyUtils";

const mockReplace = jest.fn();
const mockUseFantasyWeeklySnapshot = jest.fn();
let currentSearchParams = new URLSearchParams();
let tableLayout = true;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => currentSearchParams,
  usePathname: () => "/fantasy-football/weekly",
}));

jest.mock("@/hooks/useFantasyWeeklySnapshot", () => ({
  useFantasyWeeklySnapshot: () => mockUseFantasyWeeklySnapshot(),
}));

// The client picks the table or the stacked list from a media query. The
// jest setup already stubs matchMedia as a writable property, so the test
// assigns over it with one it can flip between the two layouts.
beforeAll(() => {
  window.matchMedia = ((query: string) =>
    ({
      matches: tableLayout,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList) as typeof window.matchMedia;
});

// Freshness is judged against the real clock, so the fixture keeps one source
// an hour old and, when a test needs it, one thirty days old, which reads as
// stale in every refresh window the helper knows about.
const FRESH_AS_OF = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const STALE_AS_OF = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

// The string the parser stamps on every public board today. The footnote must
// never print it, because it describes a pipeline this snapshot did not use.
const DRAFT_BOILERPLATE =
  "FantasyPros public consensus cheatsheets. Overall boards come from the public overall consensus pages. QB, K, and DST boards are scoring-agnostic and reused across scoring formats. Flex is derived locally from the published overall board.";

const FLEX_COUNT = 130;
const QB_COUNT = 30;

function flexPlayer(index: number) {
  const positions = ["RB", "WR", "TE"] as const;
  return {
    id: `flex-${index}`,
    name: `Flex Player ${index}`,
    team: "BUF",
    position: positions[index % 3],
    rank: index,
    positionRank: Math.ceil(index / 3),
    minRank: index,
    maxRank: index + 5,
    opponent: "vs. MIA",
    // Player 5 is the one lightly rostered starter, so he is the flex waiver row.
    ownership: index === 5 ? 10 : 99,
  };
}

function quarterback(index: number) {
  return {
    id: `qb-${index}`,
    name: `Quarterback ${index}`,
    team: "KC",
    position: "QB" as const,
    rank: index,
    positionRank: index,
    minRank: index,
    maxRank: index + 2,
    opponent: "at DEN",
    ownership: index === 3 ? 5 : 99,
  };
}

function buildSnapshot({ quarterbackAsOf = FRESH_AS_OF } = {}) {
  const board = {
    flex: Array.from({ length: FLEX_COUNT }, (_, index) => flexPlayer(index + 1)),
    quarterbacks: Array.from({ length: QB_COUNT }, (_, index) => quarterback(index + 1)),
    flexSource: {
      provider: DRAFT_BOILERPLATE,
      url: "https://www.fantasypros.com/nfl/rankings/ppr-flex.php",
      asOf: FRESH_AS_OF,
      expertCount: 8,
      playerCount: FLEX_COUNT,
    },
    quarterbackSource: {
      provider: DRAFT_BOILERPLATE,
      url: "https://www.fantasypros.com/nfl/rankings/qb.php",
      asOf: quarterbackAsOf,
      expertCount: 5,
      playerCount: QB_COUNT,
    },
  };
  return {
    schemaVersion: 1,
    season: 2026,
    week: 1,
    generatedAt: FRESH_AS_OF,
    boards: { ppr: board, half_ppr: board, standard: board },
  };
}

function renderClient(view: "rankings" | "waivers", snapshot = buildSnapshot()) {
  mockUseFantasyWeeklySnapshot.mockReturnValue({
    snapshot,
    notPublished: false,
    isLoading: false,
    error: null,
    retry: jest.fn(),
  });
  return render(
    <WeeklyBoardClient
      initialState={{ scoring: "ppr", board: "flex" }}
      view={view}
    />,
  );
}

function bodyRowCount() {
  const table = screen.getByRole("table");
  return within(table).getAllByRole("row").length - 1;
}

beforeEach(() => {
  currentSearchParams = new URLSearchParams();
  tableLayout = true;
  mockReplace.mockReset();
});

describe("WeeklyBoardClient rankings view", () => {
  it("names the board and its host in the footnote instead of the draft builder's boilerplate", () => {
    const { unmount } = renderClient("rankings");

    expect(
      screen.getByText(
        `${FLEX_COUNT} players on the FantasyPros weekly flex board at fantasypros.com, 8 contributing experts.`,
        { exact: false },
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/cheatsheets/)).not.toBeInTheDocument();
    expect(screen.queryByText(/derived locally/)).not.toBeInTheDocument();
    unmount();

    currentSearchParams = new URLSearchParams("board=quarterbacks");
    renderClient("rankings");
    expect(
      screen.getByText(
        `${QB_COUNT} players on the FantasyPros weekly quarterback board at fantasypros.com, 5 contributing experts.`,
        { exact: false },
      ),
    ).toBeInTheDocument();
  });

  it("keeps the single-board stamp on the rankings view", () => {
    renderClient("rankings");
    expect(screen.getByText(/Source updated/)).toBeInTheDocument();
    expect(screen.getByText("8 experts")).toBeInTheDocument();
    expect(screen.queryByText(/Flex updated/)).not.toBeInTheDocument();
  });

  it("cuts the board at the startable depth, says so, and opens the rest on request", () => {
    renderClient("rankings");
    const depth = FANTASY_WEEKLY_STARTABLE_DEPTH.flex;

    expect(screen.getByRole("status")).toHaveTextContent(
      `Showing ${depth} of ${FLEX_COUNT} players`,
    );
    expect(bodyRowCount()).toBe(depth);
    expect(screen.queryByText(`Flex Player ${FLEX_COUNT}`)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: `Load more (${FLEX_COUNT - depth} left)` }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      `Showing all ${FLEX_COUNT} players`,
    );
    expect(bodyRowCount()).toBe(FLEX_COUNT);
    expect(screen.queryByRole("button", { name: /Load more/ })).not.toBeInTheDocument();
  });

  it("offers a single control that shows the whole board", () => {
    renderClient("rankings");
    fireEvent.click(screen.getByRole("button", { name: `Show all ${FLEX_COUNT}` }));
    expect(bodyRowCount()).toBe(FLEX_COUNT);
  });

  it("moves focus to the count line after Show all unmounts itself", () => {
    renderClient("rankings");
    const showAll = screen.getByRole("button", { name: `Show all ${FLEX_COUNT}` });
    showAll.focus();
    expect(document.activeElement).toBe(showAll);

    fireEvent.click(showAll);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("tabindex", "-1");
    expect(status).toHaveTextContent(`Showing all ${FLEX_COUNT} players`);
    expect(document.activeElement).toBe(status);
    expect(screen.queryByRole("button", { name: /Show all/ })).not.toBeInTheDocument();
  });

  it("keeps the board in a card that does not lift under the pointer", () => {
    renderClient("rankings");
    const card = screen.getByRole("region", { name: "Flex rankings" });
    expect(card).toHaveClass("home-card-static");
    expect(card).not.toHaveClass("home-card");
  });

  it("uses the quarterback depth on the quarterback board", () => {
    currentSearchParams = new URLSearchParams("board=quarterbacks");
    renderClient("rankings");
    expect(screen.getByRole("status")).toHaveTextContent(
      `Showing ${FANTASY_WEEKLY_STARTABLE_DEPTH.quarterback} of ${QB_COUNT} players`,
    );
  });

  it("runs the search over the whole board before the cut and announces the match", () => {
    renderClient("rankings");
    const deepName = `Flex Player ${FLEX_COUNT - 5}`;

    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: deepName },
    });

    expect(screen.getByText(deepName)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      `1 of ${FLEX_COUNT} players match`,
    );
  });

  it("closes an opened window again when the filter changes", () => {
    renderClient("rankings");
    fireEvent.click(screen.getByRole("button", { name: `Show all ${FLEX_COUNT}` }));
    expect(bodyRowCount()).toBe(FLEX_COUNT);

    fireEvent.click(screen.getByRole("button", { name: "RB" }));
    // 130 players cycle RB, WR, TE from index 1, so 43 are backs.
    expect(screen.getByRole("status")).toHaveTextContent(
      `43 of ${FLEX_COUNT} players match`,
    );
    expect(bodyRowCount()).toBe(43);
  });

  it("announces an empty filter in the same live region and offers the reset", () => {
    renderClient("rankings");
    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "nobody by this name" },
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "No players match your search or position filter.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Show all players" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      `Showing ${FANTASY_WEEKLY_STARTABLE_DEPTH.flex} of ${FLEX_COUNT} players`,
    );
  });

  it("stacks each row below md with labeled readouts instead of a clipped table", () => {
    tableLayout = false;
    renderClient("rankings");

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    const list = screen.getByRole("list", {
      name: "2026 week 1 flex consensus rankings, PPR scoring",
    });
    // WebKit drops list semantics for `list-style: none`, so the role is explicit.
    expect(list).toHaveAttribute("role", "list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(FANTASY_WEEKLY_STARTABLE_DEPTH.flex);
    const first = within(items[0]);
    expect(first.getByText("Flex Player 1")).toBeInTheDocument();
    expect(first.getByText("Opponent")).toBeInTheDocument();
    expect(first.getByText("vs. MIA")).toBeInTheDocument();
    expect(first.getByText("Expert range")).toBeInTheDocument();
    expect(first.getByText("1 to 6")).toBeInTheDocument();
    expect(first.getByText("Rostered")).toBeInTheDocument();
    expect(first.getByText("99.0%")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      `Showing ${FANTASY_WEEKLY_STARTABLE_DEPTH.flex} of ${FLEX_COUNT} players`,
    );
  });
});

describe("WeeklyBoardClient waivers view", () => {
  it("stamps both boards and lets the chip follow the worse of the two", () => {
    const { unmount } = renderClient("waivers");
    expect(screen.getByText(/Flex updated .*, 8 experts/)).toBeInTheDocument();
    expect(screen.getByText(/QB updated .*, 5 experts/)).toBeInTheDocument();
    expect(screen.queryByText(/Source updated/)).not.toBeInTheDocument();
    expect(
      screen.getByText(getSnapshotStalenessLabel("fresh")),
    ).toBeInTheDocument();
    unmount();

    renderClient("waivers", buildSnapshot({ quarterbackAsOf: STALE_AS_OF }));
    expect(screen.getByText(getSnapshotStalenessLabel("stale"))).toBeInTheDocument();
    expect(screen.queryByText(getSnapshotStalenessLabel("fresh"))).not.toBeInTheDocument();
  });

  it("puts the gap beside the player, labels the scroller, and announces the count", () => {
    renderClient("waivers");

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "This week’s list",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "2 players clear the gap in PPR scoring",
    );
    const region = screen.getByRole("region", { name: "Waiver targets table" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("region", { name: "This week’s list" })).toHaveClass(
      "home-card-static",
    );
    const headers = within(screen.getByRole("table"))
      .getAllByRole("columnheader")
      .map((cell) => cell.textContent?.trim());
    expect(headers).toEqual([
      "Player",
      "Gap",
      "Board",
      "Rank",
      "Percentile",
      "Rostered",
    ]);
  });

  it("prints a footnote that names both source boards", () => {
    renderClient("waivers");
    expect(
      screen.getByText(
        `${FLEX_COUNT} players on the FantasyPros weekly flex board and ${QB_COUNT} on the FantasyPros weekly quarterback board at fantasypros.com.`,
        { exact: false },
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Flex source board/ })).toHaveAttribute(
      "href",
      "https://www.fantasypros.com/nfl/rankings/ppr-flex.php",
    );
    expect(
      screen.getByRole("link", { name: /Quarterback source board/ }),
    ).toHaveAttribute("href", "https://www.fantasypros.com/nfl/rankings/qb.php");
  });

  it("stacks each candidate below md with the gap first", () => {
    tableLayout = false;
    renderClient("waivers");

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    const list = screen.getByRole("list", {
      name: "Weekly waiver targets ranked by the gap between board percentile and rostered percentage",
    });
    expect(list).toHaveAttribute("role", "list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const labels = within(items[0])
      .getAllByRole("term")
      .map((term) => term.textContent?.trim());
    expect(labels).toEqual(["Gap", "Board", "Rank", "Percentile", "Rostered"]);
  });
});
