import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import type { Player } from "@/types";
import { MockDraftClient } from "../mock-draft-client";

const mockUseFantasySnapshot = jest.fn();

jest.mock("@/hooks/useFantasySnapshot", () => ({
  useFantasySnapshot: () => mockUseFantasySnapshot(),
}));

let nextId = 0;

function makePlayer(overrides: Partial<Player> = {}): Player {
  nextId += 1;
  return {
    id: `mock-${nextId}`,
    name: `Player ${nextId}`,
    team: "FA",
    position: "WR",
    averageRank: nextId,
    rankEcr: nextId,
    ...overrides,
  } as Player;
}

function makeBoard(): Player[] {
  nextId = 0;
  const board: Player[] = [];
  const add = (position: Player["position"], count: number, rankOf: (i: number) => number) => {
    for (let i = 0; i < count; i += 1) {
      const rank = rankOf(i);
      board.push(makePlayer({ position, rankEcr: rank, averageRank: rank }));
    }
  };
  add("RB", 45, (i) => 1 + i * 3);
  add("WR", 50, (i) => 2 + i * 3);
  add("TE", 25, (i) => 6 + i * 6);
  add("QB", 20, (i) => 12 + i * 7);
  add("K", 12, (i) => 130 + i * 3);
  add("DST", 12, (i) => 132 + i * 3);
  return board.sort((a, b) => (a.rankEcr as number) - (b.rankEcr as number));
}

describe("MockDraftClient", () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseFantasySnapshot.mockReturnValue({
      snapshot: {
        scoringFormat: "PPR",
        overall: makeBoard(),
        sliceMetadata: {
          overall: { available: true, updatedAt: "2026-08-17T00:00:00.000Z" },
        },
      },
      metadata: {
        season: 2026,
        upstreamUpdatedAt: "2026-08-17T00:00:00.000Z",
        adpSource: { asOf: "2026-08-17T00:00:00.000Z" },
      },
      isLoading: false,
      error: null,
      retry: jest.fn(),
    });
  });

  it("renders the setup card with the start action enabled", () => {
    render(<MockDraftClient />);
    expect(screen.getByRole("heading", { level: 1, name: "Mock Draft Simulator" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start the mock draft" })).toBeEnabled();
  });

  it("puts the user on the clock at their slot after starting", () => {
    render(<MockDraftClient />);
    fireEvent.click(screen.getByRole("button", { name: "Start the mock draft" }));

    // Default room: 10 teams, slot 5, so four simulated picks come first.
    expect(screen.getByText("Pick 5 of 150")).toBeInTheDocument();
    expect(screen.getByText(/Since your last turn:/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /You are on the clock at 1\.05/ })).toBeInTheDocument();
  });

  it("advances to the next turn after the user drafts a player", () => {
    render(<MockDraftClient />);
    fireEvent.click(screen.getByRole("button", { name: "Start the mock draft" }));

    const draftButtons = screen.getAllByRole("button", { name: /^Draft / });
    fireEvent.click(draftButtons[0]);

    // Snake order: slot 5 of 10 picks again at pick 16.
    expect(screen.getByText("Pick 16 of 150")).toBeInTheDocument();
  });

  it("requires a second click to confirm a room reset", () => {
    render(<MockDraftClient />);
    fireEvent.click(screen.getByRole("button", { name: "Start the mock draft" }));

    fireEvent.click(screen.getByRole("button", { name: "Reset the room" }));
    expect(screen.getByRole("button", { name: "Confirm reset" })).toBeInTheDocument();
    expect(screen.getByText("Pick 5 of 150")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm reset" }));
    expect(screen.getByRole("button", { name: "Start the mock draft" })).toBeInTheDocument();
  });
});
