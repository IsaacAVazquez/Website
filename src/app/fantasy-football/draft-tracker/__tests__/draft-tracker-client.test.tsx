import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { DraftTrackerClient } from "../draft-tracker-client";

const mockUseDraftState = jest.fn();
const mockUseFantasySnapshot = jest.fn();
const mockExportDraftResults = jest.fn();
const mockDraftPlayer = jest.fn();

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

jest.mock("../hooks/useDraftState", () => ({
  useDraftState: () => mockUseDraftState(),
}));

jest.mock("../components/DraftSetup", () => ({
  DraftSetup: () => <div>Draft setup mock</div>,
}));

describe("DraftTrackerClient", () => {
  beforeEach(() => {
    mockExportDraftResults.mockReset();
    mockDraftPlayer.mockReset();
    mockUseDraftState.mockReturnValue({
      draftState: {
        settings: {
          totalTeams: 10,
          userTeam: 1,
          scoringFormat: "PPR",
          draftType: "snake",
          rounds: 15,
          timerSeconds: 90,
          lineup: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DST: 1 },
        },
        picks: [{ pickNumber: 1, teamNumber: 1, round: 1, player: { id: "picked-1", adp: 1 } }],
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
      draftPlayer: mockDraftPlayer,
      undoLastPick: jest.fn(),
      redoLastPick: jest.fn(),
      undoToPick: jest.fn(),
      setTeamName: jest.fn(),
      getTeamName: (teamNumber: number) => `Team ${teamNumber}`,
      canRedo: false,
      resetDraft: jest.fn(),
      exportDraftResults: mockExportDraftResults,
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
        scoringFormat: "PPR",
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
        positions: {
          QB: [],
          RB: [],
          WR: [],
          TE: [],
          K: [],
          DST: [],
          FLEX: [],
        },
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
        scoringFormat: "PPR",
        generatedAt: "2026-04-15T16:00:00.000Z",
        upstreamUpdatedAt: "2026-04-15T15:29:20.000Z",
      },
      isLoading: false,
      error: null,
      retry: jest.fn(),
    });
  });

  it("renders the editorial shell and sourced-only draft board copy", () => {
    const { container } = render(<DraftTrackerClient />);

    expect(container.firstChild).toHaveClass("home-page");
    // This fixture is a running draft (one pick logged, isActive), so the header
    // is the compact live-state one. The pitch headline belongs to the setup
    // state only, and must not be pushing the board down while a clock is going.
    expect(screen.getByRole("heading", { level: 1, name: /Draft assistant/i })).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: /Manual draft tracking that actually stays usable\./i })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Pick 2 of 150/i)).toBeVisible();
    expect(screen.getAllByText(/Source updated/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Pick #2 on the clock/i })).toBeVisible();
    expect(screen.getByRole("timer")).toHaveAccessibleName(/90 seconds left/i);
    expect(screen.queryByText(/^ADP$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Proj\. Pts$/)).not.toBeInTheDocument();
    expect(container.querySelector("button button")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "What is Average rank?" }));
    expect(screen.queryByRole("dialog", { name: "Bijan Robinson detail" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open Bijan Robinson detail" }));
    expect(screen.getByRole("dialog", { name: "Bijan Robinson detail" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "JSON" }));
    expect(mockExportDraftResults).toHaveBeenCalledWith(
      "json",
      expect.objectContaining({
        picks: [expect.objectContaining({ player: expect.objectContaining({ adp: undefined }) })],
      })
    );
  });

  it("does not render or time a cached board from another scoring format", () => {
    const draftStateResult = mockUseDraftState();
    mockUseDraftState.mockReturnValue({
      ...draftStateResult,
      draftState: {
        ...draftStateResult.draftState,
        settings: {
          ...draftStateResult.draftState.settings,
          scoringFormat: "STANDARD",
        },
      },
    });

    render(<DraftTrackerClient />);

    expect(screen.getByText("Loading the Standard board")).toBeVisible();
    expect(screen.queryByText("Bijan Robinson")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Log pick" })).not.toBeInTheDocument();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.queryByText("How this room reads right now")).not.toBeInTheDocument();
    expect(mockDraftPlayer).not.toHaveBeenCalled();
  });

  it("keeps a restored room timer stopped until its board is ready", () => {
    const snapshotResult = mockUseFantasySnapshot();
    mockUseFantasySnapshot.mockReturnValue({
      ...snapshotResult,
      isLoading: true,
    });

    render(<DraftTrackerClient />);

    expect(screen.getByText("Loading the PPR board")).toBeVisible();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Log pick" })).not.toBeInTheDocument();
  });

  it("clears and refocuses board search after logging a pick", () => {
    render(<DraftTrackerClient />);

    const search = screen.getByRole("textbox", { name: "Search the board" });
    fireEvent.change(search, { target: { value: "Bijan" } });
    fireEvent.click(screen.getByRole("button", { name: "Log pick" }));

    expect(mockDraftPlayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: "rb-1", name: "Bijan Robinson" })
    );
    expect(search).toHaveValue("");
    expect(search).toHaveFocus();
  });

  it("does not focus board search when a pick was logged without a search", () => {
    render(<DraftTrackerClient />);

    const search = screen.getByRole("textbox", { name: "Search the board" });
    fireEvent.click(screen.getByRole("button", { name: "Log pick" }));

    expect(mockDraftPlayer).toHaveBeenCalled();
    expect(search).not.toHaveFocus();
  });

  it("keeps mobile undo available after the final pick", () => {
    const draftStateResult = mockUseDraftState();
    mockUseDraftState.mockReturnValue({
      ...draftStateResult,
      draftState: {
        ...draftStateResult.draftState,
        settings: {
          ...draftStateResult.draftState.settings,
          totalTeams: 1,
          rounds: 1,
        },
        currentPick: 2,
        currentRound: 1,
        isActive: false,
      },
      isDraftComplete: true,
    });

    render(<DraftTrackerClient />);

    const mobileActions = screen.getByTestId("mobile-draft-actions");
    expect(within(mobileActions).getByRole("button", { name: "Undo last pick" })).toBeEnabled();
  });
});
