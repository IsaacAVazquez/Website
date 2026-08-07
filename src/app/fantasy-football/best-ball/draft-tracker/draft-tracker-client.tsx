"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import type { ExpectedReturnFormState } from "@/components/fantasy";
import { useBestBallSnapshot } from "@/hooks/useBestBallSnapshot";
import {
  BEST_BALL_CONTESTS,
  analyzeBestBallRoster,
  getContestPreset,
  getNextUserPick,
  normalizeContestId,
  recommendBestBallPlayers,
  sortBestBallRankings,
  type BestBallContestId,
  type BestBallContestPreset,
} from "@/lib/bestBall";
import type { BestBallSnapshot } from "@/lib/bestBallSnapshot";
import { calculateBestBallDraftValues } from "@/lib/fantasyTeamValue";
import { BestBallBuildPanel } from "./best-ball-build-panel";
import { BestBallBuildSheet } from "./best-ball-build-sheet";
import { BestBallDraftBoard } from "./best-ball-draft-board";
import { BestBallRecommendations } from "./best-ball-recommendations";
import {
  BEST_BALL_ROOM_RULES_SCHEMA_VERSION,
  type BestBallRoomRules,
} from "./best-ball-draft-state";
import { useBestBallDraft } from "./use-best-ball-draft";

const BREADCRUMBS = [
  { label: "Fantasy Football", href: "/fantasy-football" },
  { label: "Best Ball", href: "/fantasy-football/best-ball" },
  {
    label: "Draft Assistant",
    href: "/fantasy-football/best-ball/draft-tracker",
    isActive: true,
  },
];

const CONTESTS = Object.values(BEST_BALL_CONTESTS);
const VARIABLE_ROOM_CONTESTS = new Set<BestBallContestId>([
  "weekly-winners",
  "sit-and-go",
  "superflex",
]);

const SUBTLE_CARD_STYLE = {
  borderColor: "var(--home-rule)",
  background: "color-mix(in srgb, var(--home-paper-alt) 58%, var(--home-paper))",
} as const;

const OUTLINE_ACTION_STYLE = {
  borderColor: "var(--home-rule)",
  background: "color-mix(in srgb, var(--home-paper) 90%, var(--home-elev-mix))",
  color: "var(--home-ink)",
} as const;

function formatSnapshotDate(value: string | null | undefined): string {
  if (!value || Number.isNaN(Date.parse(value))) return "not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function roomRulesFromPreset(preset: BestBallContestPreset): BestBallRoomRules {
  return {
    contestId: preset.id,
    rulesSchemaVersion: BEST_BALL_ROOM_RULES_SCHEMA_VERSION,
    format: preset.format,
    scoring: preset.scoring,
    teams: preset.teams,
    rounds: preset.rounds,
    rosterSize: preset.rosterSize,
    lineup: {
      QB: preset.lineup.QB,
      RB: preset.lineup.RB,
      WR: preset.lineup.WR,
      TE: preset.lineup.TE,
      FLEX: preset.lineup.FLEX,
      ...(preset.lineup.SUPERFLEX ? { SUPERFLEX: preset.lineup.SUPERFLEX } : {}),
    },
  };
}

function lineupLabel(preset: BestBallContestPreset): string {
  const slots = [
    [preset.lineup.QB, "QB"],
    [preset.lineup.RB, "RB"],
    [preset.lineup.WR, "WR"],
    [preset.lineup.TE, "TE"],
    [preset.lineup.FLEX, "flex"],
  ]
    .filter(([count]) => Number(count) > 0)
    .map(([count, label]) => `${count} ${label}`);
  if (preset.lineup.SUPERFLEX) slots.push(`${preset.lineup.SUPERFLEX} superflex`);
  return slots.join(" · ");
}

export function BestBallDraftTrackerClient({
  initialContest,
}: {
  initialContest?: string;
}) {
  const router = useRouter();
  const [contestId, setContestId] = useState<BestBallContestId>(() =>
    normalizeContestId(initialContest)
  );
  const { snapshot, isLoading, error, retry } = useBestBallSnapshot();
  const preset = getContestPreset(contestId);

  function changeContest(nextContest: BestBallContestId) {
    setContestId(nextContest);
    router.replace(
      `/fantasy-football/best-ball/draft-tracker?contest=${encodeURIComponent(nextContest)}`,
      { scroll: false }
    );
  }

  return (
    <section
      className="home-page home-dash min-h-screen overflow-x-clip pb-24 lg:pb-0"
      data-testid="best-ball-draft-tracker-shell"
    >
      <div className="home-shell home-shell-wide home-section space-y-5">
        <Breadcrumbs customItems={BREADCRUMBS} className="pt-2" />

        <header className="space-y-4">
          <div className="space-y-3">
            <p className="home-kicker mb-0">Best ball draft assistant</p>
            <h1
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "clamp(2rem, 4.5vw, 3.4rem)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 0.98,
                maxWidth: "18ch",
              }}
            >
              Build for the contest you are actually drafting.
            </h1>
            <p className="max-w-[66ch] text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
              I built this for manual rooms on Underdog and similar platforms. It follows every pick, keeps the snake order straight, changes the recommendation weights by contest, and compares your build against the room. Expected return stays in a separate calculator because the Draft Outlook cannot promise an outcome.
            </p>
            <p className="max-w-[66ch] text-xs leading-6" style={{ color: "var(--home-ink-muted)" }}>
              This tracker models a 12 team, 18 round, 18 player, half PPR room. Weekly Winners, Sit &amp; Go, and Superflex contest cards can use different settings, so check the lobby before you start.
            </p>
          </div>

          <nav aria-label="Best ball contest" className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {CONTESTS.map((contest) => {
              const active = contest.id === contestId;
              return (
                <button
                  key={contest.id}
                  type="button"
                  onClick={() => changeContest(contest.id)}
                  aria-pressed={active}
                  className="min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color] duration-200"
                  style={{
                    borderColor: active ? "var(--home-ink)" : "var(--home-rule)",
                    background: active ? "var(--home-ink)" : "var(--home-paper)",
                    color: active ? "var(--home-paper)" : "var(--home-ink-muted)",
                  }}
                >
                  {contest.shortName}
                </button>
              );
            })}
          </nav>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border px-3 py-2 font-semibold" style={OUTLINE_ACTION_STYLE}>
              {preset.teams} teams · {preset.rounds} rounds
            </span>
            <span className="rounded-full border px-3 py-2 font-semibold" style={OUTLINE_ACTION_STYLE}>
              Half PPR · best ball scoring
            </span>
            <span className="rounded-full border px-3 py-2 font-semibold" style={OUTLINE_ACTION_STYLE}>
              Rankings updated {formatSnapshotDate(
                contestId === "superflex"
                  ? snapshot?.superflexSource?.asOf
                  : snapshot?.rankingSource.asOf
              )}
            </span>
          </div>
        </header>

        {error ? (
          <article className="home-card p-5 sm:p-6" style={{ borderColor: "var(--home-negative)" }}>
            <p className="font-semibold" style={{ color: "var(--home-negative)" }}>
              {error}
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-4 min-h-[44px] rounded-full border px-5 text-sm font-semibold"
              style={OUTLINE_ACTION_STYLE}
            >
              Try loading again
            </button>
          </article>
        ) : null}

        {isLoading && !snapshot ? (
          <article className="home-card p-6 text-sm" style={{ color: "var(--home-ink-muted)" }}>
            Loading best ball rankings and room rules...
          </article>
        ) : null}

        {snapshot ? (
          <BestBallDraftRoom
            key={`${snapshot.season}-${contestId}`}
            snapshot={snapshot}
            preset={preset}
          />
        ) : null}
      </div>
    </section>
  );
}

function BestBallDraftRoom({
  snapshot,
  preset,
}: {
  snapshot: BestBallSnapshot;
  preset: BestBallContestPreset;
}) {
  const rules = useMemo(() => roomRulesFromPreset(preset), [preset]);
  const draft = useBestBallDraft({ season: snapshot.season, rules });
  const [roomStarted, setRoomStarted] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const [buildOpen, setBuildOpen] = useState(false);
  const [returnAssumptions, setReturnAssumptions] = useState<ExpectedReturnFormState>(() => ({
    entryCost: preset.economics ? String(preset.economics.entryFee) : "",
    payoutProbability: "",
    averagePayout: "",
  }));
  const buildTriggerRef = useRef<HTMLButtonElement>(null);
  const closeBuild = useCallback(() => setBuildOpen(false), []);

  const draftedIds = useMemo(
    () => new Set(draft.state.picks.map((pick) => pick.player.id)),
    [draft.state.picks]
  );
  const rankedAvailablePlayers = useMemo(
    () => sortBestBallRankings(snapshot.players, preset).filter((player) => !draftedIds.has(player.id)),
    [draftedIds, preset, snapshot.players]
  );
  const nextUserPick = useMemo(
    () =>
      getNextUserPick(
        draft.currentPick,
        draft.state.userSlot,
        preset.teams,
        preset.rounds
      ),
    [draft.currentPick, draft.state.userSlot, preset.rounds, preset.teams]
  );
  const upcomingUserRound = useMemo(
    () =>
      Math.floor(((nextUserPick ?? draft.currentPick) - 1) / preset.teams) + 1,
    [draft.currentPick, nextUserPick, preset.teams]
  );
  const analysis = useMemo(
    () =>
      analyzeBestBallRoster(
        draft.userPicks,
        snapshot.week17Opponents,
        preset.id,
        upcomingUserRound
      ),
    [draft.userPicks, preset.id, snapshot.week17Opponents, upcomingUserRound]
  );
  const draftValueReports = useMemo(
    () =>
      calculateBestBallDraftValues({
        picks: draft.state.picks,
        contestId: preset.id,
        week17Opponents: snapshot.week17Opponents,
      }),
    [draft.state.picks, preset.id, snapshot.week17Opponents]
  );
  const userDraftValue =
    draftValueReports.find((report) => report.teamNumber === draft.state.userSlot) ?? null;
  const recommendations = useMemo(
    () =>
      draft.isComplete
        ? []
        : recommendBestBallPlayers({
            players: snapshot.players,
            picks: draft.state.picks,
            userTeamNumber: draft.state.userSlot,
            currentPickNumber: nextUserPick ?? draft.currentPick,
            contestId: preset.id,
            week17Opponents: snapshot.week17Opponents,
            limit: 3,
          }),
    [
      draft.currentPick,
      draft.isComplete,
      draft.state.picks,
      draft.state.userSlot,
      nextUserPick,
      preset.id,
      snapshot.players,
      snapshot.week17Opponents,
    ]
  );

  const showSetup = draft.state.picks.length === 0 && !roomStarted;

  if (!draft.isLoaded) {
    return (
      <article className="home-card p-6 text-sm" style={{ color: "var(--home-ink-muted)" }}>
        Checking this browser for a saved {preset.shortName} room...
      </article>
    );
  }

  if (showSetup) {
    return (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <section className="home-card p-5 sm:p-7" aria-labelledby="best-ball-room-setup-heading">
          <p className="home-kicker mb-1">Room setup</p>
          <h2 id="best-ball-room-setup-heading" className="text-3xl font-semibold">
            Choose your draft slot
          </h2>
          <p className="mt-3 max-w-[58ch] text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
            This room is saved under the {snapshot.season} season and {preset.shortName} contest. Changing formats opens a separate saved room, so one set of picks never overwrites another.
          </p>

          {VARIABLE_ROOM_CONTESTS.has(preset.id) ? (
            <div
              role="note"
              className="mt-4 rounded-[var(--radius-2xl)] border px-4 py-3 text-sm leading-6"
              style={{
                borderColor: "color-mix(in srgb, var(--home-warning) 48%, var(--home-rule))",
                background: "color-mix(in srgb, var(--home-warning) 10%, var(--home-paper))",
              }}
            >
              {preset.rulesNote}
            </div>
          ) : null}

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold">Your slot in the 12 team snake</legend>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {Array.from({ length: preset.teams }, (_, index) => index + 1).map((slot) => {
                const active = draft.state.userSlot === slot;
                return (
                  <label
                    key={slot}
                    className="inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-[var(--radius-2xl)] border text-sm font-semibold focus-within:ring-2 focus-within:ring-[var(--home-signal)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--home-paper)]"
                    style={{
                      borderColor: active ? "var(--home-ink)" : "var(--home-rule)",
                      background: active ? "var(--home-ink)" : "transparent",
                      color: active ? "var(--home-paper)" : "var(--home-ink)",
                    }}
                  >
                    <input
                      type="radio"
                      name="best-ball-user-slot"
                      value={slot}
                      checked={active}
                      onChange={() => draft.setUserSlot(slot)}
                      className="sr-only"
                    />
                    {slot}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={() => setRoomStarted(true)}
            className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-full border px-6 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200 sm:w-auto"
            style={{
              borderColor: "var(--home-ink)",
              background: "var(--home-ink)",
              color: "var(--home-paper)",
            }}
          >
            Open draft room from slot {draft.state.userSlot}
          </button>
        </section>

        <aside aria-label="Contest details" className="home-card p-5 sm:p-6">
          <p className="home-kicker mb-1">{preset.shortName}</p>
          <h2 className="text-2xl font-semibold">{preset.name}</h2>
          <p className="mt-3 text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
            {preset.description}
          </p>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="rounded-[var(--radius-2xl)] border p-3" style={SUBTLE_CARD_STYLE}>
              <dt className="text-xs font-semibold" style={{ color: "var(--home-ink-muted)" }}>
                Room
              </dt>
              <dd className="mt-1 font-semibold">
                {preset.teams} teams · {preset.rounds} rounds · {preset.rosterSize} players
              </dd>
            </div>
            <div className="rounded-[var(--radius-2xl)] border p-3" style={SUBTLE_CARD_STYLE}>
              <dt className="text-xs font-semibold" style={{ color: "var(--home-ink-muted)" }}>
                Weekly lineup
              </dt>
              <dd className="mt-1 font-semibold">{lineupLabel(preset)}</dd>
            </div>
            <div className="rounded-[var(--radius-2xl)] border p-3" style={SUBTLE_CARD_STYLE}>
              <dt className="text-xs font-semibold" style={{ color: "var(--home-ink-muted)" }}>
                Rules checked
              </dt>
              <dd className="mt-1 font-semibold">{formatSnapshotDate(preset.rulesAsOf)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
            {preset.rulesNote}
          </p>
          <a
            href={preset.officialRulesUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold underline decoration-[var(--home-rule)] underline-offset-4"
          >
            Read the official rules
          </a>
        </aside>

        {draft.persistenceError || draft.restoreNotice ? (
          <div
            role="status"
            className="rounded-[var(--radius-3xl)] border px-4 py-3 text-sm lg:col-span-2"
            style={{
              borderColor: "color-mix(in srgb, var(--home-warning) 50%, var(--home-rule))",
              background: "color-mix(in srgb, var(--home-warning) 10%, var(--home-paper))",
            }}
          >
            {draft.persistenceError ?? draft.restoreNotice}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {draft.persistenceError || draft.restoreNotice ? (
        <div
          role="status"
          className="rounded-[var(--radius-3xl)] border px-4 py-3 text-sm"
          style={{
            borderColor: "color-mix(in srgb, var(--home-warning) 50%, var(--home-rule))",
            background: "color-mix(in srgb, var(--home-warning) 10%, var(--home-paper))",
          }}
        >
          {draft.persistenceError ?? draft.restoreNotice}
        </div>
      ) : null}

      <section className="home-card p-5 sm:p-6" aria-labelledby="best-ball-room-status-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="home-kicker mb-1">Live room</p>
            <h2 id="best-ball-room-status-heading" className="text-2xl font-semibold">
              {draft.isComplete
                ? "Draft complete"
                : draft.isUserPick
                  ? `You are on the clock at pick ${draft.currentPick}`
                  : `Slot ${draft.currentTeamNumber} is on the clock`}
            </h2>
          </div>
          <button
            type="button"
            onClick={draft.undoLastPick}
            disabled={draft.state.picks.length === 0}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            style={OUTLINE_ACTION_STYLE}
          >
            <Undo2 className="h-4 w-4" aria-hidden="true" />
            Undo last pick
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3" aria-live="polite">
          <div className="rounded-[var(--radius-2xl)] border p-3" style={SUBTLE_CARD_STYLE}>
            <p className="text-xs font-semibold" style={{ color: "var(--home-ink-muted)" }}>
              Current room pick
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {Math.min(draft.currentPick, draft.totalPicks)} of {draft.totalPicks}
            </p>
          </div>
          <div className="rounded-[var(--radius-2xl)] border p-3" style={SUBTLE_CARD_STYLE}>
            <p className="text-xs font-semibold" style={{ color: "var(--home-ink-muted)" }}>
              Round
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {draft.currentRound} of {preset.rounds}
            </p>
          </div>
          <div className="rounded-[var(--radius-2xl)] border p-3" style={SUBTLE_CARD_STYLE}>
            <p className="text-xs font-semibold" style={{ color: "var(--home-ink-muted)" }}>
              Your next pick
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {nextUserPick ?? "Complete"}
            </p>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,23rem)]">
        <div className="grid min-w-0 gap-5">
          <BestBallRecommendations
            recommendations={recommendations}
            isUserPick={draft.isUserPick}
            adpAvailable={preset.format !== "superflex"}
            onDraftPlayer={draft.draftPlayer}
          />
          <BestBallDraftBoard
            players={rankedAvailablePlayers}
            currentPick={draft.currentPick}
            currentTeamNumber={draft.currentTeamNumber}
            isComplete={draft.isComplete}
            adpAvailable={preset.format !== "superflex"}
            onDraftPlayer={draft.draftPlayer}
          />
        </div>

        {/* Bounded so the rail cannot outgrow the space a sticky element gets and strand
            its last card below the fold. */}
        <aside
          aria-label="Roster build"
          className="hidden self-start lg:sticky lg:top-24 lg:grid lg:max-h-[calc(100vh-7rem)] lg:gap-5 lg:overflow-y-auto lg:overscroll-contain"
        >
          <section className="home-card p-5">
            <BestBallBuildPanel
              analysis={analysis}
              preset={preset}
              userPicks={draft.userPicks}
              currentPick={draft.currentPick}
              nextUserPick={nextUserPick}
              totalPicks={draft.totalPicks}
              draftValue={userDraftValue}
              calculatorValue={returnAssumptions}
              onCalculatorChange={setReturnAssumptions}
              headingId="best-ball-desktop-build-heading"
            />
          </section>

          <section className="home-card p-5" aria-labelledby="best-ball-room-actions-heading">
            <p className="home-kicker mb-1">Room controls</p>
            <h2 id="best-ball-room-actions-heading" className="text-xl font-semibold">
              Saved in this browser
            </h2>
            <p className="mt-2 text-xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
              {snapshot.season} · {preset.shortName} · slot {draft.state.userSlot}
            </p>

            <div className="mt-4 grid gap-2">
              {draft.state.picks.slice(-5).reverse().map((pick) => (
                <div
                  key={pick.pickNumber}
                  className="rounded-[var(--radius-2xl)] border px-3 py-3 text-xs"
                  style={SUBTLE_CARD_STYLE}
                >
                  <p className="truncate font-semibold">{pick.player.name}</p>
                  <p className="mt-1" style={{ color: "var(--home-ink-muted)" }}>
                    Pick {pick.pickNumber} · slot {pick.teamNumber} · {pick.player.position}
                  </p>
                </div>
              ))}
            </div>

            {resetArmed ? (
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-[var(--radius-2xl)] border p-2" style={{ borderColor: "var(--home-negative)" }}>
                <button
                  type="button"
                  autoFocus
                  onClick={() => setResetArmed(false)}
                  className="min-h-[44px] rounded-full border px-3 text-sm font-semibold"
                  style={OUTLINE_ACTION_STYLE}
                >
                  Keep room
                </button>
                <button
                  type="button"
                  onClick={() => {
                    draft.resetDraft();
                    setRoomStarted(false);
                    setResetArmed(false);
                  }}
                  className="min-h-[44px] rounded-full border px-3 text-sm font-semibold"
                  style={{
                    borderColor: "var(--home-negative)",
                    background: "var(--home-negative)",
                    color: "var(--home-paper)",
                  }}
                >
                  Confirm reset
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setResetArmed(true)}
                className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold"
                style={OUTLINE_ACTION_STYLE}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset this room
              </button>
            )}

            <Link
              href={`/fantasy-football/best-ball?contest=${preset.id}`}
              className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-full border px-4 text-sm font-semibold"
              style={OUTLINE_ACTION_STYLE}
            >
              Back to best ball rankings
            </Link>
          </section>
        </aside>
      </div>

      <button
        ref={buildTriggerRef}
        type="button"
        onClick={() => setBuildOpen(true)}
        aria-expanded={buildOpen}
        aria-controls="best-ball-build-sheet"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[70] inline-flex min-h-[52px] w-[min(calc(100%_-_2rem),24rem)] -translate-x-1/2 items-center justify-between rounded-full border px-5 text-sm font-semibold shadow-[var(--shadow-xl)] lg:hidden"
        style={{
          borderColor: "var(--home-ink)",
          background: "var(--home-ink)",
          color: "var(--home-paper)",
        }}
      >
        <span>My build</span>
        <span className="tabular-nums">
          {draft.userPicks.length} / {preset.rosterSize}
        </span>
      </button>

      <BestBallBuildSheet
        open={buildOpen}
        onClose={closeBuild}
        returnFocusRef={buildTriggerRef}
      >
        <BestBallBuildPanel
          analysis={analysis}
          preset={preset}
          userPicks={draft.userPicks}
          currentPick={draft.currentPick}
          nextUserPick={nextUserPick}
          totalPicks={draft.totalPicks}
          draftValue={userDraftValue}
          calculatorValue={returnAssumptions}
          onCalculatorChange={setReturnAssumptions}
          headingId="best-ball-mobile-build-heading"
        />
        <div className="mt-5 grid gap-2 border-t pt-4" style={{ borderColor: "var(--home-rule)" }}>
          <button
            type="button"
            onClick={draft.undoLastPick}
            disabled={draft.state.picks.length === 0}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold disabled:opacity-50"
            style={OUTLINE_ACTION_STYLE}
          >
            <Undo2 className="h-4 w-4" aria-hidden="true" />
            Undo last pick
          </button>
          {resetArmed ? (
            <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-2xl)] border p-2" style={{ borderColor: "var(--home-negative)" }}>
              <button
                type="button"
                autoFocus
                onClick={() => setResetArmed(false)}
                className="min-h-[44px] rounded-full border px-3 text-sm font-semibold"
                style={OUTLINE_ACTION_STYLE}
              >
                Keep room
              </button>
              <button
                type="button"
                onClick={() => {
                  draft.resetDraft();
                  setRoomStarted(false);
                  setResetArmed(false);
                  setBuildOpen(false);
                }}
                className="min-h-[44px] rounded-full border px-3 text-sm font-semibold"
                style={{
                  borderColor: "var(--home-negative)",
                  background: "var(--home-negative)",
                  color: "var(--home-paper)",
                }}
              >
                Confirm reset
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setResetArmed(true)}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold"
              style={OUTLINE_ACTION_STYLE}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset this room
            </button>
          )}
          <Link
            href={`/fantasy-football/best-ball?contest=${preset.id}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border px-4 text-sm font-semibold"
            style={OUTLINE_ACTION_STYLE}
          >
            Back to rankings
          </Link>
        </div>
      </BestBallBuildSheet>
    </>
  );
}
