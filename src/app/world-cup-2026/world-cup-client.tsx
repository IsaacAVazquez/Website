"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CircleAlert,
  Clock,
  Flag,
  Globe,
  ListOrdered,
  MapPin,
  Medal,
  Trophy,
  Users,
  X,
} from "lucide-react";
import {
  CrestAvatar,
  EmptyPanel,
  FixtureCard,
  FixtureGroupSection,
  InfoChip,
  StatCard,
  SurfaceCard,
  TeamResultPill,
} from "@/components/football";
import type {
  WorldCupGroup,
  WorldCupRouteState,
  WorldCupSummarySnapshot,
  WorldCupTeamOption,
  WorldCupTeamSnapshot,
  WorldCupView,
} from "@/types/worldCup";
import {
  getThirdPlaceRace,
  hasThirdPlaceRaceStarted,
  THIRD_PLACE_QUALIFY_COUNT,
  type ThirdPlaceRow,
} from "@/lib/worldCupStandings";
import {
  buildWorldCupHref,
  normalizeTeamParam,
  normalizeWorldCupState,
  WORLD_CUP_ROUTE,
} from "./world-cup-state";

interface WorldCupClientProps {
  initialState: WorldCupRouteState;
  summary: WorldCupSummarySnapshot;
  initialTeamSnapshot: WorldCupTeamSnapshot | null;
}

const VIEW_OPTIONS: Array<{
  id: WorldCupView;
  label: string;
  description: string;
}> = [
  {
    id: "groups",
    label: "Group stage",
    description: "Standings for all 12 groups of four.",
  },
  {
    id: "knockout",
    label: "Knockout bracket",
    description: "The 32-team bracket from the Round of 32 to the final.",
  },
  {
    id: "schedule",
    label: "Match schedule",
    description: "Recent results and upcoming fixtures.",
  },
];

function formatLongDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatTournamentWindow(start: string, end: string): string {
  const startDate = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return `${start} – ${end}`;
  }
  const startLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(startDate);
  return `${startLabel} – ${formatLongDate(end)}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whole days between now and kickoff, computed after mount so the count never
 * triggers a server/client hydration mismatch. Returns null until mounted and 0
 * once the tournament has started.
 */
function useDaysUntilKickoff(startDate: string): number | null {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
    if (Number.isNaN(start)) return;
    const update = () => {
      const diff = start - Date.now();
      setDays(diff > 0 ? Math.ceil(diff / DAY_MS) : 0);
    };
    update();
    const timer = window.setInterval(update, 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [startDate]);
  return days;
}

function KickoffCountdown({ startDate }: { startDate: string }) {
  const days = useDaysUntilKickoff(startDate);
  if (days === null || days <= 0) return null;
  return (
    <span className="inline-flex flex-shrink-0 items-center gap-1.5 self-start rounded-full border border-[color-mix(in_srgb,var(--home-signal)_35%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-signal)_10%,var(--home-paper-alt))] px-3 py-1 text-xs font-semibold text-[var(--home-ink)]">
      <Clock className="h-3.5 w-3.5 text-[var(--home-signal)]" />
      {days === 1 ? "Kicks off tomorrow" : `Kicks off in ${days} days`}
    </span>
  );
}

async function fetchWorldCupTeamSnapshot(
  teamId: string,
  signal: AbortSignal
): Promise<WorldCupTeamSnapshot> {
  const response = await fetch(`/api/world-cup/teams/${teamId}`, { signal });
  const payload = (await response.json()) as WorldCupTeamSnapshot & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || "Unable to load team snapshot.");
  }
  return payload;
}

export function WorldCupClient({
  initialState,
  summary,
  initialTeamSnapshot,
}: WorldCupClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const currentHref = `${WORLD_CUP_ROUTE}${currentQuery ? `?${currentQuery}` : ""}`;

  const { tournament, groups, knockout, scorers, teamOptions } = summary;
  const teamOptionById = useMemo(
    () => new Map(teamOptions.map((team) => [team.id, team])),
    [teamOptions]
  );

  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("team") !== null;
  const routeState = hasManagedParams
    ? normalizeWorldCupState(searchParams)
    : initialState;

  const requestedTeam = normalizeTeamParam(routeState.team);
  const selectedTeamId =
    requestedTeam && teamOptionById.has(requestedTeam) ? requestedTeam : null;
  const selectedTeamOption = selectedTeamId
    ? teamOptionById.get(selectedTeamId) ?? null
    : null;

  const [teamSnapshots, setTeamSnapshots] = useState<
    Record<string, WorldCupTeamSnapshot>
  >(() =>
    selectedTeamId && initialTeamSnapshot
      ? { [selectedTeamId]: initialTeamSnapshot }
      : {}
  );
  const [loadingTeamId, setLoadingTeamId] = useState<string | null>(null);
  const [teamSnapshotError, setTeamSnapshotError] = useState<string | null>(null);
  const teamSnapshot = selectedTeamId
    ? teamSnapshots[selectedTeamId] ?? null
    : null;
  const isTeamSnapshotLoading = loadingTeamId === selectedTeamId;

  const desiredHref = buildWorldCupHref(
    { view: routeState.view, team: selectedTeamId },
    searchParams
  );

  useEffect(() => {
    if (currentHref === desiredHref) return;
    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  useEffect(() => {
    if (!selectedTeamId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset request flags when no team is selected or the snapshot is already cached
      setLoadingTeamId(null);
      setTeamSnapshotError(null);
      return;
    }
    if (teamSnapshots[selectedTeamId]) {
      setLoadingTeamId(null);
      setTeamSnapshotError(null);
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    setLoadingTeamId(selectedTeamId);
    setTeamSnapshotError(null);
    fetchWorldCupTeamSnapshot(selectedTeamId, controller.signal)
      .then((snapshot) => {
        if (cancelled) return;
        setTeamSnapshots((current) =>
          current[selectedTeamId]
            ? current
            : { ...current, [selectedTeamId]: snapshot }
        );
      })
      .catch((error: Error) => {
        if (!cancelled && error.name !== "AbortError") {
          setTeamSnapshotError(error.message || "Unable to load team snapshot.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTeamId((current) =>
            current === selectedTeamId ? null : current
          );
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedTeamId, teamSnapshots]);

  function navigate(nextState: WorldCupRouteState) {
    const href = buildWorldCupHref(nextState, searchParams);
    if (href === currentHref) return;
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function handleViewChange(view: WorldCupView) {
    navigate({ view, team: selectedTeamId });
  }

  function handleTeamChange(teamId: string) {
    const normalized = normalizeTeamParam(teamId);
    if (!normalized || !teamOptionById.has(normalized)) return;
    navigate({ view: routeState.view, team: normalized });
  }

  function clearTeam() {
    navigate({ view: routeState.view, team: null });
  }

  const snapshotDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(tournament.generatedAt)),
    [tournament]
  );

  const tournamentWindow = formatTournamentWindow(
    tournament.startDate,
    tournament.endDate
  );

  const venuesByCountry = useMemo(() => {
    const map = new Map<string, typeof tournament.venues>();
    for (const venue of tournament.venues) {
      const list = map.get(venue.country);
      if (list) list.push(venue);
      else map.set(venue.country, [venue]);
    }
    return Array.from(map.entries());
  }, [tournament]);

  const heroCards = [
    {
      eyebrow: "Teams",
      metric: `${tournament.teamCount}`,
      detail: `${tournament.groupCount} groups of four`,
      icon: <Users className="h-4 w-4" />,
    },
    {
      eyebrow: "Matches",
      metric: `${tournament.matchCount}`,
      detail: "Across the whole tournament",
      icon: <ListOrdered className="h-4 w-4" />,
    },
    {
      eyebrow: "Host nations",
      metric: `${new Set(tournament.venues.map((v) => v.country)).size}`,
      detail: tournament.hosts.join(", "),
      icon: <Globe className="h-4 w-4" />,
    },
    {
      eyebrow: "Host cities",
      metric: `${tournament.venues.length}`,
      detail: "Stadiums on the schedule",
      icon: <MapPin className="h-4 w-4" />,
    },
  ];

  return (
    <div className="home-page min-h-screen">
      <div className="home-shell home-section space-y-5 sm:space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="home-kicker mb-1">World Cup Data Tool</p>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--home-ink)] sm:text-3xl">
              World Cup Pulse
            </h1>
            <p className="mt-1 max-w-[58ch] text-sm leading-6 text-[var(--home-ink-muted)]">
              The 2026 FIFA World Cup in one view. Group standings, the expanded
              32-team knockout bracket, the full schedule, and the 16 host
              cities, refreshed from a curated ESPN snapshot.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-2xs text-[var(--home-ink-muted)]">
            {[
              tournament.phase,
              tournamentWindow,
              `Snapshot ${snapshotDateLabel}`,
            ].map((label) => (
              <span
                key={label}
                className="rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 py-1 font-medium"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Status line */}
        <SurfaceCard className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <Trophy className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--home-signal)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--home-ink)]">
                  {tournament.name} · {tournament.phase}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--home-ink-muted)]">
                  {tournament.status}
                </p>
              </div>
            </div>
            <KickoffCountdown startDate={tournament.startDate} />
          </div>
        </SurfaceCard>

        {/* Hero stat cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {heroCards.map((card) => (
            <StatCard
              key={card.eyebrow}
              variant="compact"
              eyebrow={card.eyebrow}
              metric={card.metric}
              detail={card.detail}
              icon={card.icon}
            />
          ))}
        </div>

        {/* View tabs */}
        <div className="flex flex-wrap gap-2">
          {VIEW_OPTIONS.map((option) => {
            const isActive = option.id === routeState.view;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleViewChange(option.id)}
                aria-pressed={isActive}
                className={`inline-flex min-h-[44px] flex-col items-start rounded-[var(--radius-2xl)] border px-4 py-2 text-left transition-colors ${
                  isActive
                    ? "border-[color-mix(in_srgb,var(--home-signal)_35%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-signal)_9%,var(--home-paper-alt))] shadow-[var(--shadow-sm)]"
                    : "border-[var(--home-rule)] bg-[var(--home-paper-alt)] hover:text-[var(--home-signal)]"
                }`}
              >
                <span className="text-sm font-semibold text-[var(--home-ink)]">
                  {option.label}
                </span>
                <span className="text-2xs text-[var(--home-ink-muted)]">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main content + sidebar */}
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-5">
            {routeState.view === "groups" && (
              <GroupsView
                groups={groups}
                selectedTeamId={selectedTeamId}
                onOpenTeam={handleTeamChange}
              />
            )}
            {routeState.view === "knockout" && (
              <KnockoutView
                rounds={knockout}
                selectedTeamId={selectedTeamId}
                onOpenTeam={handleTeamChange}
              />
            )}
            {routeState.view === "schedule" && (
              <ScheduleView
                recentFixtures={summary.recentFixtures}
                upcomingFixtures={summary.upcomingFixtures}
                onOpenTeam={handleTeamChange}
              />
            )}
          </section>

          {/* Sidebar */}
          <aside className="md:sticky md:top-28 md:self-start">
            {selectedTeamOption ? (
              <TeamDetailCard
                option={selectedTeamOption}
                snapshot={teamSnapshot}
                isLoading={isTeamSnapshotLoading}
                error={teamSnapshotError}
                onClear={clearTeam}
                onOpenTeam={handleTeamChange}
              />
            ) : (
              <FormatCard tournament={tournament} />
            )}
          </aside>
        </div>

        {/* Top scorers */}
        {scorers.length > 0 && (
          <SurfaceCard className="p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-[var(--home-rule)] pb-4">
              <h2 className="text-lg font-bold text-[var(--home-ink)]">
                Golden Boot race
              </h2>
              <span className="text-sm text-[var(--home-ink-muted)]">
                Top scorers
              </span>
            </div>
            <ol className="mt-5 space-y-3 pl-0">
              {scorers.slice(0, 10).map((scorer) => (
                <li
                  key={`${scorer.rank}-${scorer.name}`}
                  className="flex items-center justify-between gap-4 rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--home-paper)] text-sm font-bold text-[var(--home-signal)] shadow-sm">
                      {scorer.rank}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--home-ink)]">
                        {scorer.name}
                      </p>
                      <p className="text-sm text-[var(--home-ink-muted)]">
                        {scorer.teamCode}
                        {scorer.assists > 0 ? ` · ${scorer.assists} assists` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[var(--home-ink)]">
                      {scorer.goals}
                    </p>
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--home-ink-soft)]">
                      goals
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </SurfaceCard>
        )}

        {/* Host venues */}
        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-[var(--home-rule)] pb-4">
            <h2 className="text-lg font-bold text-[var(--home-ink)]">
              Host venues
            </h2>
            <span className="text-sm text-[var(--home-ink-muted)]">
              {tournament.venues.length} stadiums · {venuesByCountry.length} nations
            </span>
          </div>
          <div className="mt-5 space-y-6">
            {venuesByCountry.map(([country, venues]) => (
              <div key={country}>
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
                  <Flag className="h-3.5 w-3.5" />
                  {country} · {venues.length}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {venues.map((venue) => (
                    <div
                      key={`${venue.city}-${venue.stadium}`}
                      className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-4 py-3"
                    >
                      <p className="font-semibold text-[var(--home-ink)]">
                        {venue.city}
                      </p>
                      <p className="mt-0.5 text-sm text-[var(--home-ink-muted)]">
                        {venue.stadium}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        {/* Disclaimer */}
        <section className="rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-5 text-sm text-[var(--home-ink-muted)] shadow-sm">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--home-signal)]" />
            <p className="mb-0 max-w-none leading-relaxed">
              This page is a curated snapshot rather than a live feed. Group
              standings, fixtures, and the knockout bracket come from ESPN&apos;s
              public World Cup endpoints and refresh on a schedule. Tournament
              format and host venues are fixed facts carried in the snapshot.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function GroupsView({
  groups,
  selectedTeamId,
  onOpenTeam,
}: {
  groups: WorldCupGroup[];
  selectedTeamId: string | null;
  onOpenTeam: (teamId: string) => void;
}) {
  const thirdPlaceRace = useMemo(() => getThirdPlaceRace(groups), [groups]);
  const raceStarted = hasThirdPlaceRaceStarted(thirdPlaceRace);

  if (groups.length === 0) {
    return (
      <EmptyPanel
        title="Group standings open with the first whistle"
        description="All 12 group tables populate here once the group stage begins on June 11. Until then, browse the host venues and the tournament format below."
      />
    );
  }

  return (
    <div className="space-y-5">
      <QualificationLegend />
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <GroupTable
            key={group.letter || group.name}
            group={group}
            selectedTeamId={selectedTeamId}
            onOpenTeam={onOpenTeam}
          />
        ))}
      </div>
      <ThirdPlaceRace
        rows={thirdPlaceRace}
        started={raceStarted}
        selectedTeamId={selectedTeamId}
        onOpenTeam={onOpenTeam}
      />
    </div>
  );
}

function QualificationLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-4 py-3 text-xs text-[var(--home-ink-muted)]">
      <span className="flex items-center gap-1.5">
        <span
          className="h-2 w-2 flex-shrink-0 rounded-full"
          style={{ backgroundColor: "var(--home-positive)" }}
        />
        Top two advance to the Round of 32
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="h-2 w-2 flex-shrink-0 rounded-full"
          style={{ backgroundColor: "var(--home-signal)" }}
        />
        Third place enters the eight-team wildcard race
      </span>
    </div>
  );
}

function GroupTable({
  group,
  selectedTeamId,
  onOpenTeam,
}: {
  group: WorldCupGroup;
  selectedTeamId: string | null;
  onOpenTeam: (teamId: string) => void;
}) {
  return (
    <SurfaceCard className="p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-[var(--home-rule)] pb-3">
        <h3 className="text-base font-bold text-[var(--home-ink)]">
          {group.name}
        </h3>
        <span className="text-xs uppercase tracking-[0.12em] text-[var(--home-ink-soft)]">
          {group.standings.length} teams
        </span>
      </div>
      <table className="mt-3 w-full border-separate border-spacing-y-1.5 text-sm">
        <thead>
          <tr className="text-left text-2xs uppercase tracking-[0.12em] text-[var(--home-ink-soft)]">
            <th scope="col" className="px-2 py-1 font-semibold">#</th>
            <th scope="col" className="px-2 py-1 font-semibold">Team</th>
            <th scope="col" className="px-2 py-1 text-center font-semibold">P</th>
            <th scope="col" className="hidden px-2 py-1 text-center font-semibold sm:table-cell">
              W
            </th>
            <th scope="col" className="hidden px-2 py-1 text-center font-semibold sm:table-cell">
              D
            </th>
            <th scope="col" className="hidden px-2 py-1 text-center font-semibold sm:table-cell">
              L
            </th>
            <th scope="col" className="px-2 py-1 text-center font-semibold">GD</th>
            <th scope="col" className="px-2 py-1 text-center font-semibold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {group.standings.map((row, index) => {
            const isSelected = row.teamId === selectedTeamId;
            const dotColor =
              index < 2
                ? "var(--home-positive)"
                : index === 2
                  ? "var(--home-signal)"
                  : "var(--home-rule)";
            const dotTitle =
              index < 2
                ? "In a direct qualifying place"
                : index === 2
                  ? "In the third-place wildcard race"
                  : "";
            return (
              <tr
                key={row.teamId}
                className="border border-[var(--home-rule)]"
                style={
                  isSelected
                    ? {
                        background:
                          "color-mix(in srgb, var(--home-signal) 9%, var(--home-paper-alt))",
                      }
                    : { background: "var(--home-paper-alt)" }
                }
              >
                <td className="rounded-l-xl px-2 py-2 align-middle">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: dotColor }}
                      title={dotTitle}
                    />
                    <span className="font-semibold text-[var(--home-ink)]">
                      {row.rank}
                    </span>
                  </span>
                </td>
                <td className="px-2 py-2 align-middle">
                  <button
                    type="button"
                    onClick={() => onOpenTeam(row.teamId)}
                    className="flex min-h-[44px] w-full items-center gap-2 rounded-lg text-left transition hover:text-[var(--home-signal)]"
                  >
                    <CrestAvatar crest={row.crest} name={row.name} size="sm" />
                    <span className="truncate font-semibold text-[var(--home-ink)]">
                      {row.code || row.name}
                    </span>
                  </button>
                </td>
                <td className="px-2 py-2 text-center align-middle text-[var(--home-ink-muted)]">
                  {row.played}
                </td>
                <td className="hidden px-2 py-2 text-center align-middle text-[var(--home-ink-muted)] sm:table-cell">
                  {row.wins}
                </td>
                <td className="hidden px-2 py-2 text-center align-middle text-[var(--home-ink-muted)] sm:table-cell">
                  {row.draws}
                </td>
                <td className="hidden px-2 py-2 text-center align-middle text-[var(--home-ink-muted)] sm:table-cell">
                  {row.losses}
                </td>
                <td className="px-2 py-2 text-center align-middle text-[var(--home-ink-muted)]">
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </td>
                <td className="rounded-r-xl px-2 py-2 text-center align-middle font-bold text-[var(--home-ink)]">
                  {row.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </SurfaceCard>
  );
}

function ThirdPlaceRace({
  rows,
  started,
  selectedTeamId,
  onOpenTeam,
}: {
  rows: ThirdPlaceRow[];
  started: boolean;
  selectedTeamId: string | null;
  onOpenTeam: (teamId: string) => void;
}) {
  if (rows.length === 0) return null;

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-[var(--home-rule)] pb-4">
        <div className="flex items-center gap-2">
          <Medal className="h-5 w-5 flex-shrink-0 text-[var(--home-signal)]" />
          <h2 className="text-lg font-bold text-[var(--home-ink)]">
            Third-place race
          </h2>
        </div>
        <span className="text-sm text-[var(--home-ink-muted)]">
          Best {THIRD_PLACE_QUALIFY_COUNT} of {rows.length} advance
        </span>
      </div>

      {!started ? (
        <p className="mt-4 text-sm leading-6 text-[var(--home-ink-muted)]">
          For the first time the World Cup keeps eight third-placed teams. Once
          the group matches begin, the side that finishes third in every group is
          ranked here by points, then goal difference, then goals scored, and the
          best eight join the top two from each group in the Round of 32.
        </p>
      ) : (
        <>
          <table className="mt-4 w-full border-separate border-spacing-y-1.5 text-sm">
            <thead>
              <tr className="text-left text-2xs uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                <th className="px-2 py-1 font-semibold">#</th>
                <th className="px-2 py-1 font-semibold">Team</th>
                <th className="px-2 py-1 text-center font-semibold">Grp</th>
                <th className="px-2 py-1 text-center font-semibold">P</th>
                <th className="px-2 py-1 text-center font-semibold">GD</th>
                <th className="px-2 py-1 text-center font-semibold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSelected = row.teamId === selectedTeamId;
                return (
                  <tr
                    key={row.teamId}
                    className="border border-[var(--home-rule)]"
                    style={
                      isSelected
                        ? {
                            background:
                              "color-mix(in srgb, var(--home-signal) 9%, var(--home-paper-alt))",
                          }
                        : { background: "var(--home-paper-alt)" }
                    }
                  >
                    <td className="rounded-l-xl px-2 py-2 align-middle">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          style={{
                            backgroundColor: row.qualifies
                              ? "var(--home-positive)"
                              : "var(--home-rule)",
                          }}
                          title={
                            row.qualifies
                              ? "In a qualifying place"
                              : "Outside the cut"
                          }
                        />
                        <span className="font-semibold text-[var(--home-ink)]">
                          {row.rank}
                        </span>
                      </span>
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => onOpenTeam(row.teamId)}
                        className="flex min-h-[44px] w-full items-center gap-2 rounded-lg text-left transition hover:text-[var(--home-signal)]"
                      >
                        <CrestAvatar crest={row.crest} name={row.name} size="sm" />
                        <span className="truncate font-semibold text-[var(--home-ink)]">
                          {row.code || row.name}
                        </span>
                      </button>
                    </td>
                    <td className="px-2 py-2 text-center align-middle text-[var(--home-ink-muted)]">
                      {row.group}
                    </td>
                    <td className="px-2 py-2 text-center align-middle text-[var(--home-ink-muted)]">
                      {row.played}
                    </td>
                    <td className="px-2 py-2 text-center align-middle text-[var(--home-ink-muted)]">
                      {row.goalDifference > 0
                        ? `+${row.goalDifference}`
                        : row.goalDifference}
                    </td>
                    <td className="rounded-r-xl px-2 py-2 text-center align-middle font-bold text-[var(--home-ink)]">
                      {row.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs leading-5 text-[var(--home-ink-muted)]">
            The top {THIRD_PLACE_QUALIFY_COUNT} third-placed teams reach the Round
            of 32. The order stays provisional until every group has finished.
          </p>
        </>
      )}
    </SurfaceCard>
  );
}

function KnockoutView({
  rounds,
  selectedTeamId,
  onOpenTeam,
}: {
  rounds: WorldCupSummarySnapshot["knockout"];
  selectedTeamId: string | null;
  onOpenTeam: (teamId: string) => void;
}) {
  if (rounds.length === 0) {
    return (
      <EmptyPanel
        title="The bracket builds after the group stage"
        description="For the first time the knockout stage opens with a Round of 32: the top two from every group plus the eight best third-placed teams. From there it runs through the Round of 16, quarterfinals, semifinals, and the final on July 19."
      />
    );
  }

  return (
    <div className="space-y-5">
      {rounds.map((round) => (
        <SurfaceCard key={round.id} className="p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-[var(--home-rule)] pb-4">
            <h3 className="text-lg font-semibold text-[var(--home-ink)]">
              {round.name}
            </h3>
            <span className="text-sm text-[var(--home-ink-muted)]">
              {round.fixtures.length} ties
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {round.fixtures.map((fixture) => (
              <FixtureCard
                key={fixture.id}
                fixture={fixture}
                contextTeamId={selectedTeamId}
                onOpenTeam={onOpenTeam}
                fallbackLabel={round.name}
              />
            ))}
          </div>
        </SurfaceCard>
      ))}
    </div>
  );
}

function worldCupFixtureLabel(fixture: unknown): string {
  const { stage, group } = fixture as { stage?: string | null; group?: string | null };
  if (group) return `Group ${group}`;
  return stage || "World Cup match";
}

function ScheduleView({
  recentFixtures,
  upcomingFixtures,
  onOpenTeam,
}: {
  recentFixtures: WorldCupSummarySnapshot["recentFixtures"];
  upcomingFixtures: WorldCupSummarySnapshot["upcomingFixtures"];
  onOpenTeam: (teamId: string) => void;
}) {
  if (recentFixtures.length === 0 && upcomingFixtures.length === 0) {
    return (
      <EmptyPanel
        title="The full schedule lands here"
        description="Once ESPN publishes the fixtures, recent results and upcoming matches show up in this view, grouped by day and linked to each team."
      />
    );
  }

  return (
    <div className="space-y-5">
      {upcomingFixtures.length > 0 && (
        <FixtureGroupSection
          title="Next up"
          description="Upcoming matches"
          fixtures={upcomingFixtures}
          onOpenTeam={onOpenTeam}
          getFallbackLabel={worldCupFixtureLabel}
        />
      )}
      {recentFixtures.length > 0 && (
        <FixtureGroupSection
          title="Recent slate"
          description="Latest results"
          fixtures={recentFixtures}
          onOpenTeam={onOpenTeam}
          getFallbackLabel={worldCupFixtureLabel}
        />
      )}
    </div>
  );
}

function FormatCard({
  tournament,
}: {
  tournament: WorldCupSummarySnapshot["tournament"];
}) {
  return (
    <SurfaceCard className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">
        How 2026 works
      </p>
      <h2 className="mt-2 text-lg font-bold text-[var(--home-ink)]">
        A bigger, three-country World Cup
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--home-ink-muted)]">
        {tournament.format}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[var(--home-rule)] pt-4">
        {(
          [
            ["Teams", `${tournament.teamCount}`],
            ["Groups", `${tournament.groupCount}`],
            ["Matches", `${tournament.matchCount}`],
            ["Host cities", `${tournament.venues.length}`],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-2">
            <dt className="text-2xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-soft)]">
              {label}
            </dt>
            <dd className="text-sm font-bold text-[var(--home-ink)]">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--home-rule)] pt-4">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-soft)]">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatTournamentWindow(tournament.startDate, tournament.endDate)}
        </span>
      </div>
      <p className="mt-4 text-xs leading-5 text-[var(--home-ink-muted)]">
        Pick any team from the group tables to pin its standing, recent form, and
        upcoming fixtures here.
      </p>
    </SurfaceCard>
  );
}

function TeamDetailCard({
  option,
  snapshot,
  isLoading,
  error,
  onClear,
  onOpenTeam,
}: {
  option: WorldCupTeamOption;
  snapshot: WorldCupTeamSnapshot | null;
  isLoading: boolean;
  error: string | null;
  onClear: () => void;
  onOpenTeam: (teamId: string) => void;
}) {
  const standing = snapshot?.standing ?? null;
  const form = snapshot?.form?.sequence ?? [];
  const recent = (snapshot?.recentFixtures ?? []).slice(0, 3);
  const upcoming = (snapshot?.upcomingFixtures ?? []).slice(0, 3);

  return (
    <SurfaceCard className="p-5" aria-live="polite">
      <div className="flex items-start gap-3">
        <CrestAvatar crest={option.crest} name={option.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-[var(--home-ink)]">
            {option.name}
          </h2>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {option.group && <InfoChip label={`Group ${option.group}`} />}
            {option.code && <InfoChip label={option.code} />}
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selected team"
          className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink-muted)] transition hover:text-[var(--home-signal)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {standing && (
        <dl className="mt-4 grid grid-cols-3 gap-x-3 gap-y-2 border-t border-[var(--home-rule)] pt-4">
          {(
            [
              ["Pos", `${standing.rank}`],
              ["Pld", `${standing.played}`],
              ["Pts", `${standing.points}`],
              ["W-D-L", `${standing.wins}-${standing.draws}-${standing.losses}`],
              ["GF", `${standing.goalsFor}`],
              [
                "GD",
                standing.goalDifference > 0
                  ? `+${standing.goalDifference}`
                  : `${standing.goalDifference}`,
              ],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-3xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-soft)]">
                {label}
              </dt>
              <dd className="text-sm font-bold text-[var(--home-ink)]">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {form.length > 0 && (
        <div className="mt-4 border-t border-[var(--home-rule)] pt-4">
          <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-soft)]">
            Form (last 5)
          </p>
          <div className="mt-2 flex gap-1.5">
            {form.map((result, index) => (
              <TeamResultPill key={index} result={result} />
            ))}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-4 border-t border-[var(--home-rule)] pt-4">
          <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-soft)]">
            Recent results
          </p>
          <div className="space-y-2">
            {recent.map((fixture) => (
              <FixtureCard
                key={fixture.id}
                fixture={fixture}
                contextTeamId={option.id}
                onOpenTeam={onOpenTeam}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mt-4 border-t border-[var(--home-rule)] pt-4">
          <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-soft)]">
            Upcoming
          </p>
          <div className="space-y-2">
            {upcoming.map((fixture) => (
              <FixtureCard
                key={fixture.id}
                fixture={fixture}
                contextTeamId={option.id}
                onOpenTeam={onOpenTeam}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {!snapshot && (isLoading || error) && (
        <p
          className="mt-4 border-t border-[var(--home-rule)] pt-4 text-sm text-[var(--home-ink-muted)]"
          role={error ? "alert" : "status"}
        >
          {isLoading ? "Loading team snapshot…" : error}
        </p>
      )}

      {snapshot && !standing && recent.length === 0 && upcoming.length === 0 && (
        <p className="mt-4 border-t border-[var(--home-rule)] pt-4 text-sm text-[var(--home-ink-muted)]">
          Standings and fixtures for {option.name} appear here once the
          tournament is underway.
        </p>
      )}
    </SurfaceCard>
  );
}
