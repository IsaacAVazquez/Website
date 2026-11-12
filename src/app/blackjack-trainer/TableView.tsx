"use client";

import { useEffect, useState } from "react";
import { cardValue, createShoe, handTotal, isNatural, type Card } from "@/lib/blackjack/cards";
import {
  formatUnits,
  recordDecision,
  recordResults,
  type BlackjackProgress,
} from "@/lib/blackjack/progress";
import {
  allowedActions,
  applyAction,
  bestAction,
  dealRound,
  describeSituation,
  needsShuffle,
  roundUnits,
  type HandResult,
  type PlayerHand,
  type RoundState,
} from "@/lib/blackjack/round";
import { ACTION_LABEL, type PlayerAction } from "@/lib/blackjack/strategy";
import { payoutLabel, type TableRules } from "@/lib/blackjack/tableRules";
import { PlayingCard } from "./PlayingCard";

interface Verdict {
  correct: boolean;
  text: string;
}

interface SessionTally {
  decisions: number;
  correct: number;
  units: number;
}

const ACTION_KEYS: { action: PlayerAction; key: string }[] = [
  { action: "hit", key: "H" },
  { action: "stand", key: "S" },
  { action: "double", key: "D" },
  { action: "split", key: "P" },
  { action: "surrender", key: "R" },
];

const CHOSE: Record<PlayerAction, string> = {
  hit: "hit",
  stand: "stood",
  double: "doubled",
  split: "split",
  surrender: "surrendered",
};

function verdictFor(situation: string, chose: PlayerAction, best: PlayerAction): Verdict {
  if (chose === best) {
    return { correct: true, text: `Correct. ${situation} is a ${best}.` };
  }
  return { correct: false, text: `${situation} is a ${best}, and you ${CHOSE[chose]}.` };
}

function resultSentence(hand: PlayerHand, result: HandResult, dealer: readonly Card[], rules: TableRules): string {
  const player = handTotal(hand.cards).total;
  const dealerTotal = handTotal(dealer).total;
  switch (result.outcome) {
    case "blackjack":
      return `Blackjack, paid ${payoutLabel(rules)}`;
    case "bust":
      return `Bust with ${player}`;
    case "surrender":
      return "Surrendered for half the bet";
    case "push":
      return `Push at ${player}`;
    case "win":
      return dealerTotal > 21 ? `Win, the dealer busted with ${dealerTotal}` : `Win, ${player} against ${dealerTotal}`;
    case "loss":
      return isNatural(dealer) ? "Loss, the dealer had blackjack" : `Loss, ${player} against ${dealerTotal}`;
  }
}

function totalLabel(cards: readonly Card[]): string {
  const { total, soft } = handTotal(cards);
  return soft && total < 21 ? `Soft ${total}` : String(total);
}

export function TableView({
  rules,
  update,
  shuffleShoe = createShoe,
  active = true,
}: {
  rules: TableRules;
  update: (updater: (current: BlackjackProgress) => BlackjackProgress) => void;
  /** Injected by tests to deal a known shoe. */
  shuffleShoe?: (decks: number) => Card[];
  /** False while another view is open, so the shortcut keys stay quiet there. */
  active?: boolean;
}) {
  const [round, setRound] = useState<RoundState | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [session, setSession] = useState<SessionTally>({ decisions: 0, correct: 0, units: 0 });

  // A round dealt under another table's rules is put away when the table changes.
  const current = round && round.rules.id === rules.id ? round : null;
  const playing = current?.phase === "player";
  const allowed = current ? allowedActions(current) : [];
  const best = current ? bestAction(current) : null;

  function deal() {
    if (playing) return;
    const carried = current?.shoe ?? [];
    const shoe = needsShuffle(carried, rules) ? shuffleShoe(rules.decks) : carried;
    const next = dealRound(shoe, rules);
    if (next.results) {
      const results = next.results;
      update((progress) => recordResults(progress, results));
      setSession((tally) => ({ ...tally, units: tally.units + roundUnits(next) }));
    }
    setRound(next);
    setVerdict(null);
    setHintShown(false);
  }

  function act(action: PlayerAction) {
    if (!current || !best || !allowed.includes(action)) return;
    const decision = { situation: describeSituation(current), chose: action, best };
    const next = applyAction(current, action);
    const results = next.results;
    update((progress) => {
      const graded = recordDecision(progress, decision);
      return results ? recordResults(graded, results) : graded;
    });
    setSession((tally) => ({
      decisions: tally.decisions + 1,
      correct: tally.correct + (action === best ? 1 : 0),
      units: tally.units + roundUnits(next),
    }));
    setVerdict(verdictFor(decision.situation, action, best));
    setRound(next);
    setHintShown(false);
  }

  // Resubscribed on every render so the handler always sees the round in play.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!active || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
      const key = event.key.toUpperCase();
      if (key === "N" && !playing) {
        event.preventDefault();
        deal();
        return;
      }
      if (!playing) return;
      if (key === "?") {
        event.preventDefault();
        setHintShown((shown) => !shown);
        return;
      }
      const match = ACTION_KEYS.find((entry) => entry.key === key);
      if (match && allowed.includes(match.action)) {
        event.preventDefault();
        act(match.action);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const dealerCards = current?.dealer ?? [];
  const dealerReadout = !current
    ? ""
    : playing
      ? String(cardValue(dealerCards[0]))
      : totalLabel(dealerCards);
  const settledUnits = current && !playing ? roundUnits(current) : 0;

  return (
    <div className="bj-table">
      <section className="bj-seat" aria-label="Dealer">
        <p className="bj-seat-label">
          Dealer
          {current ? <span className="bj-total">{dealerReadout}</span> : null}
        </p>
        <div className="bj-cards">
          {current ? (
            dealerCards.map((card, index) => (
              <PlayingCard key={index} card={playing && index === 1 ? null : card} />
            ))
          ) : (
            <>
              <PlayingCard card={null} />
              <PlayingCard card={null} />
            </>
          )}
        </div>
      </section>

      <section className="bj-seat" aria-label="Your hand">
        <div className="bj-hands">
          {current ? (
            current.hands.map((hand, index) => (
              <div
                key={index}
                className="bj-hand"
                data-active={playing && index === current.active ? "true" : undefined}
              >
                <p className="bj-seat-label">
                  {current.hands.length > 1 ? `Hand ${index + 1}` : "You"}
                  <span className="bj-total">{totalLabel(hand.cards)}</span>
                  {hand.bet === 2 ? <span className="bj-tag">Doubled</span> : null}
                </p>
                <div className="bj-cards">
                  {hand.cards.map((card, cardIndex) => (
                    <PlayingCard key={cardIndex} card={card} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bj-hand">
              <p className="bj-seat-label">You</p>
              <p className="bj-prompt">
                Deal a hand to start. Every decision is graded against basic strategy for this table.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="bj-status" role="status" aria-live="polite">
        {verdict ? (
          <p className="bj-verdict" data-correct={verdict.correct ? "true" : "false"}>
            {verdict.text}
          </p>
        ) : null}
        {current && current.results ? (
          <p className="bj-result">
            {current.hands
              .map((hand, index) => {
                const sentence = resultSentence(hand, current.results![index], current.dealer, rules);
                return current.hands.length > 1 ? `Hand ${index + 1}, ${sentence.toLowerCase()}` : sentence;
              })
              .join(". ")}
            . Net {formatUnits(settledUnits)} {Math.abs(settledUnits) === 1 ? "unit" : "units"}.
          </p>
        ) : null}
        {playing && hintShown && best ? (
          <p className="bj-hint">Basic strategy here is to {best}.</p>
        ) : null}
      </div>

      <div className="bj-actions">
        {playing ? (
          <>
            {ACTION_KEYS.map(({ action, key }) => (
              <button
                key={action}
                type="button"
                className="c97-btn"
                disabled={!allowed.includes(action)}
                aria-keyshortcuts={key}
                onClick={() => act(action)}
              >
                {ACTION_LABEL[action]}
                <span className="bj-key" aria-hidden="true">
                  {key}
                </span>
              </button>
            ))}
            <button
              type="button"
              className="c97-btn-ghost bj-ghost"
              aria-pressed={hintShown}
              onClick={() => setHintShown((shown) => !shown)}
            >
              {hintShown ? "Hide the play" : "Show the play"}
            </button>
          </>
        ) : (
          <button type="button" className="c97-btn" aria-keyshortcuts="N" onClick={deal}>
            {current ? "Deal next hand" : "Deal a hand"}
            <span className="bj-key" aria-hidden="true">
              N
            </span>
          </button>
        )}
      </div>

      <p className="bj-session">
        {session.decisions === 0
          ? "No decisions graded yet this visit."
          : `${session.correct} of ${session.decisions} decisions correct this visit, net ${formatUnits(session.units)} units.`}
        {current ? ` ${current.shoe.length} cards left in the shoe.` : ""}
      </p>
    </div>
  );
}
