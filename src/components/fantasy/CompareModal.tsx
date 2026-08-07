"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useEffect, useRef } from "react";

import {
  formatAdp,
  formatOwnership,
  formatRankValue,
  getConsensusSpread,
  getPositionTone,
  getValueVsAdp,
} from "@/lib/fantasyUtils";
import type { Player } from "@/types";

import { RankDistributionBar } from "./RankDistributionBar";

interface CompareModalProps {
  players: Player[];
  publishedRank?: (player: Player) => string;
  /**
   * Whether the board these players came from ranks on the overall scale, so the
   * ADP value/reach signal is meaningful. False on position boards, where rankEcr
   * is position-scoped and not comparable to an overall ADP (see getValueVsAdp).
   */
  valueSignalAvailable?: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
}

type Direction = "lower" | "higher" | "none";

function metricValue(player: Player, key: string): number | null {
  switch (key) {
    case "posRank":
      return Number.isFinite(player.positionRank) ? (player.positionRank as number) : null;
    case "rank":
      return Number.isFinite(player.rankEcr)
        ? (player.rankEcr as number)
        : Number.isFinite(player.averageRank)
          ? player.averageRank
          : null;
    case "tier":
      return Number.isFinite(player.tier) ? (player.tier as number) : null;
    case "adp":
      return Number.isFinite(player.adp) ? (player.adp as number) : null;
    case "own":
      return Number.isFinite(player.ownership) ? (player.ownership as number) : null;
    default:
      return null;
  }
}

/**
 * How far apart two players have to be on a row before the better value is
 * called a win. Anything under these is left unmarked and the players read as
 * even on that row.
 *
 * This exists because marking every distinct value gave "Rostered 99.3% vs
 * 99.2%" the same full-width band as "Consensus rank 1 vs 2", which spends the
 * accent budget on noise and manufactures a verdict out of a tenth of a point.
 *
 * These are rounded judgment calls rather than measured coefficients, and they
 * are deliberately coarse so they are easy to argue with:
 *  - rank and posRank at 1 full ranking position, since rankEcr is an average
 *    and can differ by a fraction without either player actually ranking ahead.
 *  - tier at 1, because the board's whole premise is that players inside a tier
 *    are interchangeable, so a tier boundary is the meaningful unit.
 *  - adp at 6 picks, roughly half a round in a twelve-team draft, which is
 *    inside the spread you get from mock-draft sampling anyway.
 *  - own at 5 percentage points, well clear of the week-to-week drift that
 *    moves rostered percentages on their own.
 */
export const MIN_MEANINGFUL_DELTA: Record<string, number> = {
  rank: 1,
  posRank: 1,
  tier: 1,
  adp: 6,
  own: 5,
};

/**
 * Index of the player who "wins" a metric row, or -1 when it's a wash. A win
 * means beating the next-best player by at least MIN_MEANINGFUL_DELTA, so a
 * three-way row still has to clear the bar against its closest rival.
 */
export function bestIndex(players: Player[], key: string, direction: Direction): number {
  if (direction === "none") return -1;

  const scored = players
    .map((player, index) => ({ index, value: metricValue(player, key) }))
    .filter((entry): entry is { index: number; value: number } => entry.value !== null);
  if (scored.length < 2) return -1;

  const ranked = [...scored].sort((a, b) =>
    direction === "lower" ? a.value - b.value : b.value - a.value,
  );
  const [best, runnerUp] = ranked;
  const gap = Math.abs(best.value - runnerUp.value);
  const threshold = MIN_MEANINGFUL_DELTA[key] ?? 0;

  // gap > 0 keeps an exact tie a wash even if a row ever lands a 0 threshold.
  return gap > 0 && gap >= threshold ? best.index : -1;
}

export function CompareModal({ players, publishedRank, valueSignalAvailable = true, onClose, onRemove }: CompareModalProps) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Capture focus on open, trap Tab within the panel, and restore on close.
  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    panel?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, [onClose]);

  const scaleMin = Math.min(...players.map((p) => (Number.isFinite(p.minRank) ? (p.minRank as number) : Infinity)));
  const scaleMax = Math.max(...players.map((p) => (Number.isFinite(p.maxRank) ? (p.maxRank as number) : -Infinity)));
  const hasScale = Number.isFinite(scaleMin) && Number.isFinite(scaleMax);

  const rows: Array<{ key: string; label: string; direction: Direction; render: (p: Player) => React.ReactNode }> = [
    {
      key: "rank",
      label: "Consensus rank",
      direction: "lower",
      render: (p) => (publishedRank ? publishedRank(p) : formatRankValue(p.rankEcr ?? p.averageRank)),
    },
    {
      key: "posRank",
      label: "Position rank",
      direction: "lower",
      render: (p) => `${p.position} ${Number.isFinite(p.positionRank) ? p.positionRank : "—"}`,
    },
    { key: "tier", label: "Tier", direction: "lower", render: (p) => (Number.isFinite(p.tier) ? p.tier : "—") },
    {
      key: "adp",
      label: "Market ADP",
      direction: "lower",
      render: (p) => {
        const signal = valueSignalAvailable ? getValueVsAdp(p) : null;
        return (
          <span className="inline-flex items-center gap-1.5">
            {formatAdp(p.adp)}
            {signal?.signal && (
              <span
                className="rounded-full px-1.5 py-0.5 text-3xs font-semibold uppercase"
                style={{
                  background:
                    signal.signal === "value"
                      ? "color-mix(in srgb, var(--home-positive) 16%, var(--home-paper))"
                      : "color-mix(in srgb, var(--home-warning) 16%, var(--home-paper))",
                }}
              >
                {signal.signal}
              </span>
            )}
          </span>
        );
      },
    },
    { key: "own", label: "Rostered %", direction: "higher", render: (p) => formatOwnership(p.ownership) },
    { key: "bye", label: "Bye week", direction: "none", render: (p) => p.byeWeek ?? "—" },
    {
      key: "spread",
      label: "Expert consensus",
      direction: "none",
      render: (p) => getConsensusSpread(p)?.label ?? "—",
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.18 }}
      >
        <button
          type="button"
          aria-label="Close compare"
          onClick={onClose}
          className="absolute inset-0 h-full w-full cursor-default"
          style={{ background: "color-mix(in srgb, var(--home-ink) 42%, transparent)" }}
          tabIndex={-1}
        />
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Compare players"
          tabIndex={-1}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative max-h-[88vh] w-full max-w-2xl overscroll-contain overflow-auto rounded-[var(--radius-3xl)] border p-5"
          style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)", boxShadow: "var(--shadow-xl)" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="home-kicker mb-0">Side by side</p>
              <h2 className="text-xl font-semibold">Compare players</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-full border"
              style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* A real table, not a grid of divs. The grid version handed a screen
              reader a flat run of label, value, value with no way to tell which
              column belonged to which player. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left">
              <caption className="sr-only">
                Side by side comparison of the pinned players. The stronger value on a row is marked Best.
              </caption>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr-only">Metric</span>
                  </th>
                  {players.map((player) => (
                    // Named explicitly so the column announces as the player.
                    // Without this the header's name absorbs the remove
                    // button's label and every cell is prefixed with it.
                    <th
                      key={player.id}
                      scope="col"
                      aria-label={`${player.name}, ${player.position}, ${player.team}`}
                      className="p-0 pl-2 align-bottom font-normal"
                    >
                      <div
                        className="flex flex-col items-start gap-1 rounded-[var(--radius-3xl)] border p-2.5"
                        style={{ borderColor: "var(--home-rule)", background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))" }}
                      >
                        <div className="flex w-full items-start justify-between gap-1">
                          <span
                            className="inline-flex items-center rounded-full border px-2 py-0.5 text-3xs font-semibold uppercase tracking-[0.1em]"
                            style={getPositionTone(player.position)}
                          >
                            {player.position}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemove(player.id)}
                            aria-label={`Remove ${player.name} from compare`}
                            className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-full border"
                            style={{ borderColor: "var(--home-rule)" }}
                          >
                            <X size={12} aria-hidden="true" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold leading-tight">{player.name}</span>
                        <span className="text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                          {player.team}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const winner = bestIndex(players, row.key, row.direction);
                  return (
                    <tr key={row.key}>
                      <th
                        scope="row"
                        className="py-2 pr-2 text-2xs font-semibold uppercase tracking-[0.1em]"
                        style={{ color: "var(--home-ink-muted)" }}
                      >
                        {row.label}
                      </th>
                      {players.map((player, index) => (
                        <td
                          key={player.id}
                          className="border-t py-2 pl-2 text-sm font-semibold tabular-nums"
                          style={{
                            borderColor: "var(--home-rule)",
                            background:
                              winner === index
                                ? "color-mix(in srgb, var(--home-signal) 18%, transparent)"
                                : "transparent",
                          }}
                        >
                          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                            {row.render(player)}
                            {/* The tint alone carried the whole meaning before,
                                so the win is a labeled token now and the wash
                                only reinforces it. */}
                            {winner === index && (
                              <span className="inline-flex items-center gap-1 text-3xs font-semibold uppercase tracking-[0.1em]">
                                <Check size={12} aria-hidden="true" />
                                Best
                              </span>
                            )}
                          </span>
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {/* Expert range bars (shared scale) */}
                {hasScale && (
                  <tr>
                    <th
                      scope="row"
                      className="py-3 pr-2 align-top text-2xs font-semibold uppercase tracking-[0.1em]"
                      style={{ color: "var(--home-ink-muted)" }}
                    >
                      Range
                    </th>
                    {players.map((player) => (
                      <td key={player.id} className="border-t py-3 pl-2" style={{ borderColor: "var(--home-rule)" }}>
                        <RankDistributionBar player={player} scaleMin={scaleMin} scaleMax={scaleMax} compact />
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-2xs" style={{ color: "var(--home-ink-muted)" }}>
            Best marks the stronger value on a row, meaning a lower rank or ADP and a higher rostered percentage.
            Differences too small to act on stay unmarked, so a tier apart counts and a tenth of a point of rostered
            does not. Range bars share one scale, so a wider fill means more expert disagreement.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
