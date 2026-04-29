"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, CircleAlert, ExternalLink, Flame, TrendingUp, Trophy } from "lucide-react";
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
  buildMlbHref,
  canonicalizeMlbTeamId,
  DEFAULT_MLB_STATE,
  filterStandingsForView,
  getDefaultTeamForView,
  MLB_ROUTE,
  normalizeMlbState,
} from "./mlb-state";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const currentHref = `${MLB_ROUTE}${currentQuery ? `?${currentQuery}` : ""}`;

  const standings = summary.standings;
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
      }).format(new Date(summary.updatedAt)),
    [summary.updatedAt]
  );

  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("team") !== null;
  const routeState = hasManagedParams ? normalizeMlbState(searchParams) : initialState;
  const visibleStandings = filterStandingsForView(routeState.view);
  const selectedTeamId = visibleStandings.some((row) => row.id === routeState.team)
    ? routeState.team
    : getDefaultTeamForView(routeState.view);
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

  const desiredHref = buildMlbHref(
    { view: routeState.view, team: selectedTeamId },
    searchParams
  );

  useEffect(() => {
    if (currentHref === desiredHref) return;
    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  useEffect(() => {
    if (!selectedRow) return;
    if (teamSnapshots[selectedRow.id]) {
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
    const href = buildMlbHref(nextState, searchParams);
    if (href === currentHref) return;
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function handleViewChange(view: MlbView) {
    const next = filterStandingsForView(view);
    const nextTeam = next.some((row) => row.id === selectedTeamId)
      ? selectedTeamId
      : next[0]?.id ?? DEFAULT_MLB_STATE.team;
    navigate({ view, team: nextTeam });
  }

  function handleTeamChange(teamId: string) {
    navigate({
      view: routeState.view,
      team: canonicalizeMlbTeamId(teamId) ?? DEFAULT_MLB_STATE.team,
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
  const alLeader = useMemo(
    () =>
      [...standings]
        .filter((row) => row.league === "AL")
        .sort((a, b) => b.pct - a.pct || b.wins - a.wins)[0] ?? null,
    [standings]
  );
  const nlLeader = useMemo(
    () =>
      [...standings]
        .filter((row) => row.league === "NL")
        .sort((a, b) => b.pct - a.pct || b.wins - a.wins)[0] ?? null,
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

  const hasStandings = standings.length > 0 && standings.some((row) => row.wins + row.losses > 0);

  return (
    <div className="home-page min-h-screen">
      <div className="home-shell home-section space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="home-kicker mb-1">Baseball Data Tool</p>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--home-ink)] sm:text-3xl">
              MLB Pulse
            </h1>
            <p className="mt-1 max-w-[52ch] text-sm leading-6 text-[var(--home-ink-muted)]">
              Major League Baseball compressed into one view. Division standings, AL and NL splits, and the wild card race, refreshed from a curated MLB Stats API snapshot.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px] text-[var(--home-ink-muted)]">
            {[
              `Season ${summary.season}`,
              ...(summary.updatedAt && summary.updatedAt > "1970-01-02"
                ? [`Snapshot ${snapshotDateLabel}`]
                : []),
            ].map((label) => (
              <span
                key={label}
                className="rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 py-1 font-medium"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            variant="compact"
            eyebrow="Best record"
            metric={leagueLeader ? `${leagueLeader.shortName} · ${formatRecord(leagueLeader)}` : "—"}
            detail={leagueLeader ? `${formatFixed(leagueLeader.pct, 3)} W%` : "Awaiting standings"}
            icon={<Trophy className="h-4 w-4" />}
          />
          <StatCard
            variant="compact"
            eyebrow="AL leader"
            metric={alLeader ? `${alLeader.shortName} · ${formatRecord(alLeader)}` : "—"}
            detail={alLeader ? `${formatFixed(alLeader.pct, 3)} W%` : "Awaiting standings"}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            variant="compact"
            eyebrow="NL leader"
            metric={nlLeader ? `${nlLeader.shortName} · ${formatRecord(nlLeader)}` : "—"}
            detail={nlLeader ? `${formatFixed(nlLeader.pct, 3)} W%` : "Awaiting standings"}
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <StatCard
            variant="compact"
            eyebrow="Hottest streak"
            metric={hottest ? `${hottest.shortName} · ${hottest.streak}` : "—"}
            detail={hottest ? `Last 10: ${hottest.last10}` : "No active win streaks"}
            icon={<Flame className="h-4 w-4" />}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-5 sm:p-6 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between border-b border-[var(--home-rule)] pb-4">
              <h2 className="text-lg font-bold text-[var(--home-ink)]">Standings</h2>
              <span className="text-sm text-[var(--home-ink-muted)]">
                {visibleStandings.length} clubs
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {viewOptions.map((option) => {
                const isActive = option.id === routeState.view;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleViewChange(option.id)}
                    aria-pressed={isActive}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                    style={getViewButtonStyle(isActive)}
                  >
                    <span className="text-[var(--home-ink)]">{option.label}</span>
                    <span className="text-xs text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                      {filterStandingsForView(option.id).length}
                    </span>
                  </button>
                );
              })}
            </div>

            {!hasStandings && (
              <p className="mt-6 rounded-2xl border border-dashed border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4 text-sm text-[var(--home-ink-muted)]">
                The 30 clubs are listed below — win/loss data will appear once
                the next snapshot is published.
              </p>
            )}

            <div
              className="scroll-shadow-x mt-6 space-y-6 overflow-x-auto"
              role="region"
              aria-label="MLB standings (scrollable)"
              tabIndex={0}
            >
              {groupedStandings.map(([groupName, rows]) => (
                <div key={groupName}>
                  <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                    {groupName}
                  </p>
                  <table
                    className="mt-2 min-w-full border-separate border-spacing-y-2"
                    aria-label={`${groupName} standings`}
                  >
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.14em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                        <th className="px-3 py-2 font-semibold">Pos</th>
                        <th className="px-3 py-2 font-semibold">Team</th>
                        <th className="px-3 py-2 font-semibold">W-L</th>
                        <th className="hidden px-3 py-2 font-semibold sm:table-cell">PCT</th>
                        <th className="hidden px-3 py-2 font-semibold md:table-cell">GB</th>
                        <th className="hidden px-3 py-2 font-semibold lg:table-cell">RS</th>
                        <th className="hidden px-3 py-2 font-semibold lg:table-cell">RA</th>
                        <th className="hidden px-3 py-2 font-semibold xl:table-cell">L10</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const isSelected = row.id === selectedRow?.id;
                        const positionLabel =
                          routeState.view === "wildcard"
                            ? row.wildCardRank ?? row.divisionRank
                            : row.divisionRank;
                        return (
                          <tr
                            key={row.id}
                            className="border border-[var(--home-rule)]"
                            style={getTableRowStyle(isSelected)}
                          >
                            <td className="rounded-l-2xl px-3 py-3 align-middle">
                              <span className="text-sm font-semibold text-[var(--home-ink)]">
                                {positionLabel}
                              </span>
                            </td>
                            <td className="px-3 py-3 align-middle">
                              <button
                                type="button"
                                onClick={() => handleTeamChange(row.id)}
                                aria-pressed={isSelected}
                                aria-label={`Show ${row.name} details`}
                                className="flex min-h-[44px] w-full items-center gap-2 rounded-xl text-left"
                              >
                                <CrestAvatar
                                  crest={logoByTeamId.get(row.id) ?? null}
                                  name={row.shortName}
                                  size="sm"
                                />
                                <span className="font-semibold text-[var(--home-ink)]">
                                  {row.shortName}
                                </span>
                              </button>
                            </td>
                            <td className="px-3 py-3 align-middle text-sm font-semibold text-[var(--home-ink)]">
                              {formatRecord(row)}
                            </td>
                            <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] sm:table-cell">
                              {formatFixed(row.pct, 3)}
                            </td>
                            <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] md:table-cell">
                              {formatGamesBack(row.gamesBack)}
                            </td>
                            <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] lg:table-cell">
                              {row.runsScored}
                            </td>
                            <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] lg:table-cell">
                              {row.runsAllowed}
                            </td>
                            <td className="hidden rounded-r-2xl px-3 py-3 align-middle text-sm font-medium text-[var(--home-ink)] xl:table-cell">
                              {row.last10}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>

          <aside className="md:sticky md:top-28 md:self-start">
            <section
              className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-5 shadow-[var(--shadow-sm)]"
              aria-live="polite"
              data-testid="mlb-selected-team"
            >
              {selectedRow ? (
                <>
                  <div className="flex items-start gap-3">
                    <CrestAvatar
                      crest={logoByTeamId.get(selectedRow.id) ?? null}
                      name={selectedRow.name}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-bold text-[var(--home-ink)]">
                        {selectedRow.name}
                      </h2>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span
                          className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                          style={getDivisionPillStyle(selectedRow.league)}
                        >
                          {selectedRow.division || `${selectedRow.league} club`}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                          {formatRecord(selectedRow)}
                        </span>
                        {selectedRow.streak && (
                          <span className="inline-flex items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                            {selectedRow.streak}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 rounded-xl bg-[var(--home-haze)] px-3 py-2 text-center text-[var(--home-paper)] shadow-sm">
                      <p className="text-[10px] uppercase tracking-[0.14em] opacity-80">Div</p>
                      <p className="text-xl font-bold">{selectedRow.divisionRank || "—"}</p>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[var(--home-rule)] pt-4">
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
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                          {label}
                        </dt>
                        <dd className="text-sm font-bold text-[var(--home-ink)]">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  {(teamSnapshot?.form?.sequence?.length ?? 0) > 0 && (
                    <div className="mt-4 border-t border-[var(--home-rule)] pt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                        Last 5
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        {(teamSnapshot?.form.sequence ?? []).slice(-5).map((result, idx) => (
                          <TeamResultPill key={idx} result={result} />
                        ))}
                      </div>
                    </div>
                  )}

                  {!teamSnapshot && (isTeamSnapshotLoading || teamSnapshotError) ? (
                    <p
                      className="mt-4 border-t border-[var(--home-rule)] pt-4 text-sm text-[var(--home-ink-muted)]"
                      role={teamSnapshotError ? "alert" : "status"}
                      aria-live="polite"
                    >
                      {isTeamSnapshotLoading ? "Loading team snapshot…" : teamSnapshotError}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-[var(--home-ink-muted)]">Select a team to view detail.</p>
              )}
            </section>
          </aside>
        </div>

        <div className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-5 sm:p-6 shadow-[var(--shadow-sm)]">
          <div
            className="flex gap-2 overflow-x-auto rounded-[24px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-1.5"
            role="tablist"
            aria-label="Team and league details"
          >
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
                  tabIndex={activeDetailTab === tab ? 0 : -1}
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

          <div
            id="mlb-detail-panel"
            role="tabpanel"
            aria-labelledby={`mlb-detail-tab-${activeDetailTab}`}
            className="mt-6"
          >
            {activeDetailTab === "team" && selectedRow && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                      Performance
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <MetricCard label="W%" value={formatFixed(selectedRow.pct, 3)} />
                      <MetricCard label="Record" value={formatRecord(selectedRow)} />
                      <MetricCard label="Run diff" value={formatRunDiff(selectedRow.runDifferential)} />
                      <MetricCard label="Last 10" value={selectedRow.last10} />
                      <MetricCard
                        label="Offense rank"
                        value={`#${offenseRankByTeam.get(selectedRow.id) ?? "-"}`}
                      />
                      <MetricCard
                        label="Defense rank"
                        value={`#${defenseRankByTeam.get(selectedRow.id) ?? "-"}`}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
                    <p className="text-sm font-semibold text-[var(--home-ink)]">Pressure points</p>
                    <ul className="mt-3 space-y-2 pl-5 text-sm leading-relaxed text-[var(--home-ink-muted)]">
                      {getPressurePoints(selectedRow).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {selectedTeam?.venue && (
                    <p className="text-sm leading-relaxed text-[var(--home-ink-muted)]">
                      Home park: <span className="font-medium text-[var(--home-ink)]">{selectedTeam.venue}</span>.
                    </p>
                  )}
                </div>

                {!teamSnapshot && (isTeamSnapshotLoading || teamSnapshotError) && (
                  <div
                    className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4"
                    role={teamSnapshotError ? "alert" : "status"}
                    aria-live="polite"
                  >
                    <p className="text-sm text-[var(--home-ink-muted)]">
                      {isTeamSnapshotLoading ? "Loading recent team games…" : teamSnapshotError}
                    </p>
                  </div>
                )}

                {(teamSnapshot?.recentGames.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                      Recent results
                    </p>
                    <div className="mt-3 space-y-2">
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                      Upcoming games
                    </p>
                    <div className="mt-3 space-y-2">
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                      Recent slate
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">Latest results</h3>
                    <div className="mt-4 space-y-3">
                      {summary.recentGames.map((game) => (
                        <FixtureCard key={game.id} fixture={game} onOpenTeam={handleTeamChange} />
                      ))}
                    </div>
                  </div>
                )}
                {summary.upcomingGames.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                      Next up
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">Upcoming games</h3>
                    <div className="mt-4 space-y-3">
                      {summary.upcomingGames.map((game) => (
                        <FixtureCard key={game.id} fixture={game} onOpenTeam={handleTeamChange} />
                      ))}
                    </div>
                  </div>
                )}
                {summary.recentGames.length === 0 && summary.upcomingGames.length === 0 && (
                  <p className="text-sm text-[var(--home-ink-muted)]">
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

        <section className="rounded-3xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-5 text-sm text-[var(--home-ink-muted)] shadow-sm">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-warning)]" />
            <p className="mb-0 max-w-none leading-relaxed">
              This page is a curated snapshot rather than a live API feed. Standings, schedule, and league leaders mirror the {summary.sourceLabel} endpoints and refresh on the regular update cadence.
            </p>
          </div>
        </section>
      </div>
    </div>
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
        <p className="text-sm text-[var(--home-ink-muted)]">
          League leader boards are not loaded yet. Run the snapshot script to populate hitting and pitching leaders.
        </p>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-2 text-sm font-medium text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-haze)]"
        >
          Source
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {populated.map((group) => (
        <div key={group.title}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                Leaderboard
              </p>
              <h3 className="mt-2 text-xl font-bold text-[var(--home-ink)]">{group.title}</h3>
            </div>
          </div>
          <LeaderList
            leaders={leadersToEntries(group.leaders, group.statLabel === "AVG" || group.statLabel === "ERA" ? 3 : 0)}
            statLabel={group.statLabel}
            clubLookup={teamLookup}
          />
        </div>
      ))}
    </div>
  );
}

function getDivisionPillStyle(league: "AL" | "NL"): CSSProperties {
  if (league === "AL") {
    return {
      color: "var(--home-haze)",
      borderColor: "color-mix(in srgb, var(--home-haze) 30%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-haze) 10%, var(--home-paper-alt))",
    };
  }
  return {
    color: "var(--color-success)",
    borderColor: "color-mix(in srgb, var(--color-success) 30%, var(--home-rule))",
    background: "color-mix(in srgb, var(--color-success) 10%, var(--home-paper-alt))",
  };
}

function getViewButtonStyle(isActive: boolean): CSSProperties {
  if (isActive) {
    return {
      borderColor: "color-mix(in srgb, var(--home-haze) 35%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-haze) 9%, var(--home-paper-alt))",
      boxShadow: "var(--shadow-sm)",
    };
  }
  return {
    borderColor: "var(--home-rule)",
    background: "var(--home-paper-alt)",
  };
}

function getTableRowStyle(isSelected: boolean): CSSProperties {
  if (isSelected) {
    return {
      borderColor: "color-mix(in srgb, var(--home-haze) 35%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-haze) 9%, var(--home-paper-alt))",
    };
  }
  return {
    borderColor: "var(--home-rule)",
    background: "var(--home-paper-alt)",
  };
}

function formatRunDiff(diff: number): string {
  if (!Number.isFinite(diff) || diff === 0) return "0";
  return diff > 0 ? `+${diff}` : `${diff}`;
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

