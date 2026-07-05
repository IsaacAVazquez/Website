"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, ExternalLink } from "lucide-react";
import {
  MetricCard,
  CrestAvatar,
  FixtureCard,
  StatFascia,
  ResultsTape,
  GoalsPulseStrip,
  SegmentedTabs,
  FixtureLedgerSection,
  groupFixturesByMatchday,
  LeaderLedger,
  ClubDrawer,
  type LeaderEntry,
  type ClubDrawerClub,
  type ClubDrawerScorer,
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
  PremierLeagueDetailTab,
  PremierLeagueRouteState,
  PremierLeagueStandingRow,
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
        color: "var(--home-signal)",
        borderColor: "color-mix(in srgb, var(--home-signal) 30%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-signal) 10%, var(--home-paper-alt))",
      };
    case "europa":
      return {
        color: "color-mix(in srgb, var(--home-positive) 60%, var(--home-ink))",
        borderColor: "color-mix(in srgb, var(--home-positive) 45%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-positive) 16%, var(--home-paper-alt))",
      };
    case "conference":
      return {
        color: "color-mix(in srgb, var(--home-positive) 45%, var(--home-ink))",
        borderColor: "color-mix(in srgb, var(--home-positive) 28%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-positive) 9%, var(--home-paper-alt))",
      };
    case "relegation":
      return {
        color: "color-mix(in srgb, var(--home-negative) 70%, var(--home-ink))",
        borderColor: "color-mix(in srgb, var(--home-negative) 40%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-negative) 10%, var(--home-paper-alt))",
      };
    default:
      return { color: "var(--home-ink-muted)", borderColor: "var(--home-rule)", background: "var(--home-paper-alt)" };
  }
}

function getZoneDotColor(zone: ReturnType<typeof getPLZone>): string {
  switch (zone) {
    case "champions": return "var(--home-signal)";
    case "europa": return "var(--home-positive)";
    case "conference": return "color-mix(in srgb, var(--home-positive) 55%, var(--home-ink))";
    case "relegation": return "var(--home-negative)";
    default: return "var(--home-rule)";
  }
}

function getTableRowStyle(isSelected: boolean): CSSProperties {
  if (isSelected) {
    return {
      borderColor: "color-mix(in srgb, var(--home-signal) 35%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-signal) 9%, var(--home-paper-alt))",
    };
  }
  return { borderColor: "var(--home-rule)", background: "var(--home-paper-alt)" };
}

function getViewButtonStyle(isActive: boolean): CSSProperties {
  if (isActive) {
    return {
      borderColor: "color-mix(in srgb, var(--home-signal) 35%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-signal) 9%, var(--home-paper-alt))",
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
  const hasManagedParams =
    searchParams.get("view") !== null ||
    searchParams.get("team") !== null ||
    searchParams.get("detail") !== null;
  const routeState = hasManagedParams ? normalizePremierLeagueState(searchParams) : initialState;

  const validTeamIds = useMemo(() => new Set(summary.teams.map((t) => t.id)), [summary.teams]);
  const canonicalTeamId = validTeamIds.has(routeState.team ?? "") ? routeState.team : null;
  const selectedTeamId = canonicalTeamId ?? summary.standings[0]?.team.id ?? null;

  const desiredHref = buildPremierLeagueHref(
    { view: routeState.view, team: canonicalTeamId, detail: routeState.detail },
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
    navigate({ view, team: nextTeam, detail: routeState.detail });
  }

  function handleTeamChange(teamId: string) {
    navigate({ view: routeState.view, team: teamId, detail: routeState.detail });
  }

  function setActiveDetailTab(detail: PremierLeagueDetailTab) {
    navigate({ view: routeState.view, team: selectedTeamId, detail });
  }
  const activeDetailTab = routeState.detail;

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset loading/error flags when no team is selected
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

  // Assists board: football-data.org's scorer entries already carry an
  // `assists` count per player — this is a re-sort of already-fetched data,
  // not a new fetch (see src/lib/premierLeagueData.ts's normalizeScorer).
  const assistEntries: LeaderEntry[] = useMemo(() => (
    summary.scorers
      .filter((s) => s.assists > 0)
      .slice()
      .sort((a, b) => b.assists - a.assists)
      .map((s, i) => ({
        rank: i + 1,
        name: s.name,
        clubId: s.teamId,
        clubCode: s.teamName,
        total: s.assists,
        appearances: s.appearances,
        perMatch: s.appearances ? s.assists / s.appearances : 0,
      }))
  ), [summary.scorers]);

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

  // Club drawer — opens only when a club is explicitly selected (an
  // explicit ?team= in the URL, not the leader-default fallback used to
  // keep the "Club Detail" tab populated), so a bare /premier-league visit
  // never shows the overlay unsolicited.
  const isDrawerOpen = Boolean(canonicalTeamId);
  const drawerClub: ClubDrawerClub | null = isDrawerOpen && selectedRow
    ? {
      id: selectedRow.team.id,
      name: selectedRow.team.name,
      crest: teamSnapshot?.team?.crest ?? selectedRow.team.crest,
      accentColor: selectedRow.team.accentColor ?? null,
      position: selectedRow.position,
      points: selectedRow.points,
      played: selectedRow.playedGames,
      won: selectedRow.won,
      draw: selectedRow.draw,
      lost: selectedRow.lost,
      goalsFor: selectedRow.goalsFor,
      goalsAgainst: selectedRow.goalsAgainst,
      goalDifference: selectedRow.goalDifference,
      manager: teamSnapshot?.team?.manager ?? null,
      venue: teamSnapshot?.team?.venue ?? selectedRow.team.venue ?? null,
    }
    : null;
  const drawerTopScorers: ClubDrawerScorer[] = selectedRow
    ? summary.scorers
      .filter((s) => s.teamId === selectedRow.team.id)
      .map((s) => ({ name: s.name, goals: s.goals, assists: s.assists }))
    : [];
  function handleCloseDrawer() {
    navigate({ view: routeState.view, team: null, detail: routeState.detail });
  }

  // Stats panel cells
  const topScorerEntry = summary.scorers[0] ?? null;
  const goalsForLeader = useMemo(
    () => [...summary.standings].sort((a, b) => b.goalsFor - a.goalsFor || a.position - b.position)[0] ?? null,
    [summary.standings]
  );
  const bestDefense = useMemo(
    () => [...summary.standings].sort((a, b) => a.goalsAgainst - b.goalsAgainst || a.position - b.position)[0] ?? null,
    [summary.standings]
  );
  const totalMatchdays = 38;
  const currentMatchday = summary.competition?.currentMatchday ?? null;

  const statsPanelCells: HomeStatsCell[] = [
    {
      label: "Title leader",
      tooltip: "Club currently top of the table and their points total.",
      value: leader ? `${leader.team.shortName} · ${leader.points} pts` : "—",
      sub: leader && runnerUp ? `${leader.points - runnerUp.points} clear of ${runnerUp.team.shortName}` : undefined,
    },
    {
      label: "Top-four gap",
      tooltip: "Points buffer the fourth-placed club holds over the fifth-placed club.",
      value: fourthPlace && fifthPlace ? `+${fourthPlace.points - fifthPlace.points} pts` : "—",
      sub: "Champions League line",
    },
    {
      label: "Europe line gap",
      tooltip: "Points cushion the sixth-placed club holds over the seventh-placed club.",
      value: summary.standings[5] && summary.standings[6]
        ? `+${summary.standings[5].points - summary.standings[6].points} pts`
        : "—",
      sub: "Europa / Conference",
    },
    {
      label: "Relegation gap",
      tooltip: "Points the seventeenth-placed club holds over the eighteenth-placed club.",
      value: safetyLine && dropLine ? `+${safetyLine.points - dropLine.points} pt` : "—",
      sub: "Safety margin",
    },
    {
      label: "Top scorer",
      tooltip: "Leading goalscorer in the league this season.",
      value: topScorerEntry ? `${topScorerEntry.name} · ${topScorerEntry.goals}` : "—",
      sub: topScorerEntry ? topScorerEntry.teamName : undefined,
    },
    {
      label: "Most goals scored",
      tooltip: "Club with the highest goals-for total this season.",
      value: goalsForLeader ? `${goalsForLeader.team.shortName} · ${goalsForLeader.goalsFor}` : "—",
    },
    {
      label: "Best defense",
      tooltip: "Club with the fewest goals conceded this season.",
      value: bestDefense ? `${bestDefense.team.shortName} · ${bestDefense.goalsAgainst}` : "—",
    },
    {
      label: "Matchday",
      tooltip: "Current matchday position within the 38-game season.",
      value: currentMatchday ? `${currentMatchday} of ${totalMatchdays}` : `— of ${totalMatchdays}`,
    },
  ];

  return (
    <div className="home-page min-h-screen">
      <div className="home-shell home-section space-y-5 sm:space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="home-kicker mb-1">Football Data Tool</p>
            <div className="flex items-center gap-3">
              <span
                className="relative inline-flex h-11 min-w-[46px] flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 font-mono text-sm text-[var(--home-ink)]"
                aria-hidden="true"
              >
                ENG
                <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-[var(--home-signal)]" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--home-ink)] sm:text-3xl">
                Premier League{" "}
                <em style={{ fontFamily: "var(--font-home-serif)", fontStyle: "italic", fontWeight: 400 }}>
                  Pulse
                </em>
              </h1>
            </div>
            <p className="mt-2 max-w-[52ch] text-sm leading-6 text-[var(--home-ink-muted)]">
              Where does the title race actually stand? Points gaps to the top four, European qualification line, and relegation pressure, refreshed weekly from live data.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.06em] text-[var(--home-ink-muted)]">
              <span
                className="h-1.5 w-1.5 rounded-full bg-[var(--home-positive)]"
                style={{ boxShadow: "0 0 0 4px color-mix(in srgb, var(--home-positive) 16%, transparent)" }}
                aria-hidden="true"
              />
              {currentMatchday ? `Matchday ${currentMatchday} · ` : ""}Snapshot updated {lastUpdated}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="flex flex-wrap gap-1.5 text-2xs text-[var(--home-ink-muted)]">
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
            <GoalsPulseStrip
              data={summary.goalsPerMatchday ?? []}
              capLabel={
                (summary.goalsPerMatchday?.length ?? 0) > 0
                  ? `MD 01–${summary.goalsPerMatchday![summary.goalsPerMatchday!.length - 1].matchday}`
                  : undefined
              }
              className="hidden w-44 sm:block"
            />
          </div>
        </div>

        <ResultsTape
          recentFixtures={summary.recentFixtures}
          upcomingFixtures={summary.upcomingFixtures}
          label={
            <span className="inline-flex items-center gap-2">
              <span className="h-[7px] w-[7px] flex-shrink-0 rounded-full bg-[var(--home-signal)]" />
              {currentMatchday ? `Matchday ${currentMatchday} · latest` : "Latest results"}
            </span>
          }
          className="rounded-[var(--radius-sm)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_62%,var(--home-paper))] px-4 py-1"
        />

        {/* Dense stats panel */}
        <HomeStatsPanel
          id="pl-stats-panel"
          title="Premier League at a glance"
          meta={`Live · refreshed ${lastUpdated}`}
          cells={statsPanelCells}
          pills={[
            { label: "Standings", href: "#pl-standings", icon: ChartBar },
            { label: "Top scorers", href: "?detail=scorers", icon: User },
            { label: "Recent fixtures", href: "?detail=fixtures", icon: Calendar },
            { label: "Upcoming fixtures", href: "?detail=fixtures", icon: Calendar },
            { label: "Club detail", href: "?detail=club", icon: Briefcase },
            { label: "Article", href: "/writing", icon: Article },
          ]}
        />

        {/* Key gaps — fused hairline stat fascia */}
        <StatFascia
          items={[
            {
              eyebrow: "Leader",
              metric: `${leader?.team.shortName ?? "—"} · ${leader?.points ?? "—"} pts`,
              detail: leader && runnerUp ? `${leader.points - runnerUp.points} clear of ${runnerUp.team.shortName}` : "Standings loading",
            },
            {
              eyebrow: "Top-four line",
              metric: fourthPlace && fifthPlace ? `+${fourthPlace.points - fifthPlace.points} pts` : "—",
              detail: fourthPlace && fifthPlace ? `${fourthPlace.team.shortName} over ${fifthPlace.team.shortName}` : "",
            },
            {
              eyebrow: "Europe line",
              metric: summary.standings[5] && summary.standings[6] ? `+${summary.standings[5].points - summary.standings[6].points} pts` : "—",
              detail: summary.standings[5] && summary.standings[6] ? `${summary.standings[5].team.shortName} over ${summary.standings[6].team.shortName}` : "",
            },
            {
              eyebrow: "Safety line",
              metric: safetyLine && dropLine ? `+${safetyLine.points - dropLine.points} pt` : "—",
              detail: safetyLine && dropLine ? `${safetyLine.team.shortName} over ${dropLine.team.shortName}` : "",
            },
          ]}
        />

        {/* Standings */}
        <div id="pl-standings">
          <section className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] p-5 sm:p-6 shadow-[var(--shadow-sm)]">
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
                    <span className="text-xs text-[var(--home-ink-soft)]">{count}</span>
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
                  <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
                    <th scope="col" className="px-3 py-2 font-semibold">Pos</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Club</th>
                    <th scope="col" className="hidden px-3 py-2 font-semibold sm:table-cell">Record</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Pts</th>
                    <th scope="col" className="hidden px-3 py-2 font-semibold md:table-cell">PPG</th>
                    <th scope="col" className="hidden px-3 py-2 font-semibold lg:table-cell">GF</th>
                    <th scope="col" className="hidden px-3 py-2 font-semibold lg:table-cell">GA</th>
                    <th scope="col" className="px-3 py-2 font-semibold">GD</th>
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
                            className="flex min-h-[44px] w-full items-center gap-2 rounded-[var(--radius-xl)] px-1 text-left transition-colors hover:bg-[var(--home-paper-alt)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--home-signal)]"
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
        </div>

        {/* Tabbed detail strip */}
        <div className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] p-5 sm:p-6 shadow-[var(--shadow-sm)]">
          <SegmentedTabs
            tabs={[
              { id: "club", label: "Club Detail" },
              { id: "fixtures", label: "Fixtures" },
              { id: "scorers", label: "Top Scorers" },
            ]}
            activeId={activeDetailTab}
            onChange={(id) => setActiveDetailTab(id as typeof activeDetailTab)}
            ariaLabel="Club and league details"
            idPrefix="pl-detail-tab"
            panelId="pl-detail-panel"
          />

          <div
            id="pl-detail-panel"
            role="tabpanel"
            aria-labelledby={`pl-detail-tab-${activeDetailTab}`}
            className="mt-6"
          >
            {activeDetailTab === "club" && selectedRow && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <CrestAvatar crest={selectedRow.team.crest} name={selectedRow.team.shortName} size="md" />
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold text-[var(--home-ink)]">{selectedRow.team.name}</h3>
                        <span
                          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-3xs font-semibold uppercase tracking-[0.12em]"
                          style={getZonePillStyle(selectedZone)}
                        >
                          {getZoneLabel(selectedZone)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTeamChange(selectedRow.team.id)}
                      className="inline-flex min-h-[44px] flex-shrink-0 items-center gap-1.5 rounded-[var(--radius-xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3.5 text-sm font-medium text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-signal)]"
                    >
                      Open detail
                    </button>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">Performance</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <MetricCard label="PPG" value={formatFixed(selectedRow.points / selectedRow.playedGames)} />
                      <MetricCard label="Record" value={`${selectedRow.won}-${selectedRow.draw}-${selectedRow.lost}`} />
                      <MetricCard label="Attack rank" value={`#${attackRankings.get(selectedRow.team.id) ?? "—"}`} />
                      <MetricCard label="Defense rank" value={`#${defenseRankings.get(selectedRow.team.id) ?? "—"}`} />
                      <MetricCard label="GF / match" value={formatFixed(selectedRow.goalsFor / selectedRow.playedGames)} />
                      <MetricCard label="GA / match" value={formatFixed(selectedRow.goalsAgainst / selectedRow.playedGames)} />
                    </div>
                  </div>

                  <div className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
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
                  <div
                    className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4"
                    role={teamSnapshotError ? "alert" : "status"}
                    aria-live="polite"
                  >
                    <p className="text-sm text-[var(--home-ink-muted)]">
                      {isTeamSnapshotLoading
                        ? "Loading recent club fixtures…"
                        : teamSnapshotError}
                    </p>
                  </div>
                )}

                {recentFixtures.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">Recent results</p>
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">Upcoming fixtures</p>
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
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">Recent slate</p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">Latest results</h3>
                  <div className="mt-4">
                    <FixtureLedgerSection
                      groups={groupFixturesByMatchday(summary.recentFixtures)}
                      onOpenTeam={handleTeamChange}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">Next up</p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">Upcoming fixtures</h3>
                  <div className="mt-4">
                    <FixtureLedgerSection
                      groups={groupFixturesByMatchday(summary.upcomingFixtures, { suffix: "upcoming" })}
                      onOpenTeam={handleTeamChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeDetailTab === "scorers" && (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">Goals &amp; assists leaderboard</p>
                    <a
                      href="https://www.premierleague.com/stats/top/players/goals"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-2 text-sm font-medium text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-signal)]"
                    >
                      Official
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <div className="mt-3">
                    <LeaderLedger
                      title="Top scorers"
                      unit="G"
                      entries={scorerEntries.slice(0, 10).map((entry) => ({
                        rank: entry.rank,
                        name: entry.name,
                        clubCode: clubLookup.get(entry.clubId) ?? entry.clubCode,
                        value: entry.total,
                      }))}
                      emptyLabel="No scorers recorded yet this season."
                    />
                  </div>
                </div>
                <div>
                  <div className="mt-3 md:mt-9">
                    <LeaderLedger
                      title="Most assists"
                      unit="A"
                      entries={assistEntries.slice(0, 10).map((entry) => ({
                        rank: entry.rank,
                        name: entry.name,
                        clubCode: clubLookup.get(entry.clubId) ?? entry.clubCode,
                        value: entry.total,
                      }))}
                      emptyLabel="No assists recorded yet this season."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-5 text-sm text-[var(--home-ink-muted)] shadow-sm">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--home-signal)]" />
            <p className="mb-0 max-w-none leading-relaxed">
              This page is a checked-in football-data.org snapshot rather than a live feed. Standings, club form, and fixture cards refresh from the local dataset shipped with the app.
            </p>
          </div>
        </section>
      </div>

      <ClubDrawer
        club={drawerClub}
        formSequence={teamSnapshot?.form.sequence ?? []}
        topScorers={drawerTopScorers}
        recentFixtures={recentFixtures}
        upcomingFixtures={upcomingFixtures}
        isLoadingDetail={!teamSnapshot && isTeamSnapshotLoading}
        detailError={!teamSnapshot ? teamSnapshotError : null}
        onClose={handleCloseDrawer}
        testId="pl-selected-club"
      />
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
    <div className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
        {title}
      </p>
      {leader ? (
        <>
          <p className="mt-2 text-lg font-bold text-[var(--home-ink)]">{leader.name}</p>
          <p className="mt-1 text-sm text-[var(--home-ink-muted)]">
            {leader.total} {statLabel.toLowerCase()} in {leader.appearances} matches
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--home-ink-soft)]">
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
