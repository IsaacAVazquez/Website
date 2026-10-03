"use client";

import {
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { DATE_ONLY_TIME_ZONE } from "@/lib/date-formatters";
import {
  MetricCard,
  CrestAvatar,
  FixtureCard,
  ResultsTape,
  GoalsPulseStrip,
  SegmentedTabs,
  FixtureLedgerSection,
  groupFixturesByMatchday,
  LeaderLedger,
} from "@/components/football";
// The drawer stays out of the barrel, which four other routes share, and
// loads the first time a club is opened.
import { DeferredClubDrawer } from "@/components/football/DeferredClubDrawer";
import type { ClubDrawerClub, ClubDrawerScorer } from "@/components/football/ClubDrawer";
import { PointsLadder } from "@/components/football/PointsLadderChart";
import { LeagueProgrammeTable, type ProgrammeTableRow } from "@/components/football/LeagueProgrammeTable";
import { LEAGUE_ZONE_LABEL, leagueZone, type LeagueZone, formatPointsGap, zoneChipStyle } from "@/components/football/ladderGeometry";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import type {
  LaLigaClub,
  LaLigaDetailTab,
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
import { formatFixed } from "@/components/football/fixtureFormat";
import { ClubLeaderCard } from "@/components/football/ClubLeaderCard";

interface LaLigaClientProps {
  initialState: LaLigaRouteState;
  summary: LaLigaSummarySnapshot;
  initialTeamSnapshot: LaLigaTeamSnapshot | null;
}

const VIEW_OPTIONS: Array<{ id: LaLigaView; label: string }> = [
  { id: "table", label: "Full table" },
  { id: "title-race", label: "Title chase" },
  { id: "europe", label: "European places" },
  { id: "relegation", label: "Relegation fight" },
];

export function LaLigaClient({
  initialState,
  summary,
  initialTeamSnapshot,
}: LaLigaClientProps) {
  const searchParams = useSearchParams();
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
  const crestByClubId = useMemo(() => (
    new Map(
      summary.teams.map((team) => [
        canonicalizeClubId(team.id, aliasMap) ?? team.id,
        team.crest,
      ] as const)
    )
  ), [summary.teams, aliasMap]);
  const snapshotDateLabel = useMemo(() => (
    // Pinned to UTC so the server and the browser print the same date.
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      // summary.updatedAt is a YYYY-MM-DD date-only value (parses to UTC midnight).
      timeZone: DATE_ONLY_TIME_ZONE,
    }).format(new Date(summary.updatedAt))
  ), [summary.updatedAt]);
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
    {
      view: routeState.view,
      club: selectedClubId,
      detail: routeState.detail,
    },
    defaultState,
    aliasMap,
    searchParams
  );

  const pushHref = useRouteSync(LA_LIGA_ROUTE, desiredHref);

  function navigate(nextState: LaLigaRouteState) {
    const href = buildHref(nextState, defaultState, aliasMap, searchParams);
    pushHref(href);
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

  function handleCloseDrawer() {
    setDrawerClubId(null);
  }

  const activeDetailTab = routeState.detail;
  function setActiveDetailTab(detail: LaLigaDetailTab) {
    navigate({ view: routeState.view, club: selectedClubId, detail });
  }
  // Mirrors a genuinely resolvable explicit `?club=` on first render (an
  // unknown/unaliasable value shouldn't pop the overlay just because the
  // query string carried something) — `handleClubChange` sets this on every
  // subsequent selection. It holds the club that was asked for and waits for
  // the route to reach that club, so the drawer never shows the last one.
  const [drawerClubId, setDrawerClubId] = useState(() => {
    const explicitClubId = canonicalizeClubId(searchParams.get("club"), aliasMap);
    return explicitClubId !== null && clubById.has(explicitClubId) ? explicitClubId : null;
  });
  const isDrawerOpen = drawerClubId !== null && drawerClubId === selectedClubId;

  const lead = PROJECT_PRESS[LA_LIGA_ROUTE].lead;

  if (clubs.length < 18 || !selectedClub) {
    return (
      <Catalog97ProjectHero
        ink={lead}
        title="La Liga Pulse"
        standfirst="This is the same points ladder I built for the Premier League page, since La Liga's title race, European scramble, and relegation fight are the same shape of problem. Standings, European places, and scorer leaders will appear here once the next snapshot is published."
      />
    );
  }

  const leader = clubs[0];
  const runnerUp = clubs[1];
  const fourthPlace = clubs[3];
  const fifthPlace = clubs[4];
  const safetyLine = clubs[16];
  const dropLine = clubs[17];
  const clubStoryline = getClubStoryline(selectedClub, {
    attackRankByClub,
    leader,
    runnerUp,
    fifthPlace,
    seventhPlace: clubs[6],
    sixthPlace: clubs[5],
    safetyLine,
    dropLine,
  });
  const clubPressurePoints = getClubPressurePoints(selectedClub, {
    attackRankByClub,
    defenseRankByClub,
    leader,
    runnerUp,
    fifthPlace,
    seventhPlace: clubs[6],
    sixthPlace: clubs[5],
    safetyLine,
    dropLine,
  });
  const clubScorers = summary.scorers.filter((entry) => entry.clubId === selectedClub.id);
  const clubCount = clubs.length;
  const selectedZone: LeagueZone = leagueZone(selectedClub.position, clubCount);
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

  const ladderClubs = clubs.map((club) => ({
    id: club.id,
    position: club.position,
    points: club.points,
    label: club.code || club.shortName,
    accentColor: club.accentColor ?? null,
  }));

  const programmeRows: ProgrammeTableRow[] = visibleClubs.map((club) => ({
    id: club.id,
    position: club.position,
    name: club.name,
    shortName: club.shortName,
    crest: crestByClubId.get(club.id) ?? null,
    played: club.played,
    won: club.won,
    draw: club.drawn,
    lost: club.lost,
    points: club.points,
    goalsFor: club.goalsFor,
    goalsAgainst: club.goalsAgainst,
    goalDifference: club.goalDifference,
  }));

  const standfirst =
    "This is the same points ladder I built for the Premier League page, since La Liga's title race, European scramble, and relegation fight are the same shape of problem. Every club here sits on a vertical points axis, so the gaps that actually decide the season read as real distance.";

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="La Liga Pulse"
        standfirst={standfirst}
        meta={`${summary.sourceLabel} · Matchday ${summary.matchday} of 38 · updated ${snapshotDateLabel}`}
        readouts={[
          {
            label: "Leader",
            value: leader.shortName,
            detail: `${leader.points} pts, ${leader.points === runnerUp.points ? "level with" : `${formatPointsGap(leader.points - runnerUp.points)} clear of`} ${runnerUp.shortName}`,
          },
          {
            label: "Champions League gap",
            value: formatPointsGap(fourthPlace.points - fifthPlace.points),
            detail: `${fourthPlace.shortName} over ${fifthPlace.shortName}`,
          },
          {
            label: "Relegation gap",
            value: formatPointsGap(safetyLine.points - dropLine.points),
            detail: `${safetyLine.shortName} over ${dropLine.shortName}`,
          },
        ]}
      >
        <PointsLadder
          clubs={ladderClubs}
          selectedId={selectedClub.id}
          onSelect={handleClubChange}
          title="La Liga points ladder"
        />
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell space-y-6">
          <ResultsTape
            recentFixtures={summary.recentFixtures}
            upcomingFixtures={summary.upcomingFixtures}
            label={summary.matchday ? `Matchday ${summary.matchday} · latest` : "Latest results"}
          />

          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="c97-poster-sm">Standings</h2>
            <GoalsPulseStrip
              data={summary.goalsPerMatchday ?? []}
              capLabel={
                (summary.goalsPerMatchday?.length ?? 0) > 0
                  ? `MD 01–${summary.goalsPerMatchday![summary.goalsPerMatchday!.length - 1].matchday}`
                  : undefined
              }
              className="w-44"
            />
          </div>

          <div className="c97-segmented" style={{ marginBottom: "var(--c97-sp-3)" }}>
            {VIEW_OPTIONS.map((option) => {
              const isActive = option.id === routeState.view;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleViewChange(option.id)}
                  aria-pressed={isActive}
                  className="min-h-[44px]"
                >
                  {option.label} <span className="c97-mono">{filterClubs(summary.clubs, option.id).length}</span>
                </button>
              );
            })}
          </div>

          <LeagueProgrammeTable
            rows={programmeRows}
            clubCount={clubCount}
            ariaLabel="La Liga standings"
            selectedId={selectedClub.id}
            onSelect={handleClubChange}
          />
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell space-y-6">
          <h2 className="c97-poster-sm">Detail</h2>
          <SegmentedTabs
            tabs={[
              { id: "club", label: "Club detail" },
              { id: "fixtures", label: "Fixtures" },
              { id: "scorers", label: "Top scorers" },
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
          >
            {activeDetailTab === "club" && (
              <div
                className="grid xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
                style={{ gap: "var(--c97-sp-4)" }}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <CrestAvatar crest={crestByClubId.get(selectedClub.id) ?? null} name={selectedClub.name} size="md" />
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold c97-serif">{selectedClub.name}</h3>
                        <span className="c97-chip" style={zoneChipStyle(selectedZone)}>
                          {LEAGUE_ZONE_LABEL[selectedZone]}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleClubChange(selectedClub.id)}
                      className="c97-btn-ghost flex-shrink-0"
                    >
                      Open detail
                    </button>
                  </div>

                  <div>
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>Performance</p>
                    <div className="grid grid-cols-2 gap-3">
                      <MetricCard label="PPG" value={formatFixed(selectedClub.points / selectedClub.played)} />
                      <MetricCard label="Record" value={`${selectedClub.won}-${selectedClub.drawn}-${selectedClub.lost}`} />
                      <MetricCard label="Attack rank" value={`#${attackRankByClub.get(selectedClub.id) ?? "-"}`} />
                      <MetricCard label="Defense rank" value={`#${defenseRankByClub.get(selectedClub.id) ?? "-"}`} />
                      <MetricCard label="GF / match" value={formatFixed(selectedClub.goalsFor / selectedClub.played)} />
                      <MetricCard label="GA / match" value={formatFixed(selectedClub.goalsAgainst / selectedClub.played)} />
                    </div>
                  </div>

                  <div className="c97-panel">
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>Pressure points</p>
                    <ul className="c97-list">
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

                  <p className="c97-prose">{clubStoryline}</p>
                </div>

                {/* Fixtures sit side by side under the club on a tablet and
                    stack beside it on a wide screen, so no card is left alone. */}
                <div
                  className="grid content-start md:grid-cols-2 xl:grid-cols-1"
                  style={{ gap: "var(--c97-sp-3)" }}
                >
                {!teamSnapshot && (isTeamSnapshotLoading || teamSnapshotError) && (
                  <div
                    className="c97-panel"
                    role={teamSnapshotError ? "alert" : "status"}
                    aria-live="polite"
                  >
                    <p className="c97-prose">
                      {isTeamSnapshotLoading
                        ? "Loading recent club fixtures…"
                        : teamSnapshotError}
                    </p>
                  </div>
                )}

                {recentFixtures.length > 0 && (
                  <div>
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>Recent results</p>
                    <div className="space-y-2">
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
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>Upcoming fixtures</p>
                    <div className="space-y-2">
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
              </div>
            )}

            {activeDetailTab === "fixtures" && (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Recent slate</p>
                  <h3 className="c97-h3 c97-serif" style={{ marginBottom: "var(--c97-sp-2)" }}>Latest results</h3>
                  {summary.recentFixtures.length > 0 ? (
                    <FixtureLedgerSection
                      groups={groupFixturesByMatchday(summary.recentFixtures)}
                      onOpenTeam={handleClubChange}
                    />
                  ) : (
                    <p className="c97-prose">No results are in this snapshot yet.</p>
                  )}
                </div>
                <div>
                  <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Next up</p>
                  <h3 className="c97-h3 c97-serif" style={{ marginBottom: "var(--c97-sp-2)" }}>Upcoming fixtures</h3>
                  {summary.upcomingFixtures.length > 0 ? (
                    <FixtureLedgerSection
                      groups={groupFixturesByMatchday(summary.upcomingFixtures, { suffix: "upcoming" })}
                      onOpenTeam={handleClubChange}
                    />
                  ) : (
                    <p className="c97-prose">No upcoming fixtures are in this snapshot yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeDetailTab === "scorers" && (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="flex min-h-[44px] items-start justify-between gap-3">
                    <p className="c97-kicker">Goals &amp; assists leaderboard</p>
                    <a
                      href="https://www.laliga.com/en-GB/stats/laliga-easports/scorers"
                      target="_blank"
                      rel="noreferrer"
                      className="c97-btn-ghost"
                      style={{ gap: "var(--c97-sp-1)" }}
                    >
                      Official
                      <span className="sr-only"> LALIGA scorers leaderboard (opens in a new tab)</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <div style={{ marginTop: "var(--c97-sp-2)" }}>
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
                  {/* Holds the height of the heading row beside it, so the
                      two ledgers start on the same line. */}
                  <div className="hidden min-h-[44px] md:block" aria-hidden="true" />
                  <div style={{ marginTop: "var(--c97-sp-2)" }}>
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
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Snapshot note</p>
          <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
            This page is a checked-in football-data.org snapshot, refreshed on a schedule. Standings, scorers, assists, club form, and fixtures all come from that snapshot. The Official link above opens the LALIGA stats page, which is a separate source.
          </p>
        </div>
      </section>

      <DeferredClubDrawer
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
    </>
  );
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

function getClubStoryline(
  club: LaLigaClub,
  context: {
    attackRankByClub: Map<string, number>;
    leader: LaLigaClub;
    runnerUp: LaLigaClub;
    fifthPlace: LaLigaClub;
    seventhPlace: LaLigaClub;
    sixthPlace: LaLigaClub;
    safetyLine: LaLigaClub;
    dropLine: LaLigaClub;
  }
) {
  const { attackRankByClub, leader, runnerUp, fifthPlace, seventhPlace, sixthPlace, safetyLine, dropLine } = context;

  if (club.position === 1) {
    const attackClause = attackRankByClub.get(club.id) === 1 ? ", carry the division's best attack," : "";
    return `${club.shortName} own the league lead${attackClause} and sit ${club.points - runnerUp.points} points clear of ${runnerUp.shortName}.`;
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
      attackRank === 1
        ? `${club.goalsFor} goals scored is the best attack in the division.`
        : `${club.goalsFor} goals scored.`,
      `${38 - club.played} league matches remain in this snapshot.`,
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

