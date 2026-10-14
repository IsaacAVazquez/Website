import fs from "node:fs";
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { DraftTrackerClient } from "../draft-tracker-client";

const mockUseDraftState = jest.fn();
const mockUseFantasySnapshot = jest.fn();
const mockExportDraftResults = jest.fn();
const mockDraftPlayer = jest.fn();
const mockUpdateSettings = jest.fn();
const FRESH_AS_OF = new Date(Date.now() - 60 * 60 * 1000).toISOString();

function mockSnapshotWithVorp(asOf: string) {
  const snapshotResult = mockUseFantasySnapshot();
  mockUseFantasySnapshot.mockReturnValue({
    ...snapshotResult,
    snapshot: {
      ...snapshotResult.snapshot,
      vorpSource: {
        provider: "FantasyPros projected VORP",
        asOf,
        urls: { "10": "https://www.fantasypros.com/nfl/rankings/ppr-vorp.php?team_size=10" },
        matchedCounts: { "10": 1 },
      },
      vorpRankings: {
        "10": [{ playerId: "rb-1", rank: 1, value: 54 }],
      },
    },
  });
}

jest.mock("@/hooks/useFantasySnapshot", () => ({
  useFantasySnapshot: (options: unknown) => mockUseFantasySnapshot(options),
}));

// In the app the drawer loads the first time a player is opened. Here it is
// the real drawer, mounted directly, so these tests stay about the room and
// stay synchronous. The loading itself is covered in
// DeferredPlayerDetailDrawer.test.tsx.
jest.mock("@/components/fantasy/DeferredPlayerDetailDrawer", () => ({
  DeferredPlayerDetailDrawer: jest.requireActual("@/components/fantasy/PlayerDetailDrawer")
    .PlayerDetailDrawer,
}));

jest.mock("../hooks/useDraftState", () => ({
  // Keep the module's pure exports (calculateDraftOrder feeds the fascia's
  // "your next turn" cell) while stubbing the stateful hook.
  ...jest.requireActual("../hooks/useDraftState"),
  useDraftState: () => mockUseDraftState(),
}));

jest.mock("../components/DraftSetup", () => ({
  DraftSetup: ({
    onPreviewScoring,
    onResume,
    onStartDraft,
    focusHeadingOnMount,
  }: {
    onPreviewScoring?: (scoring: "STANDARD") => void;
    onResume?: () => void;
    onStartDraft?: () => void;
    focusHeadingOnMount?: boolean;
  }) => (
    <div data-testid="draft-setup-mock" data-focus-heading={String(Boolean(focusHeadingOnMount))}>
      Draft setup mock
      <button type="button" onClick={() => onPreviewScoring?.("STANDARD")}>
        Preview Standard
      </button>
      <button type="button" onClick={onResume}>
        Resume room
      </button>
      <button type="button" onClick={onStartDraft}>
        Start mock draft
      </button>
    </div>
  ),
}));

describe("DraftTrackerClient", () => {
  beforeEach(() => {
    mockExportDraftResults.mockReset();
    mockDraftPlayer.mockReset();
    mockUpdateSettings.mockReset();
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
      updateSettings: mockUpdateSettings,
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

    // The client renders one top-level node, the route's shell.
    expect(container.firstChild).toHaveAttribute("data-testid", "fantasy-draft-tracker-shell");
    // This fixture is a running draft (one pick logged, isActive), so the
    // head is the kit's one-line running head, and the scorebug carries the
    // pick number, the team on the clock, and the advisory clock.
    const title = screen.getByRole("heading", { level: 1, name: /Draft Tracker/i });
    expect(title).toBeVisible();
    expect(title.closest("header")).toHaveClass("ffb-head-run");
    expect(title.closest("header")).not.toHaveClass("ffb-head-setup");
    // The scorebug is the room's one statement of where the draft is.
    expect(screen.queryByText(/Draft assistant ·/)).not.toBeInTheDocument();
    // The pinned bar names the pick just logged, under the team on the clock.
    expect(within(screen.getByText("On the clock").closest("div") as HTMLElement).getByText(/^Prev · .*#1$/)).toBeVisible();
    expect(screen.getByText("#2 / 150")).toBeVisible();
    expect(screen.getByText("On the clock")).toBeVisible();
    expect(screen.getByText("You")).toBeVisible();
    expect(screen.getAllByText(/Source updated/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("timer")).toHaveAccessibleName(/90 seconds left/i);
    expect(screen.queryByText(/^ADP$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Proj\. Pts$/)).not.toBeInTheDocument();
    expect(container.querySelector("button button")).not.toBeInTheDocument();

    // The compact strip and the board row both offer the best available
    // player, so the detail affordance legitimately appears twice.
    expect(screen.getByText("Your pick is live")).toBeVisible();
    expect(screen.getByRole("button", { name: /Why these picks/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Open Bijan Robinson detail" })[0]);
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

  it("previews setup scoring without changing the parked room", () => {
    render(<DraftTrackerClient />);

    fireEvent.click(screen.getByRole("button", { name: "New room" }));
    // Setup keeps the headline: the kit's setup head, not the running head's one line.
    expect(screen.getByRole("heading", { level: 1, name: /Draft Tracker/i }).closest("header")).toHaveClass(
      "ffb-head-setup"
    );
    fireEvent.click(screen.getByRole("button", { name: "Preview Standard" }));

    expect(mockUseFantasySnapshot).toHaveBeenLastCalledWith({
      scoring: "standard",
      all: true,
    });
    expect(mockUpdateSettings).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Resume room" }));
    expect(mockUseFantasySnapshot).toHaveBeenLastCalledWith({ scoring: "ppr", all: true });
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

  it("uses fresh VORP in a supported room", () => {
    mockSnapshotWithVorp(FRESH_AS_OF);

    render(<DraftTrackerClient />);

    expect(
      screen.getByText(/VORP is FantasyPros.*projected season points/i)
    ).toBeVisible();
    expect(screen.getAllByText("54").length).toBeGreaterThan(0);
  });

  it("drops retained stale VORP from live decision inputs", () => {
    mockSnapshotWithVorp("2026-08-01T00:00:00.000Z");

    render(<DraftTrackerClient />);

    expect(
      screen.queryByText(/VORP is FantasyPros.*projected season points/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText("54")).not.toBeInTheDocument();
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

  it("notes a second kicker on the user's roster", () => {
    const state = mockUseDraftState();
    mockUseDraftState.mockReturnValue({
      ...state,
      draftState: {
        ...state.draftState,
        picks: [
          { pickNumber: 1, teamNumber: 1, round: 10, player: { id: "k-1", position: "K", adp: 140 } },
        ],
        currentRound: 14,
      },
    });
    const snapshotResult = mockUseFantasySnapshot();
    mockUseFantasySnapshot.mockReturnValue({
      ...snapshotResult,
      snapshot: {
        ...snapshotResult.snapshot,
        overall: [
          { ...snapshotResult.snapshot.overall[0], id: "k-2", name: "Sample Kicker", position: "K" },
        ],
      },
    });

    render(<DraftTrackerClient />);
    fireEvent.click(screen.getByRole("button", { name: "Log Sample Kicker" }));

    expect(screen.getByText(/A second kicker is a bold call\./)).toBeVisible();
  });

  it("does not focus board search when a pick was logged without a search", () => {
    render(<DraftTrackerClient />);

    const search = screen.getByRole("textbox", { name: "Search the board" });
    fireEvent.click(screen.getByRole("button", { name: "Log Bijan Robinson" }));

    expect(mockDraftPlayer).toHaveBeenCalled();
    expect(search).not.toHaveFocus();
  });

  it("moves focus to the on-the-clock tile when a logged pick leaves it on the document", () => {
    render(<DraftTrackerClient />);

    // The row button unmounts with the pick in a live room; here the click
    // never focused it, so focus is already on the document as it would be
    // after that unmount.
    expect(document.body).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Log Bijan Robinson" }));

    const tile = screen.getByText("On the clock").closest("div");
    expect(tile).toHaveAttribute("tabindex", "-1");
    expect(tile).toHaveFocus();
  });

  it("moves focus to the on-the-clock tile after the drawer logs its pick", () => {
    render(<DraftTrackerClient />);

    fireEvent.click(screen.getAllByRole("button", { name: "Open Bijan Robinson detail" })[0]);
    const logThisPick = screen.getByRole("button", { name: "Log this pick" });
    logThisPick.focus();
    expect(logThisPick).toHaveFocus();

    fireEvent.click(logThisPick);

    expect(mockDraftPlayer).toHaveBeenCalledWith(expect.objectContaining({ id: "rb-1" }));
    expect(screen.queryByRole("dialog", { name: "Bijan Robinson detail" })).not.toBeInTheDocument();
    expect(screen.getByText("On the clock").closest("div")).toHaveFocus();
  });

  it("keeps the scorebug pick counter whole on a phone", () => {
    render(<DraftTrackerClient />);

    // The compact copy renders on a phone and the spaced copy above it; both
    // are in the document and the kit's two helpers pick one. The scorebug's
    // phone layout starts at the same 768px those helpers switch at.
    expect(screen.getByText("#2/150")).toHaveClass("ffb-only-phone");
    expect(screen.getByText("#2 / 150")).toHaveClass("ffb-not-phone");
    expect(screen.getByText("Next turn")).toHaveClass("ffb-only-phone");
    expect(screen.getByText("Pool").closest("div")).toHaveClass("ffb-not-phone");
  });

  it("expands the strip cards with their reasoning instead of a second card set", () => {
    const snapshotResult = mockUseFantasySnapshot();
    mockUseFantasySnapshot.mockReturnValue({
      ...snapshotResult,
      snapshot: {
        ...snapshotResult.snapshot,
        overall: [
          ...snapshotResult.snapshot.overall,
          {
            id: "wr-1",
            name: "Ja'Marr Chase",
            team: "CIN",
            position: "WR",
            averageRank: 2,
            rankEcr: 2,
            rankAverage: 2.1,
            standardDeviation: 0.5,
            tier: 1,
            minRank: 1,
            maxRank: 3,
          },
        ],
      },
    });

    render(<DraftTrackerClient />);

    const toggle = screen.getByRole("button", { name: /Why these picks/i });
    expect(toggle).toHaveAttribute("aria-controls", "draft-decision-strip draft-decision-detail");
    // The column floor is the width a card needs to print a chip, a name, and
    // its Log button, so the cards the disclosure appends wrap to a new row
    // instead of squeezing the first three. The floor is 248px, which holds
    // three cards in the list column at 1440. It is the kit's strip rule, and a
    // name that 248px cannot hold takes a second line (the route's own rule).
    expect(document.querySelector("#draft-decision-strip")).toHaveClass("ffb-strip", "ffb-dt-strip");
    expect(fs.readFileSync("src/components/fantasy/fantasy.css", "utf8")).toContain(
      `.ffb-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 248px), 1fr));`
    );
    expect(fs.readFileSync("src/components/fantasy/fantasy-draft.css", "utf8")).toMatch(
      /\.ffb-dt-strip \.ffb-strip-line > \.ffb-c-name \{[^}]*white-space: normal;/
    );
    expect(screen.queryByText(/^Board #1 · Tier 1/)).not.toBeInTheDocument();
    expect(screen.queryByText("Fills WR1")).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/^Board #1 · Tier 1/)).toBeVisible();
    expect(screen.getByText("Fills WR1")).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Log Bijan Robinson as pick 2" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Log Ja'Marr Chase as pick 2" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Log pick" })).not.toBeInTheDocument();
    expect(
      document.querySelector("#draft-decision-detail")?.querySelector('button[aria-label^="Log "]')
    ).toBeNull();
    expect(screen.getByRole("heading", { name: "What changes if you wait" })).toBeVisible();
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
    // Nobody is on the clock and there is no next turn, so the bar is the
    // counter and the pool, and the counter's cell is the focus target.
    expect(screen.getByText("Done").closest("div")).toHaveAttribute("tabindex", "-1");
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.queryByText("On the clock")).not.toBeInTheDocument();
    expect(screen.queryByText(/next turn/i)).not.toBeInTheDocument();
    expect(screen.getByText("Every pick is logged in this room. Start a new room to run it back.")).toBeVisible();
  });

  it("moves focus to the on-the-clock cell after Start draft", () => {
    render(<DraftTrackerClient />);

    fireEvent.click(screen.getByRole("button", { name: "New room" }));
    const start = screen.getByRole("button", { name: "Start mock draft" });
    start.focus();
    fireEvent.click(start);

    // The setup screen left with its Start button, and focus did not fall to the page.
    expect(screen.queryByTestId("draft-setup-mock")).not.toBeInTheDocument();
    expect(screen.getByText("On the clock").closest("div")).toHaveFocus();
  });

  it("keeps one status line mounted from setup into the room, so Start draft announces inside a region already there", () => {
    render(<DraftTrackerClient />);
    const roomStatus = () =>
      screen.getAllByRole("status").find((status) => status.classList.contains("sr-only")) as HTMLElement;

    fireEvent.click(screen.getByRole("button", { name: "New room" }));
    const onSetup = roomStatus();
    expect(onSetup).toBeEmptyDOMElement();

    fireEvent.click(screen.getByRole("button", { name: "Start mock draft" }));

    // The same node, now carrying the room's sentence. The scorebug prints none of its own.
    expect(roomStatus()).toBe(onSetup);
    expect(onSetup).toHaveTextContent(/^Pick \d+ of \d+, round \d+\. /);
    expect(
      within(screen.getByRole("region", { name: "Live draft status" })).queryByRole("status")
    ).not.toBeInTheDocument();
  });

  it("asks the setup screen to take focus when New room opens it", () => {
    render(<DraftTrackerClient />);

    fireEvent.click(screen.getByRole("button", { name: "New room" }));

    expect(screen.getByTestId("draft-setup-mock")).toHaveAttribute("data-focus-heading", "true");
  });

  it("moves focus to the on-the-clock cell when Redo disables itself", () => {
    const state = mockUseDraftState();
    mockUseDraftState.mockReturnValue({ ...state, canRedo: true });
    render(<DraftTrackerClient />);

    const redo = screen.getByRole("button", { name: "Redo the last undone pick" });
    redo.focus();
    // The redo empties the stack, so the next render disables the button it was pressed on.
    mockUseDraftState.mockReturnValue({ ...state, canRedo: false });
    fireEvent.click(redo);

    expect(redo).toBeDisabled();
    expect(screen.getByText("On the clock").closest("div")).toHaveFocus();
  });

  it("keeps focus on Redo while there is more to redo", () => {
    const state = mockUseDraftState();
    mockUseDraftState.mockReturnValue({ ...state, canRedo: true });
    render(<DraftTrackerClient />);

    const redo = screen.getByRole("button", { name: "Redo the last undone pick" });
    redo.focus();
    fireEvent.click(redo);

    expect(redo).toHaveFocus();
  });

  it("moves focus to the on-the-clock cell after an undo back to a pick", () => {
    const state = mockUseDraftState();
    const undoToPick = jest.fn();
    mockUseDraftState.mockReturnValue({ ...state, undoToPick });
    render(<DraftTrackerClient />);

    const sticker = screen.getByRole("button", { name: /^Undo back to pick 1 / });
    sticker.focus();
    // The undo takes the pick, and its sticker, out of the room.
    mockUseDraftState.mockReturnValue({
      ...state,
      undoToPick,
      draftState: { ...state.draftState, picks: [], currentPick: 1 },
    });
    fireEvent.click(sticker);

    expect(undoToPick).toHaveBeenCalledWith(1);
    expect(screen.queryByRole("button", { name: /^Undo back to pick / })).not.toBeInTheDocument();
    expect(screen.getByText("On the clock").closest("div")).toHaveFocus();
  });

  it("offers a way past the board that lands on the rail", () => {
    render(<DraftTrackerClient />);

    const skip = screen.getByRole("link", { name: "Skip to your roster" });
    // It comes before the board, so a keyboard meets it first.
    expect(
      skip.compareDocumentPosition(screen.getByRole("region", { name: "Draft board" })) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    fireEvent.click(skip);

    expect(screen.getByRole("complementary", { name: "Your draft" })).toHaveFocus();
  });
});
