import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { DraftTrackerClient } from "../draft-tracker-client";

const mockUseDraftState = jest.fn();
const mockUseFantasySnapshot = jest.fn();
const mockExportDraftResults = jest.fn();
const mockDraftPlayer = jest.fn();
const FRESH_AS_OF = new Date(Date.now() - 60 * 60 * 1000).toISOString();

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
  // Keep the module's pure exports (calculateDraftOrder feeds the fascia's
  // "your next turn" cell) while stubbing the stateful hook.
  ...jest.requireActual("../hooks/useDraftState"),
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
            updatedAt: FRESH_AS_OF,
          },
        },
      },
      metadata: {
        season: 2026,
        week: 0,
        scoringFormat: "PPR",
        generatedAt: FRESH_AS_OF,
        upstreamUpdatedAt: FRESH_AS_OF,
      },
      isLoading: false,
      error: null,
      retry: jest.fn(),
    });
  });

  it("renders the editorial shell and sourced-only draft board copy", () => {
    const { container } = render(<DraftTrackerClient />);

    expect(container.firstChild).toHaveClass("home-page");
    // This fixture is a running draft (one pick logged, isActive), so the
    // header kicker reads live state and the fascia carries the pick number,
    // the team on the clock, and the advisory clock.
    expect(screen.getByRole("heading", { level: 1, name: /Draft Tracker/i })).toBeVisible();
    expect(screen.getByText(/Draft assistant · Live · Pick #2/i)).toBeVisible();
    expect(screen.getByText("#2 / 150")).toBeVisible();
    expect(screen.getByText("On the clock")).toBeVisible();
    expect(screen.getByText("You")).toBeVisible();
    expect(screen.getAllByText(/Source updated/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("timer")).toHaveAccessibleName(/90 seconds left/i);
    expect(screen.queryByText(/^ADP$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Proj\. Pts$/)).not.toBeInTheDocument();
    expect(container.querySelector("button button")).not.toBeInTheDocument();

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

  it("keeps manual picks available but pauses Draft Outlook on a stale ranking source", () => {
    const snapshotResult = mockUseFantasySnapshot();
    mockUseFantasySnapshot.mockReturnValue({
      ...snapshotResult,
      snapshot: {
        ...snapshotResult.snapshot,
        upstreamUpdatedAt: "2020-01-01T00:00:00.000Z",
        sliceMetadata: {
          ...snapshotResult.snapshot.sliceMetadata,
          overall: {
            ...snapshotResult.snapshot.sliceMetadata.overall,
            updatedAt: "2020-01-01T00:00:00.000Z",
          },
        },
      },
      metadata: {
        ...snapshotResult.metadata,
        upstreamUpdatedAt: "2020-01-01T00:00:00.000Z",
      },
    });

    render(<DraftTrackerClient />);

    expect(screen.getByRole("alert")).toHaveTextContent(/Draft Outlook.*paused/i);
    expect(screen.getByText("#2 / 150")).toBeVisible();
    expect(screen.getAllByRole("heading", { name: "Draft Outlook paused" })).toHaveLength(1);
    expect(screen.queryByText("Calculated market value")).not.toBeInTheDocument();
  });

  it("labels stale ADP and keeps the current consensus model explicit", () => {
    const snapshotResult = mockUseFantasySnapshot();
    mockUseFantasySnapshot.mockReturnValue({
      ...snapshotResult,
      metadata: {
        ...snapshotResult.metadata,
        adpSource: { asOf: "2020-01-01T00:00:00.000Z" },
      },
    });

    render(<DraftTrackerClient />);

    expect(
      screen.getAllByRole("status").some((status) =>
        /ADP source is stale/i.test(status.textContent ?? "")
      )
    ).toBe(true);
    expect(screen.queryByRole("heading", { name: "Draft Outlook paused" })).not.toBeInTheDocument();
    expect(screen.getAllByText(/consensus rank/i).length).toBeGreaterThan(0);
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
    fireEvent.click(screen.getByRole("button", { name: "Log Bijan Robinson" }));

    expect(mockDraftPlayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: "rb-1", name: "Bijan Robinson" })
    );
    expect(search).toHaveValue("");
    expect(search).toHaveFocus();
  });

  it("does not focus board search when a pick was logged without a search", () => {
    render(<DraftTrackerClient />);

    const search = screen.getByRole("textbox", { name: "Search the board" });
    fireEvent.click(screen.getByRole("button", { name: "Log Bijan Robinson" }));

    expect(mockDraftPlayer).toHaveBeenCalled();
    expect(search).not.toHaveFocus();
  });

  it("keeps fascia undo available after the final pick", () => {
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

    expect(screen.getByRole("button", { name: "Undo last pick" })).toBeEnabled();
  });
});
