/**
 * Cards, shoes, and hand totals for the blackjack trainer. Framework-free, and
 * the shuffle takes its random source as an argument so a test can deal a
 * known shoe.
 */

export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  rank: Rank;
  suit: Suit;
}

export const SUITS: readonly Suit[] = ["spades", "hearts", "diamonds", "clubs"];
export const RANKS: readonly Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const SUIT_GLYPH: Record<Suit, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

const RANK_NAME: Record<Rank, string> = {
  A: "Ace",
  "2": "Two",
  "3": "Three",
  "4": "Four",
  "5": "Five",
  "6": "Six",
  "7": "Seven",
  "8": "Eight",
  "9": "Nine",
  "10": "Ten",
  J: "Jack",
  Q: "Queen",
  K: "King",
};

/** "Ace of spades", for the card's accessible name. */
export function cardName(card: Card): string {
  return `${RANK_NAME[card.rank]} of ${card.suit}`;
}

export function isRedSuit(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

/** An ace counts 11 here, and `handTotal` drops it to 1 when the hand needs it. */
export function cardValue(card: Card): number {
  if (card.rank === "A") return 11;
  if (card.rank === "J" || card.rank === "Q" || card.rank === "K") return 10;
  return Number(card.rank);
}

/** The unshuffled cards of `decks` standard decks. */
export function orderedShoe(decks = 1): Card[] {
  const cards: Card[] = [];
  for (let deck = 0; deck < decks; deck += 1) {
    for (const suit of SUITS) {
      for (const rank of RANKS) cards.push({ rank, suit });
    }
  }
  return cards;
}

/** Fisher-Yates over a copy. `random` returns a number in [0, 1). */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function createShoe(decks = 1, random: () => number = Math.random): Card[] {
  return shuffle(orderedShoe(decks), random);
}

export interface HandTotal {
  total: number;
  /** True while an ace still counts as 11. */
  soft: boolean;
}

export function handTotal(cards: readonly Card[]): HandTotal {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += cardValue(card);
    if (card.rank === "A") aces += 1;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0 };
}

export function isBust(cards: readonly Card[]): boolean {
  return handTotal(cards).total > 21;
}

/** A two-card 21. A 21 made after a split is not a blackjack, and the round engine tracks that. */
export function isNatural(cards: readonly Card[]): boolean {
  return cards.length === 2 && handTotal(cards).total === 21;
}

/** Two cards of the same value, so a king and a ten count as a pair of tens. */
export function isPair(cards: readonly Card[]): boolean {
  return cards.length === 2 && cardValue(cards[0]) === cardValue(cards[1]);
}

/** "Soft 18", "Hard 16", "Pair of 8s", "Pair of aces", for mistake labels. */
export function describeHand(cards: readonly Card[]): string {
  if (isPair(cards)) {
    const value = cardValue(cards[0]);
    return value === 11 ? "Pair of aces" : `Pair of ${value}s`;
  }
  const { total, soft } = handTotal(cards);
  return `${soft ? "Soft" : "Hard"} ${total}`;
}

/** "ace", "10", "7", for the dealer's side of a mistake label. */
export function describeUpcard(card: Card): string {
  const value = cardValue(card);
  return value === 11 ? "ace" : String(value);
}
