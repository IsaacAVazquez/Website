"use client";

import { useIsClient } from "@/hooks/useIsClient";
import Link from "next/link";
import { MyTeamPanel } from "@/components/fantasy/MyTeamPanel";
import { useFantasyMyTeam } from "@/hooks/useFantasyMyTeam";
import { useRouter, useSearchParams } from "next/navigation";
import {
  startTransition,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";
import { useFantasyWeeklySnapshot } from "@/hooks/useFantasyWeeklySnapshot";
import {
  FANTASY_RANKINGS_PAGE_SIZE,
  FANTASY_SCORING_LABELS,
  normalizeFantasyRouteScoring,
  type FantasyRouteScoring,
} from "@/lib/fantasy";
import {
  FANTASY_WEEKLY_MIN_WAIVER_GAP,
  FANTASY_WEEKLY_STARTABLE_DEPTH,
  FANTASY_WEEKLY_WIDELY_ROSTERED_PERCENT,
  describeFantasyWeeklySource,
  getFantasyWeeklySourceHost,
  getFantasyWeeklyWaiverCandidates,
  pickWorseFantasySnapshotStaleness,
  type FantasyWeeklyBoardSource,
  type FantasyWeeklyPlayer,
  type FantasyWeeklySeed,
} from "@/lib/fantasyWeeklySnapshot";
import {
  SHELL_CLASS,
  formatUpdatedAt,
  getSnapshotStaleness,
  getSnapshotStalenessLabel,
} from "@/lib/fantasyUtils";
import {
  FantasyRouteHeader,
  FantasySectionHeading,
  FreshnessParts,
  TitleAccent,
  type FreshnessPart,
} from "@/components/fantasy/FantasyRouteHeader";
import { formatStableDateTime } from "@/lib/date-formatters";
import { computeWeeklyTiers, type WeeklyTier } from "@/lib/fantasyWeeklyTiers";
import { PositionFilterBar, type PositionFilterOption } from "@/components/fantasy/PositionFilterBar";
import { ExpertSpread, SpreadScaleLabels, TierSection } from "@/components/fantasy/TierSection";
import { fitRowsScale, type SpreadScale } from "@/components/fantasy/spreadScale";
import { positionClass } from "@/components/fantasy/positionClass";
import "@/components/fantasy/fantasy-weekly.css";

export type WeeklyView = "rankings" | "waivers";

/** The two in-season pages share one snapshot and one client; this is what differs. */
const VIEWS = {
  rankings: {
    path: "/fantasy-football/weekly",
    ariaLabel: "Fantasy football weekly board",
  },
  waivers: {
    path: "/fantasy-football/waivers",
    ariaLabel: "Fantasy football waiver targets",
  },
} as const;

/**
 * What a phone prints on the scoring switch, the same three the rankings board
 * prints, so scoring shares a row with the search field. The full label stays
 * each button's accessible name.
 */
const SCORING_SHORT_LABELS: Record<FantasyRouteScoring, string> = {
  ppr: "PPR",
  half_ppr: "Half",
  standard: "Std",
};

/** The room left above the toolbar when a filter brings it back on screen. */
const TOOLBAR_SCROLL_GAP = 8;

/** Tailwind's `md`, the width at which the tables fit without clipping. */
const TABLE_LAYOUT_QUERY = "(min-width: 768px)";

function subscribeToTableLayout(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(TABLE_LAYOUT_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getTableLayout() {
  return typeof window.matchMedia === "function"
    ? window.matchMedia(TABLE_LAYOUT_QUERY).matches
    : true;
}

function getServerTableLayout() {
  return true;
}

/**
 * Below `md` a five or six column table cannot fit in 316px, and neither a
 * sticky first column (the name cell alone is wider than the box) nor a
 * horizontal scroll (which separates every number from its name) reads well
 * with one thumb. So the phone gets a stacked list, the player over his
 * values under one sticky head, and the table only renders where it fits. One layout is in the
 * DOM at a time rather than both with one hidden, since the flex board runs
 * to 457 rows.
 */
function useTableLayout(): boolean {
  return useSyncExternalStore(
    subscribeToTableLayout,
    getTableLayout,
    getServerTableLayout,
  );
}

// The server renders in UTC and cannot know the visitor's timezone, so the
// server and hydration renders print the stamp in UTC and local time follows.
const UTC_STAMP_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatSourceStamp(asOf: string, hydrated: boolean): string {
  if (hydrated) return formatUpdatedAt(asOf);
  const date = new Date(asOf);
  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : `${formatStableDateTime(UTC_STAMP_FORMATTER, date)} UTC`;
}

export type WeeklyBoardKey = "flex" | "quarterbacks";

type WeeklyPositionFilter = "ALL" | "RB" | "WR" | "TE";

const POSITION_OPTIONS: PositionFilterOption<WeeklyPositionFilter>[] = [
  { value: "ALL", label: "All" },
  { value: "RB", label: "RB", position: "RB" },
  { value: "WR", label: "WR", position: "WR" },
  { value: "TE", label: "TE", position: "TE" },
];

/** A division of a tier's spread scale is twelve ranks of the board, labelled by the rank it starts at. */
const SPREAD_UNIT = 12;

function formatAverage(player: FantasyWeeklyPlayer): string {
  return player.rankAverage === undefined ? "—" : player.rankAverage.toFixed(1);
}

export interface WeeklyRouteState {
  scoring: FantasyRouteScoring;
  board: WeeklyBoardKey;
}

/** Kept in step with the same normalization in page.tsx. */
function normalizeWeeklyBoard(
  value: string | null | undefined,
): WeeklyBoardKey {
  return value === "quarterbacks" ? "quarterbacks" : "flex";
}

function formatOwnership(value: number | undefined): string {
  return value === undefined ? "—" : `${value.toFixed(1)}%`;
}

/**
 * The visible count for the rankings board, which doubles as the page's live
 * region. It has to say how deep the window goes when the board is cut, and
 * how many rows matched when a search or position filter is on, because the
 * cap is applied after the filter and a match past the window would otherwise
 * be invisible.
 */
function describeWindow(
  shown: number,
  matching: number,
  total: number,
  filtered: boolean,
): string {
  if (!filtered) {
    return shown === total
      ? `Showing all ${total} players`
      : `Showing ${shown} of ${total} players`;
  }
  return shown === matching
    ? `${matching} of ${total} players match`
    : `Showing ${shown} of ${matching} matching players, ${total} on the board`;
}

/**
 * The mounted rows in runs of one tier each. A search or the window can leave
 * part of a tier on screen, and the run still carries the whole tier.
 */
function groupVisibleRows(
  rows: FantasyWeeklyPlayer[],
  tierByPlayer: Map<string, { tier: WeeklyTier; scale: SpreadScale }>,
): { tier: WeeklyTier; scale: SpreadScale; rows: FantasyWeeklyPlayer[] }[] {
  const groups: { tier: WeeklyTier; scale: SpreadScale; rows: FantasyWeeklyPlayer[] }[] = [];
  for (const player of rows) {
    const entry = tierByPlayer.get(player.id);
    if (!entry) continue;
    const current = groups[groups.length - 1];
    if (current?.tier === entry.tier) current.rows.push(player);
    else groups.push({ ...entry, rows: [player] });
  }
  return groups;
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} rel="noreferrer noopener" target="_blank">
      {label}
      <span className="sr-only">, opens in a new tab</span>
    </a>
  );
}

/**
 * The player as both views print him: the position chip with his position
 * rank, the name, and the team. The waiver list has no opponent column, so
 * there the matchup follows the team. The chip and the name are one group and
 * the team and the matchup another, so a tight cell wraps between the two and
 * never leaves the chip on a line by itself.
 */
function PlayerCell({
  player,
  withOpponent = false,
}: {
  player: FantasyWeeklyPlayer;
  withOpponent?: boolean;
}) {
  return (
    <span className="ffb-namecell">
      <span className="ffb-wk-who">
        <span className={`ffb-chip ffb-pos-${player.position.toLowerCase()}`}>
          {player.position}
          {player.positionRank ?? ""}
        </span>{" "}
        <span className="ffb-wk-name">{player.name}</span>
      </span>{" "}
      <span className="ffb-wk-where">
        <span className="ffb-c-team">{player.team}</span>
        {withOpponent && player.opponent ? (
          <>
            {" "}
            <span className="ffb-wk-opp">{player.opponent}</span>
          </>
        ) : null}
      </span>
    </span>
  );
}

/**
 * One value of a stacked row. The list's head names the column on screen, so
 * the label here is for assistive tech, and the kit's `ffb-pairs-cols` hides it.
 */
function ReadoutPair({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={emphasis ? "ffb-is-strong" : undefined}>{value}</dd>
    </div>
  );
}

export function WeeklyBoardClient({
  initialState,
  initialSnapshot = null,
  view = "rankings",
}: {
  initialState: WeeklyRouteState;
  /** The server's copy of the requested scoring format, so rows ship in the HTML. */
  initialSnapshot?: FantasyWeeklySeed | null;
  view?: WeeklyView;
}) {
  const { snapshot, notPublished, isLoading, error, retry } =
    useFantasyWeeklySnapshot(initialSnapshot);
  const isHydrated = useIsClient();
  const viewConfig = VIEWS[view];
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableLayout = useTableLayout();
  const savedTeam = useFantasyMyTeam(snapshot?.season ?? new Date().getUTCFullYear());

  // The URL is the source of truth, the way the rankings board does it, so a
  // weekly board can be linked and restored. The server-normalized props cover
  // the first render and any visit that carries no parameters.
  const scoringParam = searchParams.get("scoring");
  const boardParam = searchParams.get("board");
  const scoring =
    scoringParam === null
      ? savedTeam.hasSavedTeam ? savedTeam.team.scoring : initialState.scoring
      : normalizeFantasyRouteScoring(scoringParam);
  const board =
    boardParam === null ? initialState.board : normalizeWeeklyBoard(boardParam);

  function updateRouteState(next: Partial<WeeklyRouteState>) {
    if (next.scoring) savedTeam.update(current => ({ ...current, scoring: next.scoring! }));
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("scoring", next.scoring ?? scoring);
    // The waiver list spans both boards, so that page carries no board choice.
    if (view === "rankings") params.set("board", next.board ?? board);
    // Replace rather than push. A scoring or board tap is a filter change, and
    // pushing would make Back walk the filter history instead of leaving.
    startTransition(() => {
      router.replace(`${viewConfig.path}?${params.toString()}`, {
        scroll: false,
      });
    });
  }

  const activeBoard = snapshot?.boards[scoring] ?? null;
  // A server seed carries one scoring format. Until the full file lands, a
  // switch to another format has no board yet, which is loading, not empty.
  const boardPending = snapshot !== null && activeBoard === null && !error;
  const players = useMemo(
    () => (activeBoard ? activeBoard[board] : []),
    [activeBoard, board],
  );
  const source = activeBoard
    ? board === "flex"
      ? activeBoard.flexSource
      : activeBoard.quarterbackSource
    : null;
  const waivers = useMemo(
    () => (activeBoard ? getFantasyWeeklyWaiverCandidates(activeBoard) : []),
    [activeBoard],
  );
  // The rankings view shows one board, so one stamp. The waiver list draws on
  // both boards at once, so its chip is the worse of the two readings and the
  // header prints both stamps rather than describing six quarterback rows
  // with the flex board's date.
  const flexStaleness = getSnapshotStaleness(activeBoard?.flexSource.asOf);
  const quarterbackStaleness = getSnapshotStaleness(
    activeBoard?.quarterbackSource.asOf,
  );
  const staleness =
    view === "waivers"
      ? pickWorseFantasySnapshotStaleness(flexStaleness, quarterbackStaleness)
      : getSnapshotStaleness(source?.asOf);

  // Search and the position filter are view state rather than route state. A
  // query is ephemeral in a way scoring and board are not, so it stays out of
  // the URL. The position filter only means anything on the flex board, since
  // the quarterback board is one position already.
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] =
    useState<WeeklyPositionFilter>("ALL");
  const query = searchQuery.trim().toLowerCase();
  const positionActive = board === "flex" && positionFilter !== "ALL";
  const positionPlayers = useMemo(
    () => (positionActive ? players.filter((player) => player.position === positionFilter) : players),
    [players, positionActive, positionFilter],
  );
  const filteredPlayers = useMemo(
    () =>
      query
        ? positionPlayers.filter((player) =>
            `${player.name} ${player.team}`.toLowerCase().includes(query),
          )
        : positionPlayers,
    [positionPlayers, query],
  );

  // Tiers are drawn on the list a position filter leaves, so the RB view gets
  // running back tiers. A search only hides rows, so a tier's count, range,
  // cliff, and spread scale stay those of the whole tier.
  const tiers = useMemo(() => computeWeeklyTiers(positionPlayers), [positionPlayers]);
  const tierByPlayer = useMemo(() => {
    const byPlayer = new Map<string, { tier: WeeklyTier; scale: SpreadScale }>();
    for (const tier of tiers) {
      const scale = fitRowsScale(tier.players, {
        unit: SPREAD_UNIT,
        label: (rank) => (board === "flex" ? String(rank) : `QB${rank}`),
      });
      for (const player of tier.players) byPlayer.set(player.id, { tier, scale });
    }
    return byPlayer;
  }, [tiers, board]);

  // The board is cut at the startable depth by default, since that is how deep
  // the snapshot module says a start decision reaches, and the rest sits behind
  // an explicit control. The cut runs after the filter, never before it, so a
  // search for a player ranked 300th still finds him. The window is keyed to
  // the filter it was opened under, so any change to scoring, board, search,
  // or position closes it again without an effect.
  const startableDepth =
    board === "flex"
      ? FANTASY_WEEKLY_STARTABLE_DEPTH.flex
      : FANTASY_WEEKLY_STARTABLE_DEPTH.quarterback;
  const windowKey = `${scoring}|${board}|${positionFilter}|${query}`;
  const [windowState, setWindowState] = useState<{
    key: string;
    count: number;
  } | null>(null);
  const countLineRef = useRef<HTMLParagraphElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  // A search or a filter that shortens the board while the page is scrolled deep
  // pulls the page up to the end of the shorter document, which leaves the toolbar
  // above the screen with focus still in it. When the change came from the
  // toolbar, bring the toolbar back to the top of the screen, so the field being
  // typed in stays in view and the list's start sits right under it.
  useLayoutEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar || !toolbar.contains(document.activeElement)) return;
    const top = toolbar.getBoundingClientRect().top;
    if (top < 0) window.scrollTo({ top: window.scrollY + top - TOOLBAR_SCROLL_GAP, behavior: "instant" });
  }, [windowKey]);
  const visibleCount =
    windowState?.key === windowKey ? windowState.count : startableDepth;
  const visiblePlayers = useMemo(
    () => filteredPlayers.slice(0, visibleCount),
    [filteredPlayers, visibleCount],
  );
  const remainingCount = filteredPlayers.length - visiblePlayers.length;
  const filterActive = positionActive || query.length > 0;
  const countLine = describeWindow(
    visiblePlayers.length,
    filteredPlayers.length,
    players.length,
    filterActive,
  );
  const emptyFilterLine =
    board === "flex"
      ? "No players match your search or position filter."
      : "No players match your search.";
  const rankingsCaption = snapshot
    ? `${snapshot.season} week ${snapshot.week} ${board === "flex" ? "flex" : "quarterback"} consensus rankings, ${FANTASY_SCORING_LABELS[scoring]} scoring`
    : "";
  const waiversCaption =
    "Weekly waiver targets ranked by the gap between board percentile and rostered percentage";

  const stalenessPart: FreshnessPart = {
    label: getSnapshotStalenessLabel(staleness),
    tone: staleness === "stale" ? "negative" : undefined,
  };

  function renderSourceHost(boardSource: FantasyWeeklyBoardSource) {
    const host = getFantasyWeeklySourceHost(boardSource);
    return host ? ` at ${host}` : "";
  }

  const rosteredCount = savedTeam.team.players.length;

  return (
    <section className="relative min-h-dvh overflow-x-clip print:min-h-0" aria-label={viewConfig.ariaLabel}>
      <FantasyRouteHeader
        title={
          <>
            Fantasy Football{" "}
            <TitleAccent>{view === "waivers" ? "Waivers" : "Weekly"}</TitleAccent>
          </>
        }
        lead={
          view === "rankings" ? (
            <>
              I use this board to compare weekly rankings, opponents, and rostered
              percentages. Save your team for lineup and add/drop comparisons,
              or browse the{" "}
              <Link href="/fantasy-football/waivers" className="ffb-link">
                waiver targets
              </Link>.
            </>
          ) : (
            <>
              The players the experts rank ahead of where the rostering rate
              puts them, read off the same weekly consensus that feeds the{" "}
              <Link href="/fantasy-football/weekly" className="ffb-link">
                weekly board
              </Link>
              . It refreshes through the season, and it is the list I would
              actually check before a Tuesday night waiver run.
            </>
          )
        }
        freshness={
          snapshot && activeBoard && source ? (
            <FreshnessParts
              parts={[
                { label: `${snapshot.season} Week ${snapshot.week}` },
                ...(view === "waivers"
                  ? [
                      {
                        label: `Flex updated ${formatSourceStamp(activeBoard.flexSource.asOf, isHydrated)}, ${activeBoard.flexSource.expertCount} experts`,
                      },
                      {
                        label: `QB updated ${formatSourceStamp(activeBoard.quarterbackSource.asOf, isHydrated)}, ${activeBoard.quarterbackSource.expertCount} experts`,
                      },
                      stalenessPart,
                    ]
                  : [
                      { label: `Source updated ${formatSourceStamp(source.asOf, isHydrated)}` },
                      stalenessPart,
                      { label: `${source.expertCount} experts` },
                    ]),
              ]}
            />
          ) : null
        }
      />

      <div className={`${SHELL_CLASS} ffb-stack ffb-stack-tight`}>
        {/* One toolbar for the page. Scoring applies to the board and to My
            team, and it stays up whenever a snapshot is readable, so a reader
            who picks a format the seed lacks and then loses the fetch can
            still go back. The rest needs a board. */}
        {snapshot ? (
          <div ref={toolbarRef} className="ffb-toolbar ffb-wk-toolbar">
            {activeBoard && view === "rankings" ? (
              <>
                <div className="ffb-seg ffb-seg-pos" role="group" aria-label="Board">
                  {(
                    [
                      ["flex", "Flex (RB, WR, TE)", "Flex", "ffb-pos-flex"],
                      ["quarterbacks", "Quarterback", "QB", "ffb-pos-qb"],
                    ] as const
                  ).map(([value, label, shortLabel, tone]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={board === value}
                      aria-label={label}
                      onClick={() => updateRouteState({ board: value })}
                      className={`ffb-seg-btn ${tone}`}
                    >
                      <span className="md:hidden">{shortLabel}</span>
                      <span className="max-md:hidden">{label}</span>
                    </button>
                  ))}
                </div>
                {/* The quarterback board is one position already, so the
                    position cut only renders for flex. */}
                {board === "flex" ? (
                  <PositionFilterBar
                    options={POSITION_OPTIONS}
                    value={positionFilter}
                    onChange={setPositionFilter}
                    ariaLabel="Position"
                  />
                ) : null}
              </>
            ) : null}
            <div className="ffb-seg ffb-wk-scoring" role="group" aria-label="Scoring">
              {(Object.keys(FANTASY_SCORING_LABELS) as FantasyRouteScoring[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={scoring === option}
                  aria-label={FANTASY_SCORING_LABELS[option]}
                  onClick={() => updateRouteState({ scoring: option })}
                  className="ffb-seg-btn"
                >
                  <span className="md:hidden">{SCORING_SHORT_LABELS[option]}</span>
                  <span className="max-md:hidden">{FANTASY_SCORING_LABELS[option]}</span>
                </button>
              ))}
            </div>
            {activeBoard && view === "rankings" ? (
              <label className="ffb-search" htmlFor="weekly-board-search">
                <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
                  <circle cx="8.5" cy="8.5" r="5.5" />
                  <path d="M12.8 12.8L17 17" />
                </svg>
                <span className="ffb-vh">Search</span>
                <input
                  id="weekly-board-search"
                  className="ffb-search-input"
                  value={searchQuery}
                  maxLength={80}
                  autoComplete="off"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search player or team"
                />
              </label>
            ) : null}
            {/* The last row of the toolbar on a phone: the way to My team and the
                count. From 768px the wrapper has no box and both sit in the toolbar. */}
            {activeBoard ? (
              <div className="ffb-wk-toolbar-end">
                {/* Below 1200px My team sits under the board, so this is the way
                    to it. From 1200px it is in the rail and the link is not needed. */}
                <a href="#my-team" className="ffb-btn min-[1200px]:hidden">
                  My team, {rosteredCount} {rosteredCount === 1 ? "player" : "players"}
                </a>
                {/* The count is the page's live region. It stays mounted across
                    every filter change so a search that lands on one row is
                    announced rather than only seen. It is also where focus lands
                    after Show all, since that button unmounts itself and would
                    otherwise drop a keyboard user to the top of the document. */}
                {view === "rankings" && players.length > 0 ? (
                  <p ref={countLineRef} role="status" tabIndex={-1} className="ffb-count">
                    {filteredPlayers.length === 0 ? emptyFilterLine : countLine}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {isLoading || boardPending ? (
          <p role="status" className="ffb-wk-loading">
            Loading the weekly board.
          </p>
        ) : null}
        {(isLoading || boardPending) && !activeBoard ? (
          <div aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={`weekly-loading-${index}`} className="ffb-skel-row">
                <span className="ffb-skel" />
                <span className="ffb-skel" />
                <span className="ffb-skel" />
                <span className="ffb-skel" />
                <span className="ffb-skel" />
              </div>
            ))}
          </div>
        ) : null}

        {notPublished ? (
          <div role="note" className="ffb-notice ffb-notice-warn">
            <p>
              <strong>The weekly board opens with Week 1.</strong>{" "}
              It is deliberately empty until then. Rostered percentages before
              leagues have drafted describe the preseason rather than a waiver
              wire, and publishing them now would make the add list say
              something I cannot support. Until kickoff, the{" "}
              <Link href="/fantasy-football">draft rankings</Link>{" "}
              are the board that means anything.
            </p>
          </div>
        ) : null}

        {error && !activeBoard ? (
          <div role="alert" className="ffb-notice ffb-notice-bad">
            <p>{error}</p>
            <div className="ffb-notice-actions">
              <button type="button" onClick={retry} className="ffb-btn">
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {snapshot && activeBoard ? (
          // The board beside My team. To put My team back above the board,
          // render <MyTeamPanel> before this div and drop the `ffb-work` and
          // rail wrappers. Its views fall to two columns by themselves once
          // they are out of `ffb-wk-rail`.
          <div className="ffb-work">
            {view === "waivers" ? (
              <section aria-labelledby="weekly-waivers" className="ffb-wk-main ffb-wk-main-waivers">
                <div className="ffb-sechead ffb-sechead-lg">
                  <FantasySectionHeading id="weekly-waivers">
                    This week&rsquo;s list
                  </FantasySectionHeading>
                  {/* The count is the page's live region, so a scoring tap
                      that takes the list from 19 rows to 17 is heard as
                      well as seen. */}
                  {waivers.length > 0 ? (
                    <p role="status" className="ffb-sechead-note">
                      {waivers.length}{" "}
                      {waivers.length === 1 ? "player clears" : "players clear"}{" "}
                      the gap in {FANTASY_SCORING_LABELS[scoring]} scoring
                    </p>
                  ) : null}
                </div>
                <p className="ffb-method">
                  Players the experts rank ahead of where the rostering rate
                  puts them. The gap is the player&rsquo;s percentile on this board minus
                  the percentage of leagues rostering him, so both numbers are
                  printed beside it and any row can be checked by hand.
                </p>
                {waivers.length === 0 ? (
                  <div className="ffb-empty">
                    <p role="status" className="ffb-empty-body">
                      No player clears the gap this week, which happens when the
                      widely rostered players are also the ones the experts like.
                    </p>
                  </div>
                ) : tableLayout ? (
                  <div
                    className="ffb-table-wrap"
                    tabIndex={0}
                    role="region"
                    aria-label="Waiver targets table"
                  >
                    <table className="ffb-table ffb-wk-table ffb-wk-table-waivers">
                      <caption className="sr-only">{waiversCaption}</caption>
                      <thead>
                        <tr>
                          <th scope="col">Player</th>
                          <th scope="col" className="ffb-num ffb-wk-h-gap">Gap</th>
                          <th scope="col" className="ffb-num ffb-wk-h-short">Board</th>
                          <th scope="col" className="ffb-num ffb-wk-h-short">Rank</th>
                          <th scope="col" className="ffb-num ffb-wk-h-pct">Percentile</th>
                          <th scope="col" className="ffb-num ffb-wk-h-own">Rostered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {waivers.map((candidate) => (
                          <tr key={`${candidate.board}-${candidate.player.id}`}>
                            <th scope="row">
                              <PlayerCell player={candidate.player} withOpponent />
                            </th>
                            <td className="ffb-num ffb-c-num ffb-is-strong">{candidate.gap.toFixed(1)}</td>
                            <td className="ffb-num ffb-c-num ffb-is-flat">
                              {candidate.board === "flex" ? "Flex" : "QB"}
                            </td>
                            <td className="ffb-num">{candidate.player.rank}</td>
                            <td className="ffb-num ffb-c-num ffb-is-flat">
                              {candidate.rankPercentile.toFixed(1)}
                            </td>
                            <td className="ffb-num ffb-c-num ffb-is-flat">
                              {formatOwnership(candidate.ownership)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <>
                  <div className="ffb-colhead ffb-sticky ffb-listhead ffb-listhead-plain" aria-hidden="true">
                    <span>Gap</span>
                    <span>Board</span>
                    <span>Rank</span>
                    <span>Percentile</span>
                    <span>Rostered</span>
                  </div>
                  <ol role="list" aria-label={waiversCaption} className="ffb-rows">
                    {waivers.map((candidate) => (
                      <li
                        key={`${candidate.board}-${candidate.player.id}`}
                        className="ffb-row ffb-row-stack ffb-row-stack-plain"
                      >
                        <div>
                          <PlayerCell player={candidate.player} withOpponent />
                          <dl className="ffb-pairs ffb-pairs-cols">
                            <ReadoutPair label="Gap" value={candidate.gap.toFixed(1)} emphasis />
                            <ReadoutPair
                              label="Board"
                              value={candidate.board === "flex" ? "Flex" : "QB"}
                            />
                            <ReadoutPair label="Rank" value={String(candidate.player.rank)} />
                            <ReadoutPair
                              label="Percentile"
                              value={candidate.rankPercentile.toFixed(1)}
                            />
                            <ReadoutPair
                              label="Rostered"
                              value={formatOwnership(candidate.ownership)}
                            />
                          </dl>
                        </div>
                      </li>
                    ))}
                  </ol>
                  </>
                )}
                <p className="ffb-method ffb-wk-foot-note">
                  The percentile is measured against the whole published
                  board rather than the startable part of it, so it is the count
                  of players at or below him divided by all{" "}
                  {activeBoard.flex.length} on the flex board, or all{" "}
                  {activeBoard.quarterbacks.length} on the quarterback board,
                  which is why the same percentile means something different in
                  each of the two rank spaces. A candidate has to be inside the
                  top {FANTASY_WEEKLY_STARTABLE_DEPTH.flex} flex or top{" "}
                  {FANTASY_WEEKLY_STARTABLE_DEPTH.quarterback} quarterbacks to
                  count as startable, rostered in under{" "}
                  {FANTASY_WEEKLY_WIDELY_ROSTERED_PERCENT}% of leagues to count
                  as available, and clear a gap of at least{" "}
                  {FANTASY_WEEKLY_MIN_WAIVER_GAP} to be listed at all. There is
                  no bid figure here, because the source carries none and I am
                  not inventing one.
                </p>
                <p className="ffb-method ffb-wk-foot-note">
                  {activeBoard.flexSource.playerCount} players on the{" "}
                  {describeFantasyWeeklySource(activeBoard.flexSource, "flex")}{" "}
                  and {activeBoard.quarterbackSource.playerCount} on the{" "}
                  {describeFantasyWeeklySource(
                    activeBoard.quarterbackSource,
                    "quarterback",
                  )}
                  {renderSourceHost(activeBoard.flexSource)}.{" "}
                  <SourceLink
                    href={activeBoard.flexSource.url}
                    label="Flex source board"
                  />{" "}
                  <span aria-hidden="true">·</span>{" "}
                  <SourceLink
                    href={activeBoard.quarterbackSource.url}
                    label="Quarterback source board"
                  />
                </p>
              </section>
            ) : (
              <section aria-labelledby="weekly-board" className="ffb-wk-main">
                <div className="ffb-sechead ffb-sechead-lg">
                  <FantasySectionHeading id="weekly-board">
                    {board === "flex" ? "Flex rankings" : "Quarterback rankings"}
                  </FantasySectionHeading>
                </div>
                <p className="ffb-method">
                  Consensus rank within this board only. A flex rank and a
                  quarterback rank are not comparable, because FantasyPros
                  publishes no single in-season overall board and I would rather
                  keep them apart than manufacture an ordering the source never
                  made. The tiers are my grouping, since FantasyPros publishes
                  none for a weekly board. A new tier starts where the expert
                  average jumps furthest for how much the experts disagree, and
                  no tier runs past ten players.
                </p>
                {players.length === 0 ? (
                  <div className="ffb-empty">
                    <p className="ffb-empty-body">
                      This board published with no rows, which usually means the
                      source page came back empty. Check back after the next
                      refresh, or use the other board until then.
                    </p>
                  </div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="ffb-empty">
                    <p className="ffb-empty-title">No players match on this board.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setPositionFilter("ALL");
                      }}
                      className="ffb-btn"
                    >
                      Show all players
                    </button>
                  </div>
                ) : (
                  <div role="region" aria-label={rankingsCaption} className="ffb-board ffb-board-ruled ffb-board-plain ffb-wk-board">
                    {/* The column heads pin as the table head did, so the numbers keep their names mid-scroll. */}
                    <div className="ffb-sticky ffb-sticky-ruled">
                      <div className="ffb-colhead" aria-hidden="true">
                        <span className="ffb-h-num ffb-m-show ffb-is-sorted">#</span>
                        <span className="ffb-h-pos">Pos</span>
                        <span className="ffb-m-show">Player</span>
                        <span>Team</span>
                        <span>Opponent</span>
                        <span className="ffb-h-num">Rostered</span>
                        <span className="ffb-h-spread">
                          <span className="ffb-h-spread-label">
                            <span>Expert spread</span>
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
                        </span>
                        <span className="ffb-h-num">Avg</span>
                        <span className="ffb-m-show ffb-only-phone">Avg · Rostered</span>
                      </div>
                    </div>
                    {groupVisibleRows(visiblePlayers, tierByPlayer).map(({ tier, scale, rows }, index) => (
                      <TierSection
                        key={`tier-${tier.tier}-${tier.players[0].id}`}
                        tier={tier.tier}
                        count={tier.players.length}
                        firstRank={String(tier.players[0].rank)}
                        lastRank={String(tier.players[tier.players.length - 1].rank)}
                        cliff={tier.cliff}
                        first={index === 0}
                        leadClassName="ffb-wk-tier-lead"
                        scaleLabels={<SpreadScaleLabels scale={scale} className="ffb-label ffb-muted ffb-wk-scale" />}
                      >
                        {rows.map((player) => (
                          <li key={player.id} className="ffb-row">
                            <span className="ffb-c-rank">
                              <span className="ffb-vh">Rank </span>
                              {player.rank}
                            </span>
                            <span className={`ffb-chip ${positionClass(player.position)}`.trimEnd()}>
                              {player.position}
                              {player.positionRank ?? ""}
                            </span>
                            <span className="ffb-c-name" title={player.name}>
                              {player.name}
                            </span>
                            <span className="ffb-c-team">{player.team}</span>
                            <span className="ffb-c-num ffb-m-meta ffb-wk-c-opp">
                              <span className="ffb-vh">Opponent </span>
                              {player.opponent ?? "—"}
                            </span>
                            <span className="ffb-c-num ffb-is-flat ffb-m-sub">
                              <span className="ffb-vh">Rostered </span>
                              {formatOwnership(player.ownership)}
                            </span>
                            <ExpertSpread player={player} avg={player.rankAverage ?? null} scale={scale} />
                            <span className="ffb-c-num ffb-m-top">
                              <span className="ffb-vh">Expert average </span>
                              {formatAverage(player)}
                            </span>
                          </li>
                        ))}
                      </TierSection>
                    ))}
                  </div>
                )}
                {remainingCount > 0 ? (
                  <div className="ffb-more-row">
                    <button
                      type="button"
                      onClick={() =>
                        setWindowState({
                          key: windowKey,
                          count: Math.min(
                            visibleCount + FANTASY_RANKINGS_PAGE_SIZE,
                            filteredPlayers.length,
                          ),
                        })
                      }
                      className="ffb-more"
                    >
                      Load more ({remainingCount} left)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Show all removes both buttons, so the render has
                        // to land before focus moves or the count line is
                        // still describing the old window.
                        flushSync(() =>
                          setWindowState({
                            key: windowKey,
                            count: filteredPlayers.length,
                          }),
                        );
                        countLineRef.current?.focus();
                      }}
                      className="ffb-btn ffb-btn-lg"
                    >
                      Show all {filteredPlayers.length}
                    </button>
                  </div>
                ) : null}
                {source ? (
                  <p className="ffb-method ffb-wk-foot-note">
                    {source.playerCount} players on the{" "}
                    {describeFantasyWeeklySource(
                      source,
                      board === "flex" ? "flex" : "quarterback",
                    )}
                    {renderSourceHost(source)}, {source.expertCount}{" "}
                    contributing experts.{" "}
                    <SourceLink href={source.url} label="Source board" />
                  </p>
                ) : null}
              </section>
            )}
            <div className="ffb-rail ffb-rail-scroll ffb-wk-rail">
              <MyTeamPanel snapshot={snapshot} board={activeBoard} scoring={scoring} onScoringChange={value => updateRouteState({ scoring: value })} lead={view === "waivers" ? "waivers" : "lineup"} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
