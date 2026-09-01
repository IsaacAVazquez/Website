"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useMemo, useState } from "react";
import { Breadcrumbs, createBreadcrumbItems } from "@/components/navigation/Breadcrumbs";
import { useFantasyWeeklySnapshot } from "@/hooks/useFantasyWeeklySnapshot";
import {
  FANTASY_SCORING_LABELS,
  normalizeFantasyRouteScoring,
  type FantasyRouteScoring,
} from "@/lib/fantasy";
import {
  FANTASY_WEEKLY_MIN_WAIVER_GAP,
  FANTASY_WEEKLY_STARTABLE_DEPTH,
  FANTASY_WEEKLY_WIDELY_ROSTERED_PERCENT,
  getFantasyWeeklyWaiverCandidates,
  type FantasyWeeklyPlayer,
} from "@/lib/fantasyWeeklySnapshot";
import { formatUpdatedAt, getSnapshotStaleness, getSnapshotStalenessLabel } from "@/lib/fantasyUtils";

const BREADCRUMBS = createBreadcrumbItems([
  { label: "Fantasy Football", href: "/fantasy-football" },
  { label: "Weekly", href: "/fantasy-football/weekly" },
]);

const TOGGLE_CLASS =
  "inline-flex min-h-touch items-center rounded-full border px-4 text-sm font-semibold transition-[border-color,background-color]";

const GROUP_LEGEND_CLASS =
  "font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]";

/** The header cell of a long table: pinned to the top of its own scroll box. */
const STICKY_HEADER_CLASS = "sticky top-0 z-10";
const STICKY_HEADER_STYLE = {
  background: "var(--home-paper-raised)",
  boxShadow: "inset 0 -1px 0 var(--home-rule)",
} as const;

export type WeeklyBoardKey = "flex" | "quarterbacks";

type WeeklyPositionFilter = "ALL" | "RB" | "WR" | "TE";

export interface WeeklyRouteState {
  scoring: FantasyRouteScoring;
  board: WeeklyBoardKey;
}

/** Kept in step with the same normalization in page.tsx. */
function normalizeWeeklyBoard(value: string | null | undefined): WeeklyBoardKey {
  return value === "quarterbacks" ? "quarterbacks" : "flex";
}

function formatSpread(player: FantasyWeeklyPlayer): string {
  if (player.minRank === undefined || player.maxRank === undefined) return "--";
  return `${player.minRank} to ${player.maxRank}`;
}

function formatOwnership(value: number | undefined): string {
  return value === undefined ? "--" : `${value.toFixed(1)}%`;
}

export function WeeklyBoardClient({ initialState }: { initialState: WeeklyRouteState }) {
  const { snapshot, notPublished, isLoading, error, retry } = useFantasyWeeklySnapshot();
  const router = useRouter();
  const searchParams = useSearchParams();

  // The URL is the source of truth, the way the rankings board does it, so a
  // weekly board can be linked and restored. The server-normalized props cover
  // the first render and any visit that carries no parameters.
  const scoringParam = searchParams.get("scoring");
  const boardParam = searchParams.get("board");
  const scoring =
    scoringParam === null ? initialState.scoring : normalizeFantasyRouteScoring(scoringParam);
  const board = boardParam === null ? initialState.board : normalizeWeeklyBoard(boardParam);

  function updateRouteState(next: Partial<WeeklyRouteState>) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("scoring", next.scoring ?? scoring);
    params.set("board", next.board ?? board);
    // Replace rather than push. A scoring or board tap is a filter change, and
    // pushing would make Back walk the filter history instead of leaving.
    startTransition(() => {
      router.replace(`/fantasy-football/weekly?${params.toString()}`, { scroll: false });
    });
  }

  const activeBoard = snapshot?.boards[scoring] ?? null;
  const players = useMemo(() => (activeBoard ? activeBoard[board] : []), [activeBoard, board]);
  const source = activeBoard
    ? board === "flex"
      ? activeBoard.flexSource
      : activeBoard.quarterbackSource
    : null;
  const waivers = useMemo(
    () => (activeBoard ? getFantasyWeeklyWaiverCandidates(activeBoard) : []),
    [activeBoard]
  );
  const staleness = getSnapshotStaleness(source?.asOf);

  // Search and the position filter are view state rather than route state. A
  // query is ephemeral in a way scoring and board are not, so it stays out of
  // the URL. The position filter only means anything on the flex board, since
  // the quarterback board is one position already.
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState<WeeklyPositionFilter>("ALL");
  const query = searchQuery.trim().toLowerCase();
  const filteredPlayers = useMemo(
    () =>
      players.filter((player) => {
        if (board === "flex" && positionFilter !== "ALL" && player.position !== positionFilter) {
          return false;
        }
        if (!query) return true;
        return `${player.name} ${player.team}`.toLowerCase().includes(query);
      }),
    [players, board, positionFilter, query]
  );

  return (
    <section
      className="home-page home-dash min-h-screen"
      aria-label="Fantasy football weekly board"
    >
      <div className="home-shell home-shell-wide home-section space-y-5">
        <Breadcrumbs customItems={BREADCRUMBS} className="!py-0" />

        <header className="border-b border-[var(--home-rule)] pb-5">
          <h1 className="max-w-[16ch] text-[clamp(2.25rem,1.7rem+2.5vw,4.2rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-[var(--home-ink)]">
            The Weekly Board
          </h1>
          <p className="mt-4 max-w-[68ch] text-base leading-7 text-[var(--home-ink-muted)]">
            Every other board here is a draft board, and a draft board stops describing anything
            real once the season opens. This one refreshes through the season, so it is what I would
            actually use on a Tuesday. It carries the weekly flex and quarterback consensus, each
            player&rsquo;s opponent, and how widely he is rostered.
          </p>
          {snapshot && source ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-2xs uppercase tracking-[0.1em] text-[var(--home-ink-muted)]">
              <span>
                {snapshot.season} Week {snapshot.week}
              </span>
              <span aria-hidden="true">·</span>
              <span>Source updated {formatUpdatedAt(source.asOf)}</span>
              <span aria-hidden="true">·</span>
              <span
                style={{ color: staleness === "stale" ? "var(--home-negative)" : undefined }}
              >
                {getSnapshotStalenessLabel(staleness)}
              </span>
              <span aria-hidden="true">·</span>
              <span>{source.expertCount} experts</span>
            </div>
          ) : null}
        </header>

        {isLoading ? (
          <p role="status" className="text-sm text-[var(--home-ink-muted)]">
            Loading the weekly board.
          </p>
        ) : null}

        {notPublished ? (
          <div
            role="note"
            className="rounded-[var(--radius-3xl)] border px-4 py-3 text-sm"
            style={{
              borderColor: "color-mix(in srgb, var(--home-warning) 45%, var(--home-rule))",
              background: "color-mix(in srgb, var(--home-warning) 8%, var(--home-paper))",
            }}
          >
            <p className="text-[var(--home-ink-muted)]">
              <span className="font-semibold text-[var(--home-ink)]">
                The weekly board opens with Week 1.
              </span>{" "}
              It is deliberately empty until then. Rostered percentages before leagues have drafted
              describe the preseason rather than a waiver wire, and publishing them now would make
              the add list say something I cannot support. Until kickoff, the{" "}
              <Link
                href="/fantasy-football"
                className="underline decoration-[var(--home-signal)] underline-offset-4"
              >
                draft rankings
              </Link>{" "}
              are the board that means anything.
            </p>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="rounded-[var(--radius-3xl)] border border-[var(--home-negative)] bg-[var(--home-paper)] p-5"
          >
            <p className="text-sm text-[var(--home-ink)]">{error}</p>
            <button
              type="button"
              onClick={retry}
              className={`${TOGGLE_CLASS} mt-3 border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink)] hover:border-[var(--home-signal)]`}
            >
              Try again
            </button>
          </div>
        ) : null}

        {snapshot && activeBoard ? (
          <>
            {/* Two choices, not six. Each group gets its own visible label and
                the space between groups is wider than the space inside one, so
                scoring and board stop reading as one row of pills. */}
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <fieldset>
                <legend className={GROUP_LEGEND_CLASS}>Scoring</legend>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(Object.keys(FANTASY_SCORING_LABELS) as FantasyRouteScoring[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={scoring === option}
                      onClick={() => updateRouteState({ scoring: option })}
                      className={`${TOGGLE_CLASS} ${
                        scoring === option
                          ? "border-[var(--home-signal)] bg-[var(--home-paper-alt)] text-[var(--home-ink)]"
                          : "border-[var(--home-rule)] bg-[var(--home-paper)] text-[var(--home-ink-muted)]"
                      }`}
                    >
                      {FANTASY_SCORING_LABELS[option]}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className={GROUP_LEGEND_CLASS}>Board</legend>
                <div className="mt-2 flex flex-wrap items-center gap-2">
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
                          ? "border-[var(--home-signal)] bg-[var(--home-paper-alt)] text-[var(--home-ink)]"
                          : "border-[var(--home-rule)] bg-[var(--home-paper)] text-[var(--home-ink-muted)]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <section aria-labelledby="weekly-waivers" className="home-card p-5">
              <h2
                id="weekly-waivers"
                className="text-lg font-semibold tracking-[-0.02em] text-[var(--home-ink)]"
              >
                Waiver targets
              </h2>
              <p className="mt-2 max-w-[68ch] text-sm leading-6 text-[var(--home-ink-muted)]">
                Players the experts rank ahead of where the rostering rate puts them. The gap is the
                player&rsquo;s percentile on this board minus the percentage of leagues rostering
                him, so both numbers are printed beside it and any row can be checked by hand. The
                percentile is measured against the whole published board rather than the startable
                part of it, so it is the count of players at or below him divided by all{" "}
                {activeBoard.flex.length} on the flex board, or all {activeBoard.quarterbacks.length}{" "}
                on the quarterback board, which is why the same percentile means something different
                in each of the two rank spaces. A candidate has to be inside the top{" "}
                {FANTASY_WEEKLY_STARTABLE_DEPTH.flex} flex or top{" "}
                {FANTASY_WEEKLY_STARTABLE_DEPTH.quarterback} quarterbacks to count as startable,
                rostered in under {FANTASY_WEEKLY_WIDELY_ROSTERED_PERCENT}% of leagues to count as
                available, and clear a gap of at least {FANTASY_WEEKLY_MIN_WAIVER_GAP} to be listed
                at all. There is no bid figure here, because the source carries none and I am not
                inventing one.
              </p>
              {waivers.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--home-ink-muted)]">
                  No player clears the gap this week, which happens when the widely rostered players
                  are also the ones the experts like.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[38rem] border-collapse text-sm">
                    <caption className="sr-only">
                      Weekly waiver targets ranked by the gap between board percentile and rostered
                      percentage
                    </caption>
                    <thead>
                      <tr className="border-b border-[var(--home-rule)] text-left font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                        <th scope="col" className="py-2 pr-3">Player</th>
                        <th scope="col" className="py-2 pr-3">Board</th>
                        <th scope="col" className="py-2 pr-3 text-right">Rank</th>
                        <th scope="col" className="py-2 pr-3 text-right">Percentile</th>
                        <th scope="col" className="py-2 pr-3 text-right">Rostered</th>
                        <th scope="col" className="py-2 text-right">Gap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waivers.map((candidate) => (
                        <tr
                          key={`${candidate.board}-${candidate.player.id}`}
                          className="border-b border-[var(--home-rule)]"
                        >
                          <th scope="row" className="py-2 pr-3 text-left font-normal">
                            <span className="font-semibold text-[var(--home-ink)]">
                              {candidate.player.name}
                            </span>{" "}
                            <span className="text-[var(--home-ink-muted)]">
                              {candidate.player.position} {candidate.player.team}
                              {candidate.player.opponent ? ` ${candidate.player.opponent}` : ""}
                            </span>
                          </th>
                          <td className="py-2 pr-3 text-[var(--home-ink-muted)]">
                            {candidate.board === "flex" ? "Flex" : "QB"}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono tabular-nums text-[var(--home-ink)]">
                            {candidate.player.rank}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono tabular-nums text-[var(--home-ink-muted)]">
                            {candidate.rankPercentile.toFixed(1)}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono tabular-nums text-[var(--home-ink-muted)]">
                            {formatOwnership(candidate.ownership)}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums font-semibold text-[var(--home-ink)]">
                            {candidate.gap.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section aria-labelledby="weekly-board" className="home-card p-5">
              <h2
                id="weekly-board"
                className="text-lg font-semibold tracking-[-0.02em] text-[var(--home-ink)]"
              >
                {board === "flex" ? "Flex rankings" : "Quarterback rankings"}
              </h2>
              <p className="mt-2 max-w-[68ch] text-sm leading-6 text-[var(--home-ink-muted)]">
                Consensus rank within this board only. A flex rank and a quarterback rank are not
                comparable, because FantasyPros publishes no single in-season overall board and I
                would rather keep them apart than manufacture an ordering the source never made.
              </p>
              {/* Search narrows by name or team, and the flex board adds a
                  position cut. The quarterback board is one position already,
                  so the pills only render for flex. */}
              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
                <div>
                  <label htmlFor="weekly-board-search" className={`block ${GROUP_LEGEND_CLASS}`}>
                    Search
                  </label>
                  <input
                    id="weekly-board-search"
                    value={searchQuery}
                    maxLength={80}
                    autoComplete="off"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search player or team"
                    className="mt-2 min-h-touch w-[220px] max-w-full rounded-[4px] border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 font-mono text-xs text-[var(--home-ink)] placeholder:text-[var(--home-ink-muted)]"
                  />
                </div>
                {board === "flex" ? (
                  <fieldset>
                    <legend className={GROUP_LEGEND_CLASS}>Position</legend>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {(["ALL", "RB", "WR", "TE"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={positionFilter === option}
                          onClick={() => setPositionFilter(option)}
                          className={`${TOGGLE_CLASS} ${
                            positionFilter === option
                              ? "border-[var(--home-signal)] bg-[var(--home-paper-alt)] text-[var(--home-ink)]"
                              : "border-[var(--home-rule)] bg-[var(--home-paper)] text-[var(--home-ink-muted)]"
                          }`}
                        >
                          {option === "ALL" ? "All" : option}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ) : null}
              </div>
              {/* The board runs past 150 rows, so it scrolls in its own box with
                  the column labels pinned. Page-level sticky cannot reach here:
                  the horizontal scroll this wide table needs makes the wrapper a
                  scroll container of its own. */}
              {players.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--home-ink-muted)]">
                  This board published with no rows, which usually means the source page came back
                  empty. Check back after the next refresh, or use the other board until then.
                </p>
              ) : filteredPlayers.length === 0 ? (
                <div className="mt-4">
                  <p className="text-sm text-[var(--home-ink-muted)]">
                    {board === "flex"
                      ? "No players match your search or position filter."
                      : "No players match your search."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setPositionFilter("ALL");
                    }}
                    className={`${TOGGLE_CLASS} mt-3 border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink)] hover:border-[var(--home-signal)]`}
                  >
                    Show all players
                  </button>
                </div>
              ) : (
                <div className="mt-4 max-h-[70vh] overflow-auto">
                  <table className="w-full min-w-[38rem] border-collapse text-sm">
                    <caption className="sr-only">
                      {snapshot.season} week {snapshot.week}{" "}
                      {board === "flex" ? "flex" : "quarterback"} consensus rankings,{" "}
                      {FANTASY_SCORING_LABELS[scoring]} scoring
                    </caption>
                    <thead>
                      <tr className="text-left font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                        <th
                          scope="col"
                          className={`${STICKY_HEADER_CLASS} py-2 pr-3 text-right`}
                          style={STICKY_HEADER_STYLE}
                        >
                          #
                        </th>
                        <th
                          scope="col"
                          className={`${STICKY_HEADER_CLASS} py-2 pr-3`}
                          style={STICKY_HEADER_STYLE}
                        >
                          Player
                        </th>
                        <th
                          scope="col"
                          className={`${STICKY_HEADER_CLASS} py-2 pr-3`}
                          style={STICKY_HEADER_STYLE}
                        >
                          Opponent
                        </th>
                        <th
                          scope="col"
                          className={`${STICKY_HEADER_CLASS} py-2 pr-3 text-right`}
                          style={STICKY_HEADER_STYLE}
                        >
                          Expert range
                        </th>
                        <th
                          scope="col"
                          className={`${STICKY_HEADER_CLASS} py-2 text-right`}
                          style={STICKY_HEADER_STYLE}
                        >
                          Rostered
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlayers.map((player) => (
                        <tr key={player.id} className="border-b border-[var(--home-rule)]">
                          <td className="py-2 pr-3 text-right font-mono tabular-nums text-[var(--home-ink-muted)]">
                            {player.rank}
                          </td>
                          <th scope="row" className="py-2 pr-3 text-left font-normal">
                            <span className="font-semibold text-[var(--home-ink)]">{player.name}</span>{" "}
                            <span className="text-[var(--home-ink-muted)]">
                              {player.position}
                              {player.positionRank !== undefined ? player.positionRank : ""}{" "}
                              {player.team}
                            </span>
                          </th>
                          <td className="py-2 pr-3 text-[var(--home-ink-muted)]">
                            {player.opponent ?? "--"}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono tabular-nums text-[var(--home-ink-muted)]">
                            {formatSpread(player)}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums text-[var(--home-ink-muted)]">
                            {formatOwnership(player.ownership)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {source ? (
                <p className="mt-4 text-2xs text-[var(--home-ink-muted)]">
                  {source.playerCount} players from {source.provider}, {source.expertCount}{" "}
                  contributing experts.{" "}
                  <a
                    href={source.url}
                    className="underline decoration-[var(--home-rule)] underline-offset-4"
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    Source board
                  </a>
                </p>
              ) : null}
            </section>
          </>
        ) : null}

        {/* Rendered in every state, published or not, so the page never
            dead-ends away from the rest of the fantasy tools. */}
        <nav
          aria-label="More fantasy football tools"
          className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-t border-[var(--home-rule)] pt-3.5"
        >
          <span className="font-mono text-2xs text-[var(--home-ink-muted)]">
            More fantasy tools
          </span>
          <Link
            href="/fantasy-football"
            className="inline-flex min-h-touch items-center text-sm font-semibold no-underline"
          >
            Rankings board ↗
          </Link>
          <Link
            href="/fantasy-football/draft-tracker"
            className="inline-flex min-h-touch items-center text-sm font-semibold no-underline"
          >
            Draft tracker ↗
          </Link>
          <Link
            href="/fantasy-football/best-ball"
            className="inline-flex min-h-touch items-center text-sm font-semibold no-underline"
          >
            Best ball ↗
          </Link>
        </nav>
      </div>
    </section>
  );
}
