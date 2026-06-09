"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, CircleAlert, ExternalLink, Shield, TrendingUp, Trophy } from "lucide-react";
import {
  StatCard,
  MetricCard,
  CrestAvatar,
  TeamResultPill,
  FixtureCard,
  LeaderList,
} from "@/components/football";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";
import {
  Article,
  Briefcase,
  Calendar,
  ChartBar,
  User,
} from "@/components/ui/ServerIcons";
import type {
  LaLigaClub,
  LaLigaLeader,
  LaLigaRouteState,
  LaLigaSummarySnapshot,
  LaLigaTeamSnapshot,
  LaLigaView,
} from "@/types/la-liga";
import {
  buildLaLigaHref,
  canonicalizeLaLigaClubId,
  DEFAULT_LA_LIGA_STATE,
  filterClubsForView,
  getDefaultClubForView,
  LA_LIGA_ROUTE,
  normalizeLaLigaState,
} from "./la-liga-state";

interface LaLigaClientProps {
  initialState: LaLigaRouteState;
  summary: LaLigaSummarySnapshot;
  initialTeamSnapshot: LaLigaTeamSnapshot | null;
}

async function fetchLaLigaTeamSnapshot(
  clubId: string,
  signal: AbortSignal
): Promise<LaLigaTeamSnapshot> {
  const response = await fetch(`/api/la-liga/teams/${clubId}`, { signal });
  const payload = (await response.json()) as LaLigaTeamSnapshot & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "Unable to load club snapshot.");
  }

  return payload;
}

const viewOptions: Array<{
  id: LaLigaView;
  label: string;
  description: string;
}> = [
  {
    id: "table",
    label: "Full table",
    description: "All 20 clubs in the current standings order.",
  },
  {
    id: "title-race",
    label: "Title chase",
    description: "The top four clubs still shaping the top of the table.",
  },
  {
    id: "europe",
    label: "European places",
    description: "The clubs currently inside the Champions, Europa, and Conference lines.",
  },
  {
    id: "relegation",
    label: "Relegation fight",
    description: "Bottom-five pressure view around the safety line.",
  },
];

export function LaLigaClient({
  initialState,
  summary,
  initialTeamSnapshot,
}: LaLigaClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const currentHref = `${LA_LIGA_ROUTE}${currentQuery ? `?${currentQuery}` : ""}`;
  const clubs = summary.clubs;
  const clubById = useMemo(() => new Map(clubs.map((club) => [club.id, club])), [clubs]);
  const clubLookup = useMemo(
    () => new Map(clubs.map((club) => [club.id, club.shortName])),
    [clubs]
  );
  const attackRankByClub = useMemo(() => (
    new Map(
      clubs
        .toSorted((left, right) => right.goalsFor - left.goalsFor || left.position - right.position)
        .map((club, index) => [club.id, index + 1] as const)
    )
  ), [clubs]);
  const defenseRankByClub = useMemo(() => (
    new Map(
      clubs
        .toSorted(
          (left, right) => left.goalsAgainst - right.goalsAgainst || left.position - right.position
        )
        .map((club, index) => [club.id, index + 1] as const)
    )
  ), [clubs]);
  const scorersByClub = useMemo(() => groupLeadersByClub(summary.scorers), [summary.scorers]);
  const crestByClubId = useMemo(() => (
    new Map(
      summary.teams.map((team) => [
        canonicalizeLaLigaClubId(team.id) ?? team.id,
        team.crest,
      ] as const)
    )
  ), [summary.teams]);
  const snapshotDateLabel = useMemo(() => (
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(summary.updatedAt))
  ), [summary.updatedAt]);
  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("club") !== null;
  const routeState = hasManagedParams ? normalizeLaLigaState(searchParams) : initialState;
  const visibleClubs = filterClubsForView(routeState.view);
  const selectedClubId = visibleClubs.some((club) => club.id === routeState.club)
    ? routeState.club
    : getDefaultClubForView(routeState.view);
  const selectedClub = clubById.get(selectedClubId) ?? clubs[0];
  const [teamSnapshots, setTeamSnapshots] = useState<Record<string, LaLigaTeamSnapshot>>(
    () => (selectedClubId && initialTeamSnapshot ? { [selectedClubId]: initialTeamSnapshot } : {})
  );
  const [loadingClubId, setLoadingClubId] = useState<string | null>(null);
  const [teamSnapshotError, setTeamSnapshotError] = useState<string | null>(null);
  const teamSnapshot = teamSnapshots[selectedClub.id] ?? null;
  const isTeamSnapshotLoading = loadingClubId === selectedClub.id;
  const desiredHref = buildLaLigaHref(
    {
      view: routeState.view,
      club: selectedClubId,
    },
    searchParams
  );

  useEffect(() => {
    if (currentHref === desiredHref) {
      return;
    }

    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  function navigate(nextState: LaLigaRouteState) {
    const href = buildLaLigaHref(nextState, searchParams);
    if (href === currentHref) {
      return;
    }

    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function handleViewChange(view: LaLigaView) {
    const nextClubs = filterClubsForView(view);
    const nextClub = nextClubs.some((club) => club.id === selectedClubId)
      ? selectedClubId
      : nextClubs[0]?.id ?? DEFAULT_LA_LIGA_STATE.club;

    navigate({ view, club: nextClub });
  }

  function handleClubChange(clubId: string) {
    navigate({
      view: routeState.view,
      club: canonicalizeLaLigaClubId(clubId) ?? DEFAULT_LA_LIGA_STATE.club,
    });
  }

  useEffect(() => {
    if (teamSnapshots[selectedClub.id]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset loading/error flags when cached snapshot exists for the selected club
      setLoadingClubId(null);
      setTeamSnapshotError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setLoadingClubId(selectedClub.id);
    setTeamSnapshotError(null);

    fetchLaLigaTeamSnapshot(selectedClub.id, controller.signal)
      .then((snapshot) => {
        if (cancelled) {
          return;
        }

        setTeamSnapshots((current) => (
          current[selectedClub.id] ? current : { ...current, [selectedClub.id]: snapshot }
        ));
      })
      .catch((error: Error) => {
        if (!cancelled && error.name !== "AbortError") {
          setTeamSnapshotError(error.message || "Unable to load club snapshot.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingClubId((current) => (current === selectedClub.id ? null : current));
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedClub.id, teamSnapshots]);

  const leader = clubs[0];
  const runnerUp = clubs[1];
  const fourthPlace = clubs[3];
  const fifthPlace = clubs[4];
  const sixthPlace = clubs[5];
  const seventhPlace = clubs[6];
  const safetyLine = clubs[16];
  const dropLine = clubs[17];
  const clubStoryline = getClubStoryline(selectedClub, {
    leader,
    runnerUp,
    fifthPlace,
    seventhPlace,
    sixthPlace,
    safetyLine,
    dropLine,
  });
  const clubPressurePoints = getClubPressurePoints(selectedClub, {
    attackRankByClub,
    defenseRankByClub,
    leader,
    runnerUp,
    fifthPlace,
    seventhPlace,
    sixthPlace,
    safetyLine,
    dropLine,
  });
  const clubScorers = scorersByClub.get(selectedClub.id) ?? [];
  const selectedZone = getClubZone(selectedClub.position);
  const formSequence = teamSnapshot?.form?.sequence ?? [];
  const recentFixtures = (teamSnapshot?.recentFixtures ?? []).slice(0, 3);
  const upcomingFixtures = (teamSnapshot?.upcomingFixtures ?? []).slice(0, 3);
  const [activeDetailTab, setActiveDetailTab] = useState<"club" | "fixtures" | "scorers">("club");

  // Stats panel cells
  const topScorerEntry = summary.scorers[0] ?? null;
  const topScorerClub = topScorerEntry ? clubLookup.get(topScorerEntry.clubId) ?? topScorerEntry.clubCode : null;
  const goalsForLeader = useMemo(
    () => [...clubs].sort((a, b) => b.goalsFor - a.goalsFor || a.position - b.position)[0] ?? null,
    [clubs]
  );
  const bestDefense = useMemo(
    () => [...clubs].sort((a, b) => a.goalsAgainst - b.goalsAgainst || a.position - b.position)[0] ?? null,
    [clubs]
  );
  const totalMatchdays = 38;

  const statsPanelCells: HomeStatsCell[] = [
    {
      label: "Title leader",
      tooltip: "Club currently top of the table and their points total.",
      value: leader ? `${leader.shortName} · ${leader.points} pts` : "—",
      sub: leader && runnerUp ? `${leader.points - runnerUp.points} clear of ${runnerUp.shortName}` : undefined,
    },
    {
      label: "Top-four gap",
      tooltip: "Points buffer the fourth-placed club holds over the fifth-placed club.",
      value: fourthPlace && fifthPlace ? `+${fourthPlace.points - fifthPlace.points} pts` : "—",
      sub: "Champions League line",
    },
    {
      label: "Europe line gap",
      tooltip: "Points cushion the sixth-placed club holds over the seventh-placed club.",
      value: sixthPlace && seventhPlace ? `+${sixthPlace.points - seventhPlace.points} pts` : "—",
      sub: "Europa / Conference",
    },
    {
      label: "Relegation gap",
      tooltip: "Points the seventeenth-placed club holds over the eighteenth-placed club.",
      value: safetyLine && dropLine ? `+${safetyLine.points - dropLine.points} pt` : "—",
      sub: "Safety margin",
    },
    {
      label: "Top scorer",
      tooltip: "Leading goalscorer in La Liga this season.",
      value: topScorerEntry ? `${topScorerEntry.name} · ${topScorerEntry.total}` : "—",
      sub: topScorerClub ?? undefined,
    },
    {
      label: "Most goals scored",
      tooltip: "Club with the highest goals-for total this season.",
      value: goalsForLeader ? `${goalsForLeader.shortName} · ${goalsForLeader.goalsFor}` : "—",
    },
    {
      label: "Best defense",
      tooltip: "Club with the fewest goals conceded this season.",
      value: bestDefense ? `${bestDefense.shortName} · ${bestDefense.goalsAgainst}` : "—",
    },
    {
      label: "Matchday",
      tooltip: "Current matchday position within the 38-game season.",
      value: summary.matchday ? `${summary.matchday} of ${totalMatchdays}` : `— of ${totalMatchdays}`,
    },
  ];

  return (
    <div className="home-page min-h-screen">
      <div className="home-shell home-section space-y-5 sm:space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="home-kicker mb-1">Football Data Tool</p>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--home-ink)] sm:text-3xl">
              La Liga Pulse
            </h1>
            <p className="mt-1 max-w-[52ch] text-sm leading-6 text-[var(--home-ink-muted)]">
              La Liga&apos;s title race compressed into one view. Top-four gaps, European qualification pressure, and relegation context, updated weekly.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-2xs text-[var(--home-ink-muted)]">
            {[
              `Season ${summary.season}`,
              `Matchday ${summary.matchday}`,
              `Snapshot ${snapshotDateLabel}`,
            ].map((label) => (
              <span key={label} className="rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 py-1 font-medium">
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Dense stats panel */}
        <HomeStatsPanel
          id="laliga-stats-panel"
          title="La Liga at a glance"
          meta={`Live · refreshed ${snapshotDateLabel}`}
          cells={statsPanelCells}
          pills={[
            { label: "Standings", href: "#laliga-standings", icon: ChartBar },
            { label: "Top scorers", href: "?view=table", icon: User },
            { label: "Recent fixtures", href: "?view=table", icon: Calendar },
            { label: "Upcoming fixtures", href: "?view=table", icon: Calendar },
            { label: "Club detail", href: "?view=table", icon: Briefcase },
            { label: "Article", href: "/writing", icon: Article },
          ]}
        />

        {/* Key gaps */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            variant="compact"
            eyebrow="Leader"
            metric={`${leader.shortName} · ${leader.points} pts`}
            detail={`${leader.points - runnerUp.points} clear of ${runnerUp.shortName}`}
            icon={<Trophy className="h-4 w-4" />}
          />
          <StatCard
            variant="compact"
            eyebrow="Top-four line"
            metric={`+${fourthPlace.points - fifthPlace.points} pts`}
            detail={`${fourthPlace.shortName} over ${fifthPlace.shortName}`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            variant="compact"
            eyebrow="Europe line"
            metric={`+${sixthPlace.points - seventhPlace.points} pts`}
            detail={`${sixthPlace.shortName} over ${seventhPlace.shortName}`}
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <StatCard
            variant="compact"
            eyebrow="Safety line"
            metric={`+${safetyLine.points - dropLine.points} pt`}
            detail={`${safetyLine.shortName} over ${dropLine.shortName}`}
            icon={<Shield className="h-4 w-4" />}
          />
        </div>

        {/* Main standings + sidebar */}
        <div id="laliga-standings" className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-5 sm:p-6 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between border-b border-[var(--home-rule)] pb-4">
              <h2 className="text-lg font-bold text-[var(--home-ink)]">Standings</h2>
              <span className="text-sm text-[var(--home-ink-muted)]">{visibleClubs.length} clubs</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {viewOptions.map((option) => {
                const isActive = option.id === routeState.view;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleViewChange(option.id)}
                    aria-pressed={isActive}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                    style={getViewButtonStyle(isActive)}
                  >
                    <span className="text-[var(--home-ink)]">{option.label}</span>
                    <span className="text-xs text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">{filterClubsForView(option.id).length}</span>
                  </button>
                );
              })}
            </div>

            <div
              className="scroll-shadow-x mt-6 overflow-x-auto"
              role="region"
              aria-label="La Liga standings (scrollable)"
              tabIndex={0}
            >
              <table className="min-w-full border-separate border-spacing-y-2" aria-label="La Liga standings">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.14em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                    <th className="px-3 py-2 font-semibold">Pos</th>
                    <th className="px-3 py-2 font-semibold">Club</th>
                    <th className="hidden px-3 py-2 font-semibold sm:table-cell">Record</th>
                    <th className="px-3 py-2 font-semibold">Pts</th>
                    <th className="hidden px-3 py-2 font-semibold md:table-cell">PPG</th>
                    <th className="hidden px-3 py-2 font-semibold lg:table-cell">GF</th>
                    <th className="hidden px-3 py-2 font-semibold lg:table-cell">GA</th>
                    <th className="px-3 py-2 font-semibold">GD</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleClubs.map((club) => {
                    const isSelected = club.id === selectedClub.id;
                    const zone = getClubZone(club.position);

                    return (
                      <tr
                        key={club.id}
                        className="border border-[var(--home-rule)]"
                        style={getTableRowStyle(isSelected)}
                      >
                        <td className="rounded-l-2xl px-3 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: getZoneDotColor(zone) }}
                              title={getZoneLabel(zone)}
                            />
                            <span className="text-sm font-semibold text-[var(--home-ink)]">{club.position}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <button
                            type="button"
                            onClick={() => handleClubChange(club.id)}
                            aria-pressed={isSelected}
                            aria-label={`Show ${club.name} details`}
                            className="flex min-h-[44px] w-full items-center gap-2 rounded-xl text-left"
                          >
                            <CrestAvatar crest={crestByClubId.get(club.id) ?? null} name={club.shortName} size="sm" />
                            <span className="font-semibold text-[var(--home-ink)]">{club.shortName}</span>
                          </button>
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] sm:table-cell">
                          {club.won}-{club.drawn}-{club.lost}
                        </td>
                        <td className="px-3 py-3 align-middle text-sm font-semibold text-[var(--home-ink)]">
                          {club.points}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] md:table-cell">
                          {formatFixed(club.points / club.played)}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] lg:table-cell">
                          {club.goalsFor}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] lg:table-cell">
                          {club.goalsAgainst}
                        </td>
                        <td className="rounded-r-2xl px-3 py-3 align-middle text-sm font-medium text-[var(--home-ink)]">
                          {club.goalDifference > 0 ? `+${club.goalDifference}` : club.goalDifference}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Compact club sidebar */}
          <aside className="md:sticky md:top-28 md:self-start">
            <section
              className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-5 shadow-[var(--shadow-sm)]"
              aria-live="polite"
              data-testid="la-liga-selected-club"
            >
              <div className="flex items-start gap-3">
                <CrestAvatar
                  crest={crestByClubId.get(selectedClub.id) ?? null}
                  name={selectedClub.name}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-bold text-[var(--home-ink)]">
                    {selectedClub.name}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span
                      className="inline-flex items-center rounded-full border px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.12em]"
                      style={getZonePillStyle(selectedZone)}
                    >
                      {getZoneLabel(selectedZone)}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                      {selectedClub.points} pts
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                      {38 - selectedClub.played} left
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 rounded-xl bg-[var(--home-haze)] px-3 py-2 text-center text-[var(--home-paper)] shadow-sm">
                  <p className="text-3xs uppercase tracking-[0.14em] opacity-80">Pos</p>
                  <p className="text-xl font-bold">{selectedClub.position}</p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[var(--home-rule)] pt-4">
                {([
                  ["PPG", formatFixed(selectedClub.points / selectedClub.played)],
                  ["Record", `${selectedClub.won}-${selectedClub.drawn}-${selectedClub.lost}`],
                  ["Attack", `#${attackRankByClub.get(selectedClub.id) ?? "-"}`],
                  ["Defense", `#${defenseRankByClub.get(selectedClub.id) ?? "-"}`],
                  ["GF/m", formatFixed(selectedClub.goalsFor / selectedClub.played)],
                  ["GA/m", formatFixed(selectedClub.goalsAgainst / selectedClub.played)],
                ] as const).map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-2">
                    <dt className="text-2xs font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">{label}</dt>
                    <dd className="text-sm font-bold text-[var(--home-ink)]">{value}</dd>
                  </div>
                ))}
              </dl>

              {formSequence.length > 0 && (
                <div className="mt-4 border-t border-[var(--home-rule)] pt-4">
                  <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">Form</p>
                  <div className="mt-2 flex gap-1.5">
                    {formSequence.slice(-5).map((result, i) => (
                      <TeamResultPill key={i} result={result} />
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--home-ink-muted)]">
                {clubStoryline}
              </p>

              {!teamSnapshot && (isTeamSnapshotLoading || teamSnapshotError) ? (
                <p
                  className="mt-4 border-t border-[var(--home-rule)] pt-4 text-sm text-[var(--home-ink-muted)]"
                  role={teamSnapshotError ? "alert" : "status"}
                  aria-live="polite"
                >
                  {isTeamSnapshotLoading
                    ? "Loading club snapshot…"
                    : teamSnapshotError}
                </p>
              ) : null}
            </section>
          </aside>
        </div>

        {/* Tabbed detail strip */}
        <div className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-5 sm:p-6 shadow-[var(--shadow-sm)]">
          <div
            className="flex gap-2 overflow-x-auto rounded-[24px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-1.5"
            role="tablist"
            aria-label="Club and league details"
          >
            {(["club", "fixtures", "scorers"] as const).map((tab) => {
              const labels = { club: "Club Detail", fixtures: "Fixtures", scorers: "Top Scorers" } as const;
              return (
                <button
                  key={tab}
                  id={`la-liga-detail-tab-${tab}`}
                  role="tab"
                  type="button"
                  aria-selected={activeDetailTab === tab}
                  aria-controls="la-liga-detail-panel"
                  tabIndex={activeDetailTab === tab ? 0 : -1}
                  onClick={() => setActiveDetailTab(tab)}
                  className={`min-h-[44px] whitespace-nowrap rounded-2xl px-5 py-2.5 text-sm font-semibold transition-colors ${
                    activeDetailTab === tab
                      ? "bg-[var(--home-haze)] text-[var(--home-paper)] shadow-sm"
                      : "text-[var(--home-ink-muted)] hover:bg-[var(--home-paper-alt)] hover:text-[var(--home-ink)]"
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          <div
            id="la-liga-detail-panel"
            role="tabpanel"
            aria-labelledby={`la-liga-detail-tab-${activeDetailTab}`}
            className="mt-6"
          >
            {activeDetailTab === "club" && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">Performance</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <MetricCard label="PPG" value={formatFixed(selectedClub.points / selectedClub.played)} />
                      <MetricCard label="Record" value={`${selectedClub.won}-${selectedClub.drawn}-${selectedClub.lost}`} />
                      <MetricCard label="Attack rank" value={`#${attackRankByClub.get(selectedClub.id) ?? "-"}`} />
                      <MetricCard label="Defense rank" value={`#${defenseRankByClub.get(selectedClub.id) ?? "-"}`} />
                      <MetricCard label="GF / match" value={formatFixed(selectedClub.goalsFor / selectedClub.played)} />
                      <MetricCard label="GA / match" value={formatFixed(selectedClub.goalsAgainst / selectedClub.played)} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
                    <p className="text-sm font-semibold text-[var(--home-ink)]">Pressure points</p>
                    <ul className="mt-3 space-y-2 pl-5 text-sm leading-relaxed text-[var(--home-ink-muted)]">
                      {clubPressurePoints.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <ClubLeaderCard
                    title="Top scorer"
                    leader={clubScorers[0]}
                    statLabel="Goals"
                    emptyLabel="No current top-10 scorer in this snapshot."
                  />

                  <p className="text-sm leading-relaxed text-[var(--home-ink-muted)]">
                    {clubStoryline}
                  </p>
                </div>

                {!teamSnapshot && (isTeamSnapshotLoading || teamSnapshotError) && (
                  <div
                    className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4"
                    role={teamSnapshotError ? "alert" : "status"}
                    aria-live="polite"
                  >
                    <p className="text-sm text-[var(--home-ink-muted)]">
                      {isTeamSnapshotLoading
                        ? "Loading recent club fixtures…"
                        : teamSnapshotError}
                    </p>
                  </div>
                )}

                {recentFixtures.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">Recent results</p>
                    <div className="mt-3 space-y-2">
                      {recentFixtures.map((fixture) => (
                        <FixtureCard
                          key={fixture.id}
                          fixture={fixture}
                          contextTeamId={teamSnapshot?.team?.id ?? undefined}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                )}

                {upcomingFixtures.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">Upcoming fixtures</p>
                    <div className="mt-3 space-y-2">
                      {upcomingFixtures.map((fixture) => (
                        <FixtureCard
                          key={fixture.id}
                          fixture={fixture}
                          contextTeamId={teamSnapshot?.team?.id ?? undefined}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === "fixtures" && (
              <div className="grid gap-6 md:grid-cols-2">
                {summary.recentFixtures.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">Recent slate</p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">Latest results</h3>
                    <div className="mt-4 space-y-3">
                      {summary.recentFixtures.map((f) => (
                        <FixtureCard key={f.id} fixture={f} onOpenTeam={handleClubChange} />
                      ))}
                    </div>
                  </div>
                )}
                {summary.upcomingFixtures.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">Next up</p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">Upcoming fixtures</h3>
                    <div className="mt-4 space-y-3">
                      {summary.upcomingFixtures.map((f) => (
                        <FixtureCard key={f.id} fixture={f} onOpenTeam={handleClubChange} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === "scorers" && (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">Goals leaderboard</p>
                      <h3 className="mt-2 text-xl font-bold text-[var(--home-ink)]">Top scorers</h3>
                    </div>
                    <a
                      href={summary.sourceUrls.scorers}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-2 text-sm font-medium text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-haze)]"
                    >
                      Official
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <LeaderList leaders={summary.scorers.slice(0, 5)} statLabel="goals" clubLookup={clubLookup} />
                </div>
                {summary.scorers.length > 5 && (
                  <div>
                    <LeaderList leaders={summary.scorers.slice(5, 10)} statLabel="goals" clubLookup={clubLookup} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <section className="rounded-3xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-5 text-sm text-[var(--home-ink-muted)] shadow-sm">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--home-haze)]" />
            <p className="mb-0 max-w-none leading-relaxed">
              This page is a curated snapshot rather than a live API feed. Standings come from the official LALIGA table, while the scorer and assist boards mirror the official stats pages linked above.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}


function ClubLeaderCard({
  title,
  leader,
  statLabel,
  emptyLabel,
}: {
  title: string;
  leader?: LaLigaLeader;
  statLabel: string;
  emptyLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
        {title}
      </p>
      {leader ? (
        <>
          <p className="mt-2 text-lg font-bold text-[var(--home-ink)]">{leader.name}</p>
          <p className="mt-1 text-sm text-[var(--home-ink-muted)]">
            {leader.total} {statLabel.toLowerCase()} in {leader.appearances} matches
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
            {formatFixed(leader.perMatch)} per match
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-[var(--home-ink-muted)]">{emptyLabel}</p>
      )}
    </div>
  );
}


function groupLeadersByClub(leaders: LaLigaLeader[]) {
  return leaders.reduce((map, leaderEntry) => {
    const existing = map.get(leaderEntry.clubId) ?? [];
    existing.push(leaderEntry);
    map.set(leaderEntry.clubId, existing);
    return map;
  }, new Map<string, LaLigaLeader[]>());
}

function getZoneDotColor(zone: ReturnType<typeof getClubZone>): string {
  switch (zone) {
    case "champions": return "var(--home-haze)";
    case "europa": return "var(--home-acid)";
    case "conference": return "var(--home-moss)";
    case "relegation": return "color-mix(in srgb, var(--home-ink) 65%, var(--home-stone))";
    default: return "var(--home-rule)";
  }
}

function getClubZone(position: number) {
  if (position <= 4) {
    return "champions";
  }

  if (position === 5) {
    return "europa";
  }

  if (position === 6) {
    return "conference";
  }

  if (position >= 18) {
    return "relegation";
  }

  return "midtable";
}

function getZoneLabel(zone: ReturnType<typeof getClubZone>) {
  switch (zone) {
    case "champions":
      return "Champions League";
    case "europa":
      return "Europa League";
    case "conference":
      return "Conference League";
    case "relegation":
      return "Relegation";
    case "midtable":
    default:
      return "Midtable";
  }
}

function getZonePillStyle(zone: ReturnType<typeof getClubZone>): CSSProperties {
  switch (zone) {
    case "champions":
      return {
        color: "var(--home-haze)",
        borderColor: "color-mix(in srgb, var(--home-haze) 30%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-haze) 10%, var(--home-paper-alt))",
      };
    case "europa":
      return {
        color: "color-mix(in srgb, var(--home-ink) 70%, var(--home-acid))",
        borderColor: "color-mix(in srgb, var(--home-acid) 50%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-acid) 22%, var(--home-paper-alt))",
      };
    case "conference":
      return {
        color: "color-mix(in srgb, var(--home-ink) 75%, var(--home-moss))",
        borderColor: "color-mix(in srgb, var(--home-moss) 55%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-moss) 22%, var(--home-paper-alt))",
      };
    case "relegation":
      return {
        color: "var(--home-ink)",
        borderColor: "color-mix(in srgb, var(--home-ink) 30%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-stone) 65%, var(--home-paper-alt))",
      };
    case "midtable":
    default:
      return {
        color: "var(--home-ink-muted)",
        borderColor: "var(--home-rule)",
        background: "var(--home-paper-alt)",
      };
  }
}

function getViewButtonStyle(isActive: boolean): CSSProperties {
  if (isActive) {
    return {
      borderColor: "color-mix(in srgb, var(--home-haze) 35%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-haze) 9%, var(--home-paper-alt))",
      boxShadow: "var(--shadow-sm)",
    };
  }

  return {
    borderColor: "var(--home-rule)",
    background: "var(--home-paper-alt)",
  };
}

function getTableRowStyle(isSelected: boolean): CSSProperties {
  if (isSelected) {
    return {
      borderColor: "color-mix(in srgb, var(--home-haze) 35%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-haze) 9%, var(--home-paper-alt))",
    };
  }

  return {
    borderColor: "var(--home-rule)",
    background: "var(--home-paper-alt)",
  };
}

function getClubStoryline(
  club: LaLigaClub,
  context: {
    leader: LaLigaClub;
    runnerUp: LaLigaClub;
    fifthPlace: LaLigaClub;
    seventhPlace: LaLigaClub;
    sixthPlace: LaLigaClub;
    safetyLine: LaLigaClub;
    dropLine: LaLigaClub;
  }
) {
  const { leader, runnerUp, fifthPlace, seventhPlace, sixthPlace, safetyLine, dropLine } = context;

  if (club.position === 1) {
    return `${club.shortName} own the league lead, carry the division's best attack, and sit ${club.points - runnerUp.points} points clear of ${runnerUp.shortName}.`;
  }

  if (club.position <= 4) {
    return `${club.shortName} are ${leader.points - club.points} points off the pace and ${club.points - fifthPlace.points} clear of the Europa line below them.`;
  }

  if (club.position <= 6) {
    return `${club.shortName} currently occupy a European spot and have a ${club.points - seventhPlace.points}-point buffer over the first club outside qualification.`;
  }

  if (club.position <= 17) {
    return `${club.shortName} are ${sixthPlace.points - club.points} points short of Europe and ${club.points - dropLine.points} points above the current relegation line.`;
  }

  return `${club.shortName} are chasing safety from inside the bottom three and need ${safetyLine.points - club.points} more points just to draw level with the safe line.`;
}

function getClubPressurePoints(
  club: LaLigaClub,
  context: {
    attackRankByClub: Map<string, number>;
    defenseRankByClub: Map<string, number>;
    leader: LaLigaClub;
    runnerUp: LaLigaClub;
    fifthPlace: LaLigaClub;
    seventhPlace: LaLigaClub;
    sixthPlace: LaLigaClub;
    safetyLine: LaLigaClub;
    dropLine: LaLigaClub;
  }
) {
  const {
    attackRankByClub,
    defenseRankByClub,
    leader,
    runnerUp,
    fifthPlace,
    seventhPlace,
    sixthPlace,
    safetyLine,
    dropLine,
  } = context;
  const attackRank = attackRankByClub.get(club.id) ?? club.position;
  const defenseRank = defenseRankByClub.get(club.id) ?? club.position;

  if (club.position === 1) {
    return [
      `${club.points - runnerUp.points} points separate ${club.shortName} from ${runnerUp.shortName}.`,
      `${club.goalsFor} goals scored is the best attack in the division.`,
      `Nine league matches remain in this local snapshot.`,
      `Attack rank #${attackRank}; defense rank #${defenseRank}.`,
    ];
  }

  if (club.position <= 4) {
    return [
      `${leader.points - club.points} points back from the league lead.`,
      `${club.points - fifthPlace.points} points clear of the top-four cutoff.`,
      `Goal difference: ${club.goalDifference > 0 ? `+${club.goalDifference}` : club.goalDifference}.`,
      `Attack rank #${attackRank}; defense rank #${defenseRank}.`,
    ];
  }

  if (club.position <= 6) {
    return [
      `${club.points - seventhPlace.points} points above the first club outside Europe.`,
      `${leader.points - club.points} points back from first place.`,
      `Goals for/against: ${club.goalsFor} scored, ${club.goalsAgainst} conceded.`,
      `Attack rank #${attackRank}; defense rank #${defenseRank}.`,
    ];
  }

  if (club.position <= 17) {
    return [
      `${sixthPlace.points - club.points} points separate ${club.shortName} from Europe.`,
      `${club.points - dropLine.points} points above the drop line.`,
      `Goal difference: ${club.goalDifference > 0 ? `+${club.goalDifference}` : club.goalDifference}.`,
      `Attack rank #${attackRank}; defense rank #${defenseRank}.`,
    ];
  }

  return [
    `${safetyLine.points - club.points} points to reach the current safety line.`,
    `${club.goalsAgainst} goals conceded puts pressure on their run-in.`,
    `Only ${38 - club.played} matches remain in this snapshot.`,
    `Attack rank #${attackRank}; defense rank #${defenseRank}.`,
  ];
}

function formatFixed(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "—";
}
