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
  ArrowDown,
  ArrowUp,
  CircleAlert,
  Flag,
  Gauge,
  MapPin,
  Minus,
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
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";
import {
  Article,
  Briefcase,
  Calendar,
  ChartBar,
  User,
} from "@/components/ui/ServerIcons";

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

function getScoreToParColor(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) {
    return "var(--home-ink)";
  }

  return value < 0 ? "var(--home-positive)" : "var(--home-negative)";
}

function MovementGlyph({ movement }: { movement: number }) {
  if (movement > 0) {
    return <ArrowUp className="h-3 w-3" aria-hidden="true" />;
  }

  if (movement < 0) {
    return <ArrowDown className="h-3 w-3" aria-hidden="true" />;
  }

  return <Minus className="h-3 w-3" aria-hidden="true" />;
}

function MovementPill({ movement }: { movement: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={getMovementStyle(movement)}
    >
      <MovementGlyph movement={movement} />
      {getMovementLabel(movement)}
    </span>
  );
}

function formatGeneratedAt(value: string | null | undefined): string {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : LAST_UPDATED_FORMATTER.format(date);
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startValid = !Number.isNaN(start.getTime());
  const endValid = !Number.isNaN(end.getTime());

  if (startValid && endValid) {
    return `${DATE_RANGE_FORMATTER.format(start)} – ${DATE_RANGE_FORMATTER.format(end)}`;
  }
  if (endValid) {
    return DATE_RANGE_FORMATTER.format(end);
  }
  if (startValid) {
    return DATE_RANGE_FORMATTER.format(start);
  }
  return "Dates TBD";
}

function getViewButtonStyle(isActive: boolean): CSSProperties {
  if (isActive) {
    return {
      borderColor: "color-mix(in srgb, var(--home-signal) 36%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-signal) 10%, var(--home-paper-alt))",
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
      color: "var(--home-positive)",
      borderColor: "color-mix(in srgb, var(--home-positive) 28%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-positive) 10%, var(--home-paper-alt))",
    };
  }

  if (movement < 0) {
    return {
      color: "var(--home-negative)",
      borderColor: "color-mix(in srgb, var(--home-negative) 28%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-negative) 10%, var(--home-paper-alt))",
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
      background: "color-mix(in srgb, var(--home-signal) 7%, var(--home-paper-alt))",
      borderColor: "color-mix(in srgb, var(--home-signal) 30%, var(--home-rule))",
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
  valueColor,
}: {
  label: string;
  value: string;
  detail: string;
  valueColor?: string;
}) {
  return (
    <div
      className="rounded-[var(--radius-3xl)] px-5 py-4"
      style={{
        background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
        border: "1px solid var(--home-rule)",
      }}
    >
      <p className="home-kicker mb-1">{label}</p>
      <p
        className="mb-1 text-2xl"
        style={{
          fontFamily: "var(--font-home-sans)",
          color: valueColor ?? "var(--home-ink)",
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

function ScorePill({
  value,
  relativeToPar,
}: {
  value: number;
  relativeToPar?: number;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
        border: "1px solid var(--home-rule)",
        color: getScoreToParColor(relativeToPar ?? null),
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
    <div className="hidden overflow-hidden rounded-[var(--radius-3xl)] border md:block" style={{ borderColor: "var(--home-rule)" }}>
      <table className="w-full border-separate border-spacing-0">
        <caption className="sr-only">PGA Tour Pulse leaderboard with position, total, today&apos;s score, round scores, and movement.</caption>
        <colgroup>
          <col style={{ width: "72px" }} />
          <col />
          <col style={{ width: "90px" }} />
          <col style={{ width: "90px" }} />
          <col style={{ width: "70px" }} />
          <col style={{ width: "70px" }} />
          <col style={{ width: "120px" }} />
        </colgroup>
        <thead>
          <tr
            style={{
              background: "color-mix(in srgb, var(--home-paper-alt) 70%, var(--home-elev-mix))",
              color: "var(--home-ink-muted)",
            }}
          >
            {["Pos", "Player", "Total", "Today", "R1", "R2", "Move"].map((label) => (
              <th
                key={label}
                scope="col"
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
            const rowStyle = getRowStyle(isSelected);
            const cellStyle: CSSProperties = {
              background: rowStyle.background,
              borderTop: `1px solid ${rowStyle.borderColor}`,
              fontFamily: "var(--font-home-sans)",
            };
            const firstCellStyle: CSSProperties = {
              ...cellStyle,
              boxShadow: isSelected
                ? "inset 4px 0 0 0 var(--home-signal)"
                : undefined,
            };

            return (
              <tr key={row.playerId} aria-current={isSelected ? "true" : undefined}>
                <th
                  scope="row"
                  className="px-4 py-3 text-left align-middle text-sm font-semibold"
                  style={{ ...firstCellStyle, color: "var(--home-ink)" }}
                >
                  {row.position}
                </th>
                <td className="px-4 py-2" style={cellStyle}>
                  <button
                    type="button"
                    onClick={() => onSelectPlayer(row.playerId)}
                    className="flex min-h-[44px] w-full items-center text-left"
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
                </td>
                <td
                  className="px-4 py-3 align-middle text-sm font-semibold"
                  style={{ ...cellStyle, color: getScoreToParColor(row.totalToPar) }}
                >
                  {formatScoreToPar(row.totalToPar)}
                </td>
                <td
                  className="px-4 py-3 align-middle text-sm"
                  style={{ ...cellStyle, color: getScoreToParColor(row.today) }}
                >
                  {formatScoreToPar(row.today)}
                </td>
                <td
                  className="px-4 py-3 align-middle text-sm"
                  style={{ ...cellStyle, color: "var(--home-ink-muted)" }}
                >
                  {row.roundScores[0]}
                </td>
                <td
                  className="px-4 py-3 align-middle text-sm"
                  style={{ ...cellStyle, color: "var(--home-ink-muted)" }}
                >
                  {row.roundScores[1]}
                </td>
                <td className="px-4 py-3 align-middle" style={cellStyle}>
                  <MovementPill movement={row.movement} />
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
            aria-current={isSelected ? "true" : undefined}
            className="w-full rounded-[var(--radius-3xl)] border px-4 py-4 text-left"
            style={{
              ...getRowStyle(isSelected),
              boxShadow: isSelected ? "inset 4px 0 0 0 var(--home-signal)" : undefined,
            }}
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
                    color: getScoreToParColor(row.totalToPar),
                    fontFamily: "var(--font-home-sans)",
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {formatScoreToPar(row.totalToPar)}
                </p>
                <MovementPill movement={row.movement} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              <StatBlock
                label="Today"
                value={formatScoreToPar(row.today)}
                detail={row.status}
                valueColor={getScoreToParColor(row.today)}
              />
              <StatBlock
                label="R1"
                value={row.roundScores[0] != null ? String(row.roundScores[0]) : "—"}
                detail="Opening round"
              />
              <StatBlock
                label="R2"
                value={row.roundScores[1] != null ? String(row.roundScores[1]) : "—"}
                detail="Second round"
              />
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
  coursePar,
}: {
  rows: GolfLeaderboardEntry[];
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
  coursePar: number;
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
            aria-current={isSelected ? "true" : undefined}
            className="rounded-[var(--radius-3xl)] border px-5 py-5 text-left"
            style={{
              ...getRowStyle(isSelected),
              boxShadow: isSelected ? "inset 4px 0 0 0 var(--home-signal)" : undefined,
            }}
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
                    color: getScoreToParColor(row.totalToPar),
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
                  Today{" "}
                  <span style={{ color: getScoreToParColor(row.today), fontWeight: 600 }}>
                    {formatScoreToPar(row.today)}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {row.roundScores.map((score, index) => (
                <ScorePill
                  key={`${row.playerId}-${index}`.toString()}
                  value={score}
                  relativeToPar={score - coursePar}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p
                className="mb-0 text-sm"
                style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
              >
                {row.status}
              </p>
              <MovementPill movement={row.movement} />
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

  // Stats panel cells (computed regardless; safe to call when tournament is null)
  const scoringAverage = useMemo(() => {
    const scores = summary.leaderboard.flatMap((row) => row.roundScores ?? []).filter((value) =>
      Number.isFinite(value) && value > 0
    );
    if (scores.length === 0) return null;
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return sum / scores.length;
  }, [summary.leaderboard]);

  const statsPanelCells: HomeStatsCell[] = [
    {
      label: "Leader",
      tooltip: "Player at the top of the board after the most recent round.",
      value: summary.heroStats.leaderName
        ? `${summary.heroStats.leaderName} · ${formatScoreToPar(summary.heroStats.leaderScore)}`
        : "—",
    },
    {
      label: "Cut line",
      tooltip:
        summary.heroStats.cutState === "none"
          ? "This event has no cut — the full field plays all rounds."
          : summary.heroStats.cutCount !== null
            ? `Score at which the field gets trimmed for the weekend. ${summary.heroStats.cutCount} players made the cut.`
            : "Score at which the field gets trimmed for the weekend.",
      // Three-state so a cut still to come reads differently from an event with
      // no cut at all, instead of collapsing both to "TBD". Show the real to-par
      // cut once we have it; say "No cut" only when ESPN's format confirms it;
      // otherwise stay neutral with "TBD" rather than asserting a false "No cut".
      value:
        summary.heroStats.cutLine !== null
          ? formatScoreToPar(summary.heroStats.cutLine)
          : summary.heroStats.cutState === "none"
            ? "No cut"
            : "TBD",
    },
    {
      label: "Under par",
      tooltip: "Number of players currently shooting better than even par.",
      value: `${summary.heroStats.playersUnderPar}`,
    },
    {
      label: "Field",
      tooltip: "Total players in the tournament field.",
      value: `${summary.heroStats.fieldSize}`,
    },
    {
      label: "Round",
      tooltip: "Round of the tournament currently in progress or just completed.",
      value: tournament?.roundLabel ?? "—",
    },
    {
      label: "Course par",
      tooltip: "Total par for a single round at the host course.",
      value: tournament ? `${tournament.coursePar}` : "—",
    },
    {
      label: "Scoring average",
      tooltip: "Average round score across the visible field.",
      value: scoringAverage ? scoringAverage.toFixed(1) : "—",
    },
    {
      label: "Snapshot",
      tooltip: "Time the most recent snapshot was generated.",
      value: tournament ? formatGeneratedAt(tournament.generatedAt) : "Unavailable",
    },
  ];

  if (!tournament) {
    return (
      <section className="home-page min-h-screen">
        <div className="home-shell home-section">
          <div className="rounded-[var(--radius-3xl)] border px-6 py-8" style={{ borderColor: "var(--home-rule)" }}>
            <p className="home-kicker">Golf</p>
            <h1
              className="mb-3 text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[0.94] tracking-[-0.06em] text-[var(--home-ink)]"
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
          className="overflow-hidden rounded-[var(--radius-3xl)] border p-6 sm:p-8"
          style={{
            borderColor: "color-mix(in srgb, var(--home-signal) 28%, var(--home-rule))",
            background: "color-mix(in srgb, var(--home-signal) 6%, var(--home-paper-raised))",
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="home-kicker">PGA Tour</span>
                <span className="home-pill">{tournament.roundLabel}</span>
              </div>

              <div className="space-y-3">
                <h1 className="mb-0 max-w-[11ch] text-[clamp(2.7rem,6vw,5rem)] font-bold leading-[0.92] tracking-[-0.08em] text-[var(--home-ink)]">
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
              className="rounded-[var(--radius-3xl)] border px-5 py-5"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper-alt) 86%, var(--home-elev-mix))",
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

        <HomeStatsPanel
          id="golf-stats-panel"
          title="PGA Tour at a glance"
          meta={`Snapshot · refreshed ${formatGeneratedAt(tournament.generatedAt)}`}
          cells={statsPanelCells}
          pills={[
            { label: "Leaderboard", href: "?view=leaderboard", icon: ChartBar },
            { label: "Cut", href: "?view=leaderboard", icon: Briefcase },
            { label: "Top performers", href: "?view=players", icon: User },
            { label: "Conditions", href: "?view=leaderboard", icon: Calendar },
            { label: "Article", href: "/writing", icon: Article },
          ]}
        />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.92fr)]">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Golf view switcher">
              {GOLF_VIEW_OPTIONS.map((view) => (
                <button
                  key={view}
                  type="button"
                  role="tab"
                  id={`golf-tab-${view}`}
                  aria-controls={`golf-tabpanel-${view}`}
                  aria-selected={routeState.view === view}
                  tabIndex={routeState.view === view ? 0 : -1}
                  onClick={() => handleViewChange(view)}
                  className="min-h-[44px] rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors"
                  style={getViewButtonStyle(routeState.view === view)}
                >
                  {GOLF_VIEW_LABELS[view]}
                </button>
              ))}
            </div>

            <div
              className="space-y-4"
              role="tabpanel"
              id={`golf-tabpanel-${routeState.view}`}
              aria-labelledby={`golf-tab-${routeState.view}`}
            >
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
                  coursePar={tournament.coursePar}
                />
              )}
            </div>

            <div
              className="rounded-[var(--radius-3xl)] border px-5 py-5"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper-alt) 82%, var(--home-elev-mix))",
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
              className="rounded-[var(--radius-3xl)] border px-5 py-5 sm:px-6"
              style={{
                borderColor: "color-mix(in srgb, var(--home-signal) 22%, var(--home-rule))",
                background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
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
                          color: getScoreToParColor(selectedRow.totalToPar),
                          fontFamily: "var(--font-home-sans)",
                          fontWeight: 700,
                          letterSpacing: "-0.05em",
                        }}
                      >
                        {formatScoreToPar(selectedRow.totalToPar)}
                      </p>
                      <MovementPill movement={selectedRow.movement} />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <StatBlock label="Position" value={selectedRow.position} detail={selectedRow.status} />
                    <StatBlock
                      label="Today"
                      value={formatScoreToPar(selectedRow.today)}
                      detail={`Thru ${selectedRow.thru}`}
                      valueColor={getScoreToParColor(selectedRow.today)}
                    />
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
                      className="mt-5 rounded-[var(--radius-3xl)] border px-4 py-4"
                      role="alert"
                      style={{
                        borderColor: "color-mix(in srgb, var(--home-negative) 24%, var(--home-rule))",
                        background: "color-mix(in srgb, var(--home-negative) 8%, var(--home-paper-alt))",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <CircleAlert
                          className="mt-0.5 h-4 w-4 shrink-0"
                          style={{ color: "var(--home-negative)" }}
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
                          className="rounded-[var(--radius-3xl)] border px-4 py-4"
                          style={{
                            borderColor: "var(--home-rule)",
                            background: "color-mix(in srgb, var(--home-paper-alt) 88%, var(--home-elev-mix))",
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
                        className="rounded-[var(--radius-3xl)] border px-4 py-4"
                        style={{
                          borderColor: "var(--home-rule)",
                          background: "color-mix(in srgb, var(--home-paper-alt) 88%, var(--home-elev-mix))",
                        }}
                      >
                        <p className="home-kicker mb-3">Round by round</p>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                          {playerSnapshot.roundByRound.map((round) => (
                            <div
                              key={round.round}
                              className="rounded-[var(--radius-3xl)] border px-4 py-3"
                              style={{
                                borderColor: "var(--home-rule)",
                                background: "var(--home-paper-raised)",
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
                                  {round.score}{" "}
                                  <span style={{ color: getScoreToParColor(round.relativeToPar), fontWeight: 600 }}>
                                    ({formatScoreToPar(round.relativeToPar)})
                                  </span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div
                        className="rounded-[var(--radius-3xl)] border px-4 py-4"
                        style={{
                          borderColor: "var(--home-rule)",
                          background: "color-mix(in srgb, var(--home-paper-alt) 88%, var(--home-elev-mix))",
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

        {/* Data source */}
        <section className="rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-5 text-sm text-[var(--home-ink-muted)] shadow-[var(--shadow-sm)]">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--home-signal)]" />
            <p className="mb-0 max-w-none leading-relaxed">
              This page is a curated snapshot rather than a live feed. The
              leaderboard, cut line, and player movement come from ESPN&apos;s
              public golf leaderboard API and refresh on a schedule, so figures
              can trail the broadcast. Snapshot refreshed{" "}
              {formatGeneratedAt(tournament.generatedAt)}.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}
