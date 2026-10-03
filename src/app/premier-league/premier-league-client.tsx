"use client";

import {
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { formatUpdatedAt } from "@/lib/date-formatters";
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
  type LeaderEntry,
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
  PremierLeagueDetailTab,
  PremierLeagueRouteState,
  PremierLeagueStandingRow,
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
import { formatFixed } from "@/components/football/fixtureFormat";
import { ClubLeaderCard } from "@/components/football/ClubLeaderCard";

interface PremierLeagueClientProps {
  initialState: PremierLeagueRouteState;
  summary: PremierLeagueSummary;
  initialTeamSnapshot: PremierLeagueTeamSnapshot | null;
}

export function PremierLeagueClient({
  initialState,
  summary,
  initialTeamSnapshot,
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

  const pushHref = useRouteSync("/premier-league", desiredHref);

  function navigate(nextState: PremierLeagueRouteState) {
    const href = buildPremierLeagueHref(nextState, searchParams);
    pushHref(href);
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

  function setActiveDetailTab(detail: PremierLeagueDetailTab) {
    navigate({ view: routeState.view, team: selectedTeamId, detail });
  }
  const activeDetailTab = routeState.detail;

  // Derived state
  const visibleStandings = filterStandingsForView(summary.standings, routeState.view);
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

  // Derived stats for sidebar
  const attackRankings = useMemo(() => {
    const ranked = [...summary.standings].sort((a, b) => b.goalsFor - a.goalsFor || a.position - b.position);
    return new Map(ranked.map((r, i) => [r.team.id, i + 1]));
  }, [summary.standings]);
  const defenseRankings = useMemo(() => {
    const ranked = [...summary.standings].sort((a, b) => a.goalsAgainst - b.goalsAgainst || a.position - b.position);
    return new Map(ranked.map((r, i) => [r.team.id, i + 1]));
  }, [summary.standings]);

  // Hero stats
  const leader = summary.standings[0] ?? null;
  const runnerUp = summary.standings[1] ?? null;
  const fourthPlace = summary.standings[3] ?? null;
  const fifthPlace = summary.standings[4] ?? null;
  const safetyLine = summary.standings[16] ?? null;
  const dropLine = summary.standings[17] ?? null;

  // Club lookup for leader list
  const clubLookup = useMemo(
    () => new Map(summary.teams.map((t) => [t.id, t.shortName])),
    [summary.teams]
  );

  // Scorers as LeaderEntry[]
  const scorerEntries: LeaderEntry[] = summary.scorers.map((s) => ({
    rank: s.rank,
    name: s.name,
    clubId: s.teamId,
    clubCode: s.teamName,
    total: s.goals,
    appearances: s.appearances,
    perMatch: s.appearances ? s.goals / s.appearances : 0,
  }));

  // Assists board: football-data.org's scorer entries already carry an
  // `assists` count per player — this is a re-sort of already-fetched data,
  // not a new fetch (see src/lib/premierLeagueData.ts's normalizeScorer).
  const assistEntries: LeaderEntry[] = useMemo(() => (
    summary.scorers
      .filter((s) => s.assists > 0)
      .slice()
      .sort((a, b) => b.assists - a.assists)
      .map((s, i) => ({
        rank: i + 1,
        name: s.name,
        clubId: s.teamId,
        clubCode: s.teamName,
        total: s.assists,
        appearances: s.appearances,
        perMatch: s.appearances ? s.assists / s.appearances : 0,
      }))
  ), [summary.scorers]);

  const clubCount = summary.standings.length;
  const selectedZone: LeagueZone = selectedRow ? leagueZone(selectedRow.position, clubCount) : "midtable";
  const selectedClubStoryline = selectedRow
    ? getClubStoryline(selectedRow, {
      attackRankings,
      leader,
      runnerUp,
      fifthPlace,
      seventhPlace: summary.standings[6] ?? null,
      sixthPlace: summary.standings[5] ?? null,
      safetyLine,
      dropLine,
    })
    : null;
  const selectedClubPressurePoints = selectedRow
    ? getClubPressurePoints(selectedRow, {
      attackRankings,
      defenseRankings,
      leader,
      runnerUp,
      fifthPlace,
      seventhPlace: summary.standings[6] ?? null,
      sixthPlace: summary.standings[5] ?? null,
      safetyLine,
      dropLine,
    })
    : [];
  const selectedClubTopScorer = selectedRow
    ? scorerEntries.find((entry) => entry.clubId === selectedRow.team.id)
    : undefined;
  const recentFixtures = (teamSnapshot?.recentFixtures ?? []).slice(0, 3);
  const upcomingFixtures = (teamSnapshot?.upcomingFixtures ?? []).slice(0, 3);
  const lastUpdated = formatUpdatedAt(summary.generatedAt);
  const currentMatchday = summary.competition?.currentMatchday ?? null;

  // Club drawer — its own state, the way La Liga keeps it, because the tabs
  // and the view filters also write ?team= and must not open the overlay.
  // It starts open only for a deep link to a valid club, and after that only
  // `handleTeamChange` opens it. It holds the club that was asked for and
  // waits for the route to reach that club, so it never shows the last one.
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
  function handleCloseDrawer() {
    setDrawerTeamId(null);
  }

  const ladderClubs = useMemo(() => summary.standings.map((row) => ({
    id: row.team.id,
    position: row.position,
    points: row.points,
    label: row.team.tla || row.team.shortName,
    accentColor: row.team.accentColor ?? null,
  })), [summary.standings]);

  const programmeRows: ProgrammeTableRow[] = visibleStandings.map((row) => ({
    id: row.team.id,
    position: row.position,
    name: row.team.name,
    shortName: row.team.shortName,
    crest: row.team.crest,
    played: row.playedGames,
    won: row.won,
    draw: row.draw,
    lost: row.lost,
    points: row.points,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference: row.goalDifference,
  }));

  const lead = PROJECT_PRESS[PREMIER_LEAGUE_ROUTE].lead;
  const standfirst =
    "I built this because points are what actually separate a club from the title race, Europe, or the drop, and a table sorted by position hides how big that gap really is. The ladder below places every club on a vertical points axis, so the distance to the Champions League line, the Europa and Conference lines, and the relegation line reads as real ground you can measure in points.";

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="Premier League Pulse"
        standfirst={standfirst}
        meta={`football-data.org · Matchday ${currentMatchday ?? "—"} of 38 · updated ${lastUpdated}`}
        readouts={[
          {
            label: "Leader",
            value: leader ? leader.team.shortName : "—",
            detail: leader && runnerUp
              ? `${leader.points} pts, ${leader.points === runnerUp.points ? "level with" : `${formatPointsGap(leader.points - runnerUp.points)} clear of`} ${runnerUp.team.shortName}`
              : "Standings loading",
          },
          {
            label: "Champions League gap",
            value: fourthPlace && fifthPlace ? formatPointsGap(fourthPlace.points - fifthPlace.points) : "—",
            detail: fourthPlace && fifthPlace ? `${fourthPlace.team.shortName} over ${fifthPlace.team.shortName}` : "",
          },
          {
            label: "Relegation gap",
            value: safetyLine && dropLine ? formatPointsGap(safetyLine.points - dropLine.points) : "—",
            detail: safetyLine && dropLine ? `${safetyLine.team.shortName} over ${dropLine.team.shortName}` : "",
          },
        ]}
      >
        <PointsLadder
          clubs={ladderClubs}
          selectedId={selectedTeamId}
          onSelect={handleTeamChange}
          title="Premier League points ladder"
        />
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell space-y-6">
          <ResultsTape
            recentFixtures={summary.recentFixtures}
            upcomingFixtures={summary.upcomingFixtures}
            label={currentMatchday ? `Matchday ${currentMatchday} · latest` : "Latest results"}
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
            {PREMIER_LEAGUE_VIEW_OPTIONS.map((key) => {
              const isActive = key === routeState.view;
              const count = filterStandingsForView(summary.standings, key).length;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleViewChange(key)}
                  aria-pressed={isActive}
                  className="min-h-[44px]"
                >
                  {PREMIER_LEAGUE_VIEW_LABELS[key]} <span className="c97-mono">{count}</span>
                </button>
              );
            })}
          </div>

          <LeagueProgrammeTable
            rows={programmeRows}
            clubCount={clubCount}
            ariaLabel="Premier League standings"
            selectedId={selectedTeamId}
            onSelect={handleTeamChange}
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
            idPrefix="pl-detail-tab"
            panelId="pl-detail-panel"
          />

          <div
            id="pl-detail-panel"
            role="tabpanel"
            aria-labelledby={`pl-detail-tab-${activeDetailTab}`}
          >
            {activeDetailTab === "club" && selectedRow && (
              <div
                className="grid xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
                style={{ gap: "var(--c97-sp-4)" }}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <CrestAvatar crest={selectedRow.team.crest} name={selectedRow.team.shortName} size="md" />
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold c97-serif">{selectedRow.team.name}</h3>
                        <span className="c97-chip" style={zoneChipStyle(selectedZone)}>
                          {LEAGUE_ZONE_LABEL[selectedZone]}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTeamChange(selectedRow.team.id)}
                      className="c97-btn-ghost flex-shrink-0"
                    >
                      Open detail
                    </button>
                  </div>

                  <div>
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>Performance</p>
                    <div className="grid grid-cols-2 gap-3">
                      <MetricCard label="PPG" value={formatFixed(selectedRow.points / selectedRow.playedGames)} />
                      <MetricCard label="Record" value={`${selectedRow.won}-${selectedRow.draw}-${selectedRow.lost}`} />
                      <MetricCard label="Attack rank" value={`#${attackRankings.get(selectedRow.team.id) ?? "—"}`} />
                      <MetricCard label="Defense rank" value={`#${defenseRankings.get(selectedRow.team.id) ?? "—"}`} />
                      <MetricCard label="GF / match" value={formatFixed(selectedRow.goalsFor / selectedRow.playedGames)} />
                      <MetricCard label="GA / match" value={formatFixed(selectedRow.goalsAgainst / selectedRow.playedGames)} />
                    </div>
                  </div>

                  <div className="c97-panel">
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>Pressure points</p>
                    <ul className="c97-list">
                      {selectedClubPressurePoints.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <ClubLeaderCard
                    title="Top scorer"
                    leader={selectedClubTopScorer}
                    statLabel="Goals"
                    emptyLabel="No current top-10 scorer in this snapshot."
                  />

                  {selectedClubStoryline ? (
                    <p className="c97-prose">{selectedClubStoryline}</p>
                  ) : null}
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
                          contextTeamId={teamSnapshot?.team?.id ?? selectedTeamId ?? undefined}
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
                          contextTeamId={teamSnapshot?.team?.id ?? selectedTeamId ?? undefined}
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
                      onOpenTeam={handleTeamChange}
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
                      onOpenTeam={handleTeamChange}
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
                      href="https://www.premierleague.com/en/stats/top/players/goals"
                      target="_blank"
                      rel="noreferrer"
                      className="c97-btn-ghost"
                      style={{ gap: "var(--c97-sp-1)" }}
                    >
                      Official
                      <span className="sr-only"> Premier League goals leaderboard (opens in a new tab)</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <div style={{ marginTop: "var(--c97-sp-2)" }}>
                    <LeaderLedger
                      title="Top scorers"
                      unit="G"
                      entries={scorerEntries.slice(0, 10).map((entry) => ({
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
                      entries={assistEntries.slice(0, 10).map((entry) => ({
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
            This page is a checked-in football-data.org snapshot, refreshed on a schedule. Standings, club form, and fixture cards come from the local dataset shipped with the app.
          </p>
        </div>
      </section>

      <DeferredClubDrawer
        club={drawerClub}
        formSequence={teamSnapshot?.form.sequence ?? []}
        topScorers={drawerTopScorers}
        recentFixtures={recentFixtures}
        upcomingFixtures={upcomingFixtures}
        isLoadingDetail={!teamSnapshot && isTeamSnapshotLoading}
        detailError={!teamSnapshot ? teamSnapshotError : null}
        onClose={handleCloseDrawer}
        testId="pl-selected-club"
      />
    </>
  );
}

function getClubStoryline(
  club: PremierLeagueStandingRow,
  context: {
    attackRankings: Map<string, number>;
    leader: PremierLeagueStandingRow | null;
    runnerUp: PremierLeagueStandingRow | null;
    fifthPlace: PremierLeagueStandingRow | null;
    seventhPlace: PremierLeagueStandingRow | null;
    sixthPlace: PremierLeagueStandingRow | null;
    safetyLine: PremierLeagueStandingRow | null;
    dropLine: PremierLeagueStandingRow | null;
  }
) {
  const { attackRankings, leader, runnerUp, fifthPlace, seventhPlace, sixthPlace, safetyLine, dropLine } = context;

  if (club.position === 1 && runnerUp) {
    const attackRank = attackRankings.get(club.team.id);
    const attackClause = attackRank !== undefined && attackRank <= 3 ? ", carry one of the league's sharpest attacks," : "";
    return `${club.team.shortName} lead the table${attackClause} and sit ${club.points - runnerUp.points} points clear of ${runnerUp.team.shortName}.`;
  }

  if (club.position <= 4 && leader && fifthPlace) {
    return `${club.team.shortName} are ${leader.points - club.points} points off the pace and ${club.points - fifthPlace.points} clear of the top-four cutoff below them.`;
  }

  if (club.position <= 6 && seventhPlace && leader) {
    return `${club.team.shortName} currently occupy a European place and have a ${club.points - seventhPlace.points}-point buffer over the first club outside qualification.`;
  }

  if (club.position <= 17 && sixthPlace && dropLine) {
    return `${club.team.shortName} are ${sixthPlace.points - club.points} points short of Europe and ${club.points - dropLine.points} points above the current relegation line.`;
  }

  if (safetyLine) {
    return `${club.team.shortName} are chasing safety from inside the bottom three and need ${safetyLine.points - club.points} more points just to draw level with the safe line.`;
  }

  return `${club.team.shortName} are still in a volatile part of the table and every remaining result materially shifts the pressure around them.`;
}

function getClubPressurePoints(
  club: PremierLeagueStandingRow,
  context: {
    attackRankings: Map<string, number>;
    defenseRankings: Map<string, number>;
    leader: PremierLeagueStandingRow | null;
    runnerUp: PremierLeagueStandingRow | null;
    fifthPlace: PremierLeagueStandingRow | null;
    seventhPlace: PremierLeagueStandingRow | null;
    sixthPlace: PremierLeagueStandingRow | null;
    safetyLine: PremierLeagueStandingRow | null;
    dropLine: PremierLeagueStandingRow | null;
  }
) {
  const {
    attackRankings,
    defenseRankings,
    leader,
    runnerUp,
    fifthPlace,
    seventhPlace,
    sixthPlace,
    safetyLine,
    dropLine,
  } = context;
  const attackRank = attackRankings.get(club.team.id) ?? club.position;
  const defenseRank = defenseRankings.get(club.team.id) ?? club.position;

  if (club.position === 1 && runnerUp) {
    return [
      `${club.points - runnerUp.points} points separate ${club.team.shortName} from ${runnerUp.team.shortName}.`,
      ...(attackRank <= 3 ? [`${club.goalsFor} goals scored keeps them among the league's best attacks.`] : []),
      `${38 - club.playedGames} matches remain in this snapshot.`,
      `Attack rank #${attackRank}; defense rank #${defenseRank}.`,
    ];
  }

  if (club.position <= 4 && leader && fifthPlace) {
    return [
      `${leader.points - club.points} points back from the league lead.`,
      `${club.points - fifthPlace.points} points clear of the top-four cutoff.`,
      `Goal difference: ${club.goalDifference > 0 ? `+${club.goalDifference}` : club.goalDifference}.`,
      `Attack rank #${attackRank}; defense rank #${defenseRank}.`,
    ];
  }

  if (club.position <= 6 && seventhPlace && leader) {
    return [
      `${club.points - seventhPlace.points} points above the first club outside Europe.`,
      `${leader.points - club.points} points back from first place.`,
      `Goals for/against: ${club.goalsFor} scored, ${club.goalsAgainst} conceded.`,
      `Attack rank #${attackRank}; defense rank #${defenseRank}.`,
    ];
  }

  if (club.position <= 17 && sixthPlace && dropLine) {
    return [
      `${sixthPlace.points - club.points} points separate ${club.team.shortName} from Europe.`,
      `${club.points - dropLine.points} points above the drop line.`,
      `Goal difference: ${club.goalDifference > 0 ? `+${club.goalDifference}` : club.goalDifference}.`,
      `Attack rank #${attackRank}; defense rank #${defenseRank}.`,
    ];
  }

  if (safetyLine) {
    return [
      `${safetyLine.points - club.points} points to reach the current safety line.`,
      `${club.goalsAgainst} goals conceded puts pressure on the run-in.`,
      `Only ${38 - club.playedGames} matches remain in this snapshot.`,
      `Attack rank #${attackRank}; defense rank #${defenseRank}.`,
    ];
  }

  return [
    `Goal difference: ${club.goalDifference > 0 ? `+${club.goalDifference}` : club.goalDifference}.`,
    `${club.goalsFor} scored, ${club.goalsAgainst} conceded.`,
    `${38 - club.playedGames} matches remain.`,
    `Attack rank #${attackRank}; defense rank #${defenseRank}.`,
  ];
}
