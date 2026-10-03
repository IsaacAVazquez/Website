"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Flag, Medal, X } from "lucide-react";
import {
  CrestAvatar,
  EmptyPanel,
  FixtureCard,
  FixtureGroupSection,
  InfoChip,
  SurfaceCard,
  TeamResultPill,
} from "@/components/football";
import type {
  WorldCupGroup,
  WorldCupRouteState,
  WorldCupSummarySnapshot,
  WorldCupTeamOption,
  WorldCupTeamSnapshot,
  WorldCupView,
} from "@/types/worldCup";
import {
  getThirdPlaceRace,
  hasThirdPlaceRaceStarted,
  THIRD_PLACE_QUALIFY_COUNT,
  type ThirdPlaceRow,
} from "@/lib/worldCupStandings";
import {
  buildWorldCupHref,
  normalizeTeamParam,
  normalizeWorldCupState,
  WORLD_CUP_ROUTE,
} from "./world-cup-state";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { bracketTree } from "./bracketTree";
import { WorldCupBracket } from "./WorldCupBracket";
import "./world-cup.css";
import { DATE_ONLY_TIME_ZONE, DISPLAY_TIME_ZONE } from "@/lib/date-formatters";
import { useRouteSync } from "@/hooks/useRouteSync";
import { useCachedSnapshot } from "@/hooks/useCachedSnapshot";
import { groupBy } from "@/lib/utils";

interface WorldCupClientProps {
  initialState: WorldCupRouteState;
  summary: WorldCupSummarySnapshot;
  initialTeamSnapshot: WorldCupTeamSnapshot | null;
}

const VIEW_OPTIONS: Array<{
  id: WorldCupView;
  label: string;
  description: string;
}> = [
  {
    id: "groups",
    label: "Group stage",
    description: "Standings for all 12 groups of four.",
  },
  {
    id: "knockout",
    label: "Knockout bracket",
    description: "Every tie from the Round of 32 to the final, round by round.",
  },
  {
    id: "schedule",
    label: "Match schedule",
    description: "Every result across the tournament.",
  },
];

function formatLongDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: DATE_ONLY_TIME_ZONE,
  }).format(date);
}

function formatTournamentWindow(start: string, end: string): string {
  const startDate = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return `${start} to ${end}`;
  }
  const startLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: DATE_ONLY_TIME_ZONE,
  }).format(startDate);
  return `${startLabel} to ${formatLongDate(end)}`;
}

export function WorldCupClient({
  initialState,
  summary,
  initialTeamSnapshot,
}: WorldCupClientProps) {
  const searchParams = useSearchParams();

  const { tournament, groups, knockout, scorers, teamOptions } = summary;
  const teamOptionById = useMemo(
    () => new Map(teamOptions.map((team) => [team.id, team])),
    [teamOptions]
  );
  const tree = useMemo(() => bracketTree(knockout), [knockout]);

  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("team") !== null;
  const routeState = hasManagedParams
    ? normalizeWorldCupState(searchParams)
    : initialState;

  const requestedTeam = normalizeTeamParam(routeState.team);
  const selectedTeamId =
    requestedTeam && teamOptionById.has(requestedTeam) ? requestedTeam : null;
  const selectedTeamOption = selectedTeamId
    ? teamOptionById.get(selectedTeamId) ?? null
    : null;

  const {
    snapshot: teamSnapshot,
    isLoading: isTeamSnapshotLoading,
    error: teamSnapshotError,
  } = useCachedSnapshot<WorldCupTeamSnapshot>(
    "/api/world-cup/teams",
    selectedTeamId,
    { id: selectedTeamId, snapshot: initialTeamSnapshot },
    "Unable to load team snapshot."
  );

  const desiredHref = buildWorldCupHref(
    { view: routeState.view, team: selectedTeamId },
    searchParams
  );

  const pushHref = useRouteSync(WORLD_CUP_ROUTE, desiredHref);

  function navigate(nextState: WorldCupRouteState) {
    const href = buildWorldCupHref(nextState, searchParams);
    pushHref(href);
  }

  function handleViewChange(view: WorldCupView) {
    navigate({ view, team: selectedTeamId });
  }

  function handleTeamChange(teamId: string) {
    const normalized = normalizeTeamParam(teamId);
    if (!normalized || !teamOptionById.has(normalized)) return;
    navigate({ view: routeState.view, team: normalized });
  }

  function clearTeam() {
    navigate({ view: routeState.view, team: null });
  }

  const snapshotDateLabel = useMemo(
    () =>
      // tournament.generatedAt is a full ISO instant, so it reads in the
      // display zone rather than UTC.
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: DISPLAY_TIME_ZONE,
      }).format(new Date(tournament.generatedAt)),
    [tournament]
  );

  const venuesByCountry = useMemo(() => {
    return Array.from(groupBy(tournament.venues, (venue) => venue.country).entries());
  }, [tournament]);

  // The final fixture and the champion it settled, straight from the bracket
  // tree, so the hero's headline numbers can never disagree with the bracket
  // drawn beneath them.
  const finalNode = tree.columns[tree.columns.length - 1]?.fixtures[0] ?? null;
  const champion =
    finalNode && tree.championId
      ? finalNode.fixture.homeTeam.id === tree.championId
        ? finalNode.fixture.homeTeam
        : finalNode.fixture.awayTeam.id === tree.championId
          ? finalNode.fixture.awayTeam
          : null
      : null;
  const runnerUp =
    finalNode && champion
      ? finalNode.fixture.homeTeam.id === champion.id
        ? finalNode.fixture.awayTeam
        : finalNode.fixture.homeTeam
      : null;
  const finalScoreLine =
    finalNode && finalNode.fixture.score.home !== null && finalNode.fixture.score.away !== null
    ? `${finalNode.fixture.homeTeam.shortName} ${finalNode.fixture.score.home}-${finalNode.fixture.score.away} ${finalNode.fixture.awayTeam.shortName}`
    : null;

  const lead = PROJECT_PRESS[WORLD_CUP_ROUTE].lead;
  const standfirst =
    "I wanted the last World Cup laid out the way a bracket poster reads after the final whistle, from the group tables through every knockout round to the trophy. It comes from a curated ESPN snapshot of the 2026 tournament, which wrapped in July, so nothing on this page updates live.";

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="World Cup Pulse"
        standfirst={standfirst}
        meta={`${tournament.name} · ${tournament.phase} · Snapshot ${snapshotDateLabel}`}
        readouts={[
          {
            label: "Champion",
            value: champion?.shortName ?? "—",
            detail: runnerUp ? `Beat ${runnerUp.shortName} in the final` : undefined,
          },
          {
            label: "Final",
            value: finalScoreLine ?? "—",
            detail: finalNode?.fixture.venue ?? undefined,
          },
          {
            label: "Matches",
            value: `${tournament.matchCount}`,
            detail: `${tournament.teamCount} teams · ${tournament.groupCount} groups`,
          },
        ]}
      >
        <WorldCupBracket tree={tree} onOpenTeam={handleTeamChange} />
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          <h2 className="c97-poster-sm">Explore the tournament</h2>

          <div className="c97-segmented" style={{ marginTop: "var(--c97-sp-2)" }} role="tablist" aria-label="World Cup view switcher">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                id={`world-cup-tab-${option.id}`}
                aria-controls={`world-cup-tabpanel-${option.id}`}
                aria-selected={option.id === routeState.view}
                onClick={() => handleViewChange(option.id)}
                className="min-h-[44px] text-sm font-semibold"
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)", fontSize: "var(--c97-fs-small)" }}>
            {VIEW_OPTIONS.find((option) => option.id === routeState.view)?.description}
          </p>

          <div className="grid xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.92fr)]" style={{ marginTop: "var(--c97-sp-3)", gap: "var(--c97-sp-3)" }}>
            <div
              role="tabpanel"
              id={`world-cup-tabpanel-${routeState.view}`}
              aria-labelledby={`world-cup-tab-${routeState.view}`}
            >
              {routeState.view === "groups" && (
                <GroupsView
                  groups={groups}
                  selectedTeamId={selectedTeamId}
                  onOpenTeam={handleTeamChange}
                />
              )}
              {routeState.view === "knockout" && (
                <KnockoutView
                  rounds={knockout}
                  selectedTeamId={selectedTeamId}
                  onOpenTeam={handleTeamChange}
                />
              )}
              {routeState.view === "schedule" && (
                <ScheduleView
                  recentFixtures={summary.recentFixtures}
                  upcomingFixtures={summary.upcomingFixtures}
                  onOpenTeam={handleTeamChange}
                />
              )}
            </div>

            <aside className="xl:sticky xl:top-6 xl:self-start">
              {selectedTeamOption ? (
                <TeamDetailCard
                  option={selectedTeamOption}
                  snapshot={teamSnapshot}
                  isLoading={isTeamSnapshotLoading}
                  error={teamSnapshotError}
                  onClear={clearTeam}
                  onOpenTeam={handleTeamChange}
                />
              ) : (
                <FormatCard tournament={tournament} />
              )}
            </aside>
          </div>
        </div>
      </section>

      {scorers.length > 0 && (
        <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
          <div className="c97-shell">
            <h2 className="c97-poster-sm" style={{ marginBottom: "var(--c97-sp-2)" }}>Golden boot race</h2>
            <div className="overflow-x-auto" role="region" aria-label="Top scorers (scrollable)" tabIndex={0}>
              <table className="c97-table c97-wc-table" aria-label="Top scorers">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Player</th>
                    <th scope="col">Team</th>
                    <th scope="col" data-align="end">Goals</th>
                    <th scope="col" data-align="end" className="hidden sm:table-cell">Assists</th>
                  </tr>
                </thead>
                <tbody>
                  {scorers.slice(0, 10).map((scorer) => (
                    <tr key={`${scorer.rank}-${scorer.name}`}>
                      <td className="c97-mono">{scorer.rank}</td>
                      <td className="c97-serif">{scorer.name}</td>
                      <td className="c97-mono">{scorer.teamCode}</td>
                      <td className="c97-mono" data-align="end">{scorer.goals}</td>
                      <td className="c97-mono hidden sm:table-cell" data-align="end">
                        {scorer.assists}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          <div className="flex flex-wrap items-center justify-between" style={{ gap: "var(--c97-sp-2)" }}>
            <h2 className="c97-poster-sm">Host venues</h2>
            <span className="c97-meta">
              {tournament.venues.length} stadiums · {venuesByCountry.length} nations
            </span>
          </div>
          <div className="flex flex-col" style={{ marginTop: "var(--c97-sp-2)", rowGap: "var(--c97-sp-3)" }}>
            {venuesByCountry.map(([country, venues]) => (
              <div key={country}>
                <p className="c97-kicker flex items-center" style={{ gap: "var(--c97-sp-1)", marginBottom: "var(--c97-sp-2)" }}>
                  <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                  {country} · {venues.length}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "var(--c97-sp-1)" }}>
                  {venues.map((venue) => (
                    <div key={`${venue.city}-${venue.stadium}`} className="c97-panel">
                      <p className="c97-serif" style={{ fontWeight: 600 }}>
                        {venue.city}
                      </p>
                      <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)", fontSize: "var(--c97-fs-small)" }}>
                        {venue.stadium}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell">
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Snapshot note</p>
          <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
            This page is a curated snapshot that refreshes on a schedule. Group standings,
            fixtures, and the knockout bracket come from ESPN&apos;s public World Cup endpoints.
            Tournament format and host venues are fixed facts carried in the snapshot.
          </p>
        </div>
      </section>
    </>
  );
}

function GroupsView({
  groups,
  selectedTeamId,
  onOpenTeam,
}: {
  groups: WorldCupGroup[];
  selectedTeamId: string | null;
  onOpenTeam: (teamId: string) => void;
}) {
  const thirdPlaceRace = useMemo(() => getThirdPlaceRace(groups), [groups]);
  const raceStarted = hasThirdPlaceRaceStarted(thirdPlaceRace);

  if (groups.length === 0) {
    return (
      <EmptyPanel
        title="Group standings open with the first whistle"
        description="All 12 group tables populate here once the group stage begins. Until then, browse the host venues and the tournament format below."
      />
    );
  }

  return (
    <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-2)" }}>
      <QualificationLegend />
      <div className="grid lg:grid-cols-2" style={{ gap: "var(--c97-sp-2)" }}>
        {groups.map((group) => (
          <GroupTable
            key={group.letter || group.name}
            group={group}
            selectedTeamId={selectedTeamId}
            onOpenTeam={onOpenTeam}
          />
        ))}
      </div>
      <ThirdPlaceRace
        rows={thirdPlaceRace}
        started={raceStarted}
        selectedTeamId={selectedTeamId}
        onOpenTeam={onOpenTeam}
      />
    </div>
  );
}

function QualificationLegend() {
  return (
    <div className="flex flex-wrap items-center" style={{ columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-1)" }}>
      <span className="flex items-center c97-meta">
        <span className="c97-wc-zone-dot" style={{ backgroundColor: "var(--c97-positive)" }} />
        Top two advance to the Round of 32
      </span>
      <span className="flex items-center c97-meta">
        <span className="c97-wc-zone-dot" style={{ backgroundColor: "var(--c97-accent)" }} />
        Third place enters the eight-team wildcard race
      </span>
    </div>
  );
}

function GroupTable({
  group,
  selectedTeamId,
  onOpenTeam,
}: {
  group: WorldCupGroup;
  selectedTeamId: string | null;
  onOpenTeam: (teamId: string) => void;
}) {
  return (
    <SurfaceCard className="@container" style={{ padding: "var(--c97-sp-2)" }}>
      <div className="flex items-center justify-between" style={{ paddingBottom: "var(--c97-sp-1)" }}>
        <h3 className="c97-serif" style={{ fontSize: "var(--c97-fs-h3)" }}>
          {group.name}
        </h3>
        <span className="c97-meta">{group.standings.length} teams</span>
      </div>
      <table className="c97-table c97-wc-table" aria-label={`${group.name} standings`}>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Team</th>
            <th scope="col" data-align="end">P</th>
            <th scope="col" data-align="end" className="hidden @md:table-cell">W</th>
            <th scope="col" data-align="end" className="hidden @md:table-cell">D</th>
            <th scope="col" data-align="end" className="hidden @md:table-cell">L</th>
            <th scope="col" data-align="end">GD</th>
            <th scope="col" data-align="end">Pts</th>
          </tr>
        </thead>
        <tbody>
          {group.standings.map((row, index) => {
            const isSelected = row.teamId === selectedTeamId;
            const zoneColor =
              index < 2
                ? "var(--c97-positive)"
                : index === 2
                  ? "var(--c97-accent)"
                  : "var(--c97-rule)";
            const zoneTitle =
              index < 2
                ? "In a direct qualifying place"
                : index === 2
                  ? "In the third-place wildcard race"
                  : undefined;
            return (
              <tr key={row.teamId} data-selected={isSelected || undefined}>
                <td>
                  <span className="flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
                    <span
                      className="c97-wc-zone-dot"
                      style={{ backgroundColor: zoneColor }}
                      title={zoneTitle}
                      aria-hidden="true"
                    />
                    <span className="c97-mono">{row.rank}</span>
                    {zoneTitle ? <span className="sr-only">{zoneTitle}</span> : null}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => onOpenTeam(row.teamId)}
                    aria-pressed={isSelected}
                    aria-label={`Show ${row.name} details`}
                    className="flex min-h-[44px] w-full items-center text-left"
                    style={{ gap: "var(--c97-sp-1)", background: "none", border: 0, padding: 0 }}
                  >
                    <CrestAvatar crest={row.crest} name={row.name} size="sm" />
                    <span className="c97-serif" style={{ fontWeight: 600 }}>
                      {row.code || row.name}
                    </span>
                  </button>
                </td>
                <td className="c97-mono" data-align="end">{row.played}</td>
                <td className="c97-mono hidden @md:table-cell" data-align="end">{row.wins}</td>
                <td className="c97-mono hidden @md:table-cell" data-align="end">{row.draws}</td>
                <td className="c97-mono hidden @md:table-cell" data-align="end">{row.losses}</td>
                <td className="c97-mono" data-align="end">
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </td>
                <td className="c97-mono" data-align="end" style={{ fontWeight: 700 }}>
                  {row.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </SurfaceCard>
  );
}

function ThirdPlaceRace({
  rows,
  started,
  selectedTeamId,
  onOpenTeam,
}: {
  rows: ThirdPlaceRow[];
  started: boolean;
  selectedTeamId: string | null;
  onOpenTeam: (teamId: string) => void;
}) {
  if (rows.length === 0) return null;

  return (
    // A container, like the group tables, so Played drops out where six columns won't fit a phone.
    <SurfaceCard className="@container p-[var(--c97-sp-2)] sm:p-[var(--c97-sp-3)]">
      <div className="flex items-center justify-between" style={{ paddingBottom: "var(--c97-sp-1)" }}>
        <div className="flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
          <Medal className="h-4 w-4" aria-hidden="true" style={{ color: "var(--c97-accent)" }} />
          <h3 className="c97-serif" style={{ fontSize: "var(--c97-fs-h3)" }}>
            Third-place race
          </h3>
        </div>
        <span className="c97-meta">
          Best {THIRD_PLACE_QUALIFY_COUNT} of {rows.length} advance
        </span>
      </div>

      {!started ? (
        <p className="c97-prose">
          This World Cup keeps eight third-placed teams. Once the group matches begin, the side
          that finishes third in every group is ranked here by points, then goal difference, then
          goals scored, and the best eight join the top two from each group in the Round of 32.
        </p>
      ) : (
        <>
          <table className="c97-table c97-wc-table" aria-label="Third-place wildcard race">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Team</th>
                <th scope="col">Grp</th>
                <th scope="col" data-align="end" className="hidden @md:table-cell">P</th>
                <th scope="col" data-align="end">GD</th>
                <th scope="col" data-align="end">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSelected = row.teamId === selectedTeamId;
                return (
                  <tr key={row.teamId} data-selected={isSelected || undefined}>
                    <td>
                      <span className="flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
                        <span
                          className="c97-wc-zone-dot"
                          style={{
                            backgroundColor: row.qualifies
                              ? "var(--c97-positive)"
                              : "var(--c97-rule)",
                          }}
                          title={row.qualifies ? "In a qualifying place" : "Outside the cut"}
                          aria-hidden="true"
                        />
                        <span className="c97-mono">{row.rank}</span>
                        <span className="sr-only">{row.qualifies ? "In a qualifying place" : "Outside the cut"}</span>
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onOpenTeam(row.teamId)}
                        aria-pressed={isSelected}
                        aria-label={`Show ${row.name} details`}
                        className="flex min-h-[44px] w-full items-center text-left"
                        style={{ gap: "var(--c97-sp-1)", background: "none", border: 0, padding: 0 }}
                      >
                        <CrestAvatar crest={row.crest} name={row.name} size="sm" />
                        <span className="c97-serif" style={{ fontWeight: 600 }}>
                          {row.code || row.name}
                        </span>
                      </button>
                    </td>
                    <td className="c97-mono">{row.group}</td>
                    <td className="c97-mono hidden @md:table-cell" data-align="end">{row.played}</td>
                    <td className="c97-mono" data-align="end">
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </td>
                    <td className="c97-mono" data-align="end" style={{ fontWeight: 700 }}>
                      {row.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)", fontSize: "var(--c97-fs-small)" }}>
            The top {THIRD_PLACE_QUALIFY_COUNT} third-placed teams reach the Round of 32. The
            order stays provisional until every group has finished.
          </p>
        </>
      )}
    </SurfaceCard>
  );
}

function KnockoutView({
  rounds,
  selectedTeamId,
  onOpenTeam,
}: {
  rounds: WorldCupSummarySnapshot["knockout"];
  selectedTeamId: string | null;
  onOpenTeam: (teamId: string) => void;
}) {
  if (rounds.length === 0) {
    return (
      <EmptyPanel
        title="The bracket builds after the group stage"
        description="This World Cup's knockout stage opens with a Round of 32, made up of the top two from every group plus the eight best third-placed teams. From there it runs through the Round of 16, quarterfinals, semifinals, and the final."
      />
    );
  }

  return (
    <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-2)" }}>
      {rounds.map((round) => (
        <SurfaceCard key={round.id} className="p-[var(--c97-sp-2)] sm:p-[var(--c97-sp-3)]">
          <div className="flex items-center justify-between" style={{ paddingBottom: "var(--c97-sp-2)" }}>
            <h3 className="c97-serif" style={{ fontSize: "var(--c97-fs-h3)" }}>
              {round.name}
            </h3>
            <span className="c97-meta">{round.fixtures.length} ties</span>
          </div>
          <div className="grid sm:grid-cols-2" style={{ gap: "var(--c97-sp-1)" }}>
            {round.fixtures.map((fixture) => (
              <FixtureCard
                key={fixture.id}
                fixture={fixture}
                contextTeamId={selectedTeamId}
                onOpenTeam={onOpenTeam}
                fallbackLabel={round.name}
              />
            ))}
          </div>
        </SurfaceCard>
      ))}
    </div>
  );
}

function worldCupFixtureLabel(fixture: unknown): string {
  const { stage, group } = fixture as { stage?: string | null; group?: string | null };
  if (group) return `Group ${group}`;
  return stage || "World Cup match";
}

function ScheduleView({
  recentFixtures,
  upcomingFixtures,
  onOpenTeam,
}: {
  recentFixtures: WorldCupSummarySnapshot["recentFixtures"];
  upcomingFixtures: WorldCupSummarySnapshot["upcomingFixtures"];
  onOpenTeam: (teamId: string) => void;
}) {
  if (recentFixtures.length === 0 && upcomingFixtures.length === 0) {
    return (
      <EmptyPanel
        title="The full schedule lands here"
        description="Once ESPN publishes the fixtures, results and upcoming matches show up in this view, grouped by day and linked to each team."
      />
    );
  }

  return (
    <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-2)" }}>
      {upcomingFixtures.length > 0 && (
        <FixtureGroupSection
          title="Next up"
          description="Upcoming matches"
          fixtures={upcomingFixtures}
          onOpenTeam={onOpenTeam}
          getFallbackLabel={worldCupFixtureLabel}
        />
      )}
      {recentFixtures.length > 0 && (
        <FixtureGroupSection
          title="Recent slate"
          description="Latest results"
          fixtures={recentFixtures}
          onOpenTeam={onOpenTeam}
          getFallbackLabel={worldCupFixtureLabel}
        />
      )}
    </div>
  );
}

function FormatCard({
  tournament,
}: {
  tournament: WorldCupSummarySnapshot["tournament"];
}) {
  return (
    <SurfaceCard style={{ padding: "var(--c97-sp-2)" }}>
      <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>How 2026 worked</p>
      <h3 className="c97-serif" style={{ marginBottom: "var(--c97-sp-2)", fontSize: "var(--c97-fs-h3)" }}>
        A bigger, three-country World Cup
      </h3>
      <p className="c97-prose">{tournament.format}</p>
      <dl
        className="grid"
        style={{ marginTop: "var(--c97-sp-2)", rowGap: "var(--c97-sp-1)", borderTop: "1px solid var(--c97-rule)", paddingTop: "var(--c97-sp-3)" }}
      >
        {(
          [
            ["Teams", `${tournament.teamCount}`],
            ["Groups", `${tournament.groupCount}`],
            ["Host cities", `${tournament.venues.length}`],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between" style={{ gap: "var(--c97-sp-1)" }}>
            <dt className="c97-kicker">{label}</dt>
            <dd className="c97-mono mb-0" style={{ fontWeight: 700 }}>{value}</dd>
          </div>
        ))}
      </dl>
      <div
        className="flex flex-wrap"
        style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)", borderTop: "1px solid var(--c97-rule)", paddingTop: "var(--c97-sp-3)" }}
      >
        <span className="c97-meta flex items-center">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          {formatTournamentWindow(tournament.startDate, tournament.endDate)}
        </span>
      </div>
      <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)", fontSize: "var(--c97-fs-small)" }}>
        Pick any team from the group tables or the bracket to pin its standing, form, and
        fixtures here.
      </p>
    </SurfaceCard>
  );
}

function TeamDetailCard({
  option,
  snapshot,
  isLoading,
  error,
  onClear,
  onOpenTeam,
}: {
  option: WorldCupTeamOption;
  snapshot: WorldCupTeamSnapshot | null;
  isLoading: boolean;
  error: string | null;
  onClear: () => void;
  onOpenTeam: (teamId: string) => void;
}) {
  const standing = snapshot?.standing ?? null;
  const form = snapshot?.form?.sequence ?? [];
  const recent = (snapshot?.recentFixtures ?? []).slice(0, 3);
  const upcoming = (snapshot?.upcomingFixtures ?? []).slice(0, 3);

  return (
    <SurfaceCard style={{ padding: "var(--c97-sp-2)" }}>
      {/*
        The live region and the test id sit on this wrapper rather than the
        card itself. SurfaceCard takes only children, className, and style, and
        spreads no rest props, so an aria-live (or a data-testid) set on it
        is silently dropped and the panel announced nothing when the
        selected team changed. TypeScript could not catch it: hyphenated JSX
        attribute names skip excess-property checking, so `aria-live`
        type-checked against a props type that has no such prop.
      */}
      <div aria-live="polite" data-testid="world-cup-selected-team">
        <div className="flex items-start" style={{ gap: "var(--c97-sp-1)" }}>
          <CrestAvatar crest={option.crest} name={option.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h3 className="c97-serif truncate" style={{ fontSize: "var(--c97-fs-h3)" }}>
              {option.name}
            </h3>
            <div className="flex flex-wrap" style={{ marginTop: "var(--c97-sp-0)", gap: "var(--c97-sp-0)" }}>
              {option.group && <InfoChip label={`Group ${option.group}`} />}
              {option.code && <InfoChip label={option.code} />}
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear selected team"
            className="c97-btn-ghost"
            style={{ flexShrink: 0, minHeight: 44, minWidth: 44, justifyContent: "center" }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {standing && (
          <dl
            className="grid grid-cols-3"
            style={{ marginTop: "var(--c97-sp-2)", columnGap: "var(--c97-sp-1)", rowGap: "var(--c97-sp-1)", borderTop: "1px solid var(--c97-rule)", paddingTop: "var(--c97-sp-3)" }}
          >
            {(
              [
                ["Pos", `${standing.rank}`],
                ["Pld", `${standing.played}`],
                ["Pts", `${standing.points}`],
                ["GF", `${standing.goalsFor}`],
                ["GA", `${standing.goalsAgainst}`],
                [
                  "GD",
                  standing.goalDifference > 0
                    ? `+${standing.goalDifference}`
                    : `${standing.goalDifference}`,
                ],
                ["W-D-L", `${standing.wins}-${standing.draws}-${standing.losses}`],
              ] as const
            ).map(([label, value]) => (
              // Seven stats in three columns: the record takes the whole last row.
              <div key={label} className={label === "W-D-L" ? "col-span-3" : undefined}>
                <dt className="c97-kicker">{label}</dt>
                <dd className="c97-mono mb-0" style={{ fontWeight: 700 }}>{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {form.length > 0 && (
          <div
            style={{ marginTop: "var(--c97-sp-2)", borderTop: "1px solid var(--c97-rule)", paddingTop: "var(--c97-sp-3)" }}
          >
            <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Form (last 5)</p>
            <div className="flex" style={{ gap: "var(--c97-sp-0)" }}>
              {form.map((result, index) => (
                <TeamResultPill key={index} result={result} />
              ))}
            </div>
          </div>
        )}

        {recent.length > 0 && (
          <div
            style={{ marginTop: "var(--c97-sp-2)", borderTop: "1px solid var(--c97-rule)", paddingTop: "var(--c97-sp-3)" }}
          >
            <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Recent results</p>
            <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-1)" }}>
              {recent.map((fixture) => (
                <FixtureCard
                  key={fixture.id}
                  fixture={fixture}
                  contextTeamId={option.id}
                  onOpenTeam={onOpenTeam}
                  compact
                />
              ))}
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div
            style={{ marginTop: "var(--c97-sp-2)", borderTop: "1px solid var(--c97-rule)", paddingTop: "var(--c97-sp-3)" }}
          >
            <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Upcoming</p>
            <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-1)" }}>
              {upcoming.map((fixture) => (
                <FixtureCard
                  key={fixture.id}
                  fixture={fixture}
                  contextTeamId={option.id}
                  onOpenTeam={onOpenTeam}
                  compact
                />
              ))}
            </div>
          </div>
        )}

        {!snapshot && (isLoading || error) && (
          <p
            className="c97-prose"
            style={{ marginTop: "var(--c97-sp-2)", borderTop: "1px solid var(--c97-rule)", paddingTop: "var(--c97-sp-3)" }}
            role={error ? "alert" : "status"}
          >
            {isLoading ? "Loading team snapshot…" : error}
          </p>
        )}

        {snapshot && !standing && recent.length === 0 && upcoming.length === 0 && (
          <p
            className="c97-prose"
            style={{ marginTop: "var(--c97-sp-2)", borderTop: "1px solid var(--c97-rule)", paddingTop: "var(--c97-sp-3)" }}
          >
            This snapshot has no standings or fixtures for {option.name}.
          </p>
        )}
      </div>
    </SurfaceCard>
  );
}
