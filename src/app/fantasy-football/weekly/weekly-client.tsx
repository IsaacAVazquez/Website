"use client";

import { useIsClient } from "@/hooks/useIsClient";
import Link from "next/link";
import { MyTeamPanel } from "@/components/fantasy/MyTeamPanel";
import { useFantasyMyTeam } from "@/hooks/useFantasyMyTeam";
import { useRouter, useSearchParams } from "next/navigation";
import {
  startTransition,
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

function formatSpread(player: FantasyWeeklyPlayer): string {
  if (player.minRank === undefined || player.maxRank === undefined) return "—";
  return `${player.minRank} to ${player.maxRank}`;
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
 * there the matchup follows the team.
 */
function PlayerCell({
  player,
  withOpponent = false,
}: {
  player: FantasyWeeklyPlayer;
  withOpponent?: boolean;
}) {
  return (
    <span className="ffb-wk-player">
      <span className={`ffb-chip ffb-pos-${player.position.toLowerCase()}`}>
        {player.position}
        {player.positionRank ?? ""}
      </span>
      <span className="ffb-wk-name">{player.name}</span>
      <span className="ffb-c-team">{player.team}</span>
      {withOpponent && player.opponent ? (
        <span className="ffb-wk-opp">{player.opponent}</span>
      ) : null}
    </span>
  );
}

/**
 * One value of a stacked row. The list's head names the column on screen, so
 * the label here is for assistive tech and is visually hidden.
 */
function ReadoutPair({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <dt className="ffb-vh">{label}</dt>
      <dd className={emphasis ? "ffb-wk-strong" : undefined}>{value}</dd>
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
  const filteredPlayers = useMemo(
    () =>
      players.filter((player) => {
        if (positionActive && player.position !== positionFilter) {
          return false;
        }
        if (!query) return true;
        return `${player.name} ${player.team}`.toLowerCase().includes(query);
      }),
    [players, positionActive, positionFilter, query],
  );

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
    <section className="relative overflow-x-clip" aria-label={viewConfig.ariaLabel}>
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
          <div className="ffb-toolbar ffb-wk-toolbar">
            {activeBoard && view === "rankings" ? (
              <>
                <div className="ffb-seg ffb-seg-pos" role="group" aria-label="Board">
                  {(
                    [
                      ["flex", "Flex (RB, WR, TE)", "ffb-pos-flex"],
                      ["quarterbacks", "Quarterback", "ffb-pos-qb"],
                    ] as const
                  ).map(([value, label, tone]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={board === value}
                      onClick={() => updateRouteState({ board: value })}
                      className={`ffb-seg-btn ${tone}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {/* The quarterback board is one position already, so the
                    position cut only renders for flex. */}
                {board === "flex" ? (
                  <div className="ffb-seg ffb-seg-pos" role="group" aria-label="Position">
                    {(["ALL", "RB", "WR", "TE"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={positionFilter === option}
                        onClick={() => setPositionFilter(option)}
                        className={`ffb-seg-btn${option === "ALL" ? "" : ` ffb-pos-${option.toLowerCase()}`}`}
                      >
                        {option === "ALL" ? "All" : option}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
            <div className="ffb-seg" role="group" aria-label="Scoring">
              {(Object.keys(FANTASY_SCORING_LABELS) as FantasyRouteScoring[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={scoring === option}
                  onClick={() => updateRouteState({ scoring: option })}
                  className="ffb-seg-btn"
                >
                  {FANTASY_SCORING_LABELS[option]}
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
            {/* Below 1200px My team sits under the board, so this is the way
                to it. From 1200px it is in the rail and the link is not needed. */}
            {activeBoard ? (
              <a href="#my-team" className="ffb-btn min-[1200px]:hidden">
                My team, {rosteredCount} {rosteredCount === 1 ? "player" : "players"}
              </a>
            ) : null}
            {/* The count is the page's live region. It stays mounted across
                every filter change so a search that lands on one row is
                announced rather than only seen. It is also where focus lands
                after Show all, since that button unmounts itself and would
                otherwise drop a keyboard user to the top of the document. */}
            {activeBoard && view === "rankings" && players.length > 0 ? (
              <p ref={countLineRef} role="status" tabIndex={-1} className="ffb-count">
                {filteredPlayers.length === 0 ? emptyFilterLine : countLine}
              </p>
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
              <section aria-labelledby="weekly-waivers" className="ffb-wk-main">
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
                  The gap is the player&rsquo;s percentile on this board minus
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
                    <table className="ffb-table ffb-wk-table">
                      <caption className="sr-only">{waiversCaption}</caption>
                      <thead>
                        <tr>
                          <th scope="col">Player</th>
                          <th scope="col" className="ffb-num ffb-wk-h-num">Gap</th>
                          <th scope="col" className="ffb-num ffb-wk-h-num">Board</th>
                          <th scope="col" className="ffb-num ffb-wk-h-num">Rank</th>
                          <th scope="col" className="ffb-num ffb-wk-h-num-wide">Percentile</th>
                          <th scope="col" className="ffb-num ffb-wk-h-num-wide">Rostered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {waivers.map((candidate) => (
                          <tr key={`${candidate.board}-${candidate.player.id}`}>
                            <th scope="row">
                              <PlayerCell player={candidate.player} withOpponent />
                            </th>
                            <td className="ffb-num ffb-wk-strong">{candidate.gap.toFixed(1)}</td>
                            <td className="ffb-num ffb-wk-flat">
                              {candidate.board === "flex" ? "Flex" : "QB"}
                            </td>
                            <td className="ffb-num">{candidate.player.rank}</td>
                            <td className="ffb-num ffb-wk-flat">
                              {candidate.rankPercentile.toFixed(1)}
                            </td>
                            <td className="ffb-num ffb-wk-flat">
                              {formatOwnership(candidate.ownership)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <>
                  <div className="ffb-colhead ffb-sticky ffb-wk-listhead ffb-wk-listhead-5" aria-hidden="true">
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
                        className="ffb-row ffb-wk-row ffb-wk-row-plain"
                      >
                        <div>
                          <PlayerCell player={candidate.player} withOpponent />
                          <dl className="ffb-pairs ffb-wk-readout ffb-wk-readout-5">
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
                  made.
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
                    <p className="ffb-empty-title">No players match</p>
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
                ) : tableLayout ? (
                  // The table sits in page flow rather than a scroll box of
                  // its own. It fits from md up, so nothing needs to scroll
                  // sideways, and page-level sticky keeps the column labels
                  // on screen for as long as the board runs.
                  <table className="ffb-table ffb-table-sticky ffb-wk-table">
                    <caption className="sr-only">{rankingsCaption}</caption>
                    <thead>
                      <tr>
                        <th scope="col" className="ffb-num ffb-wk-h-rank">#</th>
                        <th scope="col">Player</th>
                        <th scope="col" className="ffb-wk-h-opp">Opponent</th>
                        <th scope="col" className="ffb-wk-h-range">Expert range</th>
                        <th scope="col" className="ffb-num ffb-wk-h-num-wide">Rostered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePlayers.map((player) => (
                        <tr key={player.id}>
                          <td className="ffb-num ffb-wk-rank">{player.rank}</td>
                          <th scope="row">
                            <PlayerCell player={player} />
                          </th>
                          <td>{player.opponent ?? "—"}</td>
                          <td>{formatSpread(player)}</td>
                          <td className="ffb-num">{formatOwnership(player.ownership)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <>
                  <div className="ffb-colhead ffb-sticky ffb-wk-listhead" aria-hidden="true">
                    <span className="ffb-h-num">#</span>
                    <span>Opponent</span>
                    <span>Expert range</span>
                    <span>Rostered</span>
                  </div>
                  <ol role="list" aria-label={rankingsCaption} className="ffb-rows">
                    {visiblePlayers.map((player) => (
                      <li key={player.id} className="ffb-row ffb-wk-row">
                        <span className="ffb-c-rank">
                          <span className="sr-only">Rank </span>
                          {player.rank}
                        </span>
                        <div>
                          <PlayerCell player={player} />
                          <dl className="ffb-pairs ffb-wk-readout">
                            <ReadoutPair label="Opponent" value={player.opponent ?? "—"} />
                            <ReadoutPair label="Expert range" value={formatSpread(player)} />
                            <ReadoutPair
                              label="Rostered"
                              value={formatOwnership(player.ownership)}
                            />
                          </dl>
                        </div>
                      </li>
                    ))}
                  </ol>
                  </>
                )}
                {remainingCount > 0 ? (
                  <div className="ffb-wk-more">
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
