/**
 * Table rule sets for the blackjack trainer. Every set is a shoe game of four
 * decks or more with a dealer who peeks for blackjack, because the strategy in
 * `strategy.ts` is the multi-deck chart and single-deck, double-deck, and
 * no-hole-card games each change a few plays.
 */

export interface TableRules {
  id: string;
  label: string;
  /** One line that names what is different about this table. */
  summary: string;
  decks: number;
  dealerHitsSoft17: boolean;
  doubleAfterSplit: boolean;
  /** Late surrender, offered on the first two cards after the dealer peeks. */
  surrender: boolean;
  /** 1.5 pays 3 to 2 and 1.2 pays 6 to 5. */
  blackjackPayout: 1.5 | 1.2;
  /** Split hands allowed in total, the first hand included. */
  maxHands: number;
}

export const TABLE_RULES: readonly TableRules[] = [
  {
    id: "s17-3to2",
    label: "6 decks, dealer stands on soft 17",
    summary: "Blackjack pays 3 to 2, double after split, late surrender.",
    decks: 6,
    dealerHitsSoft17: false,
    doubleAfterSplit: true,
    surrender: true,
    blackjackPayout: 1.5,
    maxHands: 4,
  },
  {
    id: "h17-3to2",
    label: "6 decks, dealer hits soft 17",
    summary: "Blackjack pays 3 to 2, double after split, late surrender.",
    decks: 6,
    dealerHitsSoft17: true,
    doubleAfterSplit: true,
    surrender: true,
    blackjackPayout: 1.5,
    maxHands: 4,
  },
  {
    id: "h17-6to5",
    label: "6 decks, 6 to 5 blackjack",
    summary: "Dealer hits soft 17, blackjack pays 6 to 5, double after split, no surrender.",
    decks: 6,
    dealerHitsSoft17: true,
    doubleAfterSplit: true,
    surrender: false,
    blackjackPayout: 1.2,
    maxHands: 4,
  },
  {
    id: "s17-8deck",
    label: "8 decks, dealer stands on soft 17",
    summary: "Blackjack pays 3 to 2, double after split, late surrender.",
    decks: 8,
    dealerHitsSoft17: false,
    doubleAfterSplit: true,
    surrender: true,
    blackjackPayout: 1.5,
    maxHands: 4,
  },
  {
    id: "s17-no-das",
    label: "6 decks, no double after split",
    summary: "Dealer stands on soft 17, blackjack pays 3 to 2, no surrender.",
    decks: 6,
    dealerHitsSoft17: false,
    doubleAfterSplit: false,
    surrender: false,
    blackjackPayout: 1.5,
    maxHands: 4,
  },
];

export const DEFAULT_TABLE_RULES: TableRules = TABLE_RULES[0];

export function getTableRules(id: unknown): TableRules {
  return TABLE_RULES.find((rules) => rules.id === id) ?? DEFAULT_TABLE_RULES;
}

export function payoutLabel(rules: TableRules): string {
  return rules.blackjackPayout === 1.5 ? "3 to 2" : "6 to 5";
}
