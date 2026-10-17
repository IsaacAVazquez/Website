"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type RefObject } from "react";
import type { FantasyTradePlayerEvaluation, FantasyTradeSideEvaluation } from "@/lib/fantasyTrade";
import { FANTASY_TRADE_MAX_PLAYERS_PER_SIDE } from "@/lib/fantasyTradePersistence";
import type { Player } from "@/types";
import { positionChip, TradePlayerCombobox, type TradeSearchHandle } from "./trade-player-combobox";

const NO_SAMPLE_WARNING = /no ADP sample/;

/**
 * The short status for a player whose own reading is why the verdict is
 * withheld, or null. The engine's sentences stay in the rail's list as they
 * are. This only says which row they are about.
 */
function heldStatus(player: FantasyTradePlayerEvaluation | undefined): string | null {
  if (!player || player.marketValue !== null) return null;
  return player.warnings.some((warning) => NO_SAMPLE_WARNING.test(warning))
    ? "No ADP sample"
    : "No market reading";
}

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
  /**
   * True when the verdict is withheld while the draft market itself is
   * current, which is the case where one player's reading is the cause.
   */
  marksHeldPlayers: boolean;
  /** The side's search field, for a parent that has to send focus there. */
  searchRef?: RefObject<TradeSearchHandle | null>;
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
  marksHeldPlayers,
  searchRef,
  onAdd,
  onRemove,
}: TradePackageFieldsetProps) {
  const ownSearchRef = useRef<TradeSearchHandle>(null);
  const search = searchRef ?? ownSearchRef;
  // A remove unmounts the button that had focus. Once the row is gone, focus
  // goes to this side's search, so it never falls to the page body.
  const refocusAfterRemove = useRef(false);
  useEffect(() => {
    if (!refocusAfterRemove.current) return;
    refocusAfterRemove.current = false;
    search.current?.focusClosed();
  }, [playerIds, search]);
  const playersById = new Map(players.map((player) => [player.id, player]));
  const evaluatedById = new Map(evaluation?.players.map((player) => [player.id, player]) ?? []);
  const atLimit = playerIds.length >= FANTASY_TRADE_MAX_PLAYERS_PER_SIDE;
  // A player has no index until both sides hold one, so the column stays empty until then.
  // Once the deal is evaluated it prints the value, or a dash when the values are withheld.
  const evaluated = evaluation !== null;

  return (
    <fieldset className="ffb-tr-side">
      <legend className="ffb-sticker-name">{legend}</legend>
      <span className="ffb-field-count ffb-tr-count" aria-live="polite">
        {playerIds.length}/{FANTASY_TRADE_MAX_PLAYERS_PER_SIDE}
      </span>
      <div className="ffb-stack ffb-stack-tight">
        <p className="ffb-sechead-note">{description}</p>
        <TradePlayerCombobox
          ref={search}
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
              {evaluated ? <span className="ffb-h-num">Index</span> : null}
            </div>
          ) : null}
          <ul aria-label={`${legend} players`}>
            {playerIds.length === 0 ? (
              <li className="ffb-tr-empty">Search the overall board and add the first player.</li>
            ) : (
              playerIds.map((playerId) => {
                const player = playersById.get(playerId);
                const valued = evaluatedById.get(playerId);
                const name = player?.name ?? valued?.name ?? "Unavailable player";
                const position = player?.position ?? valued?.position;
                const team = player?.team ?? valued?.team ?? "";
                const chip = position ? positionChip(position, player?.positionRank) : null;
                const held = marksHeldPlayers ? heldStatus(valued) : null;
                return (
                  <li key={playerId} className="ffb-row ffb-row-two">
                    {chip ? <span className={chip.className}>{chip.label}</span> : null}
                    <span className="ffb-c-name" title={name}>
                      {name}
                    </span>
                    <span className="ffb-c-team">
                      {team || "Not on this scoring board"}
                      {exactValuesAvailable && valued?.production
                        ? ` · ${valued.production.pointsPerGame.toFixed(1)} pts/g`
                        : exactValuesAvailable && valued?.marketAdp
                          ? ` · ADP ${valued.marketAdp.toFixed(1)}`
                          : ""}
                      {held ? (
                        <>
                          {" · "}
                          <span className="ffb-warn">{held}</span>
                        </>
                      ) : null}
                    </span>
                    {evaluated ? (
                      <span className="ffb-c-num ffb-is-strong">
                        <span className="ffb-vh">Index </span>
                        {exactValuesAvailable ? formatTradeValue(valued?.blendedValue) : "—"}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        refocusAfterRemove.current = true;
                        onRemove(playerId);
                      }}
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
