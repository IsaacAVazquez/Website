import React from "react";
import { act, render, screen } from "@testing-library/react";
import { DraftTrackerClient } from "../draft-tracker-client";
import { emitBrowserStorageChange } from "@/lib/browserStorage";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { FANTASY_NOTES_STORAGE_KEY, saveNotes } from "@/lib/fantasyLocal";

const mockBoardRenders = jest.fn();
const FRESH_AS_OF = new Date(Date.now() - 60 * 60 * 1000).toISOString();

const mockTeam = {
  teamNumber: 1,
  picks: [],
  positionCounts: { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 },
  totalValue: 0,
  projectedPoints: 0,
};

const mockDraftStateResult = {
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
    teams: [mockTeam],
  },
  updateSettings: jest.fn(),
  startDraft: jest.fn(),
  draftPlayer: jest.fn(),
  undoLastPick: jest.fn(),
  redoLastPick: jest.fn(),
  undoToPick: jest.fn(),
  setTeamName: jest.fn(),
  getTeamName: (teamNumber: number) => `Team ${teamNumber}`,
  canRedo: false,
  resetDraft: jest.fn(),
  exportDraftResults: jest.fn(),
  isUserPick: true,
  isDraftComplete: false,
  currentTeamName: "Your Turn",
  currentTeamNumber: 1,
  userTeam: mockTeam,
};

const mockSnapshotResult = {
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
    positions: { QB: [], RB: [], WR: [], TE: [], K: [], DST: [], FLEX: [] },
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
};

jest.mock("@/hooks/useFantasySnapshot", () => ({
  useFantasySnapshot: () => mockSnapshotResult,
}));

jest.mock("../hooks/useDraftState", () => ({
  ...jest.requireActual("../hooks/useDraftState"),
  useDraftState: () => mockDraftStateResult,
}));

// The board is the expensive part of the room. It renders whenever the room's
// root does, so its render count is the room's render count.
jest.mock("../components/DraftBoard", () => ({
  DraftBoard: () => {
    mockBoardRenders();
    return null;
  },
}));

describe("draft room renders", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
    mockBoardRenders.mockClear();
  });

  // The room reads notes once, when the draft is exported. Subscribing to them
  // re-rendered the whole room on each keystroke in a note.
  it("does not render the board again when a note is written", () => {
    render(<DraftTrackerClient />);
    expect(screen.getByRole("timer")).toBeInTheDocument();
    const rendersBefore = mockBoardRenders.mock.calls.length;
    expect(rendersBefore).toBeGreaterThan(0);

    act(() => {
      saveNotes({ "rb-1": "handcuff for Allgeier" });
      emitBrowserStorageChange(FANTASY_NOTES_STORAGE_KEY);
    });

    expect(mockBoardRenders.mock.calls.length).toBe(rendersBefore);
  });

  // The pick clock ticks once a second. Held in the room's root, each tick
  // re-rendered the board, the value panel, and the drawer.
  it("moves the pick clock without rendering the board again", () => {
    jest.useFakeTimers();
    try {
      render(<DraftTrackerClient />);
      expect(screen.getByRole("timer")).toHaveAccessibleName("90 seconds left on the pick clock");
      expect(screen.getByText(/1:30 advisory/)).toBeInTheDocument();
      const rendersBefore = mockBoardRenders.mock.calls.length;

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(screen.getByRole("timer")).toHaveAccessibleName("87 seconds left on the pick clock");
      expect(screen.getByRole("timer")).toHaveTextContent("1:27");
      expect(screen.getByText(/1:27 advisory/)).toBeInTheDocument();
      expect(mockBoardRenders.mock.calls.length).toBe(rendersBefore);
    } finally {
      jest.useRealTimers();
    }
  });

  it("reads the clock as expired once it runs out", () => {
    jest.useFakeTimers();
    try {
      render(<DraftTrackerClient />);

      act(() => {
        jest.advanceTimersByTime(91_000);
      });

      expect(screen.getByRole("timer")).toHaveAccessibleName("Pick clock expired");
      expect(screen.getByRole("timer")).toHaveTextContent("0:00");
    } finally {
      jest.useRealTimers();
    }
  });
});
