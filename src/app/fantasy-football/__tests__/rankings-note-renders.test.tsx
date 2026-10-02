import React from "react";
import { act, render } from "@testing-library/react";
import { FantasyFootballClient } from "../fantasy-football-client";
import { emitBrowserStorageChange } from "@/lib/browserStorage";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { FANTASY_NOTES_STORAGE_KEY, saveNotes } from "@/lib/fantasyLocal";

const mockFilterBarRenders = jest.fn();
const mockRouter = { push: jest.fn(), replace: jest.fn() };
const mockSearchParams = new URLSearchParams("position=rb&scoring=ppr");

const mockSlice = {
  available: true,
  sourceKind: "position_consensus",
  rangeKind: "position",
  playerCount: 1,
  updatedAt: "2026-08-16T15:29:20.000Z",
};

const mockSnapshotResult = {
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
      maxRank: 3,
      byeWeek: 9,
      lastUpdated: "2026-08-16T15:29:20.000Z",
    },
  ],
  snapshot: null,
  metadata: {
    season: 2026,
    week: 0,
    generatedAt: "2026-08-16T16:00:00.000Z",
    upstreamUpdatedAt: "2026-08-16T15:29:20.000Z",
    scoringFormat: "PPR",
    source: "snapshot",
    position: "rb",
    playerCount: 1,
    slice: mockSlice,
    slices: { rb: mockSlice },
  },
  sliceMetadata: mockSlice,
  sliceMetadataMap: { rb: mockSlice },
  isLoading: false,
  error: null,
  retry: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

jest.mock("@/hooks/useFantasySnapshot", () => ({
  useFantasySnapshot: () => mockSnapshotResult,
}));

// A direct child of the board's root, standing in for the board itself: it
// renders again whenever the root does.
jest.mock("@/components/fantasy/PositionFilterBar", () => ({
  PositionFilterBar: () => {
    mockFilterBarRenders();
    return null;
  },
}));

describe("rankings board renders", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
    mockFilterBarRenders.mockClear();
  });

  // The root only needs to know whether notes can be saved. Subscribing to the
  // notes themselves re-rendered every row on each keystroke in a note.
  it("does not render the board again when a note is written", () => {
    render(
      <FantasyFootballClient
        initialState={{ position: "rb", scoring: "ppr", ranking: "consensus", teams: 12, query: "" }}
      />
    );
    const rendersBefore = mockFilterBarRenders.mock.calls.length;
    expect(rendersBefore).toBeGreaterThan(0);

    act(() => {
      saveNotes({ "rb-1": "handcuff for Allgeier" });
      emitBrowserStorageChange(FANTASY_NOTES_STORAGE_KEY);
    });

    expect(mockFilterBarRenders.mock.calls.length).toBe(rendersBefore);
  });
});
