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
  render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} />);
  expect(screen.getByRole("heading", { name: "Weekly lineup by consensus" })).toBeVisible();
  expect(screen.getAllByText("Weekly rankings unavailable")).toHaveLength(2);
  expect(screen.getAllByText("No ranked player").length).toBeGreaterThan(0);
  expect(screen.queryByLabelText("League size")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Remove Roster Runner" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "League settings" }));
  fireEvent.change(screen.getByLabelText("League size"), { target: { value: "10" } });
  expect(JSON.parse(localStorage.getItem(getMyTeamStorageKey(2026))!).leagueSize).toBe(10);
  fireEvent.click(screen.getByRole("button", { name: "Roster" }));
  expect(screen.getByRole("button", { name: "Remove Roster Runner" })).toBeVisible();
});

it("saves a roster, marks league availability, compares and applies a move, and survives remount", () => {
  const view = render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} />);
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
  render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} />);
  expect(screen.getByRole("option", { name: "Available Runner (RB)" })).toBeInTheDocument();
});

it("leads a saved team with its marked targets on waivers and with the lineup on weekly", () => {
  localStorage.setItem(getMyTeamStorageKey(2026), JSON.stringify({ ...emptyMyTeam(2026), players: [rb], availableIds: [add.id] }));
  const comparisonLeads = () =>
    Boolean(screen.getByRole("heading", { name: "Compare an add and a drop" })
      .compareDocumentPosition(screen.getByRole("heading", { name: "Weekly lineup by consensus" })) & Node.DOCUMENT_POSITION_FOLLOWING);
  const weekly = render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} />);
  expect(comparisonLeads()).toBe(false);
  weekly.unmount();
  render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} lead="waivers" />);
  expect(comparisonLeads()).toBe(true);
  expect(screen.getByRole("option", { name: "Available Runner (RB)" })).toBeInTheDocument();
  // Roster editing stays one press away and is not on screen until asked for.
  expect(screen.queryByLabelText("Find a player to roster or mark available")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Roster" }));
  expect(screen.getByLabelText("Find a player to roster or mark available")).toBeVisible();
});

it("pauses recommendations on stale inputs", () => {
  localStorage.setItem(getMyTeamStorageKey(2026), JSON.stringify({ ...emptyMyTeam(2026), players: [rb], availableIds: [add.id] }));
  const staleBoard = { ...board, flexSource: { ...source, asOf: "2020-01-01T00:00:00Z" } };
  render(<MyTeamPanel snapshot={snapshot} board={staleBoard} scoring="ppr" onScoringChange={jest.fn()} />);
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
  render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="ppr" onScoringChange={scoring} />);
  fireEvent.click(screen.getByRole("button", { name: "Import draft tracker roster" }));
  expect(localStorage.getItem(key)).toBe(raw);
  expect(scoring).toHaveBeenCalledWith("half_ppr");
  expect(screen.getByText(/Imported 1 player and league settings/)).toBeInTheDocument();
});

it("retains edits in memory and explains when browser writes fail", () => {
  const write = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
  try {
    render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} />);
    fireEvent.change(screen.getByLabelText("Find a player to roster or mark available"), { target: { value: "Roster" } });
    fireEvent.click(screen.getByRole("button", { name: "Roster Roster Runner" }));
    expect(screen.getByText(/Changes last only in this tab/)).toBeInTheDocument();
    // Nothing says "saved" while the browser cannot save.
    expect(screen.queryByText("Your roster stays saved as you add players.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Weekly lineup" }));
    expect(screen.getByRole("option", { name: "Roster Runner (RB)" })).toBeInTheDocument();
  } finally { write.mockRestore(); }
});

it("says the roster stays saved while storage works", () => {
  render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} />);
  expect(screen.getByText("Your roster stays saved as you add players.")).toBeInTheDocument();
});

it("names the week and the scoring format the lineup is read in", () => {
  localStorage.setItem(getMyTeamStorageKey(2026), JSON.stringify({ ...emptyMyTeam(2026), players: [rb], availableIds: [add.id] }));
  render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="half_ppr" onScoringChange={jest.fn()} />);
  expect(screen.getByText("Week 2 · Half PPR · 12 teams · 1 rostered · 1 marked available")).toBeInTheDocument();
});

it("prints a lineup slot's rank and its board as two words", () => {
  localStorage.setItem(getMyTeamStorageKey(2026), JSON.stringify({ ...emptyMyTeam(2026), players: [rb] }));
  render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} />);
  expect(screen.getByText("Roster Runner").closest("li")).toHaveTextContent("#20 Flex");
});

// Each of these actions removes the button that was pressed, so focus has to be given somewhere to carry on from.
describe("focus after an action that removes its own button", () => {
  const searchField = () => screen.getByLabelText("Find a player to roster or mark available");

  it("returns to the search field after a search result is rostered", () => {
    render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} />);
    fireEvent.change(searchField(), { target: { value: "Roster" } });
    const roster = screen.getByRole("button", { name: "Roster Roster Runner" });
    roster.focus();
    fireEvent.click(roster);
    expect(screen.queryByRole("button", { name: "Roster Roster Runner" })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(searchField());
  });

  it("moves to the notice after a move is saved", () => {
    localStorage.setItem(getMyTeamStorageKey(2026), JSON.stringify({ ...emptyMyTeam(2026), players: [rb], availableIds: [add.id] }));
    render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} />);
    fireEvent.change(screen.getByLabelText("Available player to add"), { target: { value: "add" } });
    fireEvent.change(screen.getByLabelText("Roster player to drop"), { target: { value: "rb" } });
    const save = screen.getByRole("button", { name: "Save this move to my roster" });
    save.focus();
    fireEvent.click(save);
    const notice = screen.getByText("Saved roster updated. Added Available Runner and removed Roster Runner. Make the actual transaction in your league.");
    expect(notice).toHaveAttribute("tabindex", "-1");
    expect(document.activeElement).toBe(notice);
    expect(screen.queryByRole("button", { name: "Save this move to my roster" })).not.toBeInTheDocument();
  });

  it("closes the sentence once when the dropped name ends in a full stop", () => {
    const senior = { ...rb, name: "Roster Runner Sr." };
    const seniorBoard = { ...board, flex: [senior, add] };
    const seniorSnapshot = { ...snapshot, boards: { ppr: seniorBoard, half_ppr: seniorBoard, standard: seniorBoard } };
    localStorage.setItem(getMyTeamStorageKey(2026), JSON.stringify({ ...emptyMyTeam(2026), players: [senior], availableIds: [add.id] }));
    render(<MyTeamPanel snapshot={seniorSnapshot} board={seniorSnapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} />);
    fireEvent.change(screen.getByLabelText("Available player to add"), { target: { value: "add" } });
    fireEvent.change(screen.getByLabelText("Roster player to drop"), { target: { value: "rb" } });
    fireEvent.click(screen.getByRole("button", { name: "Save this move to my roster" }));
    expect(screen.getByText("Saved roster updated. Added Available Runner and removed Roster Runner Sr. Make the actual transaction in your league.")).toBeInTheDocument();
  });

  it("moves to the notice after a draft import", () => {
    localStorage.setItem("fantasy-draft-tracker-v3-2026", JSON.stringify({ settings: { userTeam: 1, totalTeams: 12, scoringFormat: "PPR" }, picks: [{ teamNumber: 1, player: rb }] }));
    render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} />);
    const importButton = screen.getByRole("button", { name: "Import draft tracker roster" });
    importButton.focus();
    fireEvent.click(importButton);
    const notice = screen.getByText("Imported 1 player and league settings. Existing roster players were kept. Review any moves made since the draft.");
    expect(document.activeElement).toBe(notice);
    expect(screen.queryByRole("button", { name: "Import draft tracker roster" })).not.toBeInTheDocument();
  });

  it("leaves focus on the import button when there is no draft to import", () => {
    render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} />);
    const importButton = screen.getByRole("button", { name: "Import draft tracker roster" });
    importButton.focus();
    fireEvent.click(importButton);
    expect(screen.getByText("No saved 2026 redraft picks were found for your team in this browser.")).toBeInTheDocument();
    expect(document.activeElement).toBe(importButton);
  });

  it("moves to the next Remove button after a removal, and to the search field once the roster is empty", () => {
    const third = { id: "third", name: "Third Receiver", position: "WR" as const, team: "MIA" };
    localStorage.setItem(getMyTeamStorageKey(2026), JSON.stringify({ ...emptyMyTeam(2026), players: [rb, add, third] }));
    render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Roster" }));
    // Removing the middle row puts focus on the row that moved into its place, which is the third player and not the first.
    const middle = screen.getByRole("button", { name: "Remove Available Runner" });
    middle.focus();
    fireEvent.click(middle);
    const next = screen.getByRole("button", { name: "Remove Third Receiver" });
    expect(document.activeElement).toBe(next);
    fireEvent.click(next);
    // That was the last row, so focus steps up to the one above.
    const remaining = screen.getByRole("button", { name: "Remove Roster Runner" });
    expect(document.activeElement).toBe(remaining);
    fireEvent.click(remaining);
    expect(screen.queryByRole("button", { name: /^Remove / })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(searchField());
  });

  it("moves to the Remove button above when the last row is removed", () => {
    localStorage.setItem(getMyTeamStorageKey(2026), JSON.stringify({ ...emptyMyTeam(2026), players: [rb, add] }));
    render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Roster" }));
    const last = screen.getByRole("button", { name: "Remove Available Runner" });
    last.focus();
    fireEvent.click(last);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remove Roster Runner" }));
  });
});

it("counts a one-place rank gain in the singular and a larger one in the plural", () => {
  const near = { ...rb, rank: 6 };
  const nearBoard = { ...board, flex: [near, add] };
  const nearSnapshot = { ...snapshot, boards: { ppr: nearBoard, half_ppr: nearBoard, standard: nearBoard } };
  localStorage.setItem(getMyTeamStorageKey(2026), JSON.stringify({ ...emptyMyTeam(2026), players: [near], availableIds: [add.id] }));
  const view = render(<MyTeamPanel snapshot={nearSnapshot} board={nearSnapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Available player to add"), { target: { value: "add" } });
  fireEvent.change(screen.getByLabelText("Roster player to drop"), { target: { value: "rb" } });
  expect(screen.getByText("Available Runner ranks 1 place ahead of Roster Runner on the flex board.")).toBeInTheDocument();
  view.unmount();

  // The shared fixture has the roster player at 20 and the available one at 5.
  localStorage.setItem(getMyTeamStorageKey(2026), JSON.stringify({ ...emptyMyTeam(2026), players: [rb], availableIds: [add.id] }));
  render(<MyTeamPanel snapshot={snapshot} board={snapshot.boards.ppr} scoring="ppr" onScoringChange={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Available player to add"), { target: { value: "add" } });
  fireEvent.change(screen.getByLabelText("Roster player to drop"), { target: { value: "rb" } });
  expect(screen.getByText("Available Runner ranks 15 places ahead of Roster Runner on the flex board.")).toBeInTheDocument();
});
