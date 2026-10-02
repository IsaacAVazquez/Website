"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert, ExternalLink } from "lucide-react";
import { DATE_ONLY_TIME_ZONE } from "@/lib/date-formatters";
import {
  MetricCard,
  CrestAvatar,
  TeamResultPill,
  FixtureCard,
  LeaderList,
} from "@/components/football";
import {
  Catalog97ProjectHero,
  type Catalog97Readout,
} from "@/components/catalog97/Catalog97ProjectHero";
import { SeedLadder, type LadderTeam } from "@/components/football/SeedLadderPanel";
import { formatGamesGap, seedLadder, type SeedBandSpec } from "@/components/football/seedLadder";
import { PROJECT_PRESS } from "@/constants/projectPress";
import type {
  NbaLeader,
  NbaRouteState,
  NbaSummarySnapshot,
  NbaTeam,
  NbaTeamSnapshot,
  NbaView,
} from "@/types/nba";
import {
  buildHref,
  buildTeamAliasMap,
  canonicalizeTeamId,
  filterTeams,
  getDefaultTeam,
  NBA_ROUTE,
  normalizeState,
  resolveDefaultState,
} from "./nba-state.core";
import { useRouteSync } from "@/hooks/useRouteSync";
import { useCachedSnapshot } from "@/hooks/useCachedSnapshot";
import { groupBy } from "@/lib/utils";

interface NbaClientProps {
  initialState: NbaRouteState;
  summary: NbaSummarySnapshot;
  initialTeamSnapshot: NbaTeamSnapshot | null;
  /** Hex colours keyed by team id, built server-side from the per-team snapshots. */
  teamColors: Record<string, string | null>;
}

const REGULAR_SEASON_GAMES = 82;

const NBA_BANDS: SeedBandSpec[] = [
  { label: "In", throughSeed: 6 },
  { label: "Play-in", throughSeed: 10 },
  { label: "Out" },
];

const viewOptions: Array<{ id: NbaView; label: string }> = [
  { id: "east", label: "Eastern Conference" },
  { id: "west", label: "Western Conference" },
  { id: "playoff", label: "Playoff seeds" },
  { id: "play-in", label: "Play-in race" },
];

function toLadderTeams(teams: NbaTeam[], teamColors: Record<string, string | null>): LadderTeam[] {
  return teams.map((team) => ({
    id: team.id,
    seed: team.conferenceSeed,
    wins: team.wins,
    losses: team.losses,
    shortName: team.shortName,
    record: `${team.wins}-${team.losses}`,
    color: teamColors[team.id] ?? null,
  }));
}

export function NbaClient({ initialState, summary, initialTeamSnapshot, teamColors }: NbaClientProps) {
  const searchParams = useSearchParams();
  const lead = PROJECT_PRESS[NBA_ROUTE].lead;
  const standfirst =
    "I wanted the playoff picture in one glance, from who leads each conference, to how many games separate the cutoff, to who's already out, so this sorts every team into a band, in, play-in, or out, with the gap at each line written right on it.";

  const east = summary.teamsByConference.east;
  const west = summary.teamsByConference.west;
  const allTeams = useMemo<NbaTeam[]>(() => [...east, ...west], [east, west]);
  // Route-state helpers operate on the lean `summary` data the server already
  // sent, so the full nbaSnapshot never enters the client bundle.
  const aliasMap = useMemo(() => buildTeamAliasMap(allTeams), [allTeams]);
  const defaultState = useMemo(() => resolveDefaultState(east, west), [east, west]);
  const teamById = useMemo(() => new Map(allTeams.map((team) => [team.id, team])), [allTeams]);
  const teamLookup = useMemo(
    () => new Map(allTeams.map((team) => [team.id, team.shortName])),
    [allTeams]
  );
  const offenseRankByTeam = useMemo(
    () =>
      new Map(
        allTeams
          .toSorted((a, b) => b.pointsFor - a.pointsFor || a.position - b.position)
          .map((team, index) => [team.id, index + 1] as const)
      ),
    [allTeams]
  );
  const defenseRankByTeam = useMemo(
    () =>
      new Map(
        allTeams
          .toSorted((a, b) => a.pointsAgainst - b.pointsAgainst || a.position - b.position)
          .map((team, index) => [team.id, index + 1] as const)
      ),
    [allTeams]
  );
  const scorersByTeam = useMemo(() => groupLeadersByTeam(summary.scorers), [summary.scorers]);
  const reboundersByTeam = useMemo(() => groupLeadersByTeam(summary.rebounders), [summary.rebounders]);
  const assistsByTeam = useMemo(() => groupLeadersByTeam(summary.assistLeaders), [summary.assistLeaders]);
  const logoByTeamId = useMemo(
    () =>
      new Map(
        summary.teams.map((team) => [
          canonicalizeTeamId(team.id, aliasMap) ?? team.id,
          team.logo,
        ] as const)
      ),
    [summary.teams, aliasMap]
  );
  const snapshotDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        // summary.updatedAt is a YYYY-MM-DD date-only value (parses to UTC midnight).
        timeZone: DATE_ONLY_TIME_ZONE,
      }).format(new Date(summary.updatedAt)),
    [summary.updatedAt]
  );

  const eastLadder = useMemo(
    () => seedLadder(toLadderTeams(east, teamColors), NBA_BANDS),
    [east, teamColors]
  );
  const westLadder = useMemo(
    () => seedLadder(toLadderTeams(west, teamColors), NBA_BANDS),
    [west, teamColors]
  );
  const tightestGap = useMemo(() => {
    const gaps = [...eastLadder.lines, ...westLadder.lines]
      .map((line) => line.gamesClear)
      .filter((gap): gap is number => gap !== null);
    return gaps.length > 0 ? Math.min(...gaps) : null;
  }, [eastLadder, westLadder]);

  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("team") !== null;
  const routeState = hasManagedParams
    ? normalizeState(searchParams, defaultState, aliasMap)
    : initialState;
  const visibleTeams = filterTeams(east, west, routeState.view);
  const selectedTeamId = visibleTeams.some((team) => team.id === routeState.team)
    ? routeState.team
    : getDefaultTeam(east, west, routeState.view, defaultState.team);
  const fallbackTeam = allTeams[0];
  const selectedTeam = teamById.get(selectedTeamId) ?? fallbackTeam;

  const {
    snapshot: teamSnapshot,
    isLoading: isTeamSnapshotLoading,
    error: teamSnapshotError,
  } = useCachedSnapshot<NbaTeamSnapshot>(
    "/api/nba/teams",
    selectedTeam?.id ?? null,
    { id: selectedTeamId, snapshot: initialTeamSnapshot },
    "Unable to load team snapshot."
  );
  const [activeDetailTab, setActiveDetailTab] = useState<"team" | "schedule" | "leaders">("team");
  const desiredHref = buildHref(
    { view: routeState.view, team: selectedTeamId },
    defaultState,
    aliasMap,
    searchParams
  );

  const pushHref = useRouteSync(NBA_ROUTE, desiredHref);

  function navigate(nextState: NbaRouteState) {
    const href = buildHref(nextState, defaultState, aliasMap, searchParams);
    pushHref(href);
  }

  function handleViewChange(view: NbaView) {
    const nextTeams = filterTeams(east, west, view);
    const nextTeam = nextTeams.some((team) => team.id === selectedTeamId)
      ? selectedTeamId
      : nextTeams[0]?.id ?? defaultState.team;
    navigate({ view, team: nextTeam });
  }

  function handleTeamChange(teamId: string) {
    navigate({
      view: routeState.view,
      team: canonicalizeTeamId(teamId, aliasMap) ?? defaultState.team,
    });
  }

  const eastTop = east[0];
  const westTop = west[0];

  const heroReadouts: [Catalog97Readout, Catalog97Readout, Catalog97Readout] = [
    {
      label: "East leader",
      value: eastTop ? `${eastTop.wins}-${eastTop.losses}` : "—",
      detail: eastTop?.shortName,
    },
    {
      label: "West leader",
      value: westTop ? `${westTop.wins}-${westTop.losses}` : "—",
      detail: westTop?.shortName,
    },
    {
      label: "Tightest line",
      value: tightestGap !== null ? formatGamesGap(tightestGap) : "—",
      detail: "separates the closest cutoff across both conferences",
    },
  ];

  const isFinal = allTeams.every((team) => team.gamesPlayed >= REGULAR_SEASON_GAMES);
  const heroMeta = `${summary.sourceLabel} · Season ${summary.season}${
    isFinal ? " · final regular season standings" : ""
  } · ${allTeams.length} teams · snapshot ${snapshotDateLabel}`;

  const heroSignature = (
    <SeedLadder
      conferences={[
        { label: "Eastern Conference", ladder: eastLadder },
        { label: "Western Conference", ladder: westLadder },
      ]}
    />
  );

  if (!selectedTeam) {
    return (
      <Catalog97ProjectHero
        ink={lead}
        title="NBA Pulse"
        standfirst={`${standfirst} Conference standings, playoff seeding, and stat leaders will appear here once the next snapshot is published.`}
      >
        {heroSignature}
      </Catalog97ProjectHero>
    );
  }

  const eastTeams = east;
  const westTeams = west;
  const conferenceTeams = selectedTeam.conference === "east" ? eastTeams : westTeams;
  const conferenceContext = buildConferenceContext(conferenceTeams);
  const selectedZone = getTeamZone(selectedTeam.conferenceSeed);
  const teamRanks = {
    offense: offenseRankByTeam.get(selectedTeam.id) ?? selectedTeam.position,
    defense: defenseRankByTeam.get(selectedTeam.id) ?? selectedTeam.position,
  };
  const teamStoryline = getTeamStoryline(selectedTeam, conferenceContext);
  const teamPressurePoints = getTeamPressurePoints(selectedTeam, conferenceContext, teamRanks);
  const teamScorers = scorersByTeam.get(selectedTeam.id) ?? [];
  const teamRebounders = reboundersByTeam.get(selectedTeam.id) ?? [];
  const teamAssists = assistsByTeam.get(selectedTeam.id) ?? [];
  const formSequence = teamSnapshot?.form?.sequence ?? [];
  const recentFixtures = (teamSnapshot?.recentFixtures ?? []).slice(0, 3);
  const upcomingFixtures = (teamSnapshot?.upcomingFixtures ?? []).slice(0, 3);
  const remainingGames = Math.max(0, REGULAR_SEASON_GAMES - selectedTeam.gamesPlayed);

  return (
    <>
      <Catalog97ProjectHero ink={lead} title="NBA Pulse" standfirst={standfirst} meta={heroMeta} readouts={heroReadouts}>
        {heroSignature}
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="c97-poster-sm">Standings</h2>
            <p className="c97-meta">{visibleTeams.length} teams</p>
          </div>

          <div role="group" aria-label="Conference and seeding view" className="c97-segmented" style={{ marginTop: "var(--c97-sp-2)" }}>
            {viewOptions.map((option) => {
              const isActive = option.id === routeState.view;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleViewChange(option.id)}
                  aria-pressed={isActive}
                  className="min-h-[44px] text-sm font-semibold"
                >
                  {option.label}{" "}
                  <span className="c97-mono" style={{ color: "var(--c97-label)" }}>
                    {filterTeams(east, west, option.id).length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div
              role="region"
              aria-label="NBA standings (scrollable)"
              tabIndex={0}
              style={{ overflowX: "auto" }}
            >
              <table className="c97-table" aria-label="NBA standings">
                <thead>
                  <tr>
                    <th scope="col">Seed</th>
                    <th scope="col">Team</th>
                    <th scope="col">Record</th>
                    <th scope="col" data-align="end">W%</th>
                    <th scope="col" data-align="end">GB</th>
                    <th scope="col" data-align="end">PF</th>
                    <th scope="col" data-align="end">PA</th>
                    <th scope="col" data-align="end">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTeams.map((team) => {
                    const isSelected = team.id === selectedTeam.id;
                    const zone = getTeamZone(team.conferenceSeed);
                    return (
                      <tr
                        key={`${team.conference}-${team.id}`}
                        style={isSelected ? { boxShadow: "inset 4px 0 0 0 var(--c97-ink)" } : undefined}
                      >
                        <td>
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              aria-hidden="true"
                              style={{
                                width: 8,
                                height: 8,
                                display: "inline-block",
                                background: zoneDotColor(zone),
                              }}
                            />
                            {team.conferenceSeed}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleTeamChange(team.id)}
                            aria-pressed={isSelected}
                            aria-label={`Show ${team.name} details`}
                            className="flex min-h-[44px] items-center gap-2 text-left"
                          >
                            <CrestAvatar crest={logoByTeamId.get(team.id) ?? null} name={team.shortName} size="sm" />
                            <span style={{ fontWeight: 600, color: "var(--c97-ink)" }}>{team.shortName}</span>
                            <span className="c97-mono" style={{ color: "var(--c97-ink-2)", fontSize: "var(--c97-fs-label)" }}>
                              {team.conference === "east" ? "E" : "W"}
                            </span>
                          </button>
                        </td>
                        <td>{team.wins}-{team.losses}</td>
                        <td data-align="end">
                          {Number.isFinite(team.winPercent) ? team.winPercent.toFixed(3).replace(/^0/, "") : "—"}
                        </td>
                        <td data-align="end">{formatGamesBack(team.gamesBack)}</td>
                        <td data-align="end">{team.pointsFor.toFixed(1)}</td>
                        <td data-align="end">{team.pointsAgainst.toFixed(1)}</td>
                        <td data-align="end">{formatPointDiff(perGameDifferential(team))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <aside>
              <section className="c97-panel" aria-live="polite" data-testid="nba-selected-team">
                <div className="flex items-start gap-3">
                  <CrestAvatar crest={logoByTeamId.get(selectedTeam.id) ?? null} name={selectedTeam.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h2 className="c97-serif c97-h3">{selectedTeam.name}</h2>
                    <div className="c97-meta" style={{ marginTop: "var(--c97-sp-1)", textTransform: "none" }}>
                      <span className={zoneChipClass(selectedZone)}>{getZoneLabel(selectedZone)}</span>
                      <span className="c97-chip">{selectedTeam.wins}-{selectedTeam.losses}</span>
                      <span className="c97-chip">{remainingGames} left</span>
                    </div>
                  </div>
                  <div className="c97-stat">
                    <p className="c97-stat-label">Seed</p>
                    <p className="c97-stat-value">{selectedTeam.conferenceSeed}</p>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-4" style={{ borderColor: "var(--c97-rule)" }}>
                  {(
                    [
                      ["Win %", Number.isFinite(selectedTeam.winPercent) ? selectedTeam.winPercent.toFixed(3).replace(/^0/, "") : "—"],
                      ["GB", formatGamesBack(selectedTeam.gamesBack)],
                      ["L10", selectedTeam.lastTen ?? "—"],
                      ["Streak", selectedTeam.streak ?? "—"],
                      ["Offense", `#${teamRanks.offense}`],
                      ["Defense", `#${teamRanks.defense}`],
                      ["PF/g", selectedTeam.pointsFor.toFixed(1)],
                      ["PA/g", selectedTeam.pointsAgainst.toFixed(1)],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-2">
                      <dt className="c97-kicker">{label}</dt>
                      <dd className="c97-mono" style={{ margin: 0, fontWeight: 600, color: "var(--c97-ink)" }}>{value}</dd>
                    </div>
                  ))}
                </dl>

                {formSequence.length > 0 && (
                  <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--c97-rule)" }}>
                    <p className="c97-kicker">Form</p>
                    <div className="mt-2 flex gap-1.5">
                      {formSequence.slice(-5).map((result, i) => (
                        <TeamResultPill key={i} result={result} />
                      ))}
                    </div>
                  </div>
                )}

                <p className="c97-prose line-clamp-2" style={{ marginTop: "var(--c97-sp-2)", fontSize: "var(--c97-fs-small)" }}>
                  {teamStoryline}
                </p>

                {!teamSnapshot && (isTeamSnapshotLoading || teamSnapshotError) ? (
                  <p
                    className="c97-prose border-t pt-4"
                    style={{ marginTop: "var(--c97-sp-2)", borderColor: "var(--c97-rule)", fontSize: "var(--c97-fs-small)" }}
                    role={teamSnapshotError ? "alert" : "status"}
                    aria-live="polite"
                  >
                    {isTeamSnapshotLoading ? "Loading team snapshot…" : teamSnapshotError}
                  </p>
                ) : null}
              </section>
            </aside>
          </div>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="torn">
        <div className="c97-shell">
          <div role="tablist" aria-label="Team and league details" className="c97-segmented">
            {(["team", "schedule", "leaders"] as const).map((tab) => {
              const labels = { team: "Team Detail", schedule: "Schedule", leaders: "Stat Leaders" } as const;
              return (
                <button
                  key={tab}
                  id={`nba-detail-tab-${tab}`}
                  role="tab"
                  type="button"
                  aria-selected={activeDetailTab === tab}
                  aria-controls="nba-detail-panel"
                  onClick={() => setActiveDetailTab(tab)}
                  className="min-h-[44px] text-sm font-semibold"
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          <div id="nba-detail-panel" role="tabpanel" aria-labelledby={`nba-detail-tab-${activeDetailTab}`} className="mt-6">
            {activeDetailTab === "team" && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-5">
                  <div>
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Performance</p>
                    <div className="grid grid-cols-2 gap-3">
                      <MetricCard
                        label="Win %"
                        value={Number.isFinite(selectedTeam.winPercent) ? selectedTeam.winPercent.toFixed(3).replace(/^0/, "") : "—"}
                      />
                      <MetricCard label="Record" value={`${selectedTeam.wins}-${selectedTeam.losses}`} />
                      <MetricCard label="Offense rank" value={`#${teamRanks.offense}`} />
                      <MetricCard label="Defense rank" value={`#${teamRanks.defense}`} />
                      <MetricCard label="PF / game" value={selectedTeam.pointsFor.toFixed(1)} />
                      <MetricCard label="PA / game" value={selectedTeam.pointsAgainst.toFixed(1)} />
                    </div>
                  </div>

                  <div className="c97-panel">
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Pressure points</p>
                    <ul className="c97-prose" style={{ margin: 0, paddingLeft: "1.1em" }}>
                      {teamPressurePoints.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <TeamLeaderCard
                      title="Top scorer"
                      leader={teamScorers[0]}
                      statLabel="Points"
                      emptyLabel="No top-10 scorer for this team in the latest snapshot."
                    />
                    <TeamLeaderCard
                      title="Top rebounder"
                      leader={teamRebounders[0]}
                      statLabel="Rebounds"
                      emptyLabel="No top-10 rebounder for this team in the latest snapshot."
                    />
                    <TeamLeaderCard
                      title="Top playmaker"
                      leader={teamAssists[0]}
                      statLabel="Assists"
                      emptyLabel="No top-10 playmaker for this team in the latest snapshot."
                    />
                  </div>

                  <p className="c97-prose">{teamStoryline}</p>
                </div>

                {!teamSnapshot && (isTeamSnapshotLoading || teamSnapshotError) && (
                  <div className="c97-panel" role={teamSnapshotError ? "alert" : "status"} aria-live="polite">
                    <p className="c97-prose">{isTeamSnapshotLoading ? "Loading recent team games…" : teamSnapshotError}</p>
                  </div>
                )}

                {recentFixtures.length > 0 && (
                  <div>
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Recent results</p>
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
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Upcoming games</p>
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
            )}

            {activeDetailTab === "schedule" && (
              <div className="grid gap-6 md:grid-cols-2">
                {summary.recentFixtures.length > 0 && (
                  <div>
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Latest results</p>
                    <div className="space-y-3">
                      {summary.recentFixtures.map((f) => (
                        <FixtureCard key={f.id} fixture={f} onOpenTeam={handleTeamChange} />
                      ))}
                    </div>
                  </div>
                )}
                {summary.upcomingFixtures.length > 0 && (
                  <div>
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Upcoming games</p>
                    <div className="space-y-3">
                      {summary.upcomingFixtures.map((f) => (
                        <FixtureCard key={f.id} fixture={f} onOpenTeam={handleTeamChange} />
                      ))}
                    </div>
                  </div>
                )}
                {summary.recentFixtures.length === 0 && summary.upcomingFixtures.length === 0 && (
                  <p className="c97-prose md:col-span-2">
                    No games are on the schedule right now. Recent results and upcoming
                    matchups will appear here once the next snapshot is published.
                  </p>
                )}
              </div>
            )}

            {activeDetailTab === "leaders" && (
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <p className="c97-kicker">Top scorers</p>
                    <a href={summary.sourceUrls.leaders} target="_blank" rel="noreferrer" className="c97-btn-ghost">
                      Official
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <LeaderList leaders={toLeaderEntries(summary.scorers.slice(0, 5))} statLabel="ppg" clubLookup={teamLookup} />
                </div>
                <div>
                  <p className="c97-kicker">Top rebounders</p>
                  <LeaderList leaders={toLeaderEntries(summary.rebounders.slice(0, 5))} statLabel="rpg" clubLookup={teamLookup} />
                </div>
                <div>
                  <p className="c97-kicker">Top playmakers</p>
                  <LeaderList leaders={toLeaderEntries(summary.assistLeaders.slice(0, 5))} statLabel="apg" clubLookup={teamLookup} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "var(--c97-ink-2)" }} aria-hidden="true" />
            <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
              This page is a curated snapshot, refreshed on a schedule. Standings,
              scoreboard, and stat leaders are pulled from ESPN&apos;s public NBA
              endpoints and committed back into the repo on each refresh.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function groupLeadersByTeam(leaders: NbaLeader[]) {
  return groupBy(leaders, (entry) => entry.teamId);
}

function toLeaderEntries(
  leaders: NbaLeader[]
): Array<{
  rank: number;
  name: string;
  clubId: string;
  clubCode: string;
  total: number;
  appearances: number;
  perMatch: number;
}> {
  return leaders.map((leader) => ({
    rank: leader.rank,
    name: leader.name,
    clubId: leader.teamId,
    clubCode: leader.teamAbbreviation,
    total: Number.isFinite(leader.total) ? Number(leader.total.toFixed(1)) : 0,
    appearances: leader.appearances,
    perMatch: leader.perGame,
  }));
}

function formatGamesBack(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) < 0.05) return "—";
  return value.toFixed(1);
}

function formatPointDiff(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}

/**
 * `pointDifferential` in the snapshot is a season total (confirmed against
 * `pointsFor`/`pointsAgainst`, which are per game), so every display of it
 * alongside per-game stats normalizes by games played first.
 */
function perGameDifferential(team: NbaTeam): number {
  return team.gamesPlayed > 0 ? team.pointDifferential / team.gamesPlayed : 0;
}

type NbaZone = "playoff" | "play-in" | "lottery";

function getTeamZone(seed: number): NbaZone {
  if (seed <= 6) return "playoff";
  if (seed <= 10) return "play-in";
  return "lottery";
}

function getZoneLabel(zone: NbaZone): string {
  switch (zone) {
    case "playoff":
      return "Playoff seed";
    case "play-in":
      return "Play-in";
    case "lottery":
    default:
      return "Lottery";
  }
}

function zoneChipClass(zone: NbaZone): string {
  switch (zone) {
    case "playoff":
      return "c97-chip c97-chip-positive";
    case "play-in":
      return "c97-chip c97-chip-warning";
    case "lottery":
    default:
      return "c97-chip";
  }
}

function zoneDotColor(zone: NbaZone): string {
  switch (zone) {
    case "playoff":
      return "var(--c97-positive)";
    case "play-in":
      return "var(--c97-warning)";
    case "lottery":
    default:
      return "var(--c97-ink-2)";
  }
}

interface ConferenceContext {
  topSeed: NbaTeam | undefined;
  sixthSeed: NbaTeam | undefined;
  seventhSeed: NbaTeam | undefined;
  tenthSeed: NbaTeam | undefined;
  eleventhSeed: NbaTeam | undefined;
}

function buildConferenceContext(teams: NbaTeam[]): ConferenceContext {
  return {
    topSeed: teams[0],
    sixthSeed: teams[5],
    seventhSeed: teams[6],
    tenthSeed: teams[9],
    eleventhSeed: teams[10],
  };
}

function getTeamStoryline(team: NbaTeam, context: ConferenceContext): string {
  const { topSeed, sixthSeed, seventhSeed, tenthSeed, eleventhSeed } = context;
  const seed = team.conferenceSeed;
  if (!topSeed) return `${team.shortName} are still building their conference resume.`;
  if (seed === 1) {
    const margin = sixthSeed ? team.wins - sixthSeed.wins : team.wins;
    return `${team.shortName} hold the conference's top seed and sit ${margin} games clear of the play-in cutoff.`;
  }
  if (seed <= 6) {
    const aheadOfPlayIn = seventhSeed ? team.wins - seventhSeed.wins : null;
    return `${team.shortName} are locked into a playoff seed${
      aheadOfPlayIn !== null ? ` with a ${aheadOfPlayIn}-game cushion over the play-in line` : ""
    }.`;
  }
  if (seed <= 10) {
    const behindPlayoff = sixthSeed ? sixthSeed.wins - team.wins : null;
    const aheadOfLottery = eleventhSeed ? team.wins - eleventhSeed.wins : null;
    return `${team.shortName} are in the play-in${
      behindPlayoff !== null ? `, ${behindPlayoff} games back of a top-six seed` : ""
    }${aheadOfLottery !== null ? ` and ${aheadOfLottery} games clear of the lottery` : ""}.`;
  }
  const behindPlayIn = tenthSeed ? tenthSeed.wins - team.wins : null;
  return `${team.shortName} are outside the play-in${
    behindPlayIn !== null ? ` and ${behindPlayIn} games short of the tenth seed` : ""
  }.`;
}

function getTeamPressurePoints(
  team: NbaTeam,
  context: ConferenceContext,
  ranks: { offense: number; defense: number }
): string[] {
  const { topSeed, sixthSeed, seventhSeed, tenthSeed, eleventhSeed } = context;
  const seed = team.conferenceSeed;
  const remaining = Math.max(0, REGULAR_SEASON_GAMES - team.gamesPlayed);
  if (seed === 1 && topSeed && sixthSeed) {
    return [
      `${team.wins - sixthSeed.wins} games clear of the playoff cutoff.`,
      `Net rating: ${formatPointDiff(perGameDifferential(team))} per game.`,
      `${remaining} games remain on the schedule.`,
      `Offense rank #${ranks.offense} · Defense rank #${ranks.defense}.`,
    ];
  }
  if (seed <= 6 && topSeed && seventhSeed) {
    return [
      `${topSeed.wins - team.wins} games back from the conference top seed.`,
      `${team.wins - seventhSeed.wins} games clear of the play-in line.`,
      `Net rating: ${formatPointDiff(perGameDifferential(team))} per game.`,
      `Offense rank #${ranks.offense} · Defense rank #${ranks.defense}.`,
    ];
  }
  if (seed <= 10 && sixthSeed && eleventhSeed) {
    return [
      `${sixthSeed.wins - team.wins} games short of a top-six seed.`,
      `${team.wins - eleventhSeed.wins} games above the lottery line.`,
      `Net rating: ${formatPointDiff(perGameDifferential(team))} per game.`,
      `Offense rank #${ranks.offense} · Defense rank #${ranks.defense}.`,
    ];
  }
  return [
    tenthSeed ? `${tenthSeed.wins - team.wins} games back of the play-in.` : "Outside the play-in field.",
    `Net rating: ${formatPointDiff(perGameDifferential(team))} per game.`,
    `${remaining} games remain to climb the seeding.`,
    `Offense rank #${ranks.offense} · Defense rank #${ranks.defense}.`,
  ];
}

function TeamLeaderCard({
  title,
  leader,
  statLabel,
  emptyLabel,
}: {
  title: string;
  leader?: NbaLeader;
  statLabel: string;
  emptyLabel: string;
}) {
  return (
    <div className="c97-panel">
      <p className="c97-kicker">{title}</p>
      {leader ? (
        <>
          <p className="c97-h3 c97-serif" style={{ marginTop: "var(--c97-sp-1)" }}>{leader.name}</p>
          <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)", fontSize: "var(--c97-fs-small)" }}>
            {leader.perGame.toFixed(1)} {statLabel.toLowerCase()} per game
          </p>
          <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-1)" }}>{leader.teamAbbreviation}</p>
        </>
      ) : (
        <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)", fontSize: "var(--c97-fs-small)" }}>{emptyLabel}</p>
      )}
    </div>
  );
}
