"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert, ExternalLink, Flag } from "lucide-react";
import { DATE_ONLY_TIME_ZONE } from "@/lib/date-formatters";
import { MetricCard, CrestAvatar, TeamResultPill, FixtureCard } from "@/components/football";
import {
  Catalog97ProjectHero,
  type Catalog97Readout,
} from "@/components/catalog97/Catalog97ProjectHero";
import { SeedLadder, type LadderTeam, type SeedLadderConference } from "@/components/football/SeedLadderPanel";
import { formatGamesGap, seedLadder, nflSeeds, type SeedBandSpec, type SeedLadderResult } from "@/components/football/seedLadder";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { NflDivisionGrid, type DivisionGridGroup } from "./NflDivisionGrid";
import "./nfl.css";
import type {
  NFLLeader,
  NFLLeaderboards,
  NFLRouteState,
  NFLSummarySnapshot,
  NFLTeamOption,
  NFLTeamSnapshot,
  NFLTeamStanding,
  NFLView,
} from "@/types/nfl";
import {
  buildHref,
  buildTeamAliasMap,
  canonicalizeTeamId,
  filterTeams,
  getDefaultTeam,
  NFL_ROUTE,
  normalizeState,
  resolveDefaultState,
} from "./nfl-state.core";
import { useRouteSync } from "@/hooks/useRouteSync";
import { useCachedSnapshot } from "@/hooks/useCachedSnapshot";

interface NflClientProps {
  initialState: NFLRouteState;
  summary: NFLSummarySnapshot;
  initialTeamSnapshot: NFLTeamSnapshot | null;
}

type LeaderCategory = keyof NFLLeaderboards;

const NFL_BANDS: SeedBandSpec[] = [{ label: "In", throughSeed: 7 }, { label: "Out" }];

const DIVISION_ORDER = [
  "AFC East",
  "AFC North",
  "AFC South",
  "AFC West",
  "NFC East",
  "NFC North",
  "NFC South",
  "NFC West",
] as const;

const VIEW_OPTIONS: Array<{ id: NFLView; label: string }> = [
  { id: "league", label: "Full league" },
  { id: "afc", label: "AFC" },
  { id: "nfc", label: "NFC" },
  { id: "playoffs", label: "Playoff field" },
];

const LEADER_TABS: Array<{ id: LeaderCategory; label: string; unit: string; unitLong: string }> = [
  { id: "passing", label: "Passing yards", unit: "yds", unitLong: "passing yards" },
  { id: "rushing", label: "Rushing yards", unit: "yds", unitLong: "rushing yards" },
  { id: "receiving", label: "Receiving yards", unit: "yds", unitLong: "receiving yards" },
  { id: "sacks", label: "Sacks", unit: "sk", unitLong: "sacks" },
];

/**
 * The NFL only has a real seed for the top seven per conference; everyone
 * else gets a stable tiebreak order (win pct, then point differential) so
 * the "first team out" in the gap calculation is the actual closest team,
 * not an arbitrary one. That order never reaches the UI, since the ladder
 * only displays the seeded band.
 */
function toLadderTeams(
  teams: NFLTeamStanding[],
  seeds: Map<string, number>,
  optionsById: Map<string, NFLTeamOption>
): LadderTeam[] {
  const unseededByTiebreak = teams
    .filter((team) => !seeds.has(team.id))
    .toSorted((a, b) => b.winPct - a.winPct || b.pointDifferential - a.pointDifferential);
  const outOrder = new Map(unseededByTiebreak.map((team, index) => [team.id, 8 + index] as const));

  return teams.map((team) => ({
    id: team.id,
    seed: seeds.get(team.id) ?? outOrder.get(team.id) ?? 99,
    wins: team.wins,
    losses: team.losses,
    ties: team.ties,
    shortName: team.shortName,
    record: formatRecord(team),
    color: optionsById.get(team.id)?.primaryColor ?? null,
  }));
}

/** Hides the unseeded "Out" band's rows without touching the computed gap. */
function seededOnly(ladder: SeedLadderResult<LadderTeam>): SeedLadderResult<LadderTeam> {
  return {
    bands: ladder.bands.map((band, index) =>
      index === ladder.bands.length - 1 ? { ...band, teams: [] } : band
    ),
    lines: ladder.lines,
  };
}

function buildDivisionGroups(
  teams: NFLTeamStanding[],
  optionsById: Map<string, NFLTeamOption>
): DivisionGridGroup[] {
  return DIVISION_ORDER.map((division) => ({
    name: division,
    teams: teams
      .filter((team) => team.division === division)
      .toSorted((a, b) => a.divisionRank - b.divisionRank)
      .map((team) => ({
        id: team.id,
        shortName: team.shortName,
        record: formatRecord(team),
        primaryColor: optionsById.get(team.id)?.primaryColor ?? null,
        secondaryColor: optionsById.get(team.id)?.secondaryColor ?? null,
        isLeader: team.divisionRank === 1,
      })),
  }));
}

export function NflClient({ initialState, summary, initialTeamSnapshot }: NflClientProps) {
  const searchParams = useSearchParams();
  const lead = PROJECT_PRESS[NFL_ROUTE].lead;
  const standfirst =
    "I wanted the playoff picture as it would stand if the season ended today. The snapshot carries no seeds, so I derive them from the standings, the four division leaders first and then the three best of the rest, and draw the line where the field ends.";

  const teams = summary.teams;
  const aliasMap = useMemo(() => buildTeamAliasMap(summary.teams), [summary.teams]);
  const defaultState = useMemo(() => resolveDefaultState(summary.teams), [summary.teams]);
  const teamById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const teamShortNameById = useMemo(
    () => new Map(teams.map((team) => [team.id, team.shortName])),
    [teams]
  );
  const optionsById = useMemo(
    () => new Map(summary.teamOptions.map((option) => [option.id, option])),
    [summary.teamOptions]
  );
  const logoByTeamId = useMemo(
    () => new Map(summary.teamOptions.map((option) => [option.id, option.logo])),
    [summary.teamOptions]
  );

  const offenseRankByTeam = useMemo(
    () =>
      new Map(
        teams
          .toSorted((left, right) => right.pointsFor - left.pointsFor || right.winPct - left.winPct)
          .map((team, index) => [team.id, index + 1] as const)
      ),
    [teams]
  );
  const defenseRankByTeam = useMemo(
    () =>
      new Map(
        teams
          .toSorted(
            (left, right) => left.pointsAgainst - right.pointsAgainst || right.winPct - left.winPct
          )
          .map((team, index) => [team.id, index + 1] as const)
      ),
    [teams]
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

  const seeds = useMemo(() => nflSeeds(teams), [teams]);
  const afcTeams = useMemo(() => teams.filter((team) => team.conference === "AFC"), [teams]);
  const nfcTeams = useMemo(() => teams.filter((team) => team.conference === "NFC"), [teams]);
  const afcLadder = useMemo(
    () => seedLadder(toLadderTeams(afcTeams, seeds, optionsById), NFL_BANDS),
    [afcTeams, seeds, optionsById]
  );
  const nfcLadder = useMemo(
    () => seedLadder(toLadderTeams(nfcTeams, seeds, optionsById), NFL_BANDS),
    [nfcTeams, seeds, optionsById]
  );
  const tightestGap = useMemo(() => {
    const gaps = [...afcLadder.lines, ...nfcLadder.lines]
      .map((line) => line.gamesClear)
      .filter((gap): gap is number => gap !== null);
    return gaps.length > 0 ? Math.min(...gaps) : null;
  }, [afcLadder, nfcLadder]);
  const divisionGroups = useMemo(() => buildDivisionGroups(teams, optionsById), [teams, optionsById]);

  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("team") !== null;
  const routeState = hasManagedParams
    ? normalizeState(searchParams, defaultState, aliasMap)
    : initialState;
  const visibleTeams = filterTeams(summary.teams, routeState.view);
  const selectedTeamId = visibleTeams.some((team) => team.id === routeState.team)
    ? routeState.team
    : getDefaultTeam(summary.teams, routeState.view, defaultState.team);
  const selectedTeam = teamById.get(selectedTeamId) ?? teams[0];
  const {
    snapshot: teamSnapshot,
    isLoading: isTeamSnapshotLoading,
    error: teamSnapshotError,
  } = useCachedSnapshot<NFLTeamSnapshot>(
    "/api/nfl/teams",
    selectedTeam?.id ?? null,
    { id: selectedTeamId, snapshot: initialTeamSnapshot },
    "Unable to load team snapshot."
  );
  const desiredHref = buildHref(
    { view: routeState.view, team: selectedTeamId },
    defaultState,
    aliasMap,
    searchParams
  );

  const pushHref = useRouteSync(NFL_ROUTE, desiredHref);

  function navigate(nextState: NFLRouteState) {
    const href = buildHref(nextState, defaultState, aliasMap, searchParams);
    pushHref(href);
  }

  function handleViewChange(view: NFLView) {
    const nextTeams = filterTeams(summary.teams, view);
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

  const conferenceContext = useMemo(() => buildConferenceContext(teams, seeds), [teams, seeds]);

  const [activeDetailTab, setActiveDetailTab] = useState<"team" | "fixtures" | "leaders">("team");
  const [activeLeaderTab, setActiveLeaderTab] = useState<LeaderCategory>("passing");

  const afcTop = conferenceContext.AFC.topSeed;
  const nfcTop = conferenceContext.NFC.topSeed;
  const totalRegSeasonWeeks = 18;
  const heroReadouts: [Catalog97Readout, Catalog97Readout, Catalog97Readout] = [
    { label: "AFC leader", value: afcTop ? formatRecord(afcTop) : "—", detail: afcTop?.shortName },
    { label: "NFC leader", value: nfcTop ? formatRecord(nfcTop) : "—", detail: nfcTop?.shortName },
    {
      label: "Tightest line",
      value: tightestGap !== null ? formatGamesGap(tightestGap) : "—",
      detail: "separates the seventh seed from the closest team out",
    },
  ];
  const heroMeta = `${summary.sourceLabel} · Season ${summary.season} · ${
    summary.week ? `through week ${summary.week} of ${totalRegSeasonWeeks}` : "week 1 in progress"
  } · snapshot ${snapshotDateLabel}`;

  const ladderConferences: SeedLadderConference[] = [
    { label: "AFC", ladder: seededOnly(afcLadder) },
    { label: "NFC", ladder: seededOnly(nfcLadder) },
  ];
  const heroSignature = (
    <SeedLadder
      conferences={ladderConferences}
      note="These seeds come from each team's division rank and conference rank in the snapshot, so they read as the picture if the season ended today."
    />
  );

  if (!selectedTeam) {
    return (
      <Catalog97ProjectHero
        ink={lead}
        title="NFL Pulse"
        standfirst={`${standfirst} Conference standings, playoff seeding, and stat leaders will appear here once the next snapshot is published.`}
      >
        {heroSignature}
      </Catalog97ProjectHero>
    );
  }

  const teamStoryline = getTeamStoryline(selectedTeam, conferenceContext, seeds);
  const teamPressurePoints = getTeamPressurePoints(selectedTeam, {
    conferenceContext,
    offenseRankByTeam,
    defenseRankByTeam,
    seeds,
  });
  const selectedZone = getTeamZone(selectedTeam, seeds);
  const selectedSeed = seeds.get(selectedTeam.id) ?? null;
  const selectedTeamLeaders = collectLeadersForTeam(selectedTeam.id, summary.leaders);
  const formSequence = teamSnapshot?.form?.sequence ?? [];
  const recentFixtures = (teamSnapshot?.recentFixtures ?? []).slice(0, 3);
  const upcomingFixtures = (teamSnapshot?.upcomingFixtures ?? []).slice(0, 3);

  const activeLeaderMeta = LEADER_TABS.find((tab) => tab.id === activeLeaderTab) ?? LEADER_TABS[0];
  const activeLeaders = summary.leaders[activeLeaderTab] ?? [];

  return (
    <>
      <Catalog97ProjectHero ink={lead} title="NFL Pulse" standfirst={standfirst} meta={heroMeta} readouts={heroReadouts}>
        {heroSignature}
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="torn">
        <div className="c97-shell">
          <h2 className="c97-poster-sm">Divisions</h2>
          <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)", fontSize: "var(--c97-fs-small)" }}>
            Each team striped in its own colours, division leaders marked.
          </p>
          <div className="mt-4">
            <NflDivisionGrid divisions={divisionGroups} />
          </div>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="c97-poster-sm">Standings</h2>
            <p className="c97-meta">{visibleTeams.length} teams</p>
          </div>

          <div role="group" aria-label="Conference and seeding view" className="c97-segmented" style={{ marginTop: "var(--c97-sp-2)" }}>
            {VIEW_OPTIONS.map((option) => {
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
                    {filterTeams(summary.teams, option.id).length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div
              role="region"
              aria-label="NFL standings (scrollable)"
              tabIndex={0}
              style={{ overflowX: "auto" }}
            >
              <table className="c97-table" aria-label="NFL standings">
                <thead>
                  <tr>
                    <th scope="col">Seed</th>
                    <th scope="col">Team</th>
                    <th scope="col">Record</th>
                    <th scope="col" data-align="end">Pct</th>
                    <th scope="col">Division</th>
                    <th scope="col" data-align="end">PF</th>
                    <th scope="col" data-align="end">PA</th>
                    <th scope="col" data-align="end">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTeams.map((team) => {
                    const isSelected = team.id === selectedTeam.id;
                    const zone = getTeamZone(team, seeds);
                    return (
                      <tr
                        key={team.id}
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
                            {seeds.get(team.id) ?? "—"}
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
                          </button>
                        </td>
                        <td>{formatRecord(team)}</td>
                        <td data-align="end">{team.winPct.toFixed(3).replace(/^0/, "")}</td>
                        <td>{team.division}</td>
                        <td data-align="end">{team.pointsFor}</td>
                        <td data-align="end">{team.pointsAgainst}</td>
                        <td data-align="end">{formatDifferential(team.pointDifferential)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <aside>
              <section className="c97-panel" aria-live="polite" data-testid="nfl-selected-team">
                <div className="flex items-start gap-3">
                  <CrestAvatar crest={logoByTeamId.get(selectedTeam.id) ?? null} name={selectedTeam.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h2 className="c97-serif c97-h3">{selectedTeam.name}</h2>
                    <div className="c97-meta" style={{ marginTop: "var(--c97-sp-1)", textTransform: "none" }}>
                      <span className={zoneChipClass(selectedZone)}>{getZoneLabel(selectedZone)}</span>
                      <span className="c97-chip">{formatRecord(selectedTeam)}</span>
                      <span className="c97-chip">{selectedTeam.division}</span>
                    </div>
                  </div>
                  <div className="c97-stat">
                    <p className="c97-stat-label">Seed</p>
                    <p className="c97-stat-value">{selectedSeed ?? "—"}</p>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-4" style={{ borderColor: "var(--c97-rule)" }}>
                  {(
                    [
                      ["Win %", selectedTeam.winPct.toFixed(3).replace(/^0/, "")],
                      ["Record", formatRecord(selectedTeam)],
                      ["Offense", `#${offenseRankByTeam.get(selectedTeam.id) ?? "-"}`],
                      ["Defense", `#${defenseRankByTeam.get(selectedTeam.id) ?? "-"}`],
                      [
                        "PF / game",
                        formatPerGame(
                          selectedTeam.pointsFor /
                            Math.max(1, selectedTeam.wins + selectedTeam.losses + selectedTeam.ties)
                        ),
                      ],
                      [
                        "PA / game",
                        formatPerGame(
                          selectedTeam.pointsAgainst /
                            Math.max(1, selectedTeam.wins + selectedTeam.losses + selectedTeam.ties)
                        ),
                      ],
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
                    <p className="c97-kicker">Form (last 5)</p>
                    <div className="mt-2 flex gap-1.5">
                      {formatTeamFormPills(formSequence.slice(-5)).map((result, i) => (
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
          <div
            role="tablist"
            aria-label="Team and league details"
            className="c97-segmented"
          >
            {(
              [
                { id: "team", label: "Team Detail" },
                { id: "fixtures", label: "Schedule" },
                { id: "leaders", label: "Stat Leaders" },
              ] as const
            ).map((tab) => {
              const isActive = activeDetailTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nfl-detail-tab-${tab.id}`}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-controls="nfl-detail-panel"
                  onClick={() => setActiveDetailTab(tab.id)}
                  className="min-h-[44px] text-sm font-semibold"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div id="nfl-detail-panel" role="tabpanel" aria-labelledby={`nfl-detail-tab-${activeDetailTab}`} className="mt-6">
            {activeDetailTab === "team" && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-5">
                  <div>
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Performance</p>
                    <div className="grid grid-cols-2 gap-3">
                      <MetricCard label="Win %" value={selectedTeam.winPct.toFixed(3).replace(/^0/, "")} />
                      <MetricCard label="Record" value={formatRecord(selectedTeam)} />
                      <MetricCard label="Offense rank" value={`#${offenseRankByTeam.get(selectedTeam.id) ?? "-"}`} />
                      <MetricCard label="Defense rank" value={`#${defenseRankByTeam.get(selectedTeam.id) ?? "-"}`} />
                      <MetricCard label="Points for" value={`${selectedTeam.pointsFor}`} />
                      <MetricCard label="Points against" value={`${selectedTeam.pointsAgainst}`} />
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

                  <div className="grid gap-3 sm:grid-cols-2">
                    <TeamLeaderCard title="Top passer" leader={selectedTeamLeaders.passing} unitLong="passing yards" emptyLabel="No passer in the league top 10." />
                    <TeamLeaderCard title="Top rusher" leader={selectedTeamLeaders.rushing} unitLong="rushing yards" emptyLabel="No rusher in the league top 10." />
                    <TeamLeaderCard title="Top receiver" leader={selectedTeamLeaders.receiving} unitLong="receiving yards" emptyLabel="No receiver in the league top 10." />
                    <TeamLeaderCard title="Sacks leader" leader={selectedTeamLeaders.sacks} unitLong="sacks" emptyLabel="No defender in the league top 10." />
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
                        <FixtureCard periodLabel="Week" key={fixture.id} fixture={fixture} contextTeamId={teamSnapshot?.team?.id ?? undefined} compact />
                      ))}
                    </div>
                  </div>
                )}

                {upcomingFixtures.length > 0 && (
                  <div>
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Upcoming games</p>
                    <div className="space-y-2">
                      {upcomingFixtures.map((fixture) => (
                        <FixtureCard periodLabel="Week" key={fixture.id} fixture={fixture} contextTeamId={teamSnapshot?.team?.id ?? undefined} compact />
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
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Latest results</p>
                    <div className="space-y-3">
                      {summary.recentFixtures.map((fixture) => (
                        <FixtureCard periodLabel="Week" key={fixture.id} fixture={fixture} onOpenTeam={handleTeamChange} />
                      ))}
                    </div>
                  </div>
                )}
                {summary.upcomingFixtures.length > 0 ? (
                  <div>
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Upcoming games</p>
                    <div className="space-y-3">
                      {summary.upcomingFixtures.map((fixture) => (
                        <FixtureCard periodLabel="Week" key={fixture.id} fixture={fixture} onOpenTeam={handleTeamChange} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="c97-panel">
                    <p className="flex items-center gap-2" style={{ fontWeight: 600, color: "var(--c97-ink)" }}>
                      <Flag className="h-4 w-4" aria-hidden="true" />
                      Offseason
                    </p>
                    <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)" }}>
                      The {summary.season} regular season is complete. New fixtures will appear when the next season&apos;s schedule is published.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === "leaders" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="c97-segmented" role="group" aria-label="Leader category">
                    {LEADER_TABS.map((tab) => {
                      const isActive = tab.id === activeLeaderTab;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveLeaderTab(tab.id)}
                          aria-pressed={isActive}
                          className="min-h-[44px] text-sm font-semibold"
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                  <a href={summary.sourceUrls.leaders} target="_blank" rel="noreferrer" className="c97-btn-ghost">
                    NFLverse source
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <div>
                  <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Top {activeLeaderMeta.unitLong}</p>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <NflLeaderList leaders={activeLeaders.slice(0, 5)} unit={activeLeaderMeta.unit} teamLookup={teamShortNameById} />
                    </div>
                    {activeLeaders.length > 5 && (
                      <div>
                        <NflLeaderList leaders={activeLeaders.slice(5, 10)} unit={activeLeaderMeta.unit} teamLookup={teamShortNameById} />
                      </div>
                    )}
                  </div>
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
              This page is a curated NFLverse snapshot, refreshed on a schedule. Standings come
              from the public NFLverse standings dataset, schedule and scores from the NFLverse
              games table, and stat leaders from the regular-season player stats release linked
              above.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function TeamLeaderCard({
  title,
  leader,
  unitLong,
  emptyLabel,
}: {
  title: string;
  leader?: NFLLeader;
  unitLong: string;
  emptyLabel: string;
}) {
  return (
    <div className="c97-panel">
      <p className="c97-kicker">{title}</p>
      {leader ? (
        <>
          <p className="c97-h3 c97-serif" style={{ marginTop: "var(--c97-sp-1)" }}>
            {leader.name}
            <span className="c97-kicker" style={{ marginLeft: "var(--c97-sp-2)" }}>{leader.position}</span>
          </p>
          <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)", fontSize: "var(--c97-fs-small)" }}>
            {formatLeaderTotal(leader)} {unitLong} in {leader.games} games
          </p>
          <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-1)" }}>{formatPerGame(leader.perGame)} per game</p>
        </>
      ) : (
        <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)", fontSize: "var(--c97-fs-small)" }}>{emptyLabel}</p>
      )}
    </div>
  );
}

function NflLeaderList({
  leaders,
  unit,
  teamLookup,
}: {
  leaders: NFLLeader[];
  unit: string;
  teamLookup: Map<string, string>;
}) {
  return (
    <ol className="mt-3 space-y-2 pl-0">
      {leaders.map((leader) => {
        const teamName = teamLookup.get(leader.teamId) ?? leader.teamCode;
        return (
          <li key={`${unit}-${leader.rank}-${leader.name}`} className="c97-panel flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="c97-mono" style={{ color: "var(--c97-ink-2)" }}>{leader.rank}</span>
              <div className="min-w-0">
                <p className="truncate" style={{ fontWeight: 600, color: "var(--c97-ink)" }}>
                  {leader.name}
                  <span className="c97-kicker" style={{ marginLeft: "var(--c97-sp-2)" }}>{leader.position}</span>
                </p>
                <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
                  {teamName} · {leader.games} games
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="c97-tabular" style={{ fontWeight: 700, color: "var(--c97-ink)", margin: 0 }}>{formatLeaderTotal(leader)}</p>
              <p className="c97-kicker">{unit}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

interface ConferenceSlice {
  topSeed: NFLTeamStanding | undefined;
  lastIn: NFLTeamStanding | undefined;
  firstOut: NFLTeamStanding | undefined;
}

interface ConferenceContext {
  AFC: ConferenceSlice;
  NFC: ConferenceSlice;
}

function buildConferenceContext(teams: NFLTeamStanding[], seeds: Map<string, number>): ConferenceContext {
  return {
    AFC: buildConferenceSlice(teams, "AFC", seeds),
    NFC: buildConferenceSlice(teams, "NFC", seeds),
  };
}

function buildConferenceSlice(
  teams: NFLTeamStanding[],
  conference: "AFC" | "NFC",
  seeds: Map<string, number>
): ConferenceSlice {
  const inConference = teams.filter((team) => team.conference === conference);
  const seeded = inConference
    .filter((team) => seeds.has(team.id))
    .toSorted((a, b) => (seeds.get(a.id) ?? 0) - (seeds.get(b.id) ?? 0));
  const topSeed = seeded[0];
  const lastIn = seeded.at(-1);
  const firstOut = inConference
    .filter((team) => !seeds.has(team.id))
    .toSorted((a, b) => b.winPct - a.winPct || b.pointDifferential - a.pointDifferential)[0];
  return { topSeed, lastIn, firstOut };
}

function collectLeadersForTeam(teamId: string, leaders: NFLLeaderboards) {
  return {
    passing: leaders.passing.find((leader) => leader.teamId === teamId),
    rushing: leaders.rushing.find((leader) => leader.teamId === teamId),
    receiving: leaders.receiving.find((leader) => leader.teamId === teamId),
    sacks: leaders.sacks.find((leader) => leader.teamId === teamId),
  };
}

type NflZone = "top-seed" | "division" | "wildcard" | "outside";

function getTeamZone(team: NFLTeamStanding, seeds: Map<string, number>): NflZone {
  const seed = seeds.get(team.id) ?? null;
  if (seed === 1) return "top-seed";
  if (seed !== null && team.divisionRank === 1) return "division";
  if (seed !== null) return "wildcard";
  return "outside";
}

function getZoneLabel(zone: NflZone): string {
  switch (zone) {
    case "top-seed":
      return "Top seed";
    case "division":
      return "Division winner";
    case "wildcard":
      return "Wild card";
    case "outside":
    default:
      return "Outside the picture";
  }
}

function zoneChipClass(zone: NflZone): string {
  switch (zone) {
    case "top-seed":
    case "division":
    case "wildcard":
      return "c97-chip c97-chip-positive";
    case "outside":
    default:
      return "c97-chip";
  }
}

function zoneDotColor(zone: NflZone): string {
  switch (zone) {
    case "top-seed":
    case "division":
    case "wildcard":
      return "var(--c97-positive)";
    case "outside":
    default:
      return "var(--c97-ink-2)";
  }
}

function getTeamStoryline(
  team: NFLTeamStanding,
  context: ConferenceContext,
  seeds: Map<string, number>
): string {
  const slice = context[team.conference];
  const zone = getTeamZone(team, seeds);
  const record = formatRecord(team);
  const seed = seeds.get(team.id);

  if (zone === "top-seed") {
    return `${team.shortName} hold the ${team.conference} #1 seed at ${record}, scoring ${team.pointsFor} points to ${team.pointsAgainst} allowed.`;
  }
  if (zone === "division") {
    return `${team.shortName} lead the ${team.division} at ${record} and sit at the #${seed} seed, with a ${formatDifferential(team.pointDifferential)} point differential.`;
  }
  if (zone === "wildcard") {
    return `${team.shortName} hold a wild card spot at #${seed} (${record}) and sit ${team.divisionRank}${ordinalSuffix(team.divisionRank)} in the ${team.division}.`;
  }
  if (slice.lastIn) {
    const winsBack = Math.max(0, slice.lastIn.wins - team.wins);
    return `${team.shortName} sit ${team.divisionRank}${ordinalSuffix(team.divisionRank)} in the ${team.division} at ${record}, ${winsBack === 0 ? "tied with the last team in the picture on wins" : `${winsBack} win${winsBack === 1 ? "" : "s"} short of the seventh seed`}.`;
  }
  return `${team.shortName} sit ${team.divisionRank}${ordinalSuffix(team.divisionRank)} in the ${team.division} at ${record}.`;
}

function getTeamPressurePoints(
  team: NFLTeamStanding,
  context: {
    conferenceContext: ConferenceContext;
    offenseRankByTeam: Map<string, number>;
    defenseRankByTeam: Map<string, number>;
    seeds: Map<string, number>;
  }
): string[] {
  const { conferenceContext, offenseRankByTeam, defenseRankByTeam, seeds } = context;
  const slice = conferenceContext[team.conference];
  const offenseRank = offenseRankByTeam.get(team.id) ?? 0;
  const defenseRank = defenseRankByTeam.get(team.id) ?? 0;
  const zone = getTeamZone(team, seeds);
  const seed = seeds.get(team.id);
  const points: string[] = [];

  if (zone === "top-seed") {
    points.push(
      `${team.wins}-${team.losses}${team.ties ? `-${team.ties}` : ""} for the conference's #1 seed.`,
      `${team.pointsFor} points scored, ${team.pointsAgainst} allowed (${formatDifferential(team.pointDifferential)} differential).`
    );
  } else if (zone === "division") {
    points.push(
      `Leads the ${team.division} as the #${seed} seed (${formatRecord(team)}).`,
      `${formatDifferential(team.pointDifferential)} point differential this season.`
    );
  } else if (zone === "wildcard") {
    points.push(
      `Wild card #${seed} at ${formatRecord(team)}.`,
      `${team.pointsFor} PF / ${team.pointsAgainst} PA (${formatDifferential(team.pointDifferential)}).`
    );
  } else {
    const lastInWins = slice.lastIn?.wins ?? team.wins;
    const winsBack = Math.max(0, lastInWins - team.wins);
    points.push(
      `${winsBack === 0 ? "Equal" : `${winsBack} win${winsBack === 1 ? "" : "s"} short`} on wins to the last ${team.conference} team in the picture.`,
      `${team.pointsFor} PF / ${team.pointsAgainst} PA (${formatDifferential(team.pointDifferential)}).`
    );
  }

  points.push(`Offense rank #${offenseRank}; defense rank #${defenseRank}.`);
  if (team.playoffResult) {
    points.push(`Postseason result: ${formatPlayoffResult(team.playoffResult)}.`);
  }
  return points;
}

const ORDINAL_RULES = new Intl.PluralRules("en-US", { type: "ordinal" });
const ORDINAL_SUFFIX: Partial<Record<Intl.LDMLPluralRule, string>> = { one: "st", two: "nd", few: "rd" };

function ordinalSuffix(n: number): string {
  return ORDINAL_SUFFIX[ORDINAL_RULES.select(n)] ?? "th";
}

function formatRecord(team: NFLTeamStanding): string {
  return team.ties > 0
    ? `${team.wins}-${team.losses}-${team.ties}`
    : `${team.wins}-${team.losses}`;
}

function formatDifferential(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatPerGame(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "—";
}

function formatLeaderTotal(leader: NFLLeader): string {
  if (Number.isInteger(leader.total)) {
    return leader.total.toLocaleString("en-US");
  }
  return leader.total.toFixed(1);
}

function formatPlayoffResult(result: string): string {
  switch (result) {
    case "WonSB":
      return "Super Bowl champion";
    case "LostSB":
      return "Super Bowl runner-up";
    case "LostCC":
      return "Lost conference championship";
    case "LostDV":
      return "Lost divisional round";
    case "LostWC":
      return "Lost wild card round";
    default:
      return result;
  }
}

function formatTeamFormPills(sequence: Array<"W" | "T" | "L">): Array<"W" | "D" | "L"> {
  return sequence.map((result) => (result === "T" ? "D" : result));
}
