"use client";

import { startTransition, useEffect, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, CircleAlert, ExternalLink, Shield, TrendingUp, Trophy } from "lucide-react";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { cn } from "@/lib/utils";
import {
  SurfaceCard,
  StatCard,
  MetricCard,
  InfoChip,
  CrestAvatar,
  TeamResultPill,
  FixtureCard,
  LeaderList,
} from "@/components/football";
import { laLigaSnapshot } from "@/data/laLigaSnapshot";
import type { LaLigaClub, LaLigaLeader, LaLigaRouteState, LaLigaView } from "@/types/la-liga";
import {
  buildLaLigaHref,
  DEFAULT_LA_LIGA_STATE,
  filterClubsForView,
  getDefaultClubForView,
  LA_LIGA_ROUTE,
  normalizeLaLigaState,
} from "./la-liga-state";

interface LaLigaClientProps {
  initialState: LaLigaRouteState;
}

const clubs = laLigaSnapshot.clubs;
const clubById = new Map(clubs.map((club) => [club.id, club]));
const attackRankings = clubs
  .toSorted((left, right) => right.goalsFor - left.goalsFor || left.position - right.position)
  .map((club, index) => [club.id, index + 1] as const);
const defenseRankings = clubs
  .toSorted(
    (left, right) => left.goalsAgainst - right.goalsAgainst || left.position - right.position
  )
  .map((club, index) => [club.id, index + 1] as const);
const attackRankByClub = new Map(attackRankings);
const defenseRankByClub = new Map(defenseRankings);
const scorersByClub = groupLeadersByClub(laLigaSnapshot.scorers);
const clubLookup = new Map(clubs.map((club) => [club.id, club.shortName]));
const crestByClubId = new Map(
  laLigaSnapshot.teams.map((t) => [t.tla?.toLowerCase() ?? "", t.crest] as const)
);
const snapshotDateLabel = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
}).format(new Date(laLigaSnapshot.updatedAt));

const leader = clubs[0];
const runnerUp = clubs[1];
const fourthPlace = clubs[3];
const fifthPlace = clubs[4];
const sixthPlace = clubs[5];
const seventhPlace = clubs[6];
const safetyLine = clubs[16];
const dropLine = clubs[17];
const bestAttack = clubs.toSorted(
  (left, right) => right.goalsFor - left.goalsFor || left.position - right.position
)[0];
const bestDefense = clubs.toSorted(
  (left, right) => left.goalsAgainst - right.goalsAgainst || left.position - right.position
)[0];

const viewOptions: Array<{
  id: LaLigaView;
  label: string;
  description: string;
}> = [
  {
    id: "table",
    label: "Full table",
    description: "All 20 clubs in the current standings order.",
  },
  {
    id: "title-race",
    label: "Title chase",
    description: "The top four clubs still shaping the top of the table.",
  },
  {
    id: "europe",
    label: "European places",
    description: "The clubs currently inside the Champions, Europa, and Conference lines.",
  },
  {
    id: "relegation",
    label: "Relegation fight",
    description: "Bottom-five pressure view around the safety line.",
  },
];

export function LaLigaClient({ initialState }: LaLigaClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const currentHref = `${LA_LIGA_ROUTE}${currentQuery ? `?${currentQuery}` : ""}`;
  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("club") !== null;
  const routeState = hasManagedParams ? normalizeLaLigaState(searchParams) : initialState;
  const visibleClubs = filterClubsForView(routeState.view);
  const selectedClubId = visibleClubs.some((club) => club.id === routeState.club)
    ? routeState.club
    : getDefaultClubForView(routeState.view);
  const selectedClub = clubById.get(selectedClubId) ?? clubs[0];
  const desiredHref = buildLaLigaHref(
    {
      view: routeState.view,
      club: selectedClubId,
    },
    searchParams
  );

  useEffect(() => {
    if (currentHref === desiredHref) {
      return;
    }

    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  function navigate(nextState: LaLigaRouteState) {
    const href = buildLaLigaHref(nextState, searchParams);
    if (href === currentHref) {
      return;
    }

    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function handleViewChange(view: LaLigaView) {
    const nextClubs = filterClubsForView(view);
    const nextClub = nextClubs.some((club) => club.id === selectedClubId)
      ? selectedClubId
      : nextClubs[0]?.id ?? DEFAULT_LA_LIGA_STATE.club;

    navigate({ view, club: nextClub });
  }

  function handleClubChange(clubId: string) {
    navigate({ view: routeState.view, club: clubId });
  }

  const clubStoryline = getClubStoryline(selectedClub);
  const clubPressurePoints = getClubPressurePoints(selectedClub);
  const clubScorers = scorersByClub.get(selectedClub.id) ?? [];
  const selectedZone = getClubZone(selectedClub.position);
  const teamSnapshot = laLigaSnapshot.teamSnapshots[selectedClub.id];
  const formSequence = teamSnapshot?.form?.sequence ?? [];
  const recentFixtures = (teamSnapshot?.recentFixtures ?? []).slice(-3);
  const upcomingFixtures = (teamSnapshot?.upcomingFixtures ?? []).slice(0, 3);

  return (
    <section className="page-section relative overflow-hidden bg-[var(--surface-primary)]">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[26rem] opacity-90"
        style={{
          background:
            "radial-gradient(circle at top, color-mix(in srgb, var(--color-primary) 18%, transparent), transparent 56%)",
        }}
      />

      <div className="page-shell relative space-y-8 sm:space-y-10">
        <div className="section-panel p-6 sm:p-8 lg:p-10">
          <SectionIntro
            eyebrow="Football Data Tool"
            size="lg"
            title="La Liga Pulse"
            description="I track the La Liga title race, European cutoff, and relegation pressure here. Updated weekly from football-data.org."
          />

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
            <InfoChip label={`Season ${laLigaSnapshot.season}`} />
            <InfoChip label={`Matchday ${laLigaSnapshot.matchday}`} />
            <InfoChip label={`Snapshot ${snapshotDateLabel}`} />
            <InfoChip label={laLigaSnapshot.sourceLabel} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              variant="compact"
              eyebrow="Leader"
              metric={`${leader.shortName} · ${leader.points} pts`}
              detail={`${leader.points - runnerUp.points} clear of ${runnerUp.shortName}`}
              icon={<Trophy className="h-4 w-4" />}
            />
            <StatCard
              variant="compact"
              eyebrow="Top-four line"
              metric={`+${fourthPlace.points - fifthPlace.points} pts`}
              detail={`${fourthPlace.shortName} over ${fifthPlace.shortName}`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatCard
              variant="compact"
              eyebrow="Europe line"
              metric={`+${sixthPlace.points - seventhPlace.points} pts`}
              detail={`${sixthPlace.shortName} over ${seventhPlace.shortName}`}
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <StatCard
              variant="compact"
              eyebrow="Safety line"
              metric={`+${safetyLine.points - dropLine.points} pt`}
              detail={`${safetyLine.shortName} over ${dropLine.shortName}`}
              icon={<Shield className="h-4 w-4" />}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[var(--color-primary)]" />
              Best attack: {bestAttack.shortName} ({bestAttack.goalsFor} GF)
            </span>
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[var(--color-success)]" />
              Best defense: {bestDefense.shortName} ({bestDefense.goalsAgainst} GA)
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.95fr)]">
          <section className="section-panel p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Standings</h2>
              <span className="text-sm text-[var(--text-secondary)]">{visibleClubs.length} clubs</span>
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
                    <span className="text-[var(--text-primary)]">{option.label}</span>
                    <span className="text-xs text-[var(--text-tertiary)]">{filterClubsForView(option.id).length}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
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
                  {visibleClubs.map((club) => {
                    const isSelected = club.id === selectedClub.id;
                    const zone = getClubZone(club.position);

                    return (
                      <tr
                        key={club.id}
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
                            <span className="text-sm font-semibold text-[var(--text-primary)]">{club.position}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <button
                            type="button"
                            onClick={() => handleClubChange(club.id)}
                            aria-pressed={isSelected}
                            aria-label={`Show ${club.name} details`}
                            className="flex min-h-[44px] w-full items-center gap-2 rounded-xl text-left"
                          >
                            <CrestAvatar crest={crestByClubId.get(club.id) ?? null} name={club.shortName} size="sm" />
                            <span className="font-semibold text-[var(--text-primary)]">{club.shortName}</span>
                          </button>
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--text-secondary)] sm:table-cell">
                          {club.won}-{club.drawn}-{club.lost}
                        </td>
                        <td className="px-3 py-3 align-middle text-sm font-semibold text-[var(--text-primary)]">
                          {club.points}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--text-secondary)] md:table-cell">
                          {formatFixed(club.points / club.played)}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--text-secondary)] lg:table-cell">
                          {club.goalsFor}
                        </td>
                        <td className="hidden px-3 py-3 align-middle text-sm text-[var(--text-secondary)] lg:table-cell">
                          {club.goalsAgainst}
                        </td>
                        <td className="px-3 py-3 align-middle text-sm font-medium text-[var(--text-primary)]">
                          {club.goalDifference > 0 ? `+${club.goalDifference}` : club.goalDifference}
                        </td>
                        <td className="hidden rounded-r-2xl px-3 py-3 align-middle xl:table-cell">
                          <div className="h-2.5 w-28 rounded-full bg-[var(--surface-secondary)]">
                            <div
                              className="h-full rounded-full bg-[var(--color-primary)] transition-[width]"
                              style={{ width: `${(club.points / leader.points) * 100}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section
              className="section-panel p-5 sm:p-6"
              aria-live="polite"
              data-testid="la-liga-selected-club"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <CrestAvatar
                    crest={crestByClubId.get(selectedClub.id) ?? null}
                    name={selectedClub.name}
                    size="lg"
                  />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Club snapshot
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                      {selectedClub.name}
                    </h2>
                  </div>
                </div>
                <div className="flex-shrink-0 rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-right text-[var(--text-inverse)] shadow-sm">
                  <p className="text-xs uppercase tracking-[0.14em] opacity-80">Position</p>
                  <p className="text-2xl font-bold">{selectedClub.position}</p>
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
                  {selectedClub.points} points
                </span>
                <span className="inline-flex items-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                  {38 - selectedClub.played} matches left
                </span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                {clubStoryline}
              </p>

              <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3">
                <MetricCard label="PPG" value={formatFixed(selectedClub.points / selectedClub.played)} />
                <MetricCard label="Record" value={`${selectedClub.won}-${selectedClub.drawn}-${selectedClub.lost}`} />
                <MetricCard label="Attack rank" value={`#${attackRankByClub.get(selectedClub.id) ?? "-"}`} />
                <MetricCard label="Defense rank" value={`#${defenseRankByClub.get(selectedClub.id) ?? "-"}`} />
                <MetricCard label="GF / match" value={formatFixed(selectedClub.goalsFor / selectedClub.played)} />
                <MetricCard label="GA / match" value={formatFixed(selectedClub.goalsAgainst / selectedClub.played)} />
              </div>

              {formSequence.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    Recent form
                  </p>
                  <div className="flex gap-1.5">
                    {formSequence.slice(-5).map((result, i) => (
                      <TeamResultPill key={i} result={result} />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Pressure points</p>
                <ul className="mt-3 space-y-2 pl-5 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {clubPressurePoints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <ClubLeaderCard
                title="Top scorer"
                leader={clubScorers[0]}
                statLabel="Goals"
                emptyLabel="No current top-10 scorer in this snapshot."
              />

              {recentFixtures.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    Recent results
                  </p>
                  <div className="space-y-2">
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
                <div className="mt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    Upcoming fixtures
                  </p>
                  <div className="space-y-2">
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
            </section>

            <section className="section-panel p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    Goals leaderboard
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
                    Top scorers
                  </h3>
                </div>
                <a
                  href={laLigaSnapshot.sourceUrls.scorers}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--color-primary)]"
                >
                  Official
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <LeaderList leaders={laLigaSnapshot.scorers} statLabel="goals" clubLookup={clubLookup} />
            </section>

            <section className="rounded-3xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-5 text-sm text-[var(--text-secondary)] shadow-sm">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-warning)]" />
                <p className="mb-0 max-w-none leading-relaxed">
                  This page is a curated snapshot rather than a live API feed. Standings come from the official LALIGA table, while the scorer and assist boards mirror the official stats pages linked above.
                </p>
              </div>
            </section>
          </aside>
        </div>

        {/* League-wide fixtures */}
        {(laLigaSnapshot.recentFixtures.length > 0 || laLigaSnapshot.upcomingFixtures.length > 0) && (
          <div className="grid gap-6 md:grid-cols-2">
            {laLigaSnapshot.recentFixtures.length > 0 && (
              <SurfaceCard className="p-5 sm:p-6">
                <div className="border-b border-[var(--border-primary)] pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Recent slate</p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Latest results</h3>
                </div>
                <div className="mt-4 space-y-3">
                  {laLigaSnapshot.recentFixtures.slice(0, 6).map((f) => (
                    <FixtureCard key={f.id} fixture={f} onOpenTeam={handleClubChange} />
                  ))}
                </div>
              </SurfaceCard>
            )}
            {laLigaSnapshot.upcomingFixtures.length > 0 && (
              <SurfaceCard className="p-5 sm:p-6">
                <div className="border-b border-[var(--border-primary)] pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Next up</p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Upcoming fixtures</h3>
                </div>
                <div className="mt-4 space-y-3">
                  {laLigaSnapshot.upcomingFixtures.slice(0, 6).map((f) => (
                    <FixtureCard key={f.id} fixture={f} onOpenTeam={handleClubChange} />
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


function ClubLeaderCard({
  title,
  leader,
  statLabel,
  emptyLabel,
}: {
  title: string;
  leader?: LaLigaLeader;
  statLabel: string;
  emptyLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
        {title}
      </p>
      {leader ? (
        <>
          <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">{leader.name}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {leader.total} {statLabel.toLowerCase()} in {leader.appearances} matches
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            {formatFixed(leader.perMatch)} per match
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{emptyLabel}</p>
      )}
    </div>
  );
}


function groupLeadersByClub(leaders: LaLigaLeader[]) {
  return leaders.reduce((map, leaderEntry) => {
    const existing = map.get(leaderEntry.clubId) ?? [];
    existing.push(leaderEntry);
    map.set(leaderEntry.clubId, existing);
    return map;
  }, new Map<string, LaLigaLeader[]>());
}

function getZoneDotColor(zone: ReturnType<typeof getClubZone>): string {
  switch (zone) {
    case "champions": return "var(--color-primary)";
    case "europa": return "var(--color-warning)";
    case "conference": return "var(--color-success)";
    case "relegation": return "var(--color-error)";
    default: return "var(--border-primary)";
  }
}

function getClubZone(position: number) {
  if (position <= 4) {
    return "champions";
  }

  if (position === 5) {
    return "europa";
  }

  if (position === 6) {
    return "conference";
  }

  if (position >= 18) {
    return "relegation";
  }

  return "midtable";
}

function getZoneLabel(zone: ReturnType<typeof getClubZone>) {
  switch (zone) {
    case "champions":
      return "Champions League";
    case "europa":
      return "Europa League";
    case "conference":
      return "Conference League";
    case "relegation":
      return "Drop zone";
    case "midtable":
    default:
      return "Midtable";
  }
}

function getZonePillStyle(zone: ReturnType<typeof getClubZone>): CSSProperties {
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
        color: "var(--color-error)",
        borderColor: "color-mix(in srgb, var(--color-error) 30%, var(--border-primary))",
        background: "color-mix(in srgb, var(--color-error) 10%, var(--surface-secondary))",
      };
    case "midtable":
    default:
      return {
        color: "var(--text-secondary)",
        borderColor: "var(--border-primary)",
        background: "var(--surface-secondary)",
      };
  }
}

function getViewButtonStyle(isActive: boolean): CSSProperties {
  if (isActive) {
    return {
      borderColor: "color-mix(in srgb, var(--color-primary) 35%, var(--border-primary))",
      background: "color-mix(in srgb, var(--color-primary) 9%, var(--surface-secondary))",
      boxShadow: "var(--shadow-sm)",
    };
  }

  return {
    borderColor: "var(--border-primary)",
    background: "var(--surface-secondary)",
  };
}

function getTableRowStyle(isSelected: boolean): CSSProperties | undefined {
  if (!isSelected) {
    return undefined;
  }

  return {
    background: "color-mix(in srgb, var(--color-primary) 7%, var(--surface-elevated))",
    boxShadow: "var(--shadow-sm)",
  };
}

function getClubStoryline(club: LaLigaClub) {
  if (club.position === 1) {
    return `${club.shortName} own the league lead, carry the division's best attack, and sit ${club.points - runnerUp.points} points clear of ${runnerUp.shortName}.`;
  }

  if (club.position <= 4) {
    return `${club.shortName} are ${leader.points - club.points} points off the pace and ${club.points - fifthPlace.points} clear of the Europa line below them.`;
  }

  if (club.position <= 6) {
    return `${club.shortName} currently occupy a European spot and have a ${club.points - seventhPlace.points}-point buffer over the first club outside qualification.`;
  }

  if (club.position <= 17) {
    return `${club.shortName} are ${sixthPlace.points - club.points} points short of Europe and ${club.points - dropLine.points} points above the current relegation line.`;
  }

  return `${club.shortName} are chasing safety from inside the bottom three and need ${safetyLine.points - club.points} more points just to draw level with the safe line.`;
}

function getClubPressurePoints(club: LaLigaClub) {
  const attackRank = attackRankByClub.get(club.id) ?? club.position;
  const defenseRank = defenseRankByClub.get(club.id) ?? club.position;

  if (club.position === 1) {
    return [
      `${club.points - runnerUp.points} points separate ${club.shortName} from ${runnerUp.shortName}.`,
      `${club.goalsFor} goals scored is the best attack in the division.`,
      `Nine league matches remain in this local snapshot.`,
      `Attack rank #${attackRank}; defense rank #${defenseRank}.`,
    ];
  }

  if (club.position <= 4) {
    return [
      `${leader.points - club.points} points back from the league lead.`,
      `${club.points - fifthPlace.points} points clear of the top-four cutoff.`,
      `Goal difference: ${club.goalDifference > 0 ? `+${club.goalDifference}` : club.goalDifference}.`,
      `Attack rank #${attackRank}; defense rank #${defenseRank}.`,
    ];
  }

  if (club.position <= 6) {
    return [
      `${club.points - seventhPlace.points} points above the first club outside Europe.`,
      `${leader.points - club.points} points back from first place.`,
      `Goals for/against: ${club.goalsFor} scored, ${club.goalsAgainst} conceded.`,
      `Attack rank #${attackRank}; defense rank #${defenseRank}.`,
    ];
  }

  if (club.position <= 17) {
    return [
      `${sixthPlace.points - club.points} points separate ${club.shortName} from Europe.`,
      `${club.points - dropLine.points} points above the drop line.`,
      `Goal difference: ${club.goalDifference > 0 ? `+${club.goalDifference}` : club.goalDifference}.`,
      `Attack rank #${attackRank}; defense rank #${defenseRank}.`,
    ];
  }

  return [
    `${safetyLine.points - club.points} points to reach the current safety line.`,
    `${club.goalsAgainst} goals conceded puts pressure on their run-in.`,
    `Only ${38 - club.played} matches remain in this snapshot.`,
    `Attack rank #${attackRank}; defense rank #${defenseRank}.`,
  ];
}

function formatFixed(value: number) {
  return value.toFixed(2);
}
