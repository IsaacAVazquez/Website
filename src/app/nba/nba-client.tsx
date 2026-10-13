"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
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
import { SeedLadder, type LadderColumn, type LadderTeam } from "@/components/football/SeedLadderPanel";
import { formatGamesGap, seedLadder, type SeedBandSpec } from "@/components/football/seedLadder";
import { useKeepPressedInView } from "@/components/football/useKeepPressedInView";
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
import "@/components/football/sports-board.css";
import "./nba.css";

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
  { id: "league", label: "Both conferences" },
  { id: "east", label: "Eastern Conference" },
  { id: "west", label: "Western Conference" },
  { id: "playoff", label: "Playoff seeds" },
  { id: "play-in", label: "Play-in race" },
];

type NbaLadderTeam = LadderTeam & { team: NbaTeam };

/** Which bands each view prints; the conference filter is separate. */
const VIEW_BANDS: Record<NbaView, number[]> = {
  league: [0, 1, 2],
  east: [0, 1, 2],
  west: [0, 1, 2],
  playoff: [0],
  "play-in": [1],
};

const LADDER_COLUMNS: LadderColumn<NbaLadderTeam>[] = [
  {
    key: "pct",
    label: "W%",
    title: "Win percentage",
    wide: true,
    value: ({ team }) => (Number.isFinite(team.winPercent) ? team.winPercent.toFixed(3).replace(/^0/, "") : "—"),
  },
  { key: "gb", label: "GB", title: "Games back of the conference leader", value: ({ team }) => formatGamesBack(team.gamesBack) },
  { key: "l10", label: "L10", title: "Last ten games", wide: true, value: ({ team }) => team.lastTen ?? "—" },
  { key: "strk", label: "Strk", title: "Current streak", wide: true, value: ({ team }) => team.streak ?? "—" },
  {
    key: "diff",
    label: "Diff",
    title: "Point differential per game",
    wide: true,
    value: ({ team }) => formatPointDiff(perGameDifferential(team)),
  },
];

function toLadderTeams(teams: NbaTeam[], teamColors: Record<string, string | null>): NbaLadderTeam[] {
  return teams.map((team) => ({
    team,
    id: team.id,
    name: team.name,
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
  const standfirst =
    "I sort every team into the top six, the play-in, or out, and print the games between each line right on it, so the playoff picture reads in one glance.";

  const east = summary.teamsByConference.east;
  const west = summary.teamsByConference.west;
  const allTeams = useMemo<NbaTeam[]>(() => [...east, ...west], [east, west]);
  // Route-state helpers operate on the lean `summary` data the server already
  // sent, so the full nbaSnapshot never enters the client bundle.
  const aliasMap = useMemo(() => buildTeamAliasMap(allTeams), [allTeams]);
  const defaultState = useMemo(() => resolveDefaultState(east, west), [east, west]);
  const teamById = useMemo(() => new Map(allTeams.map((team) => [team.id, team])), [allTeams]);
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

  // The URL alone is the state. The page keeps the props of the last render
  // the server sent, so after Back `initialState` can still name the team or
  // the view the visitor just left.
  const linkedState = normalizeState(searchParams, defaultState, aliasMap);
  // A link that names a team outside its view (a West team on the default
  // East view) opens that team in its own conference, the way a pick does.
  // Until 2026-10-09 the team was dropped and the URL rewritten without it.
  const linkedTeam = teamById.get(linkedState.team);
  // Only a link that names a team moves the view; a bare ?view= fills in the
  // view's own first team instead of the default one, which may sit outside it.
  const routeState: NbaRouteState =
    searchParams.get("team") !== null &&
    linkedTeam &&
    !filterTeams(east, west, linkedState.view).some((team) => team.id === linkedTeam.id)
      ? { ...linkedState, view: linkedTeam.conference }
      : linkedState;
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
    // The server loads the team its own state names, which a bare ?view= link
    // leaves on the default team while the page selects the view's first.
    { id: initialState.team, snapshot: initialTeamSnapshot },
    "Unable to load team snapshot."
  );
  const [activeDetailTab, setActiveDetailTab] = useState<"schedule" | "leaders">("schedule");
  // The team drawer is its own state, because every view writes its first
  // team into ?team= and the URL alone cannot say a team was opened. It starts
  // open only for a link to a team other than the view's first, and after
  // that only `handleTeamChange` opens it. It holds the team that was asked
  // for and waits for the route to reach it, so it never shows the last one.
  const [drawerTeamId, setDrawerTeamId] = useState<string | null>(() =>
    searchParams.get("team") !== null &&
    selectedTeamId !== getDefaultTeam(east, west, routeState.view, defaultState.team)
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

  const pushHref = useRouteSync(NBA_ROUTE, desiredHref);
  const switchRef = useRef<HTMLDivElement>(null);
  useKeepPressedInView(switchRef, routeState.view);

  function navigate(nextState: NbaRouteState) {
    const href = buildHref(nextState, defaultState, aliasMap, searchParams);
    pushHref(href);
  }

  function handleViewChange(view: NbaView) {
    // Back closes a drawer without clearing it, and the next view's first
    // team can be the one it held.
    setDrawerTeamId(null);
    const nextTeams = filterTeams(east, west, view);
    const nextTeam = nextTeams.some((team) => team.id === selectedTeamId)
      ? selectedTeamId
      : nextTeams[0]?.id ?? defaultState.team;
    navigate({ view, team: nextTeam });
  }

  function handleTeamChange(teamId: string) {
    const team = canonicalizeTeamId(teamId, aliasMap) ?? defaultState.team;
    // A schedule card can name a team the current view leaves out, so that
    // team opens in its own conference, where it can be selected.
    const view = visibleTeams.some((visible) => visible.id === team)
      ? routeState.view
      : teamById.get(team)?.conference ?? routeState.view;
    setDrawerTeamId(team);
    navigate({ view, team });
  }

  const isFinal = allTeams.length > 0 && allTeams.every((team) => team.gamesPlayed >= REGULAR_SEASON_GAMES);
  const statusMeta = `${summary.sourceLabel} · Season ${summary.season}${
    isFinal ? " · final regular season standings" : ""
  } · ${allTeams.length} teams · snapshot ${snapshotDateLabel}`;
  const hasGames = summary.recentFixtures.length > 0 || summary.upcomingFixtures.length > 0;
  const isOffSeason = isFinal && summary.upcomingFixtures.length === 0;

  const titleRow = (
    <div className="sb-titlebar">
      <h1 className="sb-title">NBA Pulse</h1>
      <p className="sb-standfirst">{standfirst}</p>
      <p className="sb-status">
        <span className="sb-state" data-state={isOffSeason ? "off" : isFinal ? "final" : "live"}>
          {isOffSeason ? "Off-season" : isFinal ? "Final" : "In season"}
        </span>
        <span>{statusMeta}</span>
      </p>
      {isOffSeason ? (
        <p className="sb-status">
          The {summary.season} regular season is over, so this is the final table. Standings, the schedule, and
          the leaders pick up again once the new season tips off.
        </p>
      ) : null}
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

  const showsEast = routeState.view !== "west";
  const showsWest = routeState.view !== "east";
  const visibleBands = VIEW_BANDS[routeState.view];
  const conferences = [
    ...(showsEast ? [{ id: "nba-east", label: "Eastern Conference", ladder: eastLadder }] : []),
    ...(showsWest ? [{ id: "nba-west", label: "Western Conference", ladder: westLadder }] : []),
  ];

  const conferenceTeams = selectedTeam.conference === "east" ? east : west;
  const conferenceContext = buildConferenceContext(conferenceTeams);
  const selectedZone = getTeamZone(selectedTeam.conferenceSeed);
  const teamRanks = {
    offense: offenseRankByTeam.get(selectedTeam.id) ?? selectedTeam.position,
    defense: defenseRankByTeam.get(selectedTeam.id) ?? selectedTeam.position,
  };
  const teamStoryline = getTeamStoryline(selectedTeam, conferenceContext);
  const formSequence = teamSnapshot?.form?.sequence ?? [];
  const recentFixtures = (teamSnapshot?.recentFixtures ?? []).slice(0, 3);
  const upcomingFixtures = (teamSnapshot?.upcomingFixtures ?? []).slice(0, 3);
  const remainingGames = Math.max(0, REGULAR_SEASON_GAMES - selectedTeam.gamesPlayed);
  const stageLabel = (fixture: { stage?: string | null }) => fixture.stage || "Regular season";

  return (
    <Root>
      {titleRow}

      <section className="sb-board" aria-label="NBA standings">
        <div className="sb-toolbar">
          <h2 className="sb-h2">Standings</h2>
          <div ref={switchRef} role="group" aria-label="Conference and seeding view" className="sb-switch">
            {viewOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleViewChange(option.id)}
                aria-pressed={option.id === routeState.view}
              >
                {option.label} <span className="sb-switch-count">{filterTeams(east, west, option.id).length}</span>
              </button>
            ))}
          </div>
        </div>

        <SeedLadder
          conferences={conferences}
          columns={LADDER_COLUMNS}
          lineLabels={["Playoff line", "Play-in line"]}
          // Marked only while the drawer shows it, since nothing else on the page does.
          selectedId={isDrawerOpen ? selectedTeam.id : null}
          onSelect={handleTeamChange}
          isBandVisible={(index) => visibleBands.includes(index)}
        />
      </section>

      <section className="sb-detail" aria-labelledby="nba-detail-heading">
        <div className="sb-toolbar">
          <h2 id="nba-detail-heading" className="sb-h2">
            Games and leaders
          </h2>
          <SegmentedTabs
            tabs={[
              { id: "schedule", label: "Schedule" },
              { id: "leaders", label: "Stat leaders" },
            ]}
            activeId={activeDetailTab}
            onChange={(id) => setActiveDetailTab(id as "schedule" | "leaders")}
            ariaLabel="Team and league details"
            idPrefix="nba-detail-tab"
            panelId="nba-detail-panel"
            className="sb-switch"
          />
        </div>

        <div id="nba-detail-panel" role="tabpanel" aria-labelledby={`nba-detail-tab-${activeDetailTab}`}>
          {activeDetailTab === "schedule" ? (
            hasGames ? (
              <div className="sb-pair">
                <div>
                  <h3 className="sb-h3">Latest results</h3>
                  <FixtureLedgerSection
                    groups={groupFixtures(summary.recentFixtures, stageLabel)}
                    onOpenTeam={handleTeamChange}
                    emptyLabel="No results are in this snapshot."
                  />
                </div>
                <div>
                  <h3 className="sb-h3">Upcoming games</h3>
                  <FixtureLedgerSection
                    groups={groupFixtures(summary.upcomingFixtures, stageLabel)}
                    onOpenTeam={handleTeamChange}
                    emptyLabel={
                      isFinal
                        ? "No games until the next season's schedule is published."
                        : "No upcoming games are in this snapshot."
                    }
                  />
                </div>
              </div>
            ) : (
              <p className="sb-muted">
                No games are on the schedule right now. Recent results and upcoming matchups will appear here once
                the next snapshot is published.
              </p>
            )
          ) : (
            <div className="sb-detail-leaders">
              <div className="sb-trio">
                <LeaderLedger title="Points per game" unit="ppg" entries={toLedgerEntries(summary.scorers)} />
                <LeaderLedger title="Rebounds per game" unit="rpg" entries={toLedgerEntries(summary.rebounders)} />
                <LeaderLedger title="Assists per game" unit="apg" entries={toLedgerEntries(summary.assistLeaders)} />
              </div>
              <a href={summary.sourceUrls.leaders} target="_blank" rel="noreferrer" className="sb-link">
                {summary.sourceLabel} stats
                <span className="sr-only"> (opens in a new tab)</span>
                <ExternalLink className="sb-link-icon" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </section>

      <p className="sb-source">
        Standings, scores, and stat leaders come from ESPN&apos;s public NBA endpoints, checked in as a snapshot that
        refreshes on a schedule, so nothing here is live.
      </p>

      <DetailDrawer
        open={isDrawerOpen}
        title={selectedTeam.name}
        lead={<CrestAvatar crest={logoByTeamId.get(selectedTeam.id) ?? null} name={selectedTeam.name} size="md" />}
        onClose={() => setDrawerTeamId(null)}
        resetKey={selectedTeam.id}
        testId="nba-selected-team"
      >
        <p className="dd-tags">
          <span>{getZoneLabel(selectedZone)}</span>
          <span>Seed {selectedTeam.conferenceSeed}</span>
          <span>{selectedTeam.wins}-{selectedTeam.losses}</span>
          <span>{remainingGames} left</span>
        </p>

        <dl className="dd-stats dd-section">
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
              ["Diff/g", formatPointDiff(perGameDifferential(selectedTeam))],
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
            <p className="dd-label">Form</p>
            <div className="dd-form">
              {formSequence.slice(-5).map((result, i) => (
                <TeamResultPill key={i} result={result} />
              ))}
            </div>
          </div>
        ) : null}

        <p className="dd-note">{teamStoryline}</p>

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
    <div className="sb-root nba-root">
      <div className="c97-shell c97-frame sb-column">{children}</div>
    </div>
  );
}

/** The per-game average, since the leaders are listed per game, not as season totals. */
function toLedgerEntries(leaders: NbaLeader[]): LeaderLedgerEntry[] {
  return leaders.slice(0, 5).map((leader) => ({
    rank: leader.rank,
    name: leader.name,
    clubCode: leader.teamAbbreviation,
    value: Number.isFinite(leader.perGame) ? leader.perGame.toFixed(1) : "—",
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

/**
 * How far `ahead` sits over `behind` as the ladder's lines print it, from wins
 * and losses both, so teams that have played uneven schedules compare fairly.
 * Null when either seed is missing.
 */
function gamesBetween(ahead: NbaTeam | undefined, behind: NbaTeam | undefined): string | null {
  if (!ahead || !behind) return null;
  const gap = (ahead.wins - behind.wins + (behind.losses - ahead.losses)) / 2;
  // formatGamesGap prints a level pair as "Tied", which does not fit a sentence.
  return gap === 0 ? "0 games" : formatGamesGap(gap);
}

function getTeamStoryline(team: NbaTeam, context: ConferenceContext): string {
  const { topSeed, sixthSeed, seventhSeed, tenthSeed, eleventhSeed } = context;
  const seed = team.conferenceSeed;
  if (!topSeed) return `${team.shortName} are still building their conference resume.`;
  if (seed === 1) {
    const margin = gamesBetween(team, seventhSeed);
    return `${team.shortName} hold the conference's top seed${
      margin !== null ? ` and sit ${margin} clear of the play-in cutoff` : ""
    }.`;
  }
  if (seed <= 6) {
    const aheadOfPlayIn = gamesBetween(team, seventhSeed);
    return `${team.shortName} are locked into a playoff seed${
      aheadOfPlayIn !== null ? ` with a cushion of ${aheadOfPlayIn} over the play-in line` : ""
    }.`;
  }
  if (seed <= 10) {
    const behindPlayoff = gamesBetween(sixthSeed, team);
    const aheadOfLottery = gamesBetween(team, eleventhSeed);
    return `${team.shortName} are in the play-in${
      behindPlayoff !== null ? `, ${behindPlayoff} back of a top-six seed` : ""
    }${aheadOfLottery !== null ? ` and ${aheadOfLottery} clear of the lottery` : ""}.`;
  }
  const behindPlayIn = gamesBetween(tenthSeed, team);
  return `${team.shortName} are outside the play-in${
    behindPlayIn !== null ? ` and ${behindPlayIn} short of the tenth seed` : ""
  }.`;
}
