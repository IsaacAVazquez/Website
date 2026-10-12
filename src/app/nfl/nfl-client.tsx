"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { DATE_ONLY_TIME_ZONE } from "@/lib/date-formatters";
import { CrestAvatar } from "@/components/football/CrestAvatar";
import { TeamResultPill } from "@/components/football/TeamResultPill";
import { FixtureLedgerSection } from "@/components/football/FixtureLedger";
import { LeaderLedger, type LeaderLedgerEntry } from "@/components/football/LeaderLedger";
import { SegmentedTabs } from "@/components/football/SegmentedTabs";
import { groupFixtures } from "@/components/football/fixtureGroups";
// Imported by path. The football barrel ships whatever it re-exports to every
// route that reads it, and the two league pages do not use this drawer.
import { DetailDrawer } from "@/components/football/DetailDrawer";
import { formatRank } from "@/components/football/fixtureFormat";
import { SeedLadder, type LadderColumn, type LadderTeam } from "@/components/football/SeedLadderPanel";
import { seedLadder, nflSeeds, type SeedBandSpec } from "@/components/football/seedLadder";
import { NflDivisionGrid, type DivisionGridGroup } from "./NflDivisionGrid";
import "@/components/football/sports-board.css";
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

const PLAYOFF_ROUND_LABELS: Record<string, string> = {
  WC: "Wild Card round",
  DIV: "Divisional round",
  CON: "Conference championships",
  SB: "Super Bowl",
};

const VIEW_OPTIONS: Array<{ id: NFLView; label: string }> = [
  { id: "league", label: "Both conferences" },
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

type NflLadderTeam = LadderTeam & { team: NFLTeamStanding; seeded: boolean };

const LADDER_COLUMNS: LadderColumn<NflLadderTeam>[] = [
  { key: "pct", label: "Pct", title: "Win percentage", wide: true, value: ({ team }) => team.winPct.toFixed(3).replace(/^0/, "") },
  { key: "pf", label: "PF", title: "Points for", wide: true, value: ({ team }) => String(team.pointsFor) },
  { key: "pa", label: "PA", title: "Points against", wide: true, value: ({ team }) => String(team.pointsAgainst) },
  { key: "diff", label: "Diff", title: "Point differential", value: ({ team }) => formatDifferential(team.pointDifferential) },
];

/**
 * The NFL only has a real seed for the top seven per conference; everyone
 * else gets a stable tiebreak order (win pct, then point differential) so
 * the "first team out" in the gap calculation is the actual closest team,
 * not an arbitrary one. The ladder prints that order but never as a seed.
 */
function toLadderTeams(
  teams: NFLTeamStanding[],
  seeds: Map<string, number>,
  optionsById: Map<string, NFLTeamOption>
): NflLadderTeam[] {
  const unseededByTiebreak = teams
    .filter((team) => !seeds.has(team.id))
    .toSorted((a, b) => b.winPct - a.winPct || b.pointDifferential - a.pointDifferential);
  const outOrder = new Map(unseededByTiebreak.map((team, index) => [team.id, 8 + index] as const));

  return teams.map((team) => ({
    team,
    seeded: seeds.has(team.id),
    id: team.id,
    name: team.name,
    seed: seeds.get(team.id) ?? outOrder.get(team.id) ?? 99,
    wins: team.wins,
    losses: team.losses,
    ties: team.ties,
    shortName: team.shortName,
    record: formatRecord(team),
    color: optionsById.get(team.id)?.primaryColor ?? null,
  }));
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
        name: team.name,
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
  const standfirst =
    "I draw the playoff picture as it would stand if the season ended today, the four division leaders first and then the three best of the rest, with the line where the field ends.";

  const teams = summary.teams;
  const aliasMap = useMemo(() => buildTeamAliasMap(summary.teams), [summary.teams]);
  const defaultState = useMemo(() => resolveDefaultState(summary.teams), [summary.teams]);
  const teamById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
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
  const divisionGroups = useMemo(() => buildDivisionGroups(teams, optionsById), [teams, optionsById]);

  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("team") !== null;
  const linkedState = hasManagedParams
    ? normalizeState(searchParams, defaultState, aliasMap)
    : initialState;
  // A link that names a team outside its view (an NFC team on the AFC view)
  // opens that team in the full league, the way a schedule card's pick does.
  // Until 2026-10-09 the team was dropped and the URL rewritten without it.
  // Only a link that names a team moves the view; a bare ?view= fills in the
  // view's own first team instead of the default one, which may sit outside it.
  const routeState: NFLRouteState =
    searchParams.get("team") !== null &&
    teamById.has(linkedState.team) &&
    !filterTeams(summary.teams, linkedState.view).some((team) => team.id === linkedState.team)
      ? { ...linkedState, view: defaultState.view }
      : linkedState;
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
  // The team drawer is its own state, because every view writes its first
  // team into ?team= and the URL alone cannot say a team was opened. It starts
  // open only for a link to a team other than the view's first, and after
  // that only `handleTeamChange` opens it. It holds the team that was asked
  // for and waits for the route to reach it, so it never shows the last one.
  const [drawerTeamId, setDrawerTeamId] = useState<string | null>(() =>
    searchParams.get("team") !== null &&
    selectedTeamId !== getDefaultTeam(summary.teams, routeState.view, defaultState.team)
      ? selectedTeamId
      : null
  );
  const isDrawerOpen = drawerTeamId !== null && drawerTeamId === selectedTeamId;
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
    const team = canonicalizeTeamId(teamId, aliasMap) ?? defaultState.team;
    // A schedule card can name a team the current view leaves out, so that
    // team opens in the full league, where it can be selected.
    const view = visibleTeams.some((visible) => visible.id === team)
      ? routeState.view
      : defaultState.view;
    setDrawerTeamId(team);
    navigate({ view, team });
  }

  const conferenceContext = useMemo(() => buildConferenceContext(teams, seeds), [teams, seeds]);

  const [activeDetailTab, setActiveDetailTab] = useState<"fixtures" | "leaders">("fixtures");
  const [activeLeaderTab, setActiveLeaderTab] = useState<LeaderCategory>("passing");

  const totalRegSeasonWeeks = 18;
  const isFinal = summary.week >= totalRegSeasonWeeks && summary.upcomingFixtures.length === 0;
  const statusMeta = `${summary.sourceLabel} · Season ${summary.season} · ${
    summary.week ? `through week ${summary.week} of ${totalRegSeasonWeeks}` : "week 1 in progress"
  } · snapshot ${snapshotDateLabel}`;

  const titleRow = (
    <div className="sb-titlebar">
      <h1 className="sb-title">NFL Pulse</h1>
      <p className="sb-standfirst">{standfirst}</p>
      <p className="sb-status">
        <span className="sb-state" data-state={isFinal ? "final" : "live"}>
          {isFinal ? "Regular season over" : "If the season ended today"}
        </span>
        <span>{statusMeta}</span>
      </p>
      <p className="sb-status">
        The snapshot carries no seeds, so these come from each team&apos;s division rank and conference rank.
      </p>
    </div>
  );

  if (!selectedTeam) {
    return (
      <Root>
        {titleRow}
        <p className="sb-muted">
          Conference standings, playoff seeding, and stat leaders will appear here once the next snapshot is
          published.
        </p>
      </Root>
    );
  }

  const teamStoryline = getTeamStoryline(selectedTeam, conferenceContext, seeds);
  const selectedZone = getTeamZone(selectedTeam, seeds);
  const selectedSeed = seeds.get(selectedTeam.id) ?? null;
  const formSequence = teamSnapshot?.form?.sequence ?? [];
  const recentFixtures = (teamSnapshot?.recentFixtures ?? []).slice(0, 3);
  const upcomingFixtures = (teamSnapshot?.upcomingFixtures ?? []).slice(0, 3);
  const activeLeaderMeta = LEADER_TABS.find((tab) => tab.id === activeLeaderTab) ?? LEADER_TABS[0];
  const activeLeaders = summary.leaders[activeLeaderTab] ?? [];
  // nflverse numbers the playoff rounds as weeks 19 to 22, so the label keys
  // off the game type and only a regular-season game prints its week.
  const weekLabel = (fixture: { matchday: number | null; gameType?: string | null }) =>
    PLAYOFF_ROUND_LABELS[fixture.gameType ?? ""] ??
    (fixture.matchday ? `Week ${fixture.matchday}` : "Unscheduled");
  const conferences = [
    ...(routeState.view !== "nfc" ? [{ id: "nfl-afc", label: "AFC", ladder: afcLadder }] : []),
    ...(routeState.view !== "afc" ? [{ id: "nfl-nfc", label: "NFC", ladder: nfcLadder }] : []),
  ];

  return (
    <Root>
      {titleRow}

      <section className="sb-board" aria-label="NFL standings">
        <div className="sb-toolbar">
          <h2 className="sb-h2">Standings</h2>
          <div role="group" aria-label="Conference and seeding view" className="sb-switch">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleViewChange(option.id)}
                aria-pressed={option.id === routeState.view}
              >
                {option.label} <span className="sb-switch-count">{filterTeams(summary.teams, option.id).length}</span>
              </button>
            ))}
          </div>
        </div>

        <SeedLadder
          conferences={conferences}
          columns={LADDER_COLUMNS}
          lineLabels={["Playoff line"]}
          selectedId={selectedTeam.id}
          onSelect={handleTeamChange}
          isBandVisible={(index) => routeState.view !== "playoffs" || index === 0}
          seedLabel={(team) => (team.seeded ? String(team.seed) : "–")}
        />
      </section>

      <section className="sb-board-second" aria-labelledby="nfl-divisions-heading">
        <div className="sb-toolbar">
          <h2 id="nfl-divisions-heading" className="sb-h2">
            Divisions
          </h2>
          <p className="sb-muted">Each team is striped in its own colours, and the division leaders are marked.</p>
        </div>
        <NflDivisionGrid divisions={divisionGroups} selectedId={selectedTeam.id} onSelect={handleTeamChange} />
      </section>

      <section className="sb-detail" aria-labelledby="nfl-detail-heading">
        <div className="sb-toolbar">
          <h2 id="nfl-detail-heading" className="sb-h2">
            Games and leaders
          </h2>
          <SegmentedTabs
            tabs={[
              { id: "fixtures", label: "Schedule" },
              { id: "leaders", label: "Stat leaders" },
            ]}
            activeId={activeDetailTab}
            onChange={(id) => setActiveDetailTab(id as "fixtures" | "leaders")}
            ariaLabel="Team and league details"
            idPrefix="nfl-detail-tab"
            panelId="nfl-detail-panel"
            className="sb-switch"
          />
        </div>

        <div id="nfl-detail-panel" role="tabpanel" aria-labelledby={`nfl-detail-tab-${activeDetailTab}`}>
          {activeDetailTab === "fixtures" ? (
            <div className="sb-pair">
              <div>
                <h3 className="sb-h3">Latest results</h3>
                <FixtureLedgerSection
                  groups={groupFixtures(summary.recentFixtures, weekLabel)}
                  onOpenTeam={handleTeamChange}
                  emptyLabel="No results are in this snapshot yet."
                />
              </div>
              <div>
                <h3 className="sb-h3">Upcoming games</h3>
                <FixtureLedgerSection
                  groups={groupFixtures(summary.upcomingFixtures, weekLabel)}
                  onOpenTeam={handleTeamChange}
                  // An empty list mid-season is a snapshot gap, so only the last
                  // regular-season week calls the season complete.
                  emptyLabel={
                    summary.week >= totalRegSeasonWeeks
                      ? `The ${summary.season} regular season is complete. New fixtures will appear when the next season's schedule is published.`
                      : "No upcoming games are in this snapshot. They will appear after the next scheduled refresh."
                  }
                />
              </div>
            </div>
          ) : (
            <div className="sb-detail-leaders">
              <div className="sb-switch" role="group" aria-label="Leader category">
                {LEADER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveLeaderTab(tab.id)}
                    aria-pressed={tab.id === activeLeaderTab}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="sb-pair">
                <LeaderLedger
                  title={`Top ${activeLeaderMeta.unitLong}`}
                  unit={activeLeaderMeta.unit}
                  entries={toLedgerEntries(activeLeaders.slice(0, 5))}
                  emptyLabel="No leaders are in this snapshot yet."
                />
                {activeLeaders.length > 5 ? (
                  <LeaderLedger
                    title="Sixth to tenth"
                    unit={activeLeaderMeta.unit}
                    entries={toLedgerEntries(activeLeaders.slice(5, 10))}
                  />
                ) : null}
              </div>
              <a href={summary.sourceUrls.leaders} target="_blank" rel="noreferrer" className="sb-link">
                NFLverse source
                <span className="sr-only"> (opens in a new tab)</span>
                <ExternalLink className="sb-link-icon" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </section>

      <p className="sb-source">
        Standings come from the public NFLverse standings dataset, scores from its games table, and the leaders
        from its regular-season player stats release, checked in as a snapshot that refreshes on a schedule.
      </p>

      <DetailDrawer
        open={isDrawerOpen}
        title={selectedTeam.name}
        lead={<CrestAvatar crest={logoByTeamId.get(selectedTeam.id) ?? null} name={selectedTeam.name} size="md" />}
        onClose={() => setDrawerTeamId(null)}
        resetKey={selectedTeam.id}
        testId="nfl-selected-team"
      >
        <p className="dd-tags">
          <span>{getZoneLabel(selectedZone)}</span>
          <span>Seed {selectedSeed ?? "–"}</span>
          <span>{formatRecord(selectedTeam)}</span>
          <span>{selectedTeam.division}</span>
        </p>

        <dl className="dd-stats dd-section">
          {(
            [
              ["Win %", selectedTeam.winPct.toFixed(3).replace(/^0/, "")],
              ["Diff", formatDifferential(selectedTeam.pointDifferential)],
              ["Points for", `${selectedTeam.pointsFor}`],
              ["Points against", `${selectedTeam.pointsAgainst}`],
              ["Offense", formatRank(offenseRankByTeam.get(selectedTeam.id))],
              ["Defense", formatRank(defenseRankByTeam.get(selectedTeam.id))],
              [
                "PF / game",
                formatPerGame(
                  selectedTeam.pointsFor / Math.max(1, selectedTeam.wins + selectedTeam.losses + selectedTeam.ties)
                ),
              ],
              [
                "PA / game",
                formatPerGame(
                  selectedTeam.pointsAgainst / Math.max(1, selectedTeam.wins + selectedTeam.losses + selectedTeam.ties)
                ),
              ],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        {formSequence.length > 0 ? (
          <div className="dd-section">
            <p className="dd-label">Form (last 5)</p>
            <div className="dd-form">
              {formatTeamFormPills(formSequence.slice(-5)).map((result, i) => (
                <TeamResultPill key={i} result={result} />
              ))}
            </div>
          </div>
        ) : null}

        <p className="dd-note">{teamStoryline}</p>
        {selectedTeam.playoffResult ? (
          <p className="dd-note">Postseason result: {formatPlayoffResult(selectedTeam.playoffResult)}.</p>
        ) : null}

        {recentFixtures.length > 0 || upcomingFixtures.length > 0 ? (
          <div className="dd-section sb-games">
            <FixtureLedgerSection
              groups={[
                ...(recentFixtures.length > 0 ? [{ key: "recent", label: "Recent results", fixtures: recentFixtures }] : []),
                ...(upcomingFixtures.length > 0 ? [{ key: "upcoming", label: "Upcoming games", fixtures: upcomingFixtures }] : []),
              ]}
            />
          </div>
        ) : null}

        {!teamSnapshot && (isTeamSnapshotLoading || teamSnapshotError) ? (
          <p className="dd-note" role={teamSnapshotError ? "alert" : "status"} aria-live="polite">
            {isTeamSnapshotLoading ? "Loading team snapshot…" : teamSnapshotError}
          </p>
        ) : null}
      </DetailDrawer>
    </Root>
  );
}

/** The route's root and its one centred column. */
function Root({ children }: { children: ReactNode }) {
  return (
    <div className="sb-root nfl-root">
      <div className="c97-shell c97-frame sb-column">{children}</div>
    </div>
  );
}

function toLedgerEntries(leaders: NFLLeader[]): LeaderLedgerEntry[] {
  return leaders.map((leader) => ({
    rank: leader.rank,
    name: `${leader.name} (${leader.position})`,
    clubCode: leader.teamCode,
    value: formatLeaderTotal(leader),
  }));
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
