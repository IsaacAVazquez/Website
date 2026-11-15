import { fireEvent, render, screen, within } from "@testing-library/react";
import type { Card, Rank } from "@/lib/blackjack/cards";
import { BLACKJACK_PROGRESS_STORAGE_KEY, parseBlackjackProgress } from "@/lib/blackjack/progress";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { BlackjackTrainerClient } from "../blackjack-trainer-client";

const cards = (...ranks: Rank[]): Card[] => ranks.map((rank) => ({ rank, suit: "spades" }));
/** Pads a known opening with low cards so the shoe is long enough to skip a reshuffle. */
const shoeOf = (...ranks: Rank[]) => () => [...cards(...ranks), ...Array.from({ length: 100 }, () => cards("2")[0])];

const saved = () => parseBlackjackProgress(window.localStorage.getItem(BLACKJACK_PROGRESS_STORAGE_KEY));

describe("BlackjackTrainerClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  it("renders the table with one h1 and waits for a deal", () => {
    render(<BlackjackTrainerClient />);
    expect(screen.getByRole("heading", { level: 1, name: "Blackjack Trainer" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Table" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: /Deal a hand/ })).toBeVisible();
    expect(screen.getByText("No decisions graded yet this visit.")).toBeVisible();
    expect(screen.getByText(/saved in this browser only/)).toBeVisible();
  });

  it("grades a correct stand, plays the dealer out, and saves the record", () => {
    // player 10, 9 against a dealer 6 with a 10 in the hole, who then draws a king and busts
    render(<BlackjackTrainerClient shuffleShoe={shoeOf("10", "6", "9", "10", "K")} />);
    fireEvent.click(screen.getByRole("button", { name: /Deal a hand/ }));

    expect(within(screen.getByLabelText("Dealer")).getByLabelText("Face-down card")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Split/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Surrender/ })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /Stand/ }));
    expect(screen.getByText("Correct. Hard 19 against 6 is a stand.")).toBeVisible();
    expect(screen.getByText("Win, the dealer busted with 26. Net +1 unit.")).toBeVisible();
    expect(screen.getByText(/1 of 1 decisions correct this visit, net \+1 units\./)).toBeVisible();
    expect(screen.getByRole("button", { name: /Deal next hand/ })).toBeVisible();
    expect(saved()).toMatchObject({ decisions: 1, correct: 1, hands: 1, wins: 1, netUnits: 1, mistakes: [] });
  });

  it("names the right play after a mistake and lists it under progress", () => {
    // player hard 16 against a ten, where the chart surrenders
    render(<BlackjackTrainerClient shuffleShoe={shoeOf("10", "10", "6", "7")} />);
    fireEvent.click(screen.getByRole("button", { name: /Deal a hand/ }));
    fireEvent.click(screen.getByRole("button", { name: "Show the play" }));
    expect(screen.getByText("Basic strategy here is to surrender.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /Stand/ }));
    expect(screen.getByText("Hard 16 against 10 is a surrender, and you stood.")).toBeVisible();

    fireEvent.click(screen.getByRole("tab", { name: "Progress" }));
    expect(screen.getByText("Hard 16 against 10")).toBeVisible();
    expect(screen.getByText("You stood, and the play is surrender.")).toBeVisible();
    expect(screen.getByText("0% of 1")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Reset progress" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear the record" }));
    expect(screen.getByText(/Nothing is recorded yet/)).toBeVisible();
    expect(saved().decisions).toBe(0);
  });

  it("plays from the keyboard and keeps the keys quiet on another view", () => {
    render(<BlackjackTrainerClient shuffleShoe={shoeOf("10", "6", "9", "10", "K")} />);
    fireEvent.keyDown(window, { key: "n" });
    expect(screen.getByRole("button", { name: /Stand/ })).toBeVisible();

    fireEvent.click(screen.getByRole("tab", { name: "Strategy chart" }));
    fireEvent.keyDown(window, { key: "s" });
    expect(saved().decisions).toBe(0);

    fireEvent.click(screen.getByRole("tab", { name: "Table" }));
    fireEvent.keyDown(window, { key: "s" });
    expect(saved().decisions).toBe(1);
  });

  it("keeps the chosen table and redraws the chart for it", () => {
    render(<BlackjackTrainerClient />);
    fireEvent.change(screen.getByLabelText("Table rules"), { target: { value: "h17-6to5" } });
    expect(saved().rulesId).toBe("h17-6to5");

    fireEvent.click(screen.getByRole("tab", { name: "Strategy chart" }));
    expect(screen.getByRole("table", { name: "Hard totals" })).toBeVisible();
    expect(screen.getByRole("table", { name: "Soft totals" })).toBeVisible();
    expect(screen.getByRole("table", { name: "Pairs" })).toBeVisible();
    // no surrender at this table, so the key leaves it out
    expect(within(screen.getByRole("list", { name: "Chart key" })).queryByText(/Surrender/)).not.toBeInTheDocument();
  });

  it("checks a running count in the counting drill", () => {
    render(<BlackjackTrainerClient shuffleDeck={() => cards("5", "K", "2", "3")} />);
    fireEvent.click(screen.getByRole("tab", { name: "Counting drill" }));
    fireEvent.click(screen.getByRole("button", { name: "Start counting" }));
    expect(screen.getByLabelText("Five of spades")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Add one" }));
    fireEvent.click(screen.getByRole("button", { name: "Check count" }));
    expect(screen.getByText("Correct, the running count is +1.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    fireEvent.click(screen.getByRole("button", { name: "Check count" }));
    expect(screen.getByText("The running count is 0, and you had +1.")).toBeVisible();
    expect(screen.getByText("1 of 2 checks correct this deck.")).toBeVisible();
    expect(saved()).toMatchObject({ countChecks: 2, countCorrect: 1 });
  });
});
