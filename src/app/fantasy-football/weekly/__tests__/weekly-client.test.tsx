import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";

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

/** The labels of the visible head over a phone list, which is hidden from assistive tech. */
function listHeadLabels(list: HTMLElement) {
  const head = list.previousElementSibling;
  expect(head).toHaveAttribute("aria-hidden", "true");
  return Array.from(head?.children ?? []).map((cell) => cell.textContent?.trim());
}

function bodyRowCount() {
  const board = screen.getByRole("region", { name: /consensus rankings/ });
  return within(board).getAllByRole("listitem").length;
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

  it("keeps the board a ruled section and not a panel", () => {
    renderClient("rankings");
    const region = screen.getByRole("region", { name: "Flex rankings" });
    // The top rule is the kit's section rule under the heading, and nothing boxes the region.
    expect(within(region).getByRole("heading", { level: 2 }).closest(".ffb-sechead")).not.toBeNull();
    expect(region).not.toHaveClass("c97-panel");
  });

  it("keeps the full name on each switch button while a phone prints a short one", () => {
    renderClient("rankings");
    const flex = screen.getByRole("button", { name: "Flex (RB, WR, TE)" });
    expect(flex).toHaveAttribute("aria-pressed", "true");
    expect(within(flex).getByText("Flex")).toBeInTheDocument();
    expect(within(screen.getByRole("button", { name: "Quarterback" })).getByText("QB")).toBeInTheDocument();
    const scoring = screen.getByRole("group", { name: "Scoring" });
    expect(within(scoring).getByRole("button", { name: "PPR" })).toHaveAttribute("aria-pressed", "true");
    expect(within(within(scoring).getByRole("button", { name: "Half PPR" })).getByText("Half")).toBeInTheDocument();
    expect(within(within(scoring).getByRole("button", { name: "Standard" })).getByText("Std")).toBeInTheDocument();
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

  describe("a search typed while the page is scrolled deep", () => {
    let scrollTo: jest.SpyInstance;
    beforeEach(() => {
      scrollTo = jest.spyOn(window, "scrollTo").mockImplementation(() => {});
      Object.defineProperty(window, "scrollY", { configurable: true, value: 3000 });
    });
    afterEach(() => {
      scrollTo.mockRestore();
      Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    });

    function typeWithToolbarAt(top: number) {
      renderClient("rankings");
      const input = screen.getByLabelText("Search");
      const toolbar = input.closest(".ffb-toolbar") as HTMLElement;
      jest.spyOn(toolbar, "getBoundingClientRect").mockReturnValue({ top } as DOMRect);
      act(() => input.focus());
      fireEvent.change(input, { target: { value: "Flex Player 12" } });
      return input;
    }

    it("brings the toolbar back to the top of the screen, with focus left in the field", () => {
      // The page sits 3000px down and the shorter board leaves the toolbar 2500px above the screen.
      const input = typeWithToolbarAt(-2500);
      expect(scrollTo).toHaveBeenCalledWith({ top: 492, behavior: "instant" });
      expect(document.activeElement).toBe(input);
    });

    it("leaves the page where it is when the toolbar is already on screen", () => {
      typeWithToolbarAt(40);
      expect(scrollTo).not.toHaveBeenCalled();
    });
  });

  it("closes an opened window again when the filter changes", () => {
    renderClient("rankings");
    fireEvent.click(screen.getByRole("button", { name: `Show all ${FLEX_COUNT}` }));
    expect(bodyRowCount()).toBe(FLEX_COUNT);

    fireEvent.click(screen.getByRole("radio", { name: "RB" }));
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
    expect(screen.getByText("No players match on this board.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show all players" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      `Showing ${FANTASY_WEEKLY_STARTABLE_DEPTH.flex} of ${FLEX_COUNT} players`,
    );
  });

  it("draws the board in tiers the way the draft board does, at every width", () => {
    for (const wide of [true, false]) {
      tableLayout = wide;
      const { unmount } = renderClient("rankings");

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      // 130 players with every gap one rank halve into even tiers: 16 and 17 a side, then 8 and 9.
      const tiers = screen.getAllByRole("region", { name: /^Tier \d+, / });
      expect(tiers[0]).toHaveAccessibleName("Tier 1, 8 players, ranks 1 to 8");
      // Without published averages the cliff is the one-rank step between whole-number ranks.
      expect(within(tiers[0]).getByText("01")).toBeInTheDocument();
      expect(tiers[1]).toHaveAccessibleName("Tier 2, 8 players, ranks 9 to 16, 1.0 average-rank cliff above");
      const first = within(within(tiers[0]).getAllByRole("listitem")[0]);
      expect(first.getByText("Flex Player 1")).toBeInTheDocument();
      expect(first.getByText("vs. MIA")).toBeInTheDocument();
      expect(first.getByText("99.0%")).toBeInTheDocument();
      expect(first.getByRole("img", { name: "Expert rank range 1 to 6" })).toBeInTheDocument();
      // No published average in this fixture, so the column prints a dash rather than the rank.
      expect(first.getByText("—")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(
        `Showing ${FANTASY_WEEKLY_STARTABLE_DEPTH.flex} of ${FLEX_COUNT} players`,
      );
      unmount();
    }
  });

  it("keeps a tier's own count and range when a search leaves one row of it", () => {
    renderClient("rankings");
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "Flex Player 14" } });
    const tiers = screen.getAllByRole("region", { name: /^Tier \d+, / });
    expect(tiers).toHaveLength(1);
    expect(tiers[0]).toHaveAccessibleName("Tier 2, 8 players, ranks 9 to 16, 1.0 average-rank cliff above");
    expect(within(tiers[0]).getAllByRole("listitem")).toHaveLength(1);
  });

  it("draws running back tiers when the position filter is on", () => {
    renderClient("rankings");
    fireEvent.click(screen.getByRole("radio", { name: "RB" }));
    // The 43 backs sit at flex ranks 3, 6, 9, and so on, and tier among themselves.
    const tiers = screen.getAllByRole("region", { name: /^Tier \d+, / });
    expect(tiers[0]).toHaveAccessibleName("Tier 1, 10 players, ranks 3 to 30");
    expect(within(tiers[0]).getAllByRole("listitem").every((row) => row.textContent?.includes("RB"))).toBe(true);
  });
});

// The page seeds one scoring format's boards so the first rows are in the
// HTML. Until the client's own fetch fills in the rest, a switch to another
// format has no board yet, which is loading rather than empty.
describe("WeeklyBoardClient with a server seed", () => {
  it("says the board is loading while a seeded snapshot lacks the chosen scoring", () => {
    const { boards, ...rest } = buildSnapshot();
    currentSearchParams = new URLSearchParams("scoring=standard");
    renderClient("rankings", {
      ...rest,
      boards: { ppr: boards.ppr },
    } as unknown as ReturnType<typeof buildSnapshot>);

    expect(screen.getByText("Loading the weekly board.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("keeps the alert, Try again, and the scoring switch when the seed lacks the chosen scoring and the fetch failed", () => {
    const { boards, ...rest } = buildSnapshot();
    const retry = jest.fn();
    currentSearchParams = new URLSearchParams("scoring=standard");
    mockUseFantasyWeeklySnapshot.mockReturnValue({
      snapshot: { ...rest, boards: { ppr: boards.ppr } },
      notPublished: false,
      isLoading: false,
      error: "The weekly board is unavailable right now.",
      retry,
    });
    render(<WeeklyBoardClient initialState={{ scoring: "ppr", board: "flex" }} view="rankings" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("The weekly board is unavailable right now.");
    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
    // Scoring stays up, so the reader can go back to the format the seed carries.
    const scoring = screen.getByRole("group", { name: "Scoring" });
    expect(within(scoring).getByRole("button", { name: "Standard" })).toHaveAttribute("aria-pressed", "true");
    expect(within(scoring).getByRole("button", { name: "PPR" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("Loading the weekly board.")).not.toBeInTheDocument();
  });

  it("server-renders the rows with a UTC stamp, since the visitor's timezone is unknown there", () => {
    mockUseFantasyWeeklySnapshot.mockReturnValue({
      snapshot: buildSnapshot(),
      notPublished: false,
      isLoading: false,
      error: null,
      retry: jest.fn(),
    });

    const html = renderToString(
      <WeeklyBoardClient initialState={{ scoring: "ppr", board: "flex" }} view="rankings" />,
    ).replace(/<!-- -->/g, "");
    const utcStamp = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(FRESH_AS_OF));

    expect(html).toContain("Flex Player 1<");
    expect(html).toContain(`Source updated ${utcStamp} UTC`);
  });
});

// Before Week 1 the builder publishes nothing, the fetch answers 404, and there is no seed.
describe("WeeklyBoardClient before the board is published", () => {
  it.each(["rankings", "waivers"] as const)("shows the note and no board on the %s view", (view) => {
    mockUseFantasyWeeklySnapshot.mockReturnValue({
      snapshot: null,
      notPublished: true,
      isLoading: false,
      error: null,
      retry: jest.fn(),
    });
    render(<WeeklyBoardClient initialState={{ scoring: "ppr", board: "flex" }} view={view} />);

    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(
      "The weekly board opens with Week 1. It is deliberately empty until then. Rostered percentages before leagues have drafted describe the preseason rather than a waiver wire, and publishing them now would make the add list say something I cannot support. Until kickoff, the draft rankings are the board that means anything.",
    );
    expect(within(note).getByRole("link", { name: "draft rankings" })).toHaveAttribute("href", "/fantasy-football");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Scoring" })).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "My team" })).not.toBeInTheDocument();
  });
});

describe("WeeklyBoardClient waivers view", () => {
  it("opens the method with the sentence that says what the list is", () => {
    renderClient("waivers");
    expect(
      screen.getByText(/^Players the experts rank ahead of where the rostering rate puts them\. The gap is the player’s percentile on this board minus the percentage of leagues rostering him/),
    ).toBeInTheDocument();
  });

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

    expect(screen.getByRole("heading", { level: 2, name: "This week’s list" })).toHaveTextContent(
      "This week’s list",
    );
    // The section h2 is the kit's section heading, never the poster type that
    // came off on 2026-10-12.
    expect(screen.getByRole("heading", { level: 2, name: "This week’s list" })).not.toHaveClass("c97-poster-sm");
    expect(screen.getByRole("heading", { level: 2, name: "This week’s list" })).toHaveClass("ffb-h2");
    expect(screen.getByRole("status")).toHaveTextContent(
      "2 players clear the gap in PPR scoring",
    );
    const region = screen.getByRole("region", { name: "Waiver targets table" });
    expect(region).toHaveAttribute("tabindex", "0");
    // The list is a ruled section, its top rule the kit's section rule under the heading, and not a panel.
    const list = screen.getByRole("region", { name: "This week’s list" });
    expect(within(list).getByRole("heading", { level: 2 }).closest(".ffb-sechead")).not.toBeNull();
    expect(list).not.toHaveClass("c97-panel");
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
    // The visible head names the same columns in the same order, with no rank column.
    expect(listHeadLabels(list)).toEqual(labels);
  });
});
