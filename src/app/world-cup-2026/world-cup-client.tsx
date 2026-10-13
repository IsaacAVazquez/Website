"use client";

import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import {
  CrestAvatar,
  EmptyPanel,
  FixtureCard,
  FixtureLedgerSection,
  InfoChip,
  TeamResultPill,
} from "@/components/football";
import { groupFixtures } from "@/components/football/fixtureGroups";
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

/** How many group tables a phone prints before the rest wait behind a button. */
const PHONE_GROUP_LIMIT = 4;

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
  // The lookup's options, by group letter and then by name. The locale is
  // named so the server and the browser sort alike.
  const teamsByGroup = useMemo(
    () =>
      Array.from(
        groupBy(
          teamOptions.toSorted(
            (a, b) => a.group.localeCompare(b.group, "en") || a.name.localeCompare(b.name, "en")
          ),
          (team) => team.group
        ).entries()
      ),
    [teamOptions]
  );
  const teamPanelRef = useRef<HTMLDivElement>(null);

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
    // A pick in the hero bracket, or far down a phone's group list, changes a
    // card that is off screen, so the page goes to the card. The lookup and a
    // desktop's pinned column are already in view and stay where they are.
    const panel = teamPanelRef.current;
    if (panel) {
      const { top } = panel.getBoundingClientRect();
      if (top < 0 || top > window.innerHeight - 160) panel.scrollIntoView?.({ block: "start" });
    }
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

  const standfirst =
    "I wanted the last World Cup laid out the way a bracket poster reads after the final whistle, from every knockout round to the trophy and back down to the group tables.";
  const hostNations = venuesByCountry.map(([country]) => country);
  const hostLine =
    hostNations.length > 1
      ? `${hostNations.slice(0, -1).join(", ")}${hostNations.length > 2 ? "," : ""} and ${hostNations.at(-1)}`
      : hostNations[0] ?? null;
  const record: Array<{ label: string; value: string; detail?: string }> = [
    {
      label: "Champion",
      value: champion?.shortName ?? "—",
      detail: runnerUp ? `Beat ${runnerUp.shortName} in the final` : undefined,
    },
    { label: "Final", value: finalScoreLine ?? "—", detail: finalNode?.fixture.venue ?? undefined },
    {
      label: "Matches",
      value: `${tournament.matchCount}`,
      detail: `${tournament.teamCount} teams · ${tournament.groupCount} groups`,
    },
  ];

  return (
    <div className="wcup-root">
      <div className="c97-shell c97-frame wcup-column">
        <div className="wcup-titlebar">
          <div className="wcup-titletext">
            <h1 className="wcup-title">World Cup Pulse</h1>
            <p className="wcup-standfirst">{standfirst}</p>
            <p className="wcup-meta">
              <span>{tournament.name}</span>
              <span>{formatTournamentWindow(tournament.startDate, tournament.endDate)}</span>
              {hostLine ? <span>{hostLine}</span> : null}
              <span>{tournament.phase}</span>
            </p>
          </div>
          <dl className="wcup-record">
            {record.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd className="wcup-record-value">{item.value}</dd>
                {item.detail ? <dd className="wcup-record-detail">{item.detail}</dd> : null}
              </div>
            ))}
          </dl>
        </div>

        <section className="wcup-bracket" aria-labelledby="wcup-bracket-heading">
          <h2 id="wcup-bracket-heading" className="sr-only">
            Knockout bracket
          </h2>
          <WorldCupBracket tree={tree} onOpenTeam={handleTeamChange} />
        </section>

        <section id="world-cup-explore" className="wcup-explore" aria-labelledby="wcup-explore-heading">
          <div className="wcup-toolbar">
            <h2 id="wcup-explore-heading" className="wcup-h2">
              The tournament, stage by stage
            </h2>
            <div className="wcup-switch" role="tablist" aria-label="World Cup view switcher">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  id={`world-cup-tab-${option.id}`}
                  aria-controls={`world-cup-tabpanel-${option.id}`}
                  aria-selected={option.id === routeState.view}
                  onClick={() => handleViewChange(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <p className="wcup-muted">{VIEW_OPTIONS.find((option) => option.id === routeState.view)?.description}</p>

          <div className="wcup-explore-grid">
            {/*
              The lookup and the team it pins come first, so a phone shows the
              pick right under the control that made it. From xl it is the
              pinned right column.
            */}
            <aside className="wcup-aside">
              <div ref={teamPanelRef} className="wcup-lookup" style={{ scrollMarginTop: "var(--c97-sp-3)" }}>
                <label className="wcup-field">
                  <span className="wcup-label">Find a team</span>
                  <select
                    className="wcup-select"
                    value={selectedTeamId ?? ""}
                    onChange={(event) =>
                      event.target.value ? handleTeamChange(event.target.value) : clearTeam()
                    }
                  >
                    <option value="">Choose a team</option>
                    {teamsByGroup.map(([group, teams]) => (
                      <optgroup key={group} label={group ? `Group ${group}` : "Teams"}>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
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
                  <p className="wcup-muted">
                    Pick a team here, in a group table, or on the bracket to pin its standing, form, and results.
                  </p>
                )}
              </div>
            </aside>

            <div
              role="tabpanel"
              id={`world-cup-tabpanel-${routeState.view}`}
              aria-labelledby={`world-cup-tab-${routeState.view}`}
              className="wcup-panel"
            >
              {routeState.view === "groups" && (
                <GroupsView groups={groups} selectedTeamId={selectedTeamId} onOpenTeam={handleTeamChange} />
              )}
              {routeState.view === "knockout" && (
                <KnockoutView rounds={knockout} onOpenTeam={handleTeamChange} />
              )}
              {routeState.view === "schedule" && (
                <ScheduleView
                  recentFixtures={summary.recentFixtures}
                  upcomingFixtures={summary.upcomingFixtures}
                  onOpenTeam={handleTeamChange}
                />
              )}
            </div>
          </div>
        </section>

        {scorers.length > 0 && (
          <section className="wcup-section" aria-labelledby="wcup-boot-heading">
            <h2 id="wcup-boot-heading" className="wcup-h2">
              Golden Boot
            </h2>
            <div className="wcup-scroll" role="region" aria-label="Top scorers (scrollable)" tabIndex={0}>
              <table className="wcup-table" aria-label="Top scorers">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Player</th>
                    <th scope="col">Team</th>
                    <th scope="col" className="wcup-num">Goals</th>
                    <th scope="col" className="wcup-num wcup-sm">Assists</th>
                  </tr>
                </thead>
                <tbody>
                  {scorers.slice(0, 10).map((scorer) => (
                    <tr key={`${scorer.rank}-${scorer.name}`}>
                      <td className="wcup-mono">{scorer.rank}</td>
                      <td className="wcup-strong">{scorer.name}</td>
                      <td className="wcup-mono">{scorer.teamCode}</td>
                      <td className="wcup-num wcup-strong">{scorer.goals}</td>
                      <td className="wcup-num wcup-sm">{scorer.assists}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="wcup-section" aria-labelledby="wcup-venues-heading">
          <div className="wcup-toolbar wcup-toolbar--plain">
            <h2 id="wcup-venues-heading" className="wcup-h2">
              Host venues
            </h2>
            <span className="wcup-muted">
              {tournament.venues.length} stadiums · {venuesByCountry.length} nations
            </span>
          </div>
          <div className="wcup-venues">
            {venuesByCountry.map(([country, venues]) => (
              <div key={country}>
                <h3 className="wcup-h3">
                  {country}, {venues.length}
                </h3>
                <ul className="wcup-venue-list">
                  {venues.map((venue) => (
                    <li key={`${venue.city}-${venue.stadium}`}>
                      <span className="wcup-strong">{venue.city}</span> {venue.stadium}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <p className="wcup-source">
          The tournament ended on {formatLongDate(tournament.endDate)}. The group tables, fixtures, bracket, and
          scorers come from ESPN&apos;s public World Cup endpoints, checked in on {snapshotDateLabel}, so nothing on
          this page updates live.
          {scorers.length === 0
            ? " ESPN's scorer feed carried no golden boot table when this snapshot was taken, so the page lists no top scorers."
            : null}
        </p>
      </div>
    </div>
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
  const [showAllGroups, setShowAllGroups] = useState(false);

  if (groups.length === 0) {
    return (
      <EmptyPanel
        title="Group standings open with the first whistle"
        description="All 12 group tables populate here once the group stage begins. Until then, browse the host venues and the tournament format below."
      />
    );
  }

  return (
    <div className="wcup-stack">
      <QualificationLegend />
      <div className="wcup-groups">
        {groups.map((group, index) => (
          <GroupTable
            key={group.letter || group.name}
            group={group}
            selectedTeamId={selectedTeamId}
            onOpenTeam={onOpenTeam}
            // Twelve tables run about seven phone screens, so below lg the
            // list stops at four plus the selected team's group. From lg the
            // two-column grid prints all of them.
            heldOnPhone={
              index >= PHONE_GROUP_LIMIT &&
              !showAllGroups &&
              !group.standings.some((row) => row.teamId === selectedTeamId)
            }
          />
        ))}
      </div>
      {groups.length > PHONE_GROUP_LIMIT ? (
        // The hide is on a wrapper because the button sets its own
        // display, which is unlayered and beats a display utility.
        <div className="lg:hidden">
          <button
            type="button"
            className="wcup-more"
            aria-expanded={showAllGroups}
            onClick={() => setShowAllGroups((shown) => !shown)}
          >
            {showAllGroups ? `Show the first ${PHONE_GROUP_LIMIT} groups` : `Show all ${groups.length} groups`}
          </button>
        </div>
      ) : null}
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
    <ul className="wcup-legend">
      <li>
        <span className="wcup-zone" data-zone="through" aria-hidden="true" />
        Top two advance to the Round of 32
      </li>
      <li>
        <span className="wcup-zone" data-zone="third" aria-hidden="true" />
        Third place enters the eight-team wildcard race
      </li>
    </ul>
  );
}

function GroupTable({
  group,
  selectedTeamId,
  onOpenTeam,
  heldOnPhone,
}: {
  group: WorldCupGroup;
  selectedTeamId: string | null;
  onOpenTeam: (teamId: string) => void;
  heldOnPhone: boolean;
}) {
  return (
    <div className={heldOnPhone ? "wcup-group @container hidden lg:block" : "wcup-group @container"}>
      <h3 className="wcup-h3 wcup-group-name">{group.name}</h3>
      <table className="wcup-table" aria-label={`${group.name} standings`}>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Team</th>
            <th scope="col" className="wcup-num">P</th>
            <th scope="col" className="wcup-num hidden @md:table-cell">W</th>
            <th scope="col" className="wcup-num hidden @md:table-cell">D</th>
            <th scope="col" className="wcup-num hidden @md:table-cell">L</th>
            <th scope="col" className="wcup-num">GD</th>
            <th scope="col" className="wcup-num">Pts</th>
          </tr>
        </thead>
        <tbody>
          {group.standings.map((row, index) => {
            const isSelected = row.teamId === selectedTeamId;
            const zone = index < 2 ? "through" : index === 2 ? "third" : "out";
            const zoneTitle =
              index < 2
                ? "In a direct qualifying place"
                : index === 2
                  ? "In the third-place wildcard race"
                  : undefined;
            return (
              <tr key={row.teamId} data-selected={isSelected || undefined}>
                <td>
                  <span className="wcup-pos">
                    <span className="wcup-zone" data-zone={zone} title={zoneTitle} aria-hidden="true" />
                    <span>{row.rank}</span>
                    {zoneTitle ? <span className="sr-only">{zoneTitle}</span> : null}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => onOpenTeam(row.teamId)}
                    aria-pressed={isSelected}
                    aria-label={`Show ${row.name} details`}
                    className="wcup-team"
                  >
                    {row.crest ? <img src={row.crest} alt="" loading="lazy" decoding="async" className="wcup-crest" /> : null}
                    <span>{row.code || row.name}</span>
                  </button>
                </td>
                <td className="wcup-num">{row.played}</td>
                <td className="wcup-num hidden @md:table-cell">{row.wins}</td>
                <td className="wcup-num hidden @md:table-cell">{row.draws}</td>
                <td className="wcup-num hidden @md:table-cell">{row.losses}</td>
                <td className="wcup-num">
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </td>
                <td className="wcup-num wcup-strong">
                  {row.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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
    <div className="wcup-race @container">
      <div className="wcup-toolbar wcup-toolbar--plain">
        <h3 className="wcup-h3">Third-place race</h3>
        <span className="wcup-muted">
          Best {THIRD_PLACE_QUALIFY_COUNT} of {rows.length} advance
        </span>
      </div>

      {!started ? (
        <p className="wcup-muted">
          This World Cup keeps eight third-placed teams. Once the group matches begin, the side
          that finishes third in every group is ranked here by points, then goal difference, then
          goals scored, and the best eight join the top two from each group in the Round of 32.
        </p>
      ) : (
        <>
          <table className="wcup-table" aria-label="Third-place wildcard race">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Team</th>
                <th scope="col">Grp</th>
                <th scope="col" className="wcup-num hidden @md:table-cell">P</th>
                <th scope="col" className="wcup-num">GD</th>
                <th scope="col" className="wcup-num">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSelected = row.teamId === selectedTeamId;
                return (
                  <tr key={row.teamId} data-selected={isSelected || undefined}>
                    <td>
                      <span className="wcup-pos">
                        <span
                          className="wcup-zone"
                          data-zone={row.qualifies ? "through" : "out"}
                          title={row.qualifies ? "In a qualifying place" : "Outside the cut"}
                          aria-hidden="true"
                        />
                        <span>{row.rank}</span>
                        <span className="sr-only">{row.qualifies ? "In a qualifying place" : "Outside the cut"}</span>
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onOpenTeam(row.teamId)}
                        aria-pressed={isSelected}
                        aria-label={`Show ${row.name} details`}
                        className="wcup-team"
                      >
                        {row.crest ? <img src={row.crest} alt="" loading="lazy" decoding="async" className="wcup-crest" /> : null}
                        <span>{row.code || row.name}</span>
                      </button>
                    </td>
                    <td>{row.group}</td>
                    <td className="wcup-num hidden @md:table-cell">{row.played}</td>
                    <td className="wcup-num">
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </td>
                    <td className="wcup-num wcup-strong">
                      {row.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="wcup-muted">
            The top {THIRD_PLACE_QUALIFY_COUNT} third-placed teams reach the Round of 32. The
            order stays provisional until every group has finished.
          </p>
        </>
      )}
    </div>
  );
}

// The days a round was played over, in the zone the fixture rows print their kickoffs in.
const ROUND_DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});

function roundDays(fixtures: Array<{ utcDate: string }>): string {
  const days = fixtures
    .map((fixture) => new Date(fixture.utcDate))
    .filter((date) => !Number.isNaN(date.getTime()))
    .toSorted((a, b) => a.getTime() - b.getTime())
    .map((date) => ROUND_DAY_FORMATTER.format(date));
  if (days.length === 0) return "Dates TBD";
  return days[0] === days.at(-1) ? days[0] : `${days[0]} to ${days.at(-1)}`;
}

/** The bracket's keyboard path: every round as a ruled list of ties, each team a button. */
function KnockoutView({
  rounds,
  onOpenTeam,
}: {
  rounds: WorldCupSummarySnapshot["knockout"];
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
    <div className="wcup-stack">
      {rounds.map((round) => (
        <div key={round.id}>
          <div className="wcup-toolbar wcup-toolbar--plain">
            <h3 className="wcup-h3">{round.name}</h3>
            <span className="wcup-muted">{round.fixtures.length} ties</span>
          </div>
          <FixtureLedgerSection
            groups={[{ key: round.id, label: roundDays(round.fixtures), fixtures: round.fixtures }]}
            onOpenTeam={onOpenTeam}
          />
        </div>
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
        description="Once ESPN publishes the fixtures, results and upcoming matches show up here with dates and links to each team."
      />
    );
  }

  return (
    <div className="wcup-stack">
      {upcomingFixtures.length > 0 && (
        <div>
          <h3 className="wcup-h3">Next up</h3>
          <FixtureLedgerSection groups={groupFixtures(upcomingFixtures, worldCupFixtureLabel)} onOpenTeam={onOpenTeam} />
        </div>
      )}
      {recentFixtures.length > 0 && (
        <div>
          <h3 className="wcup-h3">Recent slate</h3>
          <FixtureLedgerSection groups={groupFixtures(recentFixtures, worldCupFixtureLabel)} onOpenTeam={onOpenTeam} />
        </div>
      )}
    </div>
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
    // The card is the team: its crest, group, standing, form, and fixtures.
    <div className="wcup-card">
      <div aria-live="polite" data-testid="world-cup-selected-team">
        <div className="flex items-start" style={{ gap: "var(--c97-sp-1)" }}>
          <CrestAvatar crest={option.crest} name={option.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h3 className="wcup-h3 truncate">
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
            className="wcup-clear"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {standing && (
          <dl
            className="wcup-card-stats wcup-card-section"
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
                <dt className="wcup-label">{label}</dt>
                <dd className="wcup-mono wcup-strong">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {form.length > 0 && (
          <div
            className="wcup-card-section"
          >
            <p className="wcup-label">Form (last 5)</p>
            <div className="flex" style={{ gap: "var(--c97-sp-0)" }}>
              {form.map((result, index) => (
                <TeamResultPill key={index} result={result} />
              ))}
            </div>
          </div>
        )}

        {recent.length > 0 && (
          <div
            className="wcup-card-section"
          >
            <p className="wcup-label">Recent results</p>
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
            className="wcup-card-section"
          >
            <p className="wcup-label">Upcoming</p>
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
            className="wcup-muted wcup-card-section"
            role={error ? "alert" : "status"}
          >
            {isLoading ? "Loading team snapshot…" : error}
          </p>
        )}

        {snapshot && !standing && recent.length === 0 && upcoming.length === 0 && (
          <p
            className="wcup-muted wcup-card-section"
          >
            This snapshot has no standings or fixtures for {option.name}.
          </p>
        )}
      </div>
    </div>
  );
}
