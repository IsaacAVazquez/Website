"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ChevronDown, Download, Redo2, RotateCcw, Timer, Undo2 } from "lucide-react";
import { DraftAnalyticsPanel } from "./components/DraftAnalyticsPanel";
import { DraftBoard } from "./components/DraftBoard";
import { DraftSetup } from "./components/DraftSetup";
import { useDraftState } from "./hooks/useDraftState";
import { useDraftTimer } from "./hooks/useDraftTimer";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import { usePlayerNotes } from "@/hooks/usePlayerNotes";
import { computeDraftAnalytics } from "@/lib/draftAnalytics";
import {
  FANTASY_SCORING_LABELS,
  getFantasyWeekLabel,
  scoringFormatToRouteScoring,
} from "@/lib/fantasy";
import { formatRankValue, formatUpdatedAt } from "@/lib/fantasyUtils";
import { CompareTray, PlayerDetailDrawer } from "@/components/fantasy";
import type { Player } from "@/types";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";

const DRAFT_TRACKER_BREADCRUMBS = [
  { label: "Fantasy Football", href: "/fantasy-football" },
  { label: "Draft Assistant", href: "/fantasy-football/draft-tracker", isActive: true },
];

const TILE_STYLE = {
  borderColor: "var(--home-rule)",
  background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
} as const;

const ACTION_STYLE = {
  borderColor: "var(--home-rule)",
  background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
  color: "var(--home-ink)",
} as const;

const subscribeToHydration = () => () => undefined;
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

function publishedDraftRank(player: Player): string {
  return formatRankValue(player.rankEcr ?? player.averageRank);
}

export function DraftTrackerClient() {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );
  const {
    draftState,
    updateSettings,
    startDraft,
    draftPlayer,
    undoLastPick,
    redoLastPick,
    undoToPick,
    setTeamName,
    getTeamName,
    canRedo,
    resetDraft,
    exportDraftResults,
    isUserPick,
    isDraftComplete,
    currentTeamName,
    userTeam,
    persistenceError,
  } = useDraftState();

  const notes = usePlayerNotes();

  const scoringKey = scoringFormatToRouteScoring(draftState.settings.scoringFormat);
  const { snapshot, metadata, isLoading, error } = useFantasySnapshot({
    scoring: scoringKey,
    all: true,
  });
  const overallSliceMetadata = snapshot?.sliceMetadata?.overall ?? null;
  const rankingsUnavailable = Boolean(overallSliceMetadata && !overallSliceMetadata.available);
  const showSetup = draftState.picks.length === 0 && !draftState.isActive;

  const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showTeamEditor, setShowTeamEditor] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [resetArmed, setResetArmed] = useState(false);

  const draftedPlayerIds = useMemo(
    () => new Set(draftState.picks.map((pick) => pick.player.id)),
    [draftState.picks]
  );

  const recentPicks = useMemo(() => draftState.picks.slice(-12).reverse(), [draftState.picks]);
  const analytics = useMemo(
    () => computeDraftAnalytics(draftState.picks, draftState.teams),
    [draftState.picks, draftState.teams]
  );
  const adpAvailable = Boolean(snapshot?.adpSource);
  const totalPicks = draftState.settings.totalTeams * draftState.settings.rounds;
  const completionPercentage = Math.round((draftState.picks.length / totalPicks) * 100);

  const playerLookup = useMemo(
    () => new Map((snapshot?.overall ?? []).map((player) => [player.id, player])),
    [snapshot]
  );
  const boardTierCount = useMemo(() => {
    let max = 0;
    for (const player of snapshot?.overall ?? []) {
      if (player.tier && player.tier > max) max = player.tier;
    }
    return max;
  }, [snapshot]);

  const timerEnabled =
    (draftState.settings.timerSeconds ?? 0) > 0 && !showSetup && !isDraftComplete && !rankingsUnavailable;
  const timer = useDraftTimer({
    currentPick: draftState.currentPick,
    durationSeconds: draftState.settings.timerSeconds ?? 0,
    enabled: timerEnabled,
    isActive: draftState.isActive,
  });

  const userTeamName = userTeam?.teamName ?? `Team ${draftState.settings.userTeam}`;
  const bestAvailableCount = (snapshot?.overall ?? []).filter(
    (player) => !draftState.picks.some((pick) => pick.player.id === player.id)
  ).length;

  const draftStatsCells: HomeStatsCell[] = [
    {
      label: "Current pick",
      tooltip: "Overall pick number on the clock right now.",
      value: draftState.currentPick.toLocaleString(),
      sub: `of ${totalPicks}`,
    },
    {
      label: "Round",
      tooltip: "Current round out of the rounds configured for this room.",
      value: `${draftState.currentRound}`,
      sub: `of ${draftState.settings.rounds}`,
    },
    {
      label: "On the clock",
      tooltip: "Team whose pick gets logged next.",
      value: currentTeamName,
      sub: isUserPick ? "Your pick" : undefined,
    },
    {
      label: "Picks made",
      tooltip: "Picks logged in this room so far.",
      value: draftState.picks.length.toLocaleString(),
    },
    {
      label: "Total picks",
      tooltip: "Teams times rounds from the room settings.",
      value: `${draftState.settings.totalTeams} × ${draftState.settings.rounds}`,
      sub: totalPicks.toLocaleString(),
    },
    {
      label: "Completion",
      tooltip: "Share of the total picks already logged.",
      value: `${completionPercentage}%`,
      tone: completionPercentage > 0 ? "good" : "default",
    },
    {
      label: "Your team",
      tooltip: "The roster this assistant tracks as yours.",
      value: userTeamName,
    },
    {
      label: "Best available",
      tooltip: "Undrafted players left on the overall consensus board.",
      value: bestAvailableCount > 0 ? bestAvailableCount.toLocaleString() : "—",
      sub: "Players left on board",
    },
  ];

  function handleExport(format: "csv" | "recap-csv" | "json") {
    exportDraftResults(format, { notes: notes.notes });
    const label =
      format === "recap-csv" ? "team recap CSV" : format === "json" ? "JSON" : "picks CSV";
    setExportToast(`Exported ${label}.`);
    window.setTimeout(() => setExportToast(null), 3500);
  }

  return (
    <section
      className="home-page home-dash min-h-screen"
      data-testid="fantasy-draft-tracker-shell"
      data-hydrated={isHydrated ? "true" : "false"}
    >
      <div className="home-shell home-shell-wide home-section space-y-4 sm:space-y-5">
        <Breadcrumbs customItems={DRAFT_TRACKER_BREADCRUMBS} className="pt-2" />
        {persistenceError ? (
          <div
            role="status"
            className="rounded-[var(--radius-3xl)] border px-4 py-3 text-sm"
            style={{
              borderColor: "color-mix(in srgb, var(--home-warning) 55%, var(--home-rule))",
              background: "color-mix(in srgb, var(--home-warning) 10%, var(--home-paper))",
            }}
          >
            <p className="font-semibold">Local save is unavailable.</p>
            <p className="mt-1" style={{ color: "var(--home-ink-muted)" }}>{persistenceError}</p>
          </div>
        ) : null}
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="home-kicker mb-0">Draft Assistant</p>
            <h1
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "clamp(2rem, 4.4vw, 3.2rem)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 0.98,
                maxWidth: "18ch",
              }}
            >
              Manual draft tracking that actually stays usable.
            </h1>
            <p className="max-w-[60ch] text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
              Log every pick on the same published snapshot as the rankings, with your shared
              watchlist, an advisory pick clock, multi-step undo, and steal/reach/run signals against
              attributed mock-draft ADP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            {[
              metadata ? `${metadata.season} ${getFantasyWeekLabel(metadata.week)}` : "Loading snapshot",
              `Source updated ${formatUpdatedAt(overallSliceMetadata?.updatedAt ?? metadata?.upstreamUpdatedAt)}`,
              `Built ${formatUpdatedAt(metadata?.generatedAt)}`,
              `${FANTASY_SCORING_LABELS[scoringKey]} scoring`,
            ].map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium"
                style={{
                  borderColor: "var(--home-rule)",
                  background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
                }}
              >
                {label}
              </span>
            ))}
            {timerEnabled && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold tabular-nums"
                style={{
                  borderColor: timer.isExpired
                    ? "color-mix(in srgb, var(--home-warning) 40%, var(--home-rule))"
                    : "var(--home-rule)",
                  background: timer.isExpired
                    ? "color-mix(in srgb, var(--home-warning) 16%, var(--home-paper))"
                    : "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
                }}
                aria-live="off"
              >
                <Timer className="h-4 w-4" aria-hidden="true" />
                {timer.isExpired ? "Time's up" : `${timer.secondsLeft}s on the clock`}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowStats((open) => !open)}
              aria-expanded={showStats}
              aria-controls="draft-tracker-stats"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold"
              style={ACTION_STYLE}
            >
              Draft at a glance
              <ChevronDown
                className="h-4 w-4 transition-transform"
                style={{ transform: showStats ? "rotate(180deg)" : "none" }}
              />
            </button>
          </div>
        </div>

        {showStats && (
          <HomeStatsPanel
            id="draft-tracker-stats"
            title="Draft at a glance"
            meta={isDraftComplete ? "Draft complete" : `Pick ${draftState.currentPick} of ${totalPicks}`}
            cells={draftStatsCells}
            pills={[
              { label: "Resume rankings", href: "/fantasy-football" },
              { label: "Draft assistant", href: "/fantasy-football/draft-tracker" },
            ]}
          />
        )}

        {error && (
          <article className="home-card p-5 sm:p-6" style={{ borderColor: "var(--home-negative)" }}>
            <p className="font-semibold" style={{ color: "var(--home-negative)" }}>
              {error}
            </p>
          </article>
        )}

        {rankingsUnavailable && (
          <article className="home-card p-5 sm:p-6" style={{ borderColor: "var(--home-warning)" }}>
            <p className="font-semibold">
              {overallSliceMetadata?.reason ??
                "The current snapshot does not include an overall board for this scoring format."}
            </p>
          </article>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,22rem)] min-[1440px]:grid-cols-[minmax(0,1.2fr)_minmax(20rem,26rem)]">
          <div className="grid gap-5">
            {rankingsUnavailable ? (
              <div className="home-card p-6 sm:p-8 text-center">
                <p className="text-xl font-semibold">Draft assistant unavailable for this scoring format</p>
                <p className="mt-3 text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
                  The draft assistant needs a published overall board. Switch scoring or wait for the
                  next snapshot update.
                </p>
              </div>
            ) : showSetup ? (
              <DraftSetup
                settings={draftState.settings}
                onSaveSettings={updateSettings}
                onStartDraft={startDraft}
              />
            ) : (
              <>
                {isDraftComplete && (
                  <DraftAnalyticsPanel
                    analytics={analytics}
                    picks={draftState.picks}
                    currentPick={draftState.currentPick}
                    isDraftComplete
                    userTeamNumber={draftState.settings.userTeam}
                    adpAvailable={adpAvailable}
                    getTeamName={getTeamName}
                  />
                )}
                <DraftBoard
                  players={snapshot?.overall ?? []}
                  snapshot={snapshot}
                  draftedPlayerIds={draftedPlayerIds}
                  onDraftPlayer={draftPlayer}
                  onOpenDetail={setDetailPlayer}
                  currentPick={draftState.currentPick}
                  currentRound={draftState.currentRound}
                  currentTeamName={currentTeamName}
                  isUserPick={isUserPick}
                  isDraftComplete={isDraftComplete}
                  userTeam={userTeam}
                />
              </>
            )}
          </div>

          <aside className="grid gap-5 lg:sticky lg:top-24 lg:self-start">
            {!showSetup && !isDraftComplete && !rankingsUnavailable && (
              <DraftAnalyticsPanel
                analytics={analytics}
                picks={draftState.picks}
                currentPick={draftState.currentPick}
                isDraftComplete={false}
                userTeamNumber={draftState.settings.userTeam}
                adpAvailable={adpAvailable}
                getTeamName={getTeamName}
              />
            )}
            <article className="home-card p-5 sm:p-6">
              <p className="home-kicker mb-1">Progress</p>
              <h3 className="text-2xl font-semibold">
                {draftState.picks.length} of {totalPicks} picks logged
              </h3>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm" style={{ color: "var(--home-ink-muted)" }}>
                  <span>Completion</span>
                  <span>{completionPercentage}%</span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full"
                  style={{ background: "color-mix(in srgb, var(--home-stone) 60%, transparent)" }}
                >
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${completionPercentage}%`,
                      background: "var(--home-signal)",
                    }}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-[var(--radius-3xl)] border px-4 py-3" style={TILE_STYLE}>
                  <p className="home-kicker mb-1">On clock</p>
                  <p className="text-sm font-semibold">{currentTeamName}</p>
                </div>
                <div className="rounded-[var(--radius-3xl)] border px-4 py-3" style={TILE_STYLE}>
                  <p className="home-kicker mb-1">Current pick</p>
                  <p className="text-sm font-semibold">
                    {draftState.currentPick} / {totalPicks}
                  </p>
                </div>
                <div className="rounded-[var(--radius-3xl)] border px-4 py-3" style={TILE_STYLE}>
                  <p className="home-kicker mb-1">Round</p>
                  <p className="text-sm font-semibold">
                    {draftState.currentRound} / {draftState.settings.rounds}
                  </p>
                </div>
              </div>
            </article>

            <article className="home-card p-5 sm:p-6">
              <p className="home-kicker mb-1">Your roster</p>
              <div className="mt-4 grid gap-3">
                {(userTeam?.picks ?? []).length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
                    Your picks will appear here as the draft moves.
                  </p>
                ) : (
                  userTeam?.picks.map((pick) => (
                    <button
                      key={pick.pickNumber}
                      type="button"
                      onClick={() => setDetailPlayer(pick.player)}
                      className="rounded-[var(--radius-3xl)] border px-4 py-3 text-left"
                      style={TILE_STYLE}
                    >
                      <p className="text-sm font-semibold">{pick.player.name}</p>
                      <p className="mt-1 text-xs" style={{ color: "var(--home-ink-muted)" }}>
                        Pick {pick.pickNumber} • {pick.player.position} • {pick.player.team}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </article>

            <article className="home-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <p className="home-kicker mb-0">Recent picks</p>
                <span className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
                  Tap to undo here
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {recentPicks.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
                    No picks logged yet.
                  </p>
                ) : (
                  recentPicks.map((pick) => (
                    <div
                      key={`recent-${pick.pickNumber}`}
                      className="flex items-center gap-2 rounded-[var(--radius-3xl)] border px-4 py-3"
                      style={TILE_STYLE}
                    >
                      <button
                        type="button"
                        onClick={() => setDetailPlayer(pick.player)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-sm font-semibold">{pick.player.name}</p>
                        <p className="mt-1 text-xs" style={{ color: "var(--home-ink-muted)" }}>
                          {getTeamName(pick.teamNumber)} • Pick {pick.pickNumber} • {pick.player.position}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => undoToPick(pick.pickNumber)}
                        aria-label={`Undo back to pick ${pick.pickNumber}`}
                        title={`Undo back to pick ${pick.pickNumber}`}
                        className="-my-2 inline-flex h-11 w-11 shrink-0 items-center justify-center"
                      >
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border"
                          style={{ borderColor: "var(--home-rule)", color: "var(--home-ink-muted)" }}
                        >
                          <Undo2 size={14} aria-hidden="true" />
                        </span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </article>

            {/* Team naming */}
            <article className="home-card p-5 sm:p-6">
              <button
                type="button"
                onClick={() => setShowTeamEditor((open) => !open)}
                aria-expanded={showTeamEditor}
                className="flex w-full items-center justify-between gap-2"
              >
                <span className="home-kicker mb-0">Name the teams</span>
                <ChevronDown
                  className="h-4 w-4 transition-transform"
                  style={{ transform: showTeamEditor ? "rotate(180deg)" : "none" }}
                />
              </button>
              {showTeamEditor && (
                <div className="mt-4 grid gap-2">
                  {draftState.teams.map((team) => (
                    <label key={team.teamNumber} className="grid gap-1 text-xs">
                      <span style={{ color: "var(--home-ink-muted)" }}>
                        Slot {team.teamNumber}
                        {team.teamNumber === draftState.settings.userTeam ? " (you)" : ""}
                      </span>
                      <input
                        value={team.teamName ?? ""}
                        onChange={(event) => setTeamName(team.teamNumber, event.target.value)}
                        maxLength={40}
                        placeholder={`Team ${team.teamNumber}`}
                        className="min-h-[40px] rounded-[var(--radius-2xl)] border px-3 text-sm"
                        style={ACTION_STYLE}
                      />
                    </label>
                  ))}
                </div>
              )}
            </article>

            <article className="home-card p-5 sm:p-6">
              <p className="home-kicker mb-1">Actions</p>
              <div className="mt-4 grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={undoLastPick}
                    disabled={draftState.picks.length === 0}
                    aria-label={draftState.picks.length === 0 ? "Undo last pick (no picks yet)" : "Undo last pick"}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                    style={ACTION_STYLE}
                  >
                    <Undo2 className="h-4 w-4" />
                    Undo
                  </button>
                  <button
                    type="button"
                    onClick={redoLastPick}
                    disabled={!canRedo}
                    aria-label={canRedo ? "Redo the last undone pick" : "Redo (nothing to redo)"}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                    style={ACTION_STYLE}
                  >
                    <Redo2 className="h-4 w-4" />
                    Redo
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { format: "csv", label: "Picks CSV" },
                    { format: "recap-csv", label: "Recap CSV" },
                    { format: "json", label: "JSON" },
                  ] as const).map((option) => (
                    <button
                      key={option.format}
                      type="button"
                      onClick={() => handleExport(option.format)}
                      className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-full border px-2 py-3 text-xs font-semibold"
                      style={ACTION_STYLE}
                    >
                      <Download className="h-3.5 w-3.5" />
                      {option.label}
                    </button>
                  ))}
                </div>
                {resetArmed ? (
                  <div
                    className="grid grid-cols-2 gap-2 rounded-[var(--radius-3xl)] border p-2"
                    style={{ borderColor: "var(--home-negative)" }}
                  >
                    <button
                      type="button"
                      onClick={() => setResetArmed(false)}
                      className="min-h-[44px] rounded-full border px-3 text-sm font-semibold"
                      style={ACTION_STYLE}
                    >
                      Keep draft
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetDraft();
                        setResetArmed(false);
                      }}
                      className="min-h-[44px] rounded-full border px-3 text-sm font-semibold"
                      style={{ borderColor: "var(--home-negative)", background: "var(--home-negative)", color: "var(--home-paper)" }}
                    >
                      Confirm reset
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setResetArmed(true)}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
                    style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset draft
                  </button>
                )}
                <Link
                  href="/fantasy-football"
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
                  style={ACTION_STYLE}
                >
                  Back to rankings board
                </Link>
              </div>
              <p className="mt-3 text-xs leading-6" style={{ color: "var(--home-ink-muted)" }}>
                Change league settings by starting a new draft. Active drafts keep one fixed room configuration.
              </p>
            </article>
          </aside>
        </div>

        {isLoading && !snapshot && (
          <article className="home-card px-4 py-3 text-sm" style={{ color: "var(--home-ink-muted)" }}>
            Loading the published draft snapshot...
          </article>
        )}

        <div
          aria-live="polite"
          role="status"
          className="pointer-events-none fixed bottom-6 left-1/2 z-[55] -translate-x-1/2"
        >
          {exportToast ? (
            <div
              className="rounded-full border px-4 py-2 text-sm font-semibold shadow-[var(--shadow-md)]"
              style={{ borderColor: "var(--home-rule)", background: "var(--home-ink)", color: "var(--home-paper)" }}
            >
              {exportToast}
            </div>
          ) : null}
        </div>
      </div>

      <PlayerDetailDrawer
        player={detailPlayer}
        publishedRank={detailPlayer ? publishedDraftRank(detailPlayer) : undefined}
        boardTierCount={boardTierCount > 0 ? boardTierCount : undefined}
        onClose={() => setDetailPlayer(null)}
      />
      <CompareTray resolvePlayer={(id) => playerLookup.get(id)} publishedRank={publishedDraftRank} />
    </section>
  );
}
