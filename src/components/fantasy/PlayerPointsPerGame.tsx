"use client";

import { MetricTooltip } from "@/components/investments/MetricTooltip";
import { getFantasyPointsPerGameTooltip } from "@/lib/fantasyUtils";
import type { Player } from "@/types";

import "./fantasy-overlays.css";

interface PlayerPointsPerGameProps {
  gameLog: NonNullable<Player["gameLog"]>;
  /** The scoring the log was built for ("PPR"), printed in the basis line when the caller knows it. */
  scoringLabel?: string;
}

/**
 * A player's points per game for one completed stretch of games: the basis
 * line (season, scoring, games) and the low, median, average, and high. It is
 * history and never a projection, which the help on the label says. Every
 * player drawer on the fantasy pages renders this one block.
 */
export function PlayerPointsPerGame({ gameLog, scoringLabel }: PlayerPointsPerGameProps) {
  const basis = `${gameLog.season} season · ${scoringLabel ? `${scoringLabel} · ` : ""}${gameLog.games} ${
    gameLog.games === 1 ? "game" : "games"
  }`;
  return (
    <div className="ffb-stack ffb-stack-tight">
      <div className="ffb-sechead">
        <h3 className="ffb-h3" aria-label="Points per game">
          <MetricTooltip term="Points per game" definition={getFantasyPointsPerGameTooltip(gameLog)} focusable>
            Points per game
          </MetricTooltip>
        </h3>
        <p className="ffb-sechead-note">{basis}</p>
      </div>
      <dl className="ffb-stats ffb-ov-ppg">
        {(
          [
            { label: "Low", value: gameLog.low },
            { label: "Median", value: gameLog.median },
            { label: "Avg", value: gameLog.average },
            { label: "High", value: gameLog.high },
          ] as const
        ).map((cell) => (
          <div key={cell.label} className="ffb-stat">
            <dt>{cell.label}</dt>
            <dd>{cell.value.toFixed(1)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
