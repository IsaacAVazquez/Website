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
  Flag,
  Shield,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  StatCard,
  MetricCard,
  CrestAvatar,
  TeamResultPill,
  FixtureCard,
} from "@/components/football";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";
import {
  Article,
  Briefcase,
  Calendar,
  ChartBar,
  User,
} from "@/components/ui/ServerIcons";
import type {
  NFLLeader,
  NFLLeaderboards,
  NFLRouteState,
  NFLSummarySnapshot,
  NFLTeamSnapshot,
  NFLTeamStanding,
  NFLView,
} from "@/types/nfl";
import {
  buildNflHref,
  canonicalizeNflTeamId,
  DEFAULT_NFL_STATE,
  filterTeamsForView,
  getDefaultTeamForView,
  NFL_ROUTE,
  normalizeNflState,
} from "./nfl-state";

interface NflClientProps {
  initialState: NFLRouteState;
  summary: NFLSummarySnapshot;
  initialTeamSnapshot: NFLTeamSnapshot | null;
}

type LeaderCategory = keyof NFLLeaderboards;

const REGULAR_SEASON_GAMES = 17;

const VIEW_OPTIONS: Array<{
  id: NFLView;
  label: string;
  description: string;
}> = [
  {
    id: "league",
    label: "Full league",
    description: "All 32 teams sorted by conference seeding.",
  },
  {
    id: "afc",
    label: "AFC",
    description: "American Football Conference standings.",
  },
  {
    id: "nfc",
    label: "NFC",
    description: "National Football Conference standings.",
  },
  {
    id: "playoffs",
    label: "Playoff field",
    description: "The 14 teams that earned a postseason seed.",
  },
];

const LEADER_TABS: Array<{
  id: LeaderCategory;
  label: string;
  unit: string;
  unitLong: string;
}> = [
  { id: "passing", label: "Passing yards", unit: "yds", unitLong: "passing yards" },
  { id: "rushing", label: "Rushing yards", unit: "yds", unitLong: "rushing yards" },
  { id: "receiving", label: "Receiving yards", unit: "yds", unitLong: "receiving yards" },
  { id: "sacks", label: "Sacks", unit: "sk", unitLong: "sacks" },
];

async function fetchNflTeamSnapshot(
  teamId: string,
  signal: AbortSignal
): Promise<NFLTeamSnapshot> {
  const response = await fetch(`/api/nfl/teams/${teamId}`, { signal });
  const payload = (await response.json()) as NFLTeamSnapshot & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Unable to load team snapshot.");
  }
  return payload;
}

export function NflClient({
  initialState,
  summary,
  initialTeamSnapshot,
}: NflClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const currentHref = `${NFL_ROUTE}${currentQuery ? `?${currentQuery}` : ""}`;

  const teams = summary.teams;
  const teamById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const teamShortNameById = useMemo(
    () => new Map(teams.map((team) => [team.id, team.shortName])),
    [teams]
  );
  const logoByTeamId = useMemo(
    () => new Map(summary.teamOptions.map((option) => [option.id, option.logo])),
    [summary.teamOptions]
  );

  const offenseRankByTeam = useMemo(
    () =>
      new Map(
        teams
          .toSorted(
            (left, right) =>
              right.pointsFor - left.pointsFor ||
              right.winPct - left.winPct
          )
          .map((team, index) => [team.id, index + 1] as const)
      ),
    [teams]
  );
  const defenseRankByTeam = useMemo(
    () =>
      new Map(
        teams
          .toSorted(
            (left, right) =>
              left.pointsAgainst - right.pointsAgainst ||
              right.winPct - left.winPct
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
      }).format(new Date(summary.updatedAt)),
    [summary.updatedAt]
  );

  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("team") !== null;
  const routeState = hasManagedParams ? normalizeNflState(searchParams) : initialState;
  const visibleTeams = filterTeamsForView(routeState.view);
  const selectedTeamId = visibleTeams.some((team) => team.id === routeState.team)
    ? routeState.team
    : getDefaultTeamForView(routeState.view);
  const selectedTeam = teamById.get(selectedTeamId) ?? teams[0];
  const [teamSnapshots, setTeamSnapshots] = useState<Record<string, NFLTeamSnapshot>>(
    () =>
      selectedTeamId && initialTeamSnapshot
        ? { [selectedTeamId]: initialTeamSnapshot }
        : {}
  );
  const [loadingTeamId, setLoadingTeamId] = useState<string | null>(null);
  const [teamSnapshotError, setTeamSnapshotError] = useState<string | null>(null);
  const teamSnapshot = teamSnapshots[selectedTeam.id] ?? null;
  const isTeamSnapshotLoading = loadingTeamId === selectedTeam.id;
  const desiredHref = buildNflHref(
    {
      view: routeState.view,
      team: selectedTeamId,
    },
    searchParams
  );

  useEffect(() => {
    if (currentHref === desiredHref) return;
    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  function navigate(nextState: NFLRouteState) {
    const href = buildNflHref(nextState, searchParams);
    if (href === currentHref) return;
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function handleViewChange(view: NFLView) {
    const nextTeams = filterTeamsForView(view);
    const nextTeam = nextTeams.some((team) => team.id === selectedTeamId)
      ? selectedTeamId
      : nextTeams[0]?.id ?? DEFAULT_NFL_STATE.team;
    navigate({ view, team: nextTeam });
  }

  function handleTeamChange(teamId: string) {
    navigate({
      view: routeState.view,
      team: canonicalizeNflTeamId(teamId) ?? DEFAULT_NFL_STATE.team,
    });
  }

  useEffect(() => {
    if (teamSnapshots[selectedTeam.id]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset loading/error flags when cached snapshot exists for the selected team
      setLoadingTeamId(null);
      setTeamSnapshotError(null);
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    setLoadingTeamId(selectedTeam.id);
    setTeamSnapshotError(null);
    fetchNflTeamSnapshot(selectedTeam.id, controller.signal)
      .then((snapshot) => {
        if (cancelled) return;
        setTeamSnapshots((current) =>
          current[selectedTeam.id]
            ? current
            : { ...current, [selectedTeam.id]: snapshot }
        );
      })
      .catch((error: Error) => {
        if (!cancelled && error.name !== "AbortError") {
          setTeamSnapshotError(error.message || "Unable to load team snapshot.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTeamId((current) =>
            current === selectedTeam.id ? null : current
          );
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedTeam.id, teamSnapshots]);

  const conferenceContext = useMemo(() => buildConferenceContext(teams), [teams]);
  const teamStoryline = getTeamStoryline(selectedTeam, conferenceContext);
  const teamPressurePoints = getTeamPressurePoints(selectedTeam, {
    conferenceContext,
    offenseRankByTeam,
    defenseRankByTeam,
  });
  const selectedZone = getTeamZone(selectedTeam);
  const selectedTeamLeaders = collectLeadersForTeam(selectedTeam.id, summary.leaders);
  const formSequence = teamSnapshot?.form?.sequence ?? [];
  const recentFixtures = (teamSnapshot?.recentFixtures ?? []).slice(0, 3);
  const upcomingFixtures = (teamSnapshot?.upcomingFixtures ?? []).slice(0, 3);

  const [activeDetailTab, setActiveDetailTab] = useState<
    "team" | "fixtures" | "leaders"
  >("team");
  const [activeLeaderTab, setActiveLeaderTab] = useState<LeaderCategory>("passing");
  const activeLeaderMeta =
    LEADER_TABS.find((tab) => tab.id === activeLeaderTab) ?? LEADER_TABS[0];
  const activeLeaders = summary.leaders[activeLeaderTab] ?? [];

  const afcContext = conferenceContext.AFC;
  const nfcContext = conferenceContext.NFC;
  const afcTopSeed = afcContext.topSeed;
  const nfcTopSeed = nfcContext.topSeed;
  const afcCutoff = afcContext.lastIn;
  const afcFirstOut = afcContext.firstOut;
  const nfcCutoff = nfcContext.lastIn;
  const nfcFirstOut = nfcContext.firstOut;

  // Stats panel cells
  const passingLeader = summary.leaders.passing[0] ?? null;
  const rushingLeader = summary.leaders.rushing[0] ?? null;
  const receivingLeader = summary.leaders.receiving[0] ?? null;
  const totalRegSeasonWeeks = 18;

  const statsPanelCells: HomeStatsCell[] = [
    {
      label: "AFC #1 seed",
      tooltip: "Top seed in the American Football Conference and current record.",
      value: afcTopSeed ? `${afcTopSeed.shortName} · ${formatRecord(afcTopSeed)}` : "—",
      sub: afcTopSeed ? `${formatDifferential(afcTopSeed.pointDifferential)} pt diff` : undefined,
    },
    {
      label: "NFC #1 seed",
      tooltip: "Top seed in the National Football Conference and current record.",
      value: nfcTopSeed ? `${nfcTopSeed.shortName} · ${formatRecord(nfcTopSeed)}` : "—",
      sub: nfcTopSeed ? `${formatDifferential(nfcTopSeed.pointDifferential)} pt diff` : undefined,
    },
    {
      label: "AFC playoff cutoff",
      tooltip: "Last AFC team currently inside the playoff field and their record.",
      value: afcCutoff ? `${afcCutoff.shortName} · ${formatRecord(afcCutoff)}` : "—",
      sub: afcFirstOut
        ? `${Math.max(0, afcCutoff.wins - afcFirstOut.wins)} wins clear of ${afcFirstOut.shortName}`
        : undefined,
    },
    {
      label: "NFC playoff cutoff",
      tooltip: "Last NFC team currently inside the playoff field and their record.",
      value: nfcCutoff ? `${nfcCutoff.shortName} · ${formatRecord(nfcCutoff)}` : "—",
      sub: nfcFirstOut
        ? `${Math.max(0, nfcCutoff.wins - nfcFirstOut.wins)} wins clear of ${nfcFirstOut.shortName}`
        : undefined,
    },
    {
      label: "Passing leader",
      tooltip: "Player leading the league in passing yards this season.",
      value: passingLeader
        ? `${passingLeader.name} · ${passingLeader.total.toLocaleString()} yds`
        : "—",
      sub: passingLeader ? passingLeader.teamCode : undefined,
    },
    {
      label: "Rushing leader",
      tooltip: "Player leading the league in rushing yards this season.",
      value: rushingLeader
        ? `${rushingLeader.name} · ${rushingLeader.total.toLocaleString()} yds`
        : "—",
      sub: rushingLeader ? rushingLeader.teamCode : undefined,
    },
    {
      label: "Receiving leader",
      tooltip: "Player leading the league in receiving yards this season.",
      value: receivingLeader
        ? `${receivingLeader.name} · ${receivingLeader.total.toLocaleString()} yds`
        : "—",
      sub: receivingLeader ? receivingLeader.teamCode : undefined,
    },
    {
      label: "Through week",
      tooltip: "Most recently completed week within the regular season.",
      value: summary.week ? `Week ${summary.week} of ${totalRegSeasonWeeks}` : "Final regular season",
    },
  ];

  return (
    <div className="home-page min-h-screen">
      <div className="home-shell home-section space-y-5 sm:space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="home-kicker mb-1">NFL Data Tool</p>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--home-ink)] sm:text-3xl">
              NFL Pulse
            </h1>
            <p className="mt-1 max-w-[52ch] text-sm leading-6 text-[var(--home-ink-muted)]">
              The NFL season compressed into one view. Conference seedings, division leaders, the playoff cutoff, and stat leaders, refreshed from a curated NFLverse snapshot.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-2xs text-[var(--home-ink-muted)]">
            {[
              `Season ${summary.season}`,
              summary.week ? `Through Week ${summary.week}` : "Final regular season",
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

        {/* Dense stats panel */}
        <HomeStatsPanel
          id="nfl-stats-panel"
          title="NFL at a glance"
          meta={`Live · refreshed ${snapshotDateLabel}`}
          cells={statsPanelCells}
          pills={[
            { label: "AFC", href: "?view=afc", icon: ChartBar },
            { label: "NFC", href: "?view=nfc", icon: ChartBar },
            { label: "Playoff bracket", href: "?view=playoffs", icon: Briefcase },
            { label: "Stat leaders", href: "#nfl-standings", icon: User },
            { label: "Schedule", href: "#nfl-standings", icon: Calendar },
            { label: "Article", href: "/writing", icon: Article },
          ]}
        />

        {/* Key gaps */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            variant="compact"
            eyebrow="AFC #1 seed"
            metric={`${afcTopSeed.shortName} · ${formatRecord(afcTopSeed)}`}
            detail={`${formatDifferential(afcTopSeed.pointDifferential)} pt diff`}
            icon={<Trophy className="h-4 w-4" />}
          />
          <StatCard
            variant="compact"
            eyebrow="NFC #1 seed"
            metric={`${nfcTopSeed.shortName} · ${formatRecord(nfcTopSeed)}`}
            detail={`${formatDifferential(nfcTopSeed.pointDifferential)} pt diff`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            variant="compact"
            eyebrow="AFC playoff cutoff"
            metric={`${afcCutoff.shortName} · ${formatRecord(afcCutoff)}`}
            detail={
              afcFirstOut
                ? `${Math.max(0, afcCutoff.wins - afcFirstOut.wins)} wins clear of ${afcFirstOut.shortName}`
                : `Last AFC playoff team`
            }
            icon={<Shield className="h-4 w-4" />}
          />
          <StatCard
            variant="compact"
            eyebrow="NFC playoff cutoff"
            metric={`${nfcCutoff.shortName} · ${formatRecord(nfcCutoff)}`}
            detail={
              nfcFirstOut
                ? `${Math.max(0, nfcCutoff.wins - nfcFirstOut.wins)} wins clear of ${nfcFirstOut.shortName}`
                : `Last NFC playoff team`
            }
            icon={<BarChart3 className="h-4 w-4" />}
          />
        </div>

        {/* Main standings + sidebar */}
        <div id="nfl-standings" className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-5 sm:p-6 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between border-b border-[var(--home-rule)] pb-4">
              <h2 className="text-lg font-bold text-[var(--home-ink)]">Standings</h2>
              <span className="text-sm text-[var(--home-ink-muted)]">{visibleTeams.length} teams</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {VIEW_OPTIONS.map((option) => {
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
                    <span className="text-xs text-[var(--home-ink-soft)]">
                      {filterTeamsForView(option.id).length}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className="scroll-shadow-x mt-6 overflow-x-auto"
              role="region"
              aria-label="NFL standings (scrollable)"
              tabIndex={0}
            >
              <table className="min-w-full border-separate border-spacing-y-2" aria-label="NFL standings">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
                    <th scope="col" className="px-3 py-2 font-semibold">Seed</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Team</th>
                    <th scope="col" className="hidden px-3 py-2 font-semibold sm:table-cell">Record</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Pct</th>
                    <th scope="col" className="hidden px-3 py-2 font-semibold md:table-cell">Division</th>
                    <th scope="col" className="hidden px-3 py-2 font-semibold lg:table-cell">PF</th>
                    <th scope="col" className="hidden px-3 py-2 font-semibold lg:table-cell">PA</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTeams.map((team) => {
                    const isSelected = team.id === selectedTeam.id;
                    const zone = getTeamZone(team);
                    return (
                      <tr
                        key={team.id}
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
                              {team.seed ?? "—"}
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
                            <span className="font-semibold text-[var(--home-ink)]">
                              {team.shortName}
                            </span>
                          </button>
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] sm:table-cell">
                          {formatRecord(team)}
                        </td>
                        <td className="px-3 py-3 align-middle text-sm font-semibold text-[var(--home-ink)]">
                          {team.winPct.toFixed(3).replace(/^0/, "")}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] md:table-cell">
                          {team.division}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] lg:table-cell">
                          {team.pointsFor}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--home-ink-muted)] lg:table-cell">
                          {team.pointsAgainst}
                        </td>
                        <td className="rounded-r-2xl px-3 py-3 align-middle text-sm font-medium text-[var(--home-ink)]">
                          {formatDifferential(team.pointDifferential)}
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
              data-testid="nfl-selected-team"
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
                      className="inline-flex items-center rounded-full border px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.12em]"
                      style={getZonePillStyle(selectedZone)}
                    >
                      {getZoneLabel(selectedZone)}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                      {formatRecord(selectedTeam)}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                      {selectedTeam.division}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 rounded-xl bg-[var(--home-haze)] px-3 py-2 text-center text-[var(--home-paper)] shadow-sm">
                  <p className="text-3xs uppercase tracking-[0.14em] opacity-80">Seed</p>
                  <p className="text-xl font-bold">{selectedTeam.seed ?? "—"}</p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[var(--home-rule)] pt-4">
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
                    <dt className="text-2xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-soft)]">
                      {label}
                    </dt>
                    <dd className="text-sm font-bold text-[var(--home-ink)]">{value}</dd>
                  </div>
                ))}
              </dl>

              {formSequence.length > 0 && (
                <div className="mt-4 border-t border-[var(--home-rule)] pt-4">
                  <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-soft)]">
                    Form (last 5)
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    {formatTeamFormPills(formSequence.slice(-5)).map((result, i) => (
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
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveDetailTab(tab.id)}
                  className={`min-h-[44px] whitespace-nowrap rounded-2xl px-5 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-[var(--home-haze)] text-[var(--home-paper)] shadow-sm"
                      : "text-[var(--home-ink-muted)] hover:bg-[var(--home-paper-alt)] hover:text-[var(--home-ink)]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div
            id="nfl-detail-panel"
            role="tabpanel"
            aria-labelledby={`nfl-detail-tab-${activeDetailTab}`}
            className="mt-6"
          >
            {activeDetailTab === "team" && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">
                      Performance
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <MetricCard
                        label="Win %"
                        value={selectedTeam.winPct.toFixed(3).replace(/^0/, "")}
                      />
                      <MetricCard label="Record" value={formatRecord(selectedTeam)} />
                      <MetricCard
                        label="Offense rank"
                        value={`#${offenseRankByTeam.get(selectedTeam.id) ?? "-"}`}
                      />
                      <MetricCard
                        label="Defense rank"
                        value={`#${defenseRankByTeam.get(selectedTeam.id) ?? "-"}`}
                      />
                      <MetricCard
                        label="Points for"
                        value={`${selectedTeam.pointsFor}`}
                      />
                      <MetricCard
                        label="Points against"
                        value={`${selectedTeam.pointsAgainst}`}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
                    <p className="text-sm font-semibold text-[var(--home-ink)]">
                      Pressure points
                    </p>
                    <ul className="mt-3 space-y-2 pl-5 text-sm leading-relaxed text-[var(--home-ink-muted)]">
                      {teamPressurePoints.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <TeamLeaderCard
                      title="Top passer"
                      leader={selectedTeamLeaders.passing}
                      unitLong="passing yards"
                      emptyLabel="No passer in the league top 10."
                    />
                    <TeamLeaderCard
                      title="Top rusher"
                      leader={selectedTeamLeaders.rushing}
                      unitLong="rushing yards"
                      emptyLabel="No rusher in the league top 10."
                    />
                    <TeamLeaderCard
                      title="Top receiver"
                      leader={selectedTeamLeaders.receiving}
                      unitLong="receiving yards"
                      emptyLabel="No receiver in the league top 10."
                    />
                    <TeamLeaderCard
                      title="Sacks leader"
                      leader={selectedTeamLeaders.sacks}
                      unitLong="sacks"
                      emptyLabel="No defender in the league top 10."
                    />
                  </div>

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
                      {isTeamSnapshotLoading
                        ? "Loading recent team games…"
                        : teamSnapshotError}
                    </p>
                  </div>
                )}

                {recentFixtures.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">
                      Recent results
                    </p>
                    <div className="mt-3 space-y-2">
                      {recentFixtures.map((fixture) => (
                        <FixtureCard
                          periodLabel="Week"
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">
                      Upcoming games
                    </p>
                    <div className="mt-3 space-y-2">
                      {upcomingFixtures.map((fixture) => (
                        <FixtureCard
                          periodLabel="Week"
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

            {activeDetailTab === "fixtures" && (
              <div className="grid gap-6 md:grid-cols-2">
                {summary.recentFixtures.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">
                      Recent slate
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">
                      Latest results
                    </h3>
                    <div className="mt-4 space-y-3">
                      {summary.recentFixtures.map((fixture) => (
                        <FixtureCard
                          periodLabel="Week"
                          key={fixture.id}
                          fixture={fixture}
                          onOpenTeam={handleTeamChange}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {summary.upcomingFixtures.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">
                      Next up
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">
                      Upcoming games
                    </h3>
                    <div className="mt-4 space-y-3">
                      {summary.upcomingFixtures.map((fixture) => (
                        <FixtureCard
                          periodLabel="Week"
                          key={fixture.id}
                          fixture={fixture}
                          onOpenTeam={handleTeamChange}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-6 text-sm leading-relaxed text-[var(--home-ink-muted)]">
                    <p className="flex items-center gap-2 font-semibold text-[var(--home-ink)]">
                      <Flag className="h-4 w-4" />
                      Offseason
                    </p>
                    <p className="mt-2">
                      The {summary.season} regular season is complete. New fixtures will appear when the next season&apos;s schedule is published.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === "leaders" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {LEADER_TABS.map((tab) => {
                      const isActive = tab.id === activeLeaderTab;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveLeaderTab(tab.id)}
                          aria-pressed={isActive}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                          style={getViewButtonStyle(isActive)}
                        >
                          <span className="text-[var(--home-ink)]">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <a
                    href={summary.sourceUrls.leaders}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-2 text-sm font-medium text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-haze)]"
                  >
                    NFLverse source
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">
                      {activeLeaderMeta.label} leaderboard
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-[var(--home-ink)]">
                      Top {activeLeaderMeta.unitLong}
                    </h3>
                    <NflLeaderList
                      leaders={activeLeaders.slice(0, 5)}
                      unit={activeLeaderMeta.unit}
                      teamLookup={teamShortNameById}
                    />
                  </div>
                  {activeLeaders.length > 5 && (
                    <div>
                      <NflLeaderList
                        leaders={activeLeaders.slice(5, 10)}
                        unit={activeLeaderMeta.unit}
                        teamLookup={teamShortNameById}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <section className="rounded-3xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-5 text-sm text-[var(--home-ink-muted)] shadow-sm">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--home-haze)]" />
            <p className="mb-0 max-w-none leading-relaxed">
              This page is a curated NFLverse snapshot rather than a live feed. Standings come from the public NFLverse standings dataset, schedule and scores from the NFLverse games table, and stat leaders from the regular-season player stats release linked above.
            </p>
          </div>
        </section>
      </div>
    </div>
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
    <div className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
        {title}
      </p>
      {leader ? (
        <>
          <p className="mt-2 text-lg font-bold text-[var(--home-ink)]">
            {leader.name}
            <span className="ml-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
              {leader.position}
            </span>
          </p>
          <p className="mt-1 text-sm text-[var(--home-ink-muted)]">
            {formatLeaderTotal(leader)} {unitLong} in {leader.games} games
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--home-ink-soft)]">
            {formatPerGame(leader.perGame)} per game
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-[var(--home-ink-muted)]">{emptyLabel}</p>
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
    <ol className="mt-5 space-y-3 pl-0">
      {leaders.map((leader) => {
        const teamName = teamLookup.get(leader.teamId) ?? leader.teamCode;
        return (
          <li
            key={`${unit}-${leader.rank}-${leader.name}`}
            className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--home-paper)] text-sm font-bold text-[var(--home-haze)] shadow-sm">
                {leader.rank}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--home-ink)]">
                  {leader.name}
                  <span className="ml-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                    {leader.position}
                  </span>
                </p>
                <p className="text-sm text-[var(--home-ink-muted)]">
                  {teamName} · {leader.games} games
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[var(--home-ink)]">
                {formatLeaderTotal(leader)}
              </p>
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--home-ink-soft)]">
                {unit}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

interface ConferenceSlice {
  topSeed: NFLTeamStanding;
  divisionLeaders: NFLTeamStanding[];
  lastIn: NFLTeamStanding;
  firstOut: NFLTeamStanding | null;
}

interface ConferenceContext {
  AFC: ConferenceSlice;
  NFC: ConferenceSlice;
}

function buildConferenceContext(teams: NFLTeamStanding[]): ConferenceContext {
  return {
    AFC: buildConferenceSlice(teams, "AFC"),
    NFC: buildConferenceSlice(teams, "NFC"),
  };
}

function buildConferenceSlice(
  teams: NFLTeamStanding[],
  conference: "AFC" | "NFC"
): ConferenceSlice {
  const inConference = teams.filter((team) => team.conference === conference);
  const seeded = inConference
    .filter((team): team is NFLTeamStanding & { seed: number } => team.seed !== null)
    .sort((a, b) => a.seed - b.seed);
  const topSeed = seeded[0] ?? inConference[0];
  const divisionLeaders = inConference.filter((team) => team.divisionRank === 1);
  const lastIn = seeded.at(-1) ?? topSeed;
  const firstOut =
    inConference
      .filter((team) => team.seed === null)
      .sort((a, b) => b.winPct - a.winPct || b.pointDifferential - a.pointDifferential)[0] ?? null;
  return { topSeed, divisionLeaders, lastIn, firstOut };
}

function collectLeadersForTeam(teamId: string, leaders: NFLLeaderboards) {
  return {
    passing: leaders.passing.find((leader) => leader.teamId === teamId),
    rushing: leaders.rushing.find((leader) => leader.teamId === teamId),
    receiving: leaders.receiving.find((leader) => leader.teamId === teamId),
    sacks: leaders.sacks.find((leader) => leader.teamId === teamId),
  };
}

type NflZone = "top-seed" | "division" | "wildcard" | "eliminated";

function getTeamZone(team: NFLTeamStanding): NflZone {
  if (team.seed === 1) return "top-seed";
  if (team.seed !== null && team.divisionRank === 1) return "division";
  if (team.seed !== null) return "wildcard";
  return "eliminated";
}

function getZoneLabel(zone: NflZone): string {
  switch (zone) {
    case "top-seed":
      return "Top seed";
    case "division":
      return "Division winner";
    case "wildcard":
      return "Wild card";
    case "eliminated":
    default:
      return "Eliminated";
  }
}

function getZoneDotColor(zone: NflZone): string {
  switch (zone) {
    case "top-seed":
      return "var(--home-haze)";
    case "division":
      return "var(--home-moss)";
    case "wildcard":
      return "var(--home-acid)";
    case "eliminated":
    default:
      return "var(--home-rule)";
  }
}

function getZonePillStyle(zone: NflZone): CSSProperties {
  switch (zone) {
    case "top-seed":
      return {
        color: "var(--home-haze)",
        borderColor: "color-mix(in srgb, var(--home-haze) 30%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-haze) 10%, var(--home-paper-alt))",
      };
    case "division":
      return {
        color: "color-mix(in srgb, var(--home-ink) 75%, var(--home-moss))",
        borderColor: "color-mix(in srgb, var(--home-moss) 55%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-moss) 22%, var(--home-paper-alt))",
      };
    case "wildcard":
      return {
        color: "color-mix(in srgb, var(--home-ink) 70%, var(--home-acid))",
        borderColor: "color-mix(in srgb, var(--home-acid) 50%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-acid) 22%, var(--home-paper-alt))",
      };
    case "eliminated":
    default:
      return {
        color: "var(--home-ink-muted)",
        borderColor: "var(--home-rule)",
        background: "var(--home-paper-alt)",
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

function getTeamStoryline(team: NFLTeamStanding, context: ConferenceContext): string {
  const slice = context[team.conference];
  const zone = getTeamZone(team);
  const record = formatRecord(team);

  if (zone === "top-seed") {
    return `${team.shortName} claimed the ${team.conference} #1 seed and home-field advantage at ${record}, scoring ${team.pointsFor} points to ${team.pointsAgainst} allowed.`;
  }
  if (zone === "division") {
    return `${team.shortName} won the ${team.division} at ${record} and earned the #${team.seed} seed, with a ${formatDifferential(team.pointDifferential)} point differential.`;
  }
  if (zone === "wildcard") {
    return `${team.shortName} grabbed a wild card spot at #${team.seed} (${record}) and finished ${team.divisionRank}${ordinalSuffix(team.divisionRank)} in the ${team.division}.`;
  }
  if (slice.lastIn) {
    const winsBack = Math.max(0, slice.lastIn.wins - team.wins);
    return `${team.shortName} finished ${team.divisionRank}${ordinalSuffix(team.divisionRank)} in the ${team.division} at ${record}, ${winsBack === 0 ? "tied with the last playoff team on wins" : `${winsBack} win${winsBack === 1 ? "" : "s"} short of the last playoff seed`}.`;
  }
  return `${team.shortName} finished ${team.divisionRank}${ordinalSuffix(team.divisionRank)} in the ${team.division} at ${record}.`;
}

function getTeamPressurePoints(
  team: NFLTeamStanding,
  context: {
    conferenceContext: ConferenceContext;
    offenseRankByTeam: Map<string, number>;
    defenseRankByTeam: Map<string, number>;
  }
): string[] {
  const { conferenceContext, offenseRankByTeam, defenseRankByTeam } = context;
  const slice = conferenceContext[team.conference];
  const offenseRank = offenseRankByTeam.get(team.id) ?? 0;
  const defenseRank = defenseRankByTeam.get(team.id) ?? 0;
  const zone = getTeamZone(team);
  const points: string[] = [];

  if (zone === "top-seed") {
    points.push(
      `${team.wins}-${team.losses}${team.ties ? `-${team.ties}` : ""} for the conference's #1 seed.`,
      `${team.pointsFor} points scored, ${team.pointsAgainst} allowed (${formatDifferential(team.pointDifferential)} differential).`
    );
  } else if (zone === "division") {
    points.push(
      `Won the ${team.division} as the #${team.seed} seed (${formatRecord(team)}).`,
      `${team.pointsFor - team.pointsAgainst >= 0 ? "+" : ""}${team.pointsFor - team.pointsAgainst} point differential over ${REGULAR_SEASON_GAMES} games.`
    );
  } else if (zone === "wildcard") {
    points.push(
      `Wild card #${team.seed} at ${formatRecord(team)}.`,
      `${team.pointsFor} PF / ${team.pointsAgainst} PA (${formatDifferential(team.pointDifferential)}).`
    );
  } else {
    const lastInWins = slice.lastIn?.wins ?? team.wins;
    const winsBack = Math.max(0, lastInWins - team.wins);
    points.push(
      `${winsBack === 0 ? "Equal" : `${winsBack} win${winsBack === 1 ? "" : "s"} short`} on wins to the last ${team.conference} playoff team.`,
      `${team.pointsFor} PF / ${team.pointsAgainst} PA (${formatDifferential(team.pointDifferential)}).`
    );
  }

  points.push(`Offense rank #${offenseRank}; defense rank #${defenseRank}.`);
  if (team.playoffResult) {
    points.push(`Postseason result: ${formatPlayoffResult(team.playoffResult)}.`);
  }
  return points;
}

function ordinalSuffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
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

