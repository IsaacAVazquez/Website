import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsClient } from "../settings/settings-client";
import {
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

const SNAPSHOT = snapshot([
  league(),
  league({ key: "empty-league", name: "Empty League", fixtures: [] }),
  league({
    key: "sample-cup",
    name: "Sample Cup",
    sample: true,
    generatedAt: isoFromNow(-5 * HOUR),
    sources: { fixtures: "manual entry", odds: "manual entry" },
    fixtures: [fixture({ id: "s-1" }), fixture({ id: "s-2" })],
  }),
]);

function renderSettings() {
  return render(<SettingsClient snapshot={SNAPSHOT} />);
}

const stored = () => readStore().pools[0];

beforeEach(resetStore);
afterEach(resetStore);

describe("SettingsClient pools", () => {
  it("prompts for a pool when none exists and adds one", async () => {
    const user = userEvent.setup();
    renderSettings();
    expect(screen.getByText(/No pool selected\./)).toBeInTheDocument();

    const pools = screen.getByRole("region", { name: "Pools" });
    await user.selectOptions(within(pools).getByLabelText("League"), "sample-cup");
    await user.type(within(pools).getByLabelText("Name"), "  Cup pool ");
    await user.click(within(pools).getByRole("button", { name: "Add pool" }));

    expect(stored()).toMatchObject({ name: "Cup pool", leagueKey: "sample-cup" });
    expect(within(pools).getByRole("button", { name: "Cup pool", pressed: true })).toBeInTheDocument();
    expect(within(pools).getByLabelText("Name")).toHaveValue("");
    expect(screen.getByRole("heading", { name: "Cup pool" })).toBeInTheDocument();
  });

  it("switches the active pool", async () => {
    const user = userEvent.setup();
    seedStore([pool(), pool({ id: "pool-2", name: "Family pool" })]);
    renderSettings();
    await user.click(screen.getByRole("button", { name: "Family pool" }));
    expect(readStore().activePoolId).toBe("pool-2");
    expect(screen.getByRole("heading", { name: "Family pool" })).toBeInTheDocument();
  });

  it("creates pools and rivals with Enter and reports the result", async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.type(within(screen.getByRole("region", { name: "Pools" })).getByLabelText("Name"), "Keyboard pool{Enter}");
    expect(stored().name).toBe("Keyboard pool");
    expect(screen.getByRole("status")).toHaveTextContent("Added Keyboard pool.");
    const input = screen.getByLabelText("New rival");
    await user.type(input, "  {Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a name for the rival.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    await user.clear(input);
    await user.type(input, "Dana{Enter}");
    expect(stored().rivals[0].name).toBe("Dana");
    expect(screen.getByRole("status")).toHaveTextContent("Added Dana to Keyboard pool.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("asks before deleting a pool and can back out", async () => {
    const user = userEvent.setup();
    seedStore([pool(), pool({ id: "pool-2", name: "Family pool" })]);
    renderSettings();
    const danger = screen.getByRole("region", { name: "Delete pool" });

    await user.click(within(danger).getByRole("button", { name: "Delete pool…" }));
    await user.click(within(danger).getByRole("button", { name: "Keep it" }));
    expect(readStore().pools).toHaveLength(2);

    await user.click(within(danger).getByRole("button", { name: "Delete pool…" }));
    // Switching pools drops a pending confirmation.
    await user.click(screen.getByRole("button", { name: "Family pool" }));
    expect(within(screen.getByRole("region", { name: "Delete pool" })).getByRole("button", { name: "Delete pool…" })).toBeInTheDocument();

    await user.click(within(screen.getByRole("region", { name: "Delete pool" })).getByRole("button", { name: "Delete pool…" }));
    await user.click(screen.getByRole("button", { name: "Yes, delete Family pool" }));
    const after = readStore();
    expect(after.pools.map((entry) => entry.id)).toEqual(["pool-1"]);
    expect(after.activePoolId).toBe("pool-1");
    expect(screen.getByRole("heading", { name: "Office pool" })).toBeInTheDocument();
  });
});

describe("SettingsClient pool settings", () => {
  beforeEach(() => seedStore([pool()]));

  it("persists the basics: name, league, timezone, lock offset", async () => {
    const user = userEvent.setup();
    renderSettings();
    const basics = screen.getByRole("region", { name: "Pool basics" });

    await user.type(within(basics).getByLabelText("Pool name"), "!");
    expect(stored().name).toBe("Office pool!");

    expect(within(basics).getByRole("option", { name: "Empty League · no fixtures yet" })).toBeDisabled();
    await user.selectOptions(within(basics).getByLabelText("League"), "sample-cup");
    expect(stored().leagueKey).toBe("sample-cup");

    const zone = within(basics).getByLabelText(/^Timezone/);
    expect(zone).toHaveValue("browser");
    await user.selectOptions(zone, "Europe/London");
    expect(stored().timezone).toBe("Europe/London");
    await user.selectOptions(zone, "browser");
    expect(stored().timezone).toBeNull();

    const lock = within(basics).getByLabelText("Lock offset (minutes before kickoff)");
    fireEvent.change(lock, { target: { value: "90" } });
    expect(stored().lockOffsetMinutes).toBe(90);
    fireEvent.change(lock, { target: { value: "5000" } });
    expect(stored().lockOffsetMinutes).toBe(90);
    fireEvent.blur(lock);
    expect(stored().lockOffsetMinutes).toBe(1440);
    expect(lock).toHaveValue(1440);
  });

  it("puts scoring before the risk settings, which sit in a closed advanced section", async () => {
    const user = userEvent.setup();
    renderSettings();
    const rules = screen.getByRole("region", { name: "Scoring rules" });
    const advanced = screen.getByText("Hide advanced settings").closest("details") as HTMLDetailsElement;
    expect(advanced.open).toBe(false);
    expect(rules.compareDocumentPosition(advanced) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The pool identity and rivals stay outside it.
    expect(advanced).not.toContainElement(screen.getByRole("region", { name: "Pool basics" }));
    expect(advanced).not.toContainElement(screen.getByRole("region", { name: "Rivals" }));
    for (const name of ["Standing and risk", "Rest of the pool", "Odds conversion"]) {
      expect(advanced).toContainElement(screen.getByRole("region", { name }));
    }

    await user.selectOptions(within(advanced).getByLabelText(/^Bookmaker margin removal/), "power");
    expect(stored().devigMethod).toBe("power");
  });

  it("persists the scoring rules, clamped to 0 to 100", async () => {
    const user = userEvent.setup();
    renderSettings();
    const rules = screen.getByRole("region", { name: "Scoring rules" });

    fireEvent.change(within(rules).getByLabelText("Exact score points"), { target: { value: "8" } });
    // An out-of-range value adds its hint to the label, so hold the elements.
    const difference = within(rules).getByLabelText("Winner and goal difference");
    fireEvent.change(difference, { target: { value: "250" } });
    fireEvent.blur(difference);
    const outcome = within(rules).getByLabelText("Correct outcome only");
    fireEvent.change(outcome, { target: { value: "" } });
    fireEvent.blur(outcome);
    await user.selectOptions(within(rules).getByLabelText("Scoring basis"), "finalResult");
    await user.click(within(rules).getByRole("checkbox", { name: "Shootout winner counts as the winner" }));

    expect(stored().rules).toEqual({
      exact: 8,
      correctDifference: 100,
      correctOutcome: 0,
      basis: "finalResult",
      penaltiesCountAsWin: true,
    });
  });

  it("persists the standing, with empty gaps meaning none", async () => {
    const user = userEvent.setup();
    renderSettings();
    const standing = screen.getByRole("region", { name: "Standing and risk" });

    fireEvent.change(within(standing).getByLabelText("My points"), { target: { value: "41" } });
    const above = within(standing).getByLabelText(/^Nearest above \(points\)/);
    fireEvent.change(above, { target: { value: "44" } });
    expect(stored().standing.nearestAbovePoints).toBe(44);
    fireEvent.change(above, { target: { value: "" } });
    fireEvent.change(within(standing).getByLabelText(/^Nearest below \(points\)/), { target: { value: "39" } });
    fireEvent.change(within(standing).getByLabelText("Pool size"), { target: { value: "12.4" } });
    const games = within(standing).getByLabelText("Games remaining");
    fireEvent.change(games, { target: { value: "-3" } });
    fireEvent.blur(games);
    await user.selectOptions(within(standing).getByLabelText("Risk approach"), "chase");

    expect(stored().standing).toEqual({
      myPoints: 41,
      nearestAbovePoints: null,
      nearestBelowPoints: 39,
      poolSize: 12,
      gamesRemaining: 0,
      posture: "chase",
    });
    expect(above).toHaveValue(null);

    // A cleared field without an empty meaning holds its value until it is left.
    fireEvent.change(within(standing).getByLabelText("My points"), { target: { value: "" } });
    expect(stored().standing.myPoints).toBe(41);
    fireEvent.blur(within(standing).getByLabelText("My points"));
    expect(stored().standing.myPoints).toBe(0);
  });

  it("lets a bounded number be typed digit by digit and snaps it into range on leaving", async () => {
    const user = userEvent.setup();
    renderSettings();
    const standing = screen.getByRole("region", { name: "Standing and risk" });
    const size = within(standing).getByLabelText("Pool size");
    await user.clear(size);
    await user.type(size, "12");
    expect(size).toHaveValue(12);
    expect(stored().standing.poolSize).toBe(12);

    const share = within(screen.getByRole("region", { name: "Rest of the pool" })).getByLabelText(
      /^Share on the single most likely score/,
    );
    await user.clear(share);
    await user.type(share, "0.4");
    expect(share).toHaveValue(0.4);
    expect(stored().field.modalShare).toBe(0.4);

    await user.clear(size);
    await user.type(size, "1");
    expect(within(standing).getByText(/Use a value from 2 to any/)).toBeInTheDocument();
    expect(stored().standing.poolSize).toBe(12);
    await user.tab();
    expect(stored().standing.poolSize).toBe(2);
    expect(size).toHaveValue(2);
    expect(within(standing).queryByText(/Use a value from 2/)).not.toBeInTheDocument();
  });

  it("persists the field model shares", () => {
    renderSettings();
    const field = screen.getByRole("region", { name: "Rest of the pool" });
    fireEvent.change(within(field).getByLabelText(/^Share on the single most likely score/), { target: { value: "0.4" } });
    fireEvent.change(within(field).getByLabelText(/^Total share on the few obvious scores/), { target: { value: "0.7" } });
    expect(stored().field).toEqual({ modalShare: 0.4, chalkShare: 0.7 });
  });

  it("adds, edits, and removes rivals", async () => {
    const user = userEvent.setup();
    renderSettings();
    const rivals = screen.getByRole("region", { name: "Rivals" });
    const add = within(rivals).getByRole("button", { name: "Add rival" });

    await user.click(add);
    await user.type(within(rivals).getByLabelText("New rival"), "   ");
    await user.click(add);
    expect(stored().rivals).toHaveLength(0);

    await user.clear(within(rivals).getByLabelText("New rival"));
    await user.type(within(rivals).getByLabelText("New rival"), " Dana ");
    await user.click(add);
    expect(stored().rivals).toEqual([expect.objectContaining({ name: "Dana", pointsAdjustment: 0, picks: {} })]);
    expect(within(rivals).getByLabelText("New rival")).toHaveValue("");

    const item = within(rivals).getByDisplayValue("Dana").closest("li") as HTMLElement;
    await user.type(within(item).getByLabelText("Name"), "e");
    fireEvent.change(within(item).getByLabelText("Points adjustment"), { target: { value: "7" } });
    expect(stored().rivals[0]).toMatchObject({ name: "Danae", pointsAdjustment: 7 });

    await user.click(within(item).getByRole("button", { name: "Remove" }));
    expect(stored().rivals).toHaveLength(0);
    expect(within(rivals).getByLabelText("New rival")).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Removed Danae and their saved picks.");
  });

  it("reports each league's freshness, fixture count, sources, and sample status", () => {
    renderSettings();
    const table = screen.getByRole("table", { name: "Snapshot status per league" });
    const cells = (name: string) =>
      within(within(table).getByText(name).closest("tr") as HTMLElement)
        .getAllByRole("cell")
        .map((cell) => cell.textContent);
    expect(cells("Test League")).toEqual(["Test League", "3h ago", "1", "football-data / the-odds-api"]);
    expect(cells("Sample Cup")).toEqual(["Sample Cupsample", "5h ago", "2", "manual entry / manual entry"]);
    expect(cells("Empty League")[2]).toBe("0");
  });
});
