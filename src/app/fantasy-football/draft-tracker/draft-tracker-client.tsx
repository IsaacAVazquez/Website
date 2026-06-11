"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, RotateCcw, Undo2 } from "lucide-react";
import { DraftAnalyticsPanel } from "./components/DraftAnalyticsPanel";
import { DraftBoard } from "./components/DraftBoard";
import { DraftSetup } from "./components/DraftSetup";
import { useDraftState } from "./hooks/useDraftState";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import { computeDraftAnalytics } from "@/lib/draftAnalytics";
import {
  FANTASY_SCORING_LABELS,
  getFantasyWeekLabel,
  scoringFormatToRouteScoring,
} from "@/lib/fantasy";
import { formatUpdatedAt } from "@/lib/fantasyUtils";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";

const DRAFT_TRACKER_BREADCRUMBS = [
  { label: "Fantasy Football", href: "/fantasy-football" },
  { label: "Draft Assistant", href: "/fantasy-football/draft-tracker", isActive: true },
];

export function DraftTrackerClient() {
  const {
    draftState,
    updateSettings,
    startDraft,
    draftPlayer,
    undoLastPick,
    resetDraft,
    exportDraftResults,
    isUserPick,
    isDraftComplete,
    currentTeamName,
    currentTeamNumber,
    userTeam,
  } = useDraftState();

  const scoringKey = scoringFormatToRouteScoring(draftState.settings.scoringFormat);
  const { snapshot, metadata, isLoading, error } = useFantasySnapshot({
    scoring: scoringKey,
    all: true,
  });
  const overallSliceMetadata = snapshot?.sliceMetadata?.overall ?? null;
  const rankingsUnavailable = Boolean(overallSliceMetadata && !overallSliceMetadata.available);
  const showSetup = draftState.picks.length === 0 && !draftState.isActive;

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

  const [exportToast, setExportToast] = useState<string | null>(null);
  function handleExport(format: "csv") {
    exportDraftResults(format);
    setExportToast(`Exported ${draftState.picks.length} picks as ${format.toUpperCase()}.`);
    window.setTimeout(() => setExportToast(null), 3500);
  }

  return (
    <section className="home-page home-dash min-h-screen">
      <div className="home-shell home-shell-wide home-section space-y-4 sm:space-y-5">
        <Breadcrumbs customItems={DRAFT_TRACKER_BREADCRUMBS} className="pt-2" />
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="home-kicker mb-0">Draft Assistant</p>
            <h1
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "clamp(2.55rem, 6vw, 4.75rem)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 0.95,
                maxWidth: "15ch",
              }}
            >
              Manual draft tracking that actually stays usable.
            </h1>
            <p
              className="max-w-[68ch] text-sm leading-7 sm:text-[1rem]"
              style={{ color: "var(--home-ink-muted)" }}
            >
              Log every pick, keep the board on the same published snapshot as the public rankings,
              and watch for steals, reaches, and position runs against attributed mock-draft ADP
              while the room is still on the clock.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <span
              className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
              }}
            >
              {metadata ? `${metadata.season} ${getFantasyWeekLabel(metadata.week)}` : "Loading snapshot"}
            </span>
            <span
              className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
              }}
            >
              Source updated {formatUpdatedAt(overallSliceMetadata?.updatedAt ?? metadata?.upstreamUpdatedAt)}
            </span>
            <span
              className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
              }}
            >
              Built {formatUpdatedAt(metadata?.generatedAt)}
            </span>
            <span
              className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
              }}
            >
              {FANTASY_SCORING_LABELS[scoringKey]} scoring
            </span>
          </div>
        </div>

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

        {error && (
          <article className="home-card p-5 sm:p-6" style={{ borderColor: "var(--color-error)" }}>
            <p className="font-semibold" style={{ color: "var(--color-error)" }}>
              {error}
            </p>
          </article>
        )}

        {rankingsUnavailable && (
          <article className="home-card p-5 sm:p-6" style={{ borderColor: "var(--color-warning)" }}>
            <p className="font-semibold">
              {overallSliceMetadata?.reason ??
                "The current snapshot does not include an overall board for this scoring format."}
            </p>
          </article>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,22rem)] min-[1440px]:grid-cols-[minmax(0,1.2fr)_minmax(20rem,26rem)]">
          <div className="grid gap-5">
            <article className="home-card p-5 sm:p-6">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
                <div>
                  <p className="home-kicker mb-1">Room status</p>
                  <h2 className="text-2xl font-semibold">
                    {isDraftComplete ? "Draft complete" : currentTeamName}
                  </h2>
                  <p className="mt-2 text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
                    The assistant reads the same snapshot as the public rankings board. Best available,
                    search, and roster pressure all stay on one consistent data source.
                  </p>
                </div>

                <div
                  className="rounded-[1.5rem] border px-4 py-4"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper-alt) 52%, var(--home-elev-mix))",
                  }}
                >
                  <p className="home-kicker mb-1">Snapshot</p>
                  <p className="text-base font-semibold">Overall consensus board</p>
                  <p className="mt-2 text-sm leading-6" style={{ color: "var(--home-ink-muted)" }}>
                    Local persistence is enabled. Room state survives reloads until you reset the draft.
                  </p>
                </div>
              </div>
            </article>

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
                  />
                )}
                <DraftBoard
                  players={snapshot?.overall ?? []}
                  snapshot={snapshot}
                  draftedPlayerIds={draftedPlayerIds}
                  onDraftPlayer={draftPlayer}
                  currentPick={draftState.currentPick}
                  currentRound={draftState.currentRound}
                  currentTeamNumber={currentTeamNumber}
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
              />
            )}
            <article className="home-card p-5 sm:p-6">
              <p className="home-kicker mb-1">Progress</p>
              <h3 className="text-2xl font-semibold">
                {draftState.picks.length} of {totalPicks} picks logged
              </h3>

              <div className="mt-4">
                <div
                  className="flex items-center justify-between text-sm"
                  style={{ color: "var(--home-ink-muted)" }}
                >
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
                      background:
                        "linear-gradient(90deg, var(--home-haze) 0%, var(--home-acid) 100%)",
                    }}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div
                  className="rounded-[1.2rem] border px-4 py-3"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
                  }}
                >
                  <p className="home-kicker mb-1">On clock</p>
                  <p className="text-sm font-semibold">{currentTeamName}</p>
                </div>
                <div
                  className="rounded-[1.2rem] border px-4 py-3"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
                  }}
                >
                  <p className="home-kicker mb-1">Current pick</p>
                  <p className="text-sm font-semibold">
                    {draftState.currentPick} / {totalPicks}
                  </p>
                </div>
                <div
                  className="rounded-[1.2rem] border px-4 py-3"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
                  }}
                >
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
                    <div
                      key={pick.pickNumber}
                      className="rounded-[1.2rem] border px-4 py-3"
                      style={{
                        borderColor: "var(--home-rule)",
                        background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
                      }}
                    >
                      <p className="text-sm font-semibold">{pick.player.name}</p>
                      <p className="mt-1 text-xs" style={{ color: "var(--home-ink-muted)" }}>
                        Pick {pick.pickNumber} • {pick.player.position} • {pick.player.team}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="home-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <p className="home-kicker mb-0">Recent picks</p>
                <span className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
                  Newest first
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
                      className="rounded-[1.2rem] border px-4 py-3"
                      style={{
                        borderColor: "var(--home-rule)",
                        background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
                      }}
                    >
                      <p className="text-sm font-semibold">{pick.player.name}</p>
                      <p className="mt-1 text-xs" style={{ color: "var(--home-ink-muted)" }}>
                        Team {pick.teamNumber} • Pick {pick.pickNumber} • {pick.player.position}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="home-card p-5 sm:p-6">
              <p className="home-kicker mb-1">Actions</p>
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={undoLastPick}
                  disabled={draftState.picks.length === 0}
                  aria-label={
                    draftState.picks.length === 0
                      ? "Undo last pick (no picks yet)"
                      : "Undo last pick"
                  }
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
                    color: "var(--home-ink)",
                  }}
                >
                  <Undo2 className="h-4 w-4" />
                  Undo last pick
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("csv")}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
                    color: "var(--home-ink)",
                  }}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetDraft();
                  }}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
                  style={{
                    borderColor: "var(--home-ink)",
                    background: "var(--home-ink)",
                    color: "var(--home-paper)",
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset draft
                </button>
                <Link
                  href="/fantasy-football"
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
                    color: "var(--home-ink)",
                  }}
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
              style={{
                borderColor: "var(--home-rule)",
                background: "var(--home-ink)",
                color: "var(--home-paper)",
              }}
            >
              {exportToast}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
