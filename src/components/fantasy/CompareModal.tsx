"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
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

/** Index of the player who "wins" a metric row, or -1 when it's a wash. */
function bestIndex(players: Player[], key: string, direction: Direction): number {
  if (direction === "none") return -1;
  let best = -1;
  let bestVal: number | null = null;
  players.forEach((player, index) => {
    const value = metricValue(player, key);
    if (value === null) return;
    if (
      bestVal === null ||
      (direction === "lower" && value < bestVal) ||
      (direction === "higher" && value > bestVal)
    ) {
      bestVal = value;
      best = index;
    }
  });
  // A tie (every value equal) isn't a meaningful "win".
  const distinct = new Set(players.map((p) => metricValue(p, key)).filter((v) => v !== null));
  return distinct.size > 1 ? best : -1;
}

export function CompareModal({ players, publishedRank, onClose, onRemove }: CompareModalProps) {
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
        const signal = getValueVsAdp(p);
        return (
          <span className="inline-flex items-center gap-1.5">
            {formatAdp(p.adp)}
            {signal?.signal && (
              <span
                className="rounded-full px-1.5 py-0.5 text-3xs font-semibold uppercase"
                style={{
                  background:
                    signal.signal === "value"
                      ? "color-mix(in srgb, var(--color-success) 16%, var(--home-paper))"
                      : "color-mix(in srgb, var(--color-warning) 16%, var(--home-paper))",
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
          className="relative max-h-[88vh] w-full max-w-2xl overflow-auto rounded-[1.6rem] border p-5 outline-none"
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

          <div className="overflow-x-auto">
            <div
              className="grid min-w-[34rem] gap-x-2"
              style={{ gridTemplateColumns: `auto repeat(${players.length}, minmax(0, 1fr))` }}
            >
              {/* Header row: player identities */}
              <div />
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex flex-col items-start gap-1 rounded-[1rem] border p-2.5"
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
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border"
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
              ))}

              {/* Metric rows */}
              {rows.map((row) => {
                const winner = bestIndex(players, row.key, row.direction);
                return (
                  <div key={row.key} className="contents">
                    <div className="flex items-center py-2 pr-2 text-2xs font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--home-ink-muted)" }}>
                      {row.label}
                    </div>
                    {players.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center border-t py-2 text-sm font-semibold tabular-nums"
                        style={{
                          borderColor: "var(--home-rule)",
                          color: winner === index ? "var(--home-ink)" : "var(--home-ink)",
                          background:
                            winner === index
                              ? "color-mix(in srgb, var(--home-acid) 18%, transparent)"
                              : "transparent",
                        }}
                      >
                        {row.render(player)}
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Expert range bars (shared scale) */}
              {hasScale && (
                <div className="contents">
                  <div className="flex items-start py-3 pr-2 text-2xs font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--home-ink-muted)" }}>
                    Range
                  </div>
                  {players.map((player) => (
                    <div key={player.id} className="border-t py-3" style={{ borderColor: "var(--home-rule)" }}>
                      <RankDistributionBar player={player} scaleMin={scaleMin} scaleMax={scaleMax} compact />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="mt-4 text-2xs" style={{ color: "var(--home-ink-muted)" }}>
            Highlight marks the stronger value per row (lower rank/ADP, higher rostered %). Range bars share one
            scale so a wider fill means more expert disagreement.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
