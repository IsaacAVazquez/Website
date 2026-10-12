"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert } from "lucide-react";
import type {
  GolfLeaderboardEntry,
  GolfPlayerSnapshot,
  GolfRouteState,
  GolfSummary,
  GolfTournament,
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
import { formatScoreToPar, leaderboardSlats, type ParTone } from "./leaderboard";
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

/** Under par prints in golf's red; even and over stay ink. */
function toneOf(value: number | null | undefined): ParTone | undefined {
  if (value === null || value === undefined) return undefined;
  return value < 0 ? "under" : value > 0 ? "over" : "even";
}

/** Movement as the board prints it: an arrow and the places, with the words for a screen reader. */
function Movement({ movement }: { movement: number }) {
  const glyph = movement > 0 ? "\u2191" : movement < 0 ? "\u2193" : "\u2013";
  const label = movement > 0 ? `Up ${movement}` : movement < 0 ? `Down ${Math.abs(movement)}` : "Steady";
  return (
    <span className="golf-move" data-move={movement > 0 ? "up" : movement < 0 ? "down" : "flat"}>
      <span aria-hidden="true">
        {glyph}
        {movement !== 0 ? Math.abs(movement) : ""}
      </span>
      <span className="sr-only">{label}</span>
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

function LeaderboardTable({
  rows,
  selectedPlayerId,
  onSelectPlayer,
  coursePar,
  cutLine,
  cutState,
  cutCount,
}: {
  rows: GolfLeaderboardEntry[];
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
  coursePar: number;
  cutLine: number | null;
  cutState: GolfTournament["cutState"];
  cutCount: number | null;
}) {
  const roundCount = Math.min(
    4,
    rows.reduce((max, row) => Math.max(max, row.roundScores.length), 0)
  );
  const roundLabels = Array.from({ length: roundCount }, (_, i) => `R${i + 1}`);
  // The slats carry each round's tone and where the cut line falls on the rows shown.
  const { slats, cutIndex } = leaderboardSlats(rows, { cutLine, cutState, coursePar, rounds: roundCount });
  const span = 5 + roundCount;

  return (
    <div className="golf-scroll" role="region" aria-label="Full leaderboard (scrollable)" tabIndex={0}>
      <table className="golf-slats">
        <caption className="sr-only">
          PGA Tour Pulse leaderboard with position, total, today&apos;s score, holes played, round scores, and
          movement.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="golf-col-pos">Pos</th>
            <th scope="col" className="golf-col-player">Player</th>
            <th scope="col" className="golf-num">
              <abbr title="Total to par">Total</abbr>
            </th>
            <th scope="col" className="golf-num">Today</th>
            <th scope="col" className="golf-num golf-wide">Thru</th>
            {roundLabels.map((label, i) => (
              <th key={label} scope="col" className="golf-num golf-wide">
                <abbr title={`Round ${i + 1}`}>{label}</abbr>
              </th>
            ))}
            <th scope="col" className="golf-num golf-wide">
              <abbr title="Places moved today">Move</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const isSelected = row.playerId === selectedPlayerId;
            const slat = slats[index];
            return (
              <Fragment key={row.playerId}>
                <tr aria-current={isSelected ? "true" : undefined} data-made-cut={slat?.madeCut === false ? "false" : undefined}>
                  <th scope="row" className="golf-col-pos">
                    {row.position}
                  </th>
                  <td className="golf-col-player">
                    <button
                      type="button"
                      onClick={() => onSelectPlayer(row.playerId)}
                      aria-haspopup="dialog"
                      className="golf-name"
                    >
                      <span className="golf-name-text">{row.playerName}</span>{" "}
                      <span className="golf-country">{row.country}</span>
                    </button>
                  </td>
                  <td className="golf-num golf-total" data-tone={toneOf(row.totalToPar)}>
                    {formatScoreToPar(row.totalToPar)}
                  </td>
                  <td className="golf-num" data-tone={toneOf(row.today)}>
                    {formatScoreToPar(row.today)}
                  </td>
                  <td className="golf-num golf-wide">{row.thru}</td>
                  {roundLabels.map((label, i) => (
                    <td key={label} className="golf-num golf-wide" data-tone={slat?.rounds[i]?.tone ?? undefined}>
                      {row.roundScores[i] != null ? String(row.roundScores[i]) : "—"}
                    </td>
                  ))}
                  <td className="golf-num golf-wide">
                    <Movement movement={row.movement} />
                  </td>
                </tr>
                {cutIndex === index && index < rows.length - 1 ? (
                  <tr className="golf-cutline">
                    <td colSpan={span}>
                      {`Cut line ${formatScoreToPar(cutLine)}${cutCount !== null ? `, ${cutCount} players advanced` : ""}`}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
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
    <ul className="golf-cards">
      {rows.map((row) => {
        const isSelected = row.playerId === selectedPlayerId;
        // The latest round is a partial stroke count while the player is on
        // the course, so its tone borrows the live to-par figure, as the slats do.
        const latestIsPartial = row.thru !== "F" && row.thru !== "—";

        return (
          <li key={row.playerId}>
            <button
              type="button"
              onClick={() => onSelectPlayer(row.playerId)}
              aria-current={isSelected ? "true" : undefined}
              aria-haspopup="dialog"
              className="c97-golf-card"
            >
              <span className="golf-card-head">
                <span className="golf-card-pos">{row.position}</span>
                <span className="golf-card-name">{row.playerName}</span>
                <span className="golf-card-total" data-tone={toneOf(row.totalToPar)}>
                  {formatScoreToPar(row.totalToPar)}
                </span>
              </span>
              <span className="golf-card-line">
                <span>{row.country}</span>
                <span>
                  Today <span data-tone={toneOf(row.today)}>{formatScoreToPar(row.today)}</span>
                </span>
              </span>
              <span className="golf-card-line">
                <span className="golf-card-rounds">
                  {row.roundScores.map((score, index) => (
                    <span
                      key={index}
                      data-tone={toneOf(
                        latestIsPartial && index === row.roundScores.length - 1 ? row.today : score - coursePar
                      )}
                    >
                      {score}
                    </span>
                  ))}
                </span>
                <span>
                  {row.status} <Movement movement={row.movement} />
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
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

  const pushHref = useRouteSync(GOLF_ROUTE, desiredHref);
  // The player drawer starts open only for a link that names a player, and
  // after that only `handlePlayerChange` opens it. It holds the player that
  // was asked for and waits for the route to reach them, so it never shows
  // the last one.
  const [drawerPlayerId, setDrawerPlayerId] = useState<string | null>(canonicalPlayerParam);
  const isDrawerOpen = drawerPlayerId !== null && drawerPlayerId === selectedPlayerId;
  // The board prints its first BOARD_LIMIT players. A link to a player further
  // down starts on the whole field, so their row is on the board.
  const selectedIndex = summary.leaderboard.findIndex((row) => row.playerId === selectedPlayerId);
  const [showAllPlayers, setShowAllPlayers] = useState(() => selectedIndex >= BOARD_LIMIT);
  // A later client-side link can name a player further down too, so each new
  // selection below the limit opens the whole field, while the toggle still
  // works for the player already chosen.
  const [expandedFor, setExpandedFor] = useState(selectedPlayerId);
  if (expandedFor !== selectedPlayerId) {
    setExpandedFor(selectedPlayerId);
    if (selectedIndex >= BOARD_LIMIT) setShowAllPlayers(true);
  }
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
      <div className="golf-root">
        <div className="c97-shell c97-frame golf-column">
          <div className="golf-titlebar">
            <h1 className="golf-title">PGA Tour Pulse</h1>
            <p className="golf-on-ground">
              The leaderboard for this tournament is not in the snapshot yet, so it fills in after the next refresh.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const cutSummary =
    tournament.cutState === "none"
      ? "No cut, the full field plays every round"
      : tournament.cutLine !== null
        ? `Cut ${formatScoreToPar(tournament.cutLine)}${tournament.cutCount !== null ? `, ${tournament.cutCount} advanced` : ""}`
        : "Cut to come";

  return (
    <div className="golf-root">
      <div className="c97-shell c97-frame golf-column">
        <div className="golf-titlebar">
          <h1 className="golf-title">PGA Tour Pulse</h1>
          <div className="golf-event">
            <h2 className="golf-event-name">{tournament.name}</h2>
            <p className="golf-event-meta">
              <span>{formatRoundStatus(tournament.roundLabel, tournament.status)}</span>
              <span>
                {tournament.course}, {tournament.location}
              </span>
              <span>{formatDateRange(tournament.startDate, tournament.endDate)}</span>
              <span>
                {tournament.fieldSize} players · {cutSummary}
              </span>
            </p>
          </div>
        </div>

        <section className="golf-board" aria-label="Leaderboard">
          <div className="golf-toolbar">
            <div className="golf-switch" role="tablist" aria-label="Golf view switcher">
              {GOLF_VIEW_OPTIONS.map((view) => (
                <button
                  key={view}
                  type="button"
                  role="tab"
                  id={`golf-tab-${view}`}
                  aria-controls={`golf-tabpanel-${view}`}
                  aria-selected={routeState.view === view}
                  onClick={() => handleViewChange(view)}
                >
                  {GOLF_VIEW_LABELS[view]}
                </button>
              ))}
            </div>
            <p className="golf-on-ground golf-checked">
              {tournament.tour} · last checked {formatGeneratedAt(tournament.generatedAt)}
            </p>
          </div>

          <div
            className="golf-panel"
            role="tabpanel"
            id={`golf-tabpanel-${routeState.view}`}
            aria-labelledby={`golf-tab-${routeState.view}`}
          >
            {summary.leaderboard.length === 0 ? (
              <p className="golf-on-ground">No player is available in the current snapshot.</p>
            ) : routeState.view === "leaderboard" ? (
              <LeaderboardTable
                rows={boardRows}
                selectedPlayerId={selectedPlayerId}
                onSelectPlayer={handlePlayerChange}
                coursePar={tournament.coursePar}
                cutLine={tournament.cutLine}
                cutState={tournament.cutState}
                cutCount={tournament.cutCount}
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
                className="golf-more"
                aria-expanded={showAllPlayers}
                onClick={() => setShowAllPlayers((current) => !current)}
              >
                {showAllPlayers ? `Show the top ${BOARD_LIMIT}` : `Show all ${summary.leaderboard.length} players`}
              </button>
            ) : null}
          </div>
        </section>

        <p className="golf-source">
          This page is a checked-in tournament snapshot of ESPN&apos;s public golf leaderboard API that refreshes on a
          schedule, so figures can trail the broadcast. Between tournaments, and during team events like the
          Presidents Cup, I keep the last finished leaderboard up, since there is no individual board to show.
        </p>
      </div>

      {selectedRow ? (
        <DetailDrawer
          open={isDrawerOpen}
          title={selectedRow.playerName}
          onClose={() => setDrawerPlayerId(null)}
          resetKey={selectedRow.playerId}
          testId="golf-selected-player"
        >
          <p className="dd-tags">
            <span>{selectedRow.country}</span>
            <span>{selectedRow.status}</span>
            <Movement movement={selectedRow.movement} />
          </p>

          <dl className="dd-stats dd-section">
            {(
              [
                ["Position", selectedRow.position, undefined],
                ["Total", formatScoreToPar(selectedRow.totalToPar), toneOf(selectedRow.totalToPar)],
                ["Today", formatScoreToPar(selectedRow.today), toneOf(selectedRow.today)],
                ["Thru", selectedRow.thru, undefined],
              ] as const
            ).map(([label, value, tone]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd data-tone={tone}>{value}</dd>
              </div>
            ))}
          </dl>

          {isPlayerSnapshotLoading ? (
            <p className="dd-note" role="status">
              Loading player detail…
            </p>
          ) : null}

          {playerSnapshotError ? (
            <p className="dd-note golf-error" role="alert">
              <CircleAlert className="golf-error-icon" aria-hidden="true" />
              {playerSnapshotError}
            </p>
          ) : null}

          {playerSnapshot?.player ? (
            <>
              {/* A finished event has no next round, whatever tee time the feed still carries. */}
              <p className="dd-note">
                {tournament.completed
                  ? playerSnapshot.tournamentStatus.status
                  : `Next round tee time ${playerSnapshot.tournamentStatus.nextTeeTime ?? "TBD"}. ${playerSnapshot.tournamentStatus.status}`}
              </p>

              <div className="dd-section">
                <p className="dd-label">Round by round</p>
                <table className="golf-rounds">
                  <caption className="sr-only">Round by round scoring for {selectedRow.playerName}</caption>
                  <thead>
                    <tr>
                      <th scope="col">Round</th>
                      <th scope="col" className="golf-num">Score</th>
                      <th scope="col" className="golf-num">To par</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerSnapshot.roundByRound.map((round) => (
                      <tr key={round.round}>
                        <td>{round.round}</td>
                        <td className="golf-num">{round.score}</td>
                        <td className="golf-num" data-tone={toneOf(round.relativeToPar)}>
                          {formatScoreToPar(round.relativeToPar)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="dd-section">
                <p className="dd-label">Scoring split</p>
                {/* The feed sends zeros when it has no hole data, and a winner with no birdies is not a real reading. */}
                {playerSnapshot.scoring.birdies +
                  playerSnapshot.scoring.bogeys +
                  playerSnapshot.scoring.pars +
                  playerSnapshot.scoring.eagles >
                0 ? (
                  <dl className="dd-stats">
                    {(
                      [
                        ["Eagles", playerSnapshot.scoring.eagles],
                        ["Birdies", playerSnapshot.scoring.birdies],
                        ["Pars", playerSnapshot.scoring.pars],
                        ["Bogeys", playerSnapshot.scoring.bogeys],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="dd-note">
                    The snapshot carries no birdie, par, or bogey counts for this event, so I only show the rounds.
                  </p>
                )}
              </div>
            </>
          ) : null}
        </DetailDrawer>
      ) : null}
    </div>
  );
}
