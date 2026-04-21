import React from "react";
import { render, screen } from "@testing-library/react";
import { DraftTrackerClient } from "../draft-tracker-client";

const mockUseDraftState = jest.fn();
const mockUseFantasySnapshot = jest.fn();

jest.mock("@/hooks/useFantasySnapshot", () => ({
  useFantasySnapshot: () => mockUseFantasySnapshot(),
}));

jest.mock("../hooks/useDraftState", () => ({
  useDraftState: () => mockUseDraftState(),
}));

jest.mock("../components/DraftSetup", () => ({
  DraftSetup: () => <div>Draft setup mock</div>,
}));

describe("DraftTrackerClient", () => {
  beforeEach(() => {
    mockUseDraftState.mockReturnValue({
      draftState: {
        settings: {
          totalTeams: 10,
          userTeam: 1,
          scoringFormat: "PPR",
          draftType: "snake",
          rounds: 15,
        },
        picks: [{ pickNumber: 1, teamNumber: 1, round: 1, player: { id: "picked-1" } }],
        currentPick: 2,
        currentRound: 1,
        isActive: true,
        undoHistory: [],
        teams: [
          {
            teamNumber: 1,
            picks: [],
            positionCounts: { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 },
            totalValue: 0,
            projectedPoints: 0,
          },
        ],
      },
      updateSettings: jest.fn(),
      startDraft: jest.fn(),
      draftPlayer: jest.fn(),
      resetDraft: jest.fn(),
      exportDraftResults: jest.fn(),
      isUserPick: true,
      isDraftComplete: false,
      currentTeamName: "Your Turn",
      currentTeamNumber: 1,
      userTeam: {
        teamNumber: 1,
        picks: [],
        positionCounts: { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 },
        totalValue: 0,
        projectedPoints: 0,
      },
    });

    mockUseFantasySnapshot.mockReturnValue({
      snapshot: {
        overall: [
          {
            id: "rb-1",
            name: "Bijan Robinson",
            team: "ATL",
            position: "RB",
            averageRank: 1,
            rankEcr: 1,
            rankAverage: 1.1,
            standardDeviation: 0.5,
            tier: 1,
            minRank: 1,
            maxRank: 2,
          },
        ],
        sliceMetadata: {
          overall: {
            available: true,
            sourceKind: "overall_consensus",
            rangeKind: "overall",
            playerCount: 1,
            updatedAt: "2026-04-15T15:29:20.000Z",
          },
        },
      },
      metadata: {
        season: 2026,
        week: 0,
        generatedAt: "2026-04-15T16:00:00.000Z",
        upstreamUpdatedAt: "2026-04-15T15:29:20.000Z",
      },
      isLoading: false,
      error: null,
    });
  });

  it("renders the editorial shell and sourced-only draft board copy", () => {
    const { container } = render(<DraftTrackerClient />);

    expect(container.firstChild).toHaveClass("home-page");
    expect(screen.getByRole("heading", { name: /Manual draft tracking that actually stays usable\./i })).toBeVisible();
    expect(screen.getAllByText(/Source updated/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Pick #2 on the clock/i })).toBeVisible();
    expect(screen.queryByText(/^ADP$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Proj\. Pts$/)).not.toBeInTheDocument();
  });
});
