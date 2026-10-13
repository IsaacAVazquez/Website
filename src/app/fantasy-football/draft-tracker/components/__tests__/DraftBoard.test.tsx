import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DraftBoard } from "../DraftBoard";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { FANTASY_QUEUE_STORAGE_KEY } from "@/lib/fantasyLocal";
import { FANTASY_ADP_TOOLTIP } from "@/lib/fantasyUtils";
import type { FantasyVorpRankingEntry } from "@/lib/fantasyVorp";
import type { Player } from "@/types";

function player(partial: Partial<Player> & Pick<Player, "id" | "name" | "position">): Player {
  return { team: "FA", averageRank: 1, ...partial };
}

const PLAYERS: Player[] = [
  player({ id: "p1", name: "Bijan Robinson", position: "RB", team: "ATL", tier: 1, rankEcr: 1, averageRank: 1.2, adp: 10, positionRank: 1, byeWeek: 5 }),
  player({ id: "p2", name: "Ja'Marr Chase", position: "WR", team: "CIN", tier: 1, rankEcr: 2, averageRank: 2, adp: 25 }),
  player({ id: "p3", name: "Josh Allen", position: "QB", team: "BUF", tier: 2, rankEcr: 3, averageRank: 6.5, adp: 19.5 }),
  player({ id: "p4", name: "Travis Kelce", position: "TE", team: "KC", tier: 2, rankEcr: 4, averageRank: 7 }),
  player({ id: "p5", name: "Brandon Aubrey", position: "K", team: "DAL", rankEcr: 5, averageRank: 150 }),
];

type BoardProps = React.ComponentProps<typeof DraftBoard>;

function renderBoard(overrides: Partial<BoardProps> = {}) {
  const props: BoardProps = {
    players: PLAYERS,
    draftedPlayerIds: new Set<string>(),
    onDraftPlayer: jest.fn(),
    onOpenDetail: jest.fn(),
    currentPick: 20,
    currentRound: 2,
    adpAvailable: true,
    guidanceAvailable: true,
    vorpValues: new Map<string, FantasyVorpRankingEntry>(),
    vorpTeamSize: null,
    ...overrides,
  };
  const utils = render(<DraftBoard {...props} />);
  return { ...utils, props };
}

function setup() {
  return userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
}

const search = () => screen.getByRole("textbox", { name: "Search the board" });
const rowOf = (name: string) => screen.getByRole("button", { name: `Open ${name} detail` }).closest("li") as HTMLElement;
const visibleNames = () =>
  screen.queryAllByRole("button", { name: /^Open .* detail$/ }).map((button) => button.textContent);

/** Answers the board's width query, and returns the undo. */
function screenIsWide(matches: boolean): () => void {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

async function settleDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(250);
  });
}

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  jest.useFakeTimers();
  window.localStorage.clear();
  resetBrowserStorageMemory();
});

afterEach(() => {
  jest.useRealTimers();
  window.localStorage.clear();
  resetBrowserStorageMemory();
});

describe("DraftBoard rows and tiers", () => {
  it("groups available players into tier plates with the cliff between them", () => {
    renderBoard({ draftedPlayerIds: new Set(["p2"]) });
    expect(screen.getByText("4 of 4 available")).toBeInTheDocument();
    expect(screen.queryByText("Ja'Marr Chase")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Tier 1, 1 player, ranks 1 to 1" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Tier 2, 2 players, ranks 3 to 4, 5.3 average-rank cliff above" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "No published tier, 1 player, ranks 5 to 5, 143.0 average-rank cliff above" }),
    ).toBeInTheDocument();
    // The break prints the cliff beside the kit's ledge-and-drop mark.
    expect(
      screen
        .getByRole("region", { name: "Tier 2, 2 players, ranks 3 to 4, 5.3 average-rank cliff above" })
        .querySelector(".ffb-tier-cliff"),
    ).toHaveTextContent("5.3 avg-rank cliff");
    // The tab prints two digits, as the rankings board does, and the region keeps the plain number.
    expect(screen.getByText("Tier 01")).toHaveClass("ffb-tier-tab");
    expect(screen.getByText("Tier 02")).toHaveClass("ffb-tier-tab");
  });

  it("prints rank, position rank, team, and bye on each row", () => {
    renderBoard();
    const row = rowOf("Bijan Robinson");
    expect(within(row).getByTitle("Overall board rank")).toHaveTextContent("1");
    expect(within(row).getByText("RB1")).toBeInTheDocument();
    // Team and bye are their own columns, so bye weeks scan down the board.
    expect(within(row).getByText("ATL")).toHaveClass("ffb-c-team");
    expect(row.querySelector(".ffb-c-bye")).toHaveTextContent("Bye 5");
    // The word Bye is read out at every width. A desktop hides it by sight only, so it is never display: none.
    expect(within(row).getByText("Bye")).toHaveClass("ffb-dt-vh-desk");
    expect(within(row).getByText("Bye")).not.toHaveClass("ffb-only-phone");
  });

  it("reads each ADP gap against the current pick", () => {
    renderBoard();
    // Each hidden label sits inside the cell it names, so it hides when the cell does.
    const deltaCell = (name: string) => within(rowOf(name)).getByText("±ADP").parentElement as HTMLElement;

    expect(within(rowOf("Bijan Robinson")).getByTitle(FANTASY_ADP_TOOLTIP)).toHaveTextContent("ADP 10.0");
    expect(within(rowOf("Bijan Robinson")).getByText("versus ADP at pick 20").parentElement).toBe(
      deltaCell("Bijan Robinson"),
    );
    expect(within(rowOf("Bijan Robinson")).getByText("ADP").parentElement).toBe(
      within(rowOf("Bijan Robinson")).getByTitle(FANTASY_ADP_TOOLTIP),
    );
    // The gap is the one number a phone row keeps, and one that reads as value keeps its tone there.
    expect(deltaCell("Bijan Robinson")).toHaveClass("ffb-m-meta", "ffb-is-strong", "ffb-dt-is-value");
    expect(deltaCell("Ja'Marr Chase")).toHaveClass("ffb-m-meta", "ffb-is-flat");
    expect(within(rowOf("Bijan Robinson")).getByTitle(FANTASY_ADP_TOOLTIP)).not.toHaveClass("ffb-m-meta");
    expect(deltaCell("Bijan Robinson")).toHaveTextContent("+10.0");
    expect(deltaCell("Bijan Robinson")).toHaveAttribute(
      "title",
      "Lasted 10.0 picks past his ADP, so this reads as value at pick 20",
    );
    expect(deltaCell("Ja'Marr Chase")).toHaveTextContent("−5.0");
    expect(deltaCell("Ja'Marr Chase")).toHaveAttribute("title", "Mock rooms usually take him 5.0 picks after pick 20");
    expect(deltaCell("Josh Allen")).toHaveTextContent("±0.5");
    expect(deltaCell("Josh Allen")).toHaveAttribute("title", "Priced about right at this pick");
    expect(deltaCell("Travis Kelce")).toHaveTextContent("—");
  });

  it("calls a late slide noise when guidance is unavailable", () => {
    renderBoard({ guidanceAvailable: false });
    const cell = within(rowOf("Bijan Robinson")).getByText("±ADP").parentElement as HTMLElement;
    expect(cell).toHaveAttribute("title", "Lasted 10.0 picks past his ADP, inside the noise band for this market sample");
  });

  it("hides every ADP surface without ADP", () => {
    renderBoard({ adpAvailable: false });
    expect(within(rowOf("Bijan Robinson")).queryByText("±ADP")).not.toBeInTheDocument();
    expect(within(rowOf("Bijan Robinson")).queryByText(/versus ADP/)).not.toBeInTheDocument();
    expect(screen.queryByText("At #20")).not.toBeInTheDocument();
  });

  it("shows VORP values with the league-size explanation", () => {
    renderBoard({
      vorpValues: new Map([["p1", { playerId: "p1", rank: 1, value: 87.6 }], ["p3", { playerId: "p3", rank: 9, value: -2.2 }]]),
      vorpTeamSize: 12,
    });
    expect(screen.getByText(/replacement for a 12-team league/)).toBeInTheDocument();
    // The note names the panel without saying where it is, since it opens above the board.
    expect(screen.getByText(/replacement for a 12-team league/)).toHaveTextContent(
      /drive the replacement index and scarcity panel\.$/,
    );
    // With ADP on, a phone row shows no VORP, so the note leaves the phone with it.
    expect(screen.getByText(/replacement for a 12-team league/)).toHaveClass("ffb-not-phone");
    // The spoken label is inside the cell too.
    expect(within(rowOf("Bijan Robinson")).getByText("Value over replacement player").parentElement).toBe(
      within(rowOf("Bijan Robinson")).getByText("VORP").parentElement,
    );
    expect(within(rowOf("Bijan Robinson")).getByText("VORP").parentElement).toHaveTextContent("VORP 88");
    expect(within(rowOf("Josh Allen")).getByText("VORP").parentElement).toHaveTextContent("VORP -2");
    expect(within(rowOf("Travis Kelce")).queryByText("VORP")).not.toBeInTheDocument();
  });

  it("keeps VORP and its note on a phone row when the room has no ADP", () => {
    renderBoard({
      adpAvailable: false,
      vorpValues: new Map([["p1", { playerId: "p1", rank: 1, value: 87.6 }]]),
      vorpTeamSize: 12,
    });
    expect(within(rowOf("Bijan Robinson")).getByText("VORP").parentElement).toHaveClass("ffb-m-meta");
    expect(screen.getByText(/replacement for a 12-team league/)).not.toHaveClass("ffb-not-phone");
  });

  it("windows a long board at forty rows and extends as the sentinel nears", () => {
    let trigger: ((entries: Array<{ isIntersecting: boolean }>) => void) | null = null;
    const original = global.IntersectionObserver;
    // From 1200px the rail sits beside the list, and that is where the list extends by itself.
    const restoreWidth = screenIsWide(true);
    global.IntersectionObserver = class {
      constructor(cb: (entries: Array<{ isIntersecting: boolean }>) => void) {
        trigger = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    } as unknown as typeof IntersectionObserver;
    try {
      const many = Array.from({ length: 50 }, (_, i) =>
        player({ id: `w${i}`, name: `Receiver ${i + 1}`, position: "WR", rankEcr: i + 1, averageRank: i + 1 }),
      );
      renderBoard({ players: many });
      expect(visibleNames()).toHaveLength(40);
      act(() => trigger?.([{ isIntersecting: false }]));
      expect(visibleNames()).toHaveLength(40);
      act(() => trigger?.([{ isIntersecting: true }]));
      expect(visibleNames()).toHaveLength(50);
      // The last page took the button with it.
      expect(screen.queryByRole("button", { name: /^Load more/ })).not.toBeInTheDocument();
    } finally {
      global.IntersectionObserver = original;
      restoreWidth();
    }
  });

  it("waits for Load more below 1200px, and hands focus to the first row it adds", async () => {
    let observed = 0;
    const original = global.IntersectionObserver;
    global.IntersectionObserver = class {
      observe() {
        observed += 1;
      }
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    } as unknown as typeof IntersectionObserver;
    const restoreWidth = screenIsWide(false);
    try {
      const user = setup();
      const many = Array.from({ length: 50 }, (_, i) =>
        player({ id: `w${i}`, name: `Receiver ${i + 1}`, position: "WR", rankEcr: i + 1, averageRank: i + 1 }),
      );
      renderBoard({ players: many });
      expect(visibleNames()).toHaveLength(40);
      // Nothing watches the end of the list, so what follows it can be reached.
      expect(observed).toBe(0);

      await user.click(screen.getByRole("button", { name: "Load more (10 left)" }));
      expect(visibleNames()).toHaveLength(50);
      expect(screen.queryByRole("button", { name: /^Load more/ })).not.toBeInTheDocument();
      // The button is gone, so focus is on the first row it added and not on the page.
      expect(screen.getByRole("button", { name: "Open Receiver 41 detail" })).toHaveFocus();
    } finally {
      global.IntersectionObserver = original;
      restoreWidth();
    }
  });
});

describe("DraftBoard filtering and search", () => {
  it("filters by position and by flex", async () => {
    const user = setup();
    renderBoard();
    await user.click(screen.getByRole("radio", { name: "RB" }));
    expect(visibleNames()).toEqual(["Bijan Robinson"]);
    expect(screen.getByText("1 of 5 available")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Flex" }));
    expect(visibleNames()).toEqual(["Bijan Robinson", "Ja'Marr Chase", "Travis Kelce"]);
  });

  it("searches name, team, and position after the debounce", async () => {
    const user = setup();
    renderBoard();
    await user.type(search(), "kc");
    expect(visibleNames()).toHaveLength(5);
    await settleDebounce();
    expect(visibleNames()).toEqual(["Travis Kelce"]);
  });

  it("offers a reset when nothing matches", async () => {
    const user = setup();
    renderBoard();
    await user.click(screen.getByRole("radio", { name: "QB" }));
    await user.type(search(), "zzz");
    await settleDebounce();
    expect(screen.getByText("No available players match on this board.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    await settleDebounce();
    expect(search()).toHaveValue("");
    expect(screen.getByRole("radio", { name: "All" })).toBeChecked();
    expect(visibleNames()).toHaveLength(5);
  });
});

describe("DraftBoard picks", () => {
  it("logs a player and opens his detail", async () => {
    const user = setup();
    const { props } = renderBoard();
    await user.click(screen.getByRole("button", { name: "Log Josh Allen" }));
    expect(props.onDraftPlayer).toHaveBeenCalledWith(PLAYERS[2]);
    await user.click(screen.getByRole("button", { name: "Open Josh Allen detail" }));
    expect(props.onOpenDetail).toHaveBeenCalledWith(PLAYERS[2]);
  });

  it("clears an active search and refocuses it after a log", async () => {
    const user = setup();
    const { props } = renderBoard();
    await user.type(search(), "allen");
    await settleDebounce();
    await user.click(screen.getByRole("button", { name: "Log Josh Allen" }));
    expect(props.onDraftPlayer).toHaveBeenCalledWith(PLAYERS[2]);
    expect(search()).toHaveValue("");
    expect(search()).toHaveFocus();
  });

  it("queues a player, lists him while available, and logs from the queue", async () => {
    const user = setup();
    const { props, rerender } = renderBoard();
    await user.click(screen.getByRole("button", { name: "Add Travis Kelce to queue" }));
    expect(JSON.parse(window.localStorage.getItem(FANTASY_QUEUE_STORAGE_KEY) ?? "[]")).toEqual(["p4"]);
    // The star is the kit's icon, and its filled state follows aria-pressed.
    expect(
      screen
        .getByRole("button", { name: "Remove Travis Kelce from queue", pressed: true })
        .querySelector(".ffb-star-icon"),
    ).toBeInTheDocument();
    expect(screen.getByText("★ Queue · still on the board")).toBeInTheDocument();

    await user.click(screen.getByTitle("Log Travis Kelce"));
    expect(props.onDraftPlayer).toHaveBeenCalledWith(PLAYERS[3]);

    rerender(<DraftBoard {...props} draftedPlayerIds={new Set(["p4"])} />);
    expect(screen.queryByText("★ Queue · still on the board")).not.toBeInTheDocument();
  });

  it("unqueues a player", async () => {
    const user = setup();
    window.localStorage.setItem(FANTASY_QUEUE_STORAGE_KEY, JSON.stringify(["p1"]));
    renderBoard();
    await user.click(screen.getByRole("button", { name: "Remove Bijan Robinson from queue" }));
    expect(JSON.parse(window.localStorage.getItem(FANTASY_QUEUE_STORAGE_KEY) ?? "[]")).toEqual([]);
    expect(screen.getByRole("button", { name: "Add Bijan Robinson to queue", pressed: false })).toBeInTheDocument();
  });
});

describe("DraftBoard keyboard", () => {
  it("arrows through results, announces the highlight, and logs it on Enter", async () => {
    const user = setup();
    const { props } = renderBoard();
    await user.click(search());
    await user.keyboard("{ArrowUp}");
    expect(screen.getByText("", { selector: "p[aria-live]" })).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(screen.getByText("Ja'Marr Chase, WR, CIN. Press Enter to log.")).toBeInTheDocument();
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(screen.getByText("Bijan Robinson, RB, ATL. Press Enter to log.")).toBeInTheDocument();
    await user.keyboard("{Enter}");
    expect(props.onDraftPlayer).toHaveBeenCalledWith(PLAYERS[0]);
  });

  it("waits on Enter while results are ambiguous or still settling", async () => {
    const user = setup();
    const { props } = renderBoard();
    await user.click(search());
    await user.keyboard("{Enter}");
    expect(props.onDraftPlayer).not.toHaveBeenCalled();

    await user.type(search(), "chase");
    await user.keyboard("{Enter}");
    expect(props.onDraftPlayer).not.toHaveBeenCalled();

    await settleDebounce();
    await user.keyboard("{Enter}");
    expect(props.onDraftPlayer).toHaveBeenCalledWith(PLAYERS[1]);
  });

  it("clears the search on Escape, then leaves the field", async () => {
    const user = setup();
    renderBoard();
    await user.type(search(), "kel");
    await user.keyboard("{Escape}");
    expect(search()).toHaveValue("");
    expect(search()).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(search()).not.toHaveFocus();
  });

  it("drops the highlight when the drafted set changes", async () => {
    const user = setup();
    const { props, rerender } = renderBoard();
    await user.click(search());
    await user.keyboard("{ArrowDown}");
    expect(screen.getByText(/Bijan Robinson, RB, ATL/)).toBeInTheDocument();
    rerender(<DraftBoard {...props} draftedPlayerIds={new Set(["p5"])} />);
    expect(screen.queryByText(/Press Enter to log/)).not.toBeInTheDocument();
  });

  it("focuses search on slash, except from another field or behind a dialog", () => {
    renderBoard();
    fireEvent.keyDown(document.body, { key: "/" });
    expect(search()).toHaveFocus();

    search().blur();
    const other = document.createElement("input");
    document.body.appendChild(other);
    other.focus();
    fireEvent.keyDown(other, { key: "/" });
    expect(other).toHaveFocus();
    other.remove();

    fireEvent.keyDown(document.body, { key: "/", ctrlKey: true });
    expect(search()).not.toHaveFocus();

    const dialog = document.createElement("div");
    dialog.setAttribute("aria-modal", "true");
    document.body.appendChild(dialog);
    fireEvent.keyDown(document.body, { key: "/" });
    expect(search()).not.toHaveFocus();
    dialog.remove();
  });
});
