import {
  cardName,
  createShoe,
  describeHand,
  handTotal,
  isNatural,
  isPair,
  orderedShoe,
  type Card,
  type Rank,
} from "../cards";
import { COUNTING_SYSTEMS, HI_LO, REKO, formatCount, getCountingSystem, runningCount } from "../counting";
import {
  allowedActions,
  applyAction,
  bestAction,
  dealRound,
  dealerShouldHit,
  describeSituation,
  needsShuffle,
  roundUnits,
} from "../round";
import { basicStrategyAction, buildStrategyChart, DEALER_UPCARDS, type PlayOptions } from "../strategy";
import { DEFAULT_TABLE_RULES, TABLE_RULES, getTableRules, payoutLabel } from "../tableRules";

const card = (rank: Rank): Card => ({ rank, suit: "spades" });
const hand = (...ranks: Rank[]): Card[] => ranks.map(card);
/** A shoe that deals player, dealer up, player, dealer hole, then the rest in order. */
const shoe = (...ranks: Rank[]): Card[] => ranks.map(card);

const S17 = getTableRules("s17-3to2");
const H17 = getTableRules("h17-3to2");
const SIX_TO_FIVE = getTableRules("h17-6to5");
const NO_DAS = getTableRules("s17-no-das");

describe("cards", () => {
  it("builds 52 cards a deck and keeps every card through a shuffle", () => {
    expect(orderedShoe(1)).toHaveLength(52);
    const six = createShoe(6, () => 0.42);
    expect(six).toHaveLength(312);
    expect(six.filter((c) => c.rank === "A")).toHaveLength(24);
  });

  it("counts an ace as 11 until the hand would bust", () => {
    expect(handTotal(hand("A", "7"))).toEqual({ total: 18, soft: true });
    expect(handTotal(hand("A", "7", "9"))).toEqual({ total: 17, soft: false });
    expect(handTotal(hand("A", "A"))).toEqual({ total: 12, soft: true });
    expect(handTotal(hand("K", "Q", "5"))).toEqual({ total: 25, soft: false });
  });

  it("names naturals, pairs, and hands", () => {
    expect(isNatural(hand("A", "K"))).toBe(true);
    expect(isNatural(hand("7", "7", "7"))).toBe(false);
    expect(isPair(hand("K", "10"))).toBe(true);
    expect(isPair(hand("9", "8"))).toBe(false);
    expect(describeHand(hand("8", "8"))).toBe("Pair of 8s");
    expect(describeHand(hand("A", "A"))).toBe("Pair of aces");
    expect(describeHand(hand("A", "6"))).toBe("Soft 17");
    expect(describeHand(hand("10", "6"))).toBe("Hard 16");
    expect(cardName({ rank: "A", suit: "hearts" })).toBe("Ace of hearts");
  });
});

describe("basic strategy", () => {
  const play = (ranks: Rank[], up: Rank, rules = S17, options?: PlayOptions) =>
    basicStrategyAction(hand(...ranks), card(up), rules, options);

  it("plays the hard totals", () => {
    expect(play(["10", "7"], "A")).toBe("stand");
    expect(play(["10", "3"], "6")).toBe("stand");
    expect(play(["10", "3"], "7")).toBe("hit");
    expect(play(["10", "2"], "3")).toBe("hit");
    expect(play(["10", "2"], "4")).toBe("stand");
    expect(play(["6", "5"], "10")).toBe("double");
    expect(play(["6", "4"], "10")).toBe("hit");
    expect(play(["6", "4"], "9")).toBe("double");
    expect(play(["5", "4"], "2")).toBe("hit");
    expect(play(["5", "4"], "3")).toBe("double");
    expect(play(["5", "3"], "6")).toBe("hit");
  });

  it("plays the soft totals", () => {
    expect(play(["A", "9"], "6")).toBe("stand");
    expect(play(["A", "7"], "2")).toBe("stand");
    expect(play(["A", "7"], "3")).toBe("double");
    expect(play(["A", "7"], "8")).toBe("stand");
    expect(play(["A", "7"], "9")).toBe("hit");
    expect(play(["A", "6"], "2")).toBe("hit");
    expect(play(["A", "6"], "3")).toBe("double");
    expect(play(["A", "4"], "4")).toBe("double");
    expect(play(["A", "2"], "4")).toBe("hit");
    expect(play(["A", "2"], "5")).toBe("double");
  });

  it("plays the pairs", () => {
    expect(play(["A", "A"], "A")).toBe("split");
    expect(play(["8", "8"], "10")).toBe("split");
    expect(play(["10", "K"], "6")).toBe("stand");
    expect(play(["5", "5"], "9")).toBe("double");
    expect(play(["9", "9"], "7")).toBe("stand");
    expect(play(["9", "9"], "8")).toBe("split");
    expect(play(["9", "9"], "10")).toBe("stand");
    expect(play(["7", "7"], "7")).toBe("split");
    expect(play(["7", "7"], "8")).toBe("hit");
    expect(play(["4", "4"], "5")).toBe("split");
    expect(play(["4", "4"], "4")).toBe("hit");
  });

  it("changes the plays that depend on the table", () => {
    // dealer hits soft 17
    expect(play(["6", "5"], "A", S17)).toBe("hit");
    expect(play(["6", "5"], "A", H17)).toBe("double");
    expect(play(["A", "7"], "2", H17)).toBe("double");
    expect(play(["A", "8"], "6", S17)).toBe("stand");
    expect(play(["A", "8"], "6", H17)).toBe("double");
    // double after split
    expect(play(["2", "2"], "2", S17)).toBe("split");
    expect(play(["2", "2"], "2", NO_DAS)).toBe("hit");
    expect(play(["6", "6"], "2", NO_DAS)).toBe("hit");
    expect(play(["4", "4"], "5", NO_DAS)).toBe("hit");
    // late surrender
    expect(play(["10", "6"], "9", S17)).toBe("surrender");
    expect(play(["10", "5"], "10", S17)).toBe("surrender");
    expect(play(["10", "5"], "A", S17)).toBe("hit");
    expect(play(["10", "5"], "A", H17)).toBe("surrender");
    expect(play(["10", "7"], "A", H17)).toBe("surrender");
    expect(play(["10", "6"], "10", SIX_TO_FIVE)).toBe("hit");
  });

  it("falls back when the hand can no longer double, split, or surrender", () => {
    const hitOnly: PlayOptions = { canDouble: false, canSplit: false, canSurrender: false };
    expect(play(["5", "4", "2"], "6", S17, hitOnly)).toBe("hit");
    expect(play(["A", "3", "4"], "5", S17, hitOnly)).toBe("stand");
    expect(play(["A", "2", "3"], "5", S17, hitOnly)).toBe("hit");
    expect(play(["7", "5", "4"], "10", S17, hitOnly)).toBe("hit");
    expect(play(["8", "8"], "10", S17, hitOnly)).toBe("hit");
    expect(play(["A", "A"], "6", S17, hitOnly)).toBe("hit");
  });

  it("prints a chart with one cell per upcard that matches the grader", () => {
    for (const rules of TABLE_RULES) {
      const chart = buildStrategyChart(rules);
      expect(chart.hard).toHaveLength(11);
      expect(chart.soft).toHaveLength(8);
      expect(chart.pairs).toHaveLength(10);
      for (const row of [...chart.hard, ...chart.soft, ...chart.pairs]) {
        expect(row.plays).toHaveLength(DEALER_UPCARDS.length);
      }
    }
    const chart = buildStrategyChart(S17);
    expect(chart.hard.find((row) => row.label === "16")?.plays).toEqual(
      ["S", "S", "S", "S", "S", "H", "H", "R", "R", "R"],
    );
    expect(chart.soft.find((row) => row.label === "A, 7")?.plays).toEqual(
      ["S", "Ds", "Ds", "Ds", "Ds", "S", "S", "H", "H", "H"],
    );
    expect(chart.pairs.find((row) => row.label === "A, A")?.plays.every((cell) => cell === "P")).toBe(true);
    expect(chart.pairs.find((row) => row.label === "5, 5")?.plays[0]).toBe("D");
  });
});

describe("table rules", () => {
  it("falls back to the default table for an unknown id", () => {
    expect(getTableRules("nope")).toBe(DEFAULT_TABLE_RULES);
    expect(getTableRules(undefined)).toBe(DEFAULT_TABLE_RULES);
    expect(payoutLabel(SIX_TO_FIVE)).toBe("6 to 5");
    expect(new Set(TABLE_RULES.map((rules) => rules.id)).size).toBe(TABLE_RULES.length);
    expect(TABLE_RULES.every((rules) => rules.decks >= 4)).toBe(true);
  });
});

describe("round", () => {
  it("deals player first and waits for a decision", () => {
    const round = dealRound(shoe("10", "6", "5", "9", "2"), S17);
    expect(round.hands[0].cards.map((c) => c.rank)).toEqual(["10", "5"]);
    expect(round.dealer.map((c) => c.rank)).toEqual(["6", "9"]);
    expect(round.phase).toBe("player");
    expect(allowedActions(round)).toEqual(["hit", "stand", "double", "surrender"]);
    expect(bestAction(round)).toBe("stand");
    expect(describeSituation(round)).toBe("Hard 15 against 6");
  });

  it("settles on the deal when either side has a blackjack", () => {
    const player = dealRound(shoe("A", "9", "K", "8"), S17);
    expect(player.phase).toBe("settled");
    expect(player.results).toEqual([{ outcome: "blackjack", units: 1.5 }]);
    expect(dealRound(shoe("A", "9", "K", "8"), SIX_TO_FIVE).results?.[0].units).toBe(1.2);

    const dealer = dealRound(shoe("10", "A", "9", "K"), S17);
    expect(dealer.results).toEqual([{ outcome: "loss", units: -1 }]);
    expect(allowedActions(dealer)).toEqual([]);
    expect(bestAction(dealer)).toBeNull();

    expect(dealRound(shoe("A", "K", "Q", "A"), S17).results).toEqual([{ outcome: "push", units: 0 }]);
  });

  it("plays the dealer out after a stand and scores the hand", () => {
    // player 10, 9; dealer 6, 10 draws a 5 for 21
    const lost = applyAction(dealRound(shoe("10", "6", "9", "10", "5"), S17), "stand");
    expect(lost.dealer.map((c) => c.rank)).toEqual(["6", "10", "5"]);
    expect(lost.results).toEqual([{ outcome: "loss", units: -1 }]);

    // dealer 6, 10 draws a king and busts
    const won = applyAction(dealRound(shoe("10", "6", "9", "10", "K"), S17), "stand");
    expect(won.results).toEqual([{ outcome: "win", units: 1 }]);
    expect(roundUnits(won)).toBe(1);
  });

  it("ends the hand on a bust without drawing for the dealer", () => {
    const round = applyAction(dealRound(shoe("10", "6", "6", "10", "K", "5"), S17), "hit");
    expect(round.results).toEqual([{ outcome: "bust", units: -1 }]);
    expect(round.dealer).toHaveLength(2);
  });

  it("doubles for two units and one card", () => {
    // player 6, 5 doubles into a 10 for 21; dealer 10, 8 stands on 18
    const round = applyAction(dealRound(shoe("6", "10", "5", "8", "10"), S17), "double");
    expect(round.hands[0].cards).toHaveLength(3);
    expect(round.results).toEqual([{ outcome: "win", units: 2 }]);
  });

  it("surrenders for half a unit", () => {
    const round = applyAction(dealRound(shoe("10", "10", "6", "7"), S17), "surrender");
    expect(round.results).toEqual([{ outcome: "surrender", units: -0.5 }]);
    expect(round.dealer).toHaveLength(2);
  });

  it("splits into two hands, plays them in order, and scores each", () => {
    // player 8, 8 against 6, 10; split draws 3 and 2, then 10 on the double, 9 on the hit, dealer draws K
    let round = dealRound(shoe("8", "6", "8", "10", "3", "2", "10", "9", "K"), S17);
    expect(bestAction(round)).toBe("split");
    round = applyAction(round, "split");
    expect(round.hands.map((h) => h.cards.map((c) => c.rank))).toEqual([["8", "3"], ["8", "2"]]);
    expect(round.active).toBe(0);
    expect(allowedActions(round)).toEqual(["hit", "stand", "double"]);

    round = applyAction(round, "double");
    expect(round.active).toBe(1);
    expect(round.phase).toBe("player");

    round = applyAction(round, "hit");
    round = applyAction(round, "stand");
    expect(round.phase).toBe("settled");
    expect(round.results).toEqual([
      { outcome: "win", units: 2 },
      { outcome: "win", units: 1 },
    ]);
    expect(roundUnits(round)).toBe(3);
  });

  it("gives split aces one card each and never pays them as blackjack", () => {
    const round = applyAction(dealRound(shoe("A", "6", "A", "10", "K", "9", "2"), S17), "split");
    expect(round.phase).toBe("settled");
    expect(round.hands.every((h) => h.cards.length === 2)).toBe(true);
    // dealer 6, 10 draws a 2 for 18
    expect(round.results).toEqual([
      { outcome: "win", units: 1 },
      { outcome: "win", units: 1 },
    ]);
  });

  it("refuses double after split where the table does not allow it, and stops at the hand limit", () => {
    let round = applyAction(dealRound(shoe("8", "6", "8", "10", "3", "2"), NO_DAS), "split");
    expect(allowedActions(round)).toEqual(["hit", "stand"]);
    expect(applyAction(round, "double")).toBe(round);

    round = dealRound(shoe("8", "6", "8", "10", "8", "8", "8", "8", "8", "8"), S17);
    round = applyAction(round, "split");
    round = applyAction(round, "split");
    round = applyAction(round, "split");
    expect(round.hands).toHaveLength(4);
    expect(allowedActions(round)).not.toContain("split");
    expect(describeSituation(round)).toBe("Hard 16 against 6");
    expect(bestAction(round)).toBe("stand");
  });

  it("follows the soft 17 rule for the dealer and reshuffles at a quarter of the shoe", () => {
    expect(dealerShouldHit(hand("A", "6"), S17)).toBe(false);
    expect(dealerShouldHit(hand("A", "6"), H17)).toBe(true);
    expect(dealerShouldHit(hand("10", "7"), H17)).toBe(false);
    expect(dealerShouldHit(hand("10", "6"), S17)).toBe(true);
    expect(needsShuffle(orderedShoe(1), S17)).toBe(true);
    expect(needsShuffle(orderedShoe(6), S17)).toBe(false);
  });
});

describe("counting", () => {
  it("sums a full deck to zero in Hi-Lo and to plus four in REKO", () => {
    const deck = orderedShoe(1);
    expect(runningCount(deck, HI_LO)).toBe(0);
    expect(runningCount(deck, REKO)).toBe(4);
  });

  it("tags the seven differently in the two systems", () => {
    expect(HI_LO.tag(card("7"))).toBe(0);
    expect(REKO.tag(card("7"))).toBe(1);
    expect(HI_LO.tag(card("A"))).toBe(-1);
    expect(HI_LO.tag(card("2"))).toBe(1);
    expect(REKO.tag(card("9"))).toBe(0);
  });

  it("looks a system up by id and formats a count", () => {
    expect(getCountingSystem("reko")).toBe(REKO);
    expect(getCountingSystem("nope")).toBe(HI_LO);
    expect(COUNTING_SYSTEMS).toHaveLength(2);
    expect([formatCount(3), formatCount(0), formatCount(-2)]).toEqual(["+3", "0", "-2"]);
  });
});
