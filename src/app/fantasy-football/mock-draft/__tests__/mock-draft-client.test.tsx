import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import type { Player } from "@/types";
import { MockDraftClient } from "../mock-draft-client";

const mockUseFantasySnapshot = jest.fn();
const FRESH_AS_OF = new Date(Date.now() - 60 * 60 * 1000).toISOString();

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

function startMock() {
  fireEvent.click(screen.getByRole("button", { name: "Start mock" }));
}

describe("MockDraftClient", () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseFantasySnapshot.mockReturnValue({
      snapshot: {
        scoringFormat: "PPR",
        overall: makeBoard(),
        sliceMetadata: {
          overall: { available: true, updatedAt: FRESH_AS_OF },
        },
      },
      metadata: {
        season: 2026,
        upstreamUpdatedAt: FRESH_AS_OF,
        adpSource: { asOf: FRESH_AS_OF },
      },
      isLoading: false,
      error: null,
      retry: jest.fn(),
    });
  });

  it("renders the setup card with the start action enabled", () => {
    render(<MockDraftClient />);
    expect(screen.getByRole("heading", { level: 1, name: "Mock Draft" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Rep the rounds that decide leagues." })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start mock" })).toBeEnabled();
  });

  it("does not start simulated picks from a stale ranking source", () => {
    const snapshotResult = mockUseFantasySnapshot();
    mockUseFantasySnapshot.mockReturnValue({
      ...snapshotResult,
      snapshot: {
        ...snapshotResult.snapshot,
        sliceMetadata: {
          overall: { available: true, updatedAt: "2020-01-01T00:00:00.000Z" },
        },
      },
      metadata: {
        ...snapshotResult.metadata,
        upstreamUpdatedAt: "2020-01-01T00:00:00.000Z",
      },
    });

    render(<MockDraftClient />);

    expect(screen.getByRole("button", { name: "Start mock" })).toBeDisabled();
    expect(screen.getByText(/simulated picks are paused/i)).toBeVisible();
  });

  it("puts the user on the clock at their slot after starting", () => {
    render(<MockDraftClient />);
    startMock();

    // Default room: 10 teams, slot 5, 5 rounds, so four simulated picks come first.
    expect(screen.getByText("#5 / 50")).toBeInTheDocument();
    expect(screen.getByText("Since your last pick")).toBeInTheDocument();
    expect(screen.getByText("You're up")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Best left/ })).toBeInTheDocument();
  });

  it("advances to the next turn after the user drafts from the board", () => {
    render(<MockDraftClient />);
    startMock();

    const draftButtons = screen.getAllByRole("button", { name: /^Draft / });
    fireEvent.click(draftButtons[0]);

    // Snake order: slot 5 of 10 picks again at pick 16.
    expect(screen.getByText("#16 / 50")).toBeInTheDocument();
  });

  it("returns to the previous turn on take back", () => {
    render(<MockDraftClient />);
    startMock();
    fireEvent.click(screen.getAllByRole("button", { name: /^Draft / })[0]);
    expect(screen.getByText("#16 / 50")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Take back your last pick" }));
    expect(screen.getByText("#5 / 50")).toBeInTheDocument();
  });

  it("sims to the end and lands on the recap with the board grid", () => {
    render(<MockDraftClient />);
    startMock();

    fireEvent.click(screen.getByRole("button", { name: /Sim to end/ }));

    expect(screen.getByRole("heading", { level: 2, name: "The board" })).toBeInTheDocument();
    expect(screen.getByText("Draft grade")).toBeInTheDocument();
    expect(screen.getByText("Your haul")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run it back/ })).toBeEnabled();
  });

  it("parks a live room behind the setup screen and resumes it", () => {
    render(<MockDraftClient />);
    startMock();
    expect(screen.getByText("#5 / 50")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New mock" }));
    expect(
      screen.getByRole("heading", { level: 2, name: "Rep the rounds that decide leagues." })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Back to room/ }));
    expect(screen.getByText("#5 / 50")).toBeInTheDocument();
  });
});
