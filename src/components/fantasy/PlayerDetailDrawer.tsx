"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GitCompareArrows, Star, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useCompareTray } from "@/hooks/useCompareTray";
import { usePlayerNotes } from "@/hooks/usePlayerNotes";
import { usePlayerQueue } from "@/hooks/usePlayerQueue";
import {
  FANTASY_CHIP_CLASS,
  formatAdp,
  formatOwnership,
  getConsensusSpread,
  getPositionTone,
  getValueVsAdp,
} from "@/lib/fantasyUtils";
import type { Player } from "@/types";

import { RankDistributionBar } from "./RankDistributionBar";

interface PlayerDetailDrawerProps {
  player: Player | null;
  /** Headline rank string already formatted by the calling board. */
  publishedRank?: string;
  /** Total tier count on the active board, for "Tier N of M" context. */
  boardTierCount?: number;
  onClose: () => void;
}

function StatCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-[var(--radius-3xl)] border px-3 py-2.5"
      style={{
        borderColor: "var(--home-rule)",
        background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
      }}
    >
      <p className="text-2xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--home-ink-muted)" }}>
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold tabular-nums">{children}</p>
    </div>
  );
}

/**
 * A shared player detail surface — right-side drawer on desktop, bottom sheet on
 * mobile — used by both the rankings board and the draft assistant. It renders
 * only fields the snapshot actually populates (rank, tier, expert range,
 * consensus spread, ownership, bye, ADP) plus the cross-surface watchlist,
 * notes, and compare controls. No projections/headshots: that data is empty.
 */
export function PlayerDetailDrawer({ player, publishedRank, boardTierCount, onClose }: PlayerDetailDrawerProps) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const queue = usePlayerQueue();
  const compare = useCompareTray();
  const notes = usePlayerNotes();

  const [draftNote, setDraftNote] = useState("");

  // Reset the note draft whenever a different player opens the drawer.
  useEffect(() => {
    if (player) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seed local draft from the persisted note on open
      setDraftNote(notes.getNote(player.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id]);

  // Capture focus on open, trap Tab within the panel, and restore on close.
  useEffect(() => {
    if (!player) return;
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
  }, [player, onClose]);

  const isOpen = Boolean(player);
  const valueSignal = player ? getValueVsAdp(player) : null;
  const spread = player ? getConsensusSpread(player) : null;
  const isQueued = player ? queue.isQueued(player.id) : false;
  const inCompare = player ? compare.inCompare(player.id) : false;
  const compareDisabled = !inCompare && compare.isFull;

  return (
    <AnimatePresence>
      {isOpen && player && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-stretch sm:justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
          <button
            type="button"
            aria-label="Close player detail"
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default"
            style={{ background: "color-mix(in srgb, var(--home-ink) 38%, transparent)" }}
            tabIndex={-1}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${player.name} detail`}
            tabIndex={-1}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative flex max-h-[88vh] w-full flex-col gap-4 overflow-y-auto rounded-t-[var(--radius-3xl)] border p-5 outline-none sm:max-h-none sm:h-full sm:w-[26rem] sm:rounded-l-[var(--radius-3xl)] sm:rounded-tr-none"
            style={{
              borderColor: "var(--home-rule)",
              background: "var(--home-paper)",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-[0.12em]"
                    style={getPositionTone(player.position)}
                  >
                    {player.position}
                    {Number.isFinite(player.positionRank) ? ` ${player.positionRank}` : ""}
                  </span>
                  {publishedRank && (
                    <span className="text-2xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--home-ink-muted)" }}>
                      Rank {publishedRank}
                    </span>
                  )}
                </div>
                <h2 className="mt-1.5 truncate text-2xl font-semibold tracking-tight">{player.name}</h2>
                <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
                  {player.team || "Free agent"}
                  {player.byeWeek ? ` · Bye ${player.byeWeek}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-full border"
                style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => queue.toggle(player.id)}
                aria-pressed={isQueued}
                className="inline-flex min-h-touch flex-1 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold"
                style={
                  isQueued
                    ? {
                        borderColor: "color-mix(in srgb, var(--home-signal) 60%, var(--home-rule))",
                        background: "color-mix(in srgb, var(--home-signal) 30%, var(--home-paper))",
                        color: "var(--home-ink)",
                      }
                    : { borderColor: "var(--home-rule)", background: "var(--home-paper)", color: "var(--home-ink)" }
                }
              >
                <Star size={16} fill={isQueued ? "currentColor" : "none"} aria-hidden="true" />
                {isQueued ? "Queued" : "Add to queue"}
              </button>
              <button
                type="button"
                onClick={() => compare.toggle(player.id)}
                aria-pressed={inCompare}
                disabled={compareDisabled}
                title={compareDisabled ? `Compare holds ${compare.limit} players` : undefined}
                className="inline-flex min-h-touch flex-1 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55"
                style={
                  inCompare
                    ? { borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }
                    : { borderColor: "var(--home-rule)", background: "var(--home-paper)", color: "var(--home-ink)" }
                }
              >
                <GitCompareArrows size={16} aria-hidden="true" />
                {inCompare ? "Comparing" : "Compare"}
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
              <StatCell label="Position rank">
                {player.position}
                {Number.isFinite(player.positionRank) ? ` ${player.positionRank}` : " —"}
              </StatCell>
              <StatCell label="Tier">
                {Number.isFinite(player.tier)
                  ? `${player.tier}${boardTierCount ? ` of ${boardTierCount}` : ""}`
                  : "—"}
              </StatCell>
              <StatCell label="Bye week">{player.byeWeek ?? "—"}</StatCell>
              <StatCell label="Rostered">{formatOwnership(player.ownership)}</StatCell>
            </div>

            {/* ADP + value signal */}
            {Number.isFinite(player.adp) && (
              <div
                className="flex items-center justify-between rounded-[var(--radius-3xl)] border px-3 py-2.5"
                style={{
                  borderColor: "var(--home-rule)",
                  background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
                }}
              >
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--home-ink-muted)" }}>
                    Market ADP
                  </p>
                  <p className="text-base font-semibold tabular-nums">{formatAdp(player.adp)}</p>
                </div>
                {valueSignal?.signal && (
                  <span
                    className={FANTASY_CHIP_CLASS}
                    style={
                      valueSignal.signal === "value"
                        ? {
                            borderColor: "color-mix(in srgb, var(--home-positive) 30%, var(--home-rule))",
                            background: "color-mix(in srgb, var(--home-positive) 12%, var(--home-paper))",
                            color: "var(--home-ink)",
                          }
                        : {
                            borderColor: "color-mix(in srgb, var(--home-warning) 32%, var(--home-rule))",
                            background: "color-mix(in srgb, var(--home-warning) 12%, var(--home-paper))",
                            color: "var(--home-ink)",
                          }
                    }
                  >
                    {valueSignal.signal === "value" ? "Value" : "Reach"} {valueSignal.delta > 0 ? "+" : ""}
                    {valueSignal.delta}
                  </span>
                )}
              </div>
            )}

            {/* Expert consensus spread */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="home-kicker mb-0">Expert spread</p>
                {spread && (
                  <span className="text-2xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--home-ink-muted)" }}>
                    {spread.label}
                  </span>
                )}
              </div>
              <RankDistributionBar player={player} />
            </div>

            {/* Private note */}
            <div>
              <label
                htmlFor="player-note"
                className="home-kicker mb-2 block"
              >
                Private note
              </label>
              <textarea
                id="player-note"
                value={draftNote}
                maxLength={notes.maxLength}
                onChange={(event) => {
                  setDraftNote(event.target.value);
                  notes.setNote(player.id, event.target.value);
                }}
                rows={2}
                placeholder="Handcuff for Hall… target round 6… avoid."
                className="w-full resize-none rounded-[var(--radius-3xl)] border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--home-rule)",
                  background: "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
                  color: "var(--home-ink)",
                }}
              />
              <p className="mt-1 text-right text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                {draftNote.length}/{notes.maxLength} · saved to this browser
              </p>
            </div>

            <p className="text-2xs" style={{ color: "var(--home-ink-muted)" }}>
              Ranks, tiers, and expert ranges come from the published FantasyPros consensus snapshot. Queue,
              notes, and compare stay on this device.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
