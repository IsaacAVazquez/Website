import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { analyzePoolFixtures } from "@/lib/scorePools/poolAnalysis";
import { ScorePoolsClient } from "../score-pools-client";
import { formatPoints, formatScoreline } from "../score-pools-ui";
import {
  DAY,
  fixture,
  isoFromNow,
  league,
  pool,
  readStore,
  resetStore,
  seedStore,
  snapshot,
} from "./fixtures/scorePoolsTestData";

const upcomingA = fixture({ id: "fx-a", homeTeam: "Harbor City", awayTeam: "Ironvale", kickoff: isoFromNow(2 * DAY) });
const upcomingB = fixture({
  id: "fx-b",
  homeTeam: "Northgate",
  awayTeam: "Saltmarsh",
  kickoff: isoFromNow(3 * DAY),
  odds: [
    {
      fetchedAt: isoFromNow(-60 * 60 * 1000),
      bookmaker: "pinnacle",
      manual: false,
      moneyline: { home: 1.5, draw: 4.2, away: 6.5 },
      totals: { line: 2.75, over: 1.9, under: 1.95 },
    },
  ],
});
const noOdds = fixture({ id: "fx-c", homeTeam: "Eastport", awayTeam: "Westbrook", kickoff: isoFromNow(4 * DAY), odds: [] });
const playedRound = [
  fixture({
    id: "fx-p1",
    stage: "Opening round",
    homeTeam: "Ashford",
    awayTeam: "Brookline",
    kickoff: isoFromNow(-6 * DAY),
    status: "finished",
    knockout: true,
    result: { ninetyMinutes: { home: 1, away: 1 }, afterExtraTime: { home: 2, away: 2 }, penaltyWinner: "home" },
  }),
  fixture({
    id: "fx-p2",
    stage: "Opening round",
    homeTeam: "Cliffside",
    awayTeam: "Dunmore",
    kickoff: isoFromNow(-5 * DAY),
    status: "finished",
    result: null,
  }),
];

function liveSnapshot(fixtures = [upcomingA, upcomingB, noOdds, ...playedRound]) {
  return snapshot([league({ fixtures })]);
}

function renderClient(snap = liveSnapshot(), initialFixtureId: string | null = null) {
  return render(<ScorePoolsClient snapshot={snap} initialFixtureId={initialFixtureId} />);
}

const clipboardWrite = jest.fn<Promise<void>, [string]>();

// user-event installs its own clipboard stub on setup, so ours goes on after it.
function setupWithClipboard() {
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: clipboardWrite },
  });
  return user;
}

beforeEach(() => {
  resetStore();
  clipboardWrite.mockReset();
  window.history.replaceState(null, "", "/score-pools");
});

afterEach(() => {
  resetStore();
});

describe("ScorePoolsClient pool setup", () => {
  it("creates the first pool from the chosen league and name", async () => {
    const user = userEvent.setup();
    renderClient();
    expect(screen.getByRole("heading", { name: "Set up your first pool" })).toBeInTheDocument();
    expect(screen.getByLabelText("League")).toHaveValue("test-league");
    await user.type(screen.getByLabelText("Pool name"), "  Work pool  ");
    await user.click(screen.getByRole("button", { name: "Create pool" }));

    const store = readStore();
    expect(store.pools).toHaveLength(1);
    expect(store.pools[0]).toMatchObject({ name: "Work pool", leagueKey: "test-league" });
    expect(store.activePoolId).toBe(store.pools[0].id);
    expect(screen.getByRole("button", { name: "Work pool", pressed: true })).toBeInTheDocument();
    // The pool's scoring reads in plain words beside the pick sheet, and the market terms stay in a match's detail.
    expect(screen.getByText(/Work pool scores 5 points for the exact score, 3 for the right winner and goal difference, and 2 for the right winner or draw only, counted on the 90-minute result\./)).toBeInTheDocument();
    expect(screen.queryByText(/de-vig|moneyline/i)).not.toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Recommended picks for the current round" })).toBeInTheDocument();
  });

  it("names an unnamed pool My pool", async () => {
    const user = userEvent.setup();
    renderClient();
    await user.click(screen.getByRole("button", { name: "Create pool" }));
    expect(readStore().pools[0].name).toBe("My pool");
  });
});

describe("ScorePoolsClient pick sheet", () => {
  it("shows each priced game with the engine's pick, expected points, and alternatives", () => {
    const p = pool();
    seedStore([p]);
    renderClient();
    const table = screen.getByRole("table", { name: "Recommended picks for the current round" });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);

    const expected = analyzePoolFixtures([upcomingA, upcomingB], league({ fixtures: [upcomingA, upcomingB] }), p, new Date().toISOString());
    expected.analyzed.forEach((item, index) => {
      const rec = item.analysis.recommendation;
      const cells = within(rows[index]).getAllByRole("cell");
      expect(cells[0]).toHaveTextContent(`${item.fixture.homeTeam} vs ${item.fixture.awayTeam}`);
      expect(cells[1]).toHaveTextContent(formatScoreline(rec.recommended.score));
      expect(cells[1]).not.toHaveTextContent("mine");
      expect(cells[2]).toHaveTextContent(formatPoints(rec.recommended.expectedPoints));
      expect(cells[4]).toHaveTextContent(`${formatScoreline(rec.safest.score)} ${formatPoints(rec.safest.expectedPoints)}`);
      expect(cells[6]).toHaveTextContent(rec.reason);
    });
  });

  it("marks my own pick as mine on the sheet and the submission table", () => {
    seedStore([pool({ submissions: { "fx-a": { score: { home: 4, away: 0 }, submittedAt: isoFromNow(-DAY) } } })]);
    renderClient();
    const sheetRow = within(screen.getByRole("table", { name: "Recommended picks for the current round" }))
      .getByText("Harbor City vs Ironvale")
      .closest("tr") as HTMLElement;
    expect(within(sheetRow).getByText("4-0")).toBeInTheDocument();
    expect(within(sheetRow).getByTitle("You set this pick yourself")).toHaveTextContent("mine");

    const submission = screen.getByRole("table", { name: "Copyable submission: match and score" });
    const subRows = within(submission).getAllByRole("row").slice(1);
    expect(subRows[0]).toHaveTextContent("Harbor City vs Ironvalemine");
    expect(subRows[0]).toHaveTextContent("4-0");
    expect(subRows[1]).not.toHaveTextContent("mine");
  });

  it("copies the submission as tab-separated rows", async () => {
    const user = setupWithClipboard();
    clipboardWrite.mockResolvedValue(undefined);
    seedStore([pool({ submissions: { "fx-a": { score: { home: 2, away: 2 }, submittedAt: "" } } })]);
    renderClient();
    const subRows = within(screen.getByRole("table", { name: "Copyable submission: match and score" }))
      .getAllByRole("row")
      .slice(1);
    const secondScore = within(subRows[1]).getAllByRole("cell")[1].textContent;

    await user.click(screen.getByRole("button", { name: "Copy submission" }));
    expect(clipboardWrite).toHaveBeenCalledWith(`Harbor City vs Ironvale\t2-2\nNorthgate vs Saltmarsh\t${secondScore}`);
    expect(screen.getByRole("status")).toHaveTextContent("Copied to the clipboard.");
  });

  it("says so when the clipboard is blocked", async () => {
    const user = setupWithClipboard();
    clipboardWrite.mockRejectedValue(new Error("denied"));
    seedStore([pool()]);
    renderClient();
    await user.click(screen.getByRole("button", { name: "Copy submission" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Clipboard blocked; select the table and copy it directly.",
    );
  });

  it("saves the whole sheet as my picks", async () => {
    const user = userEvent.setup();
    seedStore([pool({ submissions: { "fx-a": { score: { home: 0, away: 0 }, submittedAt: "" } } })]);
    renderClient();
    await user.click(screen.getByRole("button", { name: "Save these as my picks" }));
    expect(screen.getByRole("status")).toHaveTextContent("Saved. The tracker scores these as results come in.");
    const submissions = readStore().pools[0].submissions;
    expect(Object.keys(submissions).sort()).toEqual(["fx-a", "fx-b"]);
    expect(submissions["fx-a"].score).toEqual({ home: 0, away: 0 });
    expect(submissions["fx-b"].submittedAt).not.toBe("");
  });

  it("flags a game past its lock time", () => {
    const soon = fixture({ id: "fx-soon", kickoff: isoFromNow(20 * 60 * 1000) });
    seedStore([pool()]);
    renderClient(liveSnapshot([soon]));
    const row = within(screen.getByRole("table", { name: "Recommended picks for the current round" })).getAllByRole("row")[1];
    expect(within(row).getByText("Locked")).toBeInTheDocument();
  });

  it("lists games without odds and lets me price one by hand", async () => {
    const user = userEvent.setup();
    seedStore([pool()]);
    renderClient();
    const waiting = screen.getByRole("region", { name: "Games without odds" });
    expect(within(waiting).getByText("Eastport vs Westbrook")).toBeInTheDocument();
    expect(within(waiting).getByText(/no odds yet/)).toBeInTheDocument();

    await user.click(within(waiting).getByRole("button", { name: "Enter odds" }));
    const dialog = screen.getByRole("dialog", { name: "Eastport vs Westbrook detail" });
    expect(within(dialog).getByText(/No odds yet for this game\./)).toBeInTheDocument();
    await user.type(within(dialog).getByRole("textbox", { name: "Home" }), "2.5");
    await user.type(within(dialog).getByRole("textbox", { name: "Draw" }), "3.2");
    await user.type(within(dialog).getByRole("textbox", { name: "Away" }), "2.9");
    await user.click(within(dialog).getByRole("button", { name: "Save odds" }));

    expect(readStore().pools[0].manualOdds["fx-c"]).toMatchObject({ home: 2.5, draw: 3.2, away: 2.9 });
    expect(screen.queryByRole("region", { name: "Games without odds" })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("table", { name: "Recommended picks for the current round" })).getByText("Eastport vs Westbrook"),
    ).toBeInTheDocument();
  });
});

describe("ScorePoolsClient detail drawer", () => {
  it("opens from a row, writes the fixture to the URL, and closes on Escape", async () => {
    const user = userEvent.setup();
    seedStore([pool()]);
    renderClient();
    const detail = screen.getAllByRole("button", { name: "Detail" })[0];
    await user.click(detail);
    expect(screen.getByRole("dialog", { name: "Harbor City vs Ironvale detail" })).toBeInTheDocument();
    expect(new URL(window.location.href).searchParams.get("fixture")).toBe("fx-a");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(new URL(window.location.href).searchParams.has("fixture")).toBe(false);
    expect(detail).toHaveFocus();
  });

  it("opens on load for a deep-linked fixture", () => {
    seedStore([pool()]);
    renderClient(liveSnapshot(), "fx-b");
    expect(screen.getByRole("dialog", { name: "Northgate vs Saltmarsh detail" })).toBeInTheDocument();
  });

  it("stores a pick set in the drawer and shows it on the sheet", async () => {
    const user = userEvent.setup();
    seedStore([pool()]);
    renderClient(liveSnapshot(), "fx-a");
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Home goals"), "3");
    await user.type(within(dialog).getByLabelText("Away goals"), "2");
    await user.click(within(dialog).getByRole("button", { name: "Set" }));

    expect(readStore().pools[0].submissions["fx-a"].score).toEqual({ home: 3, away: 2 });
    expect(within(within(dialog).getByRole("region", { name: "My pick" })).getByText("3-2")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Clear" }));
    expect(readStore().pools[0].submissions["fx-a"]).toBeUndefined();
  });

  it("stores a context flag from the drawer", async () => {
    const user = userEvent.setup();
    seedStore([pool()]);
    renderClient(liveSnapshot(), "fx-a");
    await user.click(screen.getByRole("checkbox", { name: /Draw suits both/ }));
    expect(readStore().pools[0].flags["fx-a"]).toEqual({ drawSuitsBoth: true });
  });
});

describe("ScorePoolsClient rounds and pools", () => {
  it("opens on the first round with open games and switches rounds", async () => {
    const user = userEvent.setup();
    seedStore([pool({ submissions: { "fx-p1": { score: { home: 2, away: 1 }, submittedAt: "" } } })]);
    renderClient();
    expect(screen.getByRole("button", { name: "Matchday 1", pressed: true })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Played games" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Opening round" }));
    expect(screen.getByRole("button", { name: "Opening round", pressed: true })).toBeInTheDocument();
    expect(screen.getByText(/Nothing left to pick in this round\./)).toBeInTheDocument();

    const played = screen.getByRole("region", { name: "Played games" });
    const ashford = within(played).getByText("Ashford vs Brookline").closest("li") as HTMLElement;
    expect(within(ashford).getByText("1-1 (aet 2-2) · pens: Ashford")).toBeInTheDocument();
    expect(within(ashford).getByText(/my pick 2-1 · scored in the/)).toBeInTheDocument();
    const cliffside = within(played).getByText("Cliffside vs Dunmore").closest("li") as HTMLElement;
    expect(within(cliffside).getByText("result pending")).toBeInTheDocument();
    expect(within(cliffside).getByText("no pick recorded")).toBeInTheDocument();
  });

  it("switches the active pool", async () => {
    const user = userEvent.setup();
    seedStore([pool(), pool({ id: "pool-2", name: "Family pool" })]);
    renderClient();
    expect(screen.getByRole("button", { name: "Office pool", pressed: true })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Family pool" }));
    expect(screen.getByRole("button", { name: "Family pool", pressed: true })).toBeInTheDocument();
    expect(readStore().activePoolId).toBe("pool-2");
  });

  it("explains a pool whose league left the snapshot", () => {
    seedStore([pool({ leagueKey: "gone-league" })]);
    renderClient();
    expect(screen.getByText(/This pool points at a league that isn.t in the snapshot anymore\./)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Pick sheet" })).not.toBeInTheDocument();
  });

  it("labels a sample league and points to a live one when there is one", () => {
    const sample = league({ key: "sample-cup", name: "Sample Cup", sample: true, fixtures: [fixture({ id: "s-1", odds: [{ ...fixture().odds[0], manual: true, bookmaker: null }] })] });
    seedStore([pool({ leagueKey: "sample-cup" })]);
    renderClient(snapshot([league(), sample]));
    expect(
      screen.getByText(/This league is sample data with fictional teams and hand-set odds.*Swap in a live league from the settings page/),
    ).toBeInTheDocument();
  });

  it("prints a live league's notes", () => {
    seedStore([pool()]);
    renderClient(snapshot([league({ notes: ["Odds refresh every six hours."] })]));
    expect(screen.getByText("Odds refresh every six hours.")).toBeInTheDocument();
  });
});
