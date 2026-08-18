import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { FantasyFootballClient } from "../fantasy-football-client";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { FANTASY_COMPARE_STORAGE_KEY } from "@/lib/fantasyLocal";

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

jest.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
    }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => true,
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
      updatedAt: "2026-04-15T15:29:20.000Z",
    },
    qb: {
      available: true,
      sourceKind: "shared_position_consensus",
      rangeKind: "position",
      playerCount: 0,
      updatedAt: "2026-04-15T15:29:20.000Z",
    },
    rb: {
      available: true,
      sourceKind: "position_consensus",
      rangeKind: "position",
      playerCount: 3,
      updatedAt: "2026-04-15T15:29:20.000Z",
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
  } as const;
}

describe("FantasyFootballClient", () => {
  beforeEach(() => {
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

  it("renders an available PPR board in the editorial shell and keeps the desktop rail sticky", () => {
    mockUseFantasySnapshot.mockReturnValue({
      players: [
        {
          id: "rb-1",
          name: "Christian McCaffrey",
          team: "SF",
          position: "RB",
          averageRank: 1,
          rankEcr: 1,
          rankAverage: 1.2,
          standardDeviation: 0.1,
          tier: 1,
          positionRank: 1,
          minRank: 1,
          maxRank: 1,
          ownership: 99.1,
          lastUpdated: "2026-04-15T15:29:20.000Z",
        },
      ],
      snapshot: null,
      metadata: {
        season: 2026,
        week: 0,
        generatedAt: "2026-04-15T16:00:00.000Z",
        upstreamUpdatedAt: "2026-04-15T15:29:20.000Z",
        scoringFormat: "PPR",
        source: "snapshot",
        position: "rb",
        playerCount: 1,
        slice: {
          available: true,
          sourceKind: "position_consensus",
          rangeKind: "position",
          playerCount: 1,
          updatedAt: "2026-04-15T15:29:20.000Z",
        },
        slices: buildSliceMetadataMap(),
      },
      sliceMetadata: {
        available: true,
        sourceKind: "position_consensus",
        rangeKind: "position",
        playerCount: 1,
        updatedAt: "2026-04-15T15:29:20.000Z",
      },
      sliceMetadataMap: buildSliceMetadataMap(),
      isLoading: false,
      error: null,
    });

    const { container } = render(
      <FantasyFootballClient
        initialState={{
          position: "rb",
          scoring: "ppr",
          view: "list",
          query: "",
        }}
      />
    );

    expect(container.firstChild).toHaveClass("home-page");
    expect(screen.getByRole("heading", { name: /RB rankings/i })).toBeVisible();
    const rankingsHeading = screen.getByRole("heading", { name: /RB rankings/i });
    const freshnessShortcut = screen.getByRole("link", { name: /Freshness/i });
    const queueShortcut = screen.getByRole("link", { name: /My queue/i });
    expect(freshnessShortcut).toHaveAttribute("href", "#fantasy-freshness");
    expect(queueShortcut).toHaveAttribute("href", "#fantasy-queue");
    expect(
      freshnessShortcut.compareDocumentPosition(rankingsHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      queueShortcut.compareDocumentPosition(rankingsHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.getByRole("radio", { name: /RB/i })).not.toBeDisabled();
    expect(screen.getByText("Christian McCaffrey")).toBeVisible();
    expect(screen.getAllByText(/Source updated/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Open best ball tools/i })).toHaveAttribute(
      "href",
      "/fantasy-football/best-ball"
    );
    expect(screen.queryByText(/^Proj\. Pts$/)).not.toBeInTheDocument();
    expect(container.querySelector("aside")).toHaveClass("lg:sticky", "lg:top-24", "lg:self-start");
    expect(container.querySelector("button button")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "What is Average rank?" }));
    expect(screen.queryByRole("dialog", { name: "Christian McCaffrey detail" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Open Christian McCaffrey detail/i }));
    expect(screen.getByRole("dialog", { name: "Christian McCaffrey detail" })).toBeVisible();
  });

  it("renders tier summaries and sourced-only board columns", () => {
    currentSearchParams = new URLSearchParams("position=qb&scoring=standard");
    mockUseFantasySnapshot.mockReturnValue({
      players: [
        {
          id: "qb-1",
          name: "Josh Allen",
          team: "BUF",
          position: "QB",
          averageRank: 1,
          rankEcr: 1,
          rankAverage: 1.39,
          standardDeviation: 0.58,
          tier: 1,
          positionRank: 1,
          minRank: 1,
          maxRank: 3,
        },
        {
          id: "qb-2",
          name: "Lamar Jackson",
          team: "BAL",
          position: "QB",
          averageRank: 2,
          rankEcr: 2,
          rankAverage: 1.73,
          standardDeviation: 0.57,
          tier: 1,
          positionRank: 2,
          minRank: 1,
          maxRank: 3,
        },
        {
          id: "qb-5",
          name: "Joe Burrow",
          team: "CIN",
          position: "QB",
          averageRank: 5,
          rankEcr: 5,
          rankAverage: 4.7,
          standardDeviation: 0.6,
          tier: 2,
          positionRank: 5,
          minRank: 2,
          maxRank: 5,
        },
      ],
      snapshot: null,
      metadata: {
        season: 2026,
        week: 0,
        generatedAt: "2026-04-15T16:00:00.000Z",
        upstreamUpdatedAt: "2026-04-15T15:29:20.000Z",
        scoringFormat: "STANDARD",
        source: "snapshot",
        position: "qb",
        playerCount: 3,
        slice: {
          available: true,
          sourceKind: "shared_position_consensus",
          rangeKind: "position",
          playerCount: 3,
          updatedAt: "2026-04-15T15:29:20.000Z",
        },
        slices: {
          ...buildSliceMetadataMap(),
          qb: {
            available: true,
            sourceKind: "shared_position_consensus",
            rangeKind: "position",
            playerCount: 3,
            updatedAt: "2026-04-15T15:29:20.000Z",
          },
        },
      },
      sliceMetadata: {
        available: true,
        sourceKind: "shared_position_consensus",
        rangeKind: "position",
        playerCount: 3,
        updatedAt: "2026-04-15T15:29:20.000Z",
      },
      sliceMetadataMap: {
        ...buildSliceMetadataMap(),
        qb: {
          available: true,
          sourceKind: "shared_position_consensus",
          rangeKind: "position",
          playerCount: 3,
          updatedAt: "2026-04-15T15:29:20.000Z",
        },
      },
      isLoading: false,
      error: null,
    });

    render(
      <FantasyFootballClient
        initialState={{
          position: "qb",
          scoring: "standard",
          view: "list",
          query: "",
        }}
      />
    );

    expect(screen.getAllByText("Tier 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tier 2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Expert range").length).toBeGreaterThan(0);
    // No adpSource in the snapshot means the ADP column stays hidden.
    expect(screen.queryByText(/^ADP$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Proj\. Pts$/)).not.toBeInTheDocument();
  });

  it("uses the active position slice when persisted players open in compare", () => {
    currentSearchParams = new URLSearchParams("position=qb&scoring=ppr");
    const currentSourceDate = new Date().toISOString();
    const overallPlayers = [
      {
        id: "qb-1",
        name: "Josh Allen",
        team: "BUF",
        position: "QB" as const,
        averageRank: 26,
        rankEcr: 26,
        rankAverage: 26,
        standardDeviation: 1,
        tier: 4,
        positionRank: 1,
        minRank: 24,
        maxRank: 29,
      },
      {
        id: "qb-2",
        name: "Lamar Jackson",
        team: "BAL",
        position: "QB" as const,
        averageRank: 31,
        rankEcr: 31,
        rankAverage: 31,
        standardDeviation: 1,
        tier: 5,
        positionRank: 2,
        minRank: 29,
        maxRank: 34,
      },
    ];
    const qbPlayers = [
      { ...overallPlayers[0], averageRank: 1, rankEcr: 1, rankAverage: 1.2, tier: 1, minRank: 1, maxRank: 3 },
      { ...overallPlayers[1], averageRank: 2, rankEcr: 2, rankAverage: 1.8, tier: 2, minRank: 1, maxRank: 4 },
    ];
    const positions = {
      QB: qbPlayers,
      RB: [],
      WR: [],
      TE: [],
      K: [],
      DST: [],
      FLEX: [],
    };
    const sliceMetadata = {
      ...buildSliceMetadataMap(),
      qb: {
        available: true,
        sourceKind: "shared_position_consensus" as const,
        rangeKind: "position" as const,
        playerCount: 2,
        updatedAt: currentSourceDate,
      },
    };

    window.localStorage.setItem(
      FANTASY_COMPARE_STORAGE_KEY,
      JSON.stringify(["qb-1", "qb-2"])
    );
    mockUseFantasySnapshot.mockReturnValue({
      players: qbPlayers,
      snapshot: {
        schemaVersion: 7,
        season: 2026,
        week: 0,
        generatedAt: currentSourceDate,
        upstreamUpdatedAt: currentSourceDate,
        scoringFormat: "PPR",
        source: "snapshot",
        adpSource: null,
        positions,
        overall: overallPlayers,
        sliceMetadata,
      },
      metadata: {
        season: 2026,
        week: 0,
        generatedAt: currentSourceDate,
        upstreamUpdatedAt: currentSourceDate,
        scoringFormat: "PPR",
        source: "snapshot",
        position: "qb",
        playerCount: 2,
        slice: sliceMetadata.qb,
        slices: sliceMetadata,
        adpSource: null,
      },
      sliceMetadata: sliceMetadata.qb,
      sliceMetadataMap: sliceMetadata,
      isLoading: false,
      error: null,
    });

    render(
      <FantasyFootballClient
        initialState={{ position: "qb", scoring: "ppr", view: "list", query: "" }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Compare 2" }));

    const tierRow = screen.getByRole("rowheader", { name: "Tier" }).closest("tr");
    expect(tierRow).not.toBeNull();
    const tierCells = within(tierRow as HTMLTableRowElement).getAllByRole("cell");
    expect(tierCells[0]).toHaveTextContent("1");
    expect(tierCells[0]).not.toHaveTextContent("4");
    expect(tierCells[1]).toHaveTextContent("2");
    expect(tierCells[1]).not.toHaveTextContent("5");
  });

  it("uses one overall scale for a cross-position comparison", () => {
    currentSearchParams = new URLSearchParams("position=rb&scoring=ppr");
    const currentSourceDate = new Date().toISOString();
    const overallTaylor = {
      id: "rb-taylor",
      name: "Jonathan Taylor",
      team: "IND",
      position: "RB" as const,
      averageRank: 6,
      rankEcr: 6,
      rankAverage: 6,
      standardDeviation: 1,
      tier: 1,
      positionRank: 4,
      minRank: 5,
      maxRank: 8,
    };
    const overallJaxon = {
      id: "wr-jaxon",
      name: "Jaxon Smith-Njigba",
      team: "SEA",
      position: "WR" as const,
      averageRank: 5,
      rankEcr: 5,
      rankAverage: 5,
      standardDeviation: 1,
      tier: 1,
      positionRank: 3,
      minRank: 4,
      maxRank: 7,
    };
    const rbTaylor = {
      ...overallTaylor,
      averageRank: 4,
      rankEcr: 4,
      rankAverage: 4,
      positionRank: 4,
      minRank: 3,
      maxRank: 5,
    };
    const wrJaxon = {
      ...overallJaxon,
      averageRank: 3,
      rankEcr: 3,
      rankAverage: 3,
      positionRank: 3,
      minRank: 2,
      maxRank: 4,
    };
    const sliceMetadata = {
      ...buildSliceMetadataMap(),
      rb: {
        available: true,
        sourceKind: "position_consensus" as const,
        rangeKind: "position" as const,
        playerCount: 1,
        updatedAt: currentSourceDate,
      },
      wr: {
        available: true,
        sourceKind: "position_consensus" as const,
        rangeKind: "position" as const,
        playerCount: 1,
        updatedAt: currentSourceDate,
      },
    };

    window.localStorage.setItem(
      FANTASY_COMPARE_STORAGE_KEY,
      JSON.stringify([overallTaylor.id, overallJaxon.id])
    );
    mockUseFantasySnapshot.mockReturnValue({
      players: [rbTaylor],
      snapshot: {
        schemaVersion: 7,
        season: 2026,
        week: 0,
        generatedAt: currentSourceDate,
        upstreamUpdatedAt: currentSourceDate,
        scoringFormat: "PPR",
        source: "snapshot",
        adpSource: null,
        positions: {
          QB: [],
          RB: [rbTaylor],
          WR: [wrJaxon],
          TE: [],
          K: [],
          DST: [],
          FLEX: [],
        },
        overall: [overallTaylor, overallJaxon],
        sliceMetadata,
      },
      metadata: {
        season: 2026,
        week: 0,
        generatedAt: currentSourceDate,
        upstreamUpdatedAt: currentSourceDate,
        scoringFormat: "PPR",
        source: "snapshot",
        position: "rb",
        playerCount: 1,
        slice: sliceMetadata.rb,
        slices: sliceMetadata,
        adpSource: null,
      },
      sliceMetadata: sliceMetadata.rb,
      sliceMetadataMap: sliceMetadata,
      isLoading: false,
      error: null,
    });

    render(
      <FantasyFootballClient
        initialState={{ position: "rb", scoring: "ppr", view: "list", query: "" }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Compare 2" }));

    const rankRow = screen.getByRole("rowheader", { name: "Consensus rank" }).closest("tr");
    expect(rankRow).not.toBeNull();
    const rankCells = within(rankRow as HTMLTableRowElement).getAllByRole("cell");
    expect(rankCells[0]).toHaveTextContent(/^6$/);
    expect(rankCells[1]).toHaveTextContent("5Best");

    const positionRow = screen.getByRole("rowheader", { name: "Position rank" }).closest("tr");
    expect(positionRow).not.toBeNull();
    const positionCells = within(positionRow as HTMLTableRowElement).getAllByRole("cell");
    expect(positionCells[0]).toHaveTextContent("RB 4");
    expect(positionCells[1]).toHaveTextContent("WR 3");
    expect(within(positionRow as HTMLTableRowElement).queryByText("Best")).not.toBeInTheDocument();
  });

  it("retains unresolved compare IDs while any snapshot slice is unavailable", () => {
    currentSearchParams = new URLSearchParams("position=qb&scoring=ppr");
    const currentSourceDate = new Date().toISOString();
    const quarterback = {
      id: "qb-current",
      name: "Current Quarterback",
      team: "BUF",
      position: "QB" as const,
      averageRank: 1,
      rankEcr: 1,
      standardDeviation: 1,
      tier: 1,
      positionRank: 1,
      minRank: 1,
      maxRank: 2,
    };
    const sliceMetadata = {
      ...buildSliceMetadataMap(),
      qb: {
        available: true,
        sourceKind: "shared_position_consensus" as const,
        rangeKind: "position" as const,
        playerCount: 1,
        updatedAt: currentSourceDate,
      },
      rb: {
        available: false,
        sourceKind: "unavailable" as const,
        rangeKind: "none" as const,
        playerCount: 0,
        reason: "The RB source did not load.",
      },
    };
    const unresolvedIds = ["rb-from-unavailable-slice"];
    window.localStorage.setItem(
      FANTASY_COMPARE_STORAGE_KEY,
      JSON.stringify(unresolvedIds)
    );
    mockUseFantasySnapshot.mockReturnValue({
      players: [quarterback],
      snapshot: {
        schemaVersion: 7,
        season: 2026,
        week: 0,
        generatedAt: currentSourceDate,
        upstreamUpdatedAt: currentSourceDate,
        scoringFormat: "PPR",
        source: "snapshot",
        adpSource: null,
        positions: {
          QB: [quarterback],
          RB: [],
          WR: [],
          TE: [],
          K: [],
          DST: [],
          FLEX: [],
        },
        overall: [quarterback],
        sliceMetadata,
      },
      metadata: {
        season: 2026,
        week: 0,
        generatedAt: currentSourceDate,
        upstreamUpdatedAt: currentSourceDate,
        scoringFormat: "PPR",
        source: "snapshot",
        position: "qb",
        playerCount: 1,
        slice: sliceMetadata.qb,
        slices: sliceMetadata,
        adpSource: null,
      },
      sliceMetadata: sliceMetadata.qb,
      sliceMetadataMap: sliceMetadata,
      isLoading: false,
      error: null,
    });

    render(
      <FantasyFootballClient
        initialState={{ position: "qb", scoring: "ppr", view: "list", query: "" }}
      />
    );

    expect(JSON.parse(window.localStorage.getItem(FANTASY_COMPARE_STORAGE_KEY) ?? "[]"))
      .toEqual(unresolvedIds);
  });

  it("renders the ADP column, value signals, and source disclosure when the snapshot carries ADP", () => {
    currentSearchParams = new URLSearchParams("position=rb&scoring=ppr");
    const currentSourceDate = new Date().toISOString();
    const adpSource = {
      provider: "Fantasy Football Calculator",
      url: "https://example.test/adp/ppr",
      asOf: currentSourceDate,
      sampleSize: 421,
      matchedCount: 180,
    };

    mockUseFantasySnapshot.mockReturnValue({
      players: [
        {
          id: "rb-1",
          name: "Bijan Robinson",
          team: "ATL",
          position: "RB",
          averageRank: 1,
          rankEcr: 1,
          rankAverage: 1.2,
          standardDeviation: 0.1,
          tier: 1,
          positionRank: 1,
          minRank: 1,
          maxRank: 2,
          adp: 2.2,
        },
        {
          // Drafters take him 14 spots later than the experts rank him.
          id: "rb-2",
          name: "Value Back",
          team: "GB",
          position: "RB",
          averageRank: 20,
          rankEcr: 20,
          rankAverage: 20.5,
          standardDeviation: 1.0,
          tier: 3,
          positionRank: 20,
          minRank: 16,
          maxRank: 25,
          adp: 34.1,
        },
        {
          // No matched ADP reading at all.
          id: "rb-3",
          name: "Unmatched Back",
          team: "NYJ",
          position: "RB",
          averageRank: 30,
          rankEcr: 30,
          rankAverage: 30.5,
          standardDeviation: 1.4,
          tier: 4,
          positionRank: 30,
          minRank: 26,
          maxRank: 36,
        },
      ],
      snapshot: null,
      metadata: {
        season: 2026,
        week: 0,
        generatedAt: currentSourceDate,
        upstreamUpdatedAt: currentSourceDate,
        scoringFormat: "PPR",
        source: "snapshot",
        position: "rb",
        playerCount: 3,
        slice: {
          available: true,
          sourceKind: "position_consensus",
          rangeKind: "position",
          playerCount: 3,
          updatedAt: currentSourceDate,
        },
        slices: buildSliceMetadataMap(),
        adpSource,
      },
      sliceMetadata: {
        available: true,
        sourceKind: "position_consensus",
        rangeKind: "position",
        playerCount: 3,
        updatedAt: currentSourceDate,
      },
      sliceMetadataMap: buildSliceMetadataMap(),
      isLoading: false,
      error: null,
    });

    render(
      <FantasyFootballClient
        initialState={{
          position: "rb",
          scoring: "ppr",
          view: "list",
          query: "",
        }}
      />
    );

    expect(screen.getAllByText(/^ADP$/).length).toBeGreaterThan(0);
    expect(screen.getByText("2.2")).toBeVisible();
    // Value/Reach compares consensus rank to overall ADP, so it is suppressed on
    // position boards where rankEcr is the position rank (see getValueVsAdp). The
    // ADP number still renders; only the scale-invalid chip is withheld.
    expect(screen.queryByText(/Value \+14/)).not.toBeInTheDocument();
    expect(screen.getByText("34.1")).toBeVisible();
    // The unmatched player shows the blank marker instead of a fabricated number.
    expect(screen.getAllByText("--").length).toBeGreaterThan(0);
    // Provenance is disclosed in the freshness rail.
    expect(screen.getByText("ADP source")).toBeVisible();
    expect(screen.getByText("Fantasy Football Calculator")).toBeVisible();
    expect(screen.getByText(/from 421 mock drafts/)).toBeVisible();
  });

  it("marks prior-season ADP stale once draft season begins", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-07T12:00:00.000Z"));
    currentSearchParams = new URLSearchParams("position=rb&scoring=ppr&view=tiers");
    mockUseFantasySnapshot.mockReturnValue({
      players: [
        {
          id: "rb-1",
          name: "Bijan Robinson",
          team: "ATL",
          position: "RB",
          averageRank: 1,
          rankEcr: 1,
          rankAverage: 1.2,
          standardDeviation: 0.1,
          tier: 1,
          positionRank: 1,
          minRank: 1,
          maxRank: 2,
          adp: 2.2,
        },
      ],
      snapshot: null,
      metadata: {
        season: 2026,
        week: 0,
        generatedAt: "2026-06-17T19:27:53.000Z",
        upstreamUpdatedAt: "2026-06-17T14:38:09.000Z",
        scoringFormat: "PPR",
        source: "snapshot",
        position: "rb",
        playerCount: 1,
        slice: {
          available: true,
          sourceKind: "position_consensus",
          rangeKind: "position",
          playerCount: 1,
          updatedAt: "2026-06-17T14:38:09.000Z",
        },
        slices: buildSliceMetadataMap(),
        adpSource: {
          provider: "Fantasy Football Calculator",
          url: "https://example.test/adp/ppr",
          asOf: "2025-09-10T00:00:00.000Z",
          sampleSize: 870,
          matchedCount: 169,
        },
      },
      sliceMetadata: {
        available: true,
        sourceKind: "position_consensus",
        rangeKind: "position",
        playerCount: 1,
        updatedAt: "2026-06-17T14:38:09.000Z",
      },
      sliceMetadataMap: buildSliceMetadataMap(),
      isLoading: false,
      error: null,
    });

    render(
      <FantasyFootballClient
        initialState={{
          position: "rb",
          scoring: "ppr",
          view: "tiers",
          query: "",
        }}
      />
    );

    expect(screen.getAllByText("Stale").length).toBeGreaterThan(0);
    expect(screen.getByText(/Treat value and reach labels as unavailable/)).toBeVisible();
    expect(screen.queryByText("2.2")).not.toBeInTheDocument();
  });

  it("preserves the published rank when search filters the board down to one player", () => {
    currentSearchParams = new URLSearchParams("position=rb&scoring=standard");
    mockUseFantasySnapshot.mockReturnValue({
      players: [
        {
          id: "rb-1",
          name: "Saquon Barkley",
          team: "PHI",
          position: "RB",
          averageRank: 2,
          rankEcr: 2,
          rankAverage: 2.4,
          standardDeviation: 0.3,
          tier: 1,
          positionRank: 2,
          minRank: 1,
          maxRank: 3,
        },
        {
          id: "rb-47",
          name: "Joe Mixon",
          team: "HOU",
          position: "RB",
          averageRank: 47,
          rankEcr: 47,
          rankAverage: 46.7,
          standardDeviation: 1.1,
          tier: 5,
          positionRank: 47,
          minRank: 44,
          maxRank: 50,
        },
      ],
      snapshot: null,
      metadata: {
        season: 2026,
        week: 0,
        generatedAt: "2026-04-15T16:00:00.000Z",
        upstreamUpdatedAt: "2026-04-15T15:29:20.000Z",
        scoringFormat: "STANDARD",
        source: "snapshot",
        position: "rb",
        playerCount: 2,
        slice: {
          available: true,
          sourceKind: "position_consensus",
          rangeKind: "position",
          playerCount: 2,
          updatedAt: "2026-04-15T15:29:20.000Z",
        },
        slices: buildSliceMetadataMap(),
      },
      sliceMetadata: {
        available: true,
        sourceKind: "position_consensus",
        rangeKind: "position",
        playerCount: 2,
        updatedAt: "2026-04-15T15:29:20.000Z",
      },
      sliceMetadataMap: buildSliceMetadataMap(),
      isLoading: false,
      error: null,
    });

    render(
      <FantasyFootballClient
        initialState={{
          position: "rb",
          scoring: "standard",
          view: "list",
          query: "",
        }}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/search rb board/i), {
      target: { value: "Mixon" },
    });

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("q=Mixon"),
      { scroll: false }
    );
    expect(screen.getByText("Joe Mixon")).toBeVisible();
    expect(screen.queryByText("Saquon Barkley")).not.toBeInTheDocument();
    expect(screen.getByText("47")).toBeVisible();
  });

  it("bounds the initial rankings render and reveals the next window on demand", () => {
    const currentSourceDate = new Date().toISOString();
    const players = Array.from({ length: 45 }, (_, index) => ({
      id: `rb-${index + 1}`,
      name: `Player ${index + 1}`,
      team: "FA",
      position: "RB" as const,
      averageRank: index + 1,
      rankEcr: index + 1,
      rankAverage: index + 1,
      standardDeviation: 1,
      tier: Math.floor(index / 10) + 1,
      positionRank: index + 1,
      minRank: index + 1,
      maxRank: index + 1,
    }));
    const sliceMetadataMap = {
      ...buildSliceMetadataMap(),
      rb: {
        available: true,
        sourceKind: "position_consensus" as const,
        rangeKind: "position" as const,
        playerCount: players.length,
        updatedAt: currentSourceDate,
      },
    };
    mockUseFantasySnapshot.mockReturnValue({
      players,
      snapshot: null,
      metadata: {
        season: 2026,
        week: 0,
        generatedAt: currentSourceDate,
        upstreamUpdatedAt: currentSourceDate,
        scoringFormat: "PPR",
        source: "snapshot",
        position: "rb",
        playerCount: players.length,
        slice: sliceMetadataMap.rb,
        slices: sliceMetadataMap,
      },
      sliceMetadata: sliceMetadataMap.rb,
      sliceMetadataMap,
      isLoading: false,
      error: null,
    });

    render(
      <FantasyFootballClient
        initialState={{ position: "rb", scoring: "ppr", view: "list", query: "" }}
      />
    );

    expect(screen.getByText("Player 40")).toBeVisible();
    expect(screen.queryByText("Player 41")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load more (5 left)" }));
    expect(screen.getByText("Player 45")).toBeVisible();
  });

  it("keeps scoring controls available when the selected position slice is unavailable", () => {
    const retry = jest.fn();
    mockUseFantasySnapshot.mockReturnValue({
      players: [],
      snapshot: null,
      metadata: null,
      sliceMetadata: {
        available: false,
        sourceKind: "position_consensus",
        rangeKind: "position",
        playerCount: 0,
        reason: "Source did not publish this slice.",
      },
      sliceMetadataMap: {
        ...buildSliceMetadataMap(),
        rb: {
          available: false,
          sourceKind: "position_consensus",
          rangeKind: "position",
          playerCount: 0,
          reason: "Source did not publish this slice.",
        },
      },
      isLoading: false,
      error: null,
      retry,
    });

    render(
      <FantasyFootballClient initialState={{ position: "rb", scoring: "ppr", view: "list", query: "" }} />
    );

    const halfPpr = screen.getByRole("button", { name: "Half PPR" });
    expect(halfPpr).not.toBeDisabled();
    fireEvent.click(halfPpr);
    // Filter state replaces rather than pushes, so Back leaves the page instead
    // of walking back through every position and scoring tap. Changed with the
    // fix; the assertion here is the navigation call, not the history growth.
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining("scoring=half_ppr"), { scroll: false });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("offers an in-place retry when rankings fail to load", () => {
    const retry = jest.fn();
    mockUseFantasySnapshot.mockReturnValue({
      players: [],
      snapshot: null,
      metadata: null,
      sliceMetadata: null,
      sliceMetadataMap: null,
      isLoading: false,
      error: "Fantasy rankings are unavailable right now.",
      retry,
    });

    render(
      <FantasyFootballClient initialState={{ position: "rb", scoring: "ppr", view: "list", query: "" }} />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Fantasy rankings are unavailable right now."
    );
    expect(screen.queryByText("No matching players")).not.toBeInTheDocument();
    expect(screen.getByText("Rankings unavailable")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Retry rankings" }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(mockUseFantasySnapshot).toHaveBeenCalledTimes(1);
  });

  it("keeps density controls usable when browser storage is blocked", () => {
    mockUseFantasySnapshot.mockReturnValue({
      players: [],
      snapshot: null,
      metadata: null,
      sliceMetadata: null,
      sliceMetadataMap: null,
      isLoading: false,
      error: "Fantasy rankings are unavailable right now.",
      retry: jest.fn(),
    });
    const getItem = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new DOMException("Blocked", "SecurityError");
      });
    const setItem = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("Blocked", "SecurityError");
      });

    try {
      render(
        <FantasyFootballClient
          initialState={{ position: "rb", scoring: "ppr", view: "list", query: "" }}
        />
      );

      const compact = screen.getByRole("radio", { name: "Compact" });
      const comfortable = screen.getByRole("radio", { name: "Comfortable" });
      expect(comfortable).toHaveAttribute("tabindex", "0");
      expect(compact).toHaveAttribute("tabindex", "-1");
      comfortable.focus();
      fireEvent.keyDown(comfortable, { key: "ArrowRight" });
      expect(compact).toHaveAttribute("aria-checked", "true");
      expect(compact).toHaveFocus();
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });
});
