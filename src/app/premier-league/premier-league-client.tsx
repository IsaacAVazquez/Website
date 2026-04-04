"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, ExternalLink, Shield, Trophy, TrendingUp } from "lucide-react";
import { SectionIntro } from "@/components/ui/SectionIntro";
import {
  SurfaceCard,
  StatCard,
  MetricCard,
  CrestAvatar,
  InfoChip,
  TeamResultPill,
  FixtureCard,
  LeaderList,
  type LeaderEntry,
} from "@/components/football";
import type {
  PremierLeagueRouteState,
  PremierLeagueSnapshot,
  PremierLeagueView,
} from "@/types/premier-league";
import {
  buildPremierLeagueHref,
  filterStandingsForView,
  normalizePremierLeagueState,
  PREMIER_LEAGUE_VIEW_LABELS,
  PREMIER_LEAGUE_VIEW_OPTIONS,
} from "./premier-league-state";

interface PremierLeagueClientProps {
  initialState: PremierLeagueRouteState;
  snapshot: PremierLeagueSnapshot;
}

function formatFixed(value: number, decimals = 2): string {
  return Number.isFinite(value) ? value.toFixed(decimals) : "—";
}

function getPLZone(position: number): "champions" | "europa" | "conference" | "midtable" | "relegation" {
  if (position <= 4) return "champions";
  if (position === 5) return "europa";
  if (position === 6) return "conference";
  if (position >= 18) return "relegation";
  return "midtable";
}

function getZoneLabel(zone: ReturnType<typeof getPLZone>): string {
  switch (zone) {
    case "champions": return "Champions League";
    case "europa": return "Europa League";
    case "conference": return "Conference League";
    case "relegation": return "Relegation";
    case "midtable": default: return "Midtable";
  }
}

function getZonePillStyle(zone: ReturnType<typeof getPLZone>): CSSProperties {
  switch (zone) {
    case "champions":
      return {
        color: "var(--color-primary)",
        borderColor: "color-mix(in srgb, var(--color-primary) 30%, var(--border-primary))",
        background: "color-mix(in srgb, var(--color-primary) 10%, var(--surface-secondary))",
      };
    case "europa":
      return {
        color: "var(--color-warning)",
        borderColor: "color-mix(in srgb, var(--color-warning) 30%, var(--border-primary))",
        background: "color-mix(in srgb, var(--color-warning) 10%, var(--surface-secondary))",
      };
    case "conference":
      return {
        color: "var(--color-success)",
        borderColor: "color-mix(in srgb, var(--color-success) 30%, var(--border-primary))",
        background: "color-mix(in srgb, var(--color-success) 10%, var(--surface-secondary))",
      };
    case "relegation":
      return {
        color: "var(--color-error, var(--color-danger))",
        borderColor: "color-mix(in srgb, var(--color-danger) 30%, var(--border-primary))",
        background: "color-mix(in srgb, var(--color-danger) 10%, var(--surface-secondary))",
      };
    default:
      return { color: "var(--text-secondary)", borderColor: "var(--border-primary)", background: "var(--surface-secondary)" };
  }
}

function getZoneDotColor(zone: ReturnType<typeof getPLZone>): string {
  switch (zone) {
    case "champions": return "var(--color-primary)";
    case "europa": return "var(--color-warning)";
    case "conference": return "var(--color-success)";
    case "relegation": return "var(--color-danger)";
    default: return "var(--border-primary)";
  }
}

function getTableRowStyle(isSelected: boolean): CSSProperties {
  if (isSelected) {
    return {
      borderColor: "color-mix(in srgb, var(--color-primary) 35%, var(--border-primary))",
      background: "color-mix(in srgb, var(--color-primary) 9%, var(--surface-secondary))",
    };
  }
  return { borderColor: "var(--border-primary)", background: "var(--surface-secondary)" };
}

function getViewButtonStyle(isActive: boolean): CSSProperties {
  if (isActive) {
    return {
      borderColor: "color-mix(in srgb, var(--color-primary) 35%, var(--border-primary))",
      background: "color-mix(in srgb, var(--color-primary) 9%, var(--surface-secondary))",
      boxShadow: "var(--shadow-sm)",
    };
  }
  return { borderColor: "var(--border-primary)", background: "var(--surface-secondary)" };
}

const LAST_UPDATED_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
});

function formatGeneratedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : LAST_UPDATED_FORMATTER.format(date);
}

export function PremierLeagueClient({ initialState, snapshot }: PremierLeagueClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const currentHref = `/premier-league${currentQuery ? `?${currentQuery}` : ""}`;
  const hasManagedParams = searchParams.get("view") !== null || searchParams.get("team") !== null;
  const routeState = hasManagedParams ? normalizePremierLeagueState(searchParams) : initialState;

  const summary = snapshot.summary;
  const validTeamIds = useMemo(() => new Set(summary.teams.map((t) => t.id)), [summary.teams]);
  const canonicalTeamId = validTeamIds.has(routeState.team ?? "") ? routeState.team : null;
  const selectedTeamId = canonicalTeamId ?? summary.standings[0]?.team.id ?? null;

  const desiredHref = buildPremierLeagueHref(
    { view: routeState.view, team: canonicalTeamId },
    searchParams
  );

  useEffect(() => {
    if (currentHref === desiredHref) return;
    startTransition(() => { router.replace(desiredHref, { scroll: false }); });
  }, [currentHref, desiredHref, router]);

  function navigate(nextState: PremierLeagueRouteState) {
    const href = buildPremierLeagueHref(nextState, searchParams);
    if (href === currentHref) return;
    startTransition(() => { router.push(href, { scroll: false }); });
  }

  function handleViewChange(view: PremierLeagueView) {
    const visibleRows = filterStandingsForView(summary.standings, view);
    const nextTeam = visibleRows.some((r) => r.team.id === selectedTeamId)
      ? selectedTeamId
      : visibleRows[0]?.team.id ?? null;
    navigate({ view, team: nextTeam });
  }

  function handleTeamChange(teamId: string) {
    navigate({ view: routeState.view, team: teamId });
  }

  // Derived state
  const visibleStandings = filterStandingsForView(summary.standings, routeState.view);
  const selectedRow = summary.standings.find((r) => r.team.id === selectedTeamId) ?? summary.standings[0] ?? null;
  const teamSnapshot = selectedTeamId ? snapshot.teamSnapshots[selectedTeamId] ?? null : null;

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

  const selectedZone = selectedRow ? getPLZone(selectedRow.position) : "midtable";
  const lastUpdated = formatGeneratedAt(summary.generatedAt);

  return (
    <section className="page-section relative overflow-hidden bg-[var(--surface-primary)]">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[26rem] opacity-90"
        style={{
          background: "radial-gradient(circle at top, color-mix(in srgb, var(--color-primary) 18%, transparent), transparent 56%)",
        }}
      />

      <div className="page-shell relative space-y-8 sm:space-y-10">
        {/* Hero panel */}
        <div className="section-panel p-6 sm:p-8 lg:p-10">
          <SectionIntro
            eyebrow="Football Data Tool"
            size="lg"
            title="Premier League Pulse"
            description="I track the Premier League title race, European qualification gaps, and relegation fight here. Updated weekly from football-data.org."
          />

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
            <InfoChip label={`Season ${summary.competition?.seasonLabel ?? "2025/26"}`} />
            {summary.competition?.currentMatchday && (
              <InfoChip label={`Matchday ${summary.competition.currentMatchday}`} />
            )}
            <InfoChip label={`Updated ${lastUpdated}`} />
            <InfoChip label={snapshot.sourceLabel} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              variant="compact"
              eyebrow="Leader"
              metric={`${leader?.team.shortName ?? "—"} · ${leader?.points ?? "—"} pts`}
              detail={leader && runnerUp ? `${leader.points - runnerUp.points} clear of ${runnerUp.team.shortName}` : "Standings loading"}
              icon={<Trophy className="h-4 w-4" />}
            />
            <StatCard
              variant="compact"
              eyebrow="Top-four line"
              metric={fourthPlace && fifthPlace ? `+${fourthPlace.points - fifthPlace.points} pts` : "—"}
              detail={fourthPlace && fifthPlace ? `${fourthPlace.team.shortName} over ${fifthPlace.team.shortName}` : ""}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatCard
              variant="compact"
              eyebrow="Europe line"
              metric={summary.standings[5] && summary.standings[6] ? `+${summary.standings[5].points - summary.standings[6].points} pts` : "—"}
              detail={summary.standings[5] && summary.standings[6] ? `${summary.standings[5].team.shortName} over ${summary.standings[6].team.shortName}` : ""}
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <StatCard
              variant="compact"
              eyebrow="Safety line"
              metric={safetyLine && dropLine ? `+${safetyLine.points - dropLine.points} pt` : "—"}
              detail={safetyLine && dropLine ? `${safetyLine.team.shortName} over ${dropLine.team.shortName}` : ""}
              icon={<Shield className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Main standings + sidebar */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.95fr)]">
          {/* Standings */}
          <section className="section-panel p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Standings</h2>
              <span className="text-sm text-[var(--text-secondary)]">{visibleStandings.length} clubs</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {PREMIER_LEAGUE_VIEW_OPTIONS.map((key) => {
                const isActive = key === routeState.view;
                const count = filterStandingsForView(summary.standings, key).length;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleViewChange(key)}
                    aria-pressed={isActive}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                    style={getViewButtonStyle(isActive)}
                  >
                    <span className="text-[var(--text-primary)]">{PREMIER_LEAGUE_VIEW_LABELS[key]}</span>
                    <span className="text-xs text-[var(--text-tertiary)]">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2" aria-label="Premier League standings">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    <th className="px-3 py-2 font-semibold">Pos</th>
                    <th className="px-3 py-2 font-semibold">Club</th>
                    <th className="hidden px-3 py-2 font-semibold sm:table-cell">Record</th>
                    <th className="px-3 py-2 font-semibold">Pts</th>
                    <th className="hidden px-3 py-2 font-semibold md:table-cell">PPG</th>
                    <th className="hidden px-3 py-2 font-semibold lg:table-cell">GF</th>
                    <th className="hidden px-3 py-2 font-semibold lg:table-cell">GA</th>
                    <th className="px-3 py-2 font-semibold">GD</th>
                    <th className="hidden px-3 py-2 font-semibold xl:table-cell">Meter</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleStandings.map((row) => {
                    const isSelected = row.team.id === selectedTeamId;
                    const zone = getPLZone(row.position);
                    return (
                      <tr
                        key={row.team.id}
                        className="border border-[var(--border-primary)]"
                        style={getTableRowStyle(isSelected)}
                      >
                        <td className="rounded-l-2xl px-3 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: getZoneDotColor(zone) }}
                              title={getZoneLabel(zone)}
                            />
                            <span className="text-sm font-semibold text-[var(--text-primary)]">{row.position}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <button
                            type="button"
                            onClick={() => handleTeamChange(row.team.id)}
                            aria-pressed={isSelected}
                            aria-label={`Show ${row.team.name} details`}
                            className="flex min-h-[44px] w-full items-center gap-2 rounded-xl text-left"
                          >
                            <CrestAvatar crest={row.team.crest} name={row.team.shortName} size="sm" />
                            <span className="font-semibold text-[var(--text-primary)]">{row.team.shortName}</span>
                          </button>
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--text-secondary)] sm:table-cell">
                          {row.won}-{row.draw}-{row.lost}
                        </td>
                        <td className="px-3 py-3 align-middle text-sm font-semibold text-[var(--text-primary)]">
                          {row.points}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--text-secondary)] md:table-cell">
                          {formatFixed(row.points / row.playedGames)}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--text-secondary)] lg:table-cell">
                          {row.goalsFor}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--text-secondary)] lg:table-cell">
                          {row.goalsAgainst}
                        </td>
                        <td className="px-3 py-3 align-middle text-sm font-medium text-[var(--text-primary)]">
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                        <td className="hidden rounded-r-2xl px-3 py-3 align-middle xl:table-cell">
                          {leader && (
                            <div className="h-2.5 w-28 rounded-full bg-[var(--surface-primary)]">
                              <div
                                className="h-full rounded-full bg-[var(--color-primary)] transition-[width]"
                                style={{ width: `${(row.points / leader.points) * 100}%` }}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Club sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {selectedRow ? (
              <section className="section-panel p-5 sm:p-6" aria-live="polite" data-testid="pl-selected-club">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <CrestAvatar crest={selectedRow.team.crest} name={selectedRow.team.shortName} size="lg" />
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Club snapshot</p>
                      <h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{selectedRow.team.name}</h2>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-right text-[var(--text-inverse)] shadow-sm flex-shrink-0">
                    <p className="text-xs uppercase tracking-[0.14em] opacity-80">Position</p>
                    <p className="text-2xl font-bold">{selectedRow.position}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]"
                    style={getZonePillStyle(selectedZone)}
                  >
                    {getZoneLabel(selectedZone)}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                    {selectedRow.points} points
                  </span>
                  <span className="inline-flex items-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                    {38 - selectedRow.playedGames} matches left
                  </span>
                </div>

                <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3">
                  <MetricCard label="PPG" value={formatFixed(selectedRow.points / selectedRow.playedGames)} />
                  <MetricCard label="Record" value={`${selectedRow.won}-${selectedRow.draw}-${selectedRow.lost}`} />
                  <MetricCard label="Attack rank" value={`#${attackRankings.get(selectedRow.team.id) ?? "—"}`} />
                  <MetricCard label="Defense rank" value={`#${defenseRankings.get(selectedRow.team.id) ?? "—"}`} />
                  <MetricCard label="GF / match" value={formatFixed(selectedRow.goalsFor / selectedRow.playedGames)} />
                  <MetricCard label="GA / match" value={formatFixed(selectedRow.goalsAgainst / selectedRow.playedGames)} />
                </div>

                {teamSnapshot && (
                  <>
                    {teamSnapshot.form.sequence.length > 0 && (
                      <div className="mt-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Recent form</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {teamSnapshot.form.sequence.map((result, i) => (
                            <TeamResultPill key={`${result}-${i}`} result={result} />
                          ))}
                        </div>
                      </div>
                    )}

                    {teamSnapshot.recentFixtures.length > 0 && (
                      <div className="mt-6">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Recent results</p>
                        <div className="space-y-2">
                          {teamSnapshot.recentFixtures.slice(0, 3).map((fixture) => (
                            <FixtureCard
                              key={fixture.id}
                              fixture={fixture}
                              contextTeamId={selectedTeamId}
                              compact
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {teamSnapshot.upcomingFixtures.length > 0 && (
                      <div className="mt-6">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Upcoming fixtures</p>
                        <div className="space-y-2">
                          {teamSnapshot.upcomingFixtures.slice(0, 3).map((fixture) => (
                            <FixtureCard key={fixture.id} fixture={fixture} contextTeamId={selectedTeamId} compact />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            ) : null}

            {/* Top scorers */}
            {scorerEntries.length > 0 && (
              <section className="section-panel p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Goals leaderboard</p>
                    <h3 className="mt-2 text-xl font-bold text-[var(--text-primary)]">Top scorers</h3>
                  </div>
                  <a
                    href="https://www.premierleague.com/stats/top/players/goals"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--color-primary)]"
                  >
                    Official
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <LeaderList leaders={scorerEntries} statLabel="goals" clubLookup={clubLookup} />
              </section>
            )}
          </aside>
        </div>

        {/* League-wide fixtures */}
        {(summary.recentFixtures.length > 0 || summary.upcomingFixtures.length > 0) && (
          <div className="grid gap-6 md:grid-cols-2">
            {summary.recentFixtures.length > 0 && (
              <SurfaceCard className="p-5 sm:p-6">
                <div className="border-b border-[var(--border-primary)] pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Recent slate</p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Latest results</h3>
                </div>
                <div className="mt-4 space-y-3">
                  {summary.recentFixtures.slice(0, 6).map((f) => (
                    <FixtureCard key={f.id} fixture={f} onOpenTeam={handleTeamChange} />
                  ))}
                </div>
              </SurfaceCard>
            )}
            {summary.upcomingFixtures.length > 0 && (
              <SurfaceCard className="p-5 sm:p-6">
                <div className="border-b border-[var(--border-primary)] pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Next up</p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Upcoming fixtures</h3>
                </div>
                <div className="mt-4 space-y-3">
                  {summary.upcomingFixtures.slice(0, 6).map((f) => (
                    <FixtureCard key={f.id} fixture={f} onOpenTeam={handleTeamChange} />
                  ))}
                </div>
              </SurfaceCard>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
