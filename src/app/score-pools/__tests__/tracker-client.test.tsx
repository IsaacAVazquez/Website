import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SnapshotFixture } from "@/types/scorePools";
import { TrackerClient } from "../tracker/tracker-client";
import {
  DAY,
  HOUR,
  fixture,
  isoFromNow,
  league,
  pool,
  readStore,
  resetStore,
  seedStore,
  snapshot,
} from "./fixtures/scorePoolsTestData";

function finished(id: string, daysAgo: number, home: number, away: number, teams: [string, string]): SnapshotFixture {
  return fixture({
    id,
    homeTeam: teams[0],
    awayTeam: teams[1],
    kickoff: isoFromNow(-daysAgo * DAY),
    status: "finished",
    result: { ninetyMinutes: { home, away }, afterExtraTime: null, penaltyWinner: null },
  });
}

const FIXTURES: SnapshotFixture[] = [
  finished("f1", 9, 2, 1, ["Ashford", "Brookline"]),
  finished("f2", 8, 3, 1, ["Cliffside", "Dunmore"]),
  finished("f3", 7, 1, 0, ["Eastport", "Fairhaven"]),
  finished("f4", 6, 0, 0, ["Glenrock", "Highmoor"]),
  fixture({ id: "f5", homeTeam: "Ivybridge", awayTeam: "Juniper", kickoff: isoFromNow(2 * DAY) }),
  fixture({ id: "f6", homeTeam: "Kingsway", awayTeam: "Lakeview", kickoff: isoFromNow(-3 * HOUR) }),
  fixture({ id: "f7", homeTeam: "Millbrook", awayTeam: "Northgate", kickoff: isoFromNow(-4 * HOUR), knockout: true }),
];

const sub = (home: number, away: number) => ({ score: { home, away }, submittedAt: "" });

const MY_SUBMISSIONS = {
  f1: sub(2, 1), // exact: 5
  f2: sub(2, 0), // winner and difference: 3
  f3: sub(3, 0), // outcome only: 2
  f4: sub(1, 0), // no points
  f5: sub(1, 1), // not played yet
  f6: sub(2, 2), // kicked off, no result
  f7: sub(1, 1), // knockout, kicked off, no result
};

function renderTracker() {
  return render(<TrackerClient snapshot={snapshot([league({ fixtures: FIXTURES })])} />);
}

function rowFor(table: HTMLElement, match: string): HTMLElement {
  return within(table).getByText(match).closest("tr") as HTMLElement;
}

beforeEach(resetStore);
afterEach(resetStore);

describe("TrackerClient", () => {
  it("asks for a pool when there is none", () => {
    renderTracker();
    expect(screen.getByText(/No pool yet\. Create one on the/)).toBeInTheDocument();
  });

  it("asks for picks when the pool has none", () => {
    seedStore([pool()]);
    renderTracker();
    expect(screen.getByText(/No saved picks yet\./)).toBeInTheDocument();
    expect(screen.getByText(/Add rivals on the/)).toBeInTheDocument();
  });

  it("scores each saved pick under the pool's rules with a running total", () => {
    seedStore([pool({ submissions: MY_SUBMISSIONS })]);
    renderTracker();
    const table = screen.getByRole("table", { name: "My picks scored against results" });

    const expectRow = (match: string, pick: string, result: string, how: string, pts: string, running: string) => {
      const cells = within(rowFor(table, match)).getAllByRole("cell");
      expect(cells[1]).toHaveTextContent(pick);
      expect(cells[2]).toHaveTextContent(result);
      expect(cells[3]).toHaveTextContent(how);
      expect(cells[4]).toHaveTextContent(pts);
      expect(cells[5].textContent).toBe(running);
    };
    expectRow("Ashford vs Brookline", "2-1", "2-1", "exact score", "5", "5");
    expectRow("Cliffside vs Dunmore", "2-0", "3-1", "winner and difference", "3", "8");
    expectRow("Eastport vs Fairhaven", "3-0", "1-0", "outcome only", "2", "10");
    expectRow("Glenrock vs Highmoor", "1-0", "0-0", "no points", "0", "10");
    expectRow("Ivybridge vs Juniper", "1-1", "pending", "—", "—", "");

    const totals = screen.getByRole("region", { name: "Totals" });
    expect(within(totals).getByText("Tracked points").nextElementSibling).toHaveTextContent("10");
    expect(within(totals).getByText("computed here from 4 scored picks")).toBeInTheDocument();
    expect(within(totals).getByText("5/3/2")).toBeInTheDocument();
    expect(within(totals).getByText(/scored on the 90-minute result/)).toBeInTheDocument();
  });

  it("names the final-result basis and the custom rules", () => {
    seedStore([
      pool({ rules: { exact: 10, correctDifference: 4, correctOutcome: 1, basis: "finalResult", penaltiesCountAsWin: true } }),
    ]);
    renderTracker();
    expect(screen.getByText("10/4/1")).toBeInTheDocument();
    expect(screen.getByText(/scored on the final result/)).toBeInTheDocument();
  });

  it("validates and saves a hand-entered result, then lets me clear it", async () => {
    const user = userEvent.setup();
    seedStore([pool({ submissions: MY_SUBMISSIONS })]);
    renderTracker();
    const missing = screen.getByRole("region", { name: "Missing results" });
    const kingsway = within(missing).getByText("Kingsway vs Lakeview").closest("li") as HTMLElement;
    // A plain league game has no extra-time inputs.
    expect(within(kingsway).queryByLabelText("After extra time home goals")).not.toBeInTheDocument();

    await user.click(within(kingsway).getByRole("button", { name: "Save result" }));
    expect(within(kingsway).getByRole("alert")).toHaveTextContent("The 90-minute score needs two whole numbers from 0 to 15.");

    await user.type(within(kingsway).getByLabelText("Ninety minute home goals"), "2");
    await user.type(within(kingsway).getByLabelText("Ninety minute away goals"), "2");
    await user.click(within(kingsway).getByRole("button", { name: "Save result" }));

    expect(readStore().pools[0].manualResults.f6).toEqual({
      ninetyMinutes: { home: 2, away: 2 },
      afterExtraTime: null,
      penaltyWinner: null,
    });
    const table = screen.getByRole("table", { name: "My picks scored against results" });
    const row = rowFor(table, "Kingsway vs Lakeview");
    expect(within(row).getByText("manual")).toBeInTheDocument();
    expect(within(row).getAllByRole("cell")[4]).toHaveTextContent("5");
    expect(within(screen.getByRole("region", { name: "Missing results" })).queryByText("Kingsway vs Lakeview")).not.toBeInTheDocument();

    await user.click(within(row).getByRole("button", { name: "Clear" }));
    expect(readStore().pools[0].manualResults.f6).toBeUndefined();
    expect(within(screen.getByRole("region", { name: "Missing results" })).getByText("Kingsway vs Lakeview")).toBeInTheDocument();
  });

  it("takes extra time and the shootout winner for a knockout", async () => {
    const user = userEvent.setup();
    seedStore([pool({ submissions: MY_SUBMISSIONS })]);
    renderTracker();
    const missing = screen.getByRole("region", { name: "Missing results" });
    const knockout = within(missing).getByText("Millbrook vs Northgate").closest("li") as HTMLElement;

    await user.type(within(knockout).getByLabelText("Ninety minute home goals"), "1");
    await user.type(within(knockout).getByLabelText("Ninety minute away goals"), "1");
    await user.type(within(knockout).getByLabelText("After extra time home goals"), "1");
    await user.click(within(knockout).getByRole("button", { name: "Save result" }));
    expect(within(knockout).getByRole("alert")).toHaveTextContent(
      "The extra-time score needs two whole numbers, or leave both empty.",
    );
    expect(readStore().pools[0].manualResults.f7).toBeUndefined();

    await user.type(within(knockout).getByLabelText("After extra time away goals"), "1");
    await user.selectOptions(within(knockout).getByRole("combobox"), "Northgate");
    await user.click(within(knockout).getByRole("button", { name: "Save result" }));
    expect(readStore().pools[0].manualResults.f7).toEqual({
      ninetyMinutes: { home: 1, away: 1 },
      afterExtraTime: { home: 1, away: 1 },
      penaltyWinner: "away",
    });
    const row = rowFor(screen.getByRole("table", { name: "My picks scored against results" }), "Millbrook vs Northgate");
    expect(within(row).getAllByRole("cell")[2]).toHaveTextContent("1-1 (aet 1-1) p");
  });

  it("compares rivals to my total including banked points", () => {
    seedStore([
      pool({
        submissions: MY_SUBMISSIONS,
        standing: { myPoints: 2, nearestAbovePoints: null, nearestBelowPoints: null, poolSize: 10, gamesRemaining: 5, posture: "auto" },
        rivals: [
          { id: "r1", name: "Dana", pointsAdjustment: 3, picks: { f1: { home: 2, away: 1 } } },
          { id: "r2", name: "Eli", pointsAdjustment: 14, picks: {} },
          { id: "r3", name: "Fern", pointsAdjustment: 12, picks: {} },
        ],
      }),
    ]);
    renderTracker();
    // Mine: 10 tracked + 2 banked = 12.
    const table = screen.getByRole("table", { name: "Rival totals" });
    const cells = (name: string) => within(rowFor(table, name)).getAllByRole("cell").map((cell) => cell.textContent);
    expect(cells("Dana")).toEqual(["Dana", "5", "3", "8", "4 behind"]);
    expect(cells("Eli")).toEqual(["Eli", "0", "14", "14", "+2 on me"]);
    expect(cells("Fern")).toEqual(["Fern", "0", "12", "12", "level"]);
    expect(within(screen.getByRole("region", { name: "Totals" })).getByText("Entered standing").nextElementSibling).toHaveTextContent("2");
  });

  it("enters, validates, and clears a rival's picks", async () => {
    const user = userEvent.setup();
    seedStore([
      pool({ rivals: [{ id: "r1", name: "Dana", pointsAdjustment: 0, picks: { f1: { home: 0, away: 0 } } }] }),
    ]);
    renderTracker();
    const toggle = screen.getByRole("button", { name: "Dana", pressed: false });
    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Dana", pressed: true })).toBeInTheDocument();

    const ashford = screen.getByText("saved 0-0").closest("li") as HTMLElement;
    expect(within(ashford).getByText("Ashford vs Brookline")).toBeInTheDocument();
    const cliffside = screen.getByText("Cliffside vs Dunmore", { selector: "span" }).closest("li") as HTMLElement;
    expect(within(cliffside).getByText("no pick saved")).toBeInTheDocument();

    await user.type(within(cliffside).getByLabelText("Dana pick, Cliffside goals"), "3");
    await user.click(within(cliffside).getByRole("button", { name: "Save" }));
    expect(within(cliffside).getByRole("alert")).toHaveTextContent("Both scores need whole numbers from 0 to 15.");

    await user.type(within(cliffside).getByLabelText("Dana pick, Dunmore goals"), "1");
    await user.click(within(cliffside).getByRole("button", { name: "Save" }));
    expect(readStore().pools[0].rivals[0].picks.f2).toEqual({ home: 3, away: 1 });
    expect(within(cliffside).queryByRole("alert")).not.toBeInTheDocument();
    expect(within(cliffside).getByText("saved 3-1")).toBeInTheDocument();
    expect(within(cliffside).getByLabelText("Dana pick, Cliffside goals")).toHaveValue(3);
    // 3-1 against a 3-1 result is exact.
    expect(within(rowFor(screen.getByRole("table", { name: "Rival totals" }), "Dana")).getAllByRole("cell")[1]).toHaveTextContent("5");

    await user.click(within(ashford).getByRole("button", { name: "Clear" }));
    expect(readStore().pools[0].rivals[0].picks.f1).toBeUndefined();
    expect(within(ashford).getByRole("button", { name: "Save" })).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Cleared Dana's pick for Ashford vs Brookline.");

    await user.click(screen.getByRole("button", { name: "Dana", pressed: true }));
    expect(screen.queryByText("saved 3-1")).not.toBeInTheDocument();
  });

  it("rejects decimal scores instead of silently truncating them", async () => {
    const user = userEvent.setup();
    seedStore([pool({ submissions: MY_SUBMISSIONS, rivals: [{ id: "r1", name: "Dana", pointsAdjustment: 0, picks: {} }] })]);
    renderTracker();
    const kingsway = within(screen.getByRole("region", { name: "Missing results" })).getByText("Kingsway vs Lakeview").closest("li") as HTMLElement;
    await user.type(within(kingsway).getByLabelText("Ninety minute home goals"), "1.5");
    await user.type(within(kingsway).getByLabelText("Ninety minute away goals"), "2{Enter}");
    expect(within(kingsway).getByRole("alert")).toHaveTextContent("whole numbers from 0 to 15");
    expect(readStore().pools[0].manualResults.f6).toBeUndefined();

    await user.click(screen.getByRole("button", { name: "Dana" }));
    const home = screen.getByLabelText("Dana pick, Ashford goals");
    await user.type(home, "1.5");
    await user.type(screen.getByLabelText("Dana pick, Brookline goals"), "2{Enter}");
    expect(home).toHaveAttribute("aria-invalid", "true");
    expect(within(home.closest("li") as HTMLElement).getByRole("alert")).toHaveTextContent("whole numbers from 0 to 15");
    expect(readStore().pools[0].rivals[0].picks.f1).toBeUndefined();
  });

  it("prefills saved picks for editing and submits an edited score with Enter", async () => {
    const user = userEvent.setup();
    seedStore([pool({ rivals: [{ id: "r1", name: "Dana", pointsAdjustment: 0, picks: { f1: { home: 2, away: 1 } } }] })]);
    renderTracker();
    await user.click(screen.getByRole("button", { name: "Dana" }));
    const home = screen.getByLabelText("Dana pick, Ashford goals");
    expect(home).toHaveValue(2);
    expect(screen.getByLabelText("Dana pick, Brookline goals")).toHaveValue(1);
    await user.clear(home);
    await user.type(home, "3{Enter}");
    expect(readStore().pools[0].rivals[0].picks.f1).toEqual({ home: 3, away: 1 });
    expect(screen.getByRole("status")).toHaveTextContent("Saved Dana's 3-1 pick for Ashford vs Brookline.");
  });

  it("keeps drafts and validation scoped to each rival and pool", async () => {
    const user = userEvent.setup();
    const rivals = [{ id: "r1", name: "Dana", pointsAdjustment: 0, picks: {} }, { id: "r2", name: "Eli", pointsAdjustment: 0, picks: {} }];
    seedStore([pool({ rivals }), pool({ id: "pool-2", name: "Family pool", rivals })]);
    renderTracker();
    await user.click(screen.getByRole("button", { name: "Dana" }));
    await user.type(screen.getByLabelText("Dana pick, Ashford goals"), "3");
    await user.type(screen.getByLabelText("Dana pick, Brookline goals"), "1");
    await user.click(screen.getByRole("button", { name: "Eli" }));
    expect(screen.getByLabelText("Eli pick, Ashford goals")).toHaveValue(null);
    await user.click(within(screen.getByLabelText("Eli pick, Ashford goals").closest("li") as HTMLElement).getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: "Dana" }));
    expect(screen.getByLabelText("Dana pick, Ashford goals")).toHaveValue(3);
    expect(screen.getByLabelText("Dana pick, Brookline goals")).toHaveValue(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Family pool" }));
    expect(screen.getByLabelText("Dana pick, Ashford goals")).toHaveValue(null);
    await user.click(screen.getByRole("button", { name: "Office pool" }));
    expect(screen.getByLabelText("Dana pick, Ashford goals")).toHaveValue(3);
  });

  it("does not move a manual result draft into another pool", async () => {
    const user = userEvent.setup();
    seedStore([pool({ submissions: MY_SUBMISSIONS }), pool({ id: "pool-2", name: "Family pool", submissions: MY_SUBMISSIONS })]);
    renderTracker();
    const resultForm = () => screen.getByRole("form", { name: "Result for Kingsway vs Lakeview" });
    await user.type(within(resultForm()).getByLabelText("Ninety minute home goals"), "3");
    await user.click(screen.getByRole("button", { name: "Family pool" }));
    expect(within(resultForm()).getByLabelText("Ninety minute home goals")).toHaveValue(null);
    expect(readStore().pools[1].manualResults.f6).toBeUndefined();
  });

  it("switches pools when there is more than one", async () => {
    const user = userEvent.setup();
    seedStore([pool({ submissions: MY_SUBMISSIONS }), pool({ id: "pool-2", name: "Family pool" })]);
    renderTracker();
    const nav = screen.getByRole("navigation", { name: "Pools" });
    await user.click(within(nav).getByRole("button", { name: "Family pool" }));
    expect(readStore().activePoolId).toBe("pool-2");
    expect(screen.getByText(/No saved picks yet\./)).toBeInTheDocument();
  });
});
