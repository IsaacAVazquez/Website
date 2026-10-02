"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { DATE_ONLY_TIME_ZONE } from "@/lib/date-formatters";
import {
  CrestAvatar,
  TeamResultPill,
  FixtureCard,
  LeaderList,
  type LeaderEntry,
} from "@/components/football";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
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
import { divisionBoard } from "./scoreboard";
import { MlbScoreboard } from "./MlbScoreboard";
import "./mlb.css";
import { useRouteSync } from "@/hooks/useRouteSync";

interface MlbClientProps {
  initialState: MlbRouteState;
  summary: MlbSummarySnapshot;
  initialTeamSnapshot: MlbTeamSnapshot | null;
}

type DetailTab = "team" | "games" | "leaders";

const viewOptions: Array<{ id: MlbView; label: string; description: string }> = [
  { id: "all", label: "All divisions", description: "All 30 clubs grouped by AL and NL division." },
  { id: "al", label: "American League", description: "AL East, Central, and West divisions." },
  { id: "nl", label: "National League", description: "NL East, Central, and West divisions." },
  { id: "wildcard", label: "Wild card", description: "Top wild card contenders in both leagues." },
];

// Keyed by the API's gameType, which the snapshot carries as `stage`.
const postseasonRoundLabels: Record<string, string> = {
  F: "Wild Card Series",
  D: "Division Series",
  L: "League Championship Series",
  W: "World Series",
};

async function fetchMlbTeamSnapshot(
  teamId: string,
  signal: AbortSignal
): Promise<MlbTeamSnapshot> {
  const response = await fetch(`/api/mlb/teams/${teamId}`, { signal });
  const payload = (await response.json()) as MlbTeamSnapshot & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Unable to load team snapshot.");
  }
  return payload;
}

function formatFixed(value: number, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function formatGamesBack(games: number) {
  if (!Number.isFinite(games) || games <= 0) return "—";
  return `${games.toFixed(1)} GB`;
}

function formatRecord(row: MlbStandingsRow) {
  return `${row.wins}-${row.losses}`;
}

function leadersToEntries(
  leaders: MlbLeader[],
  perGameDigits = 2
): LeaderEntry[] {
  return leaders.map((leader) => ({
    rank: leader.rank,
    name: leader.name,
    clubId: leader.teamId,
    clubCode: leader.teamCode,
    total: Number(leader.total.toFixed(perGameDigits)),
    appearances: leader.games,
    perMatch: leader.perGame,
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
  const teamShortNameLookup = useMemo(
    () => new Map(summary.teams.map((team) => [team.id, team.shortName])),
    [summary.teams]
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

  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("team") !== null;
  const routeState = hasManagedParams
    ? normalizeState(searchParams, defaultState, aliasMap)
    : initialState;
  const visibleStandings = filterStandings(standings, routeState.view);
  const selectedTeamId = visibleStandings.some((row) => row.id === routeState.team)
    ? routeState.team
    : getDefaultTeam(standings, routeState.view, defaultState.team);
  const selectedRow = standingsById.get(selectedTeamId) ?? standings[0];
  const selectedTeam = teamLookup.get(selectedRow?.id ?? "") ?? null;

  const [teamSnapshots, setTeamSnapshots] = useState<Record<string, MlbTeamSnapshot>>(
    () =>
      selectedRow && initialTeamSnapshot ? { [selectedRow.id]: initialTeamSnapshot } : {}
  );
  const [loadingTeamId, setLoadingTeamId] = useState<string | null>(null);
  const [teamSnapshotError, setTeamSnapshotError] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>("team");

  const teamSnapshot = selectedRow ? teamSnapshots[selectedRow.id] ?? null : null;
  const isTeamSnapshotLoading = selectedRow ? loadingTeamId === selectedRow.id : false;

  const desiredHref = buildHref(
    { view: routeState.view, team: selectedTeamId },
    defaultState,
    aliasMap,
    searchParams
  );

  const pushHref = useRouteSync(MLB_ROUTE, desiredHref);

  useEffect(() => {
    if (!selectedRow) return;
    if (teamSnapshots[selectedRow.id]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset loading/error flags when cached snapshot exists for the selected team
      setLoadingTeamId(null);
      setTeamSnapshotError(null);
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    setLoadingTeamId(selectedRow.id);
    setTeamSnapshotError(null);
    fetchMlbTeamSnapshot(selectedRow.id, controller.signal)
      .then((snapshot) => {
        if (cancelled) return;
        setTeamSnapshots((current) =>
          current[selectedRow.id] ? current : { ...current, [selectedRow.id]: snapshot }
        );
      })
      .catch((error: Error) => {
        if (!cancelled && error.name !== "AbortError") {
          setTeamSnapshotError(error.message || "Unable to load team snapshot.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTeamId((current) => (current === selectedRow.id ? null : current));
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedRow, teamSnapshots]);

  function navigate(nextState: MlbRouteState) {
    const href = buildHref(nextState, defaultState, aliasMap, searchParams);
    pushHref(href);
  }

  function handleViewChange(view: MlbView) {
    const next = filterStandings(standings, view);
    const nextTeam = next.some((row) => row.id === selectedTeamId)
      ? selectedTeamId
      : next[0]?.id ?? defaultState.team;
    navigate({ view, team: nextTeam });
  }

  function handleTeamChange(teamId: string) {
    navigate({
      view: routeState.view,
      team: canonicalizeTeamId(teamId, aliasMap) ?? defaultState.team,
    });
  }

  const groupedStandings = useMemo(() => {
    const groups = new Map<string, MlbStandingsRow[]>();
    for (const row of visibleStandings) {
      const key = routeState.view === "wildcard" ? `${row.league} Wild Card` : row.division;
      const list = groups.get(key) ?? [];
      list.push(row);
      groups.set(key, list);
    }
    return Array.from(groups.entries());
  }, [visibleStandings, routeState.view]);

  const leagueLeader = useMemo(
    () =>
      [...standings].sort(
        (a, b) => b.pct - a.pct || b.wins - a.wins
      )[0] ?? null,
    [standings]
  );
  const hottest = useMemo(() => {
    const pool = [...standings].filter((row) => /^W\d+/i.test(row.streak));
    pool.sort((a, b) => {
      const aRun = Number.parseInt(a.streak.slice(1), 10) || 0;
      const bRun = Number.parseInt(b.streak.slice(1), 10) || 0;
      return bRun - aRun;
    });
    return pool[0] ?? null;
  }, [standings]);

  // Tightest division: smallest games-back among 2nd-place teams
  const tightestDivision = useMemo(() => {
    const seconds = standings.filter(
      (row) => row.divisionRank === 2 && Number.isFinite(row.gamesBack) && row.gamesBack >= 0
    );
    if (seconds.length === 0) return null;
    return [...seconds].sort((a, b) => a.gamesBack - b.gamesBack)[0] ?? null;
  }, [standings]);

  const hasStandings = standings.length > 0 && standings.some((row) => row.wins + row.losses > 0);

  const scoreboard = useMemo(() => divisionBoard(standings), [standings]);

  const lead = PROJECT_PRESS[MLB_ROUTE].lead;
  const standfirst =
    "I wanted the division and wild card races laid out the way the out-of-town scoreboard at the ballpark shows them, team by team, with the games back and each club's last ten games easy to scan. It reads from a curated MLB Stats API snapshot that refreshes on a schedule, so tonight's games show up after the next refresh.";

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="MLB Pulse"
        standfirst={standfirst}
        meta={`${summary.sourceLabel} · Season ${summary.season}${
          summary.updatedAt && summary.updatedAt > "1970-01-02"
            ? ` · updated ${snapshotDateLabel}`
            : ""
        }`}
        readouts={[
          {
            label: "Best record",
            value: leagueLeader ? formatRecord(leagueLeader) : "—",
            detail: leagueLeader ? `${leagueLeader.shortName}, ${formatFixed(leagueLeader.pct, 3)} W%` : undefined,
          },
          {
            label: "Closest division race",
            value: tightestDivision ? `${tightestDivision.gamesBack.toFixed(1)} GB` : "—",
            detail: tightestDivision
              ? `${tightestDivision.division}, ${tightestDivision.shortName} chasing`
              : undefined,
          },
          {
            label: "Hottest streak",
            value: hottest ? hottest.streak : "—",
            detail: hottest ? `${hottest.shortName}, ${hottest.last10} in the last 10` : "No active win streaks",
          },
        ]}
      >
        <MlbScoreboard divisions={scoreboard} />
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          <h2 className="c97-poster-sm mb-5">Standings</h2>

          <div className="c97-segmented" role="tablist" aria-label="Standings view">
            {viewOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={option.id === routeState.view}
                onClick={() => handleViewChange(option.id)}
                className="min-h-[44px] text-sm font-semibold"
              >
                {option.label}
                <span style={{ marginLeft: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}>
                  {filterStandings(standings, option.id).length}
                </span>
              </button>
            ))}
          </div>

          {!hasStandings && (
            <p className="c97-prose" style={{ marginTop: "var(--c97-sp-3)" }}>
              The 30 clubs are listed below. Win and loss data will appear once the next
              snapshot is published.
            </p>
          )}

          <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.92fr)]">
            <div
              className="space-y-6 overflow-x-auto"
              role="region"
              aria-label="MLB standings (scrollable)"
              tabIndex={0}
            >
              {groupedStandings.map(([groupName, rows]) => (
                <div key={groupName}>
                  <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>{groupName}</p>
                  <table className="c97-table c97-mlb-table" aria-label={`${groupName} standings`}>
                    <thead>
                      <tr>
                        <th scope="col">Pos</th>
                        <th scope="col">Team</th>
                        <th scope="col">W-L</th>
                        <th scope="col" className="hidden sm:table-cell">PCT</th>
                        <th scope="col" className="hidden md:table-cell">GB</th>
                        <th scope="col" className="hidden lg:table-cell">RS</th>
                        <th scope="col" className="hidden lg:table-cell">RA</th>
                        <th scope="col" className="hidden xl:table-cell">L10</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const isSelected = row.id === selectedRow?.id;
                        const positionLabel =
                          routeState.view === "wildcard"
                            ? row.wildCardRank ?? row.divisionRank
                            : row.divisionRank;
                        const zone = getTeamZone(row);
                        return (
                          <tr key={row.id} data-selected={isSelected || undefined}>
                            <td>
                              <div className="flex items-center gap-2">
                                <span
                                  className="c97-mlb-zone-dot"
                                  style={{ backgroundColor: getZoneDotColor(zone) }}
                                  title={getZoneLabel(zone)}
                                />
                                <span className="c97-mono">{positionLabel}</span>
                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleTeamChange(row.id)}
                                aria-pressed={isSelected}
                                aria-label={`Show ${row.name} details`}
                                className="flex min-h-[44px] w-full items-center gap-2 text-left"
                                style={{ background: "none", border: 0, padding: 0 }}
                              >
                                <CrestAvatar
                                  crest={logoByTeamId.get(row.id) ?? null}
                                  name={row.shortName}
                                  size="sm"
                                />
                                <span className="c97-serif" style={{ fontWeight: 600 }}>
                                  {row.shortName}
                                </span>
                              </button>
                            </td>
                            <td className="c97-mono">{formatRecord(row)}</td>
                            <td className="c97-mono hidden sm:table-cell">{formatFixed(row.pct, 3)}</td>
                            <td className="c97-mono hidden md:table-cell">{formatGamesBack(row.gamesBack)}</td>
                            <td className="c97-mono hidden lg:table-cell">{row.runsScored}</td>
                            <td className="c97-mono hidden lg:table-cell">{row.runsAllowed}</td>
                            <td className="c97-mono hidden xl:table-cell">{row.last10}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <aside className="xl:sticky xl:top-6 xl:self-start">
              <div className="c97-panel" aria-live="polite" data-testid="mlb-selected-team">
                {selectedRow ? (
                  <>
                    <div className="flex items-start gap-3">
                      <CrestAvatar
                        crest={logoByTeamId.get(selectedRow.id) ?? null}
                        name={selectedRow.name}
                        size="lg"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="c97-serif truncate" style={{ fontSize: "var(--c97-fs-h3)" }}>
                          {selectedRow.name}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="c97-chip">
                            {selectedRow.division || `${selectedRow.league} club`}
                          </span>
                          <span className="c97-chip">{formatRecord(selectedRow)}</span>
                          {selectedRow.streak && <span className="c97-chip">{selectedRow.streak}</span>}
                        </div>
                      </div>
                      <span className="c97-chip" style={{ flexShrink: 0 }}>
                        Div {selectedRow.divisionRank || "—"}
                      </span>
                    </div>

                    <dl
                      className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2"
                      style={{ borderTop: "1px solid var(--c97-rule)", paddingTop: "var(--c97-sp-3)" }}
                    >
                      {(
                        [
                          ["W%", formatFixed(selectedRow.pct, 3)],
                          ["GB", formatGamesBack(selectedRow.gamesBack)],
                          ["Run diff", formatRunDiff(selectedRow.runDifferential)],
                          ["L10", selectedRow.last10],
                          ["Offense", `#${offenseRankByTeam.get(selectedRow.id) ?? "-"}`],
                          ["Defense", `#${defenseRankByTeam.get(selectedRow.id) ?? "-"}`],
                        ] as const
                      ).map(([label, value]) => (
                        <div key={label} className="flex items-baseline justify-between gap-2">
                          <dt className="c97-kicker">{label}</dt>
                          <dd className="c97-mono mb-0" style={{ fontWeight: 600 }}>{value}</dd>
                        </div>
                      ))}
                    </dl>

                    {(teamSnapshot?.form?.sequence?.length ?? 0) > 0 && (
                      <div className="mt-4" style={{ borderTop: "1px solid var(--c97-rule)", paddingTop: "var(--c97-sp-3)" }}>
                        <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Last 5</p>
                        <div className="flex gap-1.5">
                          {(teamSnapshot?.form.sequence ?? []).slice(-5).map((result, idx) => (
                            <TeamResultPill key={idx} result={result} />
                          ))}
                        </div>
                      </div>
                    )}

                    {!teamSnapshot && (isTeamSnapshotLoading || teamSnapshotError) ? (
                      <p
                        className="c97-prose"
                        style={{ marginTop: "var(--c97-sp-2)", borderTop: "1px solid var(--c97-rule)", paddingTop: "var(--c97-sp-3)" }}
                        role={teamSnapshotError ? "alert" : "status"}
                        aria-live="polite"
                      >
                        {isTeamSnapshotLoading ? "Loading team snapshot…" : teamSnapshotError}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="c97-prose">Select a team to view detail.</p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell">
          <div className="c97-segmented" role="tablist" aria-label="Team and league details">
            {(["team", "games", "leaders"] as const).map((tab) => {
              const labels = {
                team: "Team detail",
                games: "Games",
                leaders: "League leaders",
              } as const;
              return (
                <button
                  key={tab}
                  id={`mlb-detail-tab-${tab}`}
                  role="tab"
                  type="button"
                  aria-selected={activeDetailTab === tab}
                  aria-controls="mlb-detail-panel"
                  onClick={() => setActiveDetailTab(tab)}
                  className="min-h-[44px] text-sm font-semibold"
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          <div
            id="mlb-detail-panel"
            role="tabpanel"
            aria-labelledby={`mlb-detail-tab-${activeDetailTab}`}
            className="mt-6"
          >
            {activeDetailTab === "team" && selectedRow && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-5">
                  <div className="c97-panel">
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Pressure points</p>
                    <ul className="c97-list">
                      {getPressurePoints(selectedRow).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {selectedTeam?.venue && (
                    <p className="c97-prose">
                      Home park is {selectedTeam.venue}.
                    </p>
                  )}
                </div>

                {!teamSnapshot && (isTeamSnapshotLoading || teamSnapshotError) && (
                  <div
                    className="c97-panel"
                    role={teamSnapshotError ? "alert" : "status"}
                    aria-live="polite"
                  >
                    <p className="c97-prose">
                      {isTeamSnapshotLoading ? "Loading recent team games…" : teamSnapshotError}
                    </p>
                  </div>
                )}

                {(teamSnapshot?.recentGames.length ?? 0) > 0 && (
                  <div>
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>Recent results</p>
                    <div className="space-y-2">
                      {(teamSnapshot?.recentGames ?? []).slice(0, 3).map((game) => (
                        <FixtureCard
                          key={game.id}
                          fixture={game}
                          contextTeamId={teamSnapshot?.team?.id ?? undefined}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                )}

                {(teamSnapshot?.upcomingGames.length ?? 0) > 0 && (
                  <div>
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>Upcoming games</p>
                    <div className="space-y-2">
                      {(teamSnapshot?.upcomingGames ?? []).slice(0, 3).map((game) => (
                        <FixtureCard
                          key={game.id}
                          fixture={game}
                          contextTeamId={teamSnapshot?.team?.id ?? undefined}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === "games" && (
              <div className="grid gap-6 md:grid-cols-2">
                {summary.recentGames.length > 0 && (
                  <div>
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Recent slate</p>
                    <h3 className="c97-serif" style={{ marginBottom: "var(--c97-sp-1)", fontSize: "var(--c97-fs-h3)" }}>Latest results</h3>
                    <div className="space-y-3">
                      {summary.recentGames.map((game) => (
                        <FixtureCard
                          key={game.id}
                          fixture={game}
                          onOpenTeam={handleTeamChange}
                          fallbackLabel={postseasonRoundLabels[game.stage ?? ""]}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {summary.upcomingGames.length > 0 && (
                  <div>
                    <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Next up</p>
                    <h3 className="c97-serif" style={{ marginBottom: "var(--c97-sp-1)", fontSize: "var(--c97-fs-h3)" }}>Upcoming games</h3>
                    <div className="space-y-3">
                      {summary.upcomingGames.map((game) => (
                        <FixtureCard
                          key={game.id}
                          fixture={game}
                          onOpenTeam={handleTeamChange}
                          fallbackLabel={postseasonRoundLabels[game.stage ?? ""]}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {summary.recentGames.length === 0 && summary.upcomingGames.length === 0 && (
                  <p className="c97-prose">
                    No games are loaded yet. Run the snapshot script to populate the schedule.
                  </p>
                )}
              </div>
            )}

            {activeDetailTab === "leaders" && (
              <LeagueLeaders
                hitting={summary.hittingLeaders}
                pitching={summary.pitchingLeaders}
                teamLookup={teamShortNameLookup}
                sourceUrl={summary.sourceUrls.leaders}
              />
            )}
          </div>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Snapshot note</p>
          <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
            This page reads from a curated snapshot of the {summary.sourceLabel} endpoints.
            Standings, schedule, and league leaders all refresh on the regular update cadence.
          </p>
        </div>
      </section>
    </>
  );
}

function LeagueLeaders({
  hitting,
  pitching,
  teamLookup,
  sourceUrl,
}: {
  hitting: MlbHittingLeaders;
  pitching: MlbPitchingLeaders;
  teamLookup: Map<string, string>;
  sourceUrl: string;
}) {
  const groups: Array<{
    title: string;
    statLabel: string;
    leaders: MlbLeader[];
  }> = [
    { title: "Home runs", statLabel: "HR", leaders: hitting.homeRuns },
    { title: "RBIs", statLabel: "RBI", leaders: hitting.runsBattedIn },
    { title: "Batting average", statLabel: "AVG", leaders: hitting.battingAverage },
    { title: "ERA", statLabel: "ERA", leaders: pitching.earnedRunAverage },
    { title: "Wins", statLabel: "W", leaders: pitching.wins },
    { title: "Strikeouts", statLabel: "K", leaders: pitching.strikeouts },
  ];

  const populated = groups.filter((group) => group.leaders.length > 0);

  if (populated.length === 0) {
    return (
      <div className="flex items-start justify-between gap-3">
        <p className="c97-prose">
          League leader boards are not loaded yet. Run the snapshot script to populate hitting and pitching leaders.
        </p>
        <a href={sourceUrl} target="_blank" rel="noreferrer" className="c97-btn-ghost">
          Source
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <a href={sourceUrl} target="_blank" rel="noreferrer" className="c97-btn-ghost">
          Official
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {populated.map((group) => (
          <div key={group.title}>
            <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Leaderboard</p>
            <h3 className="c97-serif" style={{ marginBottom: "var(--c97-sp-2)", fontSize: "var(--c97-fs-h3)" }}>{group.title}</h3>
            <LeaderList
              leaders={leadersToEntries(group.leaders, group.statLabel === "AVG" || group.statLabel === "ERA" ? 3 : 0)}
              statLabel={group.statLabel}
              clubLookup={teamLookup}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function formatRunDiff(diff: number): string {
  if (!Number.isFinite(diff) || diff === 0) return "0";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

type MlbZone = "division" | "wildcard" | "out";

function getTeamZone(row: MlbStandingsRow): MlbZone {
  if (row.divisionRank === 1) return "division";
  if (row.wildCardRank !== null && row.wildCardRank <= 3) return "wildcard";
  return "out";
}

function getZoneLabel(zone: MlbZone): string {
  switch (zone) {
    case "division":
      return "Division leader";
    case "wildcard":
      return "Wild card slot";
    case "out":
    default:
      return "Out of postseason";
  }
}

function getZoneDotColor(zone: MlbZone): CSSProperties["backgroundColor"] {
  switch (zone) {
    case "division":
      return "var(--c97-positive)";
    case "wildcard":
      return "color-mix(in srgb, var(--c97-positive) 55%, var(--c97-ink))";
    case "out":
    default:
      return "var(--c97-ink-2)";
  }
}

function getPressurePoints(row: MlbStandingsRow): string[] {
  const points: string[] = [];
  if (row.divisionRank === 1) {
    points.push(`Lead the ${row.division} with a ${formatRecord(row)} record.`);
  } else {
    points.push(
      `${row.divisionRank} in the ${row.division || `${row.league}`}, ${
        row.gamesBack > 0 ? `${row.gamesBack.toFixed(1)} games back of the leader.` : "tied at the top of the division."
      }`
    );
  }
  if (row.wildCardRank !== null) {
    points.push(
      row.wildCardRank <= 3
        ? `Holding a ${row.league} wild card slot at #${row.wildCardRank}.`
        : `${row.wildCardRank} in the ${row.league} wild card chase${
            row.wildCardGamesBack && row.wildCardGamesBack > 0
              ? `, ${row.wildCardGamesBack.toFixed(1)} games out.`
              : "."
          }`
    );
  }
  points.push(`Run differential: ${formatRunDiff(row.runDifferential)}.`);
  if (row.last10) {
    points.push(`Last 10: ${row.last10}${row.streak ? ` (current ${row.streak}).` : "."}`);
  }
  return points;
}
