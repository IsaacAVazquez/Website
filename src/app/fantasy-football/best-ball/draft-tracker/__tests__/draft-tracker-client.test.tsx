import { execFileSync } from "node:child_process";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { BestBallDraftTrackerClient, findOtherSavedRoom } from "../draft-tracker-client";
import {
  addBestBallDraftPick,
  getBestBallDraftStorageKey,
  type BestBallDraftState,
} from "../best-ball-draft-state";
import type { BestBallSnapshot } from "@/lib/bestBallSnapshot";
import type { Player } from "@/types";

/** The room's one announcement: the visually hidden status line that outlives its screens. */
const roomStatus = () =>
  screen.getAllByRole("status").find((status) => status.classList.contains("sr-only")) as HTMLElement;

/**
 * A room in `contest` from `slot` with `count` picks logged. The room checks a
 * save against its preset, so the picks are added to the save the room itself
 * wrote, and the page is rendered again on it.
 */
async function seedRoom(contest: string, slot: number, count: number) {
  const firstView = render(<BestBallDraftTrackerClient initialContest={contest} />);
  if (slot !== 1) fireEvent.click(await screen.findByRole("radio", { name: String(slot) }));
  fireEvent.click(await screen.findByRole("button", { name: `Open draft room from slot ${slot}` }));
  const key = getBestBallDraftStorageKey(2026, contest);
  await waitFor(() => expect(window.localStorage.getItem(key)).toMatch(/"startedAt":"/));
  let state = JSON.parse(window.localStorage.getItem(key) as string) as BestBallDraftState;
  for (let index = 0; index < count; index += 1) {
    state = addBestBallDraftPick(state, {
      ...mockPlayers[index % mockPlayers.length],
      id: `filled-${index + 1}`,
      name: `Filled ${index + 1}`,
    });
  }
  expect(state.picks).toHaveLength(count);
  firstView.unmount();
  window.localStorage.setItem(key, JSON.stringify(state));
  return render(<BestBallDraftTrackerClient initialContest={contest} />);
}

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
  ["wr-4", "Marvin Harrison Jr.", "ARI", "WR", 30, 31.5, 8],
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
    // jsdom does not implement scrolling; the room scrolls its scorebug to
    // the top of the screen when it opens, so the call is what gets asserted.
    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("scrolls the room into view and focuses the on-the-clock heading when the room opens", async () => {
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

    // The fit unmounts with the pick (the next turn is another slot's), so
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
        .closest("li") as HTMLElement;
      const provenance = gibbsRow.querySelector("[data-consensus-withheld='true']");
      expect(provenance?.getAttribute("title")).toMatch(
        /The current standard Underdog ADP is 1\.0\. The published PPR best ball consensus rank for this player sits outside its own expert range, so the ECR is withheld\./
      );
      expect(document.body.textContent).not.toMatch(/ECR is 54/);

      // The drawer prints tier, position rank, and the reach or value reading
      // from the same rank, so it gets none of the three on a withheld row.
      fireEvent.click(screen.getByRole("button", { name: "Open Jahmyr Gibbs detail" }));
      const dialog = await screen.findByRole("dialog", { name: "Jahmyr Gibbs detail" });
      expect(within(dialog).getByText("Tier").nextElementSibling).toHaveTextContent(/^Withheld$/);
      expect(within(dialog).getByText("Position rank").nextElementSibling).toHaveTextContent(
        /^Withheld$/
      );
      // The drawer's head names the rank it prints, since the board is ordered by the market.
      expect(within(dialog).getByText("Board rank 1")).toBeInTheDocument();
      expect(within(dialog).queryByText(/reach|value/i)).not.toBeInTheDocument();

      // Logged, his sticker prints the position alone, since its rank is the withheld consensus's.
      fireEvent.click(within(dialog).getByRole("button", { name: /Log this pick/ }));
      const sticker = await screen.findByRole("button", { name: "Undo back to pick 1 (Jahmyr Gibbs)" });
      expect(sticker).toHaveTextContent(/RB · DET/);
      expect(sticker).not.toHaveTextContent(/RB\d/);
    }
  );

  it("opens a room, logs the snake pick, and undoes it", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);

    expect(await screen.findByRole("heading", { name: "Choose your draft slot" })).toBeVisible();
    // Setup keeps the headline and the pitch, in the kit's setup head.
    expect(screen.getByRole("heading", { level: 1 }).closest("header")).toHaveClass("ffb-head-setup");
    fireEvent.click(screen.getByRole("button", { name: "Open draft room from slot 1" }));

    expect(
      screen.getByRole("heading", { name: "You are on the clock at pick 1" })
    ).toBeVisible();
    // An open room gets the running head, one compact line.
    expect(screen.getByRole("heading", { level: 1 }).closest("header")).toHaveClass("ffb-head-run");
    expect(screen.getByRole("heading", { level: 1 }).closest("header")).not.toHaveClass("ffb-head-setup");
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
    // Preseason clock: from Week 1 the same gate reads as a frozen board.
    jest.useFakeTimers({ now: new Date("2026-08-10T12:00:00.000Z") });
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

  it("describes the frozen in-season board once and promises no refresh", async () => {
    // The committed 2026 board read on Sep 11: consensus Sep 1, schedule Sep 10.
    jest.useFakeTimers({ now: new Date("2026-09-11T12:00:00.000Z") });
    mockSourceDate = "2026-09-01T11:20:54.000Z";
    mockScheduleDate = "2026-09-10T19:28:43.439Z";
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);

    expect(
      await screen.findByText(
        "Draft Outlook is paused because the best ball consensus is frozen at its Sep 1, 2026 board and the market closed at kickoff. Exact player cards are paused too, because both need a current consensus. The board stays as a frozen reference for next summer, and the roster targets and manual pick log remain available."
      )
    ).toBeVisible();
    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );

    // Still paused: no cards, no market value, and the rail carries the short form.
    expect(screen.getByRole("heading", { name: "Draft Outlook paused" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Log for my team" })).not.toBeInTheDocument();
    expect(screen.queryByText("Calculated market value")).not.toBeInTheDocument();
    expect(
      screen.getAllByText("Paused on the frozen board. Nothing here refreshes this season.").length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /^Exact player cards are unavailable because the best ball consensus is frozen at its Sep 1, 2026 board and the market closed at kickoff\./
      )
    ).toBeVisible();

    // The full clause prints once, and nothing calls the board stale or waiting.
    expect(screen.getAllByText(/Draft Outlook is paused because/)).toHaveLength(1);
    expect(screen.queryByText(/\bstale\b/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/It will return after the published sources refresh/)
    ).not.toBeInTheDocument();
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

  it("keeps one status line mounted from setup into the room, so the opening sentence lands in a region already there", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    const open = await screen.findByRole("button", { name: "Open draft room from slot 1" });
    const onSetup = roomStatus();
    expect(onSetup).toBeEmptyDOMElement();

    fireEvent.click(open);

    expect(roomStatus()).toBe(onSetup);
    expect(onSetup).toHaveTextContent(/^Pick 1 of 216, round 1\. You are on the clock\.$/);
  });

  it("prints the pick, the round, and the next turn in the scorebug", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(await screen.findByRole("radio", { name: "3" }));
    fireEvent.click(screen.getByRole("button", { name: "Open draft room from slot 3" }));

    const bug = screen.getByRole("region", { name: "Live draft status" });
    // The pick cell prints as the other two rooms print it: the spaced form from
    // 768px and the tight one on a phone, each the whole text of its own span.
    expect(within(bug).getByText("Pick").nextElementSibling).toHaveTextContent(/^#1\/216#1 \/ 216$/);
    expect(within(bug).getByText("#1 / 216")).toHaveClass("ffb-not-phone");
    expect(within(bug).getByText("#1/216")).toHaveClass("ffb-only-phone");
    expect(within(bug).getByText("Round").nextElementSibling).toHaveTextContent(/^1 of 18$/);
    expect(within(bug).getByText("Your next turn").parentElement?.nextElementSibling)
      .toHaveTextContent(/^#3 in 2 picks$/);
    expect(screen.getByRole("heading", { name: "Slot 1 is on the clock" })).toHaveTextContent(
      "Slot 1 is on the clockSlot 1"
    );
    // The on-the-clock cell names the pick just logged, and the first overall pick before any.
    const onClock = screen.getByRole("heading", { name: "Slot 1 is on the clock" }).parentElement as HTMLElement;
    expect(within(onClock).getByText("First overall pick")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Draft Ja'Marr Chase at pick 1" }));
    expect(
      within(screen.getByRole("heading", { name: "Slot 2 is on the clock" }).parentElement as HTMLElement)
        .getByText("Prev · J. Chase #1")
    ).toBeInTheDocument();
    expect(within(bug).getByText("Your next turn").parentElement?.nextElementSibling)
      .toHaveTextContent(/^#3 in 1 pick$/);
    expect(roomStatus()).toHaveTextContent(
      "Pick 2 of 216, round 1. Slot 2 is on the clock. Last pick: Ja'Marr Chase."
    );
    // The bar prints no status of its own, so the room has one announcement.
    expect(within(bug).queryByRole("status")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Draft Bijan Robinson at pick 2" }));
    expect(within(bug).getByText("#3 / 216")).toBeInTheDocument();
    // Slot 3 picks 3 and then 22 in a twelve-team snake.
    expect(within(bug).getByText("Your next turn").parentElement?.nextElementSibling)
      .toHaveTextContent(/^Now then #22$/);
    expect(screen.getByRole("heading", { name: "You are on the clock at pick 3" })).toHaveTextContent(
      "You are on the clock at pick 3You"
    );
  });

  it("marks the turn after the user's own pick on the board while the user is on the clock", async () => {
    // Slot 6 of a six-team snake picks 6 and then 7, so the line sits above the second row.
    render(<BestBallDraftTrackerClient initialContest="six-man" />);
    fireEvent.click(await screen.findByRole("radio", { name: "6" }));
    fireEvent.click(screen.getByRole("button", { name: "Open draft room from slot 6" }));
    for (const name of ["Ja'Marr Chase", "Bijan Robinson", "Puka Nacua", "Amon-Ra St. Brown", "Josh Allen"]) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`^Draft ${name} at pick`) }));
    }
    expect(screen.getByRole("heading", { name: "You are on the clock at pick 6" })).toBeInTheDocument();
    const line = screen.getByText("Your turn #7").closest("li") as HTMLElement;
    expect(line.nextElementSibling).toHaveTextContent(/Marvin Harrison Jr\./);
  });

  it("says the last turn, and none left, in the next-turn cell, and that a full roster has no pick to fit", async () => {
    // Slot 1 picks the last pick of the eighteenth round, 216.
    const lastTurn = await seedRoom("bbm-vii", 1, 215);
    const bug = await screen.findByRole("region", { name: "Live draft status" });
    expect(within(bug).getByText("Your next turn").parentElement?.nextElementSibling)
      .toHaveTextContent(/^Now last turn$/);
    lastTurn.unmount();
    window.localStorage.clear();

    // Slot 12 picks 205, the first pick of the eighteenth round, and then no more.
    await seedRoom("bbm-vii", 12, 205);
    const after = await screen.findByRole("region", { name: "Live draft status" });
    expect(within(after).getByText("Your next turn").parentElement?.nextElementSibling)
      .toHaveTextContent(/^None left$/);
    expect(screen.getByText("Your roster is full, so there is no next pick to fit.")).toBeVisible();
    expect(screen.queryByText(/stay hidden until your turn/)).not.toBeInTheDocument();
  });

  it("sends focus to the status heading when the draft's last pick is logged from a row", async () => {
    await seedRoom("bbm-vii", 1, 215);
    await screen.findByRole("heading", { name: "Slot 1 is on the clock" }).catch(() => null);
    const [last] = await screen.findAllByRole("button", { name: /^Draft .+ at pick 216$/ });
    act(() => last.focus());
    fireEvent.click(last);
    expect(screen.getByRole("heading", { name: "Draft complete" })).toHaveFocus();
  });

  it("prints the roster target words, and none where the range has closed on the count", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(await screen.findByRole("button", { name: "Open draft room from slot 1" }));
    const targets = screen.getByRole("region", { name: "Roster targets that update" });
    const row = (position: string) => within(targets).getByText(position).closest(".ffb-fact") as HTMLElement;
    expect(row("QB")).toHaveTextContent(/^QB0 \/ 3Range 2 to 3, 2 short\. /);
    expect(within(row("QB")).getByText("2 short")).toHaveClass("ffb-muted");
    fireEvent.click(screen.getByRole("button", { name: "Draft Ja'Marr Chase at pick 1" }));
    expect(row("WR")).toHaveTextContent(/Range 7 to 8, 6 short\. /);
  });

  it("closes an open build sheet when the window grows past 1200px", async () => {
    const listeners: Array<() => void> = [];
    const query = { matches: false, addEventListener: (_: string, fn: () => void) => listeners.push(fn), removeEventListener: jest.fn() };
    const original = window.matchMedia;
    window.matchMedia = jest.fn().mockImplementation((media: string) =>
      media === "(min-width: 1200px)" ? query : original(media)
    );
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(await screen.findByRole("button", { name: "Open draft room from slot 1" }));
    fireEvent.click(screen.getByRole("button", { name: /My build/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    query.matches = true;
    act(() => listeners.forEach((listener) => listener()));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    window.matchMedia = original;
  });

  it("prints the build's four counts against their targets in the bar's build button", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(await screen.findByRole("button", { name: "Open draft room from slot 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Draft Ja'Marr Chase at pick 1" }));
    const build = screen.getByRole("button", { name: /My build/ });
    // From 768px; a phone keeps the total alone.
    expect(within(build).getByText("QB 0/3 · RB 0/5 · WR 1/8 · TE 0/2")).toHaveClass("ffb-not-phone");
    expect(within(build).getByText("1 / 18")).toBeInTheDocument();
  });

  it("names a started room saved in another contest on setup, and opens it", async () => {
    // A Superflex room two picks in, then the bare route, which opens on BBM VII.
    const superflex = await seedRoom("superflex", 1, 2);
    superflex.unmount();
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);

    expect(await screen.findByText(/^A Superflex room is saved at pick 3\./)).toBeVisible();
    fireEvent.click(screen.getByRole("link", { name: "Open it" }));
    expect(mockReplace).toHaveBeenLastCalledWith(
      "/fantasy-football/best-ball/draft-tracker?contest=superflex",
      { scroll: false }
    );
    expect(await screen.findByRole("heading", { name: "Slot 3 is on the clock" })).toBeVisible();
  });

  it("finds the last updated started room of another contest and passes over the rest", () => {
    const saves: Record<string, string> = {
      "fantasy-best-ball-draft-v1-2026-bbm-vii": JSON.stringify({ contestId: "bbm-vii", startedAt: "x", picks: [{}], rules: { teams: 12, rounds: 18 }, updatedAt: "2026-08-03T00:00:00Z" }),
      "fantasy-best-ball-draft-v1-2026-eliminator": JSON.stringify({ contestId: "eliminator", startedAt: "x", picks: [{}, {}], rules: { teams: 12, rounds: 18 }, updatedAt: "2026-08-02T00:00:00Z" }),
      "fantasy-best-ball-draft-v1-2026-puppy": JSON.stringify({ contestId: "puppy", startedAt: "x", picks: [{}], rules: { teams: 12, rounds: 18 }, updatedAt: "2026-08-01T00:00:00Z" }),
      "fantasy-best-ball-draft-v1-2026-superflex": JSON.stringify({ contestId: "superflex", startedAt: null, picks: [], rules: { teams: 12, rounds: 20 }, updatedAt: "2026-08-09T00:00:00Z" }),
      "fantasy-best-ball-draft-v1-2026-sit-and-go-previous": JSON.stringify({ contestId: "sit-and-go", startedAt: "x", picks: [], rules: { teams: 12, rounds: 18 }, updatedAt: "2026-08-09T00:00:00Z" }),
      "fantasy-best-ball-draft-v1-2025-six-man": JSON.stringify({ contestId: "six-man", startedAt: "x", picks: [], rules: { teams: 6, rounds: 18 }, updatedAt: "2026-08-09T00:00:00Z" }),
      "fantasy-best-ball-draft-v1-2026-weekly-winners": "not json",
    };
    const keys = Object.keys(saves);
    const storage = { length: keys.length, key: (index: number) => keys[index] ?? null, getItem: (key: string) => saves[key] ?? null };

    // BBM VII is the one showing, Superflex never started, the backup and the
    // other season are not rooms, and Eliminator was updated after the Puppy.
    expect(findOtherSavedRoom(storage, 2026, "bbm-vii")).toEqual({ contestId: "eliminator", currentPick: 3 });
    expect(findOtherSavedRoom(storage, 2026, "eliminator")).toEqual({ contestId: "bbm-vii", currentPick: 2 });
  });

  it("closes the Undo sentence with one full stop after a name that ends in one", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(await screen.findByRole("button", { name: "Open draft room from slot 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Draft Marvin Harrison Jr. at pick 1" }));

    expect(document.getElementById("best-ball-undo-target")).toHaveTextContent(
      /^Undo removes pick 1, Marvin Harrison Jr\. The picks above reach further back\./
    );
    expect(roomStatus()).toHaveTextContent(/Last pick: Marvin Harrison Jr\.$/);
  });

  it("names the pick Undo removes and describes the Undo button by it", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(await screen.findByRole("button", { name: "Open draft room from slot 1" }));

    const undo = screen.getByRole("button", { name: "Undo last pick" });
    expect(undo).toBeDisabled();
    expect(undo).not.toHaveAttribute("aria-describedby");

    fireEvent.click(screen.getByRole("button", { name: "Draft Ja'Marr Chase at pick 1" }));
    expect(undo).toHaveAttribute("aria-describedby", "best-ball-undo-target");
    expect(document.getElementById("best-ball-undo-target")).toHaveTextContent(
      /^Undo removes pick 1, Ja'Marr Chase\. The picks above reach further back\./
    );
  });

  it("sends focus to the status heading when Undo, Redo, or a last pick uses itself up", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(await screen.findByRole("button", { name: "Open draft room from slot 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Draft Ja'Marr Chase at pick 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Draft Bijan Robinson at pick 2" }));

    // The sticker leaves with the pick it undoes back to.
    const sticker = screen.getByRole("button", { name: "Undo back to pick 2 (Bijan Robinson)" });
    sticker.focus();
    fireEvent.click(sticker);
    expect(screen.getByRole("heading", { name: "Slot 2 is on the clock" })).toHaveFocus();

    // Redo disables itself once nothing is left to redo.
    const redo = screen.getByRole("button", { name: "Redo pick 2 (Bijan Robinson)" });
    redo.focus();
    fireEvent.click(redo);
    expect(screen.getByRole("button", { name: "Redo pick (nothing to redo)" })).toBeDisabled();
    expect(screen.getByRole("heading", { name: "Slot 3 is on the clock" })).toHaveFocus();

    // Undo keeps the focus while it still has a pick to remove, and gives it up on the last one.
    const undo = screen.getByRole("button", { name: "Undo last pick" });
    undo.focus();
    fireEvent.click(undo);
    expect(undo).toHaveFocus();
    fireEvent.click(undo);
    expect(undo).toBeDisabled();
    expect(screen.getByRole("heading", { name: "You are on the clock at pick 1" })).toHaveFocus();
  });

  it("sends focus to the setup heading after a reset, and back to Reset after Keep room", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(await screen.findByRole("button", { name: "Open draft room from slot 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Draft Ja'Marr Chase at pick 1" }));

    fireEvent.click(screen.getByRole("button", { name: "Reset this room" }));
    expect(screen.getByText("Reset this room and its 1 pick?")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Keep room" }));
    expect(screen.getByRole("button", { name: "Reset this room" })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Reset this room" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm reset" }));
    expect(screen.getByRole("heading", { name: "Choose your draft slot" })).toHaveFocus();
  });

  it("skips from before the board to the roster build", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(await screen.findByRole("button", { name: "Open draft room from slot 1" }));

    fireEvent.click(screen.getByRole("link", { name: "Skip the board" }));
    expect(screen.getByRole("complementary", { name: "Roster build" })).toHaveFocus();
  });

  it("lists every logged pick under the pick grid in place of a second recent-picks list", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(await screen.findByRole("button", { name: "Open draft room from slot 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Draft Ja'Marr Chase at pick 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Draft Bijan Robinson at pick 2" }));

    const rail = screen.getByRole("complementary", { name: "Roster build" });
    expect(within(rail).getByRole("heading", { name: "Pick grid" })).toBeVisible();
    expect(within(rail).getByRole("img", { name: "Pick 1, slot 1, yours, Ja'Marr Chase, WR" })).toBeVisible();
    expect(within(rail).getByRole("img", { name: "Pick 3, slot 3, on the clock" })).toBeVisible();
    expect(within(rail).getByText(/· Slot 2 · Bijan Robinson/)).toBeInTheDocument();
    // The build comes first in the rail, and Draft Outlook after the pick grid.
    const headings = within(rail).getAllByRole("heading").map((heading) => heading.textContent);
    expect(headings.indexOf("1 of 18 players")).toBe(0);
    expect(headings.indexOf("Roster")).toBeLessThan(headings.indexOf("Pick grid"));
    expect(headings.indexOf("Pick grid")).toBeLessThan(
      headings.findIndex((text) => /Draft Outlook|How this room reads/i.test(text ?? ""))
    );
  });

  it("says a finished draft is complete and never tells the user to wait for a turn", async () => {
    const firstView = render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(await screen.findByRole("button", { name: "Open draft room from slot 1" }));

    // The room validates a save against its preset, so the finished draft is
    // built on the state the room itself saved, with all 216 picks logged.
    const key = getBestBallDraftStorageKey(2026, "bbm-vii");
    await waitFor(() => expect(window.localStorage.getItem(key)).toMatch(/"startedAt":"/));
    let state = JSON.parse(window.localStorage.getItem(key) as string) as BestBallDraftState;
    const total = state.rules.teams * state.rules.rounds;
    expect(total).toBe(216);
    for (let index = 0; index < total; index += 1) {
      state = addBestBallDraftPick(state, {
        ...mockPlayers[index % mockPlayers.length],
        id: `filled-${index + 1}`,
        name: `Filled ${index + 1}`,
      });
    }
    expect(state.picks).toHaveLength(216);
    firstView.unmount();
    window.localStorage.setItem(key, JSON.stringify(state));
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);

    const heading = await screen.findByRole("heading", { name: "Draft complete" });
    // The finished draft's one cell is the pick cell, and it reads "Done", as the other two rooms' does.
    expect(heading).toHaveTextContent("Draft completeDone");
    expect(heading.previousElementSibling).toHaveTextContent(/^Pick$/);
    expect(heading).toHaveAttribute("tabindex", "-1");
    expect(
      screen.getByText("The draft is complete, so there is no next pick to fit.")
    ).toBeVisible();
    expect(screen.queryByText(/stay hidden until your turn/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Log for my team" })).not.toBeInTheDocument();

    // Nobody is on the clock and no turn is left, so the bar drops those cells.
    const bug = screen.getByRole("region", { name: "Live draft status" });
    expect(within(bug).getAllByText("Pick")).toHaveLength(1);
    expect(within(bug).queryByText("Round")).not.toBeInTheDocument();
    expect(within(bug).queryByText("On the clock")).not.toBeInTheDocument();
    expect(within(bug).queryByText("Your next turn")).not.toBeInTheDocument();
    expect(roomStatus()).toHaveTextContent(/^Draft complete\.$/);
    expect(screen.getByRole("button", { name: "Redo pick (nothing to redo)" })).toBeDisabled();
    for (const button of screen.getAllByTestId("best-ball-board-draft")) expect(button).toBeDisabled();
    expect(screen.getByRole("heading", { name: "18 of 18 players" })).toBeVisible();
    // The grid reads in snake order: round two runs from slot 12 back to slot 1.
    const rail = screen.getByRole("complementary", { name: "Roster build" });
    expect(within(rail).getByRole("img", { name: /^Pick 13, slot 12, Filled 13, / })).toBeInTheDocument();
    expect(within(rail).getByRole("img", { name: /^Pick 24, slot 1, yours, Filled 24, / })).toBeInTheDocument();
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
