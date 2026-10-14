import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { Player } from "@/types";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
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
    const start = screen.getByRole("button", { name: "Start mock" });
    expect(start).toBeEnabled();
    // Start sits beside the default-room summary, ahead of the settings it summarises.
    expect(start.parentElement).toHaveTextContent(/-team snake · slot \d+ · \d+-round rep · PPR/);
    expect(
      start.compareDocumentPosition(screen.getByLabelText("Teams")) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
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
      // Wrapped in the page shell like the rankings board's note.
      expect(note.parentElement?.className).toContain("c97-shell");
      expect(screen.getByText("Board Current · Sep 10, 2026")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start mock" })).toBeEnabled();
    });

    it("pauses the room four days past the board stamp without promising a refresh", () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
      mockInSeasonSnapshot();

      render(<MockDraftClient />);

      expect(screen.getByText("Board Stale · Sep 10, 2026")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start mock" })).toBeDisabled();
      // The paused line names the resume control, since the consent box sits
      // in the scope note above the setup card rather than beside Start.
      expect(
        screen.getByText(
          "The published board is dated Sep 10, 2026, which is past its freshness window, so simulated picks are paused. Choose dated preseason practice above to use it anyway."
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

    it("does not say the room picks from market ADP on the line above the chip that drops it", () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-10-12T12:00:00.000Z"));
      mockInSeasonSnapshot();

      render(<MockDraftClient />);

      expect(screen.getByText("ADP unavailable, consensus only")).toBeInTheDocument();
      expect(screen.queryByText(/consensus board and market ADP\./)).not.toBeInTheDocument();
      expect(screen.getByText(/from market ADP when a current sample is published\./)).toBeInTheDocument();
    });

    it("requires explicit dated practice consent and pauses again when consent is removed", () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-10-04T12:00:00.000Z"));
      mockInSeasonSnapshot();
      render(<MockDraftClient />);
      const consent = screen.getByRole("checkbox", { name: "Practice with the dated preseason board" });
      expect(consent).not.toBeChecked();
      expect(screen.getByRole("button", { name: "Start mock" })).toBeDisabled();
      fireEvent.click(consent);
      expect(screen.getByRole("button", { name: "Start mock" })).toBeEnabled();
      expect(screen.getByText("Dated preseason practice")).toBeVisible();
      expect(screen.getByText("Board Stale · Sep 10, 2026")).toBeVisible();
      expect(screen.getByText("ADP unavailable, consensus only")).toBeVisible();
      fireEvent.click(consent);
      expect(screen.getByRole("button", { name: "Start mock" })).toBeDisabled();
    });

    it("binds dated practice consent to the exact board and requires it again after a source change", () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-10-04T12:00:00.000Z"));
      mockInSeasonSnapshot();
      const { rerender } = render(<MockDraftClient />);
      fireEvent.click(screen.getByRole("checkbox", { name: "Practice with the dated preseason board" }));
      const result = mockUseFantasySnapshot();
      mockUseFantasySnapshot.mockReturnValue({ ...result, snapshot: { ...result.snapshot,
        sliceMetadata: { overall: { available: true, updatedAt: "2026-09-11T00:00:00.000Z" } },
      } });
      rerender(<MockDraftClient />);
      expect(screen.getByRole("checkbox", { name: "Practice with the dated preseason board" })).not.toBeChecked();
      expect(screen.getByRole("button", { name: "Start mock" })).toBeDisabled();
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

    // The picks since the last turn are list items too now, so the first row is
    // read from the board's own region.
    const board = screen.getByRole("region", { name: "Available players" });
    const firstRow = within(board).getAllByRole("listitem")[0];
    const srLabels = Array.from(firstRow.querySelectorAll(".sr-only"));
    expect(srLabels.map((node) => node.textContent)).toEqual(["ADP", "versus ADP at pick 5"]);
    // Each hidden label sits inside the cell it names, so it hides when the cell does.
    srLabels.forEach((label) => expect(label.parentElement).toHaveClass("ffb-c-num"));
    // A phone row keeps one number, the gap against ADP, with its own label.
    const phoneLabels = Array.from(
      firstRow.querySelectorAll('[aria-hidden="true"].ffb-only-phone')
    ).map((node) => node.textContent?.trim());
    expect(phoneLabels).toEqual(["±ADP"]);
    const [adpCell, gapCell] = srLabels.map((label) => label.parentElement as HTMLElement);
    expect(adpCell).not.toHaveClass("ffb-m-meta");
    expect(gapCell).toHaveClass("ffb-m-meta");
  });

  it("prints the four readouts as scorebug cells with the actions outside them", () => {
    render(<MockDraftClient />);
    startMock();

    const strip = screen.getByRole("region", { name: "Live mock draft status" });
    const cells = Array.from(strip.querySelectorAll<HTMLElement>(".ffb-bug-seg"));
    expect(cells.map((cell) => cell.querySelector(".ffb-bug-label")?.textContent)).toEqual([
      "Pick",
      "On the clock",
      "Between turns",
      "Pool",
    ]);
    const takeBack = screen.getByRole("button", { name: "Take back (no picks yet)" });
    expect(cells.some((cell) => cell.contains(takeBack))).toBe(false);
    expect(takeBack.parentElement).toHaveClass("ffb-bug-actions");

    // Each cell carries a phone form and a desktop form of the same reading.
    const [pick, onClock, between, pool] = cells;
    expect(within(pick).getByText("#5/50")).toHaveClass("ffb-only-phone");
    expect(within(pick).getByText("#5 / 50")).toHaveClass("ffb-not-phone");
    expect(pick).toHaveTextContent("Round 1 of 5");
    expect(onClock).toHaveClass("ffb-bug-live");
    expect(onClock.querySelector(".ffb-bug-value")).toHaveTextContent(/^You$/);
    // The notes and the pool switch with the bar's own short form, below 1024px.
    expect(within(onClock).getByText("slot 5/10")).toHaveClass("ffb-mk-narrow");
    expect(within(onClock).getByText("slot 5 of 10")).toHaveClass("ffb-mk-wide");
    expect(between.querySelector(".ffb-bug-value")).toHaveTextContent(/^4 picks$/);
    expect(within(between).getByText("before you")).toHaveClass("ffb-mk-narrow");
    expect(within(between).getByText("before your first turn")).toHaveClass("ffb-mk-wide");
    // The board's own count repeats the pool, so the short bar leaves it out.
    expect(pool).toHaveClass("ffb-mk-wide");
    expect(pool.querySelector(".ffb-bug-value")).toHaveTextContent(/^160 left$/);
    expect(pool).toHaveTextContent("of 164 ranked");
  });

  it("sets Sim to end apart as the last action and says on the button that nothing takes it back", () => {
    render(<MockDraftClient />);
    startMock();

    const actions = screen.getByRole("button", { name: "New mock" }).parentElement as HTMLElement;
    const names = within(actions)
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label") ?? button.textContent);
    expect(names).toEqual([
      "Take back (no picks yet)",
      "New mock",
      "Sim to end, which finishes the room with no take back",
    ]);
    expect(within(actions).getByRole("button", { name: /Sim to end/ })).toHaveTextContent(
      /^Sim to end no take back$/
    );
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
    // The board is the shared pick grid, one made cell per pick, and each cell
    // takes its position's fill, on which the kit prints the on-fill ink.
    const boardSection = screen.getByRole("region", { name: "The board" });
    const cells = within(boardSection).getAllByRole("img", {
      name: /^Pick \d+, slot \d+(, yours)?, Player \d+, (QB|RB|WR|TE|K|DST)$/,
    });
    expect(cells).toHaveLength(50);
    cells.forEach((cell) => {
      expect(cell).toHaveClass("ffb-cell", "ffb-is-made");
      expect(cell.className).toMatch(/\bffb-pos-(qb|rb|wr|te|k|dst)\b/);
    });
    // Slot 5 of 10 in a snake draft picks at 5, 16, 25, 36, and 45.
    expect(
      within(boardSection)
        .getAllByRole("img", { name: /, slot 5, yours, / })
        .map((cell) => cell.getAttribute("aria-label")?.split(",")[0])
    ).toEqual(["Pick 5", "Pick 16", "Pick 25", "Pick 36", "Pick 45"]);
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

  it("sends focus to the setup heading on New mock and to the on-the-clock cell on Back to room", () => {
    render(<MockDraftClient />);
    startMock();

    // Each of these swaps the screen under the button that was pressed.
    fireEvent.click(screen.getByRole("button", { name: "New mock" }));
    expect(document.activeElement).toBe(
      screen.getByRole("heading", { level: 2, name: "Rep the rounds that decide leagues." })
    );

    fireEvent.click(screen.getByRole("button", { name: /Back to room/ }));
    const cell = screen.getByText("On the clock").closest(".ffb-bug-seg");
    expect(cell).toHaveAttribute("tabindex", "-1");
    expect(document.activeElement).toBe(cell);
  });

  it("sends focus to the setup heading on Change setup and back to the value report", () => {
    render(<MockDraftClient />);
    startMock();
    fireEvent.click(screen.getByRole("button", { name: /Sim to end/ }));

    fireEvent.click(screen.getByRole("button", { name: "Change setup" }));
    expect(document.activeElement).toBe(
      screen.getByRole("heading", { level: 2, name: "Rep the rounds that decide leagues." })
    );

    fireEvent.click(screen.getByRole("button", { name: /Back to room/ }));
    expect(document.activeElement).toBe(screen.getByRole("region", { name: "Value report" }));
  });

  it("hands focus to the search field when Clear search removes itself", () => {
    render(<MockDraftClient />);
    startMock();

    const search = screen.getByRole("textbox", { name: "Search available players" });
    fireEvent.change(search, { target: { value: "no such player" } });
    const clear = screen.getByRole("button", { name: "Clear search" });
    act(() => clear.focus());
    fireEvent.click(clear);

    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
    expect(search).toHaveValue("");
    expect(document.activeElement).toBe(search);
  });

  it("moves focus to the on-the-clock cell when Reload the board leaves a paused room", () => {
    const ready = mockUseFantasySnapshot();
    const { rerender } = render(<MockDraftClient />);
    startMock();

    // The board fails on a later load, which pauses the room and offers a reload.
    const retry = jest.fn();
    mockUseFantasySnapshot.mockReturnValue({
      ...ready,
      snapshot: null,
      error: "The published rankings snapshot failed to load.",
      retry,
    });
    rerender(<MockDraftClient />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The published rankings snapshot failed to load. Your picks stay saved, and simulated picks resume once the board loads."
    );
    const reload = screen.getByRole("button", { name: "Reload the board" });
    act(() => reload.focus());
    fireEvent.click(reload);
    expect(retry).toHaveBeenCalledTimes(1);

    // The request is under way, so the button is gone and the pinned cell holds the focus.
    mockUseFantasySnapshot.mockReturnValue({ ...ready, snapshot: null, isLoading: true });
    rerender(<MockDraftClient />);
    expect(screen.queryByRole("button", { name: "Reload the board" })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByText("On the clock").closest(".ffb-bug-seg"));
  });

  it("does not say a paused room's picks are saved when the browser refuses storage", () => {
    const blocked = () => {
      throw new Error("storage is blocked");
    };
    const getItem = jest.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
    const setItem = jest.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);
    resetBrowserStorageMemory();
    try {
      const ready = mockUseFantasySnapshot();
      const { rerender } = render(<MockDraftClient />);
      startMock();
      mockUseFantasySnapshot.mockReturnValue({
        ...ready,
        snapshot: null,
        error: "The published rankings snapshot failed to load.",
      });
      rerender(<MockDraftClient />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(
        "Your picks stay until this tab closes, and simulated picks resume once the board loads."
      );
      expect(alert).not.toHaveTextContent(/saved/i);
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
      resetBrowserStorageMemory();
    }
  });

  it("gives a keyboard a way past the board to the roster", () => {
    render(<MockDraftClient />);
    startMock();

    const skip = screen.getByRole("link", { name: "Skip to your roster" });
    const board = screen.getByRole("region", { name: "Available players" });
    expect(skip.compareDocumentPosition(board) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(skip);
    const rail = screen.getByRole("complementary", { name: "Your draft" });
    expect(document.activeElement).toBe(rail);
    expect(within(rail).getByRole("heading", { name: "Your roster" })).toBeInTheDocument();
    expect(within(rail).getByRole("heading", { name: "Pick grid" })).toBeInTheDocument();
  });

  it("marks where the board stands at the next turn and who is gone from a tier", () => {
    const ready = mockUseFantasySnapshot();
    mockUseFantasySnapshot.mockReturnValue({
      ...ready,
      snapshot: {
        ...ready.snapshot,
        overall: (ready.snapshot.overall as Player[]).map((player, index) => ({
          ...player,
          // The room's early window is the top three left, so four simulated picks
          // all come out of tier 1 and the lone tier 2 player stays on the board.
          tier: index < 30 ? 1 : index === 30 ? 2 : 3,
          byeWeek: 9,
        })),
      },
    });
    render(<MockDraftClient />);
    startMock();

    // Slot 5 of 10 picks at 5 and then at 16, so eleven rows sit above the line.
    const board = screen.getByRole("region", { name: "Available players" });
    const items = within(board).getAllByRole("listitem");
    // The bye's label is read out on a desktop and printed on a phone, never dropped.
    const bye = items[0].querySelector(".ffb-c-bye");
    expect(bye).toHaveTextContent(/^Bye 9$/);
    expect(bye?.firstElementChild).toHaveClass("ffb-mk-vh-desk");
    const line = items.findIndex((item) => item.classList.contains("ffb-turnline"));
    expect(line).toBe(11);
    expect(items[line]).toHaveTextContent("Your next turn #16 if picks follow this board");

    // Four simulated picks came off the top of the board before pick 5.
    const gone = board.querySelectorAll(".ffb-tier-gone");
    expect(gone.length).toBeGreaterThan(0);
    const goneNames = Array.from(gone)
      .map((node) => node.textContent ?? "")
      .join(" ")
      .match(/P\. \d+/g);
    expect(goneNames).toHaveLength(4);

    // The tab prints two digits and the section's name keeps the plain number,
    // and a tier down to one player prints a rank and not a range.
    const tierOne = within(board).getByRole("region", { name: /^Tier 1, 26 players, ranks \d+ to \d+$/ });
    expect(tierOne.querySelector(".ffb-tier-tab")).toHaveTextContent(/^Tier 01$/);
    expect(tierOne.querySelector(".ffb-tier-count")).toHaveTextContent(/^26 left$/);
    const tierTwo = within(board).getByRole("region", { name: /^Tier 2, 1 player, rank \d+, / });
    expect(tierTwo.querySelector(".ffb-tier-tab")).toHaveTextContent(/^Tier 02$/);
    expect(tierTwo.querySelector(".ffb-tier-range")).toHaveTextContent(/^Rank \d+$/);

    // A filter breaks the reading, so the line leaves with it.
    fireEvent.click(within(board).getByRole("radio", { name: "RB" }));
    expect(board.querySelector(".ffb-turnline")).toBeNull();
  });

  it("prints the haul as one sticker per pick with its round, pick, position, and signed gap", () => {
    render(<MockDraftClient />);
    startMock();
    fireEvent.click(screen.getByRole("button", { name: /Sim to end/ }));

    const haul = screen.getByRole("group", { name: "Your haul" });
    const stickers = within(haul).getAllByRole("listitem");
    expect(stickers).toHaveLength(5);
    expect(stickers[0]).toHaveTextContent(/^R1 · #5 · (QB|RB|WR|TE|K|DST)/);
    expect(stickers[1]).toHaveTextContent(/^R2 · #16 · /);
    stickers.forEach((sticker) => {
      expect(sticker).toHaveClass("ffb-sticker");
      expect(sticker.textContent).toMatch(/(Value |Reach )?[+−±]?\d/);
    });
  });
});
