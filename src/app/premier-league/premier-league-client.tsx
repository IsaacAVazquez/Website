"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatUpdatedAt } from "@/lib/date-formatters";
// The drawer stays out of the barrel, which four other routes share, and
// loads the first time a club is opened.
import { DeferredClubDrawer } from "@/components/football/DeferredClubDrawer";
import type { ClubDrawerClub, ClubDrawerScorer } from "@/components/football/ClubDrawer";
import {
  LeagueTableBoard,
  type FormResult,
  type LeagueTableConfig,
  type LeagueTableRow,
} from "@/components/football/LeagueTableBoard";
import type {
  PremierLeagueRouteState,
  PremierLeagueSummary,
  PremierLeagueTeamSnapshot,
  PremierLeagueView,
} from "@/types/premier-league";
import {
  buildPremierLeagueHref,
  filterStandingsForView,
  normalizePremierLeagueState,
  PREMIER_LEAGUE_ROUTE,
  PREMIER_LEAGUE_VIEW_LABELS,
  PREMIER_LEAGUE_VIEW_OPTIONS,
} from "./premier-league-state";
import { useRouteSync } from "@/hooks/useRouteSync";
import { useCachedSnapshot } from "@/hooks/useCachedSnapshot";

interface PremierLeagueClientProps {
  initialState: PremierLeagueRouteState;
  summary: PremierLeagueSummary;
  initialTeamSnapshot: PremierLeagueTeamSnapshot | null;
  /** Each club's last five results, oldest first, keyed by team id. */
  formByTeam?: Record<string, FormResult[]>;
}

const CONFIG: LeagueTableConfig = {
  title: "Premier League Pulse",
  leagueName: "Premier League",
  standfirst:
    "I built this to show how many points actually separate each club from the title, Europe, and the drop, which a table sorted by position alone hides.",
  idPrefix: "pl",
  officialHref: "https://www.premierleague.com/en/stats/top/players/goals",
  officialLabel: "Premier League goals leaderboard",
};

export function PremierLeagueClient({
  initialState,
  summary,
  initialTeamSnapshot,
  formByTeam = {},
}: PremierLeagueClientProps) {
  const searchParams = useSearchParams();
  const hasManagedParams =
    searchParams.get("view") !== null ||
    searchParams.get("team") !== null ||
    searchParams.get("detail") !== null;
  const routeState = hasManagedParams ? normalizePremierLeagueState(searchParams) : initialState;

  const validTeamIds = useMemo(() => new Set(summary.teams.map((t) => t.id)), [summary.teams]);
  const canonicalTeamId = validTeamIds.has(routeState.team ?? "") ? routeState.team : null;
  const selectedTeamId = canonicalTeamId ?? summary.standings[0]?.team.id ?? null;

  const desiredHref = buildPremierLeagueHref(
    { view: routeState.view, team: canonicalTeamId, detail: routeState.detail },
    searchParams
  );
  const pushHref = useRouteSync(PREMIER_LEAGUE_ROUTE, desiredHref);

  function navigate(nextState: PremierLeagueRouteState) {
    pushHref(buildPremierLeagueHref(nextState, searchParams));
  }

  function handleViewChange(view: PremierLeagueView) {
    const visibleRows = filterStandingsForView(summary.standings, view);
    const nextTeam = visibleRows.some((r) => r.team.id === selectedTeamId)
      ? selectedTeamId
      : visibleRows[0]?.team.id ?? null;
    navigate({ view, team: nextTeam, detail: routeState.detail });
  }

  function handleTeamChange(teamId: string) {
    setDrawerTeamId(teamId);
    navigate({ view: routeState.view, team: teamId, detail: routeState.detail });
  }

  const selectedRow = summary.standings.find((r) => r.team.id === selectedTeamId) ?? summary.standings[0] ?? null;
  const {
    snapshot: teamSnapshot,
    isLoading: isTeamSnapshotLoading,
    error: teamSnapshotError,
  } = useCachedSnapshot<PremierLeagueTeamSnapshot>(
    "/api/premier-league/teams",
    selectedTeamId,
    { id: selectedTeamId, snapshot: initialTeamSnapshot },
    "Unable to load club snapshot."
  );

  // Club drawer, its own state, because the tabs and the view filters also
  // write ?team= and must not open the overlay. It starts open only for a
  // deep link to a valid club, and after that only `handleTeamChange` opens
  // it. It holds the club that was asked for and waits for the route to
  // reach that club, so it never shows the last one.
  const [drawerTeamId, setDrawerTeamId] = useState<string | null>(canonicalTeamId);
  const isDrawerOpen = drawerTeamId !== null && drawerTeamId === selectedTeamId;
  const drawerClub: ClubDrawerClub | null = isDrawerOpen && selectedRow
    ? {
      id: selectedRow.team.id,
      name: selectedRow.team.name,
      crest: teamSnapshot?.team?.crest ?? selectedRow.team.crest,
      accentColor: selectedRow.team.accentColor ?? null,
      position: selectedRow.position,
      points: selectedRow.points,
      played: selectedRow.playedGames,
      won: selectedRow.won,
      draw: selectedRow.draw,
      lost: selectedRow.lost,
      goalsFor: selectedRow.goalsFor,
      goalsAgainst: selectedRow.goalsAgainst,
      goalDifference: selectedRow.goalDifference,
      manager: teamSnapshot?.team?.manager ?? null,
      venue: teamSnapshot?.team?.venue ?? selectedRow.team.venue ?? null,
    }
    : null;
  const drawerTopScorers: ClubDrawerScorer[] = selectedRow
    ? summary.scorers
      .filter((s) => s.teamId === selectedRow.team.id)
      .map((s) => ({ name: s.name, goals: s.goals, assists: s.assists }))
    : [];

  const rows: LeagueTableRow[] = summary.standings.map((row) => ({
    id: row.team.id,
    position: row.position,
    name: row.team.name,
    shortName: row.team.shortName,
    code: row.team.tla ?? "",
    crest: row.team.crest,
    accentColor: row.team.accentColor ?? null,
    played: row.playedGames,
    won: row.won,
    draw: row.draw,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference: row.goalDifference,
    points: row.points,
    form: formByTeam[row.team.id] ?? [],
  }));

  const shortNameById = new Map(summary.teams.map((t) => [t.id, t.shortName]));
  const scorers = summary.scorers.slice(0, 10).map((s) => ({
    rank: s.rank,
    name: s.name,
    clubCode: shortNameById.get(s.teamId) ?? s.teamName,
    value: s.goals,
  }));
  // football-data.org's scorer entries already carry an assists count, so
  // this is a re-sort of the same list, not another fetch.
  const assists = summary.scorers
    .filter((s) => s.assists > 0)
    .toSorted((a, b) => b.assists - a.assists)
    .slice(0, 10)
    .map((s, index) => ({
      rank: index + 1,
      name: s.name,
      clubCode: shortNameById.get(s.teamId) ?? s.teamName,
      value: s.assists,
    }));

  const recentFixtures = (teamSnapshot?.recentFixtures ?? []).slice(0, 3);
  const upcomingFixtures = (teamSnapshot?.upcomingFixtures ?? []).slice(0, 3);

  return (
    <LeagueTableBoard
      config={CONFIG}
      rows={rows}
      visibleIds={new Set(filterStandingsForView(summary.standings, routeState.view).map((r) => r.team.id))}
      views={PREMIER_LEAGUE_VIEW_OPTIONS.map((id) => ({
        id,
        label: PREMIER_LEAGUE_VIEW_LABELS[id],
        count: filterStandingsForView(summary.standings, id).length,
      }))}
      activeView={routeState.view}
      onViewChange={(view) => handleViewChange(view as PremierLeagueView)}
      selectedId={selectedTeamId}
      onSelect={handleTeamChange}
      detail={routeState.detail}
      onDetailChange={(detail) => navigate({ view: routeState.view, team: selectedTeamId, detail })}
      matchday={summary.competition?.currentMatchday ?? null}
      updatedLabel={formatUpdatedAt(summary.generatedAt)}
      recentFixtures={summary.recentFixtures}
      upcomingFixtures={summary.upcomingFixtures}
      goalsPerMatchday={summary.goalsPerMatchday ?? []}
      scorers={scorers}
      assists={assists}
      drawer={
        <DeferredClubDrawer
          club={drawerClub}
          formSequence={selectedTeamId ? formByTeam[selectedTeamId] ?? [] : []}
          topScorers={drawerTopScorers}
          recentFixtures={recentFixtures}
          upcomingFixtures={upcomingFixtures}
          isLoadingDetail={!teamSnapshot && isTeamSnapshotLoading}
          detailError={!teamSnapshot ? teamSnapshotError : null}
          onClose={() => setDrawerTeamId(null)}
          testId="pl-selected-club"
        />
      }
    />
  );
}
