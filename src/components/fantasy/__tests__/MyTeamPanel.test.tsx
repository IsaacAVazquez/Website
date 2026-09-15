import { fireEvent, render, screen } from "@testing-library/react";
import { MyTeamPanel } from "../MyTeamPanel";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { emptyMyTeam, getMyTeamStorageKey } from "@/lib/fantasyMyTeam";
import type { FantasyWeeklySnapshot } from "@/lib/fantasyWeeklySnapshot";

const source = { provider: "test", url: "https://example.com", asOf: new Date().toISOString(), expertCount: 10, playerCount: 2 };
const rb = { id: "rb", name: "Roster Runner", position: "RB" as const, team: "BUF", rank: 20 };
const add = { id: "add", name: "Available Runner", position: "RB" as const, team: "NYJ", rank: 5 };
const board = { flex: [rb, add], quarterbacks: [], flexSource: source, quarterbackSource: source };
const snapshot: FantasyWeeklySnapshot = { schemaVersion: 1, season: 2026, week: 2, generatedAt: source.asOf, boards: { ppr: board, half_ppr: board, standard: board } };

beforeEach(() => { localStorage.clear(); resetBrowserStorageMemory(); });

it("leads with weekly decisions for a saved roster and reveals settings on request", () => {
  localStorage.setItem(getMyTeamStorageKey(2026), JSON.stringify({ ...emptyMyTeam(2026), players: [rb] }));
  render(<MyTeamPanel snapshot={snapshot} scoring="ppr" onScoringChange={jest.fn()} />);
  expect(screen.getByRole("heading", { name: "Weekly lineup by consensus" })).toBeVisible();
  expect(screen.queryByLabelText("League size")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Remove Roster Runner" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "League settings" }));
  fireEvent.change(screen.getByLabelText("League size"), { target: { value: "10" } });
  expect(JSON.parse(localStorage.getItem(getMyTeamStorageKey(2026))!).leagueSize).toBe(10);
  fireEvent.click(screen.getByRole("button", { name: "Roster" }));
  expect(screen.getByRole("button", { name: "Remove Roster Runner" })).toBeVisible();
});

it("saves a roster, marks league availability, compares and applies a move, and survives remount", () => {
  const view = render(<MyTeamPanel snapshot={snapshot} scoring="ppr" onScoringChange={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Find a player to roster or mark available"), { target: { value: "Roster" } });
  fireEvent.click(screen.getByRole("button", { name: "Roster Roster Runner" }));
  expect(screen.getByLabelText("Find a player to roster or mark available")).toBeVisible();
  fireEvent.change(screen.getByLabelText("Find a player to roster or mark available"), { target: { value: "Available" } });
  fireEvent.click(screen.getByRole("button", { name: "Available in my league: Available Runner" }));
  fireEvent.click(screen.getByRole("button", { name: "Weekly lineup" }));
  fireEvent.change(screen.getByLabelText("Available player to add"), { target: { value: "add" } });
  fireEvent.change(screen.getByLabelText("Roster player to drop"), { target: { value: "rb" } });
  expect(screen.getByText("Available Runner enters the ranked lineup at RB 1.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Save this move to my roster" }));
  const stored = JSON.parse(localStorage.getItem(getMyTeamStorageKey(2026))!);
  expect(stored.players.map((p: { id: string }) => p.id)).toEqual(["add"]);
  expect(stored.availableIds).toEqual([]);
  view.unmount();
  render(<MyTeamPanel snapshot={snapshot} scoring="ppr" onScoringChange={jest.fn()} />);
  expect(screen.getByRole("option", { name: "Available Runner (RB)" })).toBeInTheDocument();
});

it("pauses recommendations on stale inputs", () => {
  localStorage.setItem(getMyTeamStorageKey(2026), JSON.stringify({ ...emptyMyTeam(2026), players: [rb], availableIds: [add.id] }));
  const staleBoard = { ...board, flexSource: { ...source, asOf: "2020-01-01T00:00:00Z" } };
  render(<MyTeamPanel snapshot={{ ...snapshot, boards: { ...snapshot.boards, ppr: staleBoard } }} scoring="ppr" onScoringChange={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Available player to add"), { target: { value: "add" } });
  fireEvent.change(screen.getByLabelText("Roster player to drop"), { target: { value: "rb" } });
  expect(screen.getByText(/Weekly data is stale/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Save this move to my roster" })).not.toBeInTheDocument();
});

it("imports a redraft roster without overwriting draft storage", () => {
  const key = "fantasy-draft-tracker-v3-2026";
  const raw = JSON.stringify({ settings: { userTeam: 1, totalTeams: 12, scoringFormat: "HALF_PPR" }, picks: [{ teamNumber: 1, player: rb }] });
  localStorage.setItem(key, raw);
  const scoring = jest.fn();
  render(<MyTeamPanel snapshot={snapshot} scoring="ppr" onScoringChange={scoring} />);
  fireEvent.click(screen.getByRole("button", { name: "Import draft tracker roster" }));
  expect(localStorage.getItem(key)).toBe(raw);
  expect(scoring).toHaveBeenCalledWith("half_ppr");
  expect(screen.getByText(/Imported 1 players/)).toBeInTheDocument();
});

it("retains edits in memory and explains when browser writes fail", () => {
  const write = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
  try {
    render(<MyTeamPanel snapshot={snapshot} scoring="ppr" onScoringChange={jest.fn()} />);
    fireEvent.change(screen.getByLabelText("Find a player to roster or mark available"), { target: { value: "Roster" } });
    fireEvent.click(screen.getByRole("button", { name: "Roster Roster Runner" }));
    expect(screen.getByText(/Changes last only in this tab/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Weekly lineup" }));
    expect(screen.getByRole("option", { name: "Roster Runner (RB)" })).toBeInTheDocument();
  } finally { write.mockRestore(); }
});
