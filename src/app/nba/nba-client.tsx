"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  CircleAlert,
  ExternalLink,
  Shield,
  Trophy,
} from "lucide-react";
import {
  StatCard,
  MetricCard,
  CrestAvatar,
  TeamResultPill,
  FixtureCard,
  LeaderList,
} from "@/components/football";
import type {
  NbaLeader,
  NbaRouteState,
  NbaSummarySnapshot,
  NbaTeam,
  NbaTeamSnapshot,
  NbaView,
} from "@/types/nba";
import {
  buildNbaHref,
  canonicalizeNbaTeamId,
  DEFAULT_NBA_STATE,
  filterTeamsForView,
  getDefaultTeamForView,
  NBA_ROUTE,
  normalizeNbaState,
} from "./nba-state";

interface NbaClientProps {
  initialState: NbaRouteState;
  summary: NbaSummarySnapshot;
  initialTeamSnapshot: NbaTeamSnapshot | null;
}

const REGULAR_SEASON_GAMES = 82;

const viewOptions: Array<{ id: NbaView; label: string; description: string }> = [
  { id: "east", label: "Eastern Conference", description: "All 15 teams in the East." },
  { id: "west", label: "Western Conference", description: "All 15 teams in the West." },
  { id: "playoff", label: "Playoff seeds", description: "Top six teams in each conference." },
  { id: "play-in", label: "Play-in race", description: "Seeds 7-10 in each conference." },
];

async function fetchNbaTeamSnapshot(
  teamId: string,
  signal: AbortSignal
): Promise<NbaTeamSnapshot> {
  const response = await fetch(`/api/nba/teams/${teamId}`, { signal });
  const payload = (await response.json()) as NbaTeamSnapshot & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Unable to load team snapshot.");
  }
  return payload;
}

export function NbaClient({ initialState, summary, initialTeamSnapshot }: NbaClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const currentHref = `${NBA_ROUTE}${currentQuery ? `?${currentQuery}` : ""}`;

  const allTeams = useMemo<NbaTeam[]>(
    () => [...summary.teamsByConference.east, ...summary.teamsByConference.west],
    [summary.teamsByConference]
  );
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
  const logoByTeamId = useMemo(
    () =>
      new Map(
        summary.teams.map((team) => [
          canonicalizeNbaTeamId(team.id) ?? team.id,
          team.logo,
        ] as const)
      ),
    [summary.teams]
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
  const routeState = hasManagedParams ? normalizeNbaState(searchParams) : initialState;
  const visibleTeams = filterTeamsForView(routeState.view);
  const selectedTeamId = visibleTeams.some((team) => team.id === routeState.team)
    ? routeState.team
    : getDefaultTeamForView(routeState.view);
  const fallbackTeam = allTeams[0];
  const selectedTeam = teamById.get(selectedTeamId) ?? fallbackTeam;

  const [teamSnapshots, setTeamSnapshots] = useState<Record<string, NbaTeamSnapshot>>(
    () => (selectedTeamId && initialTeamSnapshot ? { [selectedTeamId]: initialTeamSnapshot } : {})
  );
  const [loadingTeamId, setLoadingTeamId] = useState<string | null>(null);
  const [teamSnapshotError, setTeamSnapshotError] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<"team" | "schedule" | "leaders">("team");
  const teamSnapshot = selectedTeam ? teamSnapshots[selectedTeam.id] ?? null : null;
  const isTeamSnapshotLoading = selectedTeam ? loadingTeamId === selectedTeam.id : false;
  const desiredHref = buildNbaHref(
    { view: routeState.view, team: selectedTeamId },
    searchParams
  );

  useEffect(() => {
    if (currentHref === desiredHref) return;
    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  function navigate(nextState: NbaRouteState) {
    const href = buildNbaHref(nextState, searchParams);
    if (href === currentHref) return;
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function handleViewChange(view: NbaView) {
    const nextTeams = filterTeamsForView(view);
    const nextTeam = nextTeams.some((team) => team.id === selectedTeamId)
      ? selectedTeamId
      : nextTeams[0]?.id ?? DEFAULT_NBA_STATE.team;
    navigate({ view, team: nextTeam });
  }

  function handleTeamChange(teamId: string) {
    navigate({
      view: routeState.view,
      team: canonicalizeNbaTeamId(teamId) ?? DEFAULT_NBA_STATE.team,
    });
  }

  useEffect(() => {
    if (!selectedTeam) return;
    if (teamSnapshots[selectedTeam.id]) {
      setLoadingTeamId(null);
      setTeamSnapshotError(null);
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    setLoadingTeamId(selectedTeam.id);
    setTeamSnapshotError(null);
    fetchNbaTeamSnapshot(selectedTeam.id, controller.signal)
      .then((snapshot) => {
        if (cancelled) return;
        setTeamSnapshots((current) =>
          current[selectedTeam.id] ? current : { ...current, [selectedTeam.id]: snapshot }
        );
      })
      .catch((error: Error) => {
        if (!cancelled && error.name !== "AbortError") {
          setTeamSnapshotError(error.message || "Unable to load team snapshot.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTeamId((current) => (current === selectedTeam.id ? null : current));
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedTeam, teamSnapshots]);

  if (!selectedTeam) {
    return (
      <div className="home-page min-h-screen">
        <div className="home-shell home-section space-y-5 sm:space-y-6">
          <p className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-5 text-sm text-[var(--home-ink-muted)]">
            NBA snapshot data is empty. Run <code>npm run update:nba</code> to fetch the latest standings.
          </p>
        </div>
      </div>
    );
  }

  const eastTeams = summary.teamsByConference.east;
  const westTeams = summary.teamsByConference.west;
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
  const formSequence = teamSnapshot?.form?.sequence ?? [];
  const recentFixtures = (teamSnapshot?.recentFixtures ?? []).slice(0, 3);
  const upcomingFixtures = (teamSnapshot?.upcomingFixtures ?? []).slice(0, 3);
  const remainingGames = Math.max(0, REGULAR_SEASON_GAMES - selectedTeam.gamesPlayed);

  const eastTop = eastTeams[0];
  const eastSixth = eastTeams[5];
  const eastSeventh = eastTeams[6];
  const eastTenth = eastTeams[9];
  const eastEleventh = eastTeams[10];
  const westTop = westTeams[0];
  const westSixth = westTeams[5];
  const westTenth = westTeams[9];
  const westEleventh = westTeams[10];

  return (
    <div className="home-page min-h-screen">
      <div className="home-shell home-section space-y-5 sm:space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="home-kicker mb-1">Basketball Data Tool</p>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--home-ink)] sm:text-3xl">
              NBA Pulse
            </h1>
            <p className="mt-1 max-w-[52ch] text-sm leading-6 text-[var(--home-ink-muted)]">
              Conference standings compressed into one view. Top-six seeding, play-in pressure, and league stat leaders refreshed from the latest snapshot.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px] text-[var(--home-ink-muted)]">
            {[
              `Season ${summary.season}`,
              `${eastTeams.length + westTeams.length} teams`,
              `Snapshot ${snapshotDateLabel}`,
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

        {/* Key conference gaps */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {eastTop ? (
            <StatCard
              variant="compact"
              eyebrow="East leader"
              metric={`${eastTop.shortName} · ${eastTop.wins}-${eastTop.losses}`}
              detail={
                eastSixth
                  ? `${eastTop.wins - eastSixth.wins} games up on the playoff cutoff`
                  : "Top of the Eastern Conference"
              }
              icon={<Trophy className="h-4 w-4" />}
            />
          ) : null}
          {westTop ? (
            <StatCard
              variant="compact"
              eyebrow="West leader"
              metric={`${westTop.shortName} · ${westTop.wins}-${westTop.losses}`}
              detail={
                westSixth
                  ? `${westTop.wins - westSixth.wins} games up on the playoff cutoff`
                  : "Top of the Western Conference"
              }
              icon={<Trophy className="h-4 w-4" />}
            />
          ) : null}
          {eastSixth && eastSeventh ? (
            <StatCard
              variant="compact"
              eyebrow="East playoff line"
              metric={`+${eastSixth.wins - eastSeventh.wins} games`}
              detail={`${eastSixth.shortName} over ${eastSeventh.shortName}`}
              icon={<BarChart3 className="h-4 w-4" />}
            />
          ) : null}
          {westTenth && westEleventh ? (
            <StatCard
              variant="compact"
              eyebrow="West play-in line"
              metric={`+${westTenth.wins - westEleventh.wins} games`}
              detail={`${westTenth.shortName} over ${westEleventh.shortName}`}
              icon={<Shield className="h-4 w-4" />}
            />
          ) : eastTenth && eastEleventh ? (
            <StatCard
              variant="compact"
              eyebrow="East play-in line"
              metric={`+${eastTenth.wins - eastEleventh.wins} games`}
              detail={`${eastTenth.shortName} over ${eastEleventh.shortName}`}
              icon={<Shield className="h-4 w-4" />}
            />
          ) : null}
        </div>

        {/* Standings + sidebar */}
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-5 sm:p-6 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between border-b border-[var(--home-rule)] pb-4">
              <h2 className="text-lg font-bold text-[var(--home-ink)]">Standings</h2>
              <span className="text-sm text-[var(--home-ink-muted)]">{visibleTeams.length} teams</span>
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
                      {filterTeamsForView(option.id).length}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className="scroll-shadow-x mt-6 overflow-x-auto"
              role="region"
              aria-label="NBA standings (scrollable)"
              tabIndex={0}
            >
              <table className="min-w-full border-separate border-spacing-y-2" aria-label="NBA standings">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.14em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                    <th className="px-3 py-2 font-semibold">Seed</th>
                    <th className="px-3 py-2 font-semibold">Team</th>
                    <th className="hidden px-3 py-2 font-semibold sm:table-cell">Record</th>
                    <th className="px-3 py-2 font-semibold">W%</th>
                    <th className="hidden px-3 py-2 font-semibold md:table-cell">GB</th>
                    <th className="hidden px-3 py-2 font-semibold lg:table-cell">PF</th>
                    <th className="hidden px-3 py-2 font-semibold lg:table-cell">PA</th>
                    <th className="px-3 py-2 font-semibold">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTeams.map((team) => {
                    const isSelected = team.id === selectedTeam.id;
                    const zone = getTeamZone(team.conferenceSeed);

                    return (
                      <tr
                        key={`${team.conference}-${team.id}`}
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
                            <span className="text-sm font-semibold text-[var(--home-ink)]">
                              {team.conferenceSeed}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <button
                            type="button"
                            onClick={() => handleTeamChange(team.id)}
                            aria-pressed={isSelected}
                            aria-label={`Show ${team.name} details`}
                            className="flex min-h-[44px] w-full items-center gap-2 rounded-xl text-left"
                          >
                            <CrestAvatar
                              crest={logoByTeamId.get(team.id) ?? null}
                              name={team.shortName}
                              size="sm"
                            />
                            <span className="font-semibold text-[var(--home-ink)]">{team.shortName}</span>
                            <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                              {team.conference === "east" ? "E" : "W"}
                            </span>
                          </button>
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] sm:table-cell">
                          {team.wins}-{team.losses}
                        </td>
                        <td className="px-3 py-3 align-middle text-sm font-semibold text-[var(--home-ink)]">
                          {team.winPercent ? team.winPercent.toFixed(3).replace(/^0/, "") : "—"}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] md:table-cell">
                          {formatGamesBack(team.gamesBack)}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] lg:table-cell">
                          {team.pointsFor.toFixed(1)}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] lg:table-cell">
                          {team.pointsAgainst.toFixed(1)}
                        </td>
                        <td className="rounded-r-2xl px-3 py-3 align-middle text-sm font-medium text-[var(--home-ink)]">
                          {formatPointDiff(team.pointDifferential)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Compact team sidebar */}
          <aside className="md:sticky md:top-28 md:self-start">
            <section
              className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-5 shadow-[var(--shadow-sm)]"
              aria-live="polite"
              data-testid="nba-selected-team"
            >
              <div className="flex items-start gap-3">
                <CrestAvatar
                  crest={logoByTeamId.get(selectedTeam.id) ?? null}
                  name={selectedTeam.name}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-bold text-[var(--home-ink)]">
                    {selectedTeam.name}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span
                      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                      style={getZonePillStyle(selectedZone)}
                    >
                      {getZoneLabel(selectedZone)}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                      {selectedTeam.wins}-{selectedTeam.losses}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                      {remainingGames} left
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 rounded-xl bg-[var(--home-haze)] px-3 py-2 text-center text-[var(--home-paper)] shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.14em] opacity-80">Seed</p>
                  <p className="text-xl font-bold">{selectedTeam.conferenceSeed}</p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[var(--home-rule)] pt-4">
                {(
                  [
                    [
                      "Win %",
                      selectedTeam.winPercent
                        ? selectedTeam.winPercent.toFixed(3).replace(/^0/, "")
                        : "—",
                    ],
                    ["GB", formatGamesBack(selectedTeam.gamesBack)],
                    ["Offense", `#${teamRanks.offense}`],
                    ["Defense", `#${teamRanks.defense}`],
                    ["PF/g", selectedTeam.pointsFor.toFixed(1)],
                    ["PA/g", selectedTeam.pointsAgainst.toFixed(1)],
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

              {formSequence.length > 0 && (
                <div className="mt-4 border-t border-[var(--home-rule)] pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                    Form
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    {formSequence.slice(-5).map((result, i) => (
                      <TeamResultPill key={i} result={result} />
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--home-ink-muted)]">
                {teamStoryline}
              </p>

              {!teamSnapshot && (isTeamSnapshotLoading || teamSnapshotError) ? (
                <p
                  className="mt-4 border-t border-[var(--home-rule)] pt-4 text-sm text-[var(--home-ink-muted)]"
                  role={teamSnapshotError ? "alert" : "status"}
                  aria-live="polite"
                >
                  {isTeamSnapshotLoading ? "Loading team snapshot…" : teamSnapshotError}
                </p>
              ) : null}
            </section>
          </aside>
        </div>

        {/* Tabbed detail strip */}
        <div className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-5 sm:p-6 shadow-[var(--shadow-sm)]">
          <div
            className="flex gap-2 overflow-x-auto rounded-[24px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-1.5"
            role="tablist"
            aria-label="Team and league details"
          >
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
            id="nba-detail-panel"
            role="tabpanel"
            aria-labelledby={`nba-detail-tab-${activeDetailTab}`}
            className="mt-6"
          >
            {activeDetailTab === "team" && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                      Performance
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <MetricCard
                        label="Win %"
                        value={
                          selectedTeam.winPercent
                            ? selectedTeam.winPercent.toFixed(3).replace(/^0/, "")
                            : "—"
                        }
                      />
                      <MetricCard label="Record" value={`${selectedTeam.wins}-${selectedTeam.losses}`} />
                      <MetricCard label="Offense rank" value={`#${teamRanks.offense}`} />
                      <MetricCard label="Defense rank" value={`#${teamRanks.defense}`} />
                      <MetricCard label="PF / game" value={selectedTeam.pointsFor.toFixed(1)} />
                      <MetricCard label="PA / game" value={selectedTeam.pointsAgainst.toFixed(1)} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
                    <p className="text-sm font-semibold text-[var(--home-ink)]">Pressure points</p>
                    <ul className="mt-3 space-y-2 pl-5 text-sm leading-relaxed text-[var(--home-ink-muted)]">
                      {teamPressurePoints.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <TeamLeaderCard
                    title="Top scorer"
                    leader={teamScorers[0]}
                    statLabel="Points"
                    emptyLabel="No top-10 scorer for this team in the latest snapshot."
                  />

                  <p className="text-sm leading-relaxed text-[var(--home-ink-muted)]">
                    {teamStoryline}
                  </p>
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

                {recentFixtures.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                      Recent results
                    </p>
                    <div className="mt-3 space-y-2">
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                      Upcoming games
                    </p>
                    <div className="mt-3 space-y-2">
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                      Recent slate
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">Latest results</h3>
                    <div className="mt-4 space-y-3">
                      {summary.recentFixtures.map((f) => (
                        <FixtureCard key={f.id} fixture={f} onOpenTeam={handleTeamChange} />
                      ))}
                    </div>
                  </div>
                )}
                {summary.upcomingFixtures.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                      Next up
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">Upcoming games</h3>
                    <div className="mt-4 space-y-3">
                      {summary.upcomingFixtures.map((f) => (
                        <FixtureCard key={f.id} fixture={f} onOpenTeam={handleTeamChange} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === "leaders" && (
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                        Points
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-[var(--home-ink)]">Top scorers</h3>
                    </div>
                    <a
                      href={summary.sourceUrls.leaders}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-2 text-sm font-medium text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-haze)]"
                    >
                      Official
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <LeaderList
                    leaders={toLeaderEntries(summary.scorers.slice(0, 5))}
                    statLabel="ppg"
                    clubLookup={teamLookup}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                    Rebounds
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-[var(--home-ink)]">Top rebounders</h3>
                  <LeaderList
                    leaders={toLeaderEntries(summary.rebounders.slice(0, 5))}
                    statLabel="rpg"
                    clubLookup={teamLookup}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                    Assists
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-[var(--home-ink)]">Top playmakers</h3>
                  <LeaderList
                    leaders={toLeaderEntries(summary.assistLeaders.slice(0, 5))}
                    statLabel="apg"
                    clubLookup={teamLookup}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <section className="rounded-3xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-5 text-sm text-[var(--home-ink-muted)] shadow-sm">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-warning)]" />
            <p className="mb-0 max-w-none leading-relaxed">
              This page is a curated snapshot rather than a live feed. Standings, scoreboard, and stat leaders are pulled from ESPN&apos;s public NBA endpoints by <code>npm run update:nba</code> and committed back into the repo.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function groupLeadersByTeam(leaders: NbaLeader[]) {
  return leaders.reduce((map, entry) => {
    const existing = map.get(entry.teamId) ?? [];
    existing.push(entry);
    map.set(entry.teamId, existing);
    return map;
  }, new Map<string, NbaLeader[]>());
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

function getZoneDotColor(zone: NbaZone): string {
  switch (zone) {
    case "playoff":
      return "var(--home-haze)";
    case "play-in":
      return "var(--color-warning)";
    case "lottery":
    default:
      return "var(--color-error)";
  }
}

function getZonePillStyle(zone: NbaZone): CSSProperties {
  switch (zone) {
    case "playoff":
      return {
        color: "var(--home-haze)",
        borderColor: "color-mix(in srgb, var(--home-haze) 30%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-haze) 10%, var(--home-paper-alt))",
      };
    case "play-in":
      return {
        color: "var(--color-warning)",
        borderColor: "color-mix(in srgb, var(--color-warning) 30%, var(--home-rule))",
        background: "color-mix(in srgb, var(--color-warning) 10%, var(--home-paper-alt))",
      };
    case "lottery":
    default:
      return {
        color: "var(--color-error)",
        borderColor: "color-mix(in srgb, var(--color-error) 30%, var(--home-rule))",
        background: "color-mix(in srgb, var(--color-error) 10%, var(--home-paper-alt))",
      };
  }
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
      `Net rating: ${formatPointDiff(team.pointDifferential)} per game.`,
      `${remaining} games remain on the schedule.`,
      `Offense rank #${ranks.offense} · Defense rank #${ranks.defense}.`,
    ];
  }
  if (seed <= 6 && topSeed && seventhSeed) {
    return [
      `${topSeed.wins - team.wins} games back from the conference top seed.`,
      `${team.wins - seventhSeed.wins} games clear of the play-in line.`,
      `Net rating: ${formatPointDiff(team.pointDifferential)} per game.`,
      `Offense rank #${ranks.offense} · Defense rank #${ranks.defense}.`,
    ];
  }
  if (seed <= 10 && sixthSeed && eleventhSeed) {
    return [
      `${sixthSeed.wins - team.wins} games short of a top-six seed.`,
      `${team.wins - eleventhSeed.wins} games above the lottery line.`,
      `Net rating: ${formatPointDiff(team.pointDifferential)} per game.`,
      `Offense rank #${ranks.offense} · Defense rank #${ranks.defense}.`,
    ];
  }
  return [
    tenthSeed ? `${tenthSeed.wins - team.wins} games back of the play-in.` : "Outside the play-in field.",
    `Net rating: ${formatPointDiff(team.pointDifferential)} per game.`,
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
    <div className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
        {title}
      </p>
      {leader ? (
        <>
          <p className="mt-2 text-lg font-bold text-[var(--home-ink)]">{leader.name}</p>
          <p className="mt-1 text-sm text-[var(--home-ink-muted)]">
            {leader.total.toFixed(1)} {statLabel.toLowerCase()} per game
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
            {leader.teamAbbreviation}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-[var(--home-ink-muted)]">{emptyLabel}</p>
      )}
    </div>
  );
}
