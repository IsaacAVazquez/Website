"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Star, X } from "lucide-react";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import { usePlayerQueue } from "@/hooks/usePlayerQueue";
import { usePlayerNotes } from "@/hooks/usePlayerNotes";
import {
  FANTASY_POSITION_LABELS,
  FANTASY_SCORING_LABELS,
  FantasyRoutePosition,
  FantasyRouteScoring,
  getFantasyPlayerSearchText,
} from "@/lib/fantasy";
import { MetricTooltip } from "@/components/investments/MetricTooltip";
import {
  FANTASY_ADP_TOOLTIP,
  FANTASY_AVG_RANK_TOOLTIP,
  FANTASY_EXPERT_SPREAD_TOOLTIP,
  FANTASY_POINTS_PER_GAME_TOOLTIP,
  FANTASY_REACH_TOOLTIP,
  FANTASY_VALUE_TOOLTIP,
  FANTASY_VS_ADP_TOOLTIP,
  FANTASY_PLAYER_COLUMN_TOOLTIP,
  formatAdp,
  formatRankValue,
  getConsensusSpread,
  getFantasyAdpFreshness,
  getPositionTone,
  getSnapshotStaleness,
  getSnapshotStalenessLabel,
  getTierRailIntensity,
  getValueVsAdp,
  formatPickDelta,
  hasReliableAdpSample,
  withTierBreaks,
  type FantasySnapshotStaleness,
} from "@/lib/fantasyUtils";
import { PositionFilterBar, type PositionFilterOption } from "@/components/fantasy";
import { Player } from "@/types";
import { FANTASY_FOOTBALL_FAQ } from "./fantasy-faq";
import { buildFantasyHref, FantasySearchState, normalizeFantasyState } from "./fantasy-state";

const POSITION_OPTIONS: FantasyRoutePosition[] = ["overall", "qb", "rb", "wr", "te", "flex", "k", "dst"];
const SCORING_OPTIONS: { key: FantasyRouteScoring; label: string }[] = [
  { key: "ppr", label: "PPR" },
  { key: "half_ppr", label: "Half PPR" },
  { key: "standard", label: "Standard" },
];

/** Keep each mounted rankings window below the large-list threshold. */
const RANKINGS_PAGE_SIZE = 40;

/** The template's 1080px column; the page manages its own shell width. */
const SHELL_CLASS = "mx-auto w-full max-w-[1080px] px-[clamp(1rem,4vw,2.5rem)]";

const MONO_LABEL_CLASS = "font-mono text-3xs uppercase tracking-[0.12em]";

/** Square-cornered mono chip from the template header (distinct from the shared pill chip). */
const HEADER_CHIP_CLASS =
  "inline-flex items-center whitespace-nowrap rounded-[2px] border px-2 py-1 font-mono text-3xs uppercase tracking-[0.08em]";

/** The other fantasy surfaces; the tiers routes only redirect back here, so they are not listed. */
const FANTASY_TOOLS = [
  { href: "/fantasy-football/draft-tracker", label: "Draft tracker" },
  { href: "/fantasy-football/mock-draft", label: "Mock draft" },
  { href: "/fantasy-football/best-ball", label: "Best ball" },
  { href: "/fantasy-football/trade-calculator", label: "Trade calculator" },
];

const subscribeToHydration = () => () => undefined;
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

const STALENESS_TONE: Record<FantasySnapshotStaleness, CSSProperties> = {
  fresh: {
    background: "color-mix(in srgb, var(--home-positive) 16%, var(--home-paper))",
    borderColor: "color-mix(in srgb, var(--home-positive) 30%, var(--home-rule))",
    color: "var(--home-ink)",
  },
  aging: {
    background: "color-mix(in srgb, var(--home-warning) 18%, var(--home-paper))",
    borderColor: "color-mix(in srgb, var(--home-warning) 32%, var(--home-rule))",
    color: "var(--home-ink)",
  },
  stale: {
    background: "color-mix(in srgb, var(--home-negative) 16%, var(--home-paper))",
    borderColor: "color-mix(in srgb, var(--home-negative) 30%, var(--home-rule))",
    color: "var(--home-ink)",
  },
};

/** Compact "Aug 16" / "Dec 3, 2025" stamp for the header chips and footer line. */
function formatStamp(timestamp: string | null | undefined): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  const sameYear = date.getUTCFullYear() === new Date().getUTCFullYear();
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}

function getPublishedBoardRank(player: Player, position: FantasyRoutePosition): string {
  const rankValue =
    position === "flex"
      ? // The flex board is re-ranked densely (1..N) into averageRank by the
        // snapshot builder; rankEcr still carries each player's overall ECR
        // (gappy, since QB/K/DST are filtered out), so use the dense flex rank.
        player.averageRank ?? player.rankEcr
      : position === "overall"
        ? player.rankEcr ?? player.averageRank
        : player.positionRank ?? player.rankEcr ?? player.averageRank;

  return formatRankValue(rankValue);
}

function getConsensusAvg(player: Player): number | null {
  if (typeof player.rankAverage === "number" && Number.isFinite(player.rankAverage)) {
    return player.rankAverage;
  }
  if (typeof player.averageRank === "number" && Number.isFinite(player.averageRank)) {
    return player.averageRank;
  }
  return null;
}

function formatAvg(player: Player): string {
  const avg = getConsensusAvg(player);
  return avg === null ? "—" : avg.toFixed(1);
}

function formatExpertRange(player: Player): string {
  return Number.isFinite(player.minRank) && Number.isFinite(player.maxRank)
    ? `${player.minRank}–${player.maxRank}`
    : "—";
}

/**
 * Signed pick delta ("+12" / "−4") with the tone the value/reach gate assigns.
 * `judged` is false when the ADP sample is too thin for the gate to evaluate
 * the gap at all — a different situation from a gap inside the noise band,
 * and one no surface may describe as market agreement.
 */
function describeVsAdp(player: Player): { text: string; color: string; judged: boolean } | null {
  const value = getValueVsAdp(player);
  if (!value) return null;
  const text = formatPickDelta(value.delta);
  const color =
    value.signal === "value"
      ? "var(--home-positive)"
      : value.signal === "reach"
        ? "var(--home-negative)"
        : "var(--home-ink-muted)";
  return { text, color, judged: hasReliableAdpSample(player) };
}

/**
 * The named Value/Reach label. The "vs ADP" column carries the same gap as a
 * signed number, but the word is what a drafter scans for, so the chip renders
 * beside the player name whenever the gate actually fires. Callers gate on the
 * overall or flex board, because `rankEcr` is a position rank anywhere else and
 * the comparison with an overall ADP would be meaningless.
 */
function ValueReachChip({ player }: { player: Player }) {
  const value = getValueVsAdp(player);
  if (!value?.signal) return null;

  const isValue = value.signal === "value";
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-[2px] border px-1.5 py-0.5 font-mono text-3xs uppercase tracking-[0.06em]"
      title={isValue ? FANTASY_VALUE_TOOLTIP : FANTASY_REACH_TOOLTIP}
      style={
        isValue
          ? {
              borderColor: "color-mix(in srgb, var(--home-positive) 32%, var(--home-rule))",
              background: "color-mix(in srgb, var(--home-positive) 12%, var(--home-paper))",
              color: "var(--home-ink)",
            }
          : {
              borderColor: "color-mix(in srgb, var(--home-warning) 34%, var(--home-rule))",
              background: "color-mix(in srgb, var(--home-warning) 14%, var(--home-paper))",
              color: "var(--home-ink)",
            }
      }
    >
      {isValue ? "Value" : "Reach"} {formatPickDelta(value.delta)}
    </span>
  );
}

/** The template's scoring switch: a fused button box rather than separate pills. */
function ScoringToggle({
  value,
  onChange,
}: {
  value: FantasyRouteScoring;
  onChange: (value: FantasyRouteScoring) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Scoring format"
      className="inline-flex overflow-hidden rounded-[4px] border"
      style={{ borderColor: "var(--home-rule)" }}
    >
      {SCORING_OPTIONS.map((option) => {
        const active = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.key)}
            className="min-h-touch cursor-pointer px-3 font-mono text-3xs uppercase tracking-[0.08em] transition-colors duration-150"
            style={
              active
                ? { background: "var(--home-ink)", color: "var(--home-paper)" }
                : { background: "transparent", color: "var(--home-ink)" }
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The per-row expert spread: the low–high expert range as a bar positioned on
 * the board-wide rank scale, with a tick at the consensus average. Bar heat
 * follows the shared tier-rail intensity so depth on the board reads at a glance.
 */
function ExpertSpreadBar({ player, scale }: { player: Player; scale: number }) {
  const lo = player.minRank;
  const hi = player.maxRank;
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || scale <= 1) {
    return <span className="relative h-3.5 w-[120px] shrink-0" aria-hidden="true" />;
  }

  const toPercent = (rank: number) => Math.min(100, Math.max(0, ((rank - 1) / scale) * 100));
  const left = toPercent(lo as number);
  const width = Math.max(1.5, (((hi as number) - (lo as number)) / scale) * 100);
  const avg = getConsensusAvg(player);
  const intensity = getTierRailIntensity(player.tier);

  return (
    <span
      className="relative h-3.5 w-[120px] shrink-0"
      title="Expert low–high range; tick = consensus avg"
      aria-hidden="true"
    >
      <span
        className="absolute inset-x-0 top-[5px] h-1 rounded-[2px]"
        style={{ background: "color-mix(in srgb, var(--home-rule) 70%, transparent)" }}
      />
      <span
        className="absolute top-[5px] h-1 rounded-[2px]"
        style={{
          left: `${left}%`,
          width: `${Math.min(width, 100 - left)}%`,
          background: `color-mix(in srgb, var(--home-signal) ${intensity}%, var(--home-stone))`,
        }}
      />
      {avg !== null && (
        <span
          className="absolute top-[3px] h-2 w-0.5 rounded-[1px]"
          style={{ left: `${toPercent(avg)}%`, background: "var(--home-ink)" }}
        />
      )}
    </span>
  );
}

function DrawerStat({
  label,
  value,
  valueColor,
  title,
}: {
  label: string;
  value: string;
  valueColor?: string;
  title?: string;
}) {
  return (
    <div
      className="rounded-[4px] border px-2.5 py-2"
      title={title}
      style={{ borderColor: "var(--home-rule)", background: "var(--home-paper-raised)" }}
    >
      <p className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
        {label}
      </p>
      <p className="mt-1 font-mono text-base tabular-nums" style={{ color: valueColor ?? "var(--home-ink)" }}>
        {value}
      </p>
    </div>
  );
}

interface DraftPlayerDrawerProps {
  player: Player;
  publishedRank: string;
  boardTierCount: number | null;
  /** Whether the snapshot carries a fresh, attributed ADP source. */
  adpAvailable: boolean;
  /** Whether this board ranks on the overall scale, so ADP deltas mean something. */
  vsAdpMeaningful: boolean;
  /** Up to five board neighbors (the player plus two either side). */
  neighbors: Player[];
  activePosition: FantasyRoutePosition;
  /** Scoring label for the board, so the per-game panel names its own basis. */
  scoringLabel: string;
  onSelectNeighbor: (id: string) => void;
  onClose: () => void;
}

/**
 * The template's player detail: a right-hand panel with the consensus numbers,
 * a market verdict, the expert spread meter, the board neighborhood, and the
 * browser-local queue and note controls. The draft tracker and best ball keep
 * the shared PlayerDetailDrawer; this panel is the rankings board's own read.
 */
function DraftPlayerDrawer({
  player,
  publishedRank,
  boardTierCount,
  adpAvailable,
  vsAdpMeaningful,
  neighbors,
  activePosition,
  scoringLabel,
  onSelectNeighbor,
  onClose,
}: DraftPlayerDrawerProps) {
  const panelRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const queue = usePlayerQueue();
  const notes = usePlayerNotes();
  const [draftNote, setDraftNote] = useState(() => notes.getNote(player.id));

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Reset the note draft whenever a different player opens the drawer.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seed local draft from the persisted note on player change
    setDraftNote(notes.getNote(player.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.id]);

  // Capture focus on open, trap Tab within the panel, and restore on close.
  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;
      const focusIsInside = Boolean(activeElement && panel.contains(activeElement));

      if (event.shiftKey && (activeElement === panel || activeElement === first || !focusIsInside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === panel || activeElement === last || !focusIsInside)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, []);

  const isQueued = queue.isQueued(player.id);
  const value = adpAvailable && vsAdpMeaningful ? getValueVsAdp(player) : null;
  const spread = getConsensusSpread(player);
  const avg = getConsensusAvg(player);
  const vsAdp = adpAvailable && vsAdpMeaningful ? describeVsAdp(player) : null;

  const verdict = value
    ? !hasReliableAdpSample(player)
      ? {
          // signal:null can also mean "sample too thin to judge" — never call
          // that market agreement (fantasyUtils gates at 20 mock selections).
          text: "Too few mock selections behind his ADP to judge the market gap yet, so no market read.",
          color: "var(--home-ink-muted)",
          background: "color-mix(in srgb, var(--home-ink) 4%, transparent)",
        }
      : value.signal === "value"
        ? {
            text: `Rooms take him about ${Math.round(Math.abs(value.delta))} picks after the consensus rank. Value if he lasts to your pick.`,
            color: "var(--home-positive)",
            background: "color-mix(in srgb, var(--home-positive) 7%, transparent)",
          }
        : value.signal === "reach"
          ? {
              text: `Rooms take him about ${Math.round(Math.abs(value.delta))} picks before the consensus rank. Plan the reach or let him go.`,
              color: "var(--home-negative)",
              background: "color-mix(in srgb, var(--home-negative) 6%, transparent)",
            }
          : {
              text: "Market and consensus sit inside this player's noise band. Take him on schedule.",
              color: "var(--home-ink-muted)",
              background: "color-mix(in srgb, var(--home-ink) 4%, transparent)",
            }
    : null;

  const spreadFill = spread
    ? spread.level === "tight"
      ? "color-mix(in srgb, var(--home-positive) 34%, var(--home-paper))"
      : spread.level === "mixed"
        ? "color-mix(in srgb, var(--home-signal) 46%, var(--home-paper))"
        : "color-mix(in srgb, var(--home-warning) 38%, var(--home-paper))"
    : "color-mix(in srgb, var(--home-stone) 70%, var(--home-paper))";

  const lo = Number.isFinite(player.minRank) ? (player.minRank as number) : null;
  const hi = Number.isFinite(player.maxRank) ? (player.maxRank as number) : null;
  const avgTickLeft =
    lo !== null && hi !== null && avg !== null
      ? Math.min(100, Math.max(0, ((avg - lo) / Math.max(1, hi - lo)) * 100))
      : null;

  // Prior-season scoring, present only when this player was matched to a game
  // log that cleared the games-played floor. The span guards a flat line (a
  // player whose low and high coincide) from dividing by zero.
  const gameLog = player.gameLog;
  const gameLogSpan = gameLog ? Math.max(0.1, gameLog.high - gameLog.low) : 0;
  const gameLogTickLeft = (value: number): number =>
    gameLog ? Math.min(100, Math.max(0, ((value - gameLog.low) / gameLogSpan) * 100)) : 0;

  const boardLabel = activePosition === "overall" || activePosition === "flex" ? "overall" : "on this board";

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close player detail"
        tabIndex={-1}
        className="absolute inset-0 cursor-default"
        style={{ background: "color-mix(in srgb, var(--home-ink) 38%, transparent)" }}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${player.name} detail`}
        tabIndex={-1}
        className="relative flex h-full w-[min(400px,94vw)] flex-col gap-4 overflow-y-auto overscroll-contain border-l p-5"
        style={{
          borderColor: "var(--home-rule)",
          background: "var(--home-paper)",
          boxShadow: "-18px 0 44px color-mix(in srgb, var(--home-ink) 18%, transparent)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={MONO_LABEL_CLASS} style={{ color: "var(--home-signal)" }}>
              R{publishedRank} {boardLabel}
              {Number.isFinite(player.tier)
                ? ` · Tier ${player.tier}${boardTierCount ? ` of ${boardTierCount}` : ""}`
                : ""}
            </p>
            <h2 className="mt-1.5 truncate text-2xl font-semibold leading-tight tracking-tight">{player.name}</h2>
            <p className="mt-1 font-mono text-2xs uppercase tracking-[0.06em]" style={{ color: "var(--home-ink-muted)" }}>
              {player.position}
              {Number.isFinite(player.positionRank) ? player.positionRank : ""} · {player.team || "FA"}
              {player.byeWeek ? ` · Bye ${player.byeWeek}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] border"
            style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)", color: "var(--home-ink)" }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <DrawerStat label="Consensus avg" value={formatAvg(player)} title={FANTASY_AVG_RANK_TOOLTIP} />
          <DrawerStat
            label="Expert range"
            value={formatExpertRange(player)}
            title={FANTASY_EXPERT_SPREAD_TOOLTIP}
          />
          {adpAvailable && Number.isFinite(player.adp) && (
            <DrawerStat label="Market ADP" value={formatAdp(player.adp)} title={FANTASY_ADP_TOOLTIP} />
          )}
          {vsAdp && (
            <DrawerStat
              label="vs ADP"
              value={vsAdp.text}
              valueColor={vsAdp.color}
              title={
                vsAdp.judged
                  ? FANTASY_VS_ADP_TOOLTIP
                  : "Early mock-draft sample, so the gap carries no value or reach read yet"
              }
            />
          )}
        </div>

        {verdict && (
          <p
            className="border-l-[3px] px-3 py-2.5 text-sm leading-6"
            style={{ borderColor: verdict.color, background: verdict.background, color: "var(--home-ink)" }}
          >
            {verdict.text}
          </p>
        )}

        {lo !== null && hi !== null && (
          <div>
            <div className="flex items-baseline justify-between gap-2.5">
              <span
                className={`${MONO_LABEL_CLASS} inline-flex items-center`}
                style={{ color: "var(--home-ink-muted)" }}
              >
                Expert spread
                <MetricTooltip term="Expert spread" definition={FANTASY_EXPERT_SPREAD_TOOLTIP} />
              </span>
              {spread && (
                <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
                  {spread.label}
                </span>
              )}
            </div>
            <div
              className="relative mt-2 h-2.5 overflow-hidden rounded-full"
              style={{ background: "color-mix(in srgb, var(--home-ink) 8%, var(--home-paper))" }}
            >
              <span className="absolute inset-0" style={{ background: spreadFill }} />
              {avgTickLeft !== null && (
                <span
                  className="absolute bottom-0 top-0 w-0.5"
                  style={{ left: `calc(${avgTickLeft}% - 1px)`, background: "var(--home-ink)" }}
                />
              )}
            </div>
            <div
              className="mt-1.5 flex justify-between font-mono text-3xs uppercase tracking-[0.08em]"
              style={{ color: "var(--home-ink-muted)" }}
            >
              <span>Best {lo}</span>
              {avg !== null && <span style={{ color: "var(--home-ink)" }}>Avg {avg.toFixed(1)}</span>}
              <span>Worst {hi}</span>
            </div>
          </div>
        )}

        {gameLog && (
          <div>
            <div className="flex items-baseline justify-between gap-2.5">
              <span
                className={`${MONO_LABEL_CLASS} inline-flex items-center`}
                style={{ color: "var(--home-ink-muted)" }}
              >
                Points per game
                <MetricTooltip
                  term="Points per game"
                  definition={FANTASY_POINTS_PER_GAME_TOOLTIP}
                />
              </span>
              <span
                className="font-mono text-3xs uppercase tracking-[0.1em]"
                style={{ color: "var(--home-ink-muted)" }}
              >
                {gameLog.season} season · {scoringLabel} · {gameLog.games}{" "}
                {gameLog.games === 1 ? "game" : "games"}
              </span>
            </div>
            <div
              className="relative mt-2 h-2.5 overflow-hidden rounded-full"
              style={{ background: "color-mix(in srgb, var(--home-stone) 70%, var(--home-paper))" }}
            >
              <span
                className="absolute bottom-0 top-0 w-0.5"
                title="Median"
                style={{
                  left: `calc(${gameLogTickLeft(gameLog.median)}% - 1px)`,
                  background: "var(--home-ink)",
                }}
              />
              <span
                className="absolute bottom-0 top-0 w-0.5"
                title="Average"
                style={{
                  left: `calc(${gameLogTickLeft(gameLog.average)}% - 1px)`,
                  background: "var(--home-signal)",
                }}
              />
            </div>
            <dl className="mt-2 grid grid-cols-4 gap-2">
              <div>
                <dt className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
                  Low
                </dt>
                <dd
                  className="mt-0.5 font-mono text-2xs tabular-nums"
                  style={{ color: "var(--home-ink-muted)" }}
                >
                  {gameLog.low.toFixed(1)}
                </dd>
              </div>
              <div>
                <dt className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
                  Median
                </dt>
                <dd className="mt-0.5 font-mono text-2xs tabular-nums" style={{ color: "var(--home-ink)" }}>
                  {gameLog.median.toFixed(1)}
                </dd>
              </div>
              <div>
                <dt className={MONO_LABEL_CLASS} style={{ color: "var(--home-signal)" }}>
                  Avg
                </dt>
                <dd
                  className="mt-0.5 font-mono text-2xs font-medium tabular-nums"
                  style={{ color: "var(--home-ink)" }}
                >
                  {gameLog.average.toFixed(1)}
                </dd>
              </div>
              <div>
                <dt className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
                  High
                </dt>
                <dd
                  className="mt-0.5 font-mono text-2xs tabular-nums"
                  style={{ color: "var(--home-ink-muted)" }}
                >
                  {gameLog.high.toFixed(1)}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {neighbors.length > 1 && (
          <div>
            <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
              Board neighborhood
            </span>
            <ul
              className="mt-2 list-none overflow-hidden rounded-[6px] border"
              style={{ borderColor: "var(--home-rule)" }}
            >
              {neighbors.map((neighbor) => {
                const selected = neighbor.id === player.id;
                return (
                  <li
                    key={neighbor.id}
                    className="border-t first:border-t-0"
                    style={{ borderColor: "color-mix(in srgb, var(--home-rule) 55%, transparent)" }}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectNeighbor(neighbor.id)}
                      aria-current={selected || undefined}
                      className="flex min-h-11 w-full items-baseline gap-2.5 border-l-[3px] px-2.5 py-1.5 text-left"
                      style={{
                        borderColor: selected ? "var(--home-signal)" : "transparent",
                        background: selected
                          ? "color-mix(in srgb, var(--home-signal) 8%, transparent)"
                          : "transparent",
                        color: "var(--home-ink)",
                      }}
                    >
                      <span
                        className="w-7 shrink-0 text-right font-mono text-2xs"
                        style={{ color: "var(--home-ink-muted)" }}
                      >
                        {getPublishedBoardRank(neighbor, activePosition)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">
                        {neighbor.name}
                      </span>
                      <span className="shrink-0 font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                        {formatAvg(neighbor)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={() => queue.toggle(player.id)}
          aria-pressed={isQueued}
          className="inline-flex min-h-touch items-center justify-center gap-2 rounded-[4px] border font-mono text-2xs uppercase tracking-[0.08em]"
          style={
            isQueued
              ? {
                  borderColor: "color-mix(in srgb, var(--home-signal) 60%, var(--home-rule))",
                  background: "color-mix(in srgb, var(--home-signal) 26%, var(--home-paper))",
                  color: "var(--home-ink)",
                }
              : { borderColor: "var(--home-rule)", background: "var(--home-paper)", color: "var(--home-ink)" }
          }
        >
          <Star size={14} fill={isQueued ? "currentColor" : "none"} aria-hidden="true" />
          {isQueued ? "Queued" : "Add to queue"}
        </button>

        <div>
          <label htmlFor="board-player-note" className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
            Private note
          </label>
          <textarea
            id="board-player-note"
            name="board-player-note"
            rows={2}
            value={draftNote}
            maxLength={notes.maxLength}
            onChange={(event) => {
              setDraftNote(event.target.value);
              notes.setNote(player.id, event.target.value);
            }}
            placeholder="Handcuff for Hall… target round 6… avoid."
            className="mt-2 block w-full resize-none rounded-[4px] border px-2.5 py-2 font-mono text-xs leading-normal"
            style={{
              borderColor: "var(--home-rule)",
              background: "var(--home-paper-raised)",
              color: "var(--home-ink)",
            }}
          />
          <p className="mt-1 text-right font-mono text-3xs" style={{ color: "var(--home-ink-muted)" }}>
            {draftNote.length}/{notes.maxLength} · saved on this device
          </p>
        </div>

        <p className="font-mono text-3xs leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
          Ranks, tiers, and expert ranges come from the published snapshot, and per-game scoring is the prior
          regular season from nflverse. Queue and notes stay on this device.
        </p>
      </aside>
    </div>
  );
}

interface FantasyFootballClientProps {
  initialState: FantasySearchState;
}

interface TierGroup {
  tier: number | null;
  rows: Player[];
}

export function FantasyFootballClient({ initialState }: FantasyFootballClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialState.query);
  const [detailPlayerId, setDetailPlayerId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(RANKINGS_PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );

  const queue = usePlayerQueue();
  const notes = usePlayerNotes();

  const hasManagedParams = ["position", "scoring", "view", "q"].some(
    (param) => searchParams.get(param) !== null
  );
  const routeState = useMemo<FantasySearchState>(
    () => (hasManagedParams ? normalizeFantasyState(searchParams) : initialState),
    [hasManagedParams, initialState, searchParams]
  );

  useEffect(() => {
    const urlQueryMatches =
      (searchParams.get("q") ?? "") === routeState.query &&
      (routeState.query.length > 0 || searchParams.get("q") === null);

    if (
      searchParams.get("position") === routeState.position &&
      searchParams.get("scoring") === routeState.scoring &&
      urlQueryMatches
    ) {
      return;
    }

    startTransition(() => {
      router.replace(buildFantasyHref(routeState, searchParams), { scroll: false });
    });
  }, [routeState, router, searchParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser Back/Forward can replace the URL-backed query
    setSearchQuery(routeState.query);
  }, [routeState.query]);

  function updateRouteState(nextState: Partial<FantasySearchState>) {
    const nextRouteState = {
      ...routeState,
      query: searchQuery,
      ...nextState,
    };

    startTransition(() => {
      // Filter state replaces rather than pushes. Pushing stacked one history
      // entry per position or scoring tap, so Back walked the filter history
      // instead of leaving the page.
      router.replace(buildFantasyHref(nextRouteState, searchParams), { scroll: false });
    });
  }

  const { players, metadata, sliceMetadata, sliceMetadataMap, isLoading, error, retry } = useFantasySnapshot({
    position: routeState.position,
    scoring: routeState.scoring,
  });

  const currentSliceUnavailable = Boolean(sliceMetadata && !sliceMetadata.available);
  const localToolsMemoryOnly =
    queue.persistenceStatus === "memory-only" || notes.persistenceStatus === "memory-only";
  const adpSource = metadata?.adpSource ?? null;
  const adpFreshness = getFantasyAdpFreshness(adpSource?.asOf, metadata?.season);
  const adpAvailable = Boolean(adpSource) && adpFreshness !== "stale";
  const vsAdpMeaningful = routeState.position === "overall" || routeState.position === "flex";
  const selectedScoringLabel = FANTASY_SCORING_LABELS[routeState.scoring];
  const currentSourceUpdatedAt = sliceMetadata?.updatedAt ?? metadata?.upstreamUpdatedAt ?? null;
  const sourceStaleness = getSnapshotStaleness(currentSourceUpdatedAt);

  const filteredPlayers = useMemo(() => {
    if (currentSliceUnavailable) {
      return [];
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return players;
    }

    return players.filter((player) => getFantasyPlayerSearchText(player).includes(query));
  }, [currentSliceUnavailable, players, searchQuery]);

  const maxTier = useMemo(() => {
    let max = 0;
    for (const player of players) {
      if (player.tier && player.tier > max) {
        max = player.tier;
      }
    }
    return max;
  }, [players]);

  // Reset the window whenever the board, scoring, or search changes so a
  // narrowed list never starts deep into a stale offset.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on filter change
    setVisibleCount(RANKINGS_PAGE_SIZE);
  }, [routeState.position, routeState.scoring, searchQuery]);

  const windowedPlayers = filteredPlayers.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPlayers.length;

  // One rank scale for every visible spread bar. Scaling to the rendered
  // window (not the full 500-player board) keeps the template's geometry:
  // early-round ranges stay readable instead of compressing into slivers.
  const boardScale = useMemo(() => {
    let max = 0;
    for (const player of windowedPlayers) {
      if (Number.isFinite(player.maxRank) && (player.maxRank as number) > max) {
        max = player.maxRank as number;
      }
    }
    return Math.max(max, 10);
  }, [windowedPlayers]);

  useEffect(() => {
    if (!hasMore || typeof IntersectionObserver === "undefined") return;
    // On narrow screens auto-extending the list keeps pushing the footer away
    // from someone scrolling toward it, so mobile uses the explicit Load more.
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => Math.min(count + RANKINGS_PAGE_SIZE, filteredPlayers.length));
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, filteredPlayers.length]);

  // Group the windowed rows into consecutive-tier plates. The cliff between
  // plates comes from the consensus averages either side of the boundary, so
  // plate spacing scales with how large the drop actually is.
  const tierGroups = useMemo<TierGroup[]>(() => {
    const groups: TierGroup[] = [];
    for (const { player, tier, startsTier } of withTierBreaks(windowedPlayers)) {
      const current = groups[groups.length - 1];
      if (!current || startsTier || (tier === null) !== (current.tier === null)) {
        groups.push({ tier, rows: [player] });
      } else {
        current.rows.push(player);
      }
    }
    return groups;
  }, [windowedPlayers]);

  const detailPlayer = useMemo(
    () => (detailPlayerId ? players.find((player) => player.id === detailPlayerId) ?? null : null),
    [detailPlayerId, players]
  );

  const neighborhood = useMemo(() => {
    if (!detailPlayer) return [];
    const list = filteredPlayers.some((player) => player.id === detailPlayer.id)
      ? filteredPlayers
      : players;
    const index = list.findIndex((player) => player.id === detailPlayer.id);
    if (index < 0) return [];
    return list.slice(Math.max(0, index - 2), index + 3);
  }, [detailPlayer, filteredPlayers, players]);

  const positionOptions: PositionFilterOption<FantasyRoutePosition>[] = POSITION_OPTIONS.map((position) => {
    const meta = sliceMetadataMap?.[position];
    return {
      value: position,
      label: FANTASY_POSITION_LABELS[position],
      position: position === "overall" || position === "flex" ? undefined : position.toUpperCase(),
      available: meta ? meta.available : true,
      unavailableLabel: meta?.reason,
    };
  });

  const snapshotStamp = formatStamp(metadata?.generatedAt);
  const adpStamp = formatStamp(adpSource?.asOf);
  const sourceStamp = formatStamp(currentSourceUpdatedAt);

  const headerChips: { label: string; tone?: CSSProperties }[] = [
    { label: `${selectedScoringLabel} board` },
    { label: "FantasyPros consensus" },
    ...(snapshotStamp ? [{ label: `Snapshot ${snapshotStamp}` }] : []),
    ...(adpSource && adpAvailable && adpStamp
      ? [{ label: `ADP ${adpSource.provider} · ${adpStamp}` }]
      : []),
    ...(adpSource && adpFreshness === "prior-season"
      ? [{ label: "ADP prior season", tone: STALENESS_TONE.aging }]
      : []),
    ...(adpSource && adpFreshness === "stale"
      ? [{ label: "ADP stale · signals hidden", tone: STALENESS_TONE.stale }]
      : []),
    ...(sourceStaleness !== "fresh"
      ? [
          {
            label: `${getSnapshotStalenessLabel(sourceStaleness)} · source ${sourceStamp ?? "date unknown"}`,
            tone: STALENESS_TONE[sourceStaleness],
          },
        ]
      : []),
  ];

  const countLine = isLoading
    ? "Loading players…"
    : error
      ? "Rankings unavailable"
      : currentSliceUnavailable
        ? "Board unavailable"
        : hasMore
          ? `${windowedPlayers.length} of ${filteredPlayers.length} shown`
          : `${filteredPlayers.length} of ${players.length} shown`;

  const metricColumns: { label: string; className: string; title?: string }[] = [
    { label: "Expert spread", className: "w-[120px]", title: FANTASY_EXPERT_SPREAD_TOOLTIP },
    { label: "Range", className: "w-16 text-right", title: FANTASY_EXPERT_SPREAD_TOOLTIP },
    { label: "Avg", className: "w-12 text-right", title: FANTASY_AVG_RANK_TOOLTIP },
    ...(adpAvailable
      ? [
          { label: "ADP", className: "w-12 text-right", title: FANTASY_ADP_TOOLTIP },
          { label: "vs ADP", className: "w-16 text-right", title: FANTASY_VS_ADP_TOOLTIP },
        ]
      : []),
  ];

  function renderTierSection(group: TierGroup, index: number): ReactNode {
    const firstRank = getPublishedBoardRank(group.rows[0], routeState.position);
    const lastRank = getPublishedBoardRank(group.rows[group.rows.length - 1], routeState.position);
    const railTone =
      group.tier !== null
        ? `color-mix(in srgb, var(--home-signal) ${getTierRailIntensity(group.tier)}%, var(--home-rule))`
        : "var(--home-rule)";

    let cliff = 0;
    if (index > 0) {
      const previous = tierGroups[index - 1];
      const prevAvg = getConsensusAvg(previous.rows[previous.rows.length - 1]);
      const nextAvg = getConsensusAvg(group.rows[0]);
      if (prevAvg !== null && nextAvg !== null) {
        cliff = Math.max(0, Number((nextAvg - prevAvg).toFixed(1)));
      }
    }
    const marginTop = index === 0 ? 0 : Math.round(Math.min(48, Math.max(14, cliff * 9))) || 18;

    return (
      <section key={`tier-${group.tier ?? "untiered"}-${group.rows[0].id}`} style={{ marginTop }}>
        {index > 0 && cliff > 0 && (
          <div aria-hidden="true" className="flex items-center gap-3 px-0.5 pb-2.5">
            <span
              className="flex-1 border-t border-dashed"
              style={{ borderColor: "color-mix(in srgb, var(--home-ink) 24%, transparent)" }}
            />
            <span
              className="whitespace-nowrap font-mono text-3xs uppercase tracking-[0.12em]"
              style={{ color: "var(--home-signal)" }}
            >
              ↓ {cliff.toFixed(1)} avg-rank cliff
            </span>
            <span
              className="flex-1 border-t border-dashed"
              style={{ borderColor: "color-mix(in srgb, var(--home-ink) 24%, transparent)" }}
            />
          </div>
        )}
        <div
          className="overflow-hidden rounded-lg border border-l-[3px]"
          style={{
            borderColor: "var(--home-rule)",
            borderLeftColor: railTone,
            background: "var(--home-paper-raised)",
          }}
        >
          <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 px-3.5 pb-2 pt-2.5">
            <span className="text-2xl font-bold leading-none tracking-tight tabular-nums">
              {group.tier !== null ? String(group.tier).padStart(2, "0") : "—"}
            </span>
            <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
              {group.tier !== null ? "Tier" : "No published tier"}
            </span>
            <span className="font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
              {group.rows.length} {group.rows.length === 1 ? "player" : "players"}
            </span>
            <span className="ml-auto font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
              R{firstRank}–R{lastRank}
            </span>
          </div>
          <ul className="m-0 list-none p-0">
            {group.rows.map((player) => {
              const vsAdp = adpAvailable && vsAdpMeaningful ? describeVsAdp(player) : null;
              const tone = getPositionTone(player.position);
              return (
                <li
                  key={player.id}
                  className="relative border-t transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--home-paper-alt)_55%,transparent)]"
                  style={{ borderColor: "color-mix(in srgb, var(--home-rule) 60%, transparent)" }}
                >
                  {/* The open control overlays the row instead of wrapping it: an
                      aria-label on a wrapping button would override every cell,
                      leaving screen readers nothing but "Open X detail" rows. */}
                  <button
                    type="button"
                    aria-label={`Open ${player.name} detail`}
                    onClick={() => setDetailPlayerId(player.id)}
                    className="absolute inset-0 z-[1] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--home-signal)]"
                  />
                  <div
                    className="flex min-h-11 w-full flex-wrap items-center gap-x-4 gap-y-1 px-3.5 py-1.5 text-left"
                    style={{ color: "var(--home-ink)" }}
                  >
                    <span
                      className="w-[34px] shrink-0 text-right font-mono text-sm"
                      title={queue.isQueued(player.id) ? "Board rank · in your queue" : "Board rank"}
                      style={{
                        color: queue.isQueued(player.id) ? "var(--home-signal)" : "var(--home-ink)",
                      }}
                    >
                      {getPublishedBoardRank(player, routeState.position)}
                    </span>
                    <span className="flex min-w-0 flex-[1_1_200px] items-baseline gap-2">
                      <span className="truncate text-sm font-semibold tracking-tight">{player.name}</span>
                      <span
                        className="inline-flex shrink-0 items-center rounded-[2px] border px-1.5 py-0.5 font-mono text-3xs tracking-[0.06em]"
                        style={{ ...tone, color: "var(--home-ink)" }}
                      >
                        {player.position}
                        {Number.isFinite(player.positionRank) ? player.positionRank : ""}
                      </span>
                      <span
                        className="shrink-0 font-mono text-3xs uppercase tracking-[0.06em]"
                        style={{ color: "var(--home-ink-muted)" }}
                      >
                        {player.team}
                        {player.byeWeek ? ` · Bye ${player.byeWeek}` : ""}
                      </span>
                      {adpAvailable && vsAdpMeaningful && <ValueReachChip player={player} />}
                    </span>
                    <span className="flex max-w-full flex-wrap items-center gap-x-4 gap-y-1">
                      <ExpertSpreadBar player={player} scale={boardScale} />
                      <span className="sr-only">Expert range</span>
                      <span
                        className="w-16 text-right font-mono text-xs"
                        title={FANTASY_EXPERT_SPREAD_TOOLTIP}
                        style={{ color: "var(--home-ink-muted)" }}
                      >
                        {formatExpertRange(player)}
                      </span>
                      <span className="sr-only">Consensus average</span>
                      <span className="w-12 text-right font-mono text-xs font-medium" title={FANTASY_AVG_RANK_TOOLTIP}>
                        {formatAvg(player)}
                      </span>
                      {adpAvailable && (
                        <>
                          <span className="sr-only">ADP</span>
                          <span
                            className="w-12 text-right font-mono text-xs"
                            title={FANTASY_ADP_TOOLTIP}
                            style={{ color: "var(--home-ink-muted)" }}
                          >
                            {formatAdp(player.adp)}
                          </span>
                          <span className="sr-only">versus ADP</span>
                          <span
                            className="w-16 text-right font-mono text-xs"
                            title={
                              !vsAdpMeaningful
                                ? "ADP deltas compare to overall rank, so position boards do not get one"
                                : vsAdp && !vsAdp.judged
                                  ? "Early mock-draft sample, so the gap carries no value or reach read yet"
                                  : FANTASY_VS_ADP_TOOLTIP
                            }
                            style={{ color: vsAdp ? vsAdp.color : "var(--home-ink-muted)" }}
                          >
                            {vsAdp ? vsAdp.text : "—"}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section
      className="home-page home-dash min-h-screen"
      aria-label="Fantasy football rankings"
      data-testid="fantasy-football-shell"
      data-hydrated={isHydrated ? "true" : "false"}
    >
      <header className={`${SHELL_CLASS} flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 pb-4 pt-7`}>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
          <span
            className="inline-flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.1em]"
            style={{ color: "var(--home-ink-muted)" }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--home-signal)" }} aria-hidden="true" />
            Draft rankings{metadata?.season ? ` · ${metadata.season}` : ""}
          </span>
          <h1
            className="m-0 font-semibold leading-none"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.125rem)", letterSpacing: "-0.05em" }}
          >
            Fantasy Football{" "}
            <em style={{ fontFamily: "var(--font-home-serif)", fontStyle: "italic", fontWeight: 500 }}>Rankings</em>
          </h1>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {headerChips.map((chip) => (
            <span
              key={chip.label}
              className={HEADER_CHIP_CLASS}
              style={
                chip.tone ?? {
                  borderColor: "var(--home-rule)",
                  background: "var(--home-paper-alt)",
                  color: "var(--home-ink-muted)",
                }
              }
            >
              {chip.label}
            </span>
          ))}
        </div>
      </header>

      <nav
        aria-label="Fantasy tools"
        className={`${SHELL_CLASS} flex flex-wrap items-center gap-1.5 pb-4`}
      >
        {FANTASY_TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className={`${HEADER_CHIP_CLASS} min-h-touch no-underline`}
            style={{
              borderColor: "var(--home-rule)",
              background: "var(--home-paper-alt)",
              color: "var(--home-ink)",
            }}
          >
            {tool.label}
            <span aria-hidden="true">&nbsp;↗</span>
          </Link>
        ))}
      </nav>

      <div
        data-testid="fantasy-board-controls"
        className="z-30 border-y md:sticky md:top-[4.5rem]"
        style={{
          borderColor: "var(--home-rule)",
          background: "color-mix(in srgb, var(--home-paper) 90%, transparent)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div className={`${SHELL_CLASS} flex flex-wrap items-center gap-x-3.5 gap-y-2.5 py-2.5`}>
          <PositionFilterBar
            ariaLabel="Position board"
            options={positionOptions}
            value={routeState.position}
            onChange={(position) => updateRouteState({ position })}
          />
          <ScoringToggle value={routeState.scoring} onChange={(scoring) => updateRouteState({ scoring })} />
          <div className="relative">
            <label htmlFor="fantasy-search" className="sr-only">
              Search the current rankings board
            </label>
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
              style={{ color: "var(--home-ink-muted)" }}
              aria-hidden="true"
            />
            <input
              id="fantasy-search"
              name="fantasy-search"
              value={searchQuery}
              maxLength={80}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                updateRouteState({ query: event.target.value });
              }}
              disabled={currentSliceUnavailable}
              autoComplete="off"
              placeholder="Search player or team"
              className="min-h-touch w-[200px] rounded-[4px] border pl-8 pr-2.5 font-mono text-xs placeholder:text-[var(--home-ink-muted)] disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: "var(--home-rule)",
                background: "var(--home-paper-raised)",
                color: "var(--home-ink)",
              }}
            />
          </div>
          <span
            aria-live={error ? undefined : "polite"}
            className="ml-auto whitespace-nowrap font-mono text-2xs"
            style={{ color: "var(--home-ink-muted)" }}
          >
            {countLine}
          </span>
        </div>
      </div>

      <div className={`${SHELL_CLASS} pb-10 pt-4`}>
        <h2 className="sr-only">{FANTASY_POSITION_LABELS[routeState.position]} rankings</h2>

        {localToolsMemoryOnly && (
          <div
            role="status"
            className="mb-4 rounded-lg border px-4 py-3 text-sm"
            style={{
              borderColor: "color-mix(in srgb, var(--home-warning) 55%, var(--home-rule))",
              background: "color-mix(in srgb, var(--home-warning) 10%, var(--home-paper))",
            }}
          >
            <p className="font-semibold">Browser storage is unavailable.</p>
            <p className="mt-1" style={{ color: "var(--home-ink-muted)" }}>
              Queue and notes still work in this tab, but they will not survive a reload.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-2" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={`loading-${index}`}
                className="h-11 rounded-lg border motion-safe:animate-pulse"
                style={{
                  borderColor: "var(--home-rule)",
                  background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
                }}
              />
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-lg border px-5 py-8"
            style={{
              borderColor: "var(--home-negative)",
              background: "color-mix(in srgb, var(--home-negative) 8%, var(--home-paper))",
            }}
          >
            <p className="font-semibold" style={{ color: "var(--home-negative)" }}>
              {error}
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--home-ink-muted)" }}>
              Check your connection and try loading the published snapshot again.
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-4 inline-flex min-h-touch items-center rounded-full border px-4 text-sm font-semibold"
              style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
            >
              Retry rankings
            </button>
          </div>
        ) : currentSliceUnavailable ? (
          <div
            className="rounded-lg border px-5 py-12 text-center"
            style={{
              borderColor: "color-mix(in srgb, var(--home-warning) 32%, var(--home-rule))",
              background: "color-mix(in srgb, var(--home-warning) 10%, var(--home-paper))",
            }}
          >
            <p className="text-lg font-semibold">
              {selectedScoringLabel} {FANTASY_POSITION_LABELS[routeState.position]} rankings are unavailable.
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--home-ink-muted)" }}>
              {sliceMetadata?.reason ??
                "This scoring-position combination is not published in the current snapshot."}
            </p>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div
            className="rounded-lg border border-dashed px-5 py-9 text-center"
            style={{ borderColor: "var(--home-rule)" }}
          >
            <p className="font-mono text-xs" style={{ color: "var(--home-ink-muted)" }}>
              No players match on this board.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                updateRouteState({ query: "", position: "overall" });
              }}
              className="mt-3.5 inline-flex min-h-touch items-center rounded-full border px-4 font-mono text-2xs uppercase tracking-[0.06em]"
              style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
            >
              Clear search
            </button>
          </div>
        ) : (
          <>
            <div
              aria-hidden="true"
              className="hidden items-center gap-x-4 px-3.5 pb-2 font-mono text-3xs uppercase tracking-[0.12em] md:flex"
              style={{ color: "var(--home-ink-muted)" }}
            >
              <span className="w-[34px] shrink-0" />
              <span className="min-w-0 flex-[1_1_200px]">
                <MetricTooltip term="Player" definition={FANTASY_PLAYER_COLUMN_TOOLTIP}>
                  Player
                </MetricTooltip>
              </span>
              <span className="flex shrink-0 items-center gap-4">
                {metricColumns.map((column) => (
                  <span key={column.label} className={column.className}>
                    {column.title ? (
                      <MetricTooltip term={column.label} definition={column.title}>
                        {column.label}
                      </MetricTooltip>
                    ) : (
                      column.label
                    )}
                  </span>
                ))}
              </span>
            </div>
            <div>{tierGroups.map((group, index) => renderTierSection(group, index))}</div>
            {hasMore && (
              <div ref={sentinelRef} className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((count) => Math.min(count + RANKINGS_PAGE_SIZE, filteredPlayers.length))
                  }
                  className="inline-flex min-h-touch items-center gap-2 rounded-full border px-5 text-sm font-semibold"
                  style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}
                >
                  Load more ({filteredPlayers.length - windowedPlayers.length} left)
                </button>
              </div>
            )}
          </>
        )}

        <div
          className="mt-7 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2 border-t pt-3.5"
          style={{ borderColor: "var(--home-rule)" }}
        >
          <span
            className="font-mono text-2xs"
            style={{
              color: sourceStaleness === "fresh" ? "var(--home-ink-muted)" : "var(--home-warning)",
            }}
          >
            {sourceStaleness === "fresh"
              ? `Refreshes daily through draft season, weekly after${snapshotStamp ? ` · snapshot ${snapshotStamp}` : ""}`
              : `${getSnapshotStalenessLabel(sourceStaleness)} board · source updated ${sourceStamp ?? "date unknown"}`}
          </span>
          <nav aria-label="More fantasy tools" className="flex flex-wrap gap-x-5 gap-y-2">
            {FANTASY_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="inline-flex min-h-touch items-center text-sm font-semibold no-underline"
                style={{ color: "var(--home-ink)" }}
              >
                {tool.label}
                <span aria-hidden="true">&nbsp;↗</span>
              </Link>
            ))}
          </nav>
        </div>

        <section className="mt-10" aria-labelledby="fantasy-rankings-questions">
          <div className="max-w-3xl">
            <p className="home-kicker mb-2">How the board works</p>
            <h2 id="fantasy-rankings-questions" className="text-xl font-semibold sm:text-2xl">
              Fantasy rankings questions
            </h2>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {FANTASY_FOOTBALL_FAQ.map((item) => (
              <article key={item.question} className="home-card p-5 sm:p-6">
                <h3 className="text-lg font-semibold">{item.question}</h3>
                <p className="mt-3 text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>

      {detailPlayer && (
        <DraftPlayerDrawer
          player={detailPlayer}
          publishedRank={getPublishedBoardRank(detailPlayer, routeState.position)}
          boardTierCount={maxTier > 0 ? maxTier : null}
          adpAvailable={adpAvailable}
          vsAdpMeaningful={vsAdpMeaningful}
          neighbors={neighborhood}
          activePosition={routeState.position}
          scoringLabel={selectedScoringLabel}
          onSelectNeighbor={(id) => setDetailPlayerId(id)}
          onClose={() => setDetailPlayerId(null)}
        />
      )}
    </section>
  );
}

export default FantasyFootballClient;
