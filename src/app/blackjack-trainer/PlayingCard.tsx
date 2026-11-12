import { SUIT_GLYPH, cardName, isRedSuit, type Card } from "@/lib/blackjack/cards";

/** One card, face up, or face down when `card` is null. The rank and suit are text, so the card needs no image. */
export function PlayingCard({ card, large = false }: { card: Card | null; large?: boolean }) {
  if (!card) {
    return <span className="bj-card bj-card-back" role="img" aria-label="Face-down card" />;
  }
  return (
    <span
      className="bj-card"
      data-red={isRedSuit(card.suit) ? "true" : undefined}
      data-large={large ? "true" : undefined}
      role="img"
      aria-label={cardName(card)}
    >
      <span aria-hidden="true" className="bj-card-rank">
        {card.rank}
      </span>
      <span aria-hidden="true" className="bj-card-suit">
        {SUIT_GLYPH[card.suit]}
      </span>
    </span>
  );
}
