"use client";

import { X } from "lucide-react";
import { FANTASY_CHIP_CLASS, getPositionTone } from "@/lib/fantasyUtils";
import type { FantasyTradeSideEvaluation } from "@/lib/fantasyTrade";
import { FANTASY_TRADE_MAX_PLAYERS_PER_SIDE } from "@/lib/fantasyTradePersistence";
import type { Player } from "@/types";
import { TradePlayerCombobox } from "./trade-player-combobox";

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
    <fieldset className="min-w-0 border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ paddingInline: "var(--c97-sp-2)", paddingTop: "var(--c97-sp-1)", paddingBottom: "var(--c97-sp-2)" }}>
      <legend style={{ paddingInline: "var(--c97-sp-0)" }}>
        <span className="text-xl font-semibold tracking-[-0.03em] text-[var(--c97-ink)]">
          {legend}
        </span>
      </legend>
      <div className="flex items-start justify-between" style={{ marginTop: "var(--c97-sp-0)", gap: "var(--c97-sp-1)" }}>
        <p className="max-w-[32ch] text-sm leading-6 text-[var(--c97-ink-2)]">{description}</p>
        <span
          className="shrink-0 font-mono text-2xs uppercase tracking-[0.12em] text-[var(--c97-ink-2)]"
          aria-live="polite"
        >
          {playerIds.length}/{FANTASY_TRADE_MAX_PLAYERS_PER_SIDE}
        </span>
      </div>

      <div style={{ marginTop: "var(--c97-sp-2)" }}>
        <TradePlayerCombobox
          sideLabel={legend.toLowerCase()}
          players={players}
          excludedPlayerIds={excludedPlayerIds}
          disabled={atLimit}
          onSelect={onAdd}
        />
      </div>

      <ul className="grid" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }} aria-label={`${legend} players`}>
        {playerIds.length === 0 ? (
          <li className="flex min-h-24 items-center justify-center border border-dashed border-[var(--c97-rule)] bg-[var(--c97-field)] text-center text-sm leading-6 text-[var(--c97-ink-2)]" style={{ paddingInline: "var(--c97-sp-2)" }}>
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
                className="flex min-h-[64px] items-center border border-[var(--c97-rule)] bg-[var(--c97-field)]" style={{ paddingBlock: "var(--c97-sp-1)", paddingLeft: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-0)", gap: "var(--c97-sp-1)" }}
              >
                {position ? (
                  <span className={FANTASY_CHIP_CLASS} style={getPositionTone(position)}>
                    {position}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--c97-ink)]">
                    {name}
                  </span>
                  <span className="mt-0.5 block text-2xs text-[var(--c97-ink-2)]">
                    {team || "Not on this scoring board"}
                    {exactValuesAvailable && evaluated?.marketAdp
                      ? ` · ADP ${evaluated.marketAdp.toFixed(1)}`
                      : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono text-sm tabular-nums text-[var(--c97-ink)]">
                    {exactValuesAvailable ? formatTradeValue(evaluated?.blendedValue) : "—"}
                  </span>
                  <span className="block font-mono text-3xs uppercase tracking-[0.1em] text-[var(--c97-ink-2)]">
                    index
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(playerId)}
                  aria-label={`Remove ${name} from players ${legend.toLowerCase()}`}
                  className="inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center text-[var(--c97-ink-2)] transition-[color,background-color] hover:bg-[var(--c97-surface)] hover:text-[var(--c97-negative)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c97-accent)]"
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
