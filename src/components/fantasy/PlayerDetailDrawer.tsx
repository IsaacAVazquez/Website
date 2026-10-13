"use client";

import { GitCompareArrows, Star, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { MetricTooltip } from "@/components/investments/MetricTooltip";
import { useCompareTray } from "@/hooks/useCompareTray";
import { useModal } from "@/hooks/useModal";
import { usePlayerNotes } from "@/hooks/usePlayerNotes";
import { usePlayerQueue } from "@/hooks/usePlayerQueue";
import {
  FANTASY_ADP_TOOLTIP,
  FANTASY_EXPERT_SPREAD_TOOLTIP,
  FANTASY_REACH_TOOLTIP,
  FANTASY_VALUE_TOOLTIP,
  FANTASY_VORP_TOOLTIP,
  formatAdp,
  formatOwnership,
  getConsensusSpread,
  getSnapshotStaleness,
  getValueVsAdp,
  formatPickDelta,
  hasReliableAdpSample,
} from "@/lib/fantasyUtils";
import type { Player } from "@/types";

import "./fantasy-overlays.css";
import { PlayerNoteField } from "./PlayerNoteField";
import { PlayerPointsPerGame } from "./PlayerPointsPerGame";
import { positionClass } from "./positionClass";
import { RankDistributionBar } from "./RankDistributionBar";

interface PlayerDetailDrawerProps {
  player: Player | null;
  /** Headline rank string already formatted by the calling board. */
  publishedRank?: string;
  /**
   * What `publishedRank` is a rank of, printed before the number. Defaults to
   * "Rank" for boards whose published rank is the expert consensus. The best
   * ball board passes "Board rank", since its order is the market under the
   * lens and the footnote below attributes ranks to the consensus.
   */
  publishedRankLabel?: string;
  /** Total tier count on the active board, for "Tier N of M" context. */
  boardTierCount?: number;
  /**
   * Whether the active snapshot carries an attributed ADP source. When false,
   * every ADP-derived surface hides, mirroring the board, even if stale
   * per-player adp values are present in the data.
   */
  adpAvailable?: boolean;
  /**
   * Whether the calling board ranks players on the overall scale (overall/flex),
   * so the ADP value/reach signal is meaningful. False on position boards, where
   * rankEcr is the position rank and isn't comparable to an overall ADP.
   */
  valueSignalAvailable?: boolean;
  /**
   * Whether the calling surface renders a CompareTray at all. Only the best ball
   * board does. The redraft tracker never mounts one at any width, so its Compare
   * button toggled to "Comparing" and pinned players into a tray that never
   * appeared. A surface without a tray passes false and the button does not render.
   */
  compareAvailable?: boolean;
  /**
   * Whether the market sentence under Market ADP may print ("Value if he lasts
   * to your pick", "Take him on schedule"). It is pick advice, so a caller
   * passes false whenever its own surface is withholding recommendations: a
   * stale source, a season under way, or a model source issue. The Value or
   * Reach word beside the ADP figure stays either way. Defaults to true.
   */
  verdictAvailable?: boolean;
  /**
   * Value over replacement for this player and the league size it was computed
   * for ("12-team"), printed as a fact when the caller's board shows VORP.
   */
  vorp?: { value: number; label: string };
  /**
   * Whether the calling board withholds this player's published consensus
   * rank. The Position rank and Tier facts then read "Withheld", the word the
   * board row and the compare modal print, in place of a dash.
   */
  consensusWithheld?: boolean;
  /** The scoring the points per game log was built for ("PPR"), named in its basis line. */
  scoringLabel?: string;
  /**
   * Draft-room surfaces pass this to log the open player as the current pick,
   * so the drawer is a decision point rather than a dead end. Callers withhold
   * it for drafted players and outside a live draft.
   */
  onLogPick?: (player: Player) => void;
  onClose: () => void;
}

/** "↑3" means up the board (better rank or earlier ADP); "↓3" the reverse. */
function formatBoardMove(value: number): string {
  if (value === 0) return "±0";
  const magnitude =
    Math.abs(value) % 1 === 0 ? String(Math.abs(value)) : Math.abs(value).toFixed(1);
  return `${value > 0 ? "↑" : "↓"}${magnitude}`;
}

/**
 * The market read in one sentence, from the same ADP against consensus gap
 * the Value and Reach words use. The four sentences are the ones the rankings
 * board's own drawer prints, so the two drawers say the same thing.
 */
function marketVerdict(
  player: Player,
  value: NonNullable<ReturnType<typeof getValueVsAdp>>,
): { text: string; tone: string } {
  // A null signal can also mean the sample is too thin to judge, so that case
  // never reads as the market agreeing.
  if (!hasReliableAdpSample(player)) {
    return {
      text: "Too few mock selections behind his ADP to judge the market gap yet, so no market read.",
      // A read the drawer is holding back, which is the kit's held notice.
      tone: "ffb-notice-held",
    };
  }
  const picks = Math.round(Math.abs(value.delta));
  if (value.signal === "value") {
    return {
      text: `Rooms take him about ${picks} picks after the consensus rank. Value if he lasts to your pick.`,
      tone: "ffb-notice-good",
    };
  }
  if (value.signal === "reach") {
    return {
      text: `Rooms take him about ${picks} picks before the consensus rank. Plan the reach or let him go.`,
      tone: "ffb-notice-warn",
    };
  }
  return {
    text: "Market and consensus sit inside this player's noise band. Take him on schedule.",
    tone: "",
  };
}

/**
 * The player detail panel the best ball board and both draft rooms share, a
 * right-hand drawer on a desktop and a bottom sheet on a phone. It renders
 * only fields the snapshot populates (rank, tier, expert range, consensus
 * spread, ownership, bye, ADP, movement, points per game) plus the queue,
 * note, and compare controls that carry across the fantasy pages. The spread
 * plot, the points per game block, and the note field are components of their
 * own, so the rankings board's drawer can render the same parts.
 */
export function PlayerDetailDrawer({ player, publishedRank, publishedRankLabel = "Rank", boardTierCount, onClose,
  adpAvailable = true,
  valueSignalAvailable = true,
  compareAvailable = true,
  verdictAvailable = true,
  vorp,
  consensusWithheld = false,
  scoringLabel,
  onLogPick,
}: PlayerDetailDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isOpen = Boolean(player);

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

  useModal(panelRef, isOpen, onClose, { lockScroll: false });

  if (!player) return null;

  const showAdp = adpAvailable && Number.isFinite(player.adp);
  const valueSignal = adpAvailable && valueSignalAvailable ? getValueVsAdp(player) : null;
  const verdict = valueSignal ? marketVerdict(player, valueSignal) : null;
  const spread = getConsensusSpread(player);
  // The stamps measure the 7 and 14 days before the board was last updated,
  // so on a board that has stopped moving they describe a window that ended
  // when it stopped.
  const movementCurrent = getSnapshotStaleness(player.lastUpdated) !== "stale";
  const movement = [
    Number.isFinite(player.rankMove7d) ? `rank ${formatBoardMove(player.rankMove7d as number)} in 7d` : null,
    Number.isFinite(player.rankMove14d) ? `${formatBoardMove(player.rankMove14d as number)} in 14d` : null,
    Number.isFinite(player.adpMove7d) ? `ADP ${formatBoardMove(player.adpMove7d as number)} in 7d` : null,
    Number.isFinite(player.adpMove14d) ? `${formatBoardMove(player.adpMove14d as number)} in 14d` : null,
  ].filter(Boolean);
  const isQueued = queue.isQueued(player.id);
  const inCompare = compare.inCompare(player.id);
  const compareDisabled = !inCompare && compare.isFull;
  const hasPositionRank = Number.isFinite(player.positionRank);
  const hasRange = Number.isFinite(player.minRank) && Number.isFinite(player.maxRank);
  // The three stores share one storage, so one of them in memory means all are.
  const persistent = [notes, queue, compare].every((store) => store.persistenceStatus === "persistent");
  const withheld = <span className="ffb-label ffb-muted">Withheld</span>;

  return (
    <div className="ffb-overlay ffb-enter-fade">
      <button
        type="button"
        aria-label="Close player detail"
        onClick={onClose}
        className="ffb-scrim"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${player.name} detail`}
        tabIndex={-1}
        className="ffb-drawer ffb-enter-side"
      >
        <div className="ffb-panel-head">
          <div className="ffb-stack ffb-stack-tight">
            <p className="ffb-cluster">
              <span className={`ffb-chip ${positionClass(player.position)}`}>
                {player.position}
                {hasPositionRank ? player.positionRank : ""}
              </span>{" "}
              <span className="ffb-label ffb-muted">
                {publishedRank ? (
                  <>
                    <span>
                      {publishedRankLabel} {publishedRank}
                    </span>
                    {" · "}
                  </>
                ) : null}
                {player.team || "Free agent"}
                {player.byeWeek ? ` · Bye ${player.byeWeek}` : ""}
              </span>
            </p>
            <h2 className="ffb-h2">{player.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="ffb-iconbtn">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="ffb-panel-body ffb-ov-drawer-body">
          <div className="ffb-cluster ffb-ov-actions">
            {onLogPick && (
              <button type="button" onClick={() => onLogPick(player)} className="ffb-btn ffb-btn-primary">
                Log this pick
              </button>
            )}
            <button
              type="button"
              onClick={() => queue.toggle(player.id)}
              aria-pressed={isQueued}
              className="ffb-btn ffb-btn-toggle"
            >
              <Star size={14} fill={isQueued ? "currentColor" : "none"} aria-hidden="true" />
              {isQueued ? "Queued" : "Add to queue"}
            </button>
            {compareAvailable && (
              <button
                type="button"
                onClick={() => compare.toggle(player.id)}
                aria-pressed={inCompare}
                disabled={compareDisabled}
                title={compareDisabled ? `Compare holds ${compare.limit} players` : undefined}
                className="ffb-btn ffb-btn-toggle"
              >
                <GitCompareArrows size={14} aria-hidden="true" />
                {inCompare ? "Comparing" : "Compare"}
              </button>
            )}
          </div>

          {/* Four short facts read best as two by two. Three sit on one line. */}
          <dl className={vorp ? "ffb-stats ffb-stats-2" : "ffb-stats"}>
            <div className="ffb-stat">
              <dt>Position rank</dt>
              {consensusWithheld ? (
                <dd>{withheld}</dd>
              ) : (
                <dd>
                  {player.position}
                  {hasPositionRank ? ` ${player.positionRank}` : " —"}
                </dd>
              )}
            </div>
            <div className="ffb-stat">
              <dt>Tier</dt>
              {consensusWithheld ? (
                <dd>{withheld}</dd>
              ) : (
                <dd>
                  {Number.isFinite(player.tier) ? player.tier : "—"}
                  {Number.isFinite(player.tier) && boardTierCount ? <small> of {boardTierCount}</small> : null}
                </dd>
              )}
            </div>
            <div className="ffb-stat">
              <dt>Rostered</dt>
              <dd>{formatOwnership(player.ownership)}</dd>
            </div>
            {vorp && (
              <div className="ffb-stat">
                <dt>
                  <MetricTooltip term="VORP" definition={FANTASY_VORP_TOOLTIP} focusable>
                    {`VORP · ${vorp.label}`}
                  </MetricTooltip>
                </dt>
                <dd>{Math.round(vorp.value)}</dd>
              </div>
            )}
            {showAdp && (
              <div className="ffb-stat ffb-ov-stat-wide">
                <dt>
                  <MetricTooltip term="Market ADP" definition={FANTASY_ADP_TOOLTIP} focusable>
                    Market ADP
                  </MetricTooltip>
                </dt>
                <dd className="ffb-cluster ffb-ov-stat-row">
                  {formatAdp(player.adp)}{" "}
                  {valueSignal?.signal && (
                    <span
                      className={`ffb-badge ${valueSignal.signal === "value" ? "ffb-good" : "ffb-warn"}`}
                      title={valueSignal.signal === "value" ? FANTASY_VALUE_TOOLTIP : FANTASY_REACH_TOOLTIP}
                    >
                      {valueSignal.signal === "value" ? "Value" : "Reach"} {formatPickDelta(valueSignal.delta)}
                    </span>
                  )}
                </dd>
                {(Number.isFinite(player.adpTimesDrafted) ||
                  Number.isFinite(player.adpStandardDeviation) ||
                  (Number.isFinite(player.adpHigh) && Number.isFinite(player.adpLow))) && (
                  <dd className="ffb-stat-note">
                    {Number.isFinite(player.adpHigh) && Number.isFinite(player.adpLow)
                      ? `Drafted between picks ${formatAdp(player.adpHigh)} and ${formatAdp(player.adpLow)} · `
                      : ""}
                    {Number.isFinite(player.adpTimesDrafted)
                      ? `${Math.round(player.adpTimesDrafted as number)} mock selections`
                      : "Sample count unavailable"}
                    {Number.isFinite(player.adpStandardDeviation)
                      ? ` · ${Number(player.adpStandardDeviation).toFixed(1)} pick standard deviation`
                      : ""}
                    {!hasReliableAdpSample(player) ? " · Early sample, so no value or reach label" : ""}
                  </dd>
                )}
              </div>
            )}
          </dl>

          {showAdp && verdictAvailable && verdict && <p className={`ffb-notice ${verdict.tone}`}>{verdict.text}</p>}

          <div className="ffb-stack ffb-stack-tight">
            <div className="ffb-sechead">
              <h3 className="ffb-h3" aria-label="Expert spread">
                <MetricTooltip term="Expert spread" definition={FANTASY_EXPERT_SPREAD_TOOLTIP} focusable>
                  Expert spread
                </MetricTooltip>
              </h3>
              {spread && <p className="ffb-sechead-note">{spread.label}</p>}
            </div>
            {/* The plot's divisions are labelled R1, R2, and the head line above
                prints a rank, so the drawer says once what a division is. */}
            {hasRange && <p className="ffb-sechead-note">Each division is a round of a 12-team draft.</p>}
            <RankDistributionBar player={player} />
            {/* Board movement, present only once the committed rank history is
                old enough for the window and while the board is still being
                updated. Positive means up the board. */}
            {movementCurrent && movement.length > 0 && (
              <p className="ffb-ov-line">
                <span className="ffb-label">
                  <MetricTooltip
                    term="Movement"
                    definition="Movement against the published snapshot from 7 and 14 days back. An up arrow means he moved up the board, ranked higher or drafted earlier."
                    focusable
                  >
                    Movement
                  </MetricTooltip>
                </span>{" "}
                <span>{movement.join(" · ")}</span>
              </p>
            )}
          </div>

          {/* Prior-season points per game, history and never a projection. */}
          {player.gameLog && <PlayerPointsPerGame gameLog={player.gameLog} scoringLabel={scoringLabel} />}

          <PlayerNoteField
            id="player-note"
            value={draftNote}
            maxLength={notes.maxLength}
            onChange={(value) => {
              setDraftNote(value);
              notes.setNote(player.id, value);
            }}
            persistent={persistent}
          />

          <p className="ffb-method">
            Ranks, tiers, and expert ranges come from the published FantasyPros consensus snapshot.{" "}
            {persistent
              ? "Queue, notes, and compare stay on this device."
              : compareAvailable
                ? "Queue, notes, and compare last only in this tab."
                : "Queue and notes last only in this tab."}
          </p>
        </div>
      </div>
    </div>
  );
}
