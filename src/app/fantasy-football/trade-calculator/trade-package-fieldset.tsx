"use client";

import { X } from "lucide-react";
import { FANTASY_CHIP_CLASS, getPositionTone } from "@/lib/fantasyUtils";
import type { FantasyTradeSideEvaluation } from "@/lib/fantasyTrade";
import { FANTASY_TRADE_MAX_PLAYERS_PER_SIDE } from "@/lib/fantasyTradePersistence";
import type { Player } from "@/types";
import { TradePlayerCombobox } from "./trade-player-combobox";

function formatTradeValue(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "--";
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
    <fieldset className="min-w-0 rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-paper)] px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
      <legend className="px-1">
        <span className="text-xl font-semibold tracking-[-0.03em] text-[var(--home-ink)]">
          {legend}
        </span>
      </legend>
      <div className="mt-1 flex items-start justify-between gap-3">
        <p className="max-w-[32ch] text-sm leading-6 text-[var(--home-ink-muted)]">{description}</p>
        <span
          className="shrink-0 font-mono text-2xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]"
          aria-live="polite"
        >
          {playerIds.length}/{FANTASY_TRADE_MAX_PLAYERS_PER_SIDE}
        </span>
      </div>

      <div className="mt-4">
        <TradePlayerCombobox
          sideLabel={legend.toLowerCase()}
          players={players}
          excludedPlayerIds={excludedPlayerIds}
          disabled={atLimit}
          onSelect={onAdd}
        />
      </div>

      <ul className="mt-4 grid gap-2" aria-label={`${legend} players`}>
        {playerIds.length === 0 ? (
          <li className="flex min-h-24 items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-4 text-center text-sm leading-6 text-[var(--home-ink-muted)]">
            Search the overall board and add the first player.
          </li>
        ) : (
          playerIds.map((playerId) => {
            const player = playersById.get(playerId);
            const evaluated = evaluatedById.get(playerId);
            const name = player?.name ?? evaluated?.name ?? "Unavailable player";
            const position = player?.position ?? evaluated?.position;
            const team = player?.team ?? evaluated?.team ?? "";
            return (
              <li
                key={playerId}
                className="flex min-h-[64px] items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] py-2 pl-3 pr-1"
              >
                {position ? (
                  <span className={FANTASY_CHIP_CLASS} style={getPositionTone(position)}>
                    {position}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--home-ink)]">
                    {name}
                  </span>
                  <span className="mt-0.5 block text-2xs text-[var(--home-ink-muted)]">
                    {team || "Not on this scoring board"}
                    {exactValuesAvailable && evaluated?.marketAdp
                      ? ` · ADP ${evaluated.marketAdp.toFixed(1)}`
                      : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono text-sm tabular-nums text-[var(--home-ink)]">
                    {exactValuesAvailable ? formatTradeValue(evaluated?.blendedValue) : "--"}
                  </span>
                  <span className="block font-mono text-3xs uppercase tracking-[0.1em] text-[var(--home-ink-muted)]">
                    index
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(playerId)}
                  aria-label={`Remove ${name} from players ${legend.toLowerCase()}`}
                  className="inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-full text-[var(--home-ink-muted)] transition-[color,background-color] hover:bg-[var(--home-paper)] hover:text-[var(--home-negative)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            );
          })
        )}
      </ul>
    </fieldset>
  );
}
