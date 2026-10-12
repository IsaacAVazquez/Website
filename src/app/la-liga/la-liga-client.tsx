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
import { useRouteSync } from "@/hooks/useRouteSync";
import { useCachedSnapshot } from "@/hooks/useCachedSnapshot";

interface LaLigaClientProps {
  initialState: LaLigaRouteState;
  summary: LaLigaSummarySnapshot;
  initialTeamSnapshot: LaLigaTeamSnapshot | null;
  /** Each club's last five results, oldest first, keyed by club id. */
  formByClub?: Record<string, FormResult[]>;
}

const VIEW_OPTIONS: Array<{ id: LaLigaView; label: string }> = [
  { id: "table", label: "Full table" },
  { id: "title-race", label: "Title chase" },
  { id: "europe", label: "European places" },
  { id: "relegation", label: "Relegation fight" },
];

const CONFIG: LeagueTableConfig = {
  title: "La Liga Pulse",
  leagueName: "La Liga",
  standfirst:
    "This is the same table and points ladder I built for the Premier League, since La Liga's title race, European places, and relegation fight are the same shape of problem.",
  idPrefix: "la-liga",
  officialHref: "https://www.laliga.com/en-GB/stats/laliga-easports/scorers",
  officialLabel: "LALIGA scorers leaderboard",
};

const NO_FORM: Record<string, FormResult[]> = {};

export function LaLigaClient({
  initialState,
  summary,
  initialTeamSnapshot,
  formByClub = NO_FORM,
}: LaLigaClientProps) {
  const searchParams = useSearchParams();
  const clubs = summary.clubs;
  const aliasMap = useMemo(() => buildClubAliasMap(summary.teams), [summary.teams]);
  const defaultState = useMemo(() => resolveDefaultState(summary.clubs), [summary.clubs]);
  const clubById = useMemo(() => new Map(clubs.map((club) => [club.id, club])), [clubs]);
  const crestByClubId = useMemo(() => (
    new Map(
      summary.teams.map((team) => [
        canonicalizeClubId(team.id, aliasMap) ?? team.id,
        team.crest,
      ] as const)
    )
  ), [summary.teams, aliasMap]);
  const hasManagedParams =
    searchParams.get("view") !== null ||
    searchParams.get("club") !== null ||
    searchParams.get("detail") !== null;
  const routeState = hasManagedParams
    ? normalizeState(searchParams, defaultState, aliasMap)
    : initialState;
  const visibleClubs = filterClubs(summary.clubs, routeState.view);
  const selectedClubId = visibleClubs.some((club) => club.id === routeState.club)
    ? routeState.club
    : getDefaultClub(summary.clubs, routeState.view, defaultState.club);
  const selectedClub = clubById.get(selectedClubId) ?? clubs[0];
  const {
    snapshot: teamSnapshot,
    isLoading: isTeamSnapshotLoading,
    error: teamSnapshotError,
  } = useCachedSnapshot<LaLigaTeamSnapshot>(
    "/api/la-liga/teams",
    selectedClub?.id ?? null,
    { id: selectedClubId, snapshot: initialTeamSnapshot },
    "Unable to load club snapshot."
  );
  const desiredHref = buildHref(
    { view: routeState.view, club: selectedClubId, detail: routeState.detail },
    defaultState,
    aliasMap,
    searchParams
  );
  const pushHref = useRouteSync(LA_LIGA_ROUTE, desiredHref);

  function navigate(nextState: LaLigaRouteState) {
    pushHref(buildHref(nextState, defaultState, aliasMap, searchParams));
  }

  function handleViewChange(view: LaLigaView) {
    const nextClubs = filterClubs(summary.clubs, view);
    const nextClub = nextClubs.some((club) => club.id === selectedClubId)
      ? selectedClubId
      : nextClubs[0]?.id ?? defaultState.club;
    navigate({ view, club: nextClub, detail: routeState.detail });
  }

  function handleClubChange(clubId: string) {
    // The drawer is its own state, since `buildHref` strips the `club` param
    // when it matches the default club on the default view and the URL alone
    // cannot say whether a club was picked.
    const club = canonicalizeClubId(clubId, aliasMap) ?? defaultState.club;
    // The ladder shows every club while the table is filtered, so a club
    // outside the focused view goes back to the full table to be selectable.
    const view = visibleClubs.some((visible) => visible.id === club)
      ? routeState.view
      : defaultState.view;
    setDrawerClubId(club);
    navigate({ view, club, detail: routeState.detail });
  }

  // Mirrors a resolvable explicit `?club=` on first render (an unknown value
  // should not pop the overlay just because the query string carried
  // something), and `handleClubChange` sets it on every later selection. It
  // holds the club that was asked for and waits for the route to reach that
  // club, so the drawer never shows the last one.
  const [drawerClubId, setDrawerClubId] = useState(() => {
    const explicitClubId = canonicalizeClubId(searchParams.get("club"), aliasMap);
    return explicitClubId !== null && clubById.has(explicitClubId) ? explicitClubId : null;
  });
  const isDrawerOpen = drawerClubId !== null && drawerClubId === selectedClubId;

  // A snapshot short of a full table shows the title row and an empty line.
  const hasTable = clubs.length >= 18 && Boolean(selectedClub);

  const drawerClub: ClubDrawerClub | null = isDrawerOpen && hasTable
    ? {
      // Must match recentFixtures/upcomingFixtures' homeTeam/awayTeam ids,
      // which come from the team snapshot's numeric football-data.org id,
      // not `selectedClub.id` (the TLA-based standings and routing id).
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

  // Memoized so the board's ladder layout and lookup sort run once per snapshot.
  const rows: LeagueTableRow[] = useMemo(() => hasTable
    ? clubs.map((club) => ({
      id: club.id,
      position: club.position,
      name: club.name,
      shortName: club.shortName,
      code: club.code,
      crest: crestByClubId.get(club.id) ?? null,
      accentColor: club.accentColor ?? null,
      played: club.played,
      won: club.won,
      draw: club.drawn,
      lost: club.lost,
      goalsFor: club.goalsFor,
      goalsAgainst: club.goalsAgainst,
      goalDifference: club.goalDifference,
      points: club.points,
      form: formByClub[club.id] ?? [],
    }))
    : [], [hasTable, clubs, crestByClubId, formByClub]);

  const shortNameById = new Map(clubs.map((club) => [club.id, club.shortName]));
  const toLedger = (entry: LaLigaLeader) => ({
    rank: entry.rank,
    name: entry.name,
    clubCode: shortNameById.get(entry.clubId) ?? entry.clubCode,
    value: entry.total,
  });

  return (
    <LeagueTableBoard
      config={CONFIG}
      rows={rows}
      visibleIds={new Set(visibleClubs.map((club) => club.id))}
      views={VIEW_OPTIONS.map((option) => ({
        id: option.id,
        label: option.label,
        count: filterClubs(summary.clubs, option.id).length,
      }))}
      activeView={routeState.view}
      onViewChange={handleViewChange}
      selectedId={selectedClub?.id ?? null}
      onSelect={handleClubChange}
      detail={routeState.detail}
      onDetailChange={(detail) => navigate({ view: routeState.view, club: selectedClubId, detail })}
      matchday={summary.matchday || null}
      updatedLabel={formatUpdatedAt(summary.generatedAt)}
      recentFixtures={summary.recentFixtures}
      upcomingFixtures={summary.upcomingFixtures}
      goalsPerMatchday={summary.goalsPerMatchday ?? []}
      scorers={summary.scorers.slice(0, 10).map(toLedger)}
      assists={summary.assists.slice(0, 10).map(toLedger)}
      drawer={
        <DeferredClubDrawer
          club={drawerClub}
          formSequence={formByClub[selectedClubId] ?? []}
          topScorers={hasTable ? buildClubTopScorers(summary.scorers, summary.assists, selectedClub.id) : []}
          recentFixtures={(teamSnapshot?.recentFixtures ?? []).slice(0, 3)}
          upcomingFixtures={(teamSnapshot?.upcomingFixtures ?? []).slice(0, 3)}
          isLoadingDetail={!teamSnapshot && isTeamSnapshotLoading}
          detailError={!teamSnapshot ? teamSnapshotError : null}
          onClose={() => setDrawerClubId(null)}
          testId="la-liga-selected-club"
        />
      }
    />
  );
}

/**
 * Builds a club's top-scorer list for the drawer by cross-referencing the
 * separate goals (`scorers`) and assists (`assists`) boards by player name.
 * La Liga's scorer entries do not carry a per-player assists count the way
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
