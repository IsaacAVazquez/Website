"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, CircleAlert, ExternalLink, Shield, Trophy, TrendingUp } from "lucide-react";
import {
  StatCard,
  MetricCard,
  CrestAvatar,
  TeamResultPill,
  FixtureCard,
  LeaderList,
  type LeaderEntry,
} from "@/components/football";
import type {
  PremierLeagueRouteState,
  PremierLeagueSummary,
  PremierLeagueTeamSnapshot,
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
  summary: PremierLeagueSummary;
  initialTeamSnapshot: PremierLeagueTeamSnapshot | null;
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
        color: "var(--home-haze)",
        borderColor: "color-mix(in srgb, var(--home-haze) 30%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-haze) 10%, var(--home-paper-alt))",
      };
    case "europa":
      return {
        color: "var(--color-warning)",
        borderColor: "color-mix(in srgb, var(--color-warning) 30%, var(--home-rule))",
        background: "color-mix(in srgb, var(--color-warning) 10%, var(--home-paper-alt))",
      };
    case "conference":
      return {
        color: "var(--color-success)",
        borderColor: "color-mix(in srgb, var(--color-success) 30%, var(--home-rule))",
        background: "color-mix(in srgb, var(--color-success) 10%, var(--home-paper-alt))",
      };
    case "relegation":
      return {
        color: "var(--color-error)",
        borderColor: "color-mix(in srgb, var(--color-error) 30%, var(--home-rule))",
        background: "color-mix(in srgb, var(--color-error) 10%, var(--home-paper-alt))",
      };
    default:
      return { color: "var(--home-ink-muted)", borderColor: "var(--home-rule)", background: "var(--home-paper-alt)" };
  }
}

function getZoneDotColor(zone: ReturnType<typeof getPLZone>): string {
  switch (zone) {
    case "champions": return "var(--home-haze)";
    case "europa": return "var(--color-warning)";
    case "conference": return "var(--color-success)";
    case "relegation": return "var(--color-error)";
    default: return "var(--home-rule)";
  }
}

function getTableRowStyle(isSelected: boolean): CSSProperties {
  if (isSelected) {
    return {
      borderColor: "color-mix(in srgb, var(--home-haze) 35%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-haze) 9%, var(--home-paper-alt))",
    };
  }
  return { borderColor: "var(--home-rule)", background: "var(--home-paper-alt)" };
}

function getViewButtonStyle(isActive: boolean): CSSProperties {
  if (isActive) {
    return {
      borderColor: "color-mix(in srgb, var(--home-haze) 35%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-haze) 9%, var(--home-paper-alt))",
      boxShadow: "var(--shadow-sm)",
    };
  }
  return { borderColor: "var(--home-rule)", background: "var(--home-paper-alt)" };
}

const LAST_UPDATED_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
});

function formatGeneratedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : LAST_UPDATED_FORMATTER.format(date);
}

async function fetchPremierLeagueTeamSnapshot(
  teamId: string,
  signal: AbortSignal
): Promise<PremierLeagueTeamSnapshot> {
  const response = await fetch(`/api/premier-league/teams/${teamId}`, { signal });
  const payload = (await response.json()) as PremierLeagueTeamSnapshot & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "Unable to load club snapshot.");
  }

  return payload;
}

export function PremierLeagueClient({
  initialState,
  summary,
  initialTeamSnapshot,
}: PremierLeagueClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const currentHref = `/premier-league${currentQuery ? `?${currentQuery}` : ""}`;
  const hasManagedParams = searchParams.get("view") !== null || searchParams.get("team") !== null;
  const routeState = hasManagedParams ? normalizePremierLeagueState(searchParams) : initialState;

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
  const [teamSnapshots, setTeamSnapshots] = useState<Record<string, PremierLeagueTeamSnapshot>>(
    () => (selectedTeamId && initialTeamSnapshot ? { [selectedTeamId]: initialTeamSnapshot } : {})
  );
  const [loadingTeamId, setLoadingTeamId] = useState<string | null>(null);
  const [teamSnapshotError, setTeamSnapshotError] = useState<string | null>(null);
  const teamSnapshot = selectedTeamId ? teamSnapshots[selectedTeamId] ?? null : null;
  const isTeamSnapshotLoading = loadingTeamId === selectedTeamId;

  useEffect(() => {
    if (!selectedTeamId) {
      setLoadingTeamId(null);
      setTeamSnapshotError(null);
      return;
    }

    if (teamSnapshots[selectedTeamId]) {
      setLoadingTeamId(null);
      setTeamSnapshotError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setLoadingTeamId(selectedTeamId);
    setTeamSnapshotError(null);

    fetchPremierLeagueTeamSnapshot(selectedTeamId, controller.signal)
      .then((snapshot) => {
        if (cancelled) {
          return;
        }

        setTeamSnapshots((current) => (
          current[selectedTeamId] ? current : { ...current, [selectedTeamId]: snapshot }
        ));
      })
      .catch((error: Error) => {
        if (!cancelled && error.name !== "AbortError") {
          setTeamSnapshotError(error.message || "Unable to load club snapshot.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTeamId((current) => (current === selectedTeamId ? null : current));
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedTeamId, teamSnapshots]);

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
  const scorersByClub = useMemo(() => groupLeadersByClub(scorerEntries), [scorerEntries]);

  const selectedZone = selectedRow ? getPLZone(selectedRow.position) : "midtable";
  const selectedClubStoryline = selectedRow
    ? getClubStoryline(selectedRow, {
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
    ? scorersByClub.get(selectedRow.team.id)?.[0]
    : undefined;
  const recentFixtures = (teamSnapshot?.recentFixtures ?? []).slice(0, 3);
  const upcomingFixtures = (teamSnapshot?.upcomingFixtures ?? []).slice(0, 3);
  const lastUpdated = formatGeneratedAt(summary.generatedAt);
  const [activeDetailTab, setActiveDetailTab] = useState<"club" | "fixtures" | "scorers">("club");

  return (
    <div className="home-page min-h-screen">
      <div className="home-shell home-section space-y-5 sm:space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="home-kicker mb-1">Football Data Tool</p>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--home-ink)] sm:text-3xl">
              Premier League Pulse
            </h1>
            <p className="mt-1 max-w-[52ch] text-sm leading-6 text-[var(--home-ink-muted)]">
              Where does the title race actually stand? Points gaps to the top four, European qualification line, and relegation pressure, refreshed weekly from live data.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px] text-[var(--home-ink-muted)]">
            {[
              `Season ${summary.competition?.seasonLabel ?? "2025/26"}`,
              summary.competition?.currentMatchday ? `Matchday ${summary.competition.currentMatchday}` : null,
              `Updated ${lastUpdated}`,
            ].filter(Boolean).map((label) => (
              <span key={label} className="rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 py-1 font-medium">
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Key gaps */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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

        {/* Main standings + sidebar */}
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Standings */}
          <section className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-5 sm:p-6 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between border-b border-[var(--home-rule)] pb-4">
              <h2 className="text-lg font-bold text-[var(--home-ink)]">Standings</h2>
              <span className="text-sm text-[var(--home-ink-muted)]">{visibleStandings.length} clubs</span>
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
                    <span className="text-[var(--home-ink)]">{PREMIER_LEAGUE_VIEW_LABELS[key]}</span>
                    <span className="text-xs text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">{count}</span>
                  </button>
                );
              })}
            </div>

            <div
              className="scroll-shadow-x mt-6 overflow-x-auto"
              role="region"
              aria-label="Premier League standings (scrollable)"
              tabIndex={0}
            >
              <table className="min-w-full border-separate border-spacing-y-2" aria-label="Premier League standings">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.14em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                    <th className="px-3 py-2 font-semibold">Pos</th>
                    <th className="px-3 py-2 font-semibold">Club</th>
                    <th className="hidden px-3 py-2 font-semibold sm:table-cell">Record</th>
                    <th className="px-3 py-2 font-semibold">Pts</th>
                    <th className="hidden px-3 py-2 font-semibold md:table-cell">PPG</th>
                    <th className="hidden px-3 py-2 font-semibold lg:table-cell">GF</th>
                    <th className="hidden px-3 py-2 font-semibold lg:table-cell">GA</th>
                    <th className="px-3 py-2 font-semibold">GD</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleStandings.map((row) => {
                    const isSelected = row.team.id === selectedTeamId;
                    const zone = getPLZone(row.position);
                    return (
                      <tr
                        key={row.team.id}
                        className="border border-[var(--home-rule)]"
                        style={getTableRowStyle(isSelected)}
                      >
                        <td className="rounded-l-2xl px-3 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: getZoneDotColor(zone) }}
                              title={getZoneLabel(zone)}
                            />
                            <span className="text-sm font-semibold text-[var(--home-ink)]">{row.position}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <button
                            type="button"
                            onClick={() => handleTeamChange(row.team.id)}
                            aria-pressed={isSelected}
                            aria-label={`Show ${row.team.name} details`}
                            className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-1 text-left transition-colors hover:bg-[var(--home-paper-alt)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--home-haze)]"
                          >
                            <CrestAvatar crest={row.team.crest} name={row.team.shortName} size="sm" />
                            <span className="font-semibold text-[var(--home-ink)]">{row.team.shortName}</span>
                          </button>
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] sm:table-cell">
                          {row.won}-{row.draw}-{row.lost}
                        </td>
                        <td className="px-3 py-3 align-middle text-sm font-semibold text-[var(--home-ink)]">
                          {row.points}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] md:table-cell">
                          {formatFixed(row.points / row.playedGames)}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] lg:table-cell">
                          {row.goalsFor}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] lg:table-cell">
                          {row.goalsAgainst}
                        </td>
                        <td className="rounded-r-2xl px-3 py-3 align-middle text-sm font-medium text-[var(--home-ink)]">
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Compact club sidebar */}
          <aside className="md:sticky md:top-28 md:self-start">
            {selectedRow ? (
              <section className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-5 shadow-[var(--shadow-sm)]" aria-live="polite" data-testid="pl-selected-club">
                <div className="flex items-start gap-3">
                  <CrestAvatar crest={selectedRow.team.crest} name={selectedRow.team.shortName} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-bold text-[var(--home-ink)]">{selectedRow.team.name}</h2>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span
                        className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                        style={getZonePillStyle(selectedZone)}
                      >
                        {getZoneLabel(selectedZone)}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                        {selectedRow.points} pts
                      </span>
                      <span className="inline-flex items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                        {38 - selectedRow.playedGames} left
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 rounded-xl bg-[var(--home-haze)] px-3 py-2 text-center text-[var(--home-paper)] shadow-sm">
                    <p className="text-[10px] uppercase tracking-[0.14em] opacity-80">Pos</p>
                    <p className="text-xl font-bold">{selectedRow.position}</p>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[var(--home-rule)] pt-4">
                  {([
                    ["PPG", formatFixed(selectedRow.points / selectedRow.playedGames)],
                    ["Record", `${selectedRow.won}-${selectedRow.draw}-${selectedRow.lost}`],
                    ["Attack", `#${attackRankings.get(selectedRow.team.id) ?? "—"}`],
                    ["Defense", `#${defenseRankings.get(selectedRow.team.id) ?? "—"}`],
                    ["GF/m", formatFixed(selectedRow.goalsFor / selectedRow.playedGames)],
                    ["GA/m", formatFixed(selectedRow.goalsAgainst / selectedRow.playedGames)],
                  ] as const).map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">{label}</dt>
                      <dd className="text-sm font-bold text-[var(--home-ink)]">{value}</dd>
                    </div>
                  ))}
                </dl>

                {teamSnapshot && teamSnapshot.form.sequence.length > 0 && (
                  <div className="mt-4 border-t border-[var(--home-rule)] pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">Form</p>
                    <div className="mt-2 flex gap-1.5">
                      {teamSnapshot.form.sequence.map((result, i) => (
                        <TeamResultPill key={`${result}-${i}`} result={result} />
                      ))}
                    </div>
                  </div>
                )}

                {selectedClubStoryline ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--home-ink-muted)]">
                    {selectedClubStoryline}
                  </p>
                ) : null}

                {!teamSnapshot && (isTeamSnapshotLoading || teamSnapshotError) ? (
                  <p className="mt-4 border-t border-[var(--home-rule)] pt-4 text-sm text-[var(--home-ink-muted)]">
                    {isTeamSnapshotLoading
                      ? "Loading club snapshot…"
                      : teamSnapshotError}
                  </p>
                ) : null}
              </section>
            ) : null}
          </aside>
        </div>

        {/* Tabbed detail strip */}
        <div className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-5 sm:p-6 shadow-[var(--shadow-sm)]">
          <div
            className="flex gap-2 overflow-x-auto rounded-[24px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-1.5"
            role="tablist"
            aria-label="Club and league details"
          >
            {(["club", "fixtures", "scorers"] as const).map((tab) => {
              const labels = { club: "Club Detail", fixtures: "Fixtures", scorers: "Top Scorers" } as const;
              return (
                <button
                  key={tab}
                  role="tab"
                  type="button"
                  aria-selected={activeDetailTab === tab}
                  onClick={() => setActiveDetailTab(tab)}
                  className={`min-h-[44px] whitespace-nowrap rounded-2xl px-5 py-2.5 text-sm font-semibold transition-colors ${
                    activeDetailTab === tab
                      ? "bg-[var(--home-haze)] text-white shadow-sm"
                      : "text-[var(--home-ink-muted)] hover:bg-[var(--home-paper-alt)] hover:text-[var(--home-ink)]"
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          <div role="tabpanel" className="mt-6">
            {activeDetailTab === "club" && selectedRow && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">Performance</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <MetricCard label="PPG" value={formatFixed(selectedRow.points / selectedRow.playedGames)} />
                      <MetricCard label="Record" value={`${selectedRow.won}-${selectedRow.draw}-${selectedRow.lost}`} />
                      <MetricCard label="Attack rank" value={`#${attackRankings.get(selectedRow.team.id) ?? "—"}`} />
                      <MetricCard label="Defense rank" value={`#${defenseRankings.get(selectedRow.team.id) ?? "—"}`} />
                      <MetricCard label="GF / match" value={formatFixed(selectedRow.goalsFor / selectedRow.playedGames)} />
                      <MetricCard label="GA / match" value={formatFixed(selectedRow.goalsAgainst / selectedRow.playedGames)} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
                    <p className="text-sm font-semibold text-[var(--home-ink)]">Pressure points</p>
                    <ul className="mt-3 space-y-2 pl-5 text-sm leading-relaxed text-[var(--home-ink-muted)]">
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
                    <p className="text-sm leading-relaxed text-[var(--home-ink-muted)]">
                      {selectedClubStoryline}
                    </p>
                  ) : null}
                </div>

                {!teamSnapshot && (isTeamSnapshotLoading || teamSnapshotError) && (
                  <div className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
                    <p className="text-sm text-[var(--home-ink-muted)]">
                      {isTeamSnapshotLoading
                        ? "Loading recent club fixtures…"
                        : teamSnapshotError}
                    </p>
                  </div>
                )}

                {recentFixtures.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">Recent results</p>
                    <div className="mt-3 space-y-2">
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">Upcoming fixtures</p>
                    <div className="mt-3 space-y-2">
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
            )}

            {activeDetailTab === "fixtures" && (
              <div className="grid gap-6 md:grid-cols-2">
                {summary.recentFixtures.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">Recent slate</p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">Latest results</h3>
                    <div className="mt-4 space-y-3">
                      {summary.recentFixtures.slice(0, 8).map((f) => (
                        <FixtureCard key={f.id} fixture={f} onOpenTeam={handleTeamChange} />
                      ))}
                    </div>
                  </div>
                )}
                {summary.upcomingFixtures.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">Next up</p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">Upcoming fixtures</h3>
                    <div className="mt-4 space-y-3">
                      {summary.upcomingFixtures.slice(0, 8).map((f) => (
                        <FixtureCard key={f.id} fixture={f} onOpenTeam={handleTeamChange} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === "scorers" && scorerEntries.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">Goals leaderboard</p>
                      <h3 className="mt-2 text-xl font-bold text-[var(--home-ink)]">Top scorers</h3>
                    </div>
                    <a
                      href="https://www.premierleague.com/stats/top/players/goals"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-2 text-sm font-medium text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-haze)]"
                    >
                      Official
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <LeaderList leaders={scorerEntries.slice(0, 5)} statLabel="goals" clubLookup={clubLookup} />
                </div>
                {scorerEntries.length > 5 && (
                  <div>
                    <LeaderList leaders={scorerEntries.slice(5, 10)} statLabel="goals" clubLookup={clubLookup} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <section className="rounded-3xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-5 text-sm text-[var(--home-ink-muted)] shadow-sm">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-warning)]" />
            <p className="mb-0 max-w-none leading-relaxed">
              This page is a checked-in football-data.org snapshot rather than a live feed. Standings, club form, and fixture cards refresh from the local dataset shipped with the app.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function ClubLeaderCard({
  title,
  leader,
  statLabel,
  emptyLabel,
}: {
  title: string;
  leader?: LeaderEntry;
  statLabel: string;
  emptyLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
        {title}
      </p>
      {leader ? (
        <>
          <p className="mt-2 text-lg font-bold text-[var(--home-ink)]">{leader.name}</p>
          <p className="mt-1 text-sm text-[var(--home-ink-muted)]">
            {leader.total} {statLabel.toLowerCase()} in {leader.appearances} matches
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
            {formatFixed(leader.perMatch)} per match
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-[var(--home-ink-muted)]">{emptyLabel}</p>
      )}
    </div>
  );
}

function groupLeadersByClub(leaders: LeaderEntry[]) {
  return leaders.reduce((map, leaderEntry) => {
    const existing = map.get(leaderEntry.clubId) ?? [];
    existing.push(leaderEntry);
    map.set(leaderEntry.clubId, existing);
    return map;
  }, new Map<string, LeaderEntry[]>());
}

function getClubStoryline(
  club: PremierLeagueStandingRow,
  context: {
    leader: PremierLeagueStandingRow | null;
    runnerUp: PremierLeagueStandingRow | null;
    fifthPlace: PremierLeagueStandingRow | null;
    seventhPlace: PremierLeagueStandingRow | null;
    sixthPlace: PremierLeagueStandingRow | null;
    safetyLine: PremierLeagueStandingRow | null;
    dropLine: PremierLeagueStandingRow | null;
  }
) {
  const { leader, runnerUp, fifthPlace, seventhPlace, sixthPlace, safetyLine, dropLine } = context;

  if (club.position === 1 && runnerUp) {
    return `${club.team.shortName} lead the table, carry one of the league's sharpest attacks, and sit ${club.points - runnerUp.points} points clear of ${runnerUp.team.shortName}.`;
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
      `${club.goalsFor} goals scored keeps them among the league's best attacks.`,
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
