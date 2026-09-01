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
import { useDebounce } from "@/hooks/useDebounce";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import { SeasonalScopeNote } from "@/components/fantasy/SeasonalScopeNote";
import { usePlayerQueue } from "@/hooks/usePlayerQueue";
import { usePlayerNotes } from "@/hooks/usePlayerNotes";
import {
  FANTASY_POSITION_LABELS,
  FANTASY_SCORING_LABELS,
  FantasyRoutePosition,
  FantasyRouteScoring,
  getFantasyPlayerSearchText,
  FANTASY_RANKINGS_PAGE_SIZE,
  type FantasySnapshot,
} from "@/lib/fantasy";
import { MetricTooltip } from "@/components/investments/MetricTooltip";
import {
  FANTASY_ADP_TOOLTIP,
  FANTASY_AVG_RANK_TOOLTIP,
  FANTASY_EXPERT_SPREAD_TOOLTIP,
  FANTASY_PLAYER_COLUMN_TOOLTIP,
  getFantasyPointsPerGameTooltip,
  FANTASY_PRIOR_SEASON_ADP_TOOLTIP,
  FANTASY_REACH_TOOLTIP,
  FANTASY_VALUE_TOOLTIP,
  FANTASY_VORP_TOOLTIP,
  FANTASY_VS_ADP_TOOLTIP,
  HEADER_CHIP_CLASS,
  MONO_LABEL_CLASS,
  SHELL_CLASS,
  formatAdp,
  formatPickDelta,
  formatRankValue,
  getConsensusAvg,
  getConsensusSpread,
  getFantasyAdpFreshness,
  getNflRegularSeasonWeek,
  getPositionTone,
  getSnapshotStaleness,
  getSnapshotStalenessLabel,
  getTierRailIntensity,
  getValueVsAdp,
  hasReliableAdpSample,
  type FantasySnapshotStaleness,
  withTierBreaks,
} from "@/lib/fantasyUtils";
import {
  FANTASY_VORP_TEAM_SIZES,
  buildFantasyVorpIndex,
  sortPlayersByVorpRank,
  type FantasyVorpTeamSize,
} from "@/lib/fantasyVorp";
import { PositionFilterBar, type PositionFilterOption } from "@/components/fantasy/PositionFilterBar";
import { Player } from "@/types";
import { FANTASY_FOOTBALL_FAQ } from "./fantasy-faq";
import { buildFantasyHref, FantasySearchState, normalizeFantasyState } from "./fantasy-state";

const POSITION_OPTIONS: FantasyRoutePosition[] = ["overall", "qb", "rb", "wr", "te", "flex", "k", "dst"];
const SCORING_OPTIONS: { key: FantasyRouteScoring; label: string; shortLabel: string }[] = [
  { key: "ppr", label: "PPR", shortLabel: "PPR" },
  { key: "half_ppr", label: "Half PPR", shortLabel: "Half" },
  { key: "standard", label: "Standard", shortLabel: "Std" },
];

/** Keep each mounted rankings window below the large-list threshold. */
const RANKINGS_PAGE_SIZE = FANTASY_RANKINGS_PAGE_SIZE;

/** Phone rows carry their own value labels, since the column-label row is md-and-up. */
const ROW_MICRO_LABEL_CLASS = "text-3xs uppercase tracking-[0.06em] text-[var(--home-ink-muted)] md:hidden";

/** The other fantasy surfaces; the tiers routes only redirect back here, so they are not listed. */
const FANTASY_TOOLS = [
  { href: "/fantasy-football/draft-tracker", label: "Draft tracker" },
  { href: "/fantasy-football/mock-draft", label: "Mock draft" },
  { href: "/fantasy-football/best-ball", label: "Best ball" },
  { href: "/fantasy-football/trade-calculator", label: "Trade calculator" },
  { href: "/fantasy-football/weekly", label: "Weekly board" },
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
  // Snapshot stamps are built at a UTC instant and rendered as a bare date, so the
  // calendar day has to be read in UTC too. Without this a midnight-UTC stamp renders
  // a day early for every visitor west of UTC, which is how a source dated Sep 1 was
  // showing as Aug 31 in Los Angeles. The year comparison above was already UTC, and
  // both best ball surfaces already pass timeZone here.
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
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
 *
 * The chip and the "vs ADP" number read the same `signal`, so they carry the
 * same tone. Reach is --home-negative here because that is what the row number
 * and the drawer verdict already use; --home-warning is spent on snapshot
 * staleness on this surface and must not also mean "reach".
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
              borderColor: "color-mix(in srgb, var(--home-negative) 32%, var(--home-rule))",
              background: "color-mix(in srgb, var(--home-negative) 12%, var(--home-paper))",
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
  compact = false,
}: {
  value: FantasyRouteScoring;
  onChange: (value: FantasyRouteScoring) => void;
  compact?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Scoring format"
      className="inline-flex shrink-0 overflow-hidden rounded-[4px] border"
      style={{ borderColor: "var(--home-rule)" }}
    >
      {SCORING_OPTIONS.map((option) => {
        const active = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            aria-label={option.label}
            onClick={() => onChange(option.key)}
            className="min-h-touch cursor-pointer px-3 font-mono text-3xs uppercase tracking-[0.08em] transition-colors duration-150"
            style={
              active
                ? { background: "var(--home-ink)", color: "var(--home-paper)" }
                : { background: "transparent", color: "var(--home-ink)" }
            }
          >
            {compact ? option.shortLabel : option.label}
          </button>
        );
      })}
    </div>
  );
}

function RankingToggle({
  value,
  onChange,
  vorpAvailable,
}: {
  value: FantasySearchState["ranking"];
  onChange: (value: FantasySearchState["ranking"]) => void;
  vorpAvailable: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Ranking method"
      className="inline-flex shrink-0 overflow-hidden rounded-[4px] border"
      style={{ borderColor: "var(--home-rule)" }}
    >
      {(["consensus", "vorp"] as const).map((option) => {
        const active = value === option;
        const disabled = option === "vorp" && !vorpAvailable;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(option)}
            className="min-h-touch cursor-pointer px-3 font-mono text-3xs uppercase tracking-[0.08em] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
            style={
              active
                ? { background: "var(--home-ink)", color: "var(--home-paper)" }
                : { background: "transparent", color: "var(--home-ink)" }
            }
          >
            {option === "consensus" ? "Consensus" : "VORP"}
          </button>
        );
      })}
    </div>
  );
}

function VorpTeamSizeSelect({
  value,
  onChange,
}: {
  value: FantasyVorpTeamSize;
  onChange: (value: FantasyVorpTeamSize) => void;
}) {
  return (
    <label className="inline-flex shrink-0 items-center gap-1.5">
      <span className="sr-only">VORP league size</span>
      <select
        aria-label="VORP league size"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) as FantasyVorpTeamSize)}
        className="min-h-touch rounded-[4px] border px-2 font-mono text-3xs uppercase tracking-[0.06em]"
        style={{
          borderColor: "var(--home-rule)",
          background: "var(--home-paper-raised)",
          color: "var(--home-ink)",
        }}
      >
        {FANTASY_VORP_TEAM_SIZES.map((teamSize) => (
          <option key={teamSize} value={teamSize}>
            {teamSize} teams
          </option>
        ))}
      </select>
    </label>
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

/**
 * A labelled readout in the player drawer. The explanation used to ride on
 * `title` on this non-interactive div, which never fires on touch and is
 * unreachable by keyboard, and the drawer is the only place a phone visitor
 * can reach these definitions at all, because the focusable column-header
 * triggers are md-and-up. The label now uses MetricTooltip's `focusable` mode,
 * the same trigger those headers use. `term` names the tooltip subject when
 * the visible label carries a date or a qualifier.
 */
function DrawerStat({
  label,
  value,
  valueColor,
  title,
  term,
}: {
  label: string;
  value: string;
  valueColor?: string;
  title?: string;
  term?: string;
}) {
  return (
    <div
      className="rounded-[4px] border px-2.5 py-2"
      style={{ borderColor: "var(--home-rule)", background: "var(--home-paper-raised)" }}
    >
      <p className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
        {title ? (
          <MetricTooltip term={term ?? label} definition={title} focusable>
            {label}
          </MetricTooltip>
        ) : (
          label
        )}
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
  /** Whether that ADP is current enough to drive value and reach calculations. */
  adpSignalsAvailable: boolean;
  /** Visible date for a prior-season reference, or null for a current source. */
  adpReferenceAsOf: string | null;
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
  adpSignalsAvailable,
  adpReferenceAsOf,
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

  // Lock the page behind the dialog so closing lands where the user left off.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const isQueued = queue.isQueued(player.id);
  const value = adpSignalsAvailable && vsAdpMeaningful ? getValueVsAdp(player) : null;
  const spread = getConsensusSpread(player);
  const avg = getConsensusAvg(player);
  const vsAdp = adpSignalsAvailable && vsAdpMeaningful ? describeVsAdp(player) : null;

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
            <DrawerStat
              label={adpReferenceAsOf ? `Prior-season ADP · ${adpReferenceAsOf}` : "Market ADP"}
              term={adpReferenceAsOf ? "Prior-season ADP" : "Market ADP"}
              value={formatAdp(player.adp)}
              title={adpReferenceAsOf ? FANTASY_PRIOR_SEASON_ADP_TOOLTIP : FANTASY_ADP_TOOLTIP}
            />
          )}
          {vsAdp ? (
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
          ) : (
            adpAvailable &&
            Number.isFinite(player.adp) && (
              <DrawerStat
                label="vs ADP"
                value="—"
                title="No reliable market gap for this player on this board"
              />
            )
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
                  definition={getFantasyPointsPerGameTooltip(gameLog)}
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
  /** Server-rendered first page of the requested slice; null when the read failed. */
  initialSnapshot?: FantasySnapshot | null;
}

interface TierGroup {
  tier: number | null;
  rows: Player[];
}

export function FantasyFootballClient({ initialState, initialSnapshot = null }: FantasyFootballClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialState.query);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(() => initialState.query.length > 0);
  // Device-local view state, deliberately kept out of the URL: the queue only
  // exists in this browser, so a shared link must not imply a filtered board.
  const [queuedOnly, setQueuedOnly] = useState(false);
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

  const hasManagedParams = ["position", "scoring", "ranking", "teams", "q"].some(
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
    // Only adopt the URL's query when it genuinely differs from what is typed.
    // normalizeFantasyQuery trims, so comparing raw values made a trailing space
    // vanish from under the cursor once the URL write was debounced.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser Back/Forward can replace the URL-backed query
    setSearchQuery((current) =>
      current.replace(/\s+/g, " ").trim() === routeState.query ? current : routeState.query
    );
  }, [routeState.query]);

  // Every keystroke used to fire router.replace on a fully dynamic route, which
  // meant one uncacheable RSC round trip per character. The board still filters
  // on searchQuery, so only the shareable URL waits.
  const debouncedQuery = useDebounce(searchQuery, 200);
  useEffect(() => {
    if (debouncedQuery.replace(/\s+/g, " ").trim() === routeState.query) return;
    updateRouteState({ query: debouncedQuery });
    // updateRouteState is recreated every render; the query is the real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, routeState.query]);

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

  const { players, snapshot, metadata, sliceMetadata, sliceMetadataMap, isLoading, error, retry } = useFantasySnapshot({
    position: routeState.position,
    scoring: routeState.scoring,
    initialSnapshot,
  });

  const vorpIndex = useMemo(
    () => buildFantasyVorpIndex(snapshot?.vorpRankings, routeState.teams),
    [routeState.teams, snapshot?.vorpRankings]
  );
  const vorpAvailable = Boolean(snapshot?.vorpSource) && vorpIndex.size > 0;
  const vorpMode = routeState.ranking === "vorp" && vorpAvailable;

  const currentSliceUnavailable = Boolean(sliceMetadata && !sliceMetadata.available);
  const localToolsMemoryOnly =
    queue.persistenceStatus === "memory-only" || notes.persistenceStatus === "memory-only";
  const adpSource = metadata?.adpSource ?? null;
  const adpFreshness = getFantasyAdpFreshness(adpSource?.asOf, metadata?.season);
  // From Week 1 the draft boards describe a market that has stopped moving, so
  // say so instead of looking quietly stale. Every other fantasy surface
  // carries the same note; the flagship board was the one exception.
  const seasonalWeek = getNflRegularSeasonWeek(metadata?.season ?? 0);
  const adpAvailable = Boolean(adpSource) && adpFreshness !== "stale";
  const adpSignalsAvailable = Boolean(adpSource) && adpFreshness === "current";
  const adpTooltip = adpFreshness === "prior-season"
    ? FANTASY_PRIOR_SEASON_ADP_TOOLTIP
    : FANTASY_ADP_TOOLTIP;
  const vsAdpMeaningful = routeState.position === "overall" || routeState.position === "flex";
  const selectedScoringLabel = FANTASY_SCORING_LABELS[routeState.scoring];
  const currentSourceUpdatedAt = sliceMetadata?.updatedAt ?? metadata?.upstreamUpdatedAt ?? null;
  const activeSourceUpdatedAt = vorpMode
    ? snapshot?.vorpSource?.asOf ?? null
    : currentSourceUpdatedAt;
  const sourceStaleness = getSnapshotStaleness(activeSourceUpdatedAt);

  const queuedOnBoardCount = useMemo(
    () => players.reduce((count, player) => count + (queue.queuedSet.has(player.id) ? 1 : 0), 0),
    [players, queue.queuedSet]
  );

  const { list: filteredPlayers, hiddenWithoutVorp } = useMemo(() => {
    if (currentSliceUnavailable) {
      return { list: [] as Player[], hiddenWithoutVorp: 0 };
    }

    const base = queuedOnly ? players.filter((player) => queue.queuedSet.has(player.id)) : players;
    const query = searchQuery.trim().toLowerCase();
    const searched = query
      ? base.filter((player) => getFantasyPlayerSearchText(player).includes(query))
      : base;
    if (!vorpMode) return { list: searched, hiddenWithoutVorp: 0 };

    const ranked = searched.filter((player) => vorpIndex.has(player.id));
    // VORP mode drops players without a published value, so say how many.
    return {
      list: sortPlayersByVorpRank(ranked, vorpIndex),
      hiddenWithoutVorp: searched.length - ranked.length,
    };
  }, [
    currentSliceUnavailable,
    players,
    searchQuery,
    queuedOnly,
    queue.queuedSet,
    vorpIndex,
    vorpMode,
  ]);

  // A slice-scoped search that misses says nothing about the rest of the
  // snapshot, so check the overall board and offer the jump instead of a dead
  // end. Overall is the one board that carries every ranked player.
  const overallSearchHit = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();
    if (!query || routeState.position === "overall" || filteredPlayers.length > 0) {
      return false;
    }
    // The jump keeps the current ranking mode, so in VORP mode only offer it
    // when the overall board would actually show the player.
    return (snapshot?.overall ?? []).some(
      (candidate) =>
        getFantasyPlayerSearchText(candidate).includes(query) &&
        (!vorpMode || vorpIndex.has(candidate.id))
    );
  }, [debouncedQuery, routeState.position, filteredPlayers.length, snapshot, vorpMode, vorpIndex]);

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
  }, [
    routeState.position,
    routeState.scoring,
    routeState.ranking,
    routeState.teams,
    searchQuery,
    queuedOnly,
  ]);

  const windowedPlayers = useMemo(
    () => filteredPlayers.slice(0, visibleCount),
    [filteredPlayers, visibleCount]
  );
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
    if (vorpMode) {
      return windowedPlayers.length > 0
        ? [{ tier: null, rows: windowedPlayers }]
        : [];
    }
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
  }, [vorpMode, windowedPlayers]);

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
  const vorpStamp = formatStamp(snapshot?.vorpSource?.asOf);
  const sourceStamp = formatStamp(activeSourceUpdatedAt);

  const headerChips: { label: string; tone?: CSSProperties }[] = [
    {
      label: vorpMode
        ? `${routeState.teams}-team ${selectedScoringLabel} VORP`
        : `${selectedScoringLabel} board`,
    },
    {
      label: vorpMode
        ? snapshot?.vorpSource?.provider ?? "Projected VORP"
        : "FantasyPros consensus",
    },
    ...(vorpMode && vorpStamp ? [{ label: `VORP checked ${vorpStamp}` }] : []),
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

  const vorpHiddenNote =
    vorpMode && hiddenWithoutVorp > 0 ? ` · ${hiddenWithoutVorp} without a published VORP` : "";
  const countLine = isLoading
    ? "Loading players…"
    : error
      ? "Rankings unavailable"
      : currentSliceUnavailable
        ? "Board unavailable"
        : hasMore
          ? `${windowedPlayers.length} of ${filteredPlayers.length} shown${vorpHiddenNote}`
          : `${filteredPlayers.length} of ${sliceMetadata?.playerCount ?? players.length} shown${vorpHiddenNote}`;

  const metricColumns: { label: string; className: string; title?: string }[] = [
    ...(vorpAvailable
      ? [
          {
            label: "VORP",
            className: "w-16 text-right",
            title: FANTASY_VORP_TOOLTIP,
          },
        ]
      : []),
    // The spread bar itself yields below lg, so its label does too.
    { label: "Expert spread", className: "hidden w-[120px] lg:block", title: FANTASY_EXPERT_SPREAD_TOOLTIP },
    { label: "Range", className: "w-16 text-right", title: FANTASY_EXPERT_SPREAD_TOOLTIP },
    { label: "Avg", className: "w-12 text-right", title: FANTASY_AVG_RANK_TOOLTIP },
    ...(adpAvailable
      ? [
          {
            // Position boards rank within the position while ADP stays an
            // overall pick number, so the label says which scale it is on.
            label: vsAdpMeaningful ? "ADP" : "ADP (overall)",
            className: "w-16 text-right",
            title: adpTooltip,
          },
        ]
      : []),
    ...(adpSignalsAvailable && vsAdpMeaningful
      ? [{ label: "vs ADP", className: "w-16 text-right", title: FANTASY_VS_ADP_TOOLTIP }]
      : []),
  ];
  const boardReady = !isLoading && !error && !currentSliceUnavailable && filteredPlayers.length > 0;

  function renderTierSection(group: TierGroup, index: number): ReactNode {
    const displayRank = (player: Player): string =>
      vorpMode
        ? String(vorpIndex.get(player.id)?.rank ?? "—")
        : getPublishedBoardRank(player, routeState.position);
    const firstRank = displayRank(group.rows[0]);
    const lastRank = displayRank(group.rows[group.rows.length - 1]);
    const railTone =
      vorpMode
        ? "var(--home-signal)"
        : group.tier !== null
        ? `color-mix(in srgb, var(--home-signal) ${getTierRailIntensity(group.tier)}%, var(--home-rule))`
        : "var(--home-rule)";

    let cliff = 0;
    if (!vorpMode && index > 0) {
      const previous = tierGroups[index - 1];
      const prevAvg = getConsensusAvg(previous.rows[previous.rows.length - 1]);
      const nextAvg = getConsensusAvg(group.rows[0]);
      if (prevAvg !== null && nextAvg !== null) {
        cliff = Math.max(0, Number((nextAvg - prevAvg).toFixed(1)));
      }
    }
    const marginTop = index === 0 ? 0 : Math.round(Math.min(48, Math.max(14, cliff * 9))) || 18;

    /* A <section> with no accessible name is not exposed as a landmark at all, so an
       unnamed plate makes the tier structure of a tier-first board invisible to assistive
       tech. The plate header is spans rather than a heading, so this is a literal label
       rather than aria-labelledby, which would dangle whenever that header changes shape.
       The cliff rule above the plate is aria-hidden, so its size rides here too. */
    const tierLabel = [
      vorpMode
        ? `${routeState.teams}-team VORP rankings`
        : group.tier !== null
          ? `Tier ${group.tier}`
          : "No published tier",
      `${group.rows.length} ${group.rows.length === 1 ? "player" : "players"}`,
      `${vorpMode ? "VORP ranks" : "ranks"} ${firstRank} to ${lastRank}`,
      index > 0 && cliff > 0 ? `${cliff.toFixed(1)} average-rank cliff above` : null,
    ]
      .filter(Boolean)
      .join(", ");

    return (
      <section
        key={`tier-${group.tier ?? "untiered"}-${group.rows[0].id}`}
        aria-label={tierLabel}
        style={{ marginTop }}
      >
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
              {vorpMode
                ? "VORP"
                : group.tier !== null
                  ? String(group.tier).padStart(2, "0")
                  : "—"}
            </span>
            <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
              {vorpMode
                ? `${routeState.teams}-team rankings`
                : group.tier !== null
                  ? "Tier"
                  : "No published tier"}
            </span>
            <span className="font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
              {group.rows.length} {group.rows.length === 1 ? "player" : "players"}
            </span>
            <span className="ml-auto font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
              {vorpMode ? "#" : "R"}{firstRank} to {vorpMode ? "#" : "R"}{lastRank}
            </span>
          </div>
          <ul className="m-0 list-none p-0">
            {group.rows.map((player) => {
              const vsAdp = adpSignalsAvailable && vsAdpMeaningful ? describeVsAdp(player) : null;
              const vorp = vorpIndex.get(player.id);
              const tone = getPositionTone(player.position);
              const isQueued = queue.isQueued(player.id);
              return (
                <li
                  key={player.id}
                  className="group relative border-t transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--home-paper-alt)_55%,transparent)]"
                  style={{ borderColor: "color-mix(in srgb, var(--home-rule) 60%, transparent)" }}
                >
                  {/* The open control overlays the row instead of wrapping it: an
                      aria-label on a wrapping button would override every cell,
                      leaving screen readers nothing but "Open X detail" rows.
                      The content div sits above it so hover explanations fire
                      and names stay selectable; its own click still opens the
                      drawer unless the user is selecting text. */}
                  <button
                    type="button"
                    aria-label={`Open ${player.name} detail${isQueued ? " (in your queue)" : ""}`}
                    onClick={() => setDetailPlayerId(player.id)}
                    className="absolute inset-0 z-[1] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--home-signal)]"
                  />
                  {isQueued && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 z-[2] w-1"
                      style={{ background: "var(--home-signal)" }}
                    />
                  )}
                  <div
                    className="relative z-[2] flex min-h-11 w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-3.5 py-1.5 text-left"
                    style={{ color: "var(--home-ink)" }}
                    onClick={() => {
                      if (window.getSelection()?.toString()) return;
                      setDetailPlayerId(player.id);
                    }}
                  >
                    <span
                      className="w-[34px] shrink-0 text-right font-mono text-sm"
                      title={
                        vorpMode
                          ? `VORP rank${isQueued ? " · in your queue" : ""}`
                          : isQueued
                            ? "Board rank · in your queue"
                            : "Board rank"
                      }
                      style={{
                        color: isQueued ? "var(--home-signal)" : "var(--home-ink)",
                      }}
                    >
                      {displayRank(player)}
                    </span>
                    <span className="flex min-w-0 flex-[1_1_200px] flex-wrap items-baseline gap-x-2 gap-y-1">
                      {/* The name is the row's identity, so it keeps a hard floor
                          and the decorative spread bar yields below lg instead. */}
                      <span className="min-w-[7rem] truncate text-sm font-semibold tracking-tight">{player.name}</span>
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
                      {adpSignalsAvailable && vsAdpMeaningful && <ValueReachChip player={player} />}
                    </span>
                    <span className="flex max-w-full flex-wrap items-center gap-x-4 gap-y-1">
                      {vorpAvailable && (
                        <>
                          <span className="sr-only">Value over replacement player</span>
                          <span
                            className="w-auto font-mono text-xs font-medium md:w-16 md:text-right"
                            title={FANTASY_VORP_TOOLTIP}
                            style={{
                              color:
                                vorp && vorp.value > 0
                                  ? "var(--home-signal)"
                                  : "var(--home-ink-muted)",
                            }}
                          >
                            <span aria-hidden="true" className={ROW_MICRO_LABEL_CLASS}>
                              VORP{" "}
                            </span>
                            {vorp ? Math.round(vorp.value) : "—"}
                          </span>
                        </>
                      )}
                      <span className="hidden lg:inline-flex">
                        <ExpertSpreadBar player={player} scale={boardScale} />
                      </span>
                      <span className="sr-only">Expert range</span>
                      <span
                        className="w-auto font-mono text-xs md:w-16 md:text-right"
                        title={FANTASY_EXPERT_SPREAD_TOOLTIP}
                        style={{ color: "var(--home-ink-muted)" }}
                      >
                        <span aria-hidden="true" className={ROW_MICRO_LABEL_CLASS}>
                          Rng{" "}
                        </span>
                        {formatExpertRange(player)}
                      </span>
                      <span className="sr-only">Consensus average</span>
                      <span
                        className="w-auto font-mono text-xs font-medium md:w-12 md:text-right"
                        title={FANTASY_AVG_RANK_TOOLTIP}
                      >
                        <span aria-hidden="true" className={ROW_MICRO_LABEL_CLASS}>
                          Avg{" "}
                        </span>
                        {formatAvg(player)}
                      </span>
                      {adpAvailable && (
                        <>
                          <span className="sr-only">ADP</span>
                          <span
                            className="w-auto font-mono text-xs md:w-16 md:text-right"
                            title={adpTooltip}
                            style={{ color: "var(--home-ink-muted)" }}
                          >
                            <span aria-hidden="true" className={ROW_MICRO_LABEL_CLASS}>
                              ADP{" "}
                            </span>
                            {formatAdp(player.adp)}
                          </span>
                          {adpSignalsAvailable && vsAdpMeaningful ? (
                            <>
                              <span className="sr-only">versus ADP</span>
                              <span
                                className="w-auto font-mono text-xs md:w-16 md:text-right"
                                title={
                                  vsAdp && !vsAdp.judged
                                    ? "Early mock-draft sample, so the gap carries no value or reach read yet"
                                    : FANTASY_VS_ADP_TOOLTIP
                                }
                                style={{ color: vsAdp ? vsAdp.color : "var(--home-ink-muted)" }}
                              >
                                <span
                                  aria-hidden="true"
                                  className={ROW_MICRO_LABEL_CLASS}
                                  style={{ color: "var(--home-ink-muted)" }}
                                >
                                  ±ADP{" "}
                                </span>
                                {vsAdp ? vsAdp.text : "—"}
                              </span>
                            </>
                          ) : null}
                        </>
                      )}
                    </span>
                    {/* The row-edge queue toggle: always visible on touch,
                        revealed on hover/focus for fine pointers, and always
                        shown once queued so membership reads as shape, not
                        color. -my cancels the row padding so the 44px target
                        does not grow the row. */}
                    <button
                      type="button"
                      aria-pressed={isQueued}
                      aria-label={isQueued ? `Remove ${player.name} from queue` : `Queue ${player.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        queue.toggle(player.id);
                      }}
                      className={`-my-1.5 ml-auto flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[4px] transition-opacity duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--home-signal)] ${
                        isQueued
                          ? ""
                          : "pointer-fine:opacity-0 pointer-fine:group-focus-within:opacity-100 pointer-fine:group-hover:opacity-100"
                      }`}
                      style={{ color: isQueued ? "var(--home-signal)" : "var(--home-ink-muted)" }}
                    >
                      <Star size={16} fill={isQueued ? "currentColor" : "none"} aria-hidden="true" />
                    </button>
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
            style={{ fontSize: "clamp(1.55rem, 1.3rem + 1.25vw, 2.1rem)", letterSpacing: "-0.05em" }}
          >
            Fantasy Football{" "}
            <em style={{ fontFamily: "var(--font-home-serif)", fontStyle: "italic", fontWeight: 500 }}>Rankings</em>
          </h1>
          <p className="m-0 w-full max-w-[62ch] text-sm" style={{ color: "var(--home-ink-muted)" }}>
            {vorpMode
              ? `VORP ranks FantasyPros' projected season points above the same-position waiver replacement in a ${routeState.teams}-team league. FantasyPros supplies the roster baseline for this view.`
              : "The board pairs the expert consensus with market ADP, and the tier plates and cliff lines mark where the board actually drops off."}
          </p>
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

      {seasonalWeek >= 1 ? (
        <div className={`${SHELL_CLASS} pb-4`}>
          <SeasonalScopeNote season={metadata?.season ?? 0} week={seasonalWeek}>
            Every board on this page is the preseason draft consensus, kept as a
            reference once games begin rather than refreshed for weekly starts.
            Ranks that still move are on the{" "}
            <Link
              href="/fantasy-football/weekly"
              className="underline decoration-[var(--home-signal)] underline-offset-4"
            >
              weekly board
            </Link>
            .
          </SeasonalScopeNote>
        </div>
      ) : null}

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
        className="sticky top-[4.5rem] z-30 border-y"
        style={{
          borderColor: "var(--home-rule)",
          background: "color-mix(in srgb, var(--home-paper) 90%, transparent)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div className={`${SHELL_CLASS} hidden flex-wrap items-center gap-x-3.5 gap-y-2.5 py-2.5 md:flex`}>
          <PositionFilterBar
            ariaLabel="Position board"
            options={positionOptions}
            value={routeState.position}
            onChange={(position) => updateRouteState({ position })}
          />
          <ScoringToggle value={routeState.scoring} onChange={(scoring) => updateRouteState({ scoring })} />
          <RankingToggle
            value={routeState.ranking}
            vorpAvailable={vorpAvailable}
            onChange={(ranking) => updateRouteState({ ranking })}
          />
          {routeState.ranking === "vorp" ? (
            <VorpTeamSizeSelect
              value={routeState.teams}
              onChange={(teams) => updateRouteState({ teams })}
            />
          ) : null}
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
              onChange={(event) => setSearchQuery(event.target.value)}
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
          <button
            type="button"
            aria-pressed={queuedOnly}
            onClick={() => setQueuedOnly((value) => !value)}
            className="inline-flex min-h-touch cursor-pointer items-center gap-1.5 rounded-[4px] border px-3 font-mono text-3xs uppercase tracking-[0.08em]"
            style={
              queuedOnly
                ? { borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }
                : { borderColor: "var(--home-rule)", background: "transparent", color: "var(--home-ink)" }
            }
          >
            <Star size={12} fill={queuedOnly ? "currentColor" : "none"} aria-hidden="true" />
            Queued ({queuedOnBoardCount})
          </button>
          <span
            aria-live={error ? undefined : "polite"}
            className="ml-auto whitespace-nowrap font-mono text-2xs"
            style={{ color: "var(--home-ink-muted)" }}
          >
            {countLine}
          </span>
        </div>
        {/* Phones keep one sticky line: position and scoring stay reachable
            mid-scroll, and search expands over that line rather than sitting
            beside it. "Done" collapses it back to the other controls without
            touching what was typed, so switching board or scoring mid-search
            no longer costs the query. */}
        <div className={`${SHELL_CLASS} flex items-center gap-2 py-2 md:hidden`}>
          {mobileSearchOpen ? (
            <>
              <div className="relative min-w-0 flex-1">
                <label htmlFor="fantasy-search-compact" className="sr-only">
                  Search the current rankings board
                </label>
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                  style={{ color: "var(--home-ink-muted)" }}
                  aria-hidden="true"
                />
                <input
                  id="fantasy-search-compact"
                  name="fantasy-search-compact"
                  value={searchQuery}
                  maxLength={80}
                  autoFocus
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onBlur={() => {
                    if (!searchQuery) setMobileSearchOpen(false);
                  }}
                  disabled={currentSliceUnavailable}
                  autoComplete="off"
                  placeholder="Search player or team"
                  className="min-h-touch w-full rounded-[4px] border pl-8 pr-2.5 font-mono text-xs placeholder:text-[var(--home-ink-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "var(--home-paper-raised)",
                    color: "var(--home-ink)",
                  }}
                />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setSearchQuery("");
                    updateRouteState({ query: "" });
                  }}
                  className="inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-[4px] border"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "var(--home-paper-raised)",
                    color: "var(--home-ink)",
                  }}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                aria-label="Done searching, keep the filter"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setMobileSearchOpen(false)}
                className="inline-flex min-h-touch shrink-0 items-center rounded-[4px] border px-3 font-mono text-3xs uppercase tracking-[0.08em]"
                style={{
                  borderColor: "var(--home-rule)",
                  background: "var(--home-paper-raised)",
                  color: "var(--home-ink)",
                }}
              >
                Done
              </button>
            </>
          ) : (
            <>
              <label htmlFor="fantasy-position-select" className="sr-only">
                Position board
              </label>
              <select
                id="fantasy-position-select"
                value={routeState.position}
                onChange={(event) => updateRouteState({ position: event.target.value as FantasyRoutePosition })}
                className="min-h-touch shrink-0 rounded-[4px] border px-2 font-mono text-2xs uppercase tracking-[0.06em]"
                style={{
                  borderColor: "var(--home-rule)",
                  background: "var(--home-paper-raised)",
                  color: "var(--home-ink)",
                }}
              >
                {positionOptions.map((option) => {
                  /* The desktop pill row already renders an unavailable slice
                     disabled with its reason. Left plain and enabled here, the
                     select let a phone visitor pick a board that does not
                     exist. The selected value never disables itself, or the
                     control would render blank on a board that went away. */
                  const isUnavailable =
                    option.available === false && option.value !== routeState.position;
                  return (
                    <option
                      key={option.value}
                      value={option.value}
                      disabled={isUnavailable}
                      title={isUnavailable ? option.unavailableLabel : undefined}
                    >
                      {isUnavailable ? `${option.label} · unavailable` : option.label}
                    </option>
                  );
                })}
              </select>
              <ScoringToggle compact value={routeState.scoring} onChange={(scoring) => updateRouteState({ scoring })} />
              <button
                type="button"
                aria-label={
                  searchQuery
                    ? `Search the current rankings board, filtering by ${searchQuery}`
                    : "Search the current rankings board"
                }
                onClick={() => setMobileSearchOpen(true)}
                disabled={currentSliceUnavailable}
                className="inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-[4px] border disabled:cursor-not-allowed disabled:opacity-60"
                style={
                  /* A collapsed search still filters the board, so the control
                     carries the active state rather than hiding the filter. */
                  searchQuery
                    ? { borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }
                    : { borderColor: "var(--home-rule)", background: "var(--home-paper-raised)", color: "var(--home-ink)" }
                }
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-pressed={queuedOnly}
                aria-label={`Show only queued players (${queuedOnBoardCount} on this board)`}
                onClick={() => setQueuedOnly((value) => !value)}
                className="relative inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-[4px] border"
                style={
                  queuedOnly
                    ? { borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }
                    : { borderColor: "var(--home-rule)", background: "var(--home-paper-raised)", color: "var(--home-ink)" }
                }
              >
                <Star className="h-4 w-4" fill={queuedOnly ? "currentColor" : "none"} aria-hidden="true" />
                {queuedOnBoardCount > 0 && (
                  <span aria-hidden="true" className="absolute -right-1 -top-1 rounded-full px-1 font-mono text-3xs tabular-nums"
                    style={{ background: "var(--home-signal)", color: "var(--home-paper)" }}>
                    {queuedOnBoardCount}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
        {/* The count and the route's only aria-live region used to sit inside
            the md-and-up bar, so below 768px a filter that landed on six rows
            announced nothing and showed no count. Phones get their own line.
            Only one of the two is ever rendered, since the other is display:none
            at that width, so nothing announces twice. */}
        <div className={`${SHELL_CLASS} pb-2 md:hidden`}>
          <span
            aria-live={error ? undefined : "polite"}
            className="font-mono text-2xs"
            style={{ color: "var(--home-ink-muted)" }}
          >
            {countLine}
          </span>
        </div>
        {!mobileSearchOpen ? (
          <div className={`${SHELL_CLASS} flex flex-wrap items-center gap-2 pb-2 md:hidden`}>
            <RankingToggle
              value={routeState.ranking}
              vorpAvailable={vorpAvailable}
              onChange={(ranking) => updateRouteState({ ranking })}
            />
            {routeState.ranking === "vorp" ? (
              <VorpTeamSizeSelect
                value={routeState.teams}
                onChange={(teams) => updateRouteState({ teams })}
              />
            ) : null}
          </div>
        ) : null}
        {/* Column labels ride in the sticky bar so the numbers keep their
            names mid-scroll; phones get per-value micro-labels instead. */}
        {boardReady && (
          <div
            className="hidden border-t md:block"
            style={{ borderColor: "color-mix(in srgb, var(--home-rule) 60%, transparent)" }}
          >
            <div className={SHELL_CLASS}>
              <div
                className="flex items-center gap-x-4 px-3.5 py-1.5 font-mono text-3xs uppercase tracking-[0.12em]"
                style={{ color: "var(--home-ink-muted)" }}
              >
                <span className="w-[34px] shrink-0" />
                <span className="min-w-0 flex-[1_1_200px]">
                  <MetricTooltip term="Player" definition={FANTASY_PLAYER_COLUMN_TOOLTIP} focusable>
                    Player
                  </MetricTooltip>
                </span>
                <span className="flex shrink-0 items-center gap-4">
                  {metricColumns.map((column) => (
                    <span key={column.label} className={column.className}>
                      {column.title ? (
                        <MetricTooltip term={column.label} definition={column.title} focusable>
                          {column.label}
                        </MetricTooltip>
                      ) : (
                        column.label
                      )}
                    </span>
                  ))}
                </span>
                {/* Mirrors the row-edge queue toggle so columns stay aligned. */}
                <span className="ml-auto w-11 shrink-0" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`${SHELL_CLASS} pb-10 pt-4`}>
        <h2 className="sr-only">
          {vorpMode ? `${routeState.teams}-team VORP` : FANTASY_POSITION_LABELS[routeState.position]} rankings
        </h2>

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
              {queuedOnly ? "No queued players on this board." : "No players match on this board."}
            </p>
            {queuedOnly ? (
              <button
                type="button"
                onClick={() => setQueuedOnly(false)}
                className="mt-3.5 inline-flex min-h-touch items-center rounded-full border px-4 font-mono text-2xs uppercase tracking-[0.06em]"
                style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
              >
                Show all players
              </button>
            ) : (
              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    updateRouteState({ query: "" });
                  }}
                  className="inline-flex min-h-touch items-center rounded-full border px-4 font-mono text-2xs uppercase tracking-[0.06em]"
                  style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
                >
                  Clear search
                </button>
                {overallSearchHit && (
                  <button
                    type="button"
                    onClick={() => updateRouteState({ position: "overall" })}
                    className="inline-flex min-h-touch items-center rounded-full border px-4 font-mono text-2xs uppercase tracking-[0.06em]"
                    style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)", color: "var(--home-ink)" }}
                  >
                    Found on the overall board
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
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
              ? vorpMode
                ? `FantasyPros VORP checked ${vorpStamp ?? "with this snapshot"} · ${routeState.teams}-team source baseline`
                : `Refreshes daily through draft season, weekly after${snapshotStamp ? ` · snapshot ${snapshotStamp}` : ""}`
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
            {/* sm:text-2xl tops out at 34px, the same size as the page h1 on the title
                ramp, so the section would render at exactly its parent's size. */}
            <h2 id="fantasy-rankings-questions" className="text-xl font-semibold">
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
          adpSignalsAvailable={adpSignalsAvailable}
          adpReferenceAsOf={adpFreshness === "prior-season" ? adpStamp : null}
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
