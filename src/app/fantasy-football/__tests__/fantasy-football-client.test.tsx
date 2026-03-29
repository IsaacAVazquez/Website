import React from "react";
import { render, screen } from "@testing-library/react";
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
    overall: { available: true, sourceKind: "derived_overall", rangeKind: "overall", playerCount: 0 },
    qb: {
      available: true,
      sourceKind: "shared_position_consensus",
      rangeKind: "position",
      playerCount: 0,
    },
    rb: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 3 },
    wr: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 0 },
    te: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 0 },
    flex: { available: true, sourceKind: "derived_flex", rangeKind: "position", playerCount: 0 },
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

  it("renders an available PPR board and keeps the desktop rail sticky", () => {
    mockUseFantasySnapshot.mockReturnValue({
      players: [
        {
          id: "rb-1",
          name: "Christian McCaffrey",
          team: "SF",
          position: "RB",
          averageRank: 1,
          projectedPoints: 291,
          standardDeviation: 0.1,
          tier: 1,
          positionRank: 1,
          minRank: 1,
          maxRank: 1,
          expertRanks: [1],
        },
      ],
      snapshot: null,
      metadata: {
        season: 2026,
        week: 0,
        generatedAt: "2026-03-18T00:00:00.000Z",
        scoringFormat: "PPR",
        source: "snapshot",
        position: "rb",
        playerCount: 1,
        slice: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 1 },
        slices: buildSliceMetadataMap(),
      },
      sliceMetadata: {
        available: true,
        sourceKind: "position_consensus",
        rangeKind: "position",
        playerCount: 1,
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
        }}
      />
    );

    expect(screen.getByRole("heading", { name: /RB rankings/i })).toBeVisible();
    expect(screen.getByRole("tab", { name: /RB/i })).toHaveAttribute("aria-disabled", "false");
    expect(screen.getByText("Christian McCaffrey")).toBeVisible();
    expect(container.querySelector("aside")).toHaveClass("lg:sticky", "lg:top-24", "lg:self-start");
  });

  it("renders tier summaries from corrected multi-tier snapshot data", () => {
    currentSearchParams = new URLSearchParams("position=qb&scoring=standard");
    mockUseFantasySnapshot.mockReturnValue({
      players: [
        {
          id: "qb-1",
          name: "Josh Allen",
          team: "BUF",
          position: "QB",
          averageRank: 1.39,
          projectedPoints: 364,
          standardDeviation: 0.58,
          tier: 1,
          positionRank: 1,
          minRank: 1,
          maxRank: 3,
          expertRanks: [1],
        },
        {
          id: "qb-2",
          name: "Lamar Jackson",
          team: "BAL",
          position: "QB",
          averageRank: 1.73,
          projectedPoints: 361,
          standardDeviation: 0.57,
          tier: 1,
          positionRank: 2,
          minRank: 1,
          maxRank: 3,
          expertRanks: [2],
        },
        {
          id: "qb-5",
          name: "Joe Burrow",
          team: "CIN",
          position: "QB",
          averageRank: 4.7,
          projectedPoints: 330,
          standardDeviation: 0.6,
          tier: 2,
          positionRank: 5,
          minRank: 2,
          maxRank: 5,
          expertRanks: [5],
        },
      ],
      snapshot: null,
      metadata: {
        season: 2026,
        week: 0,
        generatedAt: "2026-03-18T00:00:00.000Z",
        scoringFormat: "STANDARD",
        source: "snapshot",
        position: "qb",
        playerCount: 3,
        slice: {
          available: true,
          sourceKind: "shared_position_consensus",
          rangeKind: "position",
          playerCount: 3,
        },
        slices: {
          ...buildSliceMetadataMap(),
          qb: {
            available: true,
            sourceKind: "shared_position_consensus",
            rangeKind: "position",
            playerCount: 3,
          },
        },
      },
      sliceMetadata: {
        available: true,
        sourceKind: "shared_position_consensus",
        rangeKind: "position",
        playerCount: 3,
      },
      sliceMetadataMap: {
        ...buildSliceMetadataMap(),
        qb: {
          available: true,
          sourceKind: "shared_position_consensus",
          rangeKind: "position",
          playerCount: 3,
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
        }}
      />
    );

    expect(screen.getAllByText("Tier 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tier 2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Position range").length).toBeGreaterThan(0);
  });
});
