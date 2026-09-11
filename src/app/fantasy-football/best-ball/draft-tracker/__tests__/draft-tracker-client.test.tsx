import { execFileSync } from "node:child_process";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { BestBallDraftTrackerClient } from "../draft-tracker-client";
import type { BestBallSnapshot } from "@/lib/bestBallSnapshot";
import type { Player } from "@/types";

const mockReplace = jest.fn();
let mockSourceDate = new Date().toISOString();
let mockScheduleDate = mockSourceDate;
let mockSnapshotOverride: BestBallSnapshot | null = null;

/**
 * The best ball snapshot committed on 2026-09-10 (a8ded41), whose four-expert
 * consensus placed Jahmyr Gibbs at ECR 54 against an expert range of 1 to 2.
 * The committed data was restored to the last consistent board, so the broken
 * build is read from history rather than kept as a fixture; a clone too
 * shallow to reach it skips the test instead of failing it.
 */
function loadBrokenBuild(): BestBallSnapshot | null {
  try {
    const raw = execFileSync("git", ["show", "a8ded41:public/data/fantasy/best-ball.json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 16 * 1024 * 1024,
    });
    return JSON.parse(raw) as BestBallSnapshot;
  } catch {
    return null;
  }
}

const mockWeek17Opponents = {
  ARI: "SEA", ATL: "NO", BAL: "CIN", BUF: "MIA", CAR: "TB", CHI: "GB",
  CIN: "BAL", CLE: "PIT", DAL: "PHI", DEN: "KC", DET: "MIN", GB: "CHI",
  HOU: "IND", IND: "HOU", JAX: "TEN", KC: "DEN", LAC: "LV", LAR: "SF",
  LV: "LAC", MIA: "BUF", MIN: "DET", NE: "NYJ", NO: "ATL", NYG: "WAS",
  NYJ: "NE", PHI: "DAL", PIT: "CLE", SEA: "ARI", SF: "LAR", TB: "CAR",
  TEN: "JAX", WAS: "NYG",
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/fantasy-football/best-ball/draft-tracker",
}));

const mockPlayers: Player[] = [
  ["wr-1", "Ja'Marr Chase", "CIN", "WR", 1, 1.2, 10],
  ["rb-1", "Bijan Robinson", "ATL", "RB", 2, 2.1, 5],
  ["wr-2", "Puka Nacua", "LAR", "WR", 3, 3.2, 8],
  ["qb-1", "Josh Allen", "BUF", "QB", 12, 14.1, 7],
  ["te-1", "Brock Bowers", "LV", "TE", 15, 16.4, 8],
  ["wr-3", "Amon-Ra St. Brown", "DET", "WR", 4, 4.5, 8],
].map(([id, name, team, position, rank, adp, bye]) => ({
  id: String(id),
  name: String(name),
  team: String(team),
  position: position as Player["position"],
  averageRank: Number(rank),
  rankEcr: Number(rank),
  standardDeviation: 1,
  adp: Number(adp),
  byeWeek: Number(bye),
  superflexRank: position === "QB" ? 1 : Number(rank) + 6,
}));

jest.mock("@/hooks/useBestBallSnapshot", () => ({
  useBestBallSnapshot: () => ({
    snapshot: mockSnapshotOverride ?? {
      schemaVersion: 2,
      season: 2026,
      generatedAt: mockSourceDate,
      players: mockPlayers,
      rankingSource: {
        provider: "FantasyPros",
        url: "https://example.com/rankings",
        asOf: mockSourceDate,
      },
      adpSource: {
        provider: "Underdog ADP",
        url: "https://example.com/adp",
        asOf: mockSourceDate,
      },
      superflexSource: {
        provider: "FantasyPros",
        url: "https://example.com/superflex",
        asOf: mockSourceDate,
      },
      scheduleSource: {
        provider: "ESPN",
        url: "https://example.com/schedule",
        asOf: mockScheduleDate,
      },
      week17Opponents: mockWeek17Opponents,
    },
    isLoading: false,
    error: null,
    retry: jest.fn(),
  }),
}));

describe("BestBallDraftTrackerClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockReplace.mockClear();
    mockSourceDate = new Date().toISOString();
    mockScheduleDate = mockSourceDate;
    mockSnapshotOverride = null;
    // jsdom does not implement scrolling; the room scrolls its status card
    // under the live bar when it opens, so the call is what gets asserted.
    window.scrollTo = jest.fn();
  });

  it("scrolls the status card into view and focuses the on-the-clock heading when the room opens", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );

    const heading = screen.getByRole("heading", { name: "You are on the clock at pick 1" });
    expect(heading).toHaveFocus();
    expect(window.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: expect.any(Number), behavior: "smooth" })
    );
  });

  it("places focus after a pick on the heading for a card pick and on the next row for a board pick", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );
    (window.scrollTo as jest.Mock).mockClear();

    // The card unmounts with the pick (the next turn is another slot's), so
    // the heading that now reads the room state takes focus, without a scroll.
    fireEvent.click(screen.getAllByRole("button", { name: "Log for my team" })[0]);
    expect(screen.getByRole("heading", { name: "Slot 2 is on the clock" })).toHaveFocus();
    expect(window.scrollTo).not.toHaveBeenCalled();

    // A board pick stays in the board: the Draft button of the row that slid
    // into the drafted row's place takes focus.
    fireEvent.click(screen.getByRole("button", { name: "Draft Bijan Robinson at pick 2" }));
    expect(screen.getByRole("heading", { name: "Slot 3 is on the clock" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Draft Puka Nacua at pick 3" })).toHaveFocus();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  const brokenBuild = loadBrokenBuild();
  (brokenBuild ? it : it.skip)(
    "pauses the cards with a dated sentence and withholds the consensus on the 2026-09-10 build",
    async () => {
      const now = new Date().toISOString();
      mockSnapshotOverride = {
        ...(brokenBuild as BestBallSnapshot),
        // The ADP and schedule sources are dated today so the room orders on
        // ADP as it did on the day; the ranking source keeps its own date
        // because the pause sentence prints it.
        adpSource: { ...(brokenBuild as BestBallSnapshot).adpSource!, asOf: now },
        scheduleSource: { ...(brokenBuild as BestBallSnapshot).scheduleSource!, asOf: now },
      };
      render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);

      const pause = await screen.findByText(/Draft Outlook is paused because/);
      expect(pause).toHaveTextContent(
        /the PPR best ball consensus published Sep 9, 2026 disagrees with its own expert ranges on \d+ of its top 150 players, so its ranks are withheld\. Exact player cards are paused too\./
      );

      fireEvent.click(screen.getByRole("button", { name: "Open draft room from slot 1" }));
      expect(screen.getByRole("heading", { name: "You are on the clock at pick 1" })).toHaveFocus();
      expect(
        screen.getByText(/Exact player cards are unavailable because the PPR best ball consensus published Sep 9, 2026/)
      ).toBeVisible();
      expect(screen.queryByRole("button", { name: "Log for my team" })).not.toBeInTheDocument();
      expect(screen.queryByTestId("best-ball-score-explainer")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Draft Outlook paused" })).toBeVisible();

      // Gibbs is the market's first pick and the provider's ECR 54. The board
      // keeps him first on ADP and prints no rank for him.
      const gibbsRow = screen
        .getByRole("button", { name: "Open Jahmyr Gibbs detail" })
        .closest("div") as HTMLElement;
      const provenance = gibbsRow.querySelector("[data-consensus-withheld='true']");
      expect(provenance?.getAttribute("title")).toMatch(
        /The current standard Underdog ADP is 1\.0\. The published PPR best ball consensus rank for this player sits outside its own expert range, so the ECR is withheld\./
      );
      expect(document.body.textContent).not.toMatch(/ECR is 54/);

      // The drawer prints tier, position rank, and the reach or value reading
      // from the same rank, so it gets none of the three on a withheld row.
      fireEvent.click(screen.getByRole("button", { name: "Open Jahmyr Gibbs detail" }));
      const dialog = await screen.findByRole("dialog", { name: "Jahmyr Gibbs detail" });
      expect(within(dialog).getByText("Tier").nextElementSibling).toHaveTextContent(/^—$/);
      expect(within(dialog).getByText("Position rank").nextElementSibling).toHaveTextContent(
        /^RB —$/
      );
      expect(within(dialog).queryByText(/reach|value/i)).not.toBeInTheDocument();
    }
  );

  it("opens a room, logs the snake pick, and undoes it", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);

    expect(await screen.findByRole("heading", { name: "Choose your draft slot" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Open draft room from slot 1" }));

    expect(
      screen.getByRole("heading", { name: "You are on the clock at pick 1" })
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Best fits for your next pick" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Log for my team" }).length).toBeGreaterThan(0);
    // The score explainer is protected framing and prints with the cards it
    // explains; on another slot's turn there is no score under it, so the
    // section keeps only the sentence that says why the cards are hidden.
    expect(screen.getByTestId("best-ball-score-explainer")).toHaveTextContent(
      /This is not a projected win rate\./
    );
    fireEvent.click(screen.getByRole("button", { name: "Draft Ja'Marr Chase at pick 1" }));

    expect(screen.getByRole("heading", { name: "Slot 2 is on the clock" })).toBeVisible();
    expect(screen.queryByTestId("best-ball-score-explainer")).not.toBeInTheDocument();
    expect(screen.getByText(/Exact player cards stay hidden until your turn/)).toBeVisible();
    await waitFor(() =>
      expect(
        JSON.parse(
          window.localStorage.getItem("fantasy-best-ball-draft-v1-2026-bbm-vii") ?? "{}"
        ).picks
      ).toHaveLength(1)
    );
    fireEvent.click(screen.getByRole("button", { name: "Undo last pick" }));
    expect(
      screen.getByRole("heading", { name: "You are on the clock at pick 1" })
    ).toBeVisible();
  });

  it("keeps a zero-pick room open after reload and preserves its redo", async () => {
    const firstView = render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Draft Ja'Marr Chase at pick 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Undo last pick" }));

    const key = "fantasy-best-ball-draft-v1-2026-bbm-vii";
    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem(key) ?? "{}")).toMatchObject({
        picks: [],
        startedAt: expect.any(String),
        undoHistory: [
          expect.objectContaining({
            pickNumber: 1,
            player: expect.objectContaining({ id: "wr-1" }),
          }),
        ],
      })
    );

    firstView.unmount();
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);

    expect(
      await screen.findByRole("heading", { name: "You are on the clock at pick 1" })
    ).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Choose your draft slot" }))
      .not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Redo pick 1 (Ja'Marr Chase)" })
    );
    expect(screen.getByRole("heading", { name: "Slot 2 is on the clock" })).toBeVisible();
  });

  it("redoes every pick removed by a recent-pick rewind in order", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Draft Ja'Marr Chase at pick 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Draft Bijan Robinson at pick 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Draft Puka Nacua at pick 3" }));

    fireEvent.click(
      screen.getByRole("button", { name: "Undo back to pick 2 (Bijan Robinson)" })
    );
    expect(screen.getByRole("heading", { name: "Slot 2 is on the clock" })).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Redo pick 2 (Bijan Robinson)" })
    );
    expect(screen.getByRole("button", { name: "Redo pick 3 (Puka Nacua)" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Redo pick 3 (Puka Nacua)" }));

    expect(screen.getByRole("heading", { name: "Slot 4 is on the clock" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Redo pick (nothing to redo)" })).toBeDisabled();
  });

  it("keeps Weekly Winners board and roster guidance without exact player cards", async () => {
    render(<BestBallDraftTrackerClient initialContest="weekly-winners" />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );

    expect(screen.getByRole("heading", { name: "Board and roster guidance" })).toBeVisible();
    expect(screen.getByText("Reference guidance only")).toBeVisible();
    expect(screen.getByText(/Weekly Winners player pools and slates vary/)).toBeVisible();
    expect(screen.getByRole("heading", { name: "Log the player selected" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Roster targets that update" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Log for my team" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Weekly projection spread 0/)).not.toBeInTheDocument();
  });

  it("does not present standard-lineup ADP as a Superflex room price", async () => {
    render(<BestBallDraftTrackerClient initialContest="superflex" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );

    expect(screen.getAllByText("Source rank").length).toBeGreaterThan(0);
    expect(screen.queryByText(/ADP 1\.2/)).not.toBeInTheDocument();
    expect(screen.getByText("Reference guidance only")).toBeVisible();
    expect(screen.getByText(/no matching Superflex room ADP/i)).toBeVisible();
  });

  it("states a stale exact source separately from catalog reference reasons", async () => {
    mockSourceDate = "2020-01-01T00:00:00.000Z";
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);

    expect(
      await screen.findByText(/Draft Outlook is paused.*Exact player cards are paused too/i)
    ).toBeVisible();
    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );

    expect(
      screen.getAllByRole("alert").some((alert) =>
        /ranking source is stale/i.test(alert.textContent ?? "")
      )
    ).toBe(true);
    expect(screen.getByRole("heading", { name: "Draft Outlook paused" })).toBeVisible();
    expect(screen.queryByText("Calculated market value")).not.toBeInTheDocument();
    expect(screen.queryByText("Reference guidance only")).not.toBeInTheDocument();
  });

  it("pauses exact guidance when the Week 17 schedule is stale", async () => {
    mockScheduleDate = "2020-01-01T00:00:00.000Z";
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);

    expect(
      await screen.findByText(/Draft Outlook is paused because the Week 17 schedule source is stale/i)
    ).toBeVisible();
    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );

    expect(screen.getByRole("heading", { name: "Draft Outlook paused" })).toBeVisible();
    expect(screen.getByText(/Exact player cards are unavailable because the Week 17 schedule source is stale/i))
      .toBeVisible();
    expect(screen.queryByRole("button", { name: "Log for my team" }))
      .not.toBeInTheDocument();
    expect(screen.getByText(/Week 17 guidance is paused/i)).toBeVisible();
  });

  it("opens the mobile build dialog and returns focus when it closes", async () => {
    render(<BestBallDraftTrackerClient initialContest="eliminator" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );

    const trigger = screen.getByRole("button", { name: /My build/ });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "0 of 18 players" })).toBeVisible();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("requires confirmation before resetting from the mobile build sheet", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Draft Ja'Marr Chase at pick 1" }));
    fireEvent.click(screen.getByRole("button", { name: /My build/ }));

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Reset this room" }));
    expect(within(dialog).getByRole("button", { name: "Confirm reset" })).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Keep room" })).toHaveFocus();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm reset" }));

    expect(await screen.findByRole("heading", { name: "Choose your draft slot" })).toBeVisible();
  });

  it("returns a restored room to setup after confirmed reset", async () => {
    const firstView = render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Draft Ja'Marr Chase at pick 1" }));

    const key = "fantasy-best-ball-draft-v1-2026-bbm-vii";
    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem(key) ?? "{}").picks).toHaveLength(1)
    );
    firstView.unmount();
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);

    expect(await screen.findByRole("heading", { name: "Slot 2 is on the clock" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Reset this room" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm reset" }));

    expect(await screen.findByRole("heading", { name: "Choose your draft slot" })).toBeVisible();
    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem(key) ?? "{}")).toMatchObject({
        picks: [],
        undoHistory: [],
        startedAt: null,
      })
    );
  });

  it("keeps a legacy overloaded-format room as a local backup", async () => {
    const key = "fantasy-best-ball-draft-v1-2026-bbm-vii";
    const raw = JSON.stringify({
      schemaVersion: 1,
      season: 2026,
      contestId: "bbm-vii",
      userSlot: 1,
      rules: {
        contestId: "bbm-vii",
        rulesSchemaVersion: 1,
        format: "tournament",
        scoring: "HALF_PPR",
        teams: 12,
        rounds: 18,
        rosterSize: 18,
        lineup: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1 },
      },
      picks: [],
      startedAt: null,
      updatedAt: "2026-08-02T12:00:00.000Z",
    });
    window.localStorage.setItem(key, raw);

    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);

    expect(await screen.findByText(/kept the prior save as a local backup/i)).toBeVisible();
    expect(window.localStorage.getItem(`${key}-previous`)).toBe(raw);
  });
});
