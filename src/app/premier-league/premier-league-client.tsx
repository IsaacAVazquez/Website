"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CircleAlert,
  Clock3,
  LoaderCircle,
  MapPin,
  RefreshCcw,
  Shield,
  Trophy,
} from "lucide-react";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { cn } from "@/lib/utils";
import type {
  PremierLeagueFixture,
  PremierLeagueFormSummary,
  PremierLeagueRouteState,
  PremierLeagueStandingRow,
  PremierLeagueSummary,
  PremierLeagueTeamSnapshot,
  PremierLeagueView,
} from "@/types/premier-league";
import {
  buildPremierLeagueHref,
  normalizePremierLeagueState,
  PREMIER_LEAGUE_VIEW_LABELS,
} from "./premier-league-state";

interface PremierLeagueClientProps {
  initialState: PremierLeagueRouteState;
}

interface ApiError extends Error {
  status: number;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const LAST_UPDATED_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const VIEW_CARDS: Array<{
  key: PremierLeagueView;
  label: string;
  description: string;
}> = [
  {
    key: "overview",
    label: "Overview",
    description: "Standings, title-race context, and the next league-wide fixtures.",
  },
  {
    key: "fixtures",
    label: "Fixtures",
    description: "Recent final scores and the next upcoming Premier League slate.",
  },
  {
    key: "team",
    label: "Club View",
    description: "Choose a club for form, recent results, and the next five matches.",
  },
];

const fadeIn = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32 },
  },
};

const noMotion = {
  hidden: { opacity: 1, y: 0 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0 },
  },
};

function buildApiError(message: string, status: number): ApiError {
  return Object.assign(new Error(message), { status });
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw buildApiError(body.error ?? "Request failed", response.status);
  }

  return body;
}

function formatMatchday(matchday: number | null): string {
  return matchday ? `Matchday ${matchday}` : "League fixture";
}

function formatGeneratedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return LAST_UPDATED_FORMATTER.format(date);
}

function formatFixtureDate(utcDate: string): string {
  const date = new Date(utcDate);
  if (Number.isNaN(date.getTime())) {
    return "Date TBD";
  }

  return DATE_FORMATTER.format(date);
}

function formatFixtureDateTime(utcDate: string): string {
  const date = new Date(utcDate);
  if (Number.isNaN(date.getTime())) {
    return "Time TBD";
  }

  return DATE_TIME_FORMATTER.format(date);
}

function getTeamInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getResultForTeam(
  fixture: PremierLeagueFixture,
  teamId: string
): "W" | "D" | "L" | null {
  const isHome = fixture.homeTeam.id === teamId;
  const isAway = fixture.awayTeam.id === teamId;

  if (!isHome && !isAway) {
    return null;
  }

  if (fixture.score.winner === "DRAW") {
    return "D";
  }

  if (
    (isHome && fixture.score.winner === "HOME_TEAM") ||
    (isAway && fixture.score.winner === "AWAY_TEAM")
  ) {
    return "W";
  }

  return "L";
}

function groupFixturesByDay(fixtures: PremierLeagueFixture[]) {
  const groups = new Map<string, PremierLeagueFixture[]>();

  for (const fixture of fixtures) {
    const label = formatFixtureDate(fixture.utcDate);
    const existing = groups.get(label);
    if (existing) {
      existing.push(fixture);
    } else {
      groups.set(label, [fixture]);
    }
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }));
}

function SurfaceCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function HeroMetric({
  eyebrow,
  value,
  detail,
  icon,
}: {
  eyebrow: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
          {eyebrow}
        </p>
        <span className="text-[var(--color-primary)]">{icon}</span>
      </div>
      <p className="mt-3 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{detail}</p>
    </div>
  );
}

function CrestAvatar({
  crest,
  name,
  size = "md",
}: {
  crest: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dimensionClass =
    size === "lg"
      ? "h-16 w-16 text-lg"
      : size === "sm"
        ? "h-9 w-9 text-xs"
        : "h-12 w-12 text-sm";

  if (crest) {
    return (
      <img
        src={crest}
        alt={`${name} crest`}
        className={cn(
          "rounded-full border border-[var(--border-primary)] bg-white object-contain p-1",
          dimensionClass
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] font-semibold text-[var(--text-primary)]",
        dimensionClass
      )}
      aria-hidden="true"
    >
      {getTeamInitials(name)}
    </div>
  );
}

function InlineSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
      <LoaderCircle className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
      <span>{label}</span>
    </div>
  );
}

function ErrorPanel({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--surface-secondary))] p-3 text-[var(--color-danger)]">
          <CircleAlert className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{message}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              <RefreshCcw className="h-4 w-4" />
              Try again
            </button>
          ) : null}
        </div>
      </div>
    </SurfaceCard>
  );
}

function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <SurfaceCard className="p-6 text-center sm:p-8">
      <p className="text-lg font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
    </SurfaceCard>
  );
}

function TeamResultPill({ result }: { result: "W" | "D" | "L" }) {
  const colorClass =
    result === "W"
      ? "border-[color-mix(in_srgb,var(--color-success)_35%,var(--border-primary))] bg-[color-mix(in_srgb,var(--color-success)_12%,var(--surface-secondary))] text-[var(--color-success)]"
      : result === "D"
        ? "border-[color-mix(in_srgb,var(--color-primary)_25%,var(--border-primary))] bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--surface-secondary))] text-[var(--color-primary)]"
        : "border-[color-mix(in_srgb,var(--color-danger)_30%,var(--border-primary))] bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--surface-secondary))] text-[var(--color-danger)]";

  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold",
        colorClass
      )}
    >
      {result}
    </span>
  );
}

function FixtureCard({
  fixture,
  contextTeamId,
  onOpenTeam,
}: {
  fixture: PremierLeagueFixture;
  contextTeamId?: string | null;
  onOpenTeam: (teamId: string) => void;
}) {
  const contextualResult = contextTeamId ? getResultForTeam(fixture, contextTeamId) : null;

  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            {formatMatchday(fixture.matchday)}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Clock3 className="h-4 w-4 text-[var(--color-primary)]" />
            {fixture.status === "FINISHED"
              ? `Final · ${formatFixtureDateTime(fixture.utcDate)}`
              : formatFixtureDateTime(fixture.utcDate)}
          </p>
        </div>
        {contextualResult ? <TeamResultPill result={contextualResult} /> : null}
      </div>

      <div className="mt-4 space-y-3">
        {[fixture.homeTeam, fixture.awayTeam].map((team, index) => {
          const isHome = index === 0;
          const score = isHome ? fixture.score.home : fixture.score.away;
          const isWinner =
            (isHome && fixture.score.winner === "HOME_TEAM") ||
            (!isHome && fixture.score.winner === "AWAY_TEAM");

          return (
            <div
              key={`${fixture.id}-${team.id}`}
              className="flex items-center justify-between gap-3"
            >
              <button
                type="button"
                onClick={() => onOpenTeam(team.id)}
                className="flex min-h-[44px] min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition hover:text-[var(--color-primary)]"
              >
                <CrestAvatar crest={team.crest} name={team.shortName} size="sm" />
                <span
                  className={cn(
                    "truncate text-sm",
                    isWinner
                      ? "font-semibold text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)]"
                  )}
                >
                  {team.shortName}
                </span>
              </button>
              <span className="w-8 text-right text-sm font-semibold text-[var(--text-primary)]">
                {fixture.status === "FINISHED" && score !== null ? score : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FixtureGroupSection({
  title,
  description,
  fixtures,
  contextTeamId,
  onOpenTeam,
}: {
  title: string;
  description: string;
  fixtures: PremierLeagueFixture[];
  contextTeamId?: string | null;
  onOpenTeam: (teamId: string) => void;
}) {
  const groups = groupFixturesByDay(fixtures);

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="flex flex-col gap-2 border-b border-[var(--border-primary)] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          {title}
        </p>
        <h3 className="text-xl font-semibold text-[var(--text-primary)]">{description}</h3>
      </div>

      <div className="mt-5 space-y-6">
        {groups.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No matches available right now.</p>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                {group.label}
              </p>
              <div className="space-y-3">
                {group.items.map((fixture) => (
                  <FixtureCard
                    key={fixture.id}
                    fixture={fixture}
                    contextTeamId={contextTeamId}
                    onOpenTeam={onOpenTeam}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </SurfaceCard>
  );
}

function TeamFormStrip({ form }: { form: PremierLeagueFormSummary }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {form.sequence.length === 0 ? (
          <span className="text-sm text-[var(--text-secondary)]">No completed Premier League matches yet.</span>
        ) : (
          form.sequence.map((result, index) => (
            <TeamResultPill key={`${result}-${index}`} result={result} />
          ))
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Record
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
            {form.wins}-{form.draws}-{form.losses}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Points
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{form.points}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Goals For
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{form.goalsFor}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Goals Against
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{form.goalsAgainst}</p>
        </div>
      </div>
    </div>
  );
}

function getStandingsAccent(position: number): CSSProperties {
  if (position <= 4) {
    return {
      borderLeftColor: "var(--color-primary)",
      background:
        "linear-gradient(90deg, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 30%)",
    };
  }

  if (position <= 6) {
    return {
      borderLeftColor: "var(--color-success)",
      background:
        "linear-gradient(90deg, color-mix(in srgb, var(--color-success) 10%, transparent), transparent 30%)",
    };
  }

  if (position >= 18) {
    return {
      borderLeftColor: "var(--color-danger)",
      background:
        "linear-gradient(90deg, color-mix(in srgb, var(--color-danger) 10%, transparent), transparent 30%)",
    };
  }

  return {
    borderLeftColor: "transparent",
  };
}

function StandingsTable({
  standings,
  onOpenTeam,
}: {
  standings: PremierLeagueStandingRow[];
  onOpenTeam: (teamId: string) => void;
}) {
  return (
    <div className="overflow-x-auto" data-testid="premier-league-standings">
      <table className="min-w-full border-separate border-spacing-y-2" aria-label="Premier League standings">
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            <th className="px-3 py-2 font-semibold">Pos</th>
            <th className="px-3 py-2 font-semibold">Club</th>
            <th className="hidden px-3 py-2 font-semibold sm:table-cell">Record</th>
            <th className="px-3 py-2 font-semibold">Pts</th>
            <th className="hidden px-3 py-2 font-semibold md:table-cell">GF</th>
            <th className="hidden px-3 py-2 font-semibold md:table-cell">GA</th>
            <th className="px-3 py-2 font-semibold">GD</th>
            <th className="px-3 py-2 font-semibold">Club</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr
              key={row.team.id}
              className="border border-[var(--border-primary)]"
              style={getStandingsAccent(row.position)}
            >
              <td className="rounded-l-2xl border-l-4 px-3 py-3 text-sm font-semibold text-[var(--text-primary)]">
                {row.position}
              </td>
              <td className="px-3 py-3">
                <div className="flex min-w-[220px] items-center gap-3">
                  <CrestAvatar crest={row.team.crest} name={row.team.shortName} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {row.team.shortName}
                    </p>
                    <p className="truncate text-xs text-[var(--text-secondary)]">
                      {row.playedGames} played
                    </p>
                  </div>
                </div>
              </td>
              <td className="hidden px-3 py-3 text-sm text-[var(--text-secondary)] sm:table-cell">
                {row.won}-{row.draw}-{row.lost}
              </td>
              <td className="px-3 py-3 text-sm font-semibold text-[var(--text-primary)]">{row.points}</td>
              <td className="hidden px-3 py-3 text-sm text-[var(--text-secondary)] md:table-cell">
                {row.goalsFor}
              </td>
              <td className="hidden px-3 py-3 text-sm text-[var(--text-secondary)] md:table-cell">
                {row.goalsAgainst}
              </td>
              <td className="px-3 py-3 text-sm font-semibold text-[var(--text-primary)]">
                {row.goalDifference >= 0 ? `+${row.goalDifference}` : row.goalDifference}
              </td>
              <td className="rounded-r-2xl px-3 py-3">
                <button
                  type="button"
                  onClick={() => onOpenTeam(row.team.id)}
                  className="inline-flex min-h-[44px] items-center rounded-xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  Club view
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PremierLeagueClient({ initialState }: PremierLeagueClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? noMotion : fadeIn;
  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("team") !== null;
  const routeState = useMemo(
    () => (hasManagedParams ? normalizePremierLeagueState(searchParams) : initialState),
    [hasManagedParams, initialState, searchParams]
  );

  const [summary, setSummary] = useState<PremierLeagueSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryFetchKey, setSummaryFetchKey] = useState(0);

  const [teamSnapshots, setTeamSnapshots] = useState<Map<string, PremierLeagueTeamSnapshot>>(
    () => new Map()
  );
  const [teamErrors, setTeamErrors] = useState<Record<string, string>>({});
  const [teamFetchKey, setTeamFetchKey] = useState(0);

  const summaryRequestId = useRef(0);
  const teamRequestId = useRef(0);
  const isMounted = useRef(true);

  const shellClassName =
    "mx-auto w-full max-w-[1680px] px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8 xl:px-10 2xl:px-12";

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const href = buildPremierLeagueHref(routeState, searchParams);
    const currentHref = `/premier-league${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    if (href === currentHref) {
      return;
    }

    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }, [routeState, router, searchParams]);

  useEffect(() => {
    const requestId = summaryRequestId.current + 1;
    summaryRequestId.current = requestId;

    fetchJson<PremierLeagueSummary>("/api/premier-league/summary")
      .then((payload) => {
        if (!isMounted.current || summaryRequestId.current !== requestId) {
          return;
        }

        setSummary(payload);
      })
      .catch((error: Error) => {
        if (!isMounted.current || summaryRequestId.current !== requestId) {
          return;
        }

        setSummaryError(error.message);
        setSummary(null);
      })
  }, [summaryFetchKey]);

  useEffect(() => {
    if (routeState.view !== "team" || !routeState.team) {
      return;
    }

    if (teamSnapshots.has(routeState.team) || teamErrors[routeState.team]) {
      return;
    }

    const requestId = teamRequestId.current + 1;
    teamRequestId.current = requestId;

    fetchJson<PremierLeagueTeamSnapshot>(
      `/api/premier-league/teams/${encodeURIComponent(routeState.team)}`
    )
      .then((payload) => {
        if (!isMounted.current || teamRequestId.current !== requestId) {
          return;
        }

        setTeamSnapshots((current) => {
          const next = new Map(current);
          next.set(routeState.team!, payload);
          return next;
        });
        setTeamErrors((current) => {
          if (!current[routeState.team!]) {
            return current;
          }

          const next = { ...current };
          delete next[routeState.team!];
          return next;
        });
      })
      .catch((error: Error) => {
        if (!isMounted.current || teamRequestId.current !== requestId) {
          return;
        }

        setTeamErrors((current) => ({
          ...current,
          [routeState.team!]: error.message,
        }));
      });
  }, [routeState.team, routeState.view, teamErrors, teamFetchKey, teamSnapshots]);

  function updateRouteState(
    nextState: Partial<PremierLeagueRouteState>,
    options?: { replace?: boolean }
  ) {
    const href = buildPremierLeagueHref(
      {
        ...routeState,
        ...nextState,
      },
      searchParams
    );

    startTransition(() => {
      if (options?.replace) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    });
  }

  function handleViewChange(view: PremierLeagueView) {
    updateRouteState({ view });
  }

  function handleOpenTeam(teamId: string) {
    updateRouteState({
      view: "team",
      team: teamId,
    });
  }

  function handleRetrySummary() {
    setSummary(null);
    setSummaryError(null);
    setSummaryFetchKey((value) => value + 1);
  }

  function handleRetryTeam() {
    if (routeState.team) {
      setTeamSnapshots((current) => {
        const next = new Map(current);
        next.delete(routeState.team!);
        return next;
      });
      setTeamErrors((current) => {
        const next = { ...current };
        delete next[routeState.team!];
        return next;
      });
    }
    setTeamFetchKey((value) => value + 1);
  }

  const leader = summary?.standings[0] ?? null;
  const runnerUp = summary?.standings[1] ?? null;
  const titleGap =
    leader && runnerUp ? `${leader.points - runnerUp.points} pts` : "—";
  const teamStanding =
    summary?.standings.find((row) => row.team.id === routeState.team) ?? null;
  const lastUpdatedLabel = summary ? formatGeneratedAt(summary.generatedAt) : "Loading";
  const summaryLoading = !summary && !summaryError;
  const teamSnapshot = routeState.team ? teamSnapshots.get(routeState.team) ?? null : null;
  const teamError = routeState.team ? teamErrors[routeState.team] ?? null : null;
  const teamLoading =
    routeState.view === "team" &&
    Boolean(routeState.team) &&
    !teamSnapshot &&
    !teamError;

  return (
    <section
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-primary)_12%,transparent),transparent_28%),linear-gradient(180deg,var(--surface-primary)_0%,color-mix(in_srgb,var(--surface-secondary)_70%,var(--surface-primary))_100%)]"
      aria-label="Premier League dashboard"
      data-testid="premier-league-shell"
    >
      <div className={shellClassName}>
        <motion.div
          className="mb-8 rounded-[32px] border border-[color-mix(in_srgb,var(--color-primary)_14%,var(--border-primary))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_8%,var(--surface-elevated))_0%,var(--surface-elevated)_55%,color-mix(in_srgb,var(--color-success)_8%,var(--surface-elevated))_100%)] p-6 shadow-[var(--shadow-sm)] sm:p-8"
          variants={variants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_auto] xl:items-end">
            <div className="min-w-0">
              <SectionIntro
                eyebrow="Football Data Tool"
                size="lg"
                title="Premier League Pulse"
                description="A live Premier League workspace for the table, the current fixture slate, and club-level form. All third-party traffic stays server-side behind a thin internal API layer."
                titleClassName="text-[var(--text-primary)]"
                descriptionClassName="max-w-[68ch] text-[var(--text-secondary)]"
              />

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
                <span className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-2">
                  {summary?.competition?.seasonLabel ?? "Current season"}
                </span>
                <span className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-2">
                  {summary?.competition?.currentMatchday
                    ? `Matchday ${summary.competition.currentMatchday}`
                    : "Live competition feed"}
                </span>
                <span className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-2">
                  Updated {lastUpdatedLabel}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px]">
              <HeroMetric
                eyebrow="Leader"
                value={leader?.team.shortName ?? "Loading"}
                detail={
                  leader
                    ? `${leader.points} points through ${leader.playedGames} matches`
                    : "Waiting for the league table"
                }
                icon={<Trophy className="h-4 w-4" />}
              />
              <HeroMetric
                eyebrow="Title gap"
                value={titleGap}
                detail={
                  leader && runnerUp
                    ? `${leader.team.shortName} over ${runnerUp.team.shortName}`
                    : "Gap appears after the standings load"
                }
                icon={<Shield className="h-4 w-4" />}
              />
              <HeroMetric
                eyebrow="Fixtures ahead"
                value={`${summary?.upcomingFixtures.length ?? 0}`}
                detail="Upcoming matches currently cached in the feed"
                icon={<CalendarDays className="h-4 w-4" />}
              />
              <HeroMetric
                eyebrow="Coverage"
                value={`${summary?.teams.length ?? 0} clubs`}
                detail="All Premier League team selectors exposed in the club view"
                icon={<MapPin className="h-4 w-4" />}
              />
            </div>
          </div>
        </motion.div>

        <div
          className="mb-8 inline-flex flex-wrap gap-2 rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-elevated)]/90 p-2 shadow-[var(--shadow-sm)] backdrop-blur"
          role="tablist"
          aria-label="Premier League tabs"
        >
          {VIEW_CARDS.map((view) => (
            <button
              key={view.key}
              type="button"
              role="tab"
              aria-selected={routeState.view === view.key}
              onClick={() => handleViewChange(view.key)}
              className={cn(
                "min-h-[46px] rounded-2xl px-5 py-3 text-sm font-semibold transition",
                routeState.view === view.key
                  ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {PREMIER_LEAGUE_VIEW_LABELS[view.key]}
            </button>
          ))}
        </div>

        <motion.div variants={variants} initial="hidden" animate="visible">
          {summaryLoading ? (
            <SurfaceCard className="p-6 sm:p-8">
              <InlineSpinner label="Loading Premier League summary..." />
            </SurfaceCard>
          ) : summaryError ? (
            <ErrorPanel
              title="Unable to load Premier League data."
              message={summaryError}
              onRetry={handleRetrySummary}
            />
          ) : summary ? (
            <>
              {routeState.view === "overview" ? (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)]">
                  <SurfaceCard className="p-5 sm:p-6">
                    <div className="flex flex-col gap-3 border-b border-[var(--border-primary)] pb-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                        Table
                      </p>
                      <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                        Standings workspace
                      </h2>
                      <p className="max-w-[70ch] text-sm leading-7 text-[var(--text-secondary)]">
                        Jump from the league table into a club drilldown without leaving the route. The URL keeps the active view and club id shareable.
                      </p>
                    </div>
                    <div className="mt-5">
                      <StandingsTable standings={summary.standings} onOpenTeam={handleOpenTeam} />
                    </div>
                  </SurfaceCard>

                  <div className="space-y-6">
                    <FixtureGroupSection
                      title="Recent slate"
                      description="Latest final scores"
                      fixtures={summary.recentFixtures.slice(0, 6)}
                      onOpenTeam={handleOpenTeam}
                    />
                    <FixtureGroupSection
                      title="Next up"
                      description="Upcoming fixtures"
                      fixtures={summary.upcomingFixtures.slice(0, 6)}
                      onOpenTeam={handleOpenTeam}
                    />
                  </div>
                </div>
              ) : null}

              {routeState.view === "fixtures" ? (
                <div className="grid gap-6 xl:grid-cols-2">
                  <FixtureGroupSection
                    title="Recent fixtures"
                    description="Most recent finished Premier League matches"
                    fixtures={summary.recentFixtures}
                    onOpenTeam={handleOpenTeam}
                  />
                  <FixtureGroupSection
                    title="Upcoming fixtures"
                    description="Next scheduled Premier League matches"
                    fixtures={summary.upcomingFixtures}
                    onOpenTeam={handleOpenTeam}
                  />
                </div>
              ) : null}

              {routeState.view === "team" ? (
                <div className="space-y-6">
                  <SurfaceCard className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                          Club view
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                          Club drilldown
                        </h2>
                        <p className="mt-2 max-w-[70ch] text-sm leading-7 text-[var(--text-secondary)]">
                          Choose any club to inspect recent form, last results, and the next five Premier League fixtures.
                        </p>
                      </div>

                      <label className="block min-w-[260px]">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                          Select a club
                        </span>
                        <select
                          data-testid="premier-league-team-select"
                          value={routeState.team ?? ""}
                          onChange={(event) => {
                            const teamId = event.target.value || null;
                            updateRouteState({
                              view: "team",
                              team: teamId,
                            });
                          }}
                          className="min-h-[48px] w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--color-primary)]"
                        >
                          <option value="">Choose a club</option>
                          {summary.teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.shortName}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </SurfaceCard>

                  {!routeState.team ? (
                    <EmptyPanel
                      title="Select a club to open the drilldown."
                      description="The team view stays deep-linkable, so the selected club id appears in the URL once you choose one."
                    />
                  ) : teamLoading ? (
                    <SurfaceCard className="p-6 sm:p-8">
                      <InlineSpinner label="Loading club snapshot..." />
                    </SurfaceCard>
                  ) : teamError ? (
                    <ErrorPanel
                      title="Unable to load the selected club."
                      message={teamError}
                      onRetry={handleRetryTeam}
                    />
                  ) : teamSnapshot?.team ? (
                    <>
                      <SurfaceCard className="p-6 sm:p-8">
                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] xl:items-start">
                          <div className="flex items-start gap-4">
                            <CrestAvatar
                              crest={teamSnapshot.team.crest}
                              name={teamSnapshot.team.shortName}
                              size="lg"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                                Selected club
                              </p>
                              <h3
                                className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)]"
                                data-testid="premier-league-selected-team"
                              >
                                {teamSnapshot.team.name}
                              </h3>
                              <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
                                {teamSnapshot.team.venue ? (
                                  <span className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-2">
                                    {teamSnapshot.team.venue}
                                  </span>
                                ) : null}
                                {teamSnapshot.team.founded ? (
                                  <span className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-2">
                                    Founded {teamSnapshot.team.founded}
                                  </span>
                                ) : null}
                                {teamSnapshot.team.clubColors ? (
                                  <span className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-2">
                                    {teamSnapshot.team.clubColors}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <HeroMetric
                              eyebrow="League position"
                              value={teamStanding ? `#${teamStanding.position}` : "—"}
                              detail={
                                teamStanding
                                  ? `${teamStanding.points} points, ${teamStanding.goalDifference >= 0 ? "+" : ""}${teamStanding.goalDifference} GD`
                                  : "Standing unavailable"
                              }
                              icon={<Trophy className="h-4 w-4" />}
                            />
                            <HeroMetric
                              eyebrow="Last updated"
                              value={formatGeneratedAt(teamSnapshot.generatedAt)}
                              detail="Cached team snapshot timestamp"
                              icon={<Clock3 className="h-4 w-4" />}
                            />
                          </div>
                        </div>
                      </SurfaceCard>

                      <SurfaceCard className="p-5 sm:p-6">
                        <div className="border-b border-[var(--border-primary)] pb-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                            Form
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                            Last five Premier League results
                          </h3>
                        </div>
                        <div className="mt-5">
                          <TeamFormStrip form={teamSnapshot.form} />
                        </div>
                      </SurfaceCard>

                      <div className="grid gap-6 xl:grid-cols-2">
                        <FixtureGroupSection
                          title="Recent results"
                          description="Latest completed Premier League matches"
                          fixtures={teamSnapshot.recentFixtures}
                          contextTeamId={routeState.team}
                          onOpenTeam={handleOpenTeam}
                        />
                        <FixtureGroupSection
                          title="Upcoming fixtures"
                          description="Next scheduled Premier League matches"
                          fixtures={teamSnapshot.upcomingFixtures}
                          contextTeamId={routeState.team}
                          onOpenTeam={handleOpenTeam}
                        />
                      </div>
                    </>
                  ) : (
                    <EmptyPanel
                      title="Club snapshot unavailable."
                      description="The selected team did not return a usable response from the upstream feed."
                    />
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <EmptyPanel
              title="Premier League data unavailable."
              description="The summary feed returned no usable data."
            />
          )}
        </motion.div>
      </div>
    </section>
  );
}
