/**
 * Card counting systems for the counting drill. A system gives each card a tag
 * and the running count is the sum of the tags dealt so far.
 */

import { cardValue, type Card } from "./cards";

export interface CountingSystem {
  id: "hi-lo" | "reko";
  name: string;
  /** A balanced system sums to zero over a full deck. */
  balanced: boolean;
  description: string;
  tag: (card: Card) => number;
  /** The tag table, low cards first, for the legend. */
  groups: readonly { cards: string; tag: number }[];
}

export const HI_LO: CountingSystem = {
  id: "hi-lo",
  name: "Hi-Lo",
  balanced: true,
  description:
    "Twos through sixes count plus one, sevens through nines count zero, and tens and aces count minus one. A full deck sums to zero, so the running count is divided by the decks left to get a true count.",
  tag: (card) => {
    const value = cardValue(card);
    if (value <= 6) return 1;
    if (value >= 10) return -1;
    return 0;
  },
  groups: [
    { cards: "2 to 6", tag: 1 },
    { cards: "7 to 9", tag: 0 },
    { cards: "10 to ace", tag: -1 },
  ],
};

export const REKO: CountingSystem = {
  id: "reko",
  name: "REKO",
  balanced: false,
  description:
    "Twos through sevens count plus one, eights and nines count zero, and tens and aces count minus one. The seven makes the system unbalanced, so a full deck sums to plus four and the running count is used without a true count conversion.",
  tag: (card) => {
    const value = cardValue(card);
    if (value <= 7) return 1;
    if (value >= 10) return -1;
    return 0;
  },
  groups: [
    { cards: "2 to 7", tag: 1 },
    { cards: "8 and 9", tag: 0 },
    { cards: "10 to ace", tag: -1 },
  ],
};

export const COUNTING_SYSTEMS: readonly CountingSystem[] = [HI_LO, REKO];

export function getCountingSystem(id: unknown): CountingSystem {
  return COUNTING_SYSTEMS.find((system) => system.id === id) ?? HI_LO;
}

export function runningCount(cards: readonly Card[], system: CountingSystem): number {
  return cards.reduce((sum, card) => sum + system.tag(card), 0);
}

/** "+3", "0", "-2". */
export function formatCount(count: number): string {
  return count > 0 ? `+${count}` : String(count);
}
