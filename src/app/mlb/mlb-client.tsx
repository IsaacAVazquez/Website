"use client";

import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { DATE_ONLY_TIME_ZONE } from "@/lib/date-formatters";
import { CrestAvatar } from "@/components/football/CrestAvatar";
import { TeamResultPill } from "@/components/football/TeamResultPill";
import { FixtureLedgerSection } from "@/components/football/FixtureLedger";
import { LeaderLedger, type LeaderLedgerEntry } from "@/components/football/LeaderLedger";
import { SegmentedTabs } from "@/components/football/SegmentedTabs";
import { groupFixtures } from "@/components/football/fixtureGroups";
import { useKeepPressedInView } from "@/components/football/useKeepPressedInView";
// Imported by path. The football barrel ships whatever it re-exports to every
// route that reads it, and the two league pages do not use this drawer.
import { DetailDrawer } from "@/components/football/DetailDrawer";
import type {
  MlbHittingLeaders,
  MlbLeader,
  MlbPitchingLeaders,
  MlbRouteState,
  MlbStandingsRow,
  MlbSummarySnapshot,
  MlbTeamSnapshot,
  MlbView,
} from "@/types/mlb";
import {
  buildHref,
  buildTeamAliasMap,
  canonicalizeTeamId,
  filterStandings,
  getDefaultTeam,
  MLB_ROUTE,
  normalizeState,
  resolveDefaultState,
} from "./mlb-state.core";
import { divisionBoard, wildCardBoard } from "./scoreboard";
import { MlbScoreboard } from "./MlbScoreboard";
import "@/components/football/sports-board.css";
import "./mlb.css";
import { useRouteSync } from "@/hooks/useRouteSync";
import { useCachedSnapshot } from "@/hooks/useCachedSnapshot";
import { formatFixed, formatRank } from "@/components/football/fixtureFormat";

interface MlbClientProps {
  initialState: MlbRouteState;
  summary: MlbSummarySnapshot;
  initialTeamSnapshot: MlbTeamSnapshot | null;
}

type DetailTab = "games" | "leaders";

const viewOptions: Array<{ id: MlbView; label: string }> = [
  { id: "all", label: "All divisions" },
  { id: "al", label: "American League" },
  { id: "nl", label: "National League" },
  { id: "wildcard", label: "Wild card" },
];

// Keyed by the API's gameType, which the snapshot carries as `stage`.
const postseasonRoundLabels: Record<string, string> = {
  F: "Wild Card Series",
  D: "Division Series",
  L: "League Championship Series",
  W: "World Series",
};

// The rest of the API's gameType codes, so a spring training or All-Star
// game never groups under the regular season.
const otherGameLabels: Record<string, string> = {
  R: "Regular season",
  S: "Spring training",
  E: "Exhibition",
  A: "All-Star Game",
};

/** Joins the summary's clauses as "a, b, and c", and reads right with one or two. */
const SUMMARY_CLAUSES = new Intl.ListFormat("en-US", { type: "conjunction" });

function formatGamesBack(games: number) {
  if (!Number.isFinite(games) || games <= 0) return "—";
  return `${games.toFixed(1)} GB`;
}

function formatRecord(row: MlbStandingsRow) {
  return `${row.wins}-${row.losses}`;
}

/** The box score's precision: an average without its leading zero, an ERA to two places, a count whole. */
function formatLeaderTotal(total: number, statLabel: string): string | number {
  if (statLabel === "AVG") return formatFixed(total, 3).replace(/^0\./, ".");
  if (statLabel === "ERA") return formatFixed(total, 2);
  return Math.round(total);
}

/** The top five places, so players tied for fifth all print. */
function leadersToEntries(leaders: MlbLeader[], statLabel: string): LeaderLedgerEntry[] {
  return leaders.filter((leader) => leader.rank <= 5).map((leader) => ({
    rank: leader.rank,
    name: leader.name,
    clubCode: leader.teamCode,
    value: formatLeaderTotal(leader.total, statLabel),
  }));
}

export function MlbClient({ initialState, summary, initialTeamSnapshot }: MlbClientProps) {
  const searchParams = useSearchParams();

  const standings = summary.standings;
  // Route-state helpers operate on the lean `summary` data the server already
  // sent, so the full mlbSnapshot never enters the client bundle.
  const aliasMap = useMemo(() => buildTeamAliasMap(summary.teams), [summary.teams]);
  const defaultState = useMemo(
    () => resolveDefaultState(standings, summary.teams),
    [standings, summary.teams]
  );
  const teamLookup = useMemo(
    () => new Map(summary.teams.map((team) => [team.id, team])),
    [summary.teams]
  );
  const standingsById = useMemo(
    () => new Map(standings.map((row) => [row.id, row])),
    [standings]
  );
  const logoByTeamId = useMemo(
    () => new Map(summary.teams.map((team) => [team.id, team.logo])),
    [summary.teams]
  );

  const offenseRankByTeam = useMemo(
    () =>
      new Map(
        [...standings]
          .sort(
            (a, b) =>
              b.runsScored - a.runsScored ||
              a.divisionRank - b.divisionRank
          )
          .map((row, idx) => [row.id, idx + 1] as const)
      ),
    [standings]
  );
  const defenseRankByTeam = useMemo(
    () =>
      new Map(
        [...standings]
          .sort(
            (a, b) =>
              a.runsAllowed - b.runsAllowed ||
              a.divisionRank - b.divisionRank
          )
          .map((row, idx) => [row.id, idx + 1] as const)
      ),
    [standings]
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

  // The URL alone says which view and team are showing, and a bare one is the
  // default state. `initialState` belongs to whichever URL the server rendered
  // last, and after Back that is the page being left.
  const linkedState = normalizeState(searchParams, defaultState, aliasMap);
  // A link that names a team outside its view (an NL club on the AL view)
  // opens that team in the full league, the way a game card's pick does.
  // Until 2026-10-09 the team was dropped and the URL rewritten without it.
  // Only a link that names a team moves the view; a bare ?view= fills in the
  // view's own first team instead of the default one, which may sit outside it.
  const routeState: MlbRouteState =
    searchParams.get("team") !== null &&
    standingsById.has(linkedState.team) &&
    !filterStandings(standings, linkedState.view).some((row) => row.id === linkedState.team)
      ? { ...linkedState, view: defaultState.view }
      : linkedState;
  const visibleStandings = filterStandings(standings, routeState.view);
  const selectedTeamId = visibleStandings.some((row) => row.id === routeState.team)
    ? routeState.team
    : getDefaultTeam(standings, routeState.view, defaultState.team);
  const selectedRow = standingsById.get(selectedTeamId) ?? standings[0];
  const selectedTeam = teamLookup.get(selectedRow?.id ?? "") ?? null;

  const {
    snapshot: teamSnapshot,
    isLoading: isTeamSnapshotLoading,
    error: teamSnapshotError,
  } = useCachedSnapshot<MlbTeamSnapshot>(
    "/api/mlb/teams",
    selectedRow?.id ?? null,
    // Keyed by the team the server loaded, which a bare ?view= link leaves
    // on the default team while the view selects its own first team.
    { id: initialState.team, snapshot: initialTeamSnapshot },
    "Unable to load team snapshot."
  );
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>("games");
  // The team drawer is its own state, because every view writes its first
  // team into ?team= and the URL alone cannot say a team was opened. It starts
  // open only for a link to a team other than the view's first, and after
  // that only `handleTeamChange` opens it. It holds the team that was asked
  // for and waits for the route to reach it, so it never shows the last one.
  const [drawerTeamId, setDrawerTeamId] = useState<string | null>(() =>
    searchParams.get("team") !== null &&
    selectedTeamId !== getDefaultTeam(standings, routeState.view, defaultState.team)
      ? selectedTeamId
      : null
  );
  const isDrawerOpen = drawerTeamId !== null && drawerTeamId === selectedTeamId;
  const switchRef = useRef<HTMLDivElement>(null);
  useKeepPressedInView(switchRef, routeState.view);

  const desiredHref = buildHref(
    { view: routeState.view, team: selectedTeamId },
    defaultState,
    aliasMap,
    searchParams
  );

  const pushHref = useRouteSync(MLB_ROUTE, desiredHref);

  function navigate(nextState: MlbRouteState) {
    const href = buildHref(nextState, defaultState, aliasMap, searchParams);
    pushHref(href);
  }

  function handleViewChange(view: MlbView) {
    // A drawer that Back closed still holds its team, and the next view's
    // first team can be that one, so a view switch never reopens it.
    setDrawerTeamId(null);
    const next = filterStandings(standings, view);
    const nextTeam = next.some((row) => row.id === selectedTeamId)
      ? selectedTeamId
      : next[0]?.id ?? defaultState.team;
    navigate({ view, team: nextTeam });
  }

  // A bracket placeholder such as "NL Champion" is no club, so the games
  // ledger prints it as plain text and it opens nothing.
  const isClub = (teamId: string) => standingsById.has(canonicalizeTeamId(teamId, aliasMap) ?? "");

  function handleTeamChange(teamId: string) {
    const team = canonicalizeTeamId(teamId, aliasMap);
    if (!team || !standingsById.has(team)) return;
    // A game card can name a team the current view leaves out, so that team
    // opens in the full league, where it can be selected.
    const view = visibleStandings.some((row) => row.id === team)
      ? routeState.view
      : defaultState.view;
    setDrawerTeamId(team);
    navigate({ view, team });
  }

  const leagueLeader = useMemo(
    () => [...standings].sort((a, b) => b.pct - a.pct || b.wins - a.wins)[0] ?? null,
    [standings]
  );
  const hottest = useMemo(() => {
    const pool = [...standings].filter((row) => /^W\d+/i.test(row.streak));
    pool.sort((a, b) => (Number.parseInt(b.streak.slice(1), 10) || 0) - (Number.parseInt(a.streak.slice(1), 10) || 0));
    return pool[0] ?? null;
  }, [standings]);
  // Tightest division: smallest games-back among 2nd-place teams
  const tightestDivision = useMemo(() => {
    const seconds = standings.filter(
      (row) => row.divisionRank === 2 && Number.isFinite(row.gamesBack) && row.gamesBack >= 0
    );
    return seconds.toSorted((a, b) => a.gamesBack - b.gamesBack)[0] ?? null;
  }, [standings]);

  const hasStandings = standings.length > 0 && standings.some((row) => row.wins + row.losses > 0);
  // Postseason games on the slate mean the regular season table is final, so
  // the board reads as a finish and not a race still being chased.
  const isPostseason = [...summary.recentGames, ...summary.upcomingGames].some((game) =>
    Object.hasOwn(postseasonRoundLabels, game.stage ?? "")
  );

  const divisions = useMemo(() => divisionBoard(standings), [standings]);
  const wildCards = useMemo(() => wildCardBoard(standings), [standings]);
  const boards =
    routeState.view === "wildcard"
      ? wildCards
      : routeState.view === "all"
        ? divisions
        : divisions.filter((board) => board.name.startsWith(routeState.view === "al" ? "AL" : "NL"));

  const streakGames = hottest ? Number.parseInt(hottest.streak.slice(1), 10) : 0;
  // The three readouts the old hero printed, folded into the board's header
  // line. The streak is the regular season's, so in the postseason every
  // clause reads as a finish.
  const summaryParts = [
    leagueLeader
      ? `the ${leagueLeader.shortName} ${isPostseason ? "finished with" : "have"} the best record at ${formatRecord(leagueLeader)}`
      : null,
    tightestDivision
      ? `the ${tightestDivision.division} ${isPostseason ? "finished closest" : "is the closest race"} with the ${tightestDivision.shortName} ${tightestDivision.gamesBack.toFixed(1)} games back`
      : null,
    hottest
      ? `the ${hottest.shortName} ${isPostseason ? "ended the regular season on" : "are on"} the longest win streak at ${streakGames} game${streakGames === 1 ? "" : "s"}`
      : null,
  ].filter((part): part is string => part !== null);
  const boardSummary =
    summaryParts.length > 0
      ? `${SUMMARY_CLAUSES.format(summaryParts)}.`.replace(/^./, (c) => c.toUpperCase())
      : null;

  const updatedLabel =
    summary.updatedAt && summary.updatedAt > "1970-01-02" ? ` · updated ${snapshotDateLabel}` : "";
  const roundLabel = (game: { stage: string | null }) =>
    postseasonRoundLabels[game.stage ?? ""] ?? otherGameLabels[game.stage ?? ""] ?? "Other games";
  const teamRecent = (teamSnapshot?.recentGames ?? []).slice(0, 3);
  const teamUpcoming = (teamSnapshot?.upcomingGames ?? []).slice(0, 3);

  return (
    <div className="sb-root mlb-root">
      <div className="c97-shell c97-frame sb-column">
        <div className="sb-titlebar">
          <h1 className="sb-title">MLB Pulse</h1>
          <p className="sb-standfirst">
            I lay the division and wild card races out the way the out-of-town scoreboard at the ballpark shows
            them, team by team, so the games back and each club&apos;s last ten are easy to scan.
          </p>
          <p className="sb-status">
            <span className="sb-state" data-state={isPostseason ? "post" : "live"}>
              {isPostseason ? "Postseason" : "Regular season"}
            </span>
            <span>
              {summary.sourceLabel} · Season {summary.season}
              {updatedLabel}
            </span>
          </p>
        </div>

        <section id="mlb-standings" className="sb-board" aria-label="MLB standings">
          <div className="sb-toolbar">
            <h2 className="sb-h2">{isPostseason ? "Final standings" : "Standings"}</h2>
            <div ref={switchRef} className="sb-switch" role="group" aria-label="Standings view">
              {viewOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={option.id === routeState.view}
                  onClick={() => handleViewChange(option.id)}
                >
                  {option.label} <span className="sb-switch-count">{filterStandings(standings, option.id).length}</span>
                </button>
              ))}
            </div>
          </div>

          {boardSummary && hasStandings ? <p className="sb-summary">{boardSummary}</p> : null}
          {!hasStandings ? (
            <p className="sb-muted">
              The clubs are listed below by division. Win and loss data will appear once the next snapshot is
              published.
            </p>
          ) : null}

          {/* A row reads as pressed only while its drawer is open, since nothing else on the page shows a selected team. */}
          <MlbScoreboard boards={boards} selectedId={isDrawerOpen ? drawerTeamId : null} onSelect={handleTeamChange} />

          <ul className="sb-legend">
            {routeState.view === "wildcard" ? (
              <>
                <li>
                  <abbr className="mlb-mark" data-mark="In">In</abbr> holds one of three wild card slots, above the
                  dashed line
                </li>
                <li>A plus is a slot holder&apos;s lead over the last wild card slot</li>
              </>
            ) : (
              <>
                <li>
                  <abbr className="mlb-mark" data-mark="Leads">Leads</abbr> the division
                </li>
                <li>
                  <abbr className="mlb-mark" data-mark="WC">WC</abbr> holds one of three wild card slots
                </li>
              </>
            )}
            <li>Lit squares are wins in the last ten</li>
          </ul>
        </section>

        <section className="sb-detail" aria-labelledby="mlb-detail-heading">
          <div className="sb-toolbar">
            <h2 id="mlb-detail-heading" className="sb-h2">
              Games and leaders
            </h2>
            <SegmentedTabs
              tabs={[
                { id: "games", label: "Games" },
                { id: "leaders", label: "League leaders" },
              ]}
              activeId={activeDetailTab}
              onChange={(id) => setActiveDetailTab(id as DetailTab)}
              ariaLabel="Team and league details"
              idPrefix="mlb-detail-tab"
              panelId="mlb-detail-panel"
              className="sb-switch"
            />
          </div>

          <div id="mlb-detail-panel" role="tabpanel" aria-labelledby={`mlb-detail-tab-${activeDetailTab}`}>
            {activeDetailTab === "games" ? (
              summary.recentGames.length === 0 && summary.upcomingGames.length === 0 ? (
                <p className="sb-muted">
                  No games are on the schedule right now. Recent results and upcoming games will appear here once
                  the next snapshot is published.
                </p>
              ) : (
                <div className="sb-pair">
                  <div>
                    <h3 className="sb-h3">Latest results</h3>
                    <FixtureLedgerSection
                      groups={groupFixtures(summary.recentGames, roundLabel)}
                      onOpenTeam={handleTeamChange}
                      canOpenTeam={isClub}
                      emptyLabel="No results are in this snapshot."
                    />
                  </div>
                  <div>
                    <h3 className="sb-h3">Upcoming games</h3>
                    <FixtureLedgerSection
                      groups={groupFixtures(summary.upcomingGames, roundLabel)}
                      onOpenTeam={handleTeamChange}
                      canOpenTeam={isClub}
                      emptyLabel="No upcoming games are in this snapshot."
                    />
                  </div>
                </div>
              )
            ) : (
              <LeagueLeaders
                hitting={summary.hittingLeaders}
                pitching={summary.pitchingLeaders}
                sourceUrl={summary.sourceUrls.leaders}
              />
            )}
          </div>
        </section>

        <p className="sb-source">
          Standings, the schedule, and the league leaders come from a curated snapshot of the {summary.sourceLabel}{" "}
          endpoints that refreshes on a schedule, so tonight&apos;s games show up after the next refresh.
        </p>
      </div>

      {selectedRow ? (
        <DetailDrawer
          open={isDrawerOpen}
          title={selectedRow.name}
          lead={<CrestAvatar crest={logoByTeamId.get(selectedRow.id) ?? null} name={selectedRow.name} size="md" />}
          onClose={() => setDrawerTeamId(null)}
          resetKey={selectedRow.id}
          testId="mlb-selected-team"
        >
          <p className="dd-tags">
            <span>{selectedRow.division || `${selectedRow.league} club`}</span>
            {selectedRow.divisionRank > 0 ? <span>{ordinal(selectedRow.divisionRank)} in the division</span> : null}
            <span>{formatRecord(selectedRow)}</span>
            {selectedRow.streak ? <span>{selectedRow.streak}</span> : null}
          </p>

          <dl className="dd-stats dd-section">
            {(
              [
                ["W%", formatFixed(selectedRow.pct, 3)],
                ["GB", formatGamesBack(selectedRow.gamesBack)],
                ["Runs scored", `${selectedRow.runsScored}`],
                ["Runs allowed", `${selectedRow.runsAllowed}`],
                ["Run diff", formatRunDiff(selectedRow.runDifferential)],
                ["L10", selectedRow.last10],
                ["Offense", formatRank(offenseRankByTeam.get(selectedRow.id))],
                ["Defense", formatRank(defenseRankByTeam.get(selectedRow.id))],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          {(teamSnapshot?.form?.sequence?.length ?? 0) > 0 ? (
            <div className="dd-section">
              <p className="dd-label">Last 5</p>
              <div className="dd-form">
                {(teamSnapshot?.form.sequence ?? []).slice(-5).map((result, idx) => (
                  <TeamResultPill key={idx} result={result} />
                ))}
              </div>
            </div>
          ) : null}

          {selectedTeam?.venue ? <p className="dd-note">Home park is {selectedTeam.venue}.</p> : null}

          {teamRecent.length > 0 || teamUpcoming.length > 0 ? (
            <div className="dd-section sb-games">
              <FixtureLedgerSection
                groups={[
                  ...(teamRecent.length > 0 ? [{ key: "recent", label: "Recent results", fixtures: teamRecent }] : []),
                  ...(teamUpcoming.length > 0 ? [{ key: "upcoming", label: "Upcoming games", fixtures: teamUpcoming }] : []),
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
      ) : null}
    </div>
  );
}

function LeagueLeaders({
  hitting,
  pitching,
  sourceUrl,
}: {
  hitting: MlbHittingLeaders;
  pitching: MlbPitchingLeaders;
  sourceUrl: string;
}) {
  const groups: Array<{ title: string; statLabel: string; leaders: MlbLeader[] }> = [
    { title: "Home runs", statLabel: "HR", leaders: hitting.homeRuns },
    { title: "RBIs", statLabel: "RBI", leaders: hitting.runsBattedIn },
    { title: "Batting average", statLabel: "AVG", leaders: hitting.battingAverage },
    { title: "ERA", statLabel: "ERA", leaders: pitching.earnedRunAverage },
    { title: "Wins", statLabel: "W", leaders: pitching.wins },
    { title: "Strikeouts", statLabel: "K", leaders: pitching.strikeouts },
  ];
  const populated = groups.filter((group) => group.leaders.length > 0);
  const source = (
    <a href={sourceUrl} target="_blank" rel="noreferrer" className="sb-link">
      Official
      <span className="sr-only"> MLB league leaders (opens in a new tab)</span>
      <span aria-hidden="true"> leaders</span>
      <ExternalLink className="sb-link-icon" aria-hidden="true" />
    </a>
  );

  if (populated.length === 0) {
    return (
      <div className="sb-detail-leaders">
        <p className="sb-muted">League leaders will appear here once the next snapshot is published.</p>
        {source}
      </div>
    );
  }

  return (
    <div className="sb-detail-leaders">
      <div className="sb-trio">
        {populated.map((group) => (
          <LeaderLedger
            key={group.title}
            title={group.title}
            unit={group.statLabel}
            entries={leadersToEntries(group.leaders, group.statLabel)}
          />
        ))}
      </div>
      {source}
    </div>
  );
}

function formatRunDiff(diff: number): string {
  if (!Number.isFinite(diff) || diff === 0) return "0";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

const ORDINAL_RULES = new Intl.PluralRules("en-US", { type: "ordinal" });
const ORDINAL_SUFFIX: Partial<Record<Intl.LDMLPluralRule, string>> = { one: "st", two: "nd", few: "rd" };

/** 2 → "2nd", so a standing reads as a place rather than a bare count. */
function ordinal(n: number): string {
  return `${n}${ORDINAL_SUFFIX[ORDINAL_RULES.select(n)] ?? "th"}`;
}
