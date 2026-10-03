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
import { PROJECT_PRESS } from "@/constants/projectPress";
import { formatStableDateTime } from "@/lib/date-formatters";

export type WeeklyView = "rankings" | "waivers";

/** The two in-season pages share one snapshot and one client; this is what differs. */
const VIEWS = {
  rankings: {
    path: "/fantasy-football/weekly",
    ariaLabel: "Fantasy football weekly board",
    sibling: { href: "/fantasy-football/waivers", label: "Waiver targets" },
  },
  waivers: {
    path: "/fantasy-football/waivers",
    ariaLabel: "Fantasy football waiver targets",
    sibling: { href: "/fantasy-football/weekly", label: "Weekly board" },
  },
} as const;

const TOGGLE_CLASS =
  "inline-flex min-h-touch items-center border px-[var(--c97-sp-1)] text-sm font-semibold transition-[border-color,background-color]";

const GROUP_LEGEND_CLASS =
  "font-mono text-3xs uppercase tracking-[0.12em] text-[var(--c97-ink-2)]";

const STATUS_CLASS =
  "mt-[var(--c97-sp-2)] font-mono text-2xs uppercase tracking-[0.1em] text-[var(--c97-ink-2)]";

/**
 * The header cell of a long table, pinned to the top of the viewport while the
 * page scrolls. The Catalog 97 header is `position: relative` and scrolls
 * away, so the row sits at 0. The 73px offset it once carried cleared the
 * deleted Working Instrument sticky header and left a gap after the shell
 * change on 2026-09-16.
 */
const STICKY_HEADER_CLASS = "sticky z-10";
const STICKY_HEADER_STYLE = {
  top: 0,
  background: "var(--c97-field)",
  boxShadow: "inset 0 -1px 0 var(--c97-rule)",
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
 * with one thumb. So the phone gets a stacked list, name over a labeled
 * readout, and the table only renders where it fits. One layout is in the
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
    <a
      href={href}
      className="underline decoration-[var(--c97-rule)] underline-offset-4"
      rel="noreferrer noopener"
      target="_blank"
    >
      {label}
      <span className="sr-only">, opens in a new tab</span>
    </a>
  );
}

function ReadoutPair({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-baseline" style={{ gap: "var(--c97-sp-0)" }}>
      <dt className="text-3xs uppercase tracking-[0.1em] text-[var(--c97-ink-2)]">
        {label}
      </dt>
      <dd
        className={`tabular-nums ${
          emphasis
            ? "font-semibold text-[var(--c97-ink)]"
            : "text-[var(--c97-ink)]"
        }`}
      >
        {value}
      </dd>
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

  function renderSourceHost(boardSource: FantasyWeeklyBoardSource) {
    const host = getFantasyWeeklySourceHost(boardSource);
    return host ? ` at ${host}` : "";
  }

  return (
    <section
      className="c97-dash relative overflow-x-clip min-h-dvh"
      aria-label={viewConfig.ariaLabel}
    >
      <section
        className="c97-sheet"
        data-c97-surface={`ink-${PROJECT_PRESS[viewConfig.path].lead}`}
      >
        <div className={SHELL_CLASS} style={{ paddingBlock: "var(--c97-sp-5)" }}>
          <h1 className="c97-poster">
            Fantasy Football{" "}
            {view === "waivers" ? "Waivers" : "Weekly"}
          </h1>
          {view === "rankings" ? (
            <p className="c97-lead" style={{ marginTop: "var(--c97-sp-3)", maxInlineSize: "62ch" }}>
              I use this board to compare weekly rankings, opponents, and rostered
              percentages. Save your team below for lineup and add/drop comparisons,
              or browse the{" "}
              <Link
                href="/fantasy-football/waivers"
                className="underline decoration-[var(--c97-accent)] underline-offset-4"
              >
                waiver targets
              </Link>.
            </p>
          ) : (
            <p className="c97-lead" style={{ marginTop: "var(--c97-sp-3)", maxInlineSize: "62ch" }}>
              The players the experts rank ahead of where the rostering rate
              puts them, read off the same weekly consensus that feeds the{" "}
              <Link
                href="/fantasy-football/weekly"
                className="underline decoration-[var(--c97-accent)] underline-offset-4"
              >
                weekly board
              </Link>
              . It refreshes through the season, and it is the list I would
              actually check before a Tuesday night waiver run.
            </p>
          )}
          {snapshot && activeBoard && source ? (
            <div
              data-c97-surface="paper"
              className="c97-offset inline-block"
              style={{ marginTop: "var(--c97-sp-4)", padding: "var(--c97-sp-3)" }}
            >
              <p className="c97-meta" style={{ display: "block", lineHeight: 1.8 }}>
                <span>
                  {snapshot.season} Week {snapshot.week}
                </span>
                <span aria-hidden="true"> · </span>
                {view === "waivers" ? (
                  <>
                    <span>
                      Flex updated {formatSourceStamp(activeBoard.flexSource.asOf, isHydrated)},{" "}
                      {activeBoard.flexSource.expertCount} experts
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span>
                      QB updated{" "}
                      {formatSourceStamp(activeBoard.quarterbackSource.asOf, isHydrated)},{" "}
                      {activeBoard.quarterbackSource.expertCount} experts
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span
                      style={{
                        color:
                          staleness === "stale"
                            ? "var(--c97-negative)"
                            : undefined,
                      }}
                    >
                      {getSnapshotStalenessLabel(staleness)}
                    </span>
                  </>
                ) : (
                  <>
                    <span>Source updated {formatSourceStamp(source.asOf, isHydrated)}</span>
                    <span aria-hidden="true"> · </span>
                    <span
                      style={{
                        color:
                          staleness === "stale"
                            ? "var(--c97-negative)"
                            : undefined,
                      }}
                    >
                      {getSnapshotStalenessLabel(staleness)}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span>{source.expertCount} experts</span>
                  </>
                )}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="c97-sheet" data-c97-surface="paper" data-seam="torn">
      <div className={`${SHELL_CLASS} flex flex-col`} style={{ paddingBlock: "var(--c97-sp-5)", gap: "var(--c97-sp-2)" }}>
        {isLoading || boardPending ? (
          <p role="status" className="text-sm text-[var(--c97-ink-2)]">
            Loading the weekly board.
          </p>
        ) : null}
        {(isLoading || boardPending) && !activeBoard ? (
          <div className="grid" style={{ gap: "var(--c97-sp-1)" }} aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={`weekly-loading-${index}`} className="c97-skeleton" style={{ height: 44 }} />
            ))}
          </div>
        ) : null}

        {notPublished ? (
          <div
            role="note"
            className="border text-sm"
            style={{
              paddingInline: "var(--c97-sp-2)",
              paddingBlock: "var(--c97-sp-1)",
              borderColor:
                "color-mix(in srgb, var(--c97-warning) 45%, var(--c97-rule))",
              background:
                "color-mix(in srgb, var(--c97-warning) 8%, var(--c97-surface))",
            }}
          >
            <p className="text-[var(--c97-ink-2)]">
              <span className="font-semibold text-[var(--c97-ink)]">
                The weekly board opens with Week 1.
              </span>{" "}
              It is deliberately empty until then. Rostered percentages before
              leagues have drafted describe the preseason rather than a waiver
              wire, and publishing them now would make the add list say
              something I cannot support. Until kickoff, the{" "}
              <Link
                href="/fantasy-football"
                className="underline decoration-[var(--c97-accent)] underline-offset-4"
              >
                draft rankings
              </Link>{" "}
              are the board that means anything.
            </p>
          </div>
        ) : null}

        {error && !activeBoard ? (
          <div
            role="alert"
            className="border border-[var(--c97-negative)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-2)" }}
          >
            <p className="text-sm text-[var(--c97-ink)]">{error}</p>
            <button
              type="button"
              onClick={retry}
              className={`${TOGGLE_CLASS} border-[var(--c97-rule)] bg-[var(--c97-field)] text-[var(--c97-ink)] hover:border-[var(--c97-accent)]`} style={{ marginTop: "var(--c97-sp-1)" }}
            >
              Try again
            </button>
          </div>
        ) : null}

        {snapshot && activeBoard ? (
          <>
            {/* Scoring applies to the team workspace and the reference board. */}
            <div className="flex flex-wrap" style={{ columnGap: "var(--c97-sp-3)", rowGap: "var(--c97-sp-2)" }}>
              <fieldset>
                <legend className={GROUP_LEGEND_CLASS}>Scoring</legend>
                <div className="flex flex-wrap items-center" style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
                  {(
                    Object.keys(FANTASY_SCORING_LABELS) as FantasyRouteScoring[]
                  ).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={scoring === option}
                      onClick={() => updateRouteState({ scoring: option })}
                      className={`${TOGGLE_CLASS} ${
                        scoring === option
                          ? "border-[var(--c97-ink)] bg-[var(--c97-ink)] text-[var(--c97-surface)]"
                          : "border-[var(--c97-rule)] bg-[var(--c97-surface)] text-[var(--c97-ink-2)] hover:border-[var(--c97-ink-2)] hover:text-[var(--c97-ink)]"
                      }`}
                    >
                      {FANTASY_SCORING_LABELS[option]}
                    </button>
                  ))}
                </div>
              </fieldset>
              <a href={view === "waivers" ? "#weekly-waivers" : "#weekly-board"}
                className="inline-flex min-h-touch items-center self-end text-sm underline decoration-[var(--c97-accent)] underline-offset-4">
                {view === "waivers" ? "Jump to waiver targets" : "Jump to rankings"}
              </a>
            </div>

            <MyTeamPanel snapshot={snapshot} board={activeBoard} scoring={scoring} onScoringChange={value => updateRouteState({ scoring: value })} />

            {view === "waivers" ? (
              <section
                aria-labelledby="weekly-waivers"
                className="border-t border-[var(--c97-ink)]" style={{ paddingTop: "var(--c97-sp-2)" }}
              >
                <h2
                  id="weekly-waivers"
                  className="c97-poster-sm"
                >
                  This week&rsquo;s list
                </h2>
                <p className="max-w-[68ch] text-sm leading-6 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
                  Players the experts rank ahead of where the rostering rate
                  puts them. The gap is the player&rsquo;s percentile on this
                  board minus the percentage of leagues rostering him, so both
                  numbers are printed beside it and any row can be checked by
                  hand. The percentile is measured against the whole published
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
                {waivers.length === 0 ? (
                  <p
                    role="status"
                    className="text-sm text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-2)" }}
                  >
                    No player clears the gap this week, which happens when the
                    widely rostered players are also the ones the experts like.
                  </p>
                ) : (
                  <>
                    {/* The count is the page's live region, so a scoring tap
                        that takes the list from 19 rows to 17 is heard as
                        well as seen. */}
                    <p role="status" className={STATUS_CLASS}>
                      {waivers.length}{" "}
                      {waivers.length === 1 ? "player clears" : "players clear"}{" "}
                      the gap in {FANTASY_SCORING_LABELS[scoring]} scoring
                    </p>
                    {tableLayout ? (
                      <div
                        className="overflow-x-auto" style={{ marginTop: "var(--c97-sp-1)" }}
                        tabIndex={0}
                        role="region"
                        aria-label="Waiver targets table"
                      >
                        <table className="w-full border-collapse text-sm">
                          <caption className="sr-only">{waiversCaption}</caption>
                          <thead>
                            <tr className="border-b border-[var(--c97-rule)] text-left font-mono text-3xs uppercase tracking-[0.12em] text-[var(--c97-ink-2)]">
                              <th scope="col" style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)" }}>
                                Player
                              </th>
                              <th scope="col" className="text-right" style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)" }}>
                                Gap
                              </th>
                              <th scope="col" style={{ paddingBlock: "var(--c97-sp-1)", paddingLeft: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)" }}>
                                Board
                              </th>
                              <th scope="col" className="text-right" style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)" }}>
                                Rank
                              </th>
                              <th scope="col" className="text-right" style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)" }}>
                                Percentile
                              </th>
                              <th scope="col" className="text-right" style={{ paddingBlock: "var(--c97-sp-1)" }}>
                                Rostered
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {waivers.map((candidate) => (
                              <tr
                                key={`${candidate.board}-${candidate.player.id}`}
                                className="border-b border-[var(--c97-rule)]"
                              >
                                <th
                                  scope="row"
                                  className="text-left font-normal" style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)" }}
                                >
                                  <span className="font-semibold text-[var(--c97-ink)]">
                                    {candidate.player.name}
                                  </span>{" "}
                                  <span className="text-[var(--c97-ink-2)]">
                                    {candidate.player.position}{" "}
                                    {candidate.player.team}
                                    {candidate.player.opponent
                                      ? ` ${candidate.player.opponent}`
                                      : ""}
                                  </span>
                                </th>
                                <td className="text-right font-mono tabular-nums font-semibold text-[var(--c97-ink)]" style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)" }}>
                                  {candidate.gap.toFixed(1)}
                                </td>
                                <td className="text-[var(--c97-ink-2)]" style={{ paddingBlock: "var(--c97-sp-1)", paddingLeft: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)" }}>
                                  {candidate.board === "flex" ? "Flex" : "QB"}
                                </td>
                                <td className="text-right font-mono tabular-nums text-[var(--c97-ink)]" style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)" }}>
                                  {candidate.player.rank}
                                </td>
                                <td className="text-right font-mono tabular-nums text-[var(--c97-ink-2)]" style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)" }}>
                                  {candidate.rankPercentile.toFixed(1)}
                                </td>
                                <td className="text-right font-mono tabular-nums text-[var(--c97-ink-2)]" style={{ paddingBlock: "var(--c97-sp-1)" }}>
                                  {formatOwnership(candidate.ownership)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <ol
                        role="list"
                        aria-label={waiversCaption}
                        className="list-none border-t border-[var(--c97-rule)] p-0" style={{ marginTop: "var(--c97-sp-1)" }}
                      >
                        {waivers.map((candidate) => (
                          <li
                            key={`${candidate.board}-${candidate.player.id}`}
                            className="border-b border-[var(--c97-rule)]" style={{ paddingBlock: "var(--c97-sp-1)" }}
                          >
                            <p className="text-sm">
                              <span className="font-semibold text-[var(--c97-ink)]">
                                {candidate.player.name}
                              </span>{" "}
                              <span className="text-[var(--c97-ink-2)]">
                                {candidate.player.position}{" "}
                                {candidate.player.team}
                                {candidate.player.opponent
                                  ? ` ${candidate.player.opponent}`
                                  : ""}
                              </span>
                            </p>
                            <dl className="flex flex-wrap font-mono text-2xs" style={{ marginTop: "var(--c97-sp-0)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-0)" }}>
                              <ReadoutPair
                                label="Gap"
                                value={candidate.gap.toFixed(1)}
                                emphasis
                              />
                              <ReadoutPair
                                label="Board"
                                value={candidate.board === "flex" ? "Flex" : "QB"}
                              />
                              <ReadoutPair
                                label="Rank"
                                value={String(candidate.player.rank)}
                              />
                              <ReadoutPair
                                label="Percentile"
                                value={candidate.rankPercentile.toFixed(1)}
                              />
                              <ReadoutPair
                                label="Rostered"
                                value={formatOwnership(candidate.ownership)}
                              />
                            </dl>
                          </li>
                        ))}
                      </ol>
                    )}
                  </>
                )}
                <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-2)" }}>
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
              <section aria-labelledby="weekly-board" className="border-t border-[var(--c97-ink)]" style={{ paddingTop: "var(--c97-sp-2)" }}>
                <h2
                  id="weekly-board"
                  className="c97-poster-sm"
                >
                  {board === "flex" ? "Flex rankings" : "Quarterback rankings"}
                </h2>
                <p className="max-w-[68ch] text-sm leading-6 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
                  Consensus rank within this board only. A flex rank and a
                  quarterback rank are not comparable, because FantasyPros
                  publishes no single in-season overall board and I would rather
                  keep them apart than manufacture an ordering the source never
                  made.
                </p>
                {/* Search narrows by name or team, and the flex board adds a
                  position cut. The quarterback board is one position already,
                  so the pills only render for flex. */}
                <div className="flex flex-wrap" style={{ marginTop: "var(--c97-sp-2)", columnGap: "var(--c97-sp-3)", rowGap: "var(--c97-sp-2)" }}>
                  <fieldset>
                  <legend className={GROUP_LEGEND_CLASS}>Board</legend>
                  <div className="flex flex-wrap items-center" style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
                    {(
                      [
                        ["flex", "Flex (RB, WR, TE)"],
                        ["quarterbacks", "Quarterback"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={board === value}
                        onClick={() => updateRouteState({ board: value })}
                        className={`${TOGGLE_CLASS} ${
                          board === value
                            ? "border-[var(--c97-ink)] bg-[var(--c97-ink)] text-[var(--c97-surface)]"
                            : "border-[var(--c97-rule)] bg-[var(--c97-surface)] text-[var(--c97-ink-2)] hover:border-[var(--c97-ink-2)] hover:text-[var(--c97-ink)]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                  <div>
                    <label
                      htmlFor="weekly-board-search"
                      className={`block ${GROUP_LEGEND_CLASS}`}
                    >
                      Search
                    </label>
                    <input
                      id="weekly-board-search"
                      value={searchQuery}
                      maxLength={80}
                      autoComplete="off"
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search player or team"
                      className="min-h-touch w-[220px] max-w-full border border-[var(--c97-ink-2)] bg-[var(--c97-field)] font-mono text-xs text-[var(--c97-ink)] placeholder:text-[var(--c97-ink-2)]" style={{ paddingInline: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}
                    />
                  </div>
                  {board === "flex" ? (
                    <fieldset>
                      <legend className={GROUP_LEGEND_CLASS}>Position</legend>
                      <div className="flex flex-wrap items-center" style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
                        {(["ALL", "RB", "WR", "TE"] as const).map((option) => (
                          <button
                            key={option}
                            type="button"
                            aria-pressed={positionFilter === option}
                            onClick={() => setPositionFilter(option)}
                            className={`${TOGGLE_CLASS} ${
                              positionFilter === option
                                ? "border-[var(--c97-ink)] bg-[var(--c97-ink)] text-[var(--c97-surface)]"
                                : "border-[var(--c97-rule)] bg-[var(--c97-surface)] text-[var(--c97-ink-2)] hover:border-[var(--c97-ink-2)] hover:text-[var(--c97-ink)]"
                            }`}
                          >
                            {option === "ALL" ? "All" : option}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}
                </div>
                {players.length === 0 ? (
                  <p className="text-sm text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-2)" }}>
                    This board published with no rows, which usually means the
                    source page came back empty. Check back after the next
                    refresh, or use the other board until then.
                  </p>
                ) : (
                  <>
                    {/* The count is the page's live region. It stays mounted
                        across every filter change so a search that lands on
                        one row is announced rather than only seen. It is also
                        where focus lands after Show all, since that button
                        unmounts itself and would otherwise drop a keyboard
                        user to the top of the document. */}
                    <p
                      ref={countLineRef}
                      role="status"
                      tabIndex={-1}
                      className={STATUS_CLASS}
                    >
                      {filteredPlayers.length === 0 ? emptyFilterLine : countLine}
                    </p>
                    {filteredPlayers.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setPositionFilter("ALL");
                        }}
                        className={`${TOGGLE_CLASS} border-[var(--c97-rule)] bg-[var(--c97-field)] text-[var(--c97-ink)] hover:border-[var(--c97-accent)]`} style={{ marginTop: "var(--c97-sp-1)" }}
                      >
                        Show all players
                      </button>
                    ) : tableLayout ? (
                      // The table sits in page flow rather than a scroll box of
                      // its own. It fits from md up, so nothing needs to scroll
                      // sideways, and page-level sticky keeps the column labels
                      // under the site header for as long as the board runs.
                      <table className="w-full border-collapse text-sm" style={{ marginTop: "var(--c97-sp-1)" }}>
                        <caption className="sr-only">{rankingsCaption}</caption>
                        <thead>
                          <tr className="text-left font-mono text-3xs uppercase tracking-[0.12em] text-[var(--c97-ink-2)]">
                            <th
                              scope="col"
                              className={`${STICKY_HEADER_CLASS} text-right`}
                              style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)", ...(STICKY_HEADER_STYLE) }}
                            >
                              #
                            </th>
                            <th
                              scope="col"
                              className={`${STICKY_HEADER_CLASS}`}
                              style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)", ...(STICKY_HEADER_STYLE) }}
                            >
                              Player
                            </th>
                            <th
                              scope="col"
                              className={`${STICKY_HEADER_CLASS}`}
                              style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)", ...(STICKY_HEADER_STYLE) }}
                            >
                              Opponent
                            </th>
                            <th
                              scope="col"
                              className={`${STICKY_HEADER_CLASS} text-right`}
                              style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)", ...(STICKY_HEADER_STYLE) }}
                            >
                              Expert range
                            </th>
                            <th
                              scope="col"
                              className={`${STICKY_HEADER_CLASS} text-right`}
                              style={{ paddingBlock: "var(--c97-sp-1)", ...(STICKY_HEADER_STYLE) }}
                            >
                              Rostered
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {visiblePlayers.map((player) => (
                            <tr
                              key={player.id}
                              className="border-b border-[var(--c97-rule)]"
                            >
                              <td className="text-right font-mono tabular-nums text-[var(--c97-ink-2)]" style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)" }}>
                                {player.rank}
                              </td>
                              <th
                                scope="row"
                                className="text-left font-normal" style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)" }}
                              >
                                <span className="font-semibold text-[var(--c97-ink)]">
                                  {player.name}
                                </span>{" "}
                                <span className="text-[var(--c97-ink-2)]">
                                  {player.position}
                                  {player.positionRank !== undefined
                                    ? player.positionRank
                                    : ""}{" "}
                                  {player.team}
                                </span>
                              </th>
                              <td className="text-[var(--c97-ink-2)]" style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)" }}>
                                {player.opponent ?? "—"}
                              </td>
                              <td className="text-right font-mono tabular-nums text-[var(--c97-ink-2)]" style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-1)" }}>
                                {formatSpread(player)}
                              </td>
                              <td className="text-right font-mono tabular-nums text-[var(--c97-ink-2)]" style={{ paddingBlock: "var(--c97-sp-1)" }}>
                                {formatOwnership(player.ownership)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <ol
                        role="list"
                        aria-label={rankingsCaption}
                        className="list-none border-t border-[var(--c97-rule)] p-0" style={{ marginTop: "var(--c97-sp-1)" }}
                      >
                        {visiblePlayers.map((player) => (
                          <li
                            key={player.id}
                            className="flex items-start border-b border-[var(--c97-rule)]" style={{ paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}
                          >
                            <span className="w-8 shrink-0 text-right font-mono text-sm tabular-nums text-[var(--c97-ink-2)]">
                              <span className="sr-only">Rank </span>
                              {player.rank}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm">
                                <span className="font-semibold text-[var(--c97-ink)]">
                                  {player.name}
                                </span>{" "}
                                <span className="text-[var(--c97-ink-2)]">
                                  {player.position}
                                  {player.positionRank !== undefined
                                    ? player.positionRank
                                    : ""}{" "}
                                  {player.team}
                                </span>
                              </p>
                              <dl className="flex flex-wrap font-mono text-2xs" style={{ marginTop: "var(--c97-sp-0)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-0)" }}>
                                <ReadoutPair
                                  label="Opponent"
                                  value={player.opponent ?? "—"}
                                />
                                <ReadoutPair
                                  label="Expert range"
                                  value={formatSpread(player)}
                                />
                                <ReadoutPair
                                  label="Rostered"
                                  value={formatOwnership(player.ownership)}
                                />
                              </dl>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                    {remainingCount > 0 ? (
                      <div className="flex flex-wrap items-center" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
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
                          className={`${TOGGLE_CLASS} border-[var(--c97-rule)] bg-[var(--c97-surface)] text-[var(--c97-ink)] hover:border-[var(--c97-accent)]`}
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
                          className={`${TOGGLE_CLASS} border-[var(--c97-rule)] bg-[var(--c97-surface)] text-[var(--c97-ink-2)] hover:border-[var(--c97-accent)]`}
                        >
                          Show all {filteredPlayers.length}
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
                {source ? (
                  <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-2)" }}>
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
          </>
        ) : null}

        {/* Rendered in every state, published or not, so the page never
            dead-ends away from the rest of the fantasy tools. */}
        <nav
          aria-label="More fantasy football tools"
          className="flex flex-wrap items-baseline border-t border-[var(--c97-rule)]" style={{ paddingTop: "var(--c97-sp-2)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-1)" }}
        >
          <span className="font-mono text-2xs text-[var(--c97-ink-2)]">
            More fantasy tools
          </span>
          <Link
            href={viewConfig.sibling.href}
            className="c97-link inline-flex min-h-touch items-center text-sm font-semibold"
          >
            {viewConfig.sibling.label} <span className="c97-arrow-out" aria-hidden="true">↗</span>
          </Link>
          <Link
            href="/fantasy-football"
            className="c97-link inline-flex min-h-touch items-center text-sm font-semibold"
          >
            Rankings board <span className="c97-arrow-out" aria-hidden="true">↗</span>
          </Link>
          <Link
            href="/fantasy-football/draft-tracker"
            className="c97-link inline-flex min-h-touch items-center text-sm font-semibold"
          >
            Draft tracker <span className="c97-arrow-out" aria-hidden="true">↗</span>
          </Link>
          <Link
            href="/fantasy-football/best-ball"
            className="c97-link inline-flex min-h-touch items-center text-sm font-semibold"
          >
            Best ball <span className="c97-arrow-out" aria-hidden="true">↗</span>
          </Link>
        </nav>
      </div>
      </section>
    </section>
  );
}
