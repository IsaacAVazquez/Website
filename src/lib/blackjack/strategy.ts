/**
 * Basic strategy for shoe games of four to eight decks where the dealer peeks
 * for blackjack. One function reads the chart, and both the grader at the table
 * and the printed chart call it, so the two cannot disagree.
 *
 * The plays that depend on the table are the ones the rule sets vary: whether
 * the dealer hits soft 17, whether a split hand may double, and whether late
 * surrender is offered. Single-deck, double-deck, and no-hole-card games change
 * a few more plays and are outside this chart.
 */

import { cardValue, handTotal, isPair, type Card } from "./cards";
import type { TableRules } from "./tableRules";

export type PlayerAction = "hit" | "stand" | "double" | "split" | "surrender";

/**
 * A chart cell. `D` doubles and falls back to a hit, `Ds` doubles and falls
 * back to a stand, `R` surrenders and falls back to a hit, and `Rs` surrenders
 * and falls back to a stand.
 */
export type ChartPlay = "H" | "S" | "D" | "Ds" | "P" | "R" | "Rs";

export const ACTION_LABEL: Record<PlayerAction, string> = {
  hit: "Hit",
  stand: "Stand",
  double: "Double",
  split: "Split",
  surrender: "Surrender",
};

export const CHART_PLAY_LABEL: Record<ChartPlay, string> = {
  H: "Hit",
  S: "Stand",
  D: "Double, or hit if you can't",
  Ds: "Double, or stand if you can't",
  P: "Split",
  R: "Surrender, or hit if you can't",
  Rs: "Surrender, or stand if you can't",
};

/** Dealer upcards in chart order, with 11 standing for the ace. */
export const DEALER_UPCARDS: readonly number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function between(value: number, low: number, high: number): boolean {
  return value >= low && value <= high;
}

/** The pair row. `null` means the pair is not split and plays as its total. */
export function pairPlay(pairValue: number, up: number, rules: TableRules): ChartPlay | null {
  const das = rules.doubleAfterSplit;
  switch (pairValue) {
    case 11:
    case 8:
      return "P";
    case 9:
      return up === 7 || up >= 10 ? "S" : "P";
    case 7:
      return between(up, 2, 7) ? "P" : null;
    case 6:
      return between(up, das ? 2 : 3, 6) ? "P" : null;
    case 4:
      return das && between(up, 5, 6) ? "P" : null;
    case 3:
    case 2:
      return between(up, das ? 2 : 4, 7) ? "P" : null;
    default:
      // Fives play as a hard 10 and tens as a hard 20.
      return null;
  }
}

export function softPlay(total: number, up: number, rules: TableRules): ChartPlay {
  if (total >= 20) return "S";
  if (total === 19) return rules.dealerHitsSoft17 && up === 6 ? "Ds" : "S";
  if (total === 18) {
    if (between(up, rules.dealerHitsSoft17 ? 2 : 3, 6)) return "Ds";
    return up <= 8 ? "S" : "H";
  }
  if (total === 17) return between(up, 3, 6) ? "D" : "H";
  if (total >= 15) return between(up, 4, 6) ? "D" : "H";
  if (total >= 13) return between(up, 5, 6) ? "D" : "H";
  return "H";
}

export function hardPlay(total: number, up: number, rules: TableRules): ChartPlay {
  if (total >= 17) {
    return total === 17 && up === 11 && rules.surrender && rules.dealerHitsSoft17 ? "Rs" : "S";
  }
  if (total >= 13) {
    if (rules.surrender) {
      if (total === 16 && up >= 9) return "R";
      if (total === 15 && (up === 10 || (up === 11 && rules.dealerHitsSoft17))) return "R";
    }
    return up <= 6 ? "S" : "H";
  }
  if (total === 12) return between(up, 4, 6) ? "S" : "H";
  if (total === 11) return up <= 10 || rules.dealerHitsSoft17 ? "D" : "H";
  if (total === 10) return up <= 9 ? "D" : "H";
  if (total === 9) return between(up, 3, 6) ? "D" : "H";
  return "H";
}

export interface PlayOptions {
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
}

/** What the first two cards of a fresh hand may do. */
export const FULL_OPTIONS: PlayOptions = { canDouble: true, canSplit: true, canSurrender: true };

function resolve(play: ChartPlay, options: PlayOptions): PlayerAction {
  switch (play) {
    case "H":
      return "hit";
    case "S":
      return "stand";
    case "D":
      return options.canDouble ? "double" : "hit";
    case "Ds":
      return options.canDouble ? "double" : "stand";
    case "P":
      return "split";
    case "R":
      return options.canSurrender ? "surrender" : "hit";
    case "Rs":
      return options.canSurrender ? "surrender" : "stand";
  }
}

/** The chart cell for a hand, before the options narrow it to an action. */
export function chartPlayFor(
  cards: readonly Card[],
  dealerUp: Card,
  rules: TableRules,
  canSplit = true,
): ChartPlay {
  const up = cardValue(dealerUp);
  if (canSplit && isPair(cards)) {
    const split = pairPlay(cardValue(cards[0]), up, rules);
    if (split) return split;
  }
  const { total, soft } = handTotal(cards);
  return soft ? softPlay(total, up, rules) : hardPlay(total, up, rules);
}

/** The basic strategy action for this hand, given what the hand may still do. */
export function basicStrategyAction(
  cards: readonly Card[],
  dealerUp: Card,
  rules: TableRules,
  options: PlayOptions = FULL_OPTIONS,
): PlayerAction {
  return resolve(chartPlayFor(cards, dealerUp, rules, options.canSplit), options);
}

export interface ChartRow {
  label: string;
  plays: ChartPlay[];
}

export interface StrategyChart {
  hard: ChartRow[];
  soft: ChartRow[];
  pairs: ChartRow[];
}

const PAIR_LABEL: Record<number, string> = {
  2: "2, 2",
  3: "3, 3",
  4: "4, 4",
  5: "5, 5",
  6: "6, 6",
  7: "7, 7",
  8: "8, 8",
  9: "9, 9",
  10: "10, 10",
  11: "A, A",
};

/** The three chart tables for a rule set, one cell per dealer upcard. */
export function buildStrategyChart(rules: TableRules): StrategyChart {
  const row = (label: string, play: (up: number) => ChartPlay): ChartRow => ({
    label,
    plays: DEALER_UPCARDS.map(play),
  });

  const hard: ChartRow[] = [row("8 or less", (up) => hardPlay(8, up, rules))];
  for (let total = 9; total <= 16; total += 1) {
    hard.push(row(String(total), (up) => hardPlay(total, up, rules)));
  }
  hard.push(row("17", (up) => hardPlay(17, up, rules)));
  hard.push(row("18 or more", (up) => hardPlay(18, up, rules)));

  const soft: ChartRow[] = [];
  for (let total = 13; total <= 20; total += 1) {
    soft.push(row(`A, ${total - 11}`, (up) => softPlay(total, up, rules)));
  }

  const pairs: ChartRow[] = [];
  for (let value = 2; value <= 11; value += 1) {
    pairs.push(
      row(PAIR_LABEL[value], (up) => {
        const split = pairPlay(value, up, rules);
        if (split) return split;
        return value === 11 ? softPlay(12, up, rules) : hardPlay(value * 2, up, rules);
      }),
    );
  }

  return { hard, soft, pairs };
}
