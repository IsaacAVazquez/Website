"use client";

import { SeasonalScopeNote } from "@/components/fantasy/SeasonalScopeNote";
import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import type { DraftPick, ScoringFormat } from "@/types";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import { scoringFormatToRouteScoring } from "@/lib/fantasy";
import {
  getNflRegularSeasonWeek,
  formatAdp,
  getFantasyAdpFreshness,
  getSnapshotStaleness,
  getSnapshotStalenessLabel,
  withoutPlayerAdp,
} from "@/lib/fantasyUtils";
import { getDefaultSettings } from "@/app/fantasy-football/draft-tracker/hooks/useDraftState";
import { calculateRedraftDraftValues } from "@/lib/fantasyTeamValue";
import { classifyPickValue } from "@/lib/draftAnalytics";
import { DraftValuePanel } from "@/components/fantasy/DraftValuePanel";
import {
  PositionFilterBar,
  type PositionFilterOption,
} from "@/components/fantasy/PositionFilterBar";
import {
  DEFAULT_MOCK_DRAFT_SETTINGS,
  getMockDraftStorageKey,
  useMockDraftState,
} from "./hooks/useMockDraftState";

const SCORING_OPTIONS: Array<{ value: ScoringFormat; label: string }> = [
  { value: "PPR", label: "PPR" },
  { value: "HALF_PPR", label: "Half PPR" },
  { value: "STANDARD", label: "Standard" },
];

const TEAM_OPTIONS = [8, 10, 12, 14];
const ROUND_OPTIONS = [13, 14, 15, 16];

type BoardPositionFilter = "ALL" | "QB" | "RB" | "WR" | "TE" | "K" | "DST";

const POSITION_FILTER_OPTIONS: PositionFilterOption<BoardPositionFilter>[] = [
  { value: "ALL", label: "All" },
  { value: "QB", label: "QB", position: "QB" },
  { value: "RB", label: "RB", position: "RB" },
  { value: "WR", label: "WR", position: "WR" },
  { value: "TE", label: "TE", position: "TE" },
  { value: "K", label: "K", position: "K" },
  { value: "DST", label: "DST", position: "DST" },
];

const VISIBLE_BOARD_ROWS = 40;

function formatPickLabel(pickNumber: number, totalTeams: number): string {
  const round = Math.ceil(pickNumber / totalTeams);
  const slot = pickNumber - (round - 1) * totalTeams;
  return `${round}.${String(slot).padStart(2, "0")}`;
}

const CHIP_STYLE: React.CSSProperties = {
  borderColor: "var(--home-rule)",
  color: "var(--home-ink-muted)",
};

function StatusChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.08em]"
      style={CHIP_STYLE}
    >
      {children}
    </span>
  );
}

/**
 * The mock draft practice room. One route-level surface with three states:
 * a setup card, the live room while the user is on the clock, and the recap
 * once all picks are in. Opponent picks come from the seeded engine, so the
 * whole room is reproducible and resumable from localStorage.
 */
export function MockDraftClient() {
  const [scoringSelection, setScoringSelection] = useState<ScoringFormat>(
    DEFAULT_MOCK_DRAFT_SETTINGS.scoringFormat
  );
  const [totalTeams, setTotalTeams] = useState(DEFAULT_MOCK_DRAFT_SETTINGS.totalTeams);
  const [rounds, setRounds] = useState(DEFAULT_MOCK_DRAFT_SETTINGS.rounds);
  const [userTeam, setUserTeam] = useState(DEFAULT_MOCK_DRAFT_SETTINGS.userTeam);
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState<BoardPositionFilter>("ALL");
  const [resetArmed, setResetArmed] = useState(false);

  // A persisted room decides which scoring board to fetch, so a saved
  // Standard room resumes onto Standard ranks after a reload. The hook
  // itself refuses to hydrate until the matching board arrives.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(getMockDraftStorageKey());
      if (!raw) return;
      const saved = (JSON.parse(raw) as { settings?: { scoringFormat?: unknown } })
        ?.settings?.scoringFormat;
      if (saved === "PPR" || saved === "HALF_PPR" || saved === "STANDARD") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot post-mount read of the persisted room's scoring
        setScoringSelection(saved);
      }
    } catch {
      // Ignore: an unreadable save just means a fresh setup card.
    }
  }, []);

  useEffect(() => {
    if (!resetArmed) return;
    const timeout = window.setTimeout(() => setResetArmed(false), 5_000);
    return () => window.clearTimeout(timeout);
  }, [resetArmed]);

  const routeScoring = scoringFormatToRouteScoring(scoringSelection);
  const { snapshot, metadata, isLoading, error, retry } = useFantasySnapshot({
    scoring: routeScoring,
  });

  // Same rule as the draft tracker: nothing that models or logs a pick may
  // use a board from another scoring format, including the one-render-stale
  // value the snapshot hook keeps while switching.
  const snapshotMatches = snapshot?.scoringFormat === scoringSelection;
  const overallMeta = snapshotMatches ? (snapshot?.sliceMetadata?.overall ?? null) : null;
  const boardReady = Boolean(
    !isLoading &&
      !error &&
      snapshotMatches &&
      snapshot &&
      overallMeta?.available !== false &&
      snapshot.overall.length > 0
  );
  const adpFreshness = getFantasyAdpFreshness(
    snapshotMatches ? metadata?.adpSource?.asOf : undefined,
    metadata?.season
  );
  const adpAvailable =
    Boolean(snapshotMatches && metadata?.adpSource) && adpFreshness !== "stale";
  const board = useMemo(
    () =>
      boardReady && snapshot
        ? snapshot.overall.map((player) =>
            adpAvailable ? player : withoutPlayerAdp(player)
          )
        : [],
    [adpAvailable, boardReady, snapshot]
  );

  const room = useMockDraftState(board, scoringSelection);
  const { state, teams, availablePlayers, currentPick } = room;
  const settings = state.settings;
  const totalPicks = settings.totalTeams * settings.rounds;
  const currentRound = Math.ceil(currentPick / settings.totalTeams);
  const boardStaleness = getSnapshotStaleness(
    overallMeta?.updatedAt ?? (snapshotMatches ? metadata?.upstreamUpdatedAt : null)
  );

  const filteredAvailable = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return availablePlayers.filter((player) => {
      if (positionFilter !== "ALL" && player.position !== positionFilter) return false;
      if (!query) return true;
      return (
        player.name.toLowerCase().includes(query) ||
        player.team.toLowerCase().includes(query)
      );
    });
  }, [availablePlayers, positionFilter, searchQuery]);

  const picksSinceUserTurn = useMemo(() => {
    let lastUserIndex = -1;
    for (let index = state.picks.length - 1; index >= 0; index -= 1) {
      if (state.picks[index].teamNumber === settings.userTeam) {
        lastUserIndex = index;
        break;
      }
    }
    return state.picks.slice(lastUserIndex + 1);
  }, [settings.userTeam, state.picks]);

  const userRoster = teams[settings.userTeam - 1];
  const hasUserPick = state.picks.some(
    (pick) => pick.teamNumber === settings.userTeam
  );

  const recapReports = useMemo(() => {
    if (state.status !== "complete") return null;
    return calculateRedraftDraftValues(state.picks, {
      totalTeams: settings.totalTeams,
      userTeam: settings.userTeam,
      rounds: settings.rounds,
      draftType: "snake",
      lineup: getDefaultSettings().lineup,
    });
  }, [settings, state.picks, state.status]);
  const userReport = recapReports?.[settings.userTeam - 1] ?? null;

  const picksByRound = useMemo(() => {
    if (state.status !== "complete") return [];
    const groups: DraftPick[][] = [];
    for (const pick of state.picks) {
      const round = Math.ceil(pick.pickNumber / settings.totalTeams);
      (groups[round - 1] ??= []).push(pick);
    }
    return groups;
  }, [settings.totalTeams, state.picks, state.status]);

  const startRoom = () => {
    room.startDraft({
      totalTeams,
      rounds,
      userTeam: Math.min(userTeam, totalTeams),
      scoringFormat: scoringSelection,
    });
  };

  const boardStatusLine = error
    ? "The published rankings snapshot failed to load."
    : isLoading || !snapshotMatches
      ? "Loading the rankings board."
      : !boardReady
        ? "The published snapshot did not include any players."
        : null;

  // The simulator drafts off the preseason board, so once the season starts it is
  // rehearsing a market that no longer exists. Name the season rather than letting
  // it read as current.
  const seasonalWeek = getNflRegularSeasonWeek(metadata?.season ?? 0);

  return (
    <section className="home-section" aria-labelledby="mock-draft-heading">
      <div className="home-shell">
        <p className="home-kicker">Fantasy Football</p>
        <h1 id="mock-draft-heading" className="text-3xl font-semibold sm:text-4xl">
          Mock Draft Simulator
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "var(--home-ink-muted)" }}>
          A practice room against simulated opponents. The other teams pick from
          the same published consensus board you see, leaning on market ADP with
          some draft-day noise, so you can rehearse a slot and a strategy before
          a real draft. It is a practice tool, and nothing here is a projection
          of season outcomes.
        </p>

        {seasonalWeek >= 1 ? (
          <div className="mt-6">
            <SeasonalScopeNote season={metadata?.season ?? 0} week={seasonalWeek}>
              The room drafts off the preseason consensus board, which stops refreshing once real
              games start, so rehearsing a draft here in November rehearses August. I have left it
              running rather than hiding it, because the practice is still practice. Ranks that
              still move are on the <Link href="/fantasy-football/weekly" className="underline decoration-[var(--home-signal)] underline-offset-4">weekly board</Link>.
            </SeasonalScopeNote>
          </div>
        ) : null}

        {state.status === "setup" && (
          <div className="home-card mt-6 max-w-2xl p-5 sm:p-6">
            <p className="home-kicker mb-0">Set up the room</p>
            <div className="mt-4 grid gap-4">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--home-ink-muted)" }}>
                  Scoring
                </p>
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Scoring format">
                  {SCORING_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setScoringSelection(option.value)}
                      aria-pressed={scoringSelection === option.value}
                      className="inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-sm font-semibold transition-[background-color,border-color,color] duration-200"
                      style={
                        scoringSelection === option.value
                          ? {
                              borderColor: "var(--home-signal)",
                              color: "var(--home-signal)",
                            }
                          : { borderColor: "var(--home-rule)" }
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="grid gap-1 text-sm">
                  <span className="text-2xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--home-ink-muted)" }}>
                    Teams
                  </span>
                  <select
                    value={totalTeams}
                    onChange={(event) => setTotalTeams(Number(event.target.value))}
                    className="min-h-[44px] rounded-[var(--radius-2xl)] border px-3"
                    style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}
                  >
                    {TEAM_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value} teams
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-2xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--home-ink-muted)" }}>
                    Rounds
                  </span>
                  <select
                    value={rounds}
                    onChange={(event) => setRounds(Number(event.target.value))}
                    className="min-h-[44px] rounded-[var(--radius-2xl)] border px-3"
                    style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}
                  >
                    {ROUND_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value} rounds
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-2xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--home-ink-muted)" }}>
                    Your slot
                  </span>
                  <select
                    value={Math.min(userTeam, totalTeams)}
                    onChange={(event) => setUserTeam(Number(event.target.value))}
                    className="min-h-[44px] rounded-[var(--radius-2xl)] border px-3"
                    style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}
                  >
                    {Array.from({ length: totalTeams }, (_, index) => index + 1).map((slot) => (
                      <option key={slot} value={slot}>
                        Pick {slot}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={startRoom}
                  disabled={!boardReady}
                  className="inline-flex min-h-[48px] items-center rounded-full border px-6 py-3 text-sm font-semibold transition-[background-color,border-color,color] duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ borderColor: "var(--home-signal)", color: "var(--home-signal)" }}
                >
                  Start the mock draft
                </button>
                {boardReady && <StatusChip>Board {getSnapshotStalenessLabel(boardStaleness)}</StatusChip>}
                {boardReady && !adpAvailable && <StatusChip>ADP unavailable, consensus only</StatusChip>}
              </div>

              {boardStatusLine && (
                <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
                  {boardStatusLine}
                  {error && (
                    <button
                      type="button"
                      onClick={retry}
                      className="ml-2 inline-flex min-h-[44px] items-center font-semibold underline"
                    >
                      Retry
                    </button>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {state.status === "on-clock" && (
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,22rem)]">
            <div className="home-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip>
                  Round {currentRound} of {settings.rounds}
                </StatusChip>
                <StatusChip>
                  Pick {currentPick} of {totalPicks}
                </StatusChip>
                <StatusChip>Your slot: {settings.userTeam}</StatusChip>
                <StatusChip>Board {getSnapshotStalenessLabel(boardStaleness)}</StatusChip>
                {!adpAvailable && <StatusChip>Consensus ranks only</StatusChip>}
              </div>

              <h2 className="mt-4 text-xl font-semibold">
                You are on the clock at {formatPickLabel(currentPick, settings.totalTeams)}
              </h2>

              {picksSinceUserTurn.length > 0 && (
                <div className="mt-3 text-xs leading-6" style={{ color: "var(--home-ink-muted)" }}>
                  <span className="font-semibold">Since your last turn:</span>{" "}
                  {picksSinceUserTurn
                    .map(
                      (pick) =>
                        `${formatPickLabel(pick.pickNumber, settings.totalTeams)} ${pick.player.name} (${pick.player.position})`
                    )
                    .join(" · ")}
                </div>
              )}

              <div className="mt-5 grid gap-3">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search the available board"
                  aria-label="Search available players"
                  className="min-h-[44px] w-full rounded-[var(--radius-3xl)] border px-4 text-sm"
                  style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}
                />
                <PositionFilterBar
                  options={POSITION_FILTER_OPTIONS}
                  value={positionFilter}
                  onChange={setPositionFilter}
                  ariaLabel="Filter available players by position"
                />
              </div>

              <ul className="mt-4 grid gap-2" aria-label="Available players">
                {filteredAvailable.slice(0, VISIBLE_BOARD_ROWS).map((player) => (
                  <li
                    key={player.id}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius-2xl)] border px-3 py-2"
                    style={{ borderColor: "var(--home-rule)" }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        <span className="tabular-nums" style={{ color: "var(--home-ink-muted)" }}>
                          {Number.isFinite(player.rankEcr) ? `#${player.rankEcr}` : "—"}
                        </span>{" "}
                        {player.name}
                      </p>
                      <p className="text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                        {player.position} · {player.team}
                        {player.byeWeek ? ` · Bye ${player.byeWeek}` : ""}
                        {Number.isFinite(player.tier) ? ` · Tier ${player.tier}` : ""}
                        {adpAvailable && Number.isFinite(player.adp)
                          ? ` · ADP ${formatAdp(player.adp)}`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => room.makeUserPick(player)}
                      aria-label={`Draft ${player.name}`}
                      className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color] duration-200"
                      style={{ borderColor: "var(--home-signal)", color: "var(--home-signal)" }}
                    >
                      Draft
                    </button>
                  </li>
                ))}
              </ul>
              {filteredAvailable.length > VISIBLE_BOARD_ROWS && (
                <p className="mt-3 text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                  Showing the top {VISIBLE_BOARD_ROWS} of {filteredAvailable.length} available
                  players. Search or filter to reach the rest.
                </p>
              )}
            </div>

            <aside className="grid gap-5 self-start" aria-label="Room details">
              <div className="home-card p-5">
                <p className="home-kicker mb-0">Your roster</p>
                <p className="mt-2 text-2xs tabular-nums" style={{ color: "var(--home-ink-muted)" }}>
                  QB {userRoster?.positionCounts.QB ?? 0} · RB {userRoster?.positionCounts.RB ?? 0} · WR{" "}
                  {userRoster?.positionCounts.WR ?? 0} · TE {userRoster?.positionCounts.TE ?? 0} · K{" "}
                  {userRoster?.positionCounts.K ?? 0} · DST {userRoster?.positionCounts.DST ?? 0}
                </p>
                <ul className="mt-3 grid gap-1 text-sm">
                  {(userRoster?.picks ?? []).map((pick) => (
                    <li key={pick.pickNumber} className="flex items-baseline gap-2">
                      <span className="tabular-nums text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                        {formatPickLabel(pick.pickNumber, settings.totalTeams)}
                      </span>
                      <span className="truncate">
                        {pick.player.name}{" "}
                        <span style={{ color: "var(--home-ink-muted)" }}>({pick.player.position})</span>
                      </span>
                    </li>
                  ))}
                  {(userRoster?.picks.length ?? 0) === 0 && (
                    <li className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
                      No picks yet.
                    </li>
                  )}
                </ul>
              </div>

              <div className="home-card p-5">
                <p className="home-kicker mb-0">Room controls</p>
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() => room.undoUserPick()}
                    disabled={!hasUserPick}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full border px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ borderColor: "var(--home-rule)" }}
                  >
                    Undo my last pick
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!resetArmed) {
                        setResetArmed(true);
                        return;
                      }
                      setResetArmed(false);
                      room.resetDraft();
                    }}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full border px-4 text-sm font-semibold"
                    style={{
                      borderColor: resetArmed ? "var(--home-warning)" : "var(--home-rule)",
                      color: resetArmed ? "var(--home-warning)" : undefined,
                    }}
                  >
                    {resetArmed ? "Confirm reset" : "Reset the room"}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {state.status === "complete" && (
          <div className="mt-6 grid gap-5">
            <div className="home-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Draft complete</h2>
                <button
                  type="button"
                  onClick={() => room.resetDraft()}
                  className="inline-flex min-h-[44px] items-center rounded-full border px-5 text-sm font-semibold"
                  style={{ borderColor: "var(--home-signal)", color: "var(--home-signal)" }}
                >
                  Start a new mock
                </button>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--home-ink-muted)" }}>
                The outlook below reads your draft process against the simulated
                room, the same way the live tracker does. It is not projected
                points or win probability.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="home-card p-5 sm:p-6">
                <DraftValuePanel report={userReport} headingId="mock-draft-outlook" />
              </div>

              <div className="home-card p-5 sm:p-6">
                <p className="home-kicker mb-0">Your picks</p>
                <ul className="mt-3 grid gap-2">
                  {state.picks
                    .filter((pick) => pick.teamNumber === settings.userTeam)
                    .map((pick) => {
                      const verdict = classifyPickValue(pick);
                      return (
                        <li key={pick.pickNumber} className="flex items-center gap-2 text-sm">
                          <span className="tabular-nums text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                            {formatPickLabel(pick.pickNumber, settings.totalTeams)}
                          </span>
                          <span className="truncate">
                            {pick.player.name}{" "}
                            <span style={{ color: "var(--home-ink-muted)" }}>
                              ({pick.player.position})
                            </span>
                          </span>
                          {verdict && (
                            <span
                              className="rounded-full px-2 py-0.5 text-3xs font-semibold uppercase"
                              style={{
                                background:
                                  verdict === "steal"
                                    ? "color-mix(in srgb, var(--home-positive) 16%, var(--home-paper))"
                                    : "color-mix(in srgb, var(--home-warning) 16%, var(--home-paper))",
                              }}
                            >
                              {verdict}
                            </span>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>

            <div className="home-card p-5 sm:p-6">
              <p className="home-kicker mb-0">Full board</p>
              <div className="mt-3 grid gap-4">
                {picksByRound.map((roundPicks, index) => (
                  <div key={index}>
                    <p className="text-2xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--home-ink-muted)" }}>
                      Round {index + 1}
                    </p>
                    <ul className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
                      {roundPicks.map((pick) => (
                        <li key={pick.pickNumber} className="flex items-baseline gap-2">
                          <span className="tabular-nums text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                            {formatPickLabel(pick.pickNumber, settings.totalTeams)}
                          </span>
                          <span className="truncate">
                            {pick.player.name}{" "}
                            <span style={{ color: "var(--home-ink-muted)" }}>
                              ({pick.player.position},{" "}
                              {pick.teamNumber === settings.userTeam
                                ? "you"
                                : `Team ${pick.teamNumber}`}
                              )
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
