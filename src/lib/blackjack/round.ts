/**
 * One round of blackjack as pure state transitions. The table deals from a
 * shoe that carries over between rounds, the dealer peeks for blackjack under
 * an ace or a ten, and results come back in betting units so a double, a
 * surrender, and a 6 to 5 blackjack all show up in the running total.
 */

import {
  cardValue,
  createShoe,
  describeHand,
  describeUpcard,
  handTotal,
  isBust,
  isNatural,
  isPair,
  type Card,
} from "./cards";
import { basicStrategyAction, type PlayerAction, type PlayOptions } from "./strategy";
import type { TableRules } from "./tableRules";

export interface PlayerHand {
  cards: Card[];
  /** 1 unit, or 2 once doubled. */
  bet: number;
  fromSplit: boolean;
  /** Split aces take one card each and stop. */
  splitAces: boolean;
  surrendered: boolean;
  done: boolean;
}

export type HandOutcome = "blackjack" | "win" | "push" | "loss" | "bust" | "surrender";

export interface HandResult {
  outcome: HandOutcome;
  /** Net betting units for the hand, negative for a loss. */
  units: number;
}

export interface RoundState {
  rules: TableRules;
  shoe: Card[];
  dealer: Card[];
  hands: PlayerHand[];
  /** Index of the hand being played. */
  active: number;
  phase: "player" | "settled";
  /** Null until the round settles, then one result per hand. */
  results: HandResult[] | null;
}

export const OUTCOME_LABEL: Record<HandOutcome, string> = {
  blackjack: "Blackjack",
  win: "Win",
  push: "Push",
  loss: "Loss",
  bust: "Bust",
  surrender: "Surrendered",
};

/** The shoe is reshuffled between rounds once a quarter of it is left. */
export function needsShuffle(shoe: readonly Card[], rules: TableRules): boolean {
  return shoe.length < rules.decks * 13;
}

function newHand(cards: Card[], fromSplit = false): PlayerHand {
  return { cards, bet: 1, fromSplit, splitAces: false, surrendered: false, done: false };
}

/** Takes the top card. A shoe cannot run dry between cut cards, and this refills it if a test hands in a short one. */
function draw(shoe: Card[], rules: TableRules): Card {
  if (shoe.length === 0) shoe.push(...createShoe(rules.decks));
  return shoe.shift() as Card;
}

export function dealerShouldHit(cards: readonly Card[], rules: TableRules): boolean {
  const { total, soft } = handTotal(cards);
  if (total < 17) return true;
  return total === 17 && soft && rules.dealerHitsSoft17;
}

function settleHand(hand: PlayerHand, dealer: readonly Card[], rules: TableRules): HandResult {
  if (hand.surrendered) return { outcome: "surrender", units: -0.5 };
  const player = handTotal(hand.cards).total;
  if (player > 21) return { outcome: "bust", units: -hand.bet };

  const dealerNatural = isNatural(dealer);
  const playerNatural = !hand.fromSplit && isNatural(hand.cards);
  if (playerNatural) {
    return dealerNatural
      ? { outcome: "push", units: 0 }
      : { outcome: "blackjack", units: rules.blackjackPayout };
  }
  if (dealerNatural) return { outcome: "loss", units: -hand.bet };

  const dealerTotal = handTotal(dealer).total;
  if (dealerTotal > 21 || player > dealerTotal) return { outcome: "win", units: hand.bet };
  if (player < dealerTotal) return { outcome: "loss", units: -hand.bet };
  return { outcome: "push", units: 0 };
}

/** Plays the dealer out when a hand is still live, then scores every hand. */
function settle(state: RoundState): RoundState {
  const shoe = [...state.shoe];
  const dealer = [...state.dealer];
  const anyLive = state.hands.some(
    (hand) => !hand.surrendered && !isBust(hand.cards) && !(isNatural(hand.cards) && !hand.fromSplit),
  );
  if (anyLive && !isNatural(dealer)) {
    while (dealerShouldHit(dealer, state.rules)) dealer.push(draw(shoe, state.rules));
  }
  return {
    ...state,
    shoe,
    dealer,
    phase: "settled",
    results: state.hands.map((hand) => settleHand(hand, dealer, state.rules)),
  };
}

/**
 * Deals a new round from the top of `shoe`, player first. The round settles on
 * the deal when either side has a blackjack, since the dealer peeks before the
 * player acts.
 */
export function dealRound(shoe: readonly Card[], rules: TableRules): RoundState {
  const remaining = [...shoe];
  const playerFirst = draw(remaining, rules);
  const dealerUp = draw(remaining, rules);
  const playerSecond = draw(remaining, rules);
  const dealerHole = draw(remaining, rules);

  const state: RoundState = {
    rules,
    shoe: remaining,
    dealer: [dealerUp, dealerHole],
    hands: [newHand([playerFirst, playerSecond])],
    active: 0,
    phase: "player",
    results: null,
  };

  if (isNatural(state.dealer) || isNatural(state.hands[0].cards)) {
    return settle({ ...state, hands: [{ ...state.hands[0], done: true }] });
  }
  return state;
}

/** What the active hand may still do under this table's rules. */
export function playOptions(state: RoundState): PlayOptions {
  const hand = state.hands[state.active];
  if (state.phase !== "player" || !hand || hand.done) {
    return { canDouble: false, canSplit: false, canSurrender: false };
  }
  const firstTwo = hand.cards.length === 2;
  return {
    canDouble: firstTwo && (!hand.fromSplit || state.rules.doubleAfterSplit),
    canSplit: isPair(hand.cards) && state.hands.length < state.rules.maxHands,
    canSurrender: state.rules.surrender && firstTwo && !hand.fromSplit && state.hands.length === 1,
  };
}

export function allowedActions(state: RoundState): PlayerAction[] {
  if (state.phase !== "player") return [];
  const options = playOptions(state);
  const actions: PlayerAction[] = ["hit", "stand"];
  if (options.canDouble) actions.push("double");
  if (options.canSplit) actions.push("split");
  if (options.canSurrender) actions.push("surrender");
  return actions;
}

/** The basic strategy action for the hand in play, or null once the round is settled. */
export function bestAction(state: RoundState): PlayerAction | null {
  const hand = state.hands[state.active];
  if (state.phase !== "player" || !hand) return null;
  return basicStrategyAction(hand.cards, state.dealer[0], state.rules, playOptions(state));
}

/** "Hard 16 against 10", the label a decision is filed under. */
export function describeSituation(state: RoundState): string {
  const hand = state.hands[state.active];
  if (!hand) return "";
  const { canSplit } = playOptions(state);
  const { total, soft } = handTotal(hand.cards);
  const name = canSplit ? describeHand(hand.cards) : `${soft ? "Soft" : "Hard"} ${total}`;
  return `${name} against ${describeUpcard(state.dealer[0])}`;
}

/** Moves to the next hand that still needs a decision, or settles the round. */
function advance(state: RoundState): RoundState {
  const hands = state.hands.map((hand) =>
    !hand.done && handTotal(hand.cards).total >= 21 ? { ...hand, done: true } : hand,
  );
  const next = hands.findIndex((hand) => !hand.done);
  if (next === -1) return settle({ ...state, hands });
  return { ...state, hands, active: next };
}

/** Applies one player action. An action the hand may not take returns the state unchanged. */
export function applyAction(state: RoundState, action: PlayerAction): RoundState {
  if (!allowedActions(state).includes(action)) return state;

  const shoe = [...state.shoe];
  const hands = state.hands.map((hand) => ({ ...hand, cards: [...hand.cards] }));
  const hand = hands[state.active];

  switch (action) {
    case "hit":
      hand.cards.push(draw(shoe, state.rules));
      break;
    case "stand":
      hand.done = true;
      break;
    case "double":
      hand.cards.push(draw(shoe, state.rules));
      hand.bet = 2;
      hand.done = true;
      break;
    case "surrender":
      hand.surrendered = true;
      hand.done = true;
      break;
    case "split": {
      const aces = cardValue(hand.cards[0]) === 11;
      const [first, second] = hand.cards;
      const left: PlayerHand = { ...newHand([first, draw(shoe, state.rules)], true), splitAces: aces, done: aces };
      const right: PlayerHand = { ...newHand([second, draw(shoe, state.rules)], true), splitAces: aces, done: aces };
      hands.splice(state.active, 1, left, right);
      break;
    }
  }

  return advance({ ...state, shoe, hands });
}

/** Net units across the round's hands, or 0 before it settles. */
export function roundUnits(state: RoundState): number {
  return (state.results ?? []).reduce((sum, result) => sum + result.units, 0);
}
