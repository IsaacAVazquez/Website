"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Download, RotateCcw } from "lucide-react";
import { DraftBoard } from "./components/DraftBoard";
import { DraftSetup } from "./components/DraftSetup";
import { useDraftState } from "./hooks/useDraftState";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import { FANTASY_SCORING_LABELS, getFantasyWeekLabel, scoringFormatToRouteScoring } from "@/lib/fantasy";

function formatUpdatedAt(timestamp: string | undefined): string {
  if (!timestamp) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function DraftTrackerClient() {
  const {
    draftState,
    updateSettings,
    startDraft,
    draftPlayer,
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
  const totalPicks = draftState.settings.totalTeams * draftState.settings.rounds;
  const completionPercentage = Math.round((draftState.picks.length / totalPicks) * 100);

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(77,182,255,0.12),transparent_28%),linear-gradient(180deg,#09111f_0%,#0c1424_55%,#08111c_100%)] text-white">
      <div className="mx-auto w-full max-w-[1520px] px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8 xl:px-10">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="grid gap-8 border-b border-white/10 px-6 py-7 sm:px-8 sm:py-8 xl:grid-cols-[minmax(0,1.4fr)_320px] xl:items-end">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/85">
                Draft Assistant
              </p>
              <h1 className="mt-3 max-w-[15ch] text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Manual draft tracking that actually stays usable.
              </h1>
              <p className="mt-4 max-w-[68ch] text-sm leading-7 text-slate-300 sm:text-[0.98rem]">
                Log every pick, keep the board on the same published snapshot as the public rankings,
                and keep your roster context visible without pretending to simulate the entire room.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {metadata ? `${metadata.season} ${getFantasyWeekLabel(metadata.week)}` : "Loading snapshot"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  Updated {formatUpdatedAt(metadata?.generatedAt)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {FANTASY_SCORING_LABELS[scoringKey]} scoring
                </span>
              </div>
              {error && (
                <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </p>
              )}
              {rankingsUnavailable && (
                <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                  {overallSliceMetadata?.reason ??
                    "The current snapshot does not include an overall board for this scoring format."}
                </p>
              )}
            </div>

            <div className="grid gap-3 rounded-[28px] border border-white/10 bg-[#0d1728]/80 p-4">
              <Link
                href="/fantasy-football"
                className="flex min-h-[52px] items-center justify-between rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-sky-300/40 hover:bg-sky-300/10"
              >
                <span>Back to rankings board</span>
                <span aria-hidden="true">↗</span>
              </Link>
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Progress</p>
                  <p className="mt-2 text-sm font-semibold text-white">{draftState.picks.length} picks logged</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">On clock</p>
                  <p className="mt-2 text-sm font-semibold text-white">{currentTeamName}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Storage</p>
                  <p className="mt-2 text-sm font-semibold text-white">Local persistence enabled</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {rankingsUnavailable ? (
              <div className="rounded-[28px] border border-amber-300/20 bg-amber-300/10 px-6 py-10 text-center">
                <p className="text-xl font-semibold text-white">Draft assistant unavailable for this scoring format</p>
                <p className="mt-3 text-sm leading-7 text-amber-100/85">
                  The draft assistant needs a published overall board. Switch scoring or wait for the next snapshot update.
                </p>
              </div>
            ) : showSetup ? (
              <DraftSetup
                settings={draftState.settings}
                onSaveSettings={updateSettings}
                onStartDraft={startDraft}
              />
            ) : (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_340px]">
                <DraftBoard
                  players={snapshot?.overall ?? []}
                  draftedPlayerIds={draftedPlayerIds}
                  onDraftPlayer={draftPlayer}
                  currentPick={draftState.currentPick}
                  currentTeamNumber={currentTeamNumber}
                  isUserPick={isUserPick}
                  isDraftComplete={isDraftComplete}
                  userTeam={userTeam}
                />

                <aside className="grid gap-5">
                  <div className="rounded-[28px] border border-white/10 bg-[#08111f]/90 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Draft Status
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">
                          {isDraftComplete ? "Draft complete" : currentTeamName}
                        </h2>
                      </div>
                      {isUserPick && !isDraftComplete && (
                        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
                          Your turn
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>Completion</span>
                        <span>{completionPercentage}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-sky-300 to-emerald-300"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Pick</p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {draftState.currentPick} / {totalPicks}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Round</p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {draftState.currentRound} / {draftState.settings.rounds}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-[#08111f]/90 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Your roster</p>
                    <div className="mt-4 grid gap-3">
                      {(userTeam?.picks ?? []).length === 0 ? (
                        <p className="text-sm text-slate-400">Your picks will appear here as the draft moves.</p>
                      ) : (
                        userTeam?.picks.map((pick) => (
                          <div
                            key={pick.pickNumber}
                            className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"
                          >
                            <p className="text-sm font-semibold text-white">{pick.player.name}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              Pick {pick.pickNumber} • {pick.player.position} • {pick.player.team}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-[#08111f]/90 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Recent picks</p>
                      <span className="text-xs text-slate-500">Newest first</span>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {recentPicks.length === 0 ? (
                        <p className="text-sm text-slate-400">No picks logged yet.</p>
                      ) : (
                        recentPicks.map((pick) => (
                          <div
                            key={`recent-${pick.pickNumber}`}
                            className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"
                          >
                            <p className="text-sm font-semibold text-white">{pick.player.name}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              Team {pick.teamNumber} • Pick {pick.pickNumber} • {pick.player.position}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-[#08111f]/90 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Actions</p>
                    <div className="mt-4 grid gap-3">
                      <button
                        type="button"
                        onClick={() => exportDraftResults("csv")}
                        className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        <Download className="h-4 w-4" />
                        Export CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          resetDraft();
                        }}
                        className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset draft
                      </button>
                    </div>
                    <p className="mt-3 text-xs leading-6 text-slate-500">
                      Change league settings by starting a new draft. Active drafts keep one fixed room configuration.
                    </p>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>

        {isLoading && !snapshot && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            Loading the published draft snapshot...
          </div>
        )}
      </div>
    </section>
  );
}
