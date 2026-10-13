"use client";

import { X } from "lucide-react";
import type { FantasyTradeSideEvaluation } from "@/lib/fantasyTrade";
import { FANTASY_TRADE_MAX_PLAYERS_PER_SIDE } from "@/lib/fantasyTradePersistence";
import type { Player } from "@/types";
import { positionChip, TradePlayerCombobox } from "./trade-player-combobox";

function formatTradeValue(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "—";
}

interface TradePackageFieldsetProps {
  legend: "You give" | "You get";
  description: string;
  playerIds: readonly string[];
  players: readonly Player[];
  excludedPlayerIds: ReadonlySet<string>;
  evaluation: FantasyTradeSideEvaluation | null;
  exactValuesAvailable: boolean;
  onAdd: (playerId: string) => void;
  onRemove: (playerId: string) => void;
}

export function TradePackageFieldset({
  legend,
  description,
  playerIds,
  players,
  excludedPlayerIds,
  evaluation,
  exactValuesAvailable,
  onAdd,
  onRemove,
}: TradePackageFieldsetProps) {
  const playersById = new Map(players.map((player) => [player.id, player]));
  const evaluatedById = new Map(evaluation?.players.map((player) => [player.id, player]) ?? []);
  const atLimit = playerIds.length >= FANTASY_TRADE_MAX_PLAYERS_PER_SIDE;

  return (
    <fieldset className="ffb-tr-side">
      <legend className="ffb-h3">{legend}</legend>
      <span className="ffb-field-count ffb-tr-count" aria-live="polite">
        {playerIds.length}/{FANTASY_TRADE_MAX_PLAYERS_PER_SIDE}
      </span>
      <div className="ffb-stack ffb-stack-tight">
        <p className="ffb-sechead-note">{description}</p>
        <TradePlayerCombobox
          sideLabel={legend.toLowerCase()}
          players={players}
          excludedPlayerIds={excludedPlayerIds}
          disabled={atLimit}
          onSelect={onAdd}
        />
        <div>
          {/* The head names the number once for the whole list. Each value repeats it for a screen reader. */}
          {playerIds.length > 0 ? (
            <div className="ffb-colhead" aria-hidden="true">
              <span className="ffb-tr-h-player">Player</span>
              <span className="ffb-h-num">Index</span>
            </div>
          ) : null}
          <ul aria-label={`${legend} players`}>
            {playerIds.length === 0 ? (
              <li className="ffb-tr-empty">Search the overall board and add the first player.</li>
            ) : (
              playerIds.map((playerId) => {
                const player = playersById.get(playerId);
                const evaluated = evaluatedById.get(playerId);
                const name = player?.name ?? evaluated?.name ?? "Unavailable player";
                const position = player?.position ?? evaluated?.position;
                const team = player?.team ?? evaluated?.team ?? "";
                const chip = position ? positionChip(position, player?.positionRank) : null;
                return (
                  <li key={playerId} className="ffb-row ffb-tr-row">
                    {chip ? <span className={chip.className}>{chip.label}</span> : null}
                    <span className="ffb-c-name">{name}</span>
                    <span className="ffb-c-team">
                      {team || "Not on this scoring board"}
                      {exactValuesAvailable && evaluated?.marketAdp
                        ? ` · ADP ${evaluated.marketAdp.toFixed(1)}`
                        : ""}
                    </span>
                    <span className="ffb-c-num ffb-is-strong">
                      <span className="ffb-vh">Index </span>
                      {exactValuesAvailable ? formatTradeValue(evaluated?.blendedValue) : "—"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemove(playerId)}
                      aria-label={`Remove ${name} from players ${legend.toLowerCase()}`}
                      className="ffb-iconbtn"
                    >
                      <X width={14} height={14} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </fieldset>
  );
}
