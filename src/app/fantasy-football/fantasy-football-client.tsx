"use client";

import { useIsClient } from "@/hooks/useIsClient";
import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Star, X } from "lucide-react";
import { useClientNow } from "@/hooks/useClientNow";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/hooks/useModal";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import { SeasonalScopeNote } from "@/components/fantasy/SeasonalScopeNote";
import { usePlayerQueue } from "@/hooks/usePlayerQueue";
import { usePlayerNotes } from "@/hooks/usePlayerNotes";
import { useLocalStoragePersistenceStatus } from "@/hooks/useLocalStorageString";
import { FANTASY_NOTES_STORAGE_KEY } from "@/lib/fantasyLocal";
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
  SHELL_CLASS,
  formatAdp,
  formatPickDelta,
  formatRankValue,
  getConsensusAvg,
  getConsensusSpread,
  getFantasyAdpFreshness,
  getNflRegularSeasonWeek,
  getSnapshotStaleness,
  getSnapshotStalenessLabel,
  getValueVsAdp,
  hasReliableAdpSample,
  type FantasySnapshotStaleness,
  withTierBreaks,
} from "@/lib/fantasyUtils";
import {
  FANTASY_VORP_TEAM_SIZES,
  buildFantasyVorpIndex,
  isFantasyVorpTeamSize,
  sortPlayersByVorpRank,
  type FantasyVorpRankingEntry,
  type FantasyVorpTeamSize,
} from "@/lib/fantasyVorp";
import { PositionFilterBar, type PositionFilterOption } from "@/components/fantasy/PositionFilterBar";
import {
  FantasyRouteHeader,
  FantasySectionHeading,
  FreshnessParts,
  type FreshnessPart,
} from "@/components/fantasy/FantasyRouteHeader";
import { Player } from "@/types";
import { FANTASY_FOOTBALL_FAQ } from "./fantasy-faq";
import { buildFantasyHref, FantasySearchState, normalizeFantasyState } from "./fantasy-state";
import "@/components/fantasy/fantasy-rankings.css";

const POSITION_OPTIONS: FantasyRoutePosition[] = ["overall", "qb", "rb", "wr", "te", "flex", "k", "dst"];
/** `shortLabel` is what a phone prints, where the full names do not fit beside the ranking select. */
const SCORING_OPTIONS: { key: FantasyRouteScoring; label: string; shortLabel: string }[] = [
  { key: "ppr", label: "PPR", shortLabel: "PPR" },
  { key: "half_ppr", label: "Half PPR", shortLabel: "Half" },
  { key: "standard", label: "Standard", shortLabel: "Std" },
];

/** Keep each mounted rankings window below the large-list threshold. */
const RANKINGS_PAGE_SIZE = FANTASY_RANKINGS_PAGE_SIZE;

/** The kit's position classes. Each sets the fill and the ink a chip or a spread plot draws in. */
const POSITION_CLASSES: Record<string, string> = {
  QB: "ffb-pos-qb",
  RB: "ffb-pos-rb",
  WR: "ffb-pos-wr",
  TE: "ffb-pos-te",
  K: "ffb-pos-k",
  DST: "ffb-pos-dst",
};

function positionClass(position: string | undefined): string {
  return POSITION_CLASSES[(position ?? "").toUpperCase()] ?? "";
}

/** Status colour on the freshness line; the label itself says aging or stale. */
const STALENESS_TONE: Record<FantasySnapshotStaleness, "warning" | "negative" | undefined> = {
  fresh: undefined,
  aging: "warning",
  stale: "negative",
};

/**
 * Compact "Aug 16" / "Dec 3, 2025" stamp for the freshness line and the line
 * under the board. `currentYear` is the caller's own read of "now" (null until
 * the client knows it), never `new Date()` here: the server and the client's
 * first render otherwise call `new Date()` at two different instants, which
 * only disagrees right at a year boundary but was still a real, if rare,
 * hydration mismatch. While `currentYear` is null every stamp keeps its year,
 * which is always correct, just occasionally one year longer than needed
 * until the client settles.
 */
function formatStamp(timestamp: string | null | undefined, currentYear: number | null): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  const sameYear = currentYear !== null && date.getUTCFullYear() === currentYear;
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

function formatVorpValue(entry: FantasyVorpRankingEntry | null | undefined): string {
  return entry ? String(Math.round(entry.value)) : "—";
}

function formatExpertRange(player: Player): string {
  return Number.isFinite(player.minRank) && Number.isFinite(player.maxRank)
    ? `${player.minRank}–${player.maxRank}`
    : "—";
}

/**
 * Signed pick delta ("+12" / "−4") with the signal the value/reach gate assigns.
 * `judged` is false when the ADP sample is too thin for the gate to evaluate
 * the gap at all, a different situation from a gap inside the noise band,
 * and one no surface may describe as market agreement.
 */
function describeVsAdp(
  player: Player
): { text: string; signal: "value" | "reach" | null; judged: boolean } | null {
  const value = getValueVsAdp(player);
  if (!value) return null;
  return { text: formatPickDelta(value.delta), signal: value.signal, judged: hasReliableAdpSample(player) };
}

/**
 * How a vs ADP number prints. A gap the gate judged is heavy and takes the
 * status ink, and the word beside it says which way. A gap inside the noise
 * band, or one the sample is too thin to judge, is muted. Reach is the error
 * ink because warning is spent on snapshot staleness on this page.
 */
const VS_ADP_CLASS: Record<"value" | "reach" | "none", string> = {
  value: "ffb-is-strong ffb-good",
  reach: "ffb-is-strong ffb-bad",
  none: "ffb-is-flat",
};

/** The position chip: the letters and the rank within the position, on the position's fill. */
function PositionChip({ player }: { player: Player }) {
  return (
    <span className={`ffb-chip ${positionClass(player.position)}`.trimEnd()}>
      {player.position}
      {Number.isFinite(player.positionRank) ? player.positionRank : ""}
    </span>
  );
}

/**
 * One scale for every spread plot on screen. It is cut into divisions of
 * `unit` ranks (a round of a draft on the overall board), never fewer than
 * ten, and once the mounted rows reach past sixteen of them the divisions
 * double in width so their labels stay readable.
 */
interface SpreadScale {
  /** The rank at the right edge of the plot. */
  max: number;
  /** How many guides the plot draws. */
  divisions: number;
  /** The name of each division, printed over its guide. */
  labels: string[];
  /** Ranks in one round, which a wider division is a multiple of. */
  unit: number;
}

function buildSpreadScale(maxRank: number, unit: number, position: FantasyRoutePosition): SpreadScale {
  const rounds = Math.max(10, Math.ceil(maxRank / unit));
  let step = 1;
  while (rounds / step > 16) step *= 2;
  const divisions = Math.ceil(rounds / step);
  const prefix = position === "overall" ? "R" : position === "flex" ? "#" : position.toUpperCase();
  const labels = Array.from({ length: divisions }, (_, index) =>
    position === "overall" ? `${prefix}${index * step + 1}` : `${prefix}${index * step * unit + 1}`
  );
  return { max: divisions * step * unit, divisions, labels, unit };
}

/**
 * The kit's expert spread: a thin line from the best to the worst rank any
 * expert gave, a thicker segment one standard deviation each side of the
 * average, and an ink tick on the average. Every plot on the board shares
 * `scale`, so two rows can be compared by eye. The numbers ride in the
 * accessible name and the hover title, since the plot is their only print on
 * the row.
 */
function ExpertSpread({ player, scale }: { player: Player; scale: SpreadScale }) {
  const lo = player.minRank;
  const hi = player.maxRank;
  const guides = { "--ffb-rounds": scale.divisions } as CSSProperties;
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    return <span className="ffb-spread" aria-hidden="true" style={guides} />;
  }

  // A rank is a slot one wide, so rank 1 runs from 0 to 1 and its centre is 0.5.
  const toPercent = (rank: number) => `${Math.min(100, Math.max(0, (rank / scale.max) * 100)).toFixed(2)}%`;
  const avg = getConsensusAvg(player);
  const deviation =
    typeof player.standardDeviation === "number" && Number.isFinite(player.standardDeviation) && player.standardDeviation > 0
      ? player.standardDeviation
      : null;
  const label = `Experts rank him from ${lo} to ${hi}${avg === null ? "" : `, average ${avg.toFixed(1)}`}`;

  return (
    <span
      className={`ffb-spread ${positionClass(player.position)}`.trimEnd()}
      role="img"
      aria-label={label}
      title={label}
      style={
        {
          ...guides,
          "--ffb-min": toPercent((lo as number) - 1),
          "--ffb-max": toPercent(hi as number),
          ...(avg === null ? {} : { "--ffb-avg": toPercent(avg - 0.5) }),
          ...(avg === null || deviation === null
            ? {}
            : {
                "--ffb-sd-lo": toPercent(avg - 0.5 - deviation),
                "--ffb-sd-hi": toPercent(avg - 0.5 + deviation),
              }),
        } as CSSProperties
      }
    >
      <i className="ffb-spread-range" />
      {avg !== null && deviation !== null ? <i className="ffb-spread-sd" /> : null}
      {avg !== null ? <i className="ffb-spread-avg" /> : null}
    </span>
  );
}

/**
 * A labelled fact in the player drawer. The label is MetricTooltip's
 * `focusable` trigger, the same control the column heads use, because the
 * drawer is the only place a phone visitor can reach these definitions (the
 * column heads' triggers are md-and-up). `term` names the tooltip subject when
 * the visible label carries a date or a qualifier.
 */
interface DrawerFactProps {
  label: string;
  value: string;
  /** A kit status class for the value (`ffb-good`, `ffb-bad`, `ffb-muted`). */
  tone?: string;
  title?: string;
  term?: string;
}

function DrawerFact({ label, value, tone, title, term }: DrawerFactProps) {
  return (
    <div className="ffb-stat">
      <dt>
        {title ? (
          <MetricTooltip term={term ?? label} definition={title} focusable>
            {label}
          </MetricTooltip>
        ) : (
          label
        )}
      </dt>
      <dd className={tone}>{value}</dd>
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
  /** Whether the board behind the drawer is sorted by VORP rather than consensus. */
  vorpMode: boolean;
  /** League size the VORP index was built for. */
  vorpTeams: FantasyVorpTeamSize;
  /** The published VORP entries, keyed by player id, for this player and the neighbors. */
  vorpIndex: ReadonlyMap<string, FantasyVorpRankingEntry>;
  /** The scale the board's spread plots are drawn on, so the drawer's plot matches the row's. */
  spreadScale: SpreadScale;
  onSelectNeighbor: (id: string) => void;
  onClose: () => void;
}

/**
 * The rankings board's player detail, on the kit's drawer: the facts as a
 * definition list, the market verdict, the expert spread, points per game,
 * the board neighborhood, and the browser-local queue and note. The draft
 * tracker and best ball keep the shared PlayerDetailDrawer; this panel is the
 * rankings board's own read.
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
  vorpMode,
  vorpTeams,
  vorpIndex,
  spreadScale,
  onSelectNeighbor,
  onClose,
}: DraftPlayerDrawerProps) {
  const panelRef = useRef<HTMLElement>(null);
  const queue = usePlayerQueue();
  const notes = usePlayerNotes();
  const [draftNote, setDraftNote] = useState(() => notes.getNote(player.id));

  useModal(panelRef, true, onClose);

  // Reset the note draft whenever a different player opens the drawer.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seed local draft from the persisted note on player change
    setDraftNote(notes.getNote(player.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.id]);

  const isQueued = queue.isQueued(player.id);
  const value = adpSignalsAvailable && vsAdpMeaningful ? getValueVsAdp(player) : null;
  const spread = getConsensusSpread(player);
  const vsAdp = adpSignalsAvailable && vsAdpMeaningful ? describeVsAdp(player) : null;

  // The verdict is a kit notice, and its key rule carries the same ink the
  // row's vs ADP number does. A sample too thin to judge is held back, which
  // is the dashed rule.
  const verdict = value
    ? !hasReliableAdpSample(player)
      ? {
          // signal:null can also mean "sample too thin to judge", so never call
          // that market agreement (fantasyUtils gates at 20 mock selections).
          text: "Too few mock selections behind his ADP to judge the market gap yet, so no market read.",
          tone: "ffb-notice-held",
        }
      : value.signal === "value"
        ? {
            text: `Rooms take him about ${Math.round(Math.abs(value.delta))} picks after the consensus rank. Value if he lasts to your pick.`,
            tone: "ffb-notice-good",
          }
        : value.signal === "reach"
          ? {
              text: `Rooms take him about ${Math.round(Math.abs(value.delta))} picks before the consensus rank. Plan the reach or let him go.`,
              tone: "ffb-notice-bad",
            }
          : {
              text: "Market and consensus sit inside this player's noise band. Take him on schedule.",
              tone: "",
            }
    : null;

  const hasRange = Number.isFinite(player.minRank) && Number.isFinite(player.maxRank);
  // A neighbor past the mounted rows can rank beyond the board's scale, and
  // his plot would clip at the right edge, so the drawer widens it for him.
  const drawerScale =
    hasRange && (player.maxRank as number) > spreadScale.max
      ? buildSpreadScale(player.maxRank as number, spreadScale.unit, activePosition)
      : spreadScale;

  // Per-game scoring, present only when this player was matched to a game
  // log that cleared the games-played floor.
  const gameLog = player.gameLog;

  const boardLabel = activePosition === "overall" || activePosition === "flex" ? "overall" : "on this board";
  const consensusLine = `R${publishedRank} ${boardLabel}${
    Number.isFinite(player.tier) ? ` · Tier ${player.tier}${boardTierCount ? ` of ${boardTierCount}` : ""}` : ""
  }`;
  // The row already shows this number in both ranking modes, so the drawer
  // carries it too. In VORP mode it leads the facts, because it is the rank.
  const vorp = vorpIndex.get(player.id) ?? null;
  const vorpFact: DrawerFactProps | null = vorp
    ? {
        label: `VORP · ${vorpTeams}-team`,
        term: "VORP",
        value: String(Math.round(vorp.value)),
        title: FANTASY_VORP_TOOLTIP,
      }
    : null;
  const adpFact: DrawerFactProps | null =
    adpAvailable && Number.isFinite(player.adp)
      ? {
          label: adpReferenceAsOf ? `Prior-season ADP · ${adpReferenceAsOf}` : "Market ADP",
          term: adpReferenceAsOf ? "Prior-season ADP" : "Market ADP",
          value: formatAdp(player.adp),
          title: adpReferenceAsOf ? FANTASY_PRIOR_SEASON_ADP_TOOLTIP : FANTASY_ADP_TOOLTIP,
        }
      : null;
  const vsAdpFact: DrawerFactProps | null = vsAdp
    ? {
        label: "vs ADP",
        value: vsAdp.text,
        tone: vsAdp.signal === "value" ? "ffb-good" : vsAdp.signal === "reach" ? "ffb-bad" : "ffb-muted",
        title: vsAdp.judged
          ? FANTASY_VS_ADP_TOOLTIP
          : "Early mock-draft sample, so the gap carries no value or reach read yet",
      }
    : adpFact
      ? { label: "vs ADP", value: "—", title: "No reliable market gap for this player on this board" }
      : null;
  // The fact that leads is the rank the board behind the drawer is sorted by.
  const facts: DrawerFactProps[] = [
    ...(vorpMode && vorpFact ? [vorpFact] : []),
    { label: "Consensus avg", value: formatAvg(player), title: FANTASY_AVG_RANK_TOOLTIP },
    { label: "Expert range", value: formatExpertRange(player), title: FANTASY_EXPERT_SPREAD_TOOLTIP },
    ...(adpFact ? [adpFact] : []),
    ...(vsAdpFact ? [vsAdpFact] : []),
    ...(!vorpMode && vorpFact ? [vorpFact] : []),
  ];

  return (
    <div className="ffb-overlay ffb-enter-fade">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close player detail"
        tabIndex={-1}
        className="ffb-scrim"
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${player.name} detail`}
        tabIndex={-1}
        className="ffb-drawer ffb-enter-side ffb-rk-drawer"
      >
        <div className="ffb-panel-head">
          <div className="ffb-stack ffb-stack-tight">
            <p className="ffb-cluster">
              <PositionChip player={player} />
              <span className="ffb-label ffb-muted">
                {`${player.team || "FA"}${player.byeWeek ? ` · Bye ${player.byeWeek}` : ""}`}
              </span>
            </p>
            <h2 className="ffb-h2">{player.name}</h2>
            {/* The first rank line names whichever rank the board behind the
                drawer is sorted by. In VORP mode the consensus rank stays on the
                next line, since the gap between the two is itself the reading. */}
            {vorpMode && vorp ? <p className="ffb-label">{`VORP #${vorp.rank} · ${vorpTeams}-team`}</p> : null}
            <p className="ffb-label ffb-muted">{consensusLine}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="ffb-iconbtn">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="ffb-panel-body">
          <dl className="ffb-stats ffb-rk-facts">
            {facts.map((fact) => (
              <DrawerFact key={fact.label} {...fact} />
            ))}
          </dl>

          {verdict && (
            <div className={`ffb-notice ${verdict.tone}`.trimEnd()}>
              {/* The verdict compares ADP with the consensus rank, so under a
                  VORP rank line it says which rank it is reading against. */}
              {vorpMode ? <p className="ffb-label ffb-muted">Market read against the consensus rank</p> : null}
              <p>{verdict.text}</p>
            </div>
          )}

          {hasRange && (
            <section className="ffb-stack ffb-stack-tight">
              <div className="ffb-sechead">
                <h3 className="ffb-h3">Expert spread</h3>
                {spread && <p className="ffb-sechead-note">{spread.label}</p>}
              </div>
              <div
                className="ffb-h-rounds ffb-label ffb-muted"
                aria-hidden="true"
                style={{ "--ffb-rounds": drawerScale.divisions } as CSSProperties}
              >
                {drawerScale.labels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="ffb-rk-plot">
                <ExpertSpread player={player} scale={drawerScale} />
              </div>
            </section>
          )}

          {gameLog && (
            <section className="ffb-stack ffb-stack-tight">
              <div className="ffb-sechead">
                <div className="ffb-rk-ppg-head">
                  <h3 className="ffb-h3">Points per game</h3>
                  <MetricTooltip term="Points per game" definition={getFantasyPointsPerGameTooltip(gameLog)} />
                </div>
                <p className="ffb-sechead-note">
                  {`${gameLog.season} season · ${scoringLabel} · ${gameLog.games} ${gameLog.games === 1 ? "game" : "games"}`}
                </p>
              </div>
              <dl className="ffb-stats ffb-rk-ppg">
                <div className="ffb-stat">
                  <dt>Low</dt>
                  <dd>{gameLog.low.toFixed(1)}</dd>
                </div>
                <div className="ffb-stat">
                  <dt>Median</dt>
                  <dd>{gameLog.median.toFixed(1)}</dd>
                </div>
                <div className="ffb-stat">
                  <dt>Avg</dt>
                  <dd>{gameLog.average.toFixed(1)}</dd>
                </div>
                <div className="ffb-stat">
                  <dt>High</dt>
                  <dd>{gameLog.high.toFixed(1)}</dd>
                </div>
              </dl>
            </section>
          )}

          {neighbors.length > 1 && (
            <section>
              <div className="ffb-sechead">
                <h3 className="ffb-h3">Board neighborhood</h3>
                {/* The list follows the board's sort, so its numbers name that
                    sort: VORP rank and value in VORP mode, board rank and
                    consensus average otherwise. */}
                <p className="ffb-sechead-note">{vorpMode ? "VORP rank · VORP" : "Rank · avg"}</p>
              </div>
              <ol className="ffb-neighbors">
                {neighbors.map((neighbor) => (
                  <li key={neighbor.id}>
                    <button
                      type="button"
                      onClick={() => onSelectNeighbor(neighbor.id)}
                      aria-current={neighbor.id === player.id || undefined}
                      className="ffb-neighbor"
                    >
                      <span className="ffb-c-rank">
                        {vorpMode
                          ? formatRankValue(vorpIndex.get(neighbor.id)?.rank)
                          : getPublishedBoardRank(neighbor, activePosition)}
                      </span>
                      <PositionChip player={neighbor} />
                      <span className="ffb-neighbor-name">{neighbor.name}</span>
                      <span className="ffb-muted">
                        {vorpMode ? formatVorpValue(vorpIndex.get(neighbor.id)) : formatAvg(neighbor)}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <button
            type="button"
            onClick={() => queue.toggle(player.id)}
            aria-pressed={isQueued}
            className="ffb-toggle ffb-rk-queue"
          >
            <Star className="ffb-star-icon" size={16} aria-hidden="true" />
            {isQueued ? "Queued" : "Add to queue"}
          </button>

          <div className="ffb-field">
            <label htmlFor="board-player-note" className="ffb-field-label">
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
              className="ffb-textarea"
            />
            <p className="ffb-field-count">
              {`${draftNote.length}/${notes.maxLength} · saved on this device`}
            </p>
          </div>

          <p className="ffb-method">
            Ranks, tiers, and expert ranges come from the published snapshot, and per-game scoring comes from
            nflverse for the season named beside it. Queue and notes stay on this device.
          </p>
        </div>
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

/** One unbroken run of a tier on the full board, which is what a tier break describes. */
interface TierRun {
  count: number;
  first: Player;
  last: Player;
  /** How far the consensus average drops from the run before this one. */
  cliff: number;
}

type CompactRankingValue = "consensus" | `vorp-${FantasyVorpTeamSize}`;

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
  const sentinelRef = useRef<HTMLButtonElement | null>(null);
  const isHydrated = useIsClient();

  const queue = usePlayerQueue();
  // Only the status. The notes themselves belong to the drawer, and
  // subscribing to them here re-rendered every row on each keystroke in one.
  const notesPersistenceStatus = useLocalStoragePersistenceStatus(FANTASY_NOTES_STORAGE_KEY);

  // Null on the server and until the client mounts, then the real year, so
  // the stamps below can drop a matching year without racing new Date().
  const clientNowMs = useClientNow();
  const currentYear = clientNowMs === null ? null : new Date(clientNowMs).getUTCFullYear();

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
    // The settled query is the only trigger. Reacting to routeState.query as
    // well re-ran this with a stale debounced value whenever the URL changed
    // first, so "Clear search" wrote the old query straight back and Back to
    // a searched URL had its query stripped. updateRouteState is recreated
    // every render and is read, not subscribed to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

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

  function clearSearch() {
    setSearchQuery("");
    updateRouteState({ query: "" });
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
    queue.persistenceStatus === "memory-only" || notesPersistenceStatus === "memory-only";
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
  // The vs ADP column, its head, and the Value or Reach word all show together or not at all.
  const showVsAdp = adpSignalsAvailable && vsAdpMeaningful;
  const selectedScoringLabel = FANTASY_SCORING_LABELS[routeState.scoring];
  const currentSourceUpdatedAt = sliceMetadata?.updatedAt ?? metadata?.upstreamUpdatedAt ?? null;
  const activeSourceUpdatedAt = vorpMode
    ? snapshot?.vorpSource?.asOf ?? null
    : currentSourceUpdatedAt;
  const sourceStaleness = getSnapshotStaleness(activeSourceUpdatedAt);
  // From Week 1 the source is frozen on purpose, so grading its age against
  // the daily refresh thresholds only contradicts the note that says so: the
  // chip read "Aging" beside it and would have read "Stale" for four months.
  const frozenInSeason = seasonalWeek >= 1;

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

  // A tier break prints the tier's own count, rank range, and cliff. They are
  // read off the full board, so they stay true when the window has mounted
  // only part of a tier or a search has left one row of it.
  const tierRuns = useMemo(() => {
    const byPlayer = new Map<string, TierRun>();
    let current: (TierRun & { tier: number | null }) | null = null;
    for (const { player, tier, startsTier } of withTierBreaks(players)) {
      if (!current || startsTier || (tier === null) !== (current.tier === null)) {
        let cliff = 0;
        if (current) {
          const previousAvg = getConsensusAvg(current.last);
          const nextAvg = getConsensusAvg(player);
          if (previousAvg !== null && nextAvg !== null) {
            cliff = Math.max(0, Number((nextAvg - previousAvg).toFixed(1)));
          }
        }
        current = { tier, count: 0, first: player, last: player, cliff };
      }
      current.count += 1;
      current.last = player;
      byPlayer.set(player.id, current);
    }
    return byPlayer;
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

  // One rank scale for every spread plot on screen. It follows the mounted
  // rows, not the full 500-player board, so the early rounds stay readable
  // instead of compressing into slivers, and it moves in whole divisions. On
  // the overall board a division is a round of the draft, twelve picks unless
  // the VORP view names another league size.
  const spreadUnit = vorpMode ? routeState.teams : 12;
  const spreadScale = useMemo(() => {
    let max = 0;
    for (const player of windowedPlayers) {
      if (Number.isFinite(player.maxRank) && (player.maxRank as number) > max) {
        max = player.maxRank as number;
      }
    }
    return buildSpreadScale(max, spreadUnit, routeState.position);
  }, [windowedPlayers, spreadUnit, routeState.position]);

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

  // Group the windowed rows into consecutive tiers. The VORP view is one
  // ungrouped list, since a consensus tier says nothing about a VORP order.
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

  const snapshotStamp = formatStamp(metadata?.generatedAt, currentYear);
  const adpStamp = formatStamp(adpSource?.asOf, currentYear);
  const vorpStamp = formatStamp(snapshot?.vorpSource?.asOf, currentYear);
  const sourceStamp = formatStamp(activeSourceUpdatedAt, currentYear);
  // What froze at kickoff is the draft consensus, in either ranking mode. The
  // VORP view's own date prints as "VORP checked", so the frozen date never
  // borrows it.
  const consensusStamp = formatStamp(currentSourceUpdatedAt, currentYear);

  // Each fact prints once, here: the season, the format and its source with the
  // date the source last moved, the ADP state, and whether the source is
  // frozen, aging, or stale. The site's own snapshot date is on the line under
  // the board. The ADP part drops its provider name below md, where the line
  // otherwise runs to four rows, and the drawer still names the provider.
  const freshnessParts: FreshnessPart[] = [
    ...(metadata?.season ? [{ label: String(metadata.season) }] : []),
    {
      label: vorpMode
        ? `${routeState.teams}-team ${selectedScoringLabel} VORP · ${snapshot?.vorpSource?.provider ?? "Projected VORP"}`
        : `${selectedScoringLabel} · FantasyPros consensus${
            !frozenInSeason && sourceStaleness === "fresh" && sourceStamp ? ` updated ${sourceStamp}` : ""
          }`,
    },
    ...(vorpMode && vorpStamp ? [{ label: `VORP checked ${vorpStamp}` }] : []),
    ...(adpSource && adpAvailable && adpStamp
      ? [{ label: `ADP ${adpSource.provider} · ${adpStamp}`, shortLabel: `ADP · ${adpStamp}` }]
      : []),
    ...(adpSource && adpFreshness === "prior-season"
      ? [{ label: "ADP prior season", tone: STALENESS_TONE.aging }]
      : []),
    ...(adpSource && adpFreshness === "stale"
      ? [{ label: "ADP stale · signals hidden", tone: STALENESS_TONE.stale }]
      : []),
    // No metadata means the board is still loading or failed to load, and a
    // board that has not arrived has no age to grade.
    ...(frozenInSeason
      ? [{ label: `Frozen since ${consensusStamp ?? "kickoff"}` }]
      : metadata && sourceStaleness !== "fresh"
        ? [
            {
              label: `${getSnapshotStalenessLabel(sourceStaleness)} · source ${sourceStamp ?? "date unknown"}`,
              tone: STALENESS_TONE[sourceStaleness],
            },
          ]
        : []),
  ];

  const boardReady = !isLoading && !error && !currentSliceUnavailable && filteredPlayers.length > 0;

  // The line under the board carries what the head does not: how often the
  // snapshot is rebuilt, when this one was, and what a division of the spread
  // scale is. In season the cadence is left off, since the board above it says
  // it is frozen.
  const footLine = [
    frozenInSeason ? null : "Refreshes daily July through December, weekly in the offseason",
    snapshotStamp ? `Snapshot ${snapshotStamp}` : null,
    boardReady && routeState.position === "overall"
      ? `Spread drawn in rounds of a ${spreadUnit}-team draft`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

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

  // Position boards rank within the position while ADP stays an overall pick
  // number, so the label says which scale it is on.
  const adpLabel = vsAdpMeaningful ? "ADP" : "ADP (overall)";
  // A phone row prints two numbers at its right edge: the market pair when the
  // board judges it, otherwise VORP over the consensus average. Everything
  // else a row carries on a desktop is in the drawer.
  const phoneNumbers: "market" | "vorp" | "avg" = showVsAdp && !vorpMode ? "market" : vorpAvailable ? "vorp" : "avg";
  const phoneNumbersLabel = { market: "ADP, vs ADP", vorp: "VORP, Avg", avg: "Avg" }[phoneNumbers];
  const compactRankingValue: CompactRankingValue =
    routeState.ranking === "vorp" ? `vorp-${routeState.teams}` : "consensus";

  const displayRank = (player: Player): string =>
    vorpMode
      ? String(vorpIndex.get(player.id)?.rank ?? "—")
      : getPublishedBoardRank(player, routeState.position);

  function renderRow(player: Player): ReactNode {
    const vsAdp = showVsAdp ? describeVsAdp(player) : null;
    const vorp = vorpIndex.get(player.id);
    const isQueued = queue.isQueued(player.id);
    return (
      // The opener overlays the row instead of wrapping it: an aria-label on a
      // wrapping button would override every cell, leaving screen readers
      // nothing but "Open X detail" rows. The cells sit above it so hover
      // titles fire and names stay selectable, and the row's own click still
      // opens the drawer unless the visitor is selecting text. The opener is
      // the keyboard path.
      <li
        key={player.id}
        className={`ffb-row${isQueued ? " ffb-is-queued" : ""}`}
        onClick={(event) => {
          if (window.getSelection()?.toString()) return;
          // Pointer clicks land on the cells above the opener. Focus the
          // opener so closing the drawer returns to this player.
          event.currentTarget.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
          setDetailPlayerId(player.id);
        }}
      >
        <button
          type="button"
          aria-label={`Open ${player.name} detail${isQueued ? " (in your queue)" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            setDetailPlayerId(player.id);
          }}
          className="ffb-row-open"
        />
        <span
          className="ffb-c-rank"
          title={
            vorpMode
              ? `VORP rank${isQueued ? " · in your queue" : ""}`
              : isQueued
                ? "Board rank · in your queue"
                : "Board rank"
          }
        >
          {displayRank(player)}
        </span>
        <PositionChip player={player} />
        <span className="ffb-c-name">{player.name}</span>
        <span className="ffb-c-team">{player.team}</span>
        <span className="ffb-c-bye">
          {player.byeWeek ? (
            <>
              <span className="ffb-rk-vh-desk">Bye </span>
              {player.byeWeek}
            </>
          ) : null}
        </span>
        {adpAvailable && (
          <span className={`ffb-c-num${phoneNumbers === "market" ? " ffb-m-top" : ""}`} title={adpTooltip}>
            <span className="ffb-vh">ADP </span>
            {formatAdp(player.adp)}
          </span>
        )}
        {showVsAdp && (
          <span
            className={`ffb-c-num ffb-rk-vsadp ${VS_ADP_CLASS[vsAdp?.signal ?? "none"]}${phoneNumbers === "market" ? " ffb-m-sub" : ""}`}
            title={
              vsAdp && !vsAdp.judged
                ? "Early mock-draft sample, so the gap carries no value or reach read yet"
                : FANTASY_VS_ADP_TOOLTIP
            }
          >
            <span className="ffb-vh">versus ADP </span>
            {vsAdp ? vsAdp.text : "—"}
            {/* The word a drafter scans for, beside the number it judges. It
                prints only when the gate fires, and never on a position board,
                where the rank is not on the overall scale. */}
            {vsAdp?.signal ? (
              <span
                className="ffb-label ffb-rk-word"
                title={vsAdp.signal === "value" ? FANTASY_VALUE_TOOLTIP : FANTASY_REACH_TOOLTIP}
              >
                {vsAdp.signal === "value" ? "Value" : "Reach"}
              </span>
            ) : null}
          </span>
        )}
        {vorpAvailable && (
          // Heavy only when VORP is the ranking, so on the consensus board the
          // column is data and not forty weighted numbers beside another order.
          <span
            className={`ffb-c-num${vorp && vorp.value > 0 ? (vorpMode ? " ffb-is-strong" : "") : " ffb-is-flat"}${phoneNumbers === "vorp" ? " ffb-m-top" : ""}`}
            title={FANTASY_VORP_TOOLTIP}
          >
            <span className="ffb-vh">Value over replacement player </span>
            {vorp ? Math.round(vorp.value) : "—"}
          </span>
        )}
        <ExpertSpread player={player} scale={spreadScale} />
        <span
          className={`ffb-c-num ffb-is-flat${phoneNumbers === "vorp" ? " ffb-m-sub" : phoneNumbers === "avg" ? " ffb-m-top" : ""}`}
          title={FANTASY_AVG_RANK_TOOLTIP}
        >
          <span className="ffb-vh">Consensus average </span>
          {formatAvg(player)}
        </span>
        {/* The row-edge queue toggle. Its click stops at the button, so
            starring a player never opens him. */}
        <button
          type="button"
          aria-pressed={isQueued}
          aria-label={isQueued ? `Remove ${player.name} from queue` : `Queue ${player.name}`}
          onClick={(event) => {
            event.stopPropagation();
            queue.toggle(player.id);
          }}
          className="ffb-star"
        >
          <Star className="ffb-star-icon" size={16} aria-hidden="true" />
        </button>
      </li>
    );
  }

  function renderTierSection(group: TierGroup, index: number): ReactNode {
    if (vorpMode) {
      return (
        <ol
          key="vorp"
          className="ffb-rows ffb-rk-list"
          aria-label={`${routeState.teams}-team VORP rankings, ${filteredPlayers.length} ${filteredPlayers.length === 1 ? "player" : "players"}`}
        >
          {group.rows.map(renderRow)}
        </ol>
      );
    }

    const run = tierRuns.get(group.rows[0].id);
    const count = run?.count ?? group.rows.length;
    const firstRank = displayRank(run?.first ?? group.rows[0]);
    const lastRank = displayRank(run?.last ?? group.rows[group.rows.length - 1]);
    const cliff = run?.cliff ?? 0;
    const countLabel = `${count} ${count === 1 ? "player" : "players"}`;
    // The gap above a break grows with the cliff, in 4px steps from 8 to 28px.
    const gap = Math.min(28, Math.max(8, Math.round((cliff * 6) / 4) * 4));

    /* A <section> with no accessible name is not exposed as a landmark at all, so an
       unnamed tier makes the tier structure of a tier-first board invisible to assistive
       tech. This is a literal label, not aria-labelledby, so it can also carry the cliff
       in words the heading abbreviates. */
    const tierLabel = [
      group.tier !== null ? `Tier ${group.tier}` : "No published tier",
      countLabel,
      `ranks ${firstRank} to ${lastRank}`,
      cliff > 0 ? `${cliff.toFixed(1)} average-rank cliff above` : null,
    ]
      .filter(Boolean)
      .join(", ");

    return (
      <section
        key={`tier-${group.tier ?? "untiered"}-${group.rows[0].id}`}
        className="ffb-tier"
        aria-label={tierLabel}
        style={index > 0 ? ({ "--ffb-gap": `${gap}px` } as CSSProperties) : undefined}
      >
        <header className="ffb-tier-head">
          <h3 className="ffb-tier-name">
            <span className="ffb-tier-tab">
              {group.tier !== null ? (
                <>
                  Tier <span>{String(group.tier).padStart(2, "0")}</span>
                </>
              ) : (
                "No tier"
              )}
            </span>
            <span className="ffb-tier-count">{countLabel}</span>
            <span className="ffb-tier-range">
              {firstRank === lastRank ? `Rank ${firstRank}` : `Ranks ${firstRank}–${lastRank}`}
            </span>
          </h3>
          {cliff > 0 && (
            <p className="ffb-tier-cliff">
              <span className="ffb-cliff-mark" aria-hidden="true" />
              <b>{cliff.toFixed(1)}</b> <span className="ffb-not-phone">avg-rank </span>cliff
            </p>
          )}
        </header>
        <ol className="ffb-rows">{group.rows.map(renderRow)}</ol>
      </section>
    );
  }

  return (
    <section
      className="relative min-h-dvh overflow-x-clip"
      aria-label="Fantasy football rankings"
      data-testid="fantasy-football-shell"
      data-hydrated={isHydrated ? "true" : "false"}
    >
      <FantasyRouteHeader
        title="Fantasy Football Rankings"
        lead={
          vorpMode
            ? `VORP ranks FantasyPros' projected season points above the same-position waiver replacement in a ${routeState.teams}-team league. FantasyPros supplies the roster baseline for this view.`
            : "The board pairs the expert consensus with market ADP when a current sample is published, and the tier breaks mark where the board actually drops off."
        }
        freshness={<FreshnessParts parts={freshnessParts} />}
      />

      <div className={`${SHELL_CLASS} ffb-stack ffb-stack-page`}>
        <div className="ffb-stack">
          {seasonalWeek >= 1 ? (
            <SeasonalScopeNote season={metadata?.season ?? 0} week={seasonalWeek}>
              Every board here is the preseason draft consensus, kept as a
              reference once games begin. Ranks that still move are on the{" "}
              <Link href="/fantasy-football/weekly">weekly board</Link> and the{" "}
              <Link href="/fantasy-football/waivers">waiver targets</Link>.
            </SeasonalScopeNote>
          ) : null}

          {localToolsMemoryOnly && (
            <div role="status" className="ffb-notice">
              <p>
                <strong>Browser storage is unavailable.</strong> Queue and notes still work in this tab, but they
                will not survive a reload.
              </p>
            </div>
          )}

          <div>
            <h2 className="sr-only">
              {vorpMode ? `${routeState.teams}-team VORP` : FANTASY_POSITION_LABELS[routeState.position]} rankings
            </h2>

            <div
              className={[
                "ffb-board ffb-rk-board",
                adpAvailable ? "ffb-rk-adp" : "",
                showVsAdp ? "ffb-rk-vs" : "",
                vorpAvailable ? "ffb-rk-vorp" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {/* The toolbar and the column heads pin as one block, so the numbers
                  keep their names mid-scroll. Each control is built once. The
                  three a phone draws differently (position, ranking, search) have
                  a phone form beside the desktop one, and only one of each pair
                  is displayed at a width. */}
              <div className="ffb-sticky ffb-rk-bar" data-testid="fantasy-board-controls">
                <div className={`ffb-toolbar ffb-rk-tools${mobileSearchOpen ? " ffb-rk-searching" : ""}`}>
                  {mobileSearchOpen ? (
                    <div className="ffb-rk-findrow flex md:hidden">
                      <div className="ffb-search">
                        <Search size={15} aria-hidden="true" />
                        <label htmlFor="fantasy-search-compact" className="ffb-vh">
                          Search the current rankings board
                        </label>
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
                          className="ffb-search-input"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            aria-label="Clear search"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={clearSearch}
                            className="ffb-search-clear"
                          >
                            <X size={16} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label="Done searching, keep the filter"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => setMobileSearchOpen(false)}
                        className="ffb-btn"
                      >
                        Done
                      </button>
                    </div>
                  ) : null}

                  <div className="contents max-md:hidden">
                    <PositionFilterBar
                      ariaLabel="Position board"
                      options={positionOptions}
                      value={routeState.position}
                      onChange={(position) => updateRouteState({ position })}
                    />
                  </div>
                  <label htmlFor="fantasy-position-select" className="sr-only">
                    Position board
                  </label>
                  <select
                    id="fantasy-position-select"
                    value={routeState.position}
                    onChange={(event) => updateRouteState({ position: event.target.value as FantasyRoutePosition })}
                    className="ffb-select ffb-rk-pos ffb-rk-yield md:hidden"
                  >
                    {positionOptions.map((option) => {
                      /* The desktop switch already renders an unavailable slice
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

                  <div className="ffb-seg ffb-rk-yield" role="group" aria-label="Scoring format">
                    {SCORING_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        aria-pressed={routeState.scoring === option.key}
                        aria-label={option.label}
                        onClick={() => updateRouteState({ scoring: option.key })}
                        className="ffb-seg-btn"
                      >
                        <span className="md:hidden">{option.shortLabel}</span>
                        <span className="max-md:hidden">{option.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* In VORP mode the league size rides against the switch, because
                      the size is a parameter of VORP. */}
                  <div className="ffb-rk-rank max-md:hidden">
                    <div className="ffb-seg" role="group" aria-label="Ranking method">
                      {(["consensus", "vorp"] as const).map((option) => {
                        const unpublished = option === "vorp" && !vorpAvailable;
                        return (
                          <button
                            key={option}
                            type="button"
                            aria-pressed={routeState.ranking === option}
                            aria-label={unpublished ? "VORP, not published in the current snapshot" : undefined}
                            title={unpublished ? "Not published in the current snapshot" : undefined}
                            disabled={unpublished}
                            onClick={() => updateRouteState({ ranking: option })}
                            className="ffb-seg-btn"
                          >
                            {option === "consensus" ? "Consensus" : "VORP"}
                            {unpublished ? <span className="ffb-seg-na">NA</span> : null}
                          </button>
                        );
                      })}
                    </div>
                    {routeState.ranking === "vorp" ? (
                      <select
                        aria-label="VORP league size"
                        value={routeState.teams}
                        onChange={(event) =>
                          updateRouteState({ teams: Number(event.target.value) as FantasyVorpTeamSize })
                        }
                        className="ffb-select"
                      >
                        {FANTASY_VORP_TEAM_SIZES.map((teamSize) => (
                          <option key={teamSize} value={teamSize}>
                            {teamSize} teams
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                  {/* The phone's ranking control. One native select carries the
                      method and the league size, so the pair costs no third row. */}
                  <select
                    aria-label="Ranking method"
                    value={compactRankingValue}
                    onChange={(event) => {
                      const next = event.target.value;
                      if (next === "consensus") {
                        updateRouteState({ ranking: "consensus" });
                        return;
                      }
                      const size = Number(next.replace("vorp-", ""));
                      if (isFantasyVorpTeamSize(size)) updateRouteState({ ranking: "vorp", teams: size });
                    }}
                    className="ffb-select ffb-rk-mode ffb-rk-yield md:hidden"
                  >
                    <option value="consensus">Consensus</option>
                    {FANTASY_VORP_TEAM_SIZES.map((teamSize) => (
                      <option key={teamSize} value={`vorp-${teamSize}`} disabled={!vorpAvailable}>
                        VORP {teamSize}-team
                      </option>
                    ))}
                  </select>

                  <label className="ffb-search max-md:hidden">
                    <Search size={15} aria-hidden="true" />
                    <span className="ffb-vh">Search the current rankings board</span>
                    <input
                      id="fantasy-search"
                      name="fantasy-search"
                      value={searchQuery}
                      maxLength={80}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      disabled={currentSliceUnavailable}
                      autoComplete="off"
                      placeholder="Player or team"
                      className="ffb-search-input"
                    />
                  </label>
                  {/* A collapsed search still filters the board, so the button
                      carries the active state and names the query. */}
                  <button
                    type="button"
                    aria-label={
                      searchQuery
                        ? `Search the current rankings board, filtering by ${searchQuery}`
                        : "Search the current rankings board"
                    }
                    onClick={() => setMobileSearchOpen(true)}
                    disabled={currentSliceUnavailable}
                    className={`ffb-iconbtn ffb-iconbtn-edge ffb-rk-find ffb-rk-yield md:hidden${searchQuery && !currentSliceUnavailable ? " ffb-rk-is-on" : ""}`}
                  >
                    <Search size={16} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    aria-pressed={queuedOnly}
                    aria-label={`Show only queued players (${queuedOnBoardCount} on this board)`}
                    onClick={() => setQueuedOnly((value) => !value)}
                    className="ffb-toggle ffb-rk-yield"
                  >
                    <Star className="ffb-star-icon" size={16} aria-hidden="true" />
                    <span className="max-md:hidden">Queued</span>
                    {queuedOnBoardCount > 0 && (
                      <span className="ffb-countbadge" aria-hidden="true">
                        {queuedOnBoardCount}
                      </span>
                    )}
                  </button>

                  {/* The route's one live region. It is also the visible feedback
                      that a search or the queue filter landed on n rows. */}
                  <p className="ffb-count" aria-live={error ? undefined : "polite"}>
                    {countLine}
                  </p>
                </div>

                {boardReady && (
                  <div className="ffb-colhead">
                    <span className={`ffb-h-num ffb-m-show${vorpMode ? "" : " ffb-is-sorted"}`}>Rk</span>
                    <span className="ffb-h-pos">Pos</span>
                    <span className="ffb-m-show">
                      <span className="md:hidden">Player</span>
                      <span className="max-md:hidden">
                        <MetricTooltip term="Player" definition={FANTASY_PLAYER_COLUMN_TOOLTIP} focusable>
                          Player
                        </MetricTooltip>
                      </span>
                    </span>
                    <span>Team</span>
                    <span className="ffb-h-num">Bye</span>
                    {adpAvailable && (
                      <span className="ffb-h-num ffb-rk-h-wrap">
                        <MetricTooltip term={adpLabel} definition={adpTooltip} focusable>
                          {adpLabel}
                        </MetricTooltip>
                      </span>
                    )}
                    {showVsAdp && (
                      <span className="ffb-h-num ffb-rk-h-vs">
                        <MetricTooltip term="vs ADP" definition={FANTASY_VS_ADP_TOOLTIP} focusable>
                          vs ADP
                        </MetricTooltip>
                      </span>
                    )}
                    {vorpAvailable && (
                      <span className={`ffb-h-num${vorpMode ? " ffb-is-sorted" : ""}`}>
                        <MetricTooltip term="VORP" definition={FANTASY_VORP_TOOLTIP} focusable>
                          VORP
                        </MetricTooltip>
                      </span>
                    )}
                    <span className="ffb-h-spread" style={{ "--ffb-rounds": spreadScale.divisions } as CSSProperties}>
                      <span className="ffb-h-spread-label">
                        <span className="ffb-rk-h-spread-name">
                          <MetricTooltip term="Expert spread" definition={FANTASY_EXPERT_SPREAD_TOOLTIP} focusable>
                            Expert spread
                          </MetricTooltip>
                        </span>
                        <span className="ffb-spread-key">
                          <span>
                            <i className="ffb-key-range" />
                            Range
                          </span>
                          <span>
                            <i className="ffb-key-sd" />
                            ±1 SD
                          </span>
                          <span>
                            <i className="ffb-key-avg" />
                            Average
                          </span>
                        </span>
                      </span>
                      <span className="ffb-h-rounds">
                        {spreadScale.labels.map((label) => (
                          <span key={label}>{label}</span>
                        ))}
                      </span>
                    </span>
                    <span className="ffb-h-num">
                      <MetricTooltip term="Avg" definition={FANTASY_AVG_RANK_TOOLTIP} focusable>
                        Avg
                      </MetricTooltip>
                    </span>
                    <span className="ffb-m-show md:hidden">{phoneNumbersLabel}</span>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="ffb-rk-skel" aria-hidden="true">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <div key={`loading-${index}`} className="ffb-skel-row">
                      <span className="ffb-skel" />
                      <span className="ffb-skel" />
                      <span className="ffb-skel" />
                      <span className="ffb-skel" />
                      <span className="ffb-skel" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div role="alert" className="ffb-notice ffb-notice-bad">
                  <p>
                    <strong>{error}</strong> Check your connection and try loading the published snapshot again.
                  </p>
                  <div className="ffb-notice-actions">
                    <button type="button" onClick={retry} className="ffb-btn">
                      Retry rankings
                    </button>
                  </div>
                </div>
              ) : currentSliceUnavailable ? (
                <div className="ffb-empty">
                  <p className="ffb-empty-title">
                    {selectedScoringLabel} {FANTASY_POSITION_LABELS[routeState.position]} rankings are unavailable.
                  </p>
                  <p className="ffb-empty-body">
                    {sliceMetadata?.reason ??
                      "This scoring-position combination is not published in the current snapshot."}
                  </p>
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="ffb-empty">
                  <p className="ffb-empty-title">
                    {queuedOnly ? "No queued players on this board." : "No players match on this board."}
                  </p>
                  {queuedOnly ? (
                    <button type="button" onClick={() => setQueuedOnly(false)} className="ffb-btn">
                      Show all players
                    </button>
                  ) : (
                    <div className="ffb-cluster">
                      <button type="button" onClick={clearSearch} className="ffb-btn">
                        Clear search
                      </button>
                      {overallSearchHit && (
                        <button
                          type="button"
                          onClick={() => updateRouteState({ position: "overall" })}
                          className="ffb-btn ffb-btn-quiet"
                        >
                          Found on the overall board
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {tierGroups.map((group, index) => renderTierSection(group, index))}
                  {hasMore && (
                    <button
                      ref={sentinelRef}
                      type="button"
                      onClick={() =>
                        setVisibleCount((count) => Math.min(count + RANKINGS_PAGE_SIZE, filteredPlayers.length))
                      }
                      className="ffb-more"
                    >
                      Load more ({filteredPlayers.length - windowedPlayers.length} left)
                    </button>
                  )}
                </>
              )}
            </div>

            {/* The one link the product bar above the page does not carry sits
                at the right of the source line. */}
            <div className="ffb-footlinks ffb-rk-footlinks">
              <p>{footLine}</p>
              <Link href="/fantasy-football/weekly#my-team" className="ffb-link ffb-link-arrow">
                My team
              </Link>
            </div>
          </div>
        </div>

        {/* Plain prose in reading columns. The same array feeds the page's FAQ
            schema, so the text stays as written. */}
        <section aria-labelledby="fantasy-rankings-questions">
          <div className="ffb-sechead ffb-sechead-lg">
            <FantasySectionHeading id="fantasy-rankings-questions">
              Fantasy rankings questions
            </FantasySectionHeading>
          </div>
          <div className="ffb-faq">
            {FANTASY_FOOTBALL_FAQ.map((item) => (
              <div key={item.question}>
                <h3 className="ffb-h4">{item.question}</h3>
                <p>{item.answer}</p>
              </div>
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
          vorpMode={vorpMode}
          vorpTeams={routeState.teams}
          vorpIndex={vorpIndex}
          spreadScale={spreadScale}
          onSelectNeighbor={(id) => setDetailPlayerId(id)}
          onClose={() => setDetailPlayerId(null)}
        />
      )}
    </section>
  );
}

export default FantasyFootballClient;
