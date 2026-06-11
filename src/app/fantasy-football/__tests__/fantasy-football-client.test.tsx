import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { FantasyFootballClient } from "../fantasy-football-client";

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
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
    }) => <div {...props}>{children}</div>,
  },
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
    currentSearchParams = new URLSearchParams("position=rb&scoring=ppr");
    mockPush.mockReset();
    mockReplace.mockReset();
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
        }}
      />
    );

    expect(container.firstChild).toHaveClass("home-page");
    expect(screen.getByRole("heading", { name: /RB rankings/i })).toBeVisible();
    expect(screen.getByRole("radio", { name: /RB/i })).not.toBeDisabled();
    expect(screen.getByText("Christian McCaffrey")).toBeVisible();
    expect(screen.getAllByText(/Source updated/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/^Proj\. Pts$/)).not.toBeInTheDocument();
    expect(container.querySelector("aside")).toHaveClass("lg:sticky", "lg:top-24", "lg:self-start");
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

  it("renders the ADP column, value signals, and source disclosure when the snapshot carries ADP", () => {
    currentSearchParams = new URLSearchParams("position=rb&scoring=ppr");
    const adpSource = {
      provider: "Fantasy Football Calculator",
      url: "https://example.test/adp/ppr",
      asOf: "2026-06-07T00:00:00.000Z",
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
        generatedAt: "2026-06-08T16:00:00.000Z",
        upstreamUpdatedAt: "2026-06-08T15:29:20.000Z",
        scoringFormat: "PPR",
        source: "snapshot",
        position: "rb",
        playerCount: 3,
        slice: {
          available: true,
          sourceKind: "position_consensus",
          rangeKind: "position",
          playerCount: 3,
          updatedAt: "2026-06-08T15:29:20.000Z",
        },
        slices: buildSliceMetadataMap(),
        adpSource,
      },
      sliceMetadata: {
        available: true,
        sourceKind: "position_consensus",
        rangeKind: "position",
        playerCount: 3,
        updatedAt: "2026-06-08T15:29:20.000Z",
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
        }}
      />
    );

    expect(screen.getAllByText(/^ADP$/).length).toBeGreaterThan(0);
    expect(screen.getByText("2.2")).toBeVisible();
    expect(screen.getByText(/Value \+14/)).toBeVisible();
    // The unmatched player shows the blank marker instead of a fabricated number.
    expect(screen.getAllByText("--").length).toBeGreaterThan(0);
    // Provenance is disclosed in the freshness rail.
    expect(screen.getByText("ADP source")).toBeVisible();
    expect(screen.getByText("Fantasy Football Calculator")).toBeVisible();
    expect(screen.getByText(/from 421 mock drafts/)).toBeVisible();
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
        }}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/search rb board/i), {
      target: { value: "Mixon" },
    });

    expect(screen.getByText("Joe Mixon")).toBeVisible();
    expect(screen.queryByText("Saquon Barkley")).not.toBeInTheDocument();
    expect(screen.getByText("47")).toBeVisible();
  });
});
