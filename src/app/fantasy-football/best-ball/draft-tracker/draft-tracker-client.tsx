"use client";

import { SeasonalScopeNote } from "@/components/fantasy/SeasonalScopeNote";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import type { ExpectedReturnFormState } from "@/components/fantasy";
import { useBestBallSnapshot } from "@/hooks/useBestBallSnapshot";
import {
  BEST_BALL_CONTESTS,
  analyzeBestBallRoster,
  getContestPreset,
  getBestBallModelSourceIssue,
  getNextUserPick,
  hasSupportedBestBallAdp,
  normalizeContestId,
  recommendBestBallPlayers,
  sortBestBallRankings,
  type BestBallContestId,
  type BestBallContestPreset,
} from "@/lib/bestBall";
import type { BestBallSnapshot } from "@/lib/bestBallSnapshot";
import {
  FASCIA_TOP_CLASS,
  getFantasySourceCapabilities,
  resolveDraftPicksForModel,
  withoutPlayerAdp,
  getNflRegularSeasonWeek,
} from "@/lib/fantasyUtils";
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

// Mirrors the redraft tracker: CI webkit reloads the room slowly enough that a
// click can land before hydration, so the shell says when it is interactive.
const subscribeToHydration = () => () => undefined;
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

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
// Presets whose lobby cards vary enough that the bespoke rulesNote has to render.
// 6-Man belongs here because six-team rooms run several tournament structures.
const VARIABLE_ROOM_CONTESTS = new Set<BestBallContestId>([
  "weekly-winners",
  "sit-and-go",
  "six-man",
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
    competitionFormat: preset.competitionFormat,
    lineupVariant: preset.lineupVariant,
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
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );
  const router = useRouter();
  const [contestId, setContestId] = useState<BestBallContestId>(() =>
    normalizeContestId(initialContest)
  );
  // Same split the redraft tracker made on 2026-08-07: setup keeps the display
  // headline and the pitch, because that visitor is still deciding whether to
  // use the tool; an open room gets a compact title so the live state leads.
  const [roomOpen, setRoomOpen] = useState(false);
  const { snapshot, isLoading, error, retry } = useBestBallSnapshot();
  const preset = getContestPreset(contestId);
  const sourceIssue = snapshot ? getBestBallModelSourceIssue(snapshot, preset) : null;

  function changeContest(nextContest: BestBallContestId) {
    setContestId(nextContest);
    router.replace(
      `/fantasy-football/best-ball/draft-tracker?contest=${encodeURIComponent(nextContest)}`,
      { scroll: false }
    );
  }

  // Every board in this room is a draft board. Once the season starts it stops
  // describing a live market, so say which season it covers rather than letting it
  // look like a surface that quietly stopped working.
  const seasonalWeek = getNflRegularSeasonWeek(snapshot?.season ?? 0);

  return (
    <section
      className="home-page home-dash min-h-screen overflow-x-clip pb-24 lg:pb-0"
      aria-label="Best ball draft assistant"
      data-testid="best-ball-draft-tracker-shell"
      data-hydrated={isHydrated ? "true" : "false"}
    >
      <div className="home-shell home-shell-wide home-section space-y-5">
        <Breadcrumbs customItems={BREADCRUMBS} className="pt-2" />
        {seasonalWeek >= 1 ? (
          <SeasonalScopeNote season={snapshot?.season ?? 0} week={seasonalWeek}>
            Best ball drafts are a preseason event and this board is the preseason board, so nothing here refreshes against the games being played now. Your saved rooms are untouched. In-season ranks are on the <Link href="/fantasy-football/weekly" className="underline decoration-[var(--home-signal)] underline-offset-4">weekly board</Link>.
          </SeasonalScopeNote>
        ) : null}

        <header className="space-y-4">
          {roomOpen ? (
            <div className="space-y-2">
              <p className="home-kicker mb-0">Best ball draft assistant</p>
              {/* An open room demotes the pitch: the h1 stays for the outline,
                  compact, and the live state below leads. Freshness survives the
                  collapse on purpose; it is a credibility feature. */}
              <h1 className="text-2xl font-semibold tracking-tight">
                Track every pick and see what your build still needs.
              </h1>
              <p className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
                {preset.teams} teams · {preset.rounds} rounds · Half PPR · Rankings updated{" "}
                {formatSnapshotDate(
                  contestId === "superflex"
                    ? snapshot?.superflexSource?.asOf
                    : snapshot?.rankingSource.asOf
                )}{" "}
                · No live injury or news feed, so check the draft room before each pick.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="home-kicker mb-0">Best ball draft assistant</p>
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
                Track every pick and see what your build still needs.
              </h1>
              <p className="max-w-[66ch] text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
                I built this for manual rooms on Underdog and similar platforms. It follows every pick, keeps the snake order straight, adjusts roster guidance by contest, and compares your build against the room. Exact player cards appear only for presets with a matching room-price source. Expected return stays in a separate calculator because the Draft Outlook cannot promise an outcome.
              </p>
              <p className="max-w-[66ch] text-xs leading-6" style={{ color: "var(--home-ink-muted)" }}>
                The snapshot has no separate live injury or player-news feed. Check the draft room and
                current team reports before logging each pick.
              </p>
              <p className="max-w-[66ch] text-xs leading-6" style={{ color: "var(--home-ink-muted)" }}>
                This tracker models a {preset.teams} team, {preset.rounds} round, {preset.rosterSize} player, half PPR room. Weekly Winners, Sit &amp; Go, 6-Man, and Superflex contest cards can use different settings, so check the lobby before you start.
              </p>
            </div>
          )}

          <nav aria-label="Best ball contest" className="scroll-shadow-x scrollbar-thin flex max-w-full gap-2 overflow-x-auto pb-1">
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

          {!roomOpen ? (
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
          ) : null}
        </header>

        {sourceIssue ? (
          <div
            role="alert"
            className="rounded-[var(--radius-3xl)] border px-4 py-3 text-sm leading-6"
            style={{
              borderColor: "color-mix(in srgb, var(--home-warning) 52%, var(--home-rule))",
              background: "color-mix(in srgb, var(--home-warning) 10%, var(--home-paper))",
            }}
          >
            Draft Outlook is paused because {sourceIssue}.
            {preset.recommendationMode === "exact" ? " Exact player cards are paused too." : ""}
            {" "}The dated board, roster targets, and manual pick log remain available.
          </div>
        ) : null}

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
            onRoomOpenChange={setRoomOpen}
          />
        ) : null}
      </div>
    </section>
  );
}

function BestBallDraftRoom({
  snapshot,
  preset,
  onRoomOpenChange,
}: {
  snapshot: BestBallSnapshot;
  preset: BestBallContestPreset;
  onRoomOpenChange?: (open: boolean) => void;
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
  const rankingSource = preset.lineupVariant === "superflex"
    ? snapshot.superflexSource
    : snapshot.rankingSource;
  const sourceCapabilities = getFantasySourceCapabilities({
    rankingAsOf: rankingSource?.asOf,
    marketAsOf: snapshot.adpSource?.asOf,
    scheduleAsOf: snapshot.scheduleSource?.asOf,
    season: snapshot.season,
  });
  const adpAvailable =
    hasSupportedBestBallAdp(preset) &&
    snapshot.adpSource !== null &&
    sourceCapabilities.market.current;
  const modelSourceIssue = getBestBallModelSourceIssue(snapshot, preset);
  const recommendationSourceIssue =
    preset.recommendationMode === "exact" ? modelSourceIssue : null;
  const recommendationsAvailable =
    preset.recommendationMode === "exact" && recommendationSourceIssue === null;
  const scheduleAvailable =
    snapshot.scheduleSource !== null &&
    sourceCapabilities.schedule.usable &&
    Object.keys(snapshot.week17Opponents).length >= 30;
  const modelPlayers = useMemo(
    () =>
      snapshot.players.map((player) =>
        adpAvailable ? player : withoutPlayerAdp(player)
      ),
    [adpAvailable, snapshot.players]
  );
  const modelPicks = useMemo(
    () => resolveDraftPicksForModel(draft.state.picks, modelPlayers, adpAvailable),
    [adpAvailable, draft.state.picks, modelPlayers]
  );
  const modelUserPicks = useMemo(
    () => modelPicks.filter((pick) => pick.teamNumber === draft.state.userSlot),
    [draft.state.userSlot, modelPicks]
  );
  const modelWeek17Opponents = useMemo(
    () => (scheduleAvailable ? snapshot.week17Opponents : {}),
    [scheduleAvailable, snapshot.week17Opponents]
  );
  const rankedAvailablePlayers = useMemo(
    () => sortBestBallRankings(modelPlayers, preset).filter((player) => !draftedIds.has(player.id)),
    [draftedIds, modelPlayers, preset]
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
  // Undo is last-in-first-out. Naming the pick it will remove keeps the button
  // honest about that instead of leaving the visitor to guess.
  const lastPick = draft.state.picks[draft.state.picks.length - 1] ?? null;
  const upcomingUserRound = useMemo(
    () =>
      Math.floor(((nextUserPick ?? draft.currentPick) - 1) / preset.teams) + 1,
    [draft.currentPick, nextUserPick, preset.teams]
  );
  const analysis = useMemo(
    () =>
      analyzeBestBallRoster(
        modelUserPicks,
        modelWeek17Opponents,
        preset.id,
        upcomingUserRound
      ),
    [modelUserPicks, modelWeek17Opponents, preset.id, upcomingUserRound]
  );
  const draftValueReports = useMemo(
    () =>
      modelSourceIssue === null
        ? calculateBestBallDraftValues({
            picks: modelPicks,
            contestId: preset.id,
            week17Opponents: modelWeek17Opponents,
          })
        : [],
    [modelPicks, modelSourceIssue, modelWeek17Opponents, preset.id]
  );
  const userDraftValue =
    draftValueReports.find((report) => report.teamNumber === draft.state.userSlot) ?? null;
  const recommendations = useMemo(
    () =>
      draft.isComplete || !recommendationsAvailable
        ? []
        : recommendBestBallPlayers({
            players: modelPlayers,
            picks: modelPicks,
            userTeamNumber: draft.state.userSlot,
            currentPickNumber: nextUserPick ?? draft.currentPick,
            contestId: preset.id,
            week17Opponents: modelWeek17Opponents,
            limit: 3,
          }),
    [
      draft.currentPick,
      draft.isComplete,
      draft.state.userSlot,
      modelPicks,
      nextUserPick,
      preset.id,
      modelPlayers,
      modelWeek17Opponents,
      recommendationsAvailable,
    ]
  );

  // `restoredWithPicks` keeps a reloaded room open after the user undoes back
  // to zero picks, instead of dropping them onto the slot picker.
  const showSetup =
    draft.state.picks.length === 0 && !roomStarted && !draft.restoredWithPicks;

  // Tells the page shell whether a room is open so it can collapse the pitch
  // header, mirroring the redraft tracker's setup-versus-running split.
  const roomOpen = draft.isLoaded && !showSetup;
  useEffect(() => {
    onRoomOpenChange?.(roomOpen);
    return () => onRoomOpenChange?.(false);
  }, [onRoomOpenChange, roomOpen]);

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
            <legend className="text-sm font-semibold">
              Your slot in the {preset.teams} team snake
            </legend>
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

      {/*
        The live line sticks directly under the site header on the shared
        FASCIA_TOP_CLASS offset, the same contract as the redraft tracker and
        the mock draft, so "whose pick is it" never leaves the screen while the
        board scrolls. It is the single authority for round, pick, who is on
        the clock, and the next user pick; nothing below repeats those numbers.
        It also carries the live region, so logging a pick announces the new
        room state once.
      */}
      <div
        aria-live="polite"
        className={`sticky ${FASCIA_TOP_CLASS} z-30 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[var(--radius-md)] border px-3 py-2`}
        style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}
      >
        <p className="min-w-0 text-sm" style={{ color: "var(--home-ink-muted)" }}>
          {draft.isComplete ? (
            "Draft complete"
          ) : (
            <>
              Round {draft.currentRound} of {preset.rounds} ·{" "}
              <span className="font-semibold tabular-nums" style={{ color: "var(--home-ink)" }}>
                Pick {Math.min(draft.currentPick, draft.totalPicks)} of {draft.totalPicks}
              </span>{" "}
              · {draft.isUserPick ? "your pick" : `slot ${draft.currentTeamNumber} on the clock`}
            </>
          )}
        </p>
        <p className="text-xs tabular-nums" style={{ color: "var(--home-ink-muted)" }}>
          Your next pick: {nextUserPick ?? "complete"}
        </p>
      </div>

      {/*
        This card used to restate round, current pick, and next user pick in
        three tiles, which repeated the sticky bar directly above it. The
        heading names the state in words once and the card now carries the
        room's recovery action instead.
      */}
      <section className="home-card p-5 sm:p-6" aria-labelledby="best-ball-room-status-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="home-kicker mb-1">Live room</p>
            {/* An open room collapses the h1 to 34px, which is exactly where text-2xl
                tops out, so a text-2xl section heading renders at its parent's size.
                text-xl is the step this file already uses for "Saved in this browser". */}
            <h2 id="best-ball-room-status-heading" className="text-xl font-semibold">
              {draft.isComplete
                ? "Draft complete"
                : draft.isUserPick
                  ? `You are on the clock at pick ${draft.currentPick}`
                  : `Slot ${draft.currentTeamNumber} is on the clock`}
            </h2>
            {lastPick ? (
              <p
                id="best-ball-undo-target"
                className="mt-2 max-w-[52ch] text-xs leading-5"
                style={{ color: "var(--home-ink-muted)" }}
              >
                Undo removes pick {lastPick.pickNumber}, {lastPick.player.name}. It only ever
                takes back the most recent pick, so reaching an earlier one means undoing
                everything logged after it.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={draft.undoLastPick}
            disabled={draft.state.picks.length === 0}
            aria-describedby={lastPick ? "best-ball-undo-target" : undefined}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            style={OUTLINE_ACTION_STYLE}
          >
            <Undo2 className="h-4 w-4" aria-hidden="true" />
            Undo last pick
          </button>
        </div>
      </section>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,23rem)]">
        <div className="grid min-w-0 gap-5">
          <BestBallRecommendations
            recommendations={recommendations}
            isUserPick={draft.isUserPick}
            adpAvailable={adpAvailable}
            recommendationMode={preset.recommendationMode}
            recommendationReason={preset.recommendationReason}
            sourceIssue={recommendationSourceIssue}
            onDraftPlayer={draft.draftPlayer}
          />
          <BestBallDraftBoard
            players={rankedAvailablePlayers}
            currentPick={draft.currentPick}
            currentTeamNumber={draft.currentTeamNumber}
            isComplete={draft.isComplete}
            adpAvailable={adpAvailable}
            onDraftPlayer={draft.draftPlayer}
          />
        </div>

        {/* Bounded so the rail cannot outgrow the space a sticky element gets and strand
            its last card below the fold. */}
        <aside
          aria-label="Roster build"
          className="hidden self-start lg:sticky lg:top-24 lg:grid lg:max-h-[calc(100vh-7rem)] lg:gap-5 lg:overflow-y-auto lg:overscroll-contain"
        >
          <section className="home-card p-5" aria-labelledby="best-ball-desktop-build-heading">
            <BestBallBuildPanel
              analysis={analysis}
              preset={preset}
              userPicks={draft.userPicks}
              currentPick={draft.currentPick}
              nextUserPick={nextUserPick}
              totalPicks={draft.totalPicks}
              draftValue={userDraftValue}
              week17Available={scheduleAvailable}
              draftValueUnavailableReason={
                modelSourceIssue
                  ? `Draft Outlook is paused because ${modelSourceIssue}. It will return after the published sources refresh.`
                  : null
              }
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

      {/*
        Undo shares the phone's fixed bottom bar with the build trigger, the
        same thumb-reach contract as the redraft tracker's action bar. Its
        accessible name is "Undo", distinct from the card and sheet buttons,
        so none of the three shadows the others.
      */}
      <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[70] flex w-[min(calc(100%_-_2rem),26rem)] -translate-x-1/2 gap-2 lg:hidden">
        <button
          type="button"
          onClick={draft.undoLastPick}
          disabled={draft.state.picks.length === 0}
          className="inline-flex min-h-[52px] shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold shadow-[var(--shadow-xl)] disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            borderColor: "var(--home-rule)",
            background: "var(--home-paper)",
            color: "var(--home-ink)",
          }}
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
          Undo
        </button>
        <button
          ref={buildTriggerRef}
          type="button"
          onClick={() => setBuildOpen(true)}
          aria-expanded={buildOpen}
          aria-controls="best-ball-build-sheet"
          className="inline-flex min-h-[52px] min-w-0 flex-1 items-center justify-between rounded-full border px-5 text-sm font-semibold shadow-[var(--shadow-xl)]"
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
      </div>

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
          week17Available={scheduleAvailable}
          draftValueUnavailableReason={
            modelSourceIssue
              ? `Draft Outlook is paused because ${modelSourceIssue}. It will return after the published sources refresh.`
              : null
          }
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
