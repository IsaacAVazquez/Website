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
import { computeDraftAnalytics, reconcileTeamRosters } from "@/lib/draftAnalytics";
import { calculateRedraftDraftValues } from "@/lib/fantasyTeamValue";
import {
  FANTASY_SCORING_LABELS,
  getAllFantasySnapshotPlayers,
  getFantasyWeekLabel,
  hasCompleteFantasyPlayerUniverse,
  scoringFormatToRouteScoring,
} from "@/lib/fantasy";
import {
  formatRankValue,
  formatUpdatedAt,
  getFantasyAdpFreshness,
  getSnapshotStaleness,
  resolveDraftPicksForModel,
  withoutPlayerAdp,
} from "@/lib/fantasyUtils";
import {
  CompareTray,
  DraftValuePanel,
  PlayerDetailDrawer,
  type ExpectedReturnFormState,
} from "@/components/fantasy";
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

// StaticHeader is sticky at top 0 and measures 73px, so the live bar parks
// directly beneath it instead of sliding underneath and hiding the pick number.
const LIVE_BAR_TOP = "73px";

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
  const rankingsUpdatedAt = overallSliceMetadata?.updatedAt ?? metadata?.upstreamUpdatedAt;
  const rankingsStale = Boolean(snapshot) && getSnapshotStaleness(rankingsUpdatedAt) === "stale";
  const showSetup = draftState.picks.length === 0 && !draftState.isActive;

  const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showTeamEditor, setShowTeamEditor] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [resetArmed, setResetArmed] = useState(false);
  const [returnAssumptions, setReturnAssumptions] = useState<ExpectedReturnFormState>({
    entryCost: "",
    payoutProbability: "",
    averagePayout: "",
  });

  const draftedPlayerIds = useMemo(
    () => new Set(draftState.picks.map((pick) => pick.player.id)),
    [draftState.picks]
  );
  const adpFreshness = getFantasyAdpFreshness(metadata?.adpSource?.asOf, metadata?.season);
  const adpAvailable = Boolean(metadata?.adpSource) && adpFreshness !== "stale";
  const totalPicks = draftState.settings.totalTeams * draftState.settings.rounds;
  const completionPercentage = Math.round((draftState.picks.length / totalPicks) * 100);

  const draftBoardPlayers = useMemo(
    () =>
      (snapshot?.overall ?? []).map((player) =>
        adpAvailable ? player : withoutPlayerAdp(player)
      ),
    [adpAvailable, snapshot]
  );
  const playerLookup = useMemo(
    () =>
      new Map(
        (snapshot ? getAllFantasySnapshotPlayers(snapshot) : []).map((player) => [
          player.id,
          adpAvailable ? player : withoutPlayerAdp(player),
        ])
      ),
    [adpAvailable, snapshot]
  );
  const modelPicks = useMemo(
    () => resolveDraftPicksForModel(draftState.picks, draftBoardPlayers, adpAvailable),
    [adpAvailable, draftBoardPlayers, draftState.picks]
  );
  const modelTeams = useMemo(
    () => reconcileTeamRosters(draftState.teams, modelPicks),
    [draftState.teams, modelPicks]
  );
  const userTeam = useMemo(
    () => modelTeams.find((team) => team.teamNumber === draftState.settings.userTeam),
    [draftState.settings.userTeam, modelTeams]
  );
  const recentPicks = useMemo(() => modelPicks.slice(-12).reverse(), [modelPicks]);
  const analytics = useMemo(
    () =>
      computeDraftAnalytics(modelPicks, modelTeams, {
        lineup: draftState.settings.lineup,
        rounds: draftState.settings.rounds,
      }),
    [draftState.settings.lineup, draftState.settings.rounds, modelPicks, modelTeams]
  );
  const draftValueReports = useMemo(
    () => calculateRedraftDraftValues(modelPicks, draftState.settings),
    [draftState.settings, modelPicks]
  );
  const userDraftValue =
    draftValueReports.find((report) => report.teamNumber === draftState.settings.userTeam) ?? null;
  const boardTierCount = useMemo(() => {
    let max = 0;
    for (const player of draftBoardPlayers) {
      if (player.tier && player.tier > max) max = player.tier;
    }
    return max;
  }, [draftBoardPlayers]);

  const timerEnabled =
    (draftState.settings.timerSeconds ?? 0) > 0 && !showSetup && !isDraftComplete && !rankingsUnavailable;
  const timer = useDraftTimer({
    currentPick: draftState.currentPick,
    durationSeconds: draftState.settings.timerSeconds ?? 0,
    enabled: timerEnabled,
    isActive: draftState.isActive,
  });

  // The clock earns the signal accent from 15 seconds out. Waiting for expiry
  // to change anything means the warning arrives after the pick is already late.
  const clockUrgent = timerEnabled && !timer.isExpired && timer.secondsLeft <= 15;

  // Undo measured 9,549px down the page on a phone, which is eleven screens to
  // fix a mis-tap against a clock. It gets a fixed bar instead. Desktop keeps
  // the Actions card, where the sticky rail already puts it within reach.
  const showMobileActionBar = !showSetup && !rankingsUnavailable && !isDraftComplete;

  const userTeamName = userTeam?.teamName ?? `Team ${draftState.settings.userTeam}`;
  const bestAvailableCount = draftBoardPlayers.filter(
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
    exportDraftResults(format, { notes: notes.notes, picks: modelPicks });
    const label =
      format === "recap-csv" ? "team recap CSV" : format === "json" ? "JSON" : "picks CSV";
    setExportToast(`Exported ${label}.`);
    window.setTimeout(() => setExportToast(null), 3500);
  }

  return (
    <section
      className="home-page home-dash min-h-screen"
      // A literal name rather than aria-labelledby, because the heading this
      // would point at only renders in one of the two header states.
      aria-label="Fantasy football draft assistant"
      data-testid="fantasy-draft-tracker-shell"
      data-hydrated={isHydrated ? "true" : "false"}
    >
      {/* Bottom padding clears the fixed mobile action bar below, so the last
          rail card is not stranded underneath it. */}
      <div
        className="home-shell home-shell-wide home-section space-y-4 sm:space-y-5"
        style={showMobileActionBar ? { paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom))" } : undefined}
      >
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
        {rankingsStale ? (
          <div
            role="alert"
            className="rounded-[var(--radius-3xl)] border px-4 py-3 text-sm leading-6"
            style={{
              borderColor: "color-mix(in srgb, var(--home-warning) 55%, var(--home-rule))",
              background: "color-mix(in srgb, var(--home-warning) 10%, var(--home-paper))",
            }}
          >
            The ranking source is more than four days old during draft season. Check current player
            news and your room&apos;s market before using this board for a live pick.
          </div>
        ) : null}
        {/*
          Two headers, chosen by whether a draft is actually running. Before the
          first pick the visitor is still deciding whether to use this, so the
          headline and the pitch earn their space. Once picks are being logged
          the visitor is on a clock, and the display headline plus a four-line
          paragraph pushed the first "Log pick" 2.7 screens down on a phone. The
          running header collapses to one line of live state so the board starts
          in the first viewport.
        */}
        <div className="space-y-4">
          {showSetup ? (
            <>
              <div className="space-y-3">
                <h1
                  style={{
                    fontFamily: "var(--font-home-sans)",
                    fontSize: "clamp(2.15rem, 1.6rem + 2.75vw, 4.2rem)", // DESIGN.md headline step
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
                  attributed mock-draft ADP. The Draft Outlook compares your roster against the room,
                  and the expected return calculator keeps your payout assumptions explicit. This
                  snapshot has no separate live injury or player-news feed, so I would verify those
                  changes in the draft room before every pick.
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
                <button
                  type="button"
                  onClick={() => setShowStats((open) => !open)}
                  aria-expanded={showStats}
                  aria-controls="draft-tracker-stats"
                  className="inline-flex min-h-touch items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold"
                  style={ACTION_STYLE}
                >
                  Draft at a glance
                  <ChevronDown
                    className="h-4 w-4 transition-transform"
                    style={{ transform: showStats ? "rotate(180deg)" : "none" }}
                  />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold sm:text-2xl" style={{ letterSpacing: "-0.02em" }}>
                  {draftState.settings.leagueName?.trim() || "Draft assistant"}
                </h1>
                {/* Freshness stays visible mid-draft. Knowing which snapshot the
                    board came from is the credibility of the whole tool, so it
                    survives the collapse as one muted line rather than four
                    pills. */}
                <p className="mt-1 text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                  {FANTASY_SCORING_LABELS[scoringKey]} scoring · Source updated{" "}
                  {formatUpdatedAt(overallSliceMetadata?.updatedAt ?? metadata?.upstreamUpdatedAt)}
                </p>
              </div>
            </>
          )}
        </div>

        {/*
          The live bar sticks, and it is a direct child of the shell on purpose.
          A sticky element only travels inside its own parent's box, so while
          this lived in the short header wrapper it scrolled away the moment
          that wrapper did. Scrolling the board used to carry the pick number,
          the team on the clock, and the timer off screen, so answering "whose
          pick is it?" meant scrolling back to the top mid-draft. It parks
          directly under the site header, which is itself sticky at top 0.
        */}
        {!showSetup && !rankingsUnavailable && (
          <div
            className="sticky z-30 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[var(--radius-md)] border px-3 py-2"
                style={{
                  top: LIVE_BAR_TOP,
                  borderColor: "var(--home-rule)",
                  background: "var(--home-paper)",
                }}
              >
                <p className="min-w-0 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                  {isDraftComplete ? (
                    "Draft complete"
                  ) : (
                    <>
                      Round {draftState.currentRound} ·{" "}
                      <span className="font-semibold tabular-nums" style={{ color: "var(--home-ink)" }}>
                        Pick {draftState.currentPick} of {totalPicks}
                      </span>{" "}
                      · {currentTeamName} on the clock
                    </>
                  )}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                {timerEnabled && (
                  /*
                    The clock used to be the fifth grey pill in a row of grey
                    pills, and it only changed appearance once it had already
                    expired, which is too late to act on. It takes the signal
                    accent from 15 seconds out, which is the one place on this
                    surface where the accent budget is genuinely earned.
                  */
                  <div
                    role="timer"
                    aria-live="off"
                    aria-label={
                      timer.isExpired
                        ? "Pick clock expired"
                        : `${timer.secondsLeft} seconds left on the pick clock`
                    }
                    className="inline-flex items-baseline gap-2 rounded-[var(--radius-lg)] border px-3 py-1.5"
                    style={{
                      borderColor: clockUrgent
                        ? "color-mix(in srgb, var(--home-signal) 55%, var(--home-rule))"
                        : "var(--home-rule)",
                      background: clockUrgent
                        ? "color-mix(in srgb, var(--home-signal) 12%, var(--home-paper))"
                        : "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
                    }}
                  >
                    <Timer
                      className="h-3.5 w-3.5 self-center"
                      aria-hidden="true"
                      style={{ color: clockUrgent ? "var(--home-signal)" : "var(--home-ink-muted)" }}
                    />
                    <span
                      className="text-3xl tabular-nums"
                      style={{
                        // Fragment Mono is weight 400 only, per the Honest Mono Rule.
                        fontFamily: "var(--font-mono)",
                        fontWeight: 400,
                        color: clockUrgent ? "var(--home-signal)" : "var(--home-ink)",
                      }}
                    >
                      {timer.isExpired ? 0 : timer.secondsLeft}
                    </span>
                    <span className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
                      s
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowStats((open) => !open)}
                  aria-expanded={showStats}
                  aria-controls="draft-tracker-stats"
                  className="inline-flex min-h-touch items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold"
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
        )}

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
                    picks={modelPicks}
                    currentPick={draftState.currentPick}
                    isDraftComplete
                    userTeamNumber={draftState.settings.userTeam}
                    adpAvailable={adpAvailable}
                    getTeamName={getTeamName}
                  />
                )}
                <DraftBoard
                  players={draftBoardPlayers}
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
                  lineup={draftState.settings.lineup}
                  rounds={draftState.settings.rounds}
                />
                {/*
                  Below the board on purpose. On a phone this panel used to sit
                  above it, so the board opened almost a full screen down and
                  the Outlook read as a verdict before there was anything to
                  judge. On desktop the rail carries its own copy of this and
                  this one is hidden, so ordering here only affects mobile.
                */}
                <article className="home-card p-5 sm:p-6 lg:hidden">
                  <DraftValuePanel
                    report={userDraftValue}
                    headingId="redraft-mobile-draft-outlook-heading"
                    calculatorValue={returnAssumptions}
                    onCalculatorChange={setReturnAssumptions}
                  />
                </article>
              </>
            )}
          </div>

          {/* Bounded so the rail cannot outgrow the space a sticky element gets and strand
              its last card below the fold. */}
          <aside
            aria-label="Draft outlook"
            /* top-[10.5rem], not top-24. The sticky live bar occupies 73px to
               158px once stuck, so a rail pinned at 96px slid underneath it and
               lost its first card behind an opaque strip. The max-height drops
               by the same amount so the rail still ends above the fold. */
            className="grid gap-5 lg:sticky lg:top-[10.5rem] lg:max-h-[calc(100vh-11.5rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain"
          >
            {!showSetup && !rankingsUnavailable ? (
              <article className="home-card hidden p-5 sm:p-6 lg:block">
                <DraftValuePanel
                  report={userDraftValue}
                  headingId="redraft-desktop-draft-outlook-heading"
                  calculatorValue={returnAssumptions}
                  onCalculatorChange={setReturnAssumptions}
                />
              </article>
            ) : null}
            {!showSetup && !isDraftComplete && !rankingsUnavailable && (
              <DraftAnalyticsPanel
                analytics={analytics}
                picks={modelPicks}
                currentPick={draftState.currentPick}
                isDraftComplete={false}
                userTeamNumber={draftState.settings.userTeam}
                adpAvailable={adpAvailable}
                getTeamName={getTeamName}
              />
            )}
            <article className="home-card p-5 sm:p-6">
              <p className="home-kicker mb-1">Progress</p>
              {/* text-lg, not text-2xl. The board's h2 is text-2xl, so an h3 at
                  the same size announced a level change that was invisible on
                  the page. */}
              <h3 className="text-lg font-semibold">
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
                        className="flex min-h-touch min-w-0 flex-1 flex-col justify-center text-left"
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
                className="flex min-h-touch w-full items-center justify-between gap-2"
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
                        className="min-h-touch rounded-[var(--radius-2xl)] border px-3 text-sm"
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
        compareAvailableBelowSm={false}
        onClose={() => setDetailPlayer(null)}
      />
      {/* Hidden below sm, where the compare toggles that populate it are hidden
          too, so the tray stopped charging phones a fixed 100px band for a
          feature they cannot reach. That also leaves the bottom edge free for
          the action bar below, so the two never overlap. */}
      <div className="hidden sm:block">
        <CompareTray
          resolvePlayer={(id) => playerLookup.get(id)}
          playerDataReady={!isLoading && hasCompleteFantasyPlayerUniverse(snapshot)}
          publishedRank={publishedDraftRank}
          adpAvailable={adpAvailable}
        />
      </div>

      {showMobileActionBar && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-2.5 sm:hidden"
          style={{
            borderColor: "var(--home-rule)",
            background: "color-mix(in srgb, var(--home-paper) 94%, var(--home-elev-mix))",
            paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))",
          }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={undoLastPick}
              disabled={draftState.picks.length === 0}
              aria-label={draftState.picks.length === 0 ? "Undo last pick (no picks yet)" : "Undo last pick"}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              style={ACTION_STYLE}
            >
              <Undo2 className="h-4 w-4" aria-hidden="true" />
              Undo
            </button>
            <button
              type="button"
              onClick={redoLastPick}
              disabled={!canRedo}
              aria-label={canRedo ? "Redo the last undone pick" : "Redo (nothing to redo)"}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              style={ACTION_STYLE}
            >
              <Redo2 className="h-4 w-4" aria-hidden="true" />
              Redo
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
