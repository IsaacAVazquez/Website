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

  it("persists the basics: name, league, timezone, lock offset, de-vig", async () => {
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
    expect(stored().lockOffsetMinutes).toBe(1440);
    expect(lock).toHaveValue(1440);

    await user.selectOptions(within(basics).getByLabelText(/^De-vig method/), "power");
    expect(stored().devigMethod).toBe("power");
  });

  it("persists the scoring rules, clamped to 0 to 100", async () => {
    const user = userEvent.setup();
    renderSettings();
    const rules = screen.getByRole("region", { name: "Scoring rules" });

    fireEvent.change(within(rules).getByLabelText("Exact score points"), { target: { value: "8" } });
    fireEvent.change(within(rules).getByLabelText("Winner and goal difference"), { target: { value: "250" } });
    fireEvent.change(within(rules).getByLabelText("Correct outcome only"), { target: { value: "" } });
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
    const standing = screen.getByRole("region", { name: "Standing and posture" });

    fireEvent.change(within(standing).getByLabelText("My points"), { target: { value: "41" } });
    const above = within(standing).getByLabelText(/^Nearest above \(points\)/);
    fireEvent.change(above, { target: { value: "44" } });
    expect(stored().standing.nearestAbovePoints).toBe(44);
    fireEvent.change(above, { target: { value: "" } });
    fireEvent.change(within(standing).getByLabelText(/^Nearest below \(points\)/), { target: { value: "39" } });
    fireEvent.change(within(standing).getByLabelText("Pool size"), { target: { value: "12.4" } });
    fireEvent.change(within(standing).getByLabelText("Games remaining"), { target: { value: "-3" } });
    await user.selectOptions(within(standing).getByLabelText("Posture"), "chase");

    expect(stored().standing).toEqual({
      myPoints: 41,
      nearestAbovePoints: null,
      nearestBelowPoints: 39,
      poolSize: 12,
      gamesRemaining: 0,
      posture: "chase",
    });
    expect(above).toHaveValue(null);

    fireEvent.change(within(standing).getByLabelText("My points"), { target: { value: "" } });
    expect(stored().standing.myPoints).toBe(0);
  });

  it("persists the field model shares", () => {
    renderSettings();
    const field = screen.getByRole("region", { name: "Field model" });
    fireEvent.change(within(field).getByLabelText(/^Share on the modal chalk pick/), { target: { value: "0.4" } });
    fireEvent.change(within(field).getByLabelText("Total share on chalk picks"), { target: { value: "0.7" } });
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
