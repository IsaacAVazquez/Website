"use client";

import type { GolfCutState, GolfLeaderboardEntry } from "@/types/golf";
import { boardRows, formatScoreToPar, leaderboardSlats, type LeaderboardSlat, type ParTone } from "./leaderboard";

interface GolfLeaderboardProps {
  entries: GolfLeaderboardEntry[];
  cutLine: number | null;
  cutState: GolfCutState;
  cutCount: number | null;
  coursePar: number;
  rounds: number;
}

/** Names on slats, top of the field, so it never grows into the full table below. */
const HERO_TOP_COUNT = 10;

function toneColor(tone: ParTone | null): string {
  return tone === "under" ? "var(--c97-negative)" : "var(--c97-ink)";
}

/**
 * A display-only row: the hero board is a visual, not a control. Selecting a
 * player happens in the full table and cards below, which are the keyboard
 * and screen-reader path and never repeat a name the hero already prints.
 */
function GolfSlatRow({ slat }: { slat: LeaderboardSlat }) {
  return (
    <tr>
      <th scope="row" className="c97-mono">
        {slat.position}
      </th>
      <td className="c97-serif">{slat.name}</td>
      {slat.rounds.map((round, i) => (
        <td key={i} className="c97-mono c97-golf-round" data-align="end" style={{ color: toneColor(round.tone) }}>
          {round.score ?? "—"}
        </td>
      ))}
      <td className="c97-mono" data-align="end" style={{ color: toneColor(slat.totalTone), fontWeight: 600 }}>
        {formatScoreToPar(slat.total)}
      </td>
    </tr>
  );
}

/**
 * The page's signature: a manual leaderboard, names on slats, rounds in
 * columns, under-par scores in golf's red. Only the top of the field prints
 * here, plus the slat the cut line actually fell on; the full field stays in
 * the table below, which is also the keyboard path to every other player.
 */
export function GolfLeaderboard({
  entries,
  cutLine,
  cutState,
  cutCount,
  coursePar,
  rounds,
}: GolfLeaderboardProps) {
  const { slats, cutIndex } = leaderboardSlats(entries, { cutLine, cutState, coursePar, rounds });

  if (slats.length === 0) {
    return <p className="c97-meta">No leaderboard is available in the current snapshot.</p>;
  }

  const rows = boardRows(slats, cutIndex, HERO_TOP_COUNT);
  const roundLabels = Array.from({ length: rounds }, (_, i) => `R${i + 1}`);

  return (
    <div data-c97-surface="paper" className="c97-offset c97-golf-board">
      <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
        Top of the board
      </p>
      <div className="overflow-x-auto" role="region" aria-label="Top of the board (scrollable)" tabIndex={0}>
        <table className="c97-table c97-golf-table" style={{ minWidth: "30rem" }}>
          <caption className="sr-only">
            Top of the PGA Tour Pulse leaderboard with position, player, round scores, and total.
          </caption>
          <thead>
            <tr>
              <th scope="col">Pos</th>
              <th scope="col">Player</th>
              {roundLabels.map((label) => (
                <th key={label} scope="col" className="c97-golf-round" data-align="end">
                  {label}
                </th>
              ))}
              <th scope="col" data-align="end">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) =>
              row.kind === "slat" ? (
                <GolfSlatRow key={row.slat.playerId} slat={row.slat} />
              ) : row.kind === "gap" ? (
                <tr key={`gap-${index}`} aria-hidden="true">
                  <td colSpan={roundLabels.length + 3} className="c97-mono" style={{ color: "var(--c97-ink-2)" }}>
                    ⋮
                  </td>
                </tr>
              ) : (
                <tr key={`cutline-${index}`} className="c97-golf-cutline">
                  <td colSpan={roundLabels.length + 3} className="c97-kicker c97-mono">
                    {`Cut line ${formatScoreToPar(cutLine)}${cutCount !== null ? ` · ${cutCount} advanced` : ""}`}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
