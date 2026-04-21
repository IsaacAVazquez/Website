"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CircleAlert,
  Flag,
  Gauge,
  MapPin,
  TimerReset,
  Trophy,
  UserRound,
} from "lucide-react";
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

interface GolfClientProps {
  initialState: GolfRouteState;
  summary: GolfSummary;
  initialPlayerSnapshot: GolfPlayerSnapshot | null;
}

const LAST_UPDATED_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const DATE_RANGE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatScoreToPar(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (value === 0) {
    return "E";
  }

  return value > 0 ? `+${value}` : `${value}`;
}

function formatGeneratedAt(value: string | null | undefined): string {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : LAST_UPDATED_FORMATTER.format(date);
}

function formatDateRange(startDate: string, endDate: string): string {
  return `${DATE_RANGE_FORMATTER.format(new Date(startDate))} – ${DATE_RANGE_FORMATTER.format(
    new Date(endDate)
  )}`;
}

function getViewButtonStyle(isActive: boolean): CSSProperties {
  if (isActive) {
    return {
      borderColor: "color-mix(in srgb, var(--color-warning) 36%, var(--home-rule))",
      background: "color-mix(in srgb, var(--color-warning) 10%, var(--home-paper-alt))",
      color: "var(--home-ink)",
      boxShadow: "var(--shadow-sm)",
    };
  }

  return {
    borderColor: "var(--home-rule)",
    background: "var(--home-paper-alt)",
    color: "var(--home-ink-muted)",
  };
}

function getMovementStyle(movement: number): CSSProperties {
  if (movement > 0) {
    return {
      color: "var(--color-success)",
      borderColor: "color-mix(in srgb, var(--color-success) 28%, var(--home-rule))",
      background: "color-mix(in srgb, var(--color-success) 10%, var(--home-paper-alt))",
    };
  }

  if (movement < 0) {
    return {
      color: "var(--color-error)",
      borderColor: "color-mix(in srgb, var(--color-error) 28%, var(--home-rule))",
      background: "color-mix(in srgb, var(--color-error) 10%, var(--home-paper-alt))",
    };
  }

  return {
    color: "var(--home-ink-muted)",
    borderColor: "var(--home-rule)",
    background: "var(--home-paper-alt)",
  };
}

function getMovementLabel(movement: number): string {
  if (movement > 0) {
    return `Up ${movement}`;
  }

  if (movement < 0) {
    return `Down ${Math.abs(movement)}`;
  }

  return "Steady";
}

function getRowStyle(isSelected: boolean): CSSProperties {
  if (isSelected) {
    return {
      background: "color-mix(in srgb, var(--color-warning) 7%, var(--home-paper-alt))",
      borderColor: "color-mix(in srgb, var(--color-warning) 30%, var(--home-rule))",
    };
  }

  return {
    background: "var(--home-paper-alt)",
    borderColor: "var(--home-rule)",
  };
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
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div
      className="rounded-[24px] px-5 py-4"
      style={{
        background: "color-mix(in srgb, var(--home-paper-alt) 84%, white)",
        border: "1px solid var(--home-rule)",
      }}
    >
      <p className="home-kicker mb-1">{label}</p>
      <p
        className="mb-1 text-2xl"
        style={{
          fontFamily: "var(--font-home-sans)",
          color: "var(--home-ink)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </p>
      <p
        className="mb-0 text-sm leading-6"
        style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
      >
        {detail}
      </p>
    </div>
  );
}

function ScorePill({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        background: "color-mix(in srgb, var(--home-paper-alt) 84%, white)",
        border: "1px solid var(--home-rule)",
        color: "var(--home-ink)",
        fontFamily: "var(--font-home-sans)",
      }}
    >
      {value}
    </span>
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
  return (
    <div className="hidden overflow-hidden rounded-[28px] border md:block" style={{ borderColor: "var(--home-rule)" }}>
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr
            style={{
              background: "color-mix(in srgb, var(--home-paper-alt) 70%, white)",
              color: "var(--home-ink-muted)",
            }}
          >
            {["Pos", "Player", "Total", "Today", "R1", "R2", "Move"].map((label) => (
              <th
                key={label}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]"
                style={{ fontFamily: "var(--font-home-sans)" }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = row.playerId === selectedPlayerId;

            return (
              <tr key={row.playerId}>
                <td colSpan={7} className="p-0">
                  <div
                    className="grid grid-cols-[72px_minmax(0,1.7fr)_90px_90px_70px_70px_110px] border-t px-4 py-3"
                    style={getRowStyle(isSelected)}
                  >
                    <div
                      className="flex items-center text-sm font-semibold"
                      style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                    >
                      {row.position}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectPlayer(row.playerId)}
                      className="flex min-h-[44px] items-center text-left"
                      style={{ fontFamily: "var(--font-home-sans)" }}
                    >
                      <span className="min-w-0">
                        <span className="block text-base font-semibold" style={{ color: "var(--home-ink)" }}>
                          {row.playerName}
                        </span>
                        <span className="block text-sm" style={{ color: "var(--home-ink-muted)" }}>
                          {row.country}
                        </span>
                      </span>
                    </button>
                    <div className="flex items-center text-sm font-semibold" style={{ color: "var(--home-ink)" }}>
                      {formatScoreToPar(row.totalToPar)}
                    </div>
                    <div className="flex items-center text-sm" style={{ color: "var(--home-ink-muted)" }}>
                      {formatScoreToPar(row.today)}
                    </div>
                    <div className="flex items-center text-sm" style={{ color: "var(--home-ink-muted)" }}>
                      {row.roundScores[0]}
                    </div>
                    <div className="flex items-center text-sm" style={{ color: "var(--home-ink-muted)" }}>
                      {row.roundScores[1]}
                    </div>
                    <div className="flex items-center">
                      <span
                        className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold"
                        style={getMovementStyle(row.movement)}
                      >
                        {getMovementLabel(row.movement)}
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MobileLeaderboardCards({
  rows,
  selectedPlayerId,
  onSelectPlayer,
}: {
  rows: GolfLeaderboardEntry[];
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
}) {
  return (
    <div className="space-y-3 md:hidden">
      {rows.map((row) => {
        const isSelected = row.playerId === selectedPlayerId;

        return (
          <button
            key={row.playerId}
            type="button"
            onClick={() => onSelectPlayer(row.playerId)}
            className="w-full rounded-[24px] border px-4 py-4 text-left"
            style={getRowStyle(isSelected)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="home-kicker mb-0">{row.position}</p>
                <h3
                  className="mb-0 text-lg"
                  style={{
                    fontFamily: "var(--font-home-sans)",
                    color: "var(--home-ink)",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {row.playerName}
                </h3>
                <p
                  className="mb-0 text-sm"
                  style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
                >
                  {row.country}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="mb-1 text-xl"
                  style={{
                    color: "var(--home-ink)",
                    fontFamily: "var(--font-home-sans)",
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {formatScoreToPar(row.totalToPar)}
                </p>
                <span
                  className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold"
                  style={getMovementStyle(row.movement)}
                >
                  {getMovementLabel(row.movement)}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              <StatBlock label="Today" value={formatScoreToPar(row.today)} detail={row.status} />
              <StatBlock label="R1" value={`${row.roundScores[0]}`} detail="Opening round" />
              <StatBlock label="R2" value={`${row.roundScores[1]}`} detail="Second round" />
              <StatBlock label="Thru" value={row.thru} detail="Tournament status" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PlayerCards({
  rows,
  selectedPlayerId,
  onSelectPlayer,
}: {
  rows: GolfLeaderboardEntry[];
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rows.map((row) => {
        const isSelected = row.playerId === selectedPlayerId;

        return (
          <button
            key={row.playerId}
            type="button"
            onClick={() => onSelectPlayer(row.playerId)}
            className="rounded-[26px] border px-5 py-5 text-left"
            style={getRowStyle(isSelected)}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="home-kicker mb-1">{row.position}</p>
                <h3
                  className="mb-1 text-xl"
                  style={{
                    fontFamily: "var(--font-home-sans)",
                    color: "var(--home-ink)",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {row.playerName}
                </h3>
                <p
                  className="mb-0 text-sm"
                  style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
                >
                  {row.country}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="mb-1 text-2xl"
                  style={{
                    color: "var(--home-ink)",
                    fontFamily: "var(--font-home-sans)",
                    fontWeight: 700,
                    letterSpacing: "-0.05em",
                  }}
                >
                  {formatScoreToPar(row.totalToPar)}
                </p>
                <p
                  className="mb-0 text-sm"
                  style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
                >
                  Today {formatScoreToPar(row.today)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {row.roundScores.map((score, index) => (
                <ScorePill key={`${row.playerId}-${index}`.toString()} value={score} />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p
                className="mb-0 text-sm"
                style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
              >
                {row.status}
              </p>
              <span
                className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold"
                style={getMovementStyle(row.movement)}
              >
                {getMovementLabel(row.movement)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function GolfClient({
  initialState,
  summary,
  initialPlayerSnapshot,
}: GolfClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const currentHref = `${GOLF_ROUTE}${currentQuery ? `?${currentQuery}` : ""}`;
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
    {
      view: routeState.view,
      player: canonicalPlayerParam,
    },
    searchParams
  );
  const [playerSnapshots, setPlayerSnapshots] = useState<Record<string, GolfPlayerSnapshot>>(
    () => (selectedPlayerId && initialPlayerSnapshot ? { [selectedPlayerId]: initialPlayerSnapshot } : {})
  );
  const [playerSnapshotErrors, setPlayerSnapshotErrors] = useState<Record<string, string>>({});
  const playerSnapshot = selectedPlayerId ? playerSnapshots[selectedPlayerId] ?? null : null;
  const playerSnapshotError = selectedPlayerId ? playerSnapshotErrors[selectedPlayerId] ?? null : null;
  const isPlayerSnapshotLoading = Boolean(
    selectedPlayerId && !playerSnapshot && !playerSnapshotError
  );
  const tournament = summary.tournament;
  const selectedRow = summary.leaderboard.find((row) => row.playerId === selectedPlayerId) ?? null;

  useEffect(() => {
    if (currentHref === desiredHref) {
      return;
    }

    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  useEffect(() => {
    if (!selectedPlayerId) {
      return;
    }

    if (playerSnapshots[selectedPlayerId]) {
      return;
    }

    if (playerSnapshotErrors[selectedPlayerId]) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    fetchGolfPlayerSnapshot(selectedPlayerId, controller.signal)
      .then((snapshot) => {
        if (cancelled) {
          return;
        }

        setPlayerSnapshots((current) => (
          current[selectedPlayerId] ? current : { ...current, [selectedPlayerId]: snapshot }
        ));
        setPlayerSnapshotErrors((current) => {
          if (!(selectedPlayerId in current)) {
            return current;
          }

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
      })

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [playerSnapshotErrors, playerSnapshots, selectedPlayerId]);

  function navigate(nextState: GolfRouteState) {
    const href = buildGolfHref(nextState, searchParams);
    if (href === currentHref) {
      return;
    }

    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function handleViewChange(view: GolfView) {
    navigate({
      view,
      player: canonicalPlayerParam ?? DEFAULT_GOLF_STATE.player,
    });
  }

  function handlePlayerChange(playerId: string) {
    navigate({
      view: routeState.view,
      player: playerId,
    });
  }

  if (!tournament) {
    return (
      <section className="home-page min-h-screen">
        <div className="home-shell home-section">
          <div className="rounded-[28px] border px-6 py-8" style={{ borderColor: "var(--home-rule)" }}>
            <p className="home-kicker">Golf</p>
            <h1
              className="mb-3"
              style={{
                fontFamily: "var(--font-home-sans)",
                color: "var(--home-ink)",
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                fontWeight: 700,
                letterSpacing: "-0.06em",
                lineHeight: 0.94,
              }}
            >
              PGA Tour Pulse
            </h1>
            <p
              className="mb-0 max-w-[52ch] text-base leading-7"
              style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
            >
              The snapshot for this tournament is not available yet.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="home-page min-h-screen">
      <div className="home-shell home-section space-y-8">
        <div
          className="overflow-hidden rounded-[34px] border p-6 sm:p-8"
          style={{
            borderColor: "color-mix(in srgb, var(--color-warning) 28%, var(--home-rule))",
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--color-warning) 10%, white), color-mix(in srgb, var(--home-paper-alt) 82%, white))",
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="home-kicker">PGA Tour</span>
                <span className="home-pill">{tournament.roundLabel}</span>
              </div>

              <div className="space-y-3">
                <h1
                  className="mb-0"
                  style={{
                    fontFamily: "var(--font-home-sans)",
                    color: "var(--home-ink)",
                    fontSize: "clamp(2.7rem, 6vw, 5rem)",
                    fontWeight: 700,
                    letterSpacing: "-0.08em",
                    lineHeight: 0.92,
                  }}
                >
                  PGA Tour Pulse
                </h1>
                <p
                  className="mb-0 max-w-[52ch] text-base leading-7 sm:text-lg"
                  style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
                >
                  I wanted the board, the cut line, and player movement in one calm screen. This
                  snapshot keeps the tournament context visible without pretending it is a live feed.
                </p>
              </div>
            </div>

            <div
              className="rounded-[28px] border px-5 py-5"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper-alt) 86%, white)",
              }}
            >
              <p className="home-kicker mb-2">This week</p>
              <h2
                className="mb-2 text-2xl"
                style={{
                  fontFamily: "var(--font-home-sans)",
                  color: "var(--home-ink)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                }}
              >
                {tournament.name}
              </h2>
              <div className="space-y-3 text-sm leading-6" style={{ color: "var(--home-ink-muted)" }}>
                <p className="mb-0 flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {tournament.course}
                    <br />
                    {tournament.location}
                  </span>
                </p>
                <p className="mb-0 flex items-center gap-2">
                  <Flag className="h-4 w-4 shrink-0" />
                  <span>{formatDateRange(tournament.startDate, tournament.endDate)}</span>
                </p>
                <p className="mb-0 flex items-center gap-2">
                  <TimerReset className="h-4 w-4 shrink-0" />
                  <span>Snapshot refreshed {formatGeneratedAt(tournament.generatedAt)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatBlock
            label="Leader"
            value={`${summary.heroStats.leaderName ?? "—"} ${formatScoreToPar(summary.heroStats.leaderScore)}`}
            detail="Top of the board after 36 holes."
          />
          <StatBlock
            label="Cut line"
            value={
              summary.heroStats.cutLine === null
                ? "No cut"
                : formatScoreToPar(summary.heroStats.cutLine)
            }
            detail="Projected line into the weekend."
          />
          <StatBlock
            label="Under par"
            value={`${summary.heroStats.playersUnderPar}`}
            detail="Players sitting in red numbers."
          />
          <StatBlock
            label="Field"
            value={`${summary.heroStats.fieldSize}`}
            detail={tournament.status}
          />
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.92fr)]">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Golf view switcher">
              {GOLF_VIEW_OPTIONS.map((view) => (
                <button
                  key={view}
                  type="button"
                  role="tab"
                  aria-selected={routeState.view === view}
                  onClick={() => handleViewChange(view)}
                  className="min-h-[44px] rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors"
                  style={getViewButtonStyle(routeState.view === view)}
                >
                  {GOLF_VIEW_LABELS[view]}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="home-kicker mb-0">
                  {routeState.view === "leaderboard" ? "Leaderboard" : "Player cards"}
                </p>
                <p
                  className="mb-0 text-sm leading-6"
                  style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
                >
                  {routeState.view === "leaderboard"
                    ? "Use the table when you want the fastest read on score, round splits, and movement."
                    : "Use the player cards when you want a softer scan that still keeps score and momentum visible."}
                </p>
              </div>

              {routeState.view === "leaderboard" ? (
                <>
                  <LeaderboardTable
                    rows={summary.leaderboard}
                    selectedPlayerId={selectedPlayerId}
                    onSelectPlayer={handlePlayerChange}
                  />
                  <MobileLeaderboardCards
                    rows={summary.leaderboard}
                    selectedPlayerId={selectedPlayerId}
                    onSelectPlayer={handlePlayerChange}
                  />
                </>
              ) : (
                <PlayerCards
                  rows={summary.leaderboard}
                  selectedPlayerId={selectedPlayerId}
                  onSelectPlayer={handlePlayerChange}
                />
              )}
            </div>

            <div
              className="rounded-[26px] border px-5 py-5"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper-alt) 82%, white)",
              }}
            >
              <p className="home-kicker mb-2">Snapshot note</p>
              <p
                className="mb-0 text-sm leading-7"
                style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
              >
                This page is a checked-in tournament snapshot rather than a live PGA Tour feed.
                Scores, movement, and player drilldowns reflect the local dataset shipped with the app.
              </p>
            </div>
          </div>

          <aside className="space-y-4">
            <div
              className="rounded-[30px] border px-5 py-5 sm:px-6"
              style={{
                borderColor: "color-mix(in srgb, var(--color-warning) 22%, var(--home-rule))",
                background: "color-mix(in srgb, var(--home-paper-alt) 84%, white)",
              }}
            >
              <p className="home-kicker mb-2">Selected player</p>

              {selectedRow ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2
                        className="mb-1 text-2xl"
                        style={{
                          fontFamily: "var(--font-home-sans)",
                          color: "var(--home-ink)",
                          fontWeight: 700,
                          letterSpacing: "-0.04em",
                        }}
                      >
                        {selectedRow.playerName}
                      </h2>
                      <p
                        className="mb-0 text-sm"
                        style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
                      >
                        {selectedRow.country}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="mb-1 text-3xl"
                        style={{
                          color: "var(--home-ink)",
                          fontFamily: "var(--font-home-sans)",
                          fontWeight: 700,
                          letterSpacing: "-0.05em",
                        }}
                      >
                        {formatScoreToPar(selectedRow.totalToPar)}
                      </p>
                      <span
                        className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold"
                        style={getMovementStyle(selectedRow.movement)}
                      >
                        {getMovementLabel(selectedRow.movement)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <StatBlock label="Position" value={selectedRow.position} detail={selectedRow.status} />
                    <StatBlock label="Today" value={formatScoreToPar(selectedRow.today)} detail={`Thru ${selectedRow.thru}`} />
                  </div>

                  {isPlayerSnapshotLoading ? (
                    <p
                      className="mb-0 mt-5 text-sm"
                      role="status"
                      style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
                    >
                      Loading player detail…
                    </p>
                  ) : null}

                  {playerSnapshotError ? (
                    <div
                      className="mt-5 rounded-[22px] border px-4 py-4"
                      role="alert"
                      style={{
                        borderColor: "color-mix(in srgb, var(--color-error) 24%, var(--home-rule))",
                        background: "color-mix(in srgb, var(--color-error) 8%, var(--home-paper-alt))",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <CircleAlert
                          className="mt-0.5 h-4 w-4 shrink-0"
                          style={{ color: "var(--color-error)" }}
                        />
                        <p
                          className="mb-0 text-sm leading-6"
                          style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                        >
                          {playerSnapshotError}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {playerSnapshot?.player ? (
                    <div className="mt-5 space-y-5">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <div
                          className="rounded-[22px] border px-4 py-4"
                          style={{
                            borderColor: "var(--home-rule)",
                            background: "color-mix(in srgb, var(--home-paper-alt) 88%, white)",
                          }}
                        >
                          <p className="home-kicker mb-2">Player profile</p>
                          <div className="space-y-2 text-sm leading-6">
                            <p className="mb-0 flex items-center gap-2">
                              <UserRound className="h-4 w-4 shrink-0" />
                              <span>{playerSnapshot.player.country}</span>
                            </p>
                            <p className="mb-0 flex items-center gap-2">
                              <Gauge className="h-4 w-4 shrink-0" />
                              <span>
                                Next round tee time {playerSnapshot.tournamentStatus.nextTeeTime ?? "TBD"}
                              </span>
                            </p>
                            <p className="mb-0 flex items-center gap-2">
                              <Trophy className="h-4 w-4 shrink-0" />
                              <span>{playerSnapshot.tournamentStatus.status}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        className="rounded-[22px] border px-4 py-4"
                        style={{
                          borderColor: "var(--home-rule)",
                          background: "color-mix(in srgb, var(--home-paper-alt) 88%, white)",
                        }}
                      >
                        <p className="home-kicker mb-3">Round by round</p>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                          {playerSnapshot.roundByRound.map((round) => (
                            <div
                              key={round.round}
                              className="rounded-[18px] border px-4 py-3"
                              style={{
                                borderColor: "var(--home-rule)",
                                background: "white",
                              }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p
                                  className="mb-0 text-sm font-semibold"
                                  style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                                >
                                  Round {round.round}
                                </p>
                                <p
                                  className="mb-0 text-sm"
                                  style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
                                >
                                  {round.score} ({formatScoreToPar(round.relativeToPar)})
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div
                        className="rounded-[22px] border px-4 py-4"
                        style={{
                          borderColor: "var(--home-rule)",
                          background: "color-mix(in srgb, var(--home-paper-alt) 88%, white)",
                        }}
                      >
                        <p className="home-kicker mb-3">Scoring split</p>
                        <div className="grid grid-cols-2 gap-3">
                          <StatBlock
                            label="Birdies"
                            value={`${playerSnapshot.scoring.birdies}`}
                            detail="Opportunities converted"
                          />
                          <StatBlock
                            label="Bogeys"
                            value={`${playerSnapshot.scoring.bogeys}`}
                            detail="Dropped shots"
                          />
                          <StatBlock
                            label="Pars"
                            value={`${playerSnapshot.scoring.pars}`}
                            detail="Steady holes"
                          />
                          <StatBlock
                            label="Eagles"
                            value={`${playerSnapshot.scoring.eagles}`}
                            detail="Round-changing swings"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <p
                  className="mb-0 text-sm leading-6"
                  style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
                >
                  No player is available in the current snapshot.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
