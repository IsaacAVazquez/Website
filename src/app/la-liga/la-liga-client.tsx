"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, ExternalLink } from "lucide-react";
import {
  MetricCard,
  CrestAvatar,
  FixtureCard,
  StatFascia,
  ResultsTape,
  GoalsPulseStrip,
  SegmentedTabs,
  FixtureLedgerSection,
  groupFixturesByMatchday,
  LeaderLedger,
  ClubDrawer,
  type ClubDrawerClub,
  type ClubDrawerScorer,
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
  buildClubAliasMap,
  buildHref,
  canonicalizeClubId,
  filterClubs,
  getDefaultClub,
  LA_LIGA_ROUTE,
  normalizeState,
  resolveDefaultState,
} from "./la-liga-state.core";

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
  const aliasMap = useMemo(() => buildClubAliasMap(summary.teams), [summary.teams]);
  const defaultState = useMemo(() => resolveDefaultState(summary.clubs), [summary.clubs]);
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
        canonicalizeClubId(team.id, aliasMap) ?? team.id,
        team.crest,
      ] as const)
    )
  ), [summary.teams, aliasMap]);
  const snapshotDateLabel = useMemo(() => (
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(summary.updatedAt))
  ), [summary.updatedAt]);
  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("club") !== null;
  const routeState = hasManagedParams
    ? normalizeState(searchParams, defaultState, aliasMap)
    : initialState;
  const visibleClubs = filterClubs(summary.clubs, routeState.view);
  const selectedClubId = visibleClubs.some((club) => club.id === routeState.club)
    ? routeState.club
    : getDefaultClub(summary.clubs, routeState.view, defaultState.club);
  const selectedClub = clubById.get(selectedClubId) ?? clubs[0];
  const [teamSnapshots, setTeamSnapshots] = useState<Record<string, LaLigaTeamSnapshot>>(
    () => (selectedClubId && initialTeamSnapshot ? { [selectedClubId]: initialTeamSnapshot } : {})
  );
  const [loadingClubId, setLoadingClubId] = useState<string | null>(null);
  const [teamSnapshotError, setTeamSnapshotError] = useState<string | null>(null);
  const teamSnapshot = selectedClub ? teamSnapshots[selectedClub.id] ?? null : null;
  const isTeamSnapshotLoading = selectedClub ? loadingClubId === selectedClub.id : false;
  const desiredHref = buildHref(
    {
      view: routeState.view,
      club: selectedClubId,
    },
    defaultState,
    aliasMap,
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
    const href = buildHref(nextState, defaultState, aliasMap, searchParams);
    if (href === currentHref) {
      return;
    }

    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function handleViewChange(view: LaLigaView) {
    const nextClubs = filterClubs(summary.clubs, view);
    const nextClub = nextClubs.some((club) => club.id === selectedClubId)
      ? selectedClubId
      : nextClubs[0]?.id ?? defaultState.club;

    navigate({ view, club: nextClub });
  }

  function handleClubChange(clubId: string) {
    // Always open the drawer on an explicit club selection, independent of
    // `navigate`'s href diffing — `buildHref` strips the `club` query param
    // entirely when it matches the default club on the default view, so
    // drawer visibility can't be derived from the URL alone the way it can
    // for Premier League (whose `team` param is never auto-stripped).
    setIsDrawerOpen(true);
    navigate({
      view: routeState.view,
      club: canonicalizeClubId(clubId, aliasMap) ?? defaultState.club,
    });
  }

  function handleCloseDrawer() {
    setIsDrawerOpen(false);
  }

  useEffect(() => {
    if (!selectedClub) {
      return;
    }
    const clubId = selectedClub.id;
    if (teamSnapshots[clubId]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset loading/error flags when cached snapshot exists for the selected club
      setLoadingClubId(null);
      setTeamSnapshotError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setLoadingClubId(clubId);
    setTeamSnapshotError(null);

    fetchLaLigaTeamSnapshot(clubId, controller.signal)
      .then((snapshot) => {
        if (cancelled) {
          return;
        }

        setTeamSnapshots((current) => (
          current[clubId] ? current : { ...current, [clubId]: snapshot }
        ));
      })
      .catch((error: Error) => {
        if (!cancelled && error.name !== "AbortError") {
          setTeamSnapshotError(error.message || "Unable to load club snapshot.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingClubId((current) => (current === clubId ? null : current));
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedClub, teamSnapshots]);

  const [activeDetailTab, setActiveDetailTab] = useState<"club" | "fixtures" | "scorers">("club");
  // Mirrors a genuinely resolvable explicit `?club=` on first render (an
  // unknown/unaliasable value shouldn't pop the overlay just because the
  // query string carried something) — `handleClubChange` flips this on every
  // subsequent selection regardless of URL-diffing quirks.
  const [isDrawerOpen, setIsDrawerOpen] = useState(() => {
    const explicitClubId = canonicalizeClubId(searchParams.get("club"), aliasMap);
    return explicitClubId !== null && clubById.has(explicitClubId);
  });
  const goalsForLeader = useMemo(
    () => [...clubs].sort((a, b) => b.goalsFor - a.goalsFor || a.position - b.position)[0] ?? null,
    [clubs]
  );
  const bestDefense = useMemo(
    () => [...clubs].sort((a, b) => a.goalsAgainst - b.goalsAgainst || a.position - b.position)[0] ?? null,
    [clubs]
  );

  if (clubs.length < 18 || !selectedClub) {
    return (
      <div className="home-page min-h-screen">
        <div className="home-shell home-section space-y-5 sm:space-y-6">
          <div className="rounded-[var(--radius-2xl)] border border-dashed border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-6 text-sm text-[var(--home-ink-muted)]">
            <p className="home-kicker mb-2 text-[var(--home-ink)]">La Liga Pulse</p>
            <p className="mb-0">
              Standings, European places, and scorer leaders will appear here
              once the next snapshot is published.
            </p>
          </div>
        </div>
      </div>
    );
  }

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

  // Club drawer
  const drawerClub: ClubDrawerClub | null = isDrawerOpen
    ? {
      // Must match recentFixtures/upcomingFixtures' homeTeam/awayTeam ids —
      // those come from the team snapshot's numeric football-data.org id,
      // not `selectedClub.id` (the TLA-based standings/routing id).
      id: teamSnapshot?.team?.id ?? selectedClub.id,
      name: selectedClub.name,
      crest: teamSnapshot?.team?.crest ?? crestByClubId.get(selectedClub.id) ?? null,
      accentColor: selectedClub.accentColor ?? null,
      position: selectedClub.position,
      points: selectedClub.points,
      played: selectedClub.played,
      won: selectedClub.won,
      draw: selectedClub.drawn,
      lost: selectedClub.lost,
      goalsFor: selectedClub.goalsFor,
      goalsAgainst: selectedClub.goalsAgainst,
      goalDifference: selectedClub.goalDifference,
      manager: teamSnapshot?.team?.manager ?? null,
      venue: teamSnapshot?.team?.venue ?? null,
    }
    : null;
  const drawerTopScorers: ClubDrawerScorer[] = buildClubTopScorers(
    summary.scorers,
    summary.assists,
    selectedClub.id
  );

  // Stats panel cells
  const topScorerEntry = summary.scorers[0] ?? null;
  const topScorerClub = topScorerEntry ? clubLookup.get(topScorerEntry.clubId) ?? topScorerEntry.clubCode : null;
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
            <div className="flex items-center gap-3">
              <span
                className="relative inline-flex h-11 min-w-[46px] flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 font-mono text-sm text-[var(--home-ink)]"
                aria-hidden="true"
              >
                ESP
                <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-[var(--home-signal)]" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--home-ink)] sm:text-3xl">
                La Liga{" "}
                <em style={{ fontFamily: "var(--font-home-serif)", fontStyle: "italic", fontWeight: 400 }}>
                  Pulse
                </em>
              </h1>
            </div>
            <p className="mt-2 max-w-[52ch] text-sm leading-6 text-[var(--home-ink-muted)]">
              La Liga&apos;s title race compressed into one view. Top-four gaps, European qualification pressure, and relegation context, updated weekly.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.06em] text-[var(--home-ink-muted)]">
              <span
                className="h-1.5 w-1.5 rounded-full bg-[var(--home-positive)]"
                style={{ boxShadow: "0 0 0 4px color-mix(in srgb, var(--home-positive) 16%, transparent)" }}
                aria-hidden="true"
              />
              Matchday {summary.matchday} · Snapshot updated {snapshotDateLabel}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
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
            <GoalsPulseStrip
              data={summary.goalsPerMatchday ?? []}
              capLabel={
                (summary.goalsPerMatchday?.length ?? 0) > 0
                  ? `MD 01–${summary.goalsPerMatchday![summary.goalsPerMatchday!.length - 1].matchday}`
                  : undefined
              }
              className="hidden w-44 sm:block"
            />
          </div>
        </div>

        <ResultsTape
          recentFixtures={summary.recentFixtures}
          upcomingFixtures={summary.upcomingFixtures}
          label={
            <span className="inline-flex items-center gap-2">
              <span className="h-[7px] w-[7px] flex-shrink-0 rounded-full bg-[var(--home-signal)]" />
              {summary.matchday ? `Matchday ${summary.matchday} · latest` : "Latest results"}
            </span>
          }
          className="rounded-[var(--radius-sm)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_62%,var(--home-paper))] px-4 py-1"
        />

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

        {/* Key gaps — fused hairline stat fascia */}
        <StatFascia
          items={[
            {
              eyebrow: "Leader",
              metric: `${leader?.shortName ?? "—"} · ${leader?.points ?? "—"} pts`,
              detail: leader && runnerUp ? `${leader.points - runnerUp.points} clear of ${runnerUp.shortName}` : "Standings loading",
            },
            {
              eyebrow: "Top-four line",
              metric: fourthPlace && fifthPlace ? `+${fourthPlace.points - fifthPlace.points} pts` : "—",
              detail: fourthPlace && fifthPlace ? `${fourthPlace.shortName} over ${fifthPlace.shortName}` : "",
            },
            {
              eyebrow: "Europe line",
              metric: sixthPlace && seventhPlace ? `+${sixthPlace.points - seventhPlace.points} pts` : "—",
              detail: sixthPlace && seventhPlace ? `${sixthPlace.shortName} over ${seventhPlace.shortName}` : "",
            },
            {
              eyebrow: "Safety line",
              metric: safetyLine && dropLine ? `+${safetyLine.points - dropLine.points} pt` : "—",
              detail: safetyLine && dropLine ? `${safetyLine.shortName} over ${dropLine.shortName}` : "",
            },
          ]}
        />

        {/* Standings */}
        <div id="laliga-standings">
          <section className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] p-5 sm:p-6 shadow-[var(--shadow-sm)]">
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
                    <span className="text-xs text-[var(--home-ink-soft)]">{filterClubs(summary.clubs, option.id).length}</span>
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
                  <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
                    <th scope="col" className="px-3 py-2 font-semibold">Pos</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Club</th>
                    <th scope="col" className="hidden px-3 py-2 font-semibold sm:table-cell">Record</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Pts</th>
                    <th scope="col" className="hidden px-3 py-2 font-semibold md:table-cell">PPG</th>
                    <th scope="col" className="hidden px-3 py-2 font-semibold lg:table-cell">GF</th>
                    <th scope="col" className="hidden px-3 py-2 font-semibold lg:table-cell">GA</th>
                    <th scope="col" className="px-3 py-2 font-semibold">GD</th>
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
                            className="flex min-h-[44px] w-full items-center gap-2 rounded-[var(--radius-xl)] text-left"
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
        </div>

        {/* Tabbed detail strip */}
        <div className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] p-5 sm:p-6 shadow-[var(--shadow-sm)]">
          <SegmentedTabs
            tabs={[
              { id: "club", label: "Club Detail" },
              { id: "fixtures", label: "Fixtures" },
              { id: "scorers", label: "Top Scorers" },
            ]}
            activeId={activeDetailTab}
            onChange={(id) => setActiveDetailTab(id as typeof activeDetailTab)}
            ariaLabel="Club and league details"
            idPrefix="la-liga-detail-tab"
            panelId="la-liga-detail-panel"
          />

          <div
            id="la-liga-detail-panel"
            role="tabpanel"
            aria-labelledby={`la-liga-detail-tab-${activeDetailTab}`}
            className="mt-6"
          >
            {activeDetailTab === "club" && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <CrestAvatar crest={crestByClubId.get(selectedClub.id) ?? null} name={selectedClub.name} size="md" />
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold text-[var(--home-ink)]">{selectedClub.name}</h3>
                        <span
                          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-3xs font-semibold uppercase tracking-[0.12em]"
                          style={getZonePillStyle(selectedZone)}
                        >
                          {getZoneLabel(selectedZone)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleClubChange(selectedClub.id)}
                      className="inline-flex min-h-[44px] flex-shrink-0 items-center gap-1.5 rounded-[var(--radius-xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3.5 text-sm font-medium text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-signal)]"
                    >
                      Open detail
                    </button>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">Performance</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <MetricCard label="PPG" value={formatFixed(selectedClub.points / selectedClub.played)} />
                      <MetricCard label="Record" value={`${selectedClub.won}-${selectedClub.drawn}-${selectedClub.lost}`} />
                      <MetricCard label="Attack rank" value={`#${attackRankByClub.get(selectedClub.id) ?? "-"}`} />
                      <MetricCard label="Defense rank" value={`#${defenseRankByClub.get(selectedClub.id) ?? "-"}`} />
                      <MetricCard label="GF / match" value={formatFixed(selectedClub.goalsFor / selectedClub.played)} />
                      <MetricCard label="GA / match" value={formatFixed(selectedClub.goalsAgainst / selectedClub.played)} />
                    </div>
                  </div>

                  <div className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
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
                    className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4"
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">Recent results</p>
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">Upcoming fixtures</p>
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
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">Recent slate</p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">Latest results</h3>
                  <div className="mt-4">
                    <FixtureLedgerSection
                      groups={groupFixturesByMatchday(summary.recentFixtures)}
                      onOpenTeam={handleClubChange}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">Next up</p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">Upcoming fixtures</h3>
                  <div className="mt-4">
                    <FixtureLedgerSection
                      groups={groupFixturesByMatchday(summary.upcomingFixtures, { suffix: "upcoming" })}
                      onOpenTeam={handleClubChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeDetailTab === "scorers" && (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">Goals &amp; assists leaderboard</p>
                    <a
                      href={summary.sourceUrls.scorers}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-2 text-sm font-medium text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-signal)]"
                    >
                      Official
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <div className="mt-3">
                    <LeaderLedger
                      title="Top scorers"
                      unit="G"
                      entries={summary.scorers.slice(0, 10).map((entry) => ({
                        rank: entry.rank,
                        name: entry.name,
                        clubCode: clubLookup.get(entry.clubId) ?? entry.clubCode,
                        value: entry.total,
                      }))}
                      emptyLabel="No scorers recorded yet this season."
                    />
                  </div>
                </div>
                <div>
                  <div className="mt-3 md:mt-9">
                    <LeaderLedger
                      title="Most assists"
                      unit="A"
                      entries={summary.assists.slice(0, 10).map((entry) => ({
                        rank: entry.rank,
                        name: entry.name,
                        clubCode: clubLookup.get(entry.clubId) ?? entry.clubCode,
                        value: entry.total,
                      }))}
                      emptyLabel="No assists recorded yet this season."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <section className="rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-5 text-sm text-[var(--home-ink-muted)] shadow-sm">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--home-signal)]" />
            <p className="mb-0 max-w-none leading-relaxed">
              This page is a curated snapshot rather than a live API feed. Standings come from the official LALIGA table, while the scorer and assist boards mirror the official stats pages linked above.
            </p>
          </div>
        </section>
      </div>

      <ClubDrawer
        club={drawerClub}
        formSequence={formSequence}
        topScorers={drawerTopScorers}
        recentFixtures={recentFixtures}
        upcomingFixtures={upcomingFixtures}
        isLoadingDetail={!teamSnapshot && isTeamSnapshotLoading}
        detailError={!teamSnapshot ? teamSnapshotError : null}
        onClose={handleCloseDrawer}
        testId="la-liga-selected-club"
      />
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
    <div className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
        {title}
      </p>
      {leader ? (
        <>
          <p className="mt-2 text-lg font-bold text-[var(--home-ink)]">{leader.name}</p>
          <p className="mt-1 text-sm text-[var(--home-ink-muted)]">
            {leader.total} {statLabel.toLowerCase()} in {leader.appearances} matches
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--home-ink-soft)]">
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

/**
 * Builds a club's top-scorer list for the drawer by cross-referencing the
 * separate goals (`scorers`) and assists (`assists`) boards by player name —
 * La Liga's scorer entries don't carry a per-player assists count the way
 * Premier League's do, but both boards share `clubId`, so a name match
 * backfills assists when the player also appears on the assists board.
 */
function buildClubTopScorers(
  scorers: LaLigaLeader[],
  assists: LaLigaLeader[],
  clubId: string
): ClubDrawerScorer[] {
  const assistsByName = new Map(
    assists.filter((entry) => entry.clubId === clubId).map((entry) => [entry.name, entry.total])
  );
  return scorers
    .filter((entry) => entry.clubId === clubId)
    .map((entry) => ({ name: entry.name, goals: entry.total, assists: assistsByName.get(entry.name) ?? 0 }));
}

function getZoneDotColor(zone: ReturnType<typeof getClubZone>): string {
  switch (zone) {
    case "champions": return "var(--home-signal)";
    case "europa": return "var(--home-positive)";
    case "conference": return "color-mix(in srgb, var(--home-positive) 55%, var(--home-ink))";
    case "relegation": return "var(--home-negative)";
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
        color: "var(--home-signal)",
        borderColor: "color-mix(in srgb, var(--home-signal) 30%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-signal) 10%, var(--home-paper-alt))",
      };
    case "europa":
      return {
        color: "color-mix(in srgb, var(--home-positive) 60%, var(--home-ink))",
        borderColor: "color-mix(in srgb, var(--home-positive) 45%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-positive) 16%, var(--home-paper-alt))",
      };
    case "conference":
      return {
        color: "color-mix(in srgb, var(--home-positive) 45%, var(--home-ink))",
        borderColor: "color-mix(in srgb, var(--home-positive) 28%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-positive) 9%, var(--home-paper-alt))",
      };
    case "relegation":
      return {
        color: "color-mix(in srgb, var(--home-negative) 70%, var(--home-ink))",
        borderColor: "color-mix(in srgb, var(--home-negative) 40%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-negative) 10%, var(--home-paper-alt))",
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
      borderColor: "color-mix(in srgb, var(--home-signal) 35%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-signal) 9%, var(--home-paper-alt))",
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
      borderColor: "color-mix(in srgb, var(--home-signal) 35%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-signal) 9%, var(--home-paper-alt))",
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
