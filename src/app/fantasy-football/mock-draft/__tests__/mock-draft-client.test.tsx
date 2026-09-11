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
    const status = screen.getByText(/simulated picks are paused/i);
    expect(status).toBeVisible();
    // The pause names the board's own date and promises no refresh, since the
    // refresh runs upstream on its own schedule.
    expect(status).toHaveTextContent("The published board is dated Jan 1, 2020");
    expect(status).not.toHaveTextContent(/refresh/i);
  });

  describe("in season", () => {
    const BOARD_STAMP = "2026-09-10T00:19:11.000Z";
    const ADP_STAMP = "2026-09-10T00:00:00.000Z";

    function mockInSeasonSnapshot() {
      const snapshotResult = mockUseFantasySnapshot();
      mockUseFantasySnapshot.mockReturnValue({
        ...snapshotResult,
        snapshot: {
          ...snapshotResult.snapshot,
          sliceMetadata: { overall: { available: true, updatedAt: BOARD_STAMP } },
        },
        metadata: {
          season: 2026,
          upstreamUpdatedAt: BOARD_STAMP,
          adpSource: { asOf: ADP_STAMP },
        },
      });
    }

    afterEach(() => {
      jest.useRealTimers();
    });

    it("dates the board and ADP in the scope note and says when the room pauses", () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-09-11T12:00:00.000Z"));
      mockInSeasonSnapshot();

      render(<MockDraftClient />);

      const note = screen.getByRole("note");
      expect(note).toHaveTextContent("Week 1 of the 2026 season.");
      expect(note).toHaveTextContent(
        "the room pauses simulated picks if the published board goes stale"
      );
      expect(note).toHaveTextContent("Board dated Sep 10, 2026 · ADP dated Sep 10, 2026");
      expect(note).not.toHaveTextContent(/stops refreshing/i);
      expect(note).toHaveClass("rounded-[var(--radius-3xl)]");
      // Wrapped in the page shell like the rankings board's note.
      expect(note.parentElement?.className).toContain("max-w-[1080px]");
      expect(screen.getByText("Board Current · Sep 10, 2026")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start mock" })).toBeEnabled();
    });

    it("pauses the room four days past the board stamp without promising a refresh", () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
      mockInSeasonSnapshot();

      render(<MockDraftClient />);

      expect(screen.getByText("Board Stale · Sep 10, 2026")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start mock" })).toBeDisabled();
      expect(
        screen.getByText(
          "The published board is dated Sep 10, 2026, which is past its freshness window, so simulated picks are paused."
        )
      ).toBeVisible();
      expect(screen.getByRole("note")).toHaveTextContent(
        "the room pauses simulated picks if the published board goes stale"
      );
      expect(screen.queryByText(/until the published board refreshes/i)).not.toBeInTheDocument();
    });

    it("keeps the note's ADP stamp in step with the chip once the ADP is past its window", () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
      mockInSeasonSnapshot();

      render(<MockDraftClient />);

      // The chip drops the ADP, so the stamp line says the ADP is dated and unused
      // rather than printing a bare date beside "ADP unavailable".
      expect(screen.getByText("ADP unavailable, consensus only")).toBeInTheDocument();
      expect(screen.getByRole("note")).toHaveTextContent(
        "Board dated Sep 10, 2026 · ADP dated Sep 10, 2026, past its window, so the room runs on consensus"
      );
    });
  });

  it("moves focus to the on-the-clock panel and announces the opening turn on start", () => {
    render(<MockDraftClient />);
    startMock();

    const panel = screen.getByRole("region", { name: "You are on the clock" });
    expect(document.activeElement).toBe(panel);
    expect(screen.getByRole("status")).toHaveTextContent(
      /^Room #\d{3} open\. You are on the clock at pick #5, round 1 of 5\. 4 room picks before your first turn\.$/
    );
  });

  it("labels every board value for assistive tech and the phone layout", () => {
    render(<MockDraftClient />);
    startMock();

    const firstRow = screen.getAllByRole("listitem")[0];
    const srLabels = Array.from(firstRow.querySelectorAll(".sr-only")).map(
      (node) => node.textContent
    );
    expect(srLabels).toEqual(["ADP", "versus ADP at pick 5"]);
    const microLabels = Array.from(firstRow.querySelectorAll('[aria-hidden="true"].md\\:hidden')).map(
      (node) => node.textContent?.trim()
    );
    expect(microLabels).toEqual(["ADP", "At #5"]);
  });

  it("keeps the strip's actions in their own row with no painted grid", () => {
    render(<MockDraftClient />);
    startMock();

    const strip = screen.getByRole("region", { name: "Live mock draft status" });
    const readouts = strip.querySelector("dl");
    expect(readouts).not.toBeNull();
    expect(readouts?.querySelectorAll("dt")).toHaveLength(4);
    expect(readouts?.style.background).toBe("");
    const takeBack = screen.getByRole("button", { name: "Take back (no picks yet)" });
    expect(readouts?.contains(takeBack)).toBe(false);
    const compactLine = strip.querySelector("p.md\\:hidden");
    expect(compactLine).toHaveTextContent("Pick #5/50 · round 1/5");
    expect(compactLine).toHaveTextContent("On the clock You · slot 5/10");
    expect(compactLine).toHaveTextContent("4 room picks before you");
    expect(compactLine?.querySelector(".sr-only")).toHaveTextContent("On the clock");
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
    // Undoing the only pick disables the button that took the click, so the
    // panel takes focus and the status describes the restored turn.
    expect(document.activeElement).toBe(
      screen.getByRole("region", { name: "You are on the clock" })
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your last pick is taken back. You are on the clock again at pick #5, round 1 of 5."
    );
  });

  it("names the pick that is still yours when a later pick is taken back", () => {
    render(<MockDraftClient />);
    startMock();
    fireEvent.click(screen.getAllByRole("button", { name: /^Draft / })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /^Draft / })[0]);
    expect(screen.getByText("#25 / 50")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Take back your last pick" }));

    expect(screen.getByText("#16 / 50")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      /^Your last pick is taken back\. You are on the clock again at pick #16, round 2 of 5\. Player \d+ at pick #5 is still yours\.$/
    );
  });

  it("sims to the end and lands on the recap with the board grid", () => {
    render(<MockDraftClient />);
    startMock();

    fireEvent.click(screen.getByRole("button", { name: /Sim to end/ }));

    expect(screen.getByRole("heading", { level: 2, name: "The board" })).toBeInTheDocument();
    // The "#n · POS" line sits on each cell's position wash, where plain muted
    // ink fell under 4.5:1, so it takes the muted-toward-ink mix on every cell.
    const cellLabels = screen.getAllByText(/^#\d+ · (QB|RB|WR|TE|K|DST|—)$/);
    expect(cellLabels).toHaveLength(50);
    cellLabels.forEach((label) => {
      expect(label).toHaveStyle({
        color: "color-mix(in srgb, var(--home-ink-muted) 72%, var(--home-ink))",
      });
    });
    expect(screen.getByText("Draft grade")).toBeInTheDocument();
    expect(screen.getByText("Your haul")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run it back/ })).toBeEnabled();
    // The live room unmounts under the click, so the value report takes focus.
    expect(document.activeElement).toBe(screen.getByRole("region", { name: "Value report" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "The room is finished. The value report and the board are below."
    );
  });

  it("opens a fresh room on run it back with focus on the clock and a status", () => {
    render(<MockDraftClient />);
    startMock();
    fireEvent.click(screen.getByRole("button", { name: /Sim to end/ }));

    fireEvent.click(screen.getByRole("button", { name: /Run it back/ }));

    expect(screen.getByText("#5 / 50")).toBeInTheDocument();
    expect(document.activeElement).toBe(
      screen.getByRole("region", { name: "You are on the clock" })
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      /^Fresh room #\d{3} open with the same settings\. You are on the clock at pick #5, round 1 of 5\. 4 room picks before your first turn\.$/
    );
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
