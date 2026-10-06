"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert, Flag, Gauge, MapPin, Trophy, UserRound } from "lucide-react";
import type {
  GolfLeaderboardEntry,
  GolfPlayerSnapshot,
  GolfRouteState,
  GolfSummary,
  GolfView,
} from "@/types/golf";
import {
  buildGolfHref,
  DEFAULT_GOLF_STATE,
  GOLF_ROUTE,
  GOLF_VIEW_LABELS,
  GOLF_VIEW_OPTIONS,
  normalizeGolfState,
} from "./golf-state";
import { Catalog97ProjectHero, type Catalog97Readout } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { GolfLeaderboard } from "./GolfLeaderboard";
import { formatScoreToPar } from "./leaderboard";
import "./golf.css";
import { useRouteSync } from "@/hooks/useRouteSync";
import { formatStableDateTime } from "@/lib/date-formatters";
// Imported by path. The football barrel ships whatever it re-exports to every
// route that reads it, and this route takes nothing else from it.
import { DetailDrawer } from "@/components/football/DetailDrawer";

/** How many players the board prints before the reader asks for the whole field. */
const BOARD_LIMIT = 20;

interface GolfClientProps {
  initialState: GolfRouteState;
  summary: GolfSummary;
  initialPlayerSnapshot: GolfPlayerSnapshot | null;
}

// Pinned to UTC so the server and the browser print the same string.
const LAST_UPDATED_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

// Tournament dates arrive as calendar days, which parse as UTC midnight, so
// they print in UTC. In local time a reader west of Greenwich saw the day before.
const DATE_RANGE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const DATE_RANGE_END_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** Under par prints in golf's red; even and over stay ink, matching the leaderboard signature. */
function scoreColor(value: number | null | undefined): string {
  if (value === null || value === undefined || value >= 0) {
    return "var(--c97-ink)";
  }
  return "var(--c97-negative)";
}

function MovementGlyph({ movement }: { movement: number }) {
  if (movement > 0) return <span aria-hidden="true">&uarr;</span>;
  if (movement < 0) return <span aria-hidden="true">&darr;</span>;
  return <span aria-hidden="true">&minus;</span>;
}

function getMovementLabel(movement: number): string {
  if (movement > 0) return `Up ${movement}`;
  if (movement < 0) return `Down ${Math.abs(movement)}`;
  return "Steady";
}

function MovementPill({ movement }: { movement: number }) {
  const tone = movement > 0 ? "c97-chip-positive" : movement < 0 ? "c97-chip-negative" : "";
  return (
    <span className={`c97-chip ${tone}`.trim()}>
      <MovementGlyph movement={movement} />
      {getMovementLabel(movement)}
    </span>
  );
}

function formatGeneratedAt(value: string | null | undefined): string {
  if (!value) return "Unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : formatStableDateTime(LAST_UPDATED_FORMATTER, date);
}

// A bare YYYY-MM-DD parses as UTC midnight, which DATE_RANGE_FORMATTER's
// pinned UTC timeZone then reads back correctly.
function parseDay(value: string): Date {
  return new Date(value);
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = parseDay(startDate);
  const end = parseDay(endDate);
  const startValid = !Number.isNaN(start.getTime());
  const endValid = !Number.isNaN(end.getTime());

  if (startValid && endValid) {
    return `${DATE_RANGE_FORMATTER.format(start)} – ${DATE_RANGE_END_FORMATTER.format(end)}`;
  }
  if (endValid) return DATE_RANGE_END_FORMATTER.format(end);
  if (startValid) return DATE_RANGE_END_FORMATTER.format(start);
  return "Dates TBD";
}

/** "Round 4 · Final", without repeating the round when the status already names it. */
function formatRoundStatus(roundLabel: string, status: string): string {
  if (!status || !roundLabel) return status || roundLabel;
  return status.includes(roundLabel) ? status : `${roundLabel} · ${status}`;
}

async function fetchGolfPlayerSnapshot(
  playerId: string,
  signal: AbortSignal
): Promise<GolfPlayerSnapshot> {
  const response = await fetch(`/api/golf/players/${playerId}`, { signal });
  const payload = (await response.json()) as GolfPlayerSnapshot & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "Unable to load golf player snapshot.");
  }

  return payload;
}

function StatBlock({
  label,
  value,
  detail,
  valueColor,
}: {
  label: string;
  value: string;
  detail?: string;
  valueColor?: string;
}) {
  return (
    <div className="c97-stat">
      <p className="c97-stat-label">{label}</p>
      <p className="c97-stat-value" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </p>
      {detail ? <p className="c97-stat-delta">{detail}</p> : null}
    </div>
  );
}

function LeaderboardTable({
  rows,
  selectedPlayerId,
  onSelectPlayer,
}: {
  rows: GolfLeaderboardEntry[];
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
}) {
  const roundCount = Math.min(
    4,
    rows.reduce((max, row) => Math.max(max, row.roundScores.length), 0)
  );
  const roundLabels = Array.from({ length: roundCount }, (_, i) => `R${i + 1}`);

  return (
    <div
      className="overflow-x-auto"
      role="region"
      aria-label="Full leaderboard (scrollable)"
      tabIndex={0}
    >
      <table className="c97-table c97-golf-full-table">
        <caption className="sr-only">
          PGA Tour Pulse leaderboard with position, total, today&apos;s score, holes played, round
          scores, and movement.
        </caption>
        <thead>
          <tr>
            <th scope="col">Pos</th>
            <th scope="col">Player</th>
            <th scope="col" data-align="end">Total</th>
            <th scope="col" data-align="end">Today</th>
            <th scope="col" data-wide>Thru</th>
            {roundLabels.map((label) => (
              <th key={label} scope="col" data-align="end" data-wide>{label}</th>
            ))}
            <th scope="col" data-wide>Move</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = row.playerId === selectedPlayerId;

            return (
              <tr key={row.playerId} aria-current={isSelected ? "true" : undefined}>
                <th scope="row" className="c97-mono">{row.position}</th>
                <td>
                  <button
                    type="button"
                    onClick={() => onSelectPlayer(row.playerId)}
                    aria-haspopup="dialog"
                    className="c97-golf-name-btn"
                  >
                    <span className="c97-serif">{row.playerName}</span>
                    <span className="c97-stat-delta" data-wide style={{ marginLeft: "var(--c97-sp-2)" }}>
                      {row.country}
                    </span>
                  </button>
                </td>
                <td className="c97-mono" data-align="end" style={{ color: scoreColor(row.totalToPar), fontWeight: 600 }}>
                  {formatScoreToPar(row.totalToPar)}
                </td>
                <td className="c97-mono" data-align="end" style={{ color: scoreColor(row.today) }}>
                  {formatScoreToPar(row.today)}
                </td>
                <td className="c97-mono" data-wide>{row.thru}</td>
                {roundLabels.map((label, i) => (
                  <td key={label} className="c97-mono" data-align="end" data-wide>
                    {row.roundScores[i] != null ? String(row.roundScores[i]) : "—"}
                  </td>
                ))}
                <td data-wide><MovementPill movement={row.movement} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PlayerCards({
  rows,
  selectedPlayerId,
  onSelectPlayer,
  coursePar,
}: {
  rows: GolfLeaderboardEntry[];
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
  coursePar: number;
}) {
  return (
    <div className="grid sm:grid-cols-2" style={{ gap: "var(--c97-sp-2)" }}>
      {rows.map((row) => {
        const isSelected = row.playerId === selectedPlayerId;

        return (
          <button
            key={row.playerId}
            type="button"
            onClick={() => onSelectPlayer(row.playerId)}
            aria-current={isSelected ? "true" : undefined}
            aria-haspopup="dialog"
            className="c97-golf-card"
          >
            <span className="flex items-start justify-between" style={{ gap: "var(--c97-sp-2)" }}>
              <span style={{ display: "block" }}>
                <span className="c97-kicker" style={{ display: "block" }}>{row.position}</span>
                <span className="c97-serif c97-h3" style={{ display: "block" }}>{row.playerName}</span>
                <span className="c97-stat-delta" style={{ display: "block" }}>{row.country}</span>
              </span>
              <span className="text-right" style={{ display: "block" }}>
                <span className="c97-mono" style={{ display: "block", fontSize: "var(--c97-fs-h2)", color: scoreColor(row.totalToPar) }}>
                  {formatScoreToPar(row.totalToPar)}
                </span>
                <span className="c97-stat-delta" style={{ display: "block" }}>
                  Today <span style={{ color: scoreColor(row.today), fontWeight: 600 }}>{formatScoreToPar(row.today)}</span>
                </span>
              </span>
            </span>

            <span className="flex flex-wrap" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
              {row.roundScores.map((score, index) => (
                <span key={index} className="c97-mono" style={{ color: scoreColor(score - coursePar) }}>
                  {score}
                </span>
              ))}
            </span>

            <span className="flex items-center justify-between" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
              <span className="c97-stat-delta">{row.status}</span>
              <MovementPill movement={row.movement} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function GolfClient({ initialState, summary, initialPlayerSnapshot }: GolfClientProps) {
  const searchParams = useSearchParams();
  const hasManagedParams = searchParams.get("view") !== null || searchParams.get("player") !== null;
  const routeState = hasManagedParams ? normalizeGolfState(searchParams) : initialState;
  const validPlayerIds = useMemo(
    () => new Set(summary.players.map((player) => player.id)),
    [summary.players]
  );
  const canonicalPlayerParam = validPlayerIds.has(routeState.player ?? "") ? routeState.player : null;
  const defaultPlayerId = summary.leaderboard[0]?.playerId ?? null;
  const selectedPlayerId = canonicalPlayerParam ?? defaultPlayerId;
  const desiredHref = buildGolfHref(
    { view: routeState.view, player: canonicalPlayerParam },
    searchParams
  );
  const [playerSnapshots, setPlayerSnapshots] = useState<Record<string, GolfPlayerSnapshot>>(
    () => (selectedPlayerId && initialPlayerSnapshot ? { [selectedPlayerId]: initialPlayerSnapshot } : {})
  );
  const [playerSnapshotErrors, setPlayerSnapshotErrors] = useState<Record<string, string>>({});
  const playerSnapshot = selectedPlayerId ? playerSnapshots[selectedPlayerId] ?? null : null;
  const playerSnapshotError = selectedPlayerId ? playerSnapshotErrors[selectedPlayerId] ?? null : null;
  const isPlayerSnapshotLoading = Boolean(selectedPlayerId && !playerSnapshot && !playerSnapshotError);
  const tournament = summary.tournament;
  const selectedRow = summary.leaderboard.find((row) => row.playerId === selectedPlayerId) ?? null;
  const roundCount = Math.max(1, ...summary.leaderboard.map((row) => row.roundScores.length));
  const lead = PROJECT_PRESS[GOLF_ROUTE].lead;

  const pushHref = useRouteSync(GOLF_ROUTE, desiredHref);
  // The player drawer starts open only for a link that names a player, and
  // after that only `handlePlayerChange` opens it. It holds the player that
  // was asked for and waits for the route to reach them, so it never shows
  // the last one.
  const [drawerPlayerId, setDrawerPlayerId] = useState<string | null>(canonicalPlayerParam);
  const isDrawerOpen = drawerPlayerId !== null && drawerPlayerId === selectedPlayerId;
  // The board prints its first BOARD_LIMIT players. A link to a player further
  // down starts on the whole field, so their row is on the board.
  const [showAllPlayers, setShowAllPlayers] = useState(
    () => summary.leaderboard.findIndex((row) => row.playerId === selectedPlayerId) >= BOARD_LIMIT
  );
  const boardRows = showAllPlayers ? summary.leaderboard : summary.leaderboard.slice(0, BOARD_LIMIT);

  useEffect(() => {
    if (!selectedPlayerId) return;
    if (playerSnapshots[selectedPlayerId]) return;
    if (playerSnapshotErrors[selectedPlayerId]) return;

    const controller = new AbortController();
    let cancelled = false;

    fetchGolfPlayerSnapshot(selectedPlayerId, controller.signal)
      .then((snapshot) => {
        if (cancelled) return;

        setPlayerSnapshots((current) => (current[selectedPlayerId] ? current : { ...current, [selectedPlayerId]: snapshot }));
        setPlayerSnapshotErrors((current) => {
          if (!(selectedPlayerId in current)) return current;
          const next = { ...current };
          delete next[selectedPlayerId];
          return next;
        });
      })
      .catch((error: Error) => {
        if (!cancelled && error.name !== "AbortError") {
          setPlayerSnapshotErrors((current) => ({
            ...current,
            [selectedPlayerId]: error.message || "Unable to load golf player snapshot.",
          }));
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [playerSnapshotErrors, playerSnapshots, selectedPlayerId]);

  function navigate(nextState: GolfRouteState) {
    const href = buildGolfHref(nextState, searchParams);
    pushHref(href);
  }

  function handleViewChange(view: GolfView) {
    navigate({ view, player: canonicalPlayerParam ?? DEFAULT_GOLF_STATE.player });
  }

  function handlePlayerChange(playerId: string) {
    setDrawerPlayerId(playerId);
    navigate({ view: routeState.view, player: playerId });
  }

  if (!tournament) {
    return (
      <Catalog97ProjectHero
        ink={lead}
        title="PGA Tour Pulse"
        standfirst="I wanted the leaderboard to read like a manual scoreboard, names on slats, rounds across, and red for anything under par. The snapshot for this tournament is not available yet."
      />
    );
  }

  const heroReadouts: [Catalog97Readout, Catalog97Readout, Catalog97Readout] = [
    {
      label: "Leader",
      value: summary.heroStats.leaderName ?? "—",
      detail: formatScoreToPar(summary.heroStats.leaderScore),
    },
    {
      label: "Cut line",
      value:
        summary.heroStats.cutLine !== null
          ? formatScoreToPar(summary.heroStats.cutLine)
          : summary.heroStats.cutState === "none"
            ? "No cut"
            : "TBD",
      detail:
        summary.heroStats.cutState === "none"
          ? "Full field plays all rounds"
          : summary.heroStats.cutCount !== null
            ? `${summary.heroStats.cutCount} advanced`
            : undefined,
    },
    {
      label: "Field",
      value: `${summary.heroStats.fieldSize}`,
      detail: "players",
    },
  ];

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="PGA Tour Pulse"
        standfirst="I wanted the leaderboard to read like a manual scoreboard, names on slats, rounds across, and red for anything under par. It reads from a checked-in snapshot of the PGA Tour leaderboard that refreshes on a schedule."
        meta={`${tournament.tour} · last checked ${formatGeneratedAt(tournament.generatedAt)}`}
        // The hero fills a phone's first screen and the signature runs long
        // under it, so one link goes straight to the board.
        action={<a href="#golf-board" className="c97-btn-ghost">Jump to the full board</a>}
        readouts={heroReadouts}
      >
        <div className="c97-panel" style={{ marginBottom: "var(--c97-sp-4)" }}>
          <h2 className="c97-serif c97-h2" style={{ marginBottom: "var(--c97-sp-2)" }}>
            {tournament.name}
          </h2>
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
            {formatRoundStatus(tournament.roundLabel, tournament.status)}
          </p>
          <div className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
            <p className="flex items-start" style={{ marginBottom: "var(--c97-sp-0)", gap: "var(--c97-sp-1)" }}>
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {tournament.course}
                <br />
                {tournament.location}
              </span>
            </p>
            <p className="mb-0 flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
              <Flag className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{formatDateRange(tournament.startDate, tournament.endDate)}</span>
            </p>

          </div>
        </div>

        <GolfLeaderboard
          entries={summary.leaderboard}
          cutLine={tournament.cutLine}
          cutState={tournament.cutState}
          cutCount={tournament.cutCount}
          coursePar={tournament.coursePar}
          rounds={roundCount}
        />
      </Catalog97ProjectHero>

      <section id="golf-board" className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-3)" }}>
            <h2 className="c97-poster-sm">The board</h2>
            <div className="c97-segmented" role="tablist" aria-label="Golf view switcher">
              {GOLF_VIEW_OPTIONS.map((view) => (
                <button
                  key={view}
                  type="button"
                  role="tab"
                  id={`golf-tab-${view}`}
                  aria-controls={`golf-tabpanel-${view}`}
                  aria-selected={routeState.view === view}
                  onClick={() => handleViewChange(view)}
                  className="min-h-[44px] text-sm font-semibold"
                >
                  {GOLF_VIEW_LABELS[view]}
                </button>
              ))}
            </div>

            <div
              className="flex flex-col" style={{ rowGap: "var(--c97-sp-2)" }}
              role="tabpanel"
              id={`golf-tabpanel-${routeState.view}`}
              aria-labelledby={`golf-tab-${routeState.view}`}
            >
              <p className="c97-prose">
                {routeState.view === "leaderboard"
                  ? "The table when you want the fastest read on score, round splits, and movement."
                  : "The player cards when you want a softer scan that still keeps score and momentum visible."}
              </p>

              {summary.leaderboard.length === 0 ? (
                <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
                  No player is available in the current snapshot.
                </p>
              ) : null}

              {routeState.view === "leaderboard" ? (
                <LeaderboardTable
                  rows={boardRows}
                  selectedPlayerId={selectedPlayerId}
                  onSelectPlayer={handlePlayerChange}
                />
              ) : (
                <PlayerCards
                  rows={boardRows}
                  selectedPlayerId={selectedPlayerId}
                  onSelectPlayer={handlePlayerChange}
                  coursePar={tournament.coursePar}
                />
              )}

              {summary.leaderboard.length > BOARD_LIMIT ? (
                <button
                  type="button"
                  className="c97-btn-ghost"
                  style={{ alignSelf: "flex-start" }}
                  aria-expanded={showAllPlayers}
                  onClick={() => setShowAllPlayers((current) => !current)}
                >
                  {showAllPlayers
                    ? `Show the top ${BOARD_LIMIT}`
                    : `Show all ${summary.leaderboard.length} players`}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="flex flex-col c97-shell" style={{ rowGap: "var(--c97-sp-2)" }}>
          <p className="c97-kicker">Snapshot note</p>
          <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
            This page is a checked-in tournament snapshot that refreshes on a schedule.
            Scores, movement, and player drilldowns reflect the local dataset shipped with the app.
          </p>
          <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
            The leaderboard, cut line, and player movement come from ESPN&apos;s public golf
            leaderboard API and refresh on a schedule, so figures can trail the broadcast.
            Between tournaments, and during team events like the Presidents Cup, I keep the
            last finished leaderboard up, since there is no individual board to show. Last
            checked {formatGeneratedAt(tournament.generatedAt)}.
          </p>
        </div>
      </section>

      {selectedRow ? (
        <DetailDrawer
          open={isDrawerOpen}
          title={selectedRow.playerName}
          onClose={() => setDrawerPlayerId(null)}
          resetKey={selectedRow.playerId}
          testId="golf-selected-player"
        >
          <div className="flex items-end justify-between" style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-2)" }}>
            <p className="c97-stat-delta" style={{ margin: 0 }}>{selectedRow.country}</p>
            <div className="text-right">
              <p className="c97-mono" style={{ margin: 0, fontSize: "var(--c97-fs-h1)", color: scoreColor(selectedRow.totalToPar) }}>
                {formatScoreToPar(selectedRow.totalToPar)}
              </p>
              <MovementPill movement={selectedRow.movement} />
            </div>
          </div>

          <div className="grid grid-cols-2" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
            <StatBlock label="Position" value={selectedRow.position} detail={selectedRow.status} />
            <StatBlock
              label="Today"
              value={formatScoreToPar(selectedRow.today)}
              detail={`Thru ${selectedRow.thru}`}
              valueColor={scoreColor(selectedRow.today)}
            />
          </div>

          {isPlayerSnapshotLoading ? (
            <p className="c97-prose" role="status" style={{ marginTop: "var(--c97-sp-3)", fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
              Loading player detail…
            </p>
          ) : null}

          {playerSnapshotError ? (
            <div style={{ marginTop: "var(--c97-sp-2)" }} role="alert">
              <div className="flex items-start" style={{ gap: "var(--c97-sp-1)" }}>
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--c97-negative)" }} aria-hidden="true" />
                <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
                  {playerSnapshotError}
                </p>
              </div>
            </div>
          ) : null}

          {playerSnapshot?.player ? (
            <div className="flex flex-col" style={{ marginTop: "var(--c97-sp-2)", rowGap: "var(--c97-sp-2)" }}>
              <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-1)", fontSize: "var(--c97-fs-small)" }}>
                <p className="flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
                  <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{playerSnapshot.player.country}</span>
                </p>
                <p className="flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
                  <Gauge className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Next round tee time {playerSnapshot.tournamentStatus.nextTeeTime ?? "TBD"}</span>
                </p>
                <p className="mb-0 flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
                  <Trophy className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{playerSnapshot.tournamentStatus.status}</span>
                </p>
              </div>

              <div>
                <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Round by round</p>
                <table className="c97-table">
                  <caption className="sr-only">Round by round scoring for {selectedRow.playerName}</caption>
                  <thead>
                    <tr>
                      <th scope="col">Round</th>
                      <th scope="col" data-align="end">Score</th>
                      <th scope="col" data-align="end">To par</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerSnapshot.roundByRound.map((round) => (
                      <tr key={round.round}>
                        <td>{round.round}</td>
                        <td className="c97-mono" data-align="end">{round.score}</td>
                        <td className="c97-mono" data-align="end" style={{ color: scoreColor(round.relativeToPar) }}>
                          {formatScoreToPar(round.relativeToPar)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Scoring split</p>
                {/* The feed sends zeros when it has no hole data, and a winner with no birdies is not a real reading. */}
                {playerSnapshot.scoring.birdies +
                  playerSnapshot.scoring.bogeys +
                  playerSnapshot.scoring.pars +
                  playerSnapshot.scoring.eagles >
                0 ? (
                  <div className="grid grid-cols-2" style={{ gap: "var(--c97-sp-1)" }}>
                    <StatBlock label="Birdies" value={`${playerSnapshot.scoring.birdies}`} detail="Opportunities converted" />
                    <StatBlock label="Bogeys" value={`${playerSnapshot.scoring.bogeys}`} detail="Dropped shots" />
                    <StatBlock label="Pars" value={`${playerSnapshot.scoring.pars}`} detail="Steady holes" />
                    <StatBlock label="Eagles" value={`${playerSnapshot.scoring.eagles}`} detail="Round-changing swings" />
                  </div>
                ) : (
                  <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
                    The snapshot carries no birdie, par, or bogey counts for this event, so I only show the rounds.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </DetailDrawer>
      ) : null}
    </>
  );
}
