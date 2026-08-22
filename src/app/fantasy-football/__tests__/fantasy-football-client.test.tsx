import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { FantasyFootballClient } from "../fantasy-football-client";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import type { Player } from "@/types";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseFantasySnapshot = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

jest.mock("@/hooks/useFantasySnapshot", () => ({
  useFantasySnapshot: () => mockUseFantasySnapshot(),
}));

function buildSliceMetadataMap() {
  return {
    overall: {
      available: true,
      sourceKind: "overall_consensus",
      rangeKind: "overall",
      playerCount: 0,
      updatedAt: "2026-08-16T15:29:20.000Z",
    },
    qb: {
      available: true,
      sourceKind: "shared_position_consensus",
      rangeKind: "position",
      playerCount: 0,
      updatedAt: "2026-08-16T15:29:20.000Z",
    },
    rb: {
      available: true,
      sourceKind: "position_consensus",
      rangeKind: "position",
      playerCount: 3,
      updatedAt: "2026-08-16T15:29:20.000Z",
    },
    wr: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 0 },
    te: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 0 },
    flex: { available: true, sourceKind: "derived_flex", rangeKind: "overall", playerCount: 0 },
    k: {
      available: true,
      sourceKind: "shared_position_consensus",
      rangeKind: "position",
      playerCount: 0,
    },
    dst: {
      available: true,
      sourceKind: "shared_position_consensus",
      rangeKind: "position",
      playerCount: 0,
    },
  };
}

function makePlayer(overrides: Partial<Player> & { id: string; name: string }): Player {
  return {
    team: "SF",
    position: "RB",
    averageRank: 1,
    rankEcr: 1,
    rankAverage: 1.2,
    standardDeviation: 0.1,
    tier: 1,
    positionRank: 1,
    minRank: 1,
    maxRank: 3,
    byeWeek: 9,
    lastUpdated: "2026-08-16T15:29:20.000Z",
    ...overrides,
  } as Player;
}

interface SnapshotOverrides {
  players: Player[];
  position?: string;
  adpSource?: object | null;
  sliceAvailable?: boolean;
  sliceReason?: string;
  isLoading?: boolean;
  error?: string | null;
  retry?: jest.Mock;
}

function mockSnapshot({
  players,
  position = "rb",
  adpSource = null,
  sliceAvailable = true,
  sliceReason,
  isLoading = false,
  error = null,
  retry = jest.fn(),
}: SnapshotOverrides) {
  const slice = {
    available: sliceAvailable,
    sourceKind: "position_consensus",
    rangeKind: "position",
    playerCount: players.length,
    updatedAt: "2026-08-16T15:29:20.000Z",
    ...(sliceReason ? { reason: sliceReason } : {}),
  };
  mockUseFantasySnapshot.mockReturnValue({
    players: sliceAvailable ? players : [],
    snapshot: null,
    metadata: {
      season: 2026,
      week: 0,
      generatedAt: "2026-08-16T16:00:00.000Z",
      upstreamUpdatedAt: "2026-08-16T15:29:20.000Z",
      scoringFormat: "PPR",
      source: "snapshot",
      position,
      playerCount: players.length,
      ...(adpSource ? { adpSource } : {}),
      slice,
      slices: buildSliceMetadataMap(),
    },
    sliceMetadata: slice,
    sliceMetadataMap: buildSliceMetadataMap(),
    isLoading,
    error,
    retry,
  });
  return { retry };
}

const FRESH_ADP_SOURCE = {
  provider: "Fantasy Football Calculator",
  url: "https://example.test/adp",
  asOf: "2026-08-16T00:00:00.000Z",
  sampleSize: 6565,
  matchedCount: 260,
};

function renderClient(initial?: Partial<{ position: string; scoring: string; query: string }>) {
  return render(
    <FantasyFootballClient
      initialState={{
        position: (initial?.position ?? "rb") as never,
        scoring: (initial?.scoring ?? "ppr") as never,
        view: "list",
        query: initial?.query ?? "",
      }}
    />
  );
}

describe("FantasyFootballClient", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-18T10:00:00.000Z"));
    window.localStorage.clear();
    resetBrowserStorageMemory();
    currentSearchParams = new URLSearchParams("position=rb&scoring=ppr");
    mockPush.mockReset();
    mockReplace.mockReset();
    mockUseFantasySnapshot.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders tier plates with an avg-rank cliff and opens the player drawer", () => {
    mockSnapshot({
      players: [
        makePlayer({
          id: "rb-1",
          name: "Christian McCaffrey",
          rankAverage: 1.2,
          positionRank: 1,
        }),
        makePlayer({
          id: "rb-2",
          name: "Bijan Robinson",
          team: "ATL",
          rankAverage: 5.6,
          averageRank: 2,
          rankEcr: 2,
          positionRank: 2,
          tier: 2,
          minRank: 2,
          maxRank: 8,
          byeWeek: 5,
        }),
      ],
    });

    const { container } = renderClient();

    expect(container.firstChild).toHaveClass("home-page");
    expect(screen.getByRole("heading", { name: /RB rankings/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /RB/i })).not.toBeDisabled();

    // One plate per tier, numbered with a leading zero like the template.
    expect(screen.getByText("01")).toBeVisible();
    expect(screen.getByText("02")).toBeVisible();
    // The consensus drop between the tiers is annotated between the plates.
    expect(screen.getByText(/4\.4 avg-rank cliff/)).toBeInTheDocument();

    // No ADP source in this snapshot, so no ADP surfaces anywhere.
    expect(screen.queryByText("ADP")).not.toBeInTheDocument();
    expect(screen.queryByText("vs ADP")).not.toBeInTheDocument();

    // The tool links render twice: once under the header, once below the board.
    const draftTrackerLinks = screen.getAllByRole("link", { name: /Draft tracker/i });
    expect(draftTrackerLinks).toHaveLength(2);
    for (const link of draftTrackerLinks) {
      expect(link).toHaveAttribute("href", "/fantasy-football/draft-tracker");
    }
    expect(
      within(screen.getByRole("navigation", { name: "Fantasy tools" })).getAllByRole("link")
    ).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: "Open Christian McCaffrey detail" }));
    const dialog = screen.getByRole("dialog", { name: "Christian McCaffrey detail" });
    expect(dialog).toBeVisible();
    expect(within(dialog).getByText("Consensus avg")).toBeVisible();
    // "1.2" appears in the stat card and again in the board-neighborhood row.
    expect(within(dialog).getAllByText("1.2").length).toBeGreaterThan(0);
    expect(within(dialog).getByText("Expert range")).toBeVisible();
    // Without an ADP source the market cards stay hidden in the drawer too.
    expect(within(dialog).queryByText("Market ADP")).not.toBeInTheDocument();
  });

  it("renders ADP columns and a gated value signal when the snapshot carries fresh ADP", () => {
    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr");
    mockSnapshot({
      position: "overall",
      adpSource: FRESH_ADP_SOURCE,
      players: [
        makePlayer({
          id: "wr-1",
          name: "Ja'Marr Chase",
          team: "CIN",
          position: "WR",
          rankEcr: 12,
          averageRank: 12,
          rankAverage: 12.4,
          positionRank: 4,
          minRank: 8,
          maxRank: 16,
          adp: 30,
          adpStandardDeviation: 5,
          adpTimesDrafted: 120,
          standardDeviation: 3,
        }),
        makePlayer({
          id: "wr-2",
          name: "Tee Higgins",
          team: "CIN",
          position: "WR",
          rankEcr: 20,
          averageRank: 20,
          rankAverage: 20.1,
          positionRank: 7,
          tier: 2,
          minRank: 15,
          maxRank: 26,
          adp: 21,
          adpStandardDeviation: 5,
          adpTimesDrafted: 120,
          standardDeviation: 3,
        }),
      ],
    });

    renderClient({ position: "overall" });

    // "ADP" appears in the column header and again as an sr-only cell label.
    expect(screen.getAllByText("ADP").length).toBeGreaterThan(0);
    expect(screen.getByText("vs ADP")).toBeInTheDocument();
    expect(screen.getByText(/ADP Fantasy Football Calculator/)).toBeVisible();

    // Rows expose their data outside the overlay open button, so scope
    // metric queries to the row's list item.
    const chaseButton = screen.getByRole("button", { name: "Open Ja'Marr Chase detail" });
    const chaseRow = chaseButton.closest("li") as HTMLElement;
    // Chase: ADP 30 vs rank 12 clears the noise threshold, so the delta is toned.
    expect(within(chaseRow).getByText("+18")).toHaveStyle({ color: "var(--home-positive)" });
    // The named chip rides beside the player, since the signed delta alone is
    // what a drafter has to translate.
    expect(within(chaseRow).getByText("Value +18")).toBeVisible();
    // Higgins: one pick of separation stays inside the noise band, muted.
    const higginsRow = screen
      .getByRole("button", { name: "Open Tee Higgins detail" })
      .closest("li") as HTMLElement;
    expect(within(higginsRow).getByText("+1")).toHaveStyle({ color: "var(--home-ink-muted)" });
    expect(within(higginsRow).queryByText(/^(Value|Reach) /)).not.toBeInTheDocument();

    fireEvent.click(chaseButton);
    const dialog = screen.getByRole("dialog", { name: "Ja'Marr Chase detail" });
    expect(within(dialog).getByText("Market ADP")).toBeVisible();
    expect(within(dialog).getByText(/picks after the consensus rank/)).toBeVisible();
  });

  it("suppresses the value chip on a position board, where the rank is not overall scale", () => {
    currentSearchParams = new URLSearchParams("position=wr&scoring=ppr");
    mockSnapshot({
      position: "wr",
      adpSource: FRESH_ADP_SOURCE,
      players: [
        makePlayer({
          id: "wr-1",
          name: "Ja'Marr Chase",
          team: "CIN",
          position: "WR",
          // On a position board rankEcr is the position rank, so comparing it
          // with an overall ADP would manufacture a huge fake value gap.
          rankEcr: 1,
          averageRank: 1,
          rankAverage: 1.4,
          positionRank: 1,
          minRank: 1,
          maxRank: 3,
          adp: 30,
          adpStandardDeviation: 5,
          adpTimesDrafted: 120,
          standardDeviation: 3,
        }),
      ],
    });

    renderClient({ position: "wr" });

    const row = screen
      .getByRole("button", { name: "Open Ja'Marr Chase detail" })
      .closest("li") as HTMLElement;
    expect(within(row).queryByText(/^(Value|Reach) /)).not.toBeInTheDocument();
    // The column still stands, but the cell holds an em dash rather than a gap
    // computed off two different scales.
    expect(within(row).getByText("—")).toBeVisible();
  });

  it("never calls a thin ADP sample market agreement", () => {
    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr");
    mockSnapshot({
      position: "overall",
      adpSource: FRESH_ADP_SOURCE,
      players: [
        makePlayer({
          id: "rb-thin",
          name: "Tyler Allgeier",
          team: "ATL",
          rankEcr: 129,
          averageRank: 129,
          rankAverage: 129.4,
          positionRank: 30,
          minRank: 110,
          maxRank: 150,
          adp: 155.3,
          adpStandardDeviation: 6,
          adpTimesDrafted: 19,
          standardDeviation: 8,
        }),
      ],
    });

    renderClient({ position: "overall" });

    // The +26.3 delta renders muted because the sample cannot be judged.
    const row = screen
      .getByRole("button", { name: "Open Tyler Allgeier detail" })
      .closest("li") as HTMLElement;
    expect(within(row).getByText("+26.3")).toHaveStyle({ color: "var(--home-ink-muted)" });

    fireEvent.click(screen.getByRole("button", { name: "Open Tyler Allgeier detail" }));
    const dialog = screen.getByRole("dialog", { name: "Tyler Allgeier detail" });
    expect(within(dialog).getByText(/Too few mock selections/)).toBeVisible();
    expect(within(dialog).queryByText(/noise band/)).not.toBeInTheDocument();
  });

  it("hides ADP surfaces and flags the staleness when the mock-draft sample is old", () => {
    mockSnapshot({
      players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey" })],
      adpSource: { ...FRESH_ADP_SOURCE, asOf: "2026-08-01T00:00:00.000Z" },
    });

    renderClient();

    expect(screen.getByText("ADP stale · signals hidden")).toBeVisible();
    expect(screen.queryByText("vs ADP")).not.toBeInTheDocument();
  });

  it("keeps scoring controls available when the selected position slice is unavailable", () => {
    mockSnapshot({
      players: [],
      sliceAvailable: false,
      sliceReason: "FantasyPros does not publish this board.",
    });

    renderClient();

    expect(screen.getByText(/PPR RB rankings are unavailable/)).toBeVisible();
    expect(screen.getByText("FantasyPros does not publish this board.")).toBeVisible();
    expect(screen.getByLabelText("Search the current rankings board")).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Half PPR" }));
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("scoring=half_ppr"),
      expect.anything()
    );
  });

  it("preserves the published rank when search filters the board down to one player", () => {
    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr");
    mockSnapshot({
      position: "overall",
      players: [
        makePlayer({ id: "rb-1", name: "Christian McCaffrey", rankEcr: 1 }),
        makePlayer({
          id: "rb-2",
          name: "Joe Mixon",
          team: "HOU",
          rankEcr: 47,
          averageRank: 47,
          rankAverage: 47.3,
          tier: 6,
          positionRank: 14,
          minRank: 40,
          maxRank: 55,
        }),
      ],
    });

    renderClient({ position: "overall" });

    fireEvent.change(screen.getByLabelText("Search the current rankings board"), {
      target: { value: "Mixon" },
    });

    expect(screen.getByText("Joe Mixon")).toBeVisible();
    expect(screen.queryByText("Christian McCaffrey")).not.toBeInTheDocument();
    expect(screen.getByText("47")).toBeVisible();
    expect(screen.getByText("1 of 2 shown")).toBeVisible();
  });

  it("shows the template empty state and clears the search from it", () => {
    mockSnapshot({
      players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey" })],
    });

    renderClient();

    fireEvent.change(screen.getByLabelText("Search the current rankings board"), {
      target: { value: "nobody" },
    });
    expect(screen.getByText("No players match on this board.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(mockReplace).toHaveBeenLastCalledWith(
      expect.stringContaining("position=overall"),
      expect.anything()
    );
  });

  it("bounds the initial rankings render and reveals the next window on demand", () => {
    mockSnapshot({
      players: Array.from({ length: 45 }, (_, index) =>
        makePlayer({
          id: `rb-${index + 1}`,
          name: `Player ${index + 1}`,
          rankEcr: index + 1,
          averageRank: index + 1,
          rankAverage: index + 1.1,
          positionRank: index + 1,
          minRank: index + 1,
          maxRank: index + 5,
        })
      ),
    });

    renderClient();

    expect(screen.getByText("Player 40")).toBeVisible();
    expect(screen.queryByText("Player 41")).not.toBeInTheDocument();
    expect(screen.getByText("40 of 45 shown")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Load more (5 left)" }));
    expect(screen.getByText("Player 45")).toBeVisible();
  });

  it("offers an in-place retry when rankings fail to load", () => {
    const { retry } = mockSnapshot({
      players: [],
      error: "Fantasy rankings are unavailable right now.",
    });

    renderClient();

    expect(screen.getByRole("alert")).toHaveTextContent("Fantasy rankings are unavailable right now.");
    expect(screen.getByText("Rankings unavailable")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Retry rankings" }));
    expect(retry).toHaveBeenCalled();
  });

  it("queues a player and saves a note from the drawer", () => {
    mockSnapshot({
      players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey" })],
    });

    renderClient();

    fireEvent.click(screen.getByRole("button", { name: "Open Christian McCaffrey detail" }));
    const dialog = screen.getByRole("dialog", { name: "Christian McCaffrey detail" });

    const queueButton = within(dialog).getByRole("button", { name: /Add to queue/ });
    fireEvent.click(queueButton);
    expect(within(dialog).getByRole("button", { name: /Queued/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.change(within(dialog).getByLabelText("Private note"), {
      target: { value: "target round 6" },
    });
    expect(within(dialog).getByText(/14\/280 · saved on this device/)).toBeVisible();
  });

  it("walks the board neighborhood from the drawer", () => {
    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr");
    mockSnapshot({
      position: "overall",
      players: ["Ashton Jeanty", "Nico Collins", "De'Von Achane", "Drake London", "A.J. Brown"].map(
        (name, index) =>
          makePlayer({
            id: `p-${index + 1}`,
            name,
            rankEcr: index + 11,
            averageRank: index + 11,
            rankAverage: index + 11.2,
            tier: 3,
            positionRank: index + 1,
            minRank: index + 9,
            maxRank: index + 16,
          })
      ),
    });

    renderClient({ position: "overall" });

    fireEvent.click(screen.getByRole("button", { name: "Open De'Von Achane detail" }));
    let dialog = screen.getByRole("dialog", { name: "De'Von Achane detail" });
    expect(within(dialog).getByText("Board neighborhood")).toBeVisible();

    fireEvent.click(within(dialog).getByRole("button", { name: /Nico Collins/ }));
    dialog = screen.getByRole("dialog", { name: "Nico Collins detail" });
    expect(dialog).toBeVisible();
  });
});
