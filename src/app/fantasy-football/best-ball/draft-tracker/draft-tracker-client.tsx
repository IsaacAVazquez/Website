"use client";

import { useIsClient } from "@/hooks/useIsClient";
import "@/components/fantasy/fantasy-bbroom.css";
import { SeasonalScopeNote } from "@/components/fantasy/SeasonalScopeNote";
import { FreshnessParts } from "@/components/fantasy/FantasyRouteHeader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Redo2, RotateCcw, Undo2 } from "lucide-react";
import { DraftValuePanel, type ExpectedReturnFormState } from "@/components/fantasy/DraftValuePanel";
import { DeferredPlayerDetailDrawer } from "@/components/fantasy/DeferredPlayerDetailDrawer";
import {
  DraftLastPicks,
  DraftPickGrid,
  DraftScorebug,
  DraftScorebugCell,
} from "@/components/fantasy/DraftRoomParts";
import { scrollChildIntoViewX } from "@/components/fantasy/scrollChildIntoViewX";
import { useBestBallSnapshot } from "@/hooks/useBestBallSnapshot";
import {
  BEST_BALL_CONTESTS,
  analyzeBestBallRoster,
  getContestPreset,
  getBestBallModelSourceIssue,
  isBestBallBoardFrozen,
  getNextUserPick,
  hasSupportedBestBallAdp,
  normalizeContestId,
  recommendBestBallPlayers,
  sortBestBallRankings,
  type BestBallContestId,
  type BestBallContestPreset,
  type RankedBestBallPlayer,
} from "@/lib/bestBall";
import type { BestBallSnapshot } from "@/lib/bestBallSnapshot";
import type { Player } from "@/types";
import {
  getFantasySourceCapabilities,
  resolveDraftPicksForModel,
  withoutPlayerAdp,
  getNflRegularSeasonWeek,
  SHELL_CLASS,
} from "@/lib/fantasyUtils";
import { calculateBestBallDraftValues } from "@/lib/fantasyTeamValue";
import { BestBallBuildPanel } from "./best-ball-build-panel";
import { BestBallBuildSheet } from "./best-ball-build-sheet";
import { BestBallDraftBoard } from "./best-ball-draft-board";
import { BestBallRecommendations } from "./best-ball-recommendations";
import {
  BEST_BALL_ROOM_RULES_SCHEMA_VERSION,
  getBestBallTeamForPick,
  type BestBallRoomRules,
} from "./best-ball-draft-state";
import { useBestBallDraft } from "./use-best-ball-draft";

const CONTESTS = Object.values(BEST_BALL_CONTESTS);
// Presets whose lobby cards vary enough that the bespoke rulesNote has to print as a warning.
// 6-Man belongs here because six-team rooms run several tournament structures.
const VARIABLE_ROOM_CONTESTS = new Set<BestBallContestId>([
  "weekly-winners",
  "sit-and-go",
  "six-man",
  "superflex",
]);

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

/** A sentence that ends on a name does not double the full stop after "Jr." or "Sr.". */
function endOnName(name: string): string {
  return name.endsWith(".") ? name : `${name}.`;
}

export function BestBallDraftTrackerClient({
  initialContest,
}: {
  initialContest?: string;
}) {
  // CI webkit reloads the room slowly enough that a click can land before
  // hydration, so the shell says when it is interactive.
  const isHydrated = useIsClient();
  const router = useRouter();
  const [contestId, setContestId] = useState<BestBallContestId>(() =>
    normalizeContestId(initialContest)
  );
  // Same split the redraft tracker made on 2026-08-07: setup keeps the
  // headline and the pitch, because that visitor is still deciding whether to
  // use the tool, and an open room gets one compact line so the live state leads.
  const [roomOpen, setRoomOpen] = useState(false);
  const { snapshot, isLoading, error, retry } = useBestBallSnapshot();
  const preset = getContestPreset(contestId);
  const sourceIssue = snapshot ? getBestBallModelSourceIssue(snapshot, preset) : null;
  // In season the gate still pauses the model, but the board is frozen on
  // purpose (the market closed at kickoff), so the alert says that and does
  // not describe a refresh that is not coming.
  const boardFrozen = snapshot ? isBestBallBoardFrozen(snapshot, preset) : false;

  function changeContest(nextContest: BestBallContestId) {
    setContestId(nextContest);
    router.replace(
      `/fantasy-football/best-ball/draft-tracker?contest=${encodeURIComponent(nextContest)}`,
      { scroll: false }
    );
  }

  // The switch scrolls sideways on a phone, so the pressed contest is brought
  // into view when the page loads on a later one and whenever it changes.
  const contestsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const group = contestsRef.current;
    const pressed = group?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (group && pressed) scrollChildIntoViewX(group, pressed);
  }, [contestId]);

  // Every board in this room is a draft board. Once the season starts it stops
  // describing a live market, so the page says which season it covers.
  const seasonalWeek = getNflRegularSeasonWeek(snapshot?.season ?? 0);
  const rankingsDate = formatSnapshotDate(
    contestId === "superflex" ? snapshot?.superflexSource?.asOf : snapshot?.rankingSource.asOf
  );

  return (
    <section
      className="relative overflow-x-clip min-h-dvh"
      aria-label="Best ball draft assistant"
      data-testid="best-ball-draft-tracker-shell"
      data-hydrated={isHydrated ? "true" : "false"}
    >
      <div className={SHELL_CLASS}>
        {/* Setup keeps a headline and the pitch. An open room gets one compact line. */}
        <header className={roomOpen ? "ffb-head ffb-head-run" : "ffb-head ffb-head-setup"}>
          <h1 className="ffb-title">Best Ball Draft Tracker</h1>
          {roomOpen ? (
            <p className="ffb-lede">
              <span>{preset.name}</span> <span aria-hidden="true">·</span>{" "}
              <span>
                {preset.teams} teams · {preset.rounds} rounds · Half PPR
              </span>
            </p>
          ) : (
            // The news-feed limit stays in view because it applies to every
            // pick, and the longer account of what the room does opens on request.
            <p className="ffb-lede">
              I built this for manual rooms on Underdog and similar platforms. Pick a contest and your slot below to open a room. There is no live injury or player-news feed, so check the draft room and current team reports before logging each pick.
            </p>
          )}
          <FreshnessParts
            parts={
              roomOpen
                ? [
                    { label: `Rankings updated ${rankingsDate}` },
                    { label: "No live injury or news feed, so check the draft room before each pick." },
                  ]
                : [
                    { label: "Half PPR · best ball scoring" },
                    { label: `Rankings updated ${rankingsDate}` },
                  ]
            }
          />
          {roomOpen ? null : (
            <div className="ffb-head-row">
              <details className="ffb-details ffb-br-about">
                <summary>What the room does</summary>
                <div className="ffb-details-body ffb-copy">
                  <p>
                    It follows every pick, keeps the snake order straight, adjusts roster guidance by contest, and compares your build against the room. Exact player cards appear only for presets with a matching room-price source. Expected return stays in a separate calculator because the Draft Outlook cannot promise an outcome.
                  </p>
                  <p>
                    Weekly Winners, Sit &amp; Go, 6-Man, and Superflex contest cards can use settings other than the room shape pinned below, so check the lobby before you start.
                  </p>
                </div>
              </details>
            </div>
          )}
          <div className="ffb-head-row">
            <div
              ref={contestsRef}
              role="group"
              aria-label="Best ball contest"
              className="ffb-seg ffb-br-contests"
            >
              {CONTESTS.map((contest) => (
                <button
                  key={contest.id}
                  type="button"
                  onClick={() => changeContest(contest.id)}
                  aria-pressed={contest.id === contestId}
                  className="ffb-seg-btn"
                >
                  {contest.shortName}
                </button>
              ))}
            </div>
          </div>
        </header>

        {seasonalWeek >= 1 || sourceIssue || error ? (
          <div className="ffb-br-notices">
            {seasonalWeek >= 1 ? (
              <SeasonalScopeNote season={snapshot?.season ?? 0} week={seasonalWeek}>
                Best ball drafts are a preseason event and this board is the preseason board, so nothing here refreshes against the games being played now. Your saved rooms are untouched. In-season ranks are on the <Link href="/fantasy-football/weekly">weekly board</Link>.
              </SeasonalScopeNote>
            ) : null}

            {/* The pause, stated once for the page. The recommendations and
                Draft Outlook each say only what that part cannot do because of it. */}
            {sourceIssue ? (
              <div role="alert" className="ffb-notice ffb-notice-warn">
                <p>
                  {boardFrozen ? (
                    <>
                      Draft Outlook is paused because {sourceIssue}.
                      {preset.recommendationMode === "exact"
                        ? " Exact player cards are paused too, because both need a current consensus."
                        : " It needs a current consensus."}
                      {" "}The board stays as a frozen reference for next summer, and the roster targets and manual pick log remain available.
                    </>
                  ) : (
                    <>
                      Draft Outlook is paused because {sourceIssue}.
                      {preset.recommendationMode === "exact" ? " Exact player cards are paused too." : ""}
                      {" "}The dated board, roster targets, and manual pick log remain available.
                    </>
                  )}
                </p>
              </div>
            ) : null}

            {error ? (
              <div role="alert" className="ffb-notice ffb-notice-bad">
                <p className="ffb-notice-title">{error}</p>
                <div className="ffb-notice-actions">
                  <button type="button" onClick={retry} className="ffb-btn">
                    Try loading again
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {isLoading && !snapshot ? (
          <p role="status" className="ffb-copy">
            Loading best ball rankings and room rules.
          </p>
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
  const [resetArmed, setResetArmed] = useState(false);
  const [buildOpen, setBuildOpen] = useState(false);
  const [detailPlayer, setDetailPlayer] = useState<RankedBestBallPlayer | null>(null);
  const [returnAssumptions, setReturnAssumptions] = useState<ExpectedReturnFormState>(() => ({
    entryCost: preset.economics ? String(preset.economics.entryFee) : "",
    payoutProbability: "",
    averagePayout: "",
  }));
  const buildTriggerRef = useRef<HTMLButtonElement>(null);
  const closeBuild = useCallback(() => setBuildOpen(false), []);
  const reduceMotion = useReducedMotion();

  // Opening the room, logging a pick from a fit or the drawer, undoing back to
  // a sticker, and an Undo or Redo that uses itself up all take away the
  // control that was pressed, so focus would fall to the document. The status
  // heading in the scorebug takes it, which is the mock draft's contract too.
  // "open" also scrolls the room's top to the top of the screen, because the
  // Open button sits low on the setup screen. "pick" always moves the focus,
  // and "if-lost" moves it only when nothing else holds it. A pick logged from
  // a board row is placed by the board itself, on the row that took its place.
  const statusHeadingRef = useRef<HTMLHeadingElement>(null);
  const roomTopRef = useRef<HTMLDivElement>(null);
  const pendingFocusRef = useRef<"open" | "pick" | "if-lost" | null>(null);
  // Reset swaps the room for the setup screen, so the setup heading takes the
  // focus, and Keep room hands it back to the Reset button it replaced.
  const setupHeadingRef = useRef<HTMLHeadingElement>(null);
  const pendingSetupFocusRef = useRef(false);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const pendingResetFocusRef = useRef(false);
  // The rail, which the skip link before the board moves focus to.
  const railRef = useRef<HTMLElement>(null);

  // The board's bar and the rail pin underneath the scorebug, and the scorebug
  // takes a second row once the column is narrow, so it is measured and not
  // assumed. Both read the result as --ffb-sticky-top.
  const bugRef = useRef<HTMLElement>(null);
  const [bugHeight, setBugHeight] = useState(0);

  const { startDraft, draftPlayer, undoLastPick, redoLastPick, undoToPick } = draft;
  const openRoom = useCallback(() => {
    pendingFocusRef.current = "open";
    // Collapsing the page head and opening the room in the same click commit
    // keeps the two in one layout, so the scroll target measured in the effect
    // below is the final one. Left to the roomOpen effect, the head collapsed
    // a render later and pulled the room past the target.
    onRoomOpenChange?.(true);
    startDraft();
  }, [onRoomOpenChange, startDraft]);

  const logPickFromCard = useCallback(
    (player: Player) => {
      pendingFocusRef.current = "pick";
      draftPlayer(player);
    },
    [draftPlayer]
  );

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
  // The alert above the room already carries the full frozen-board clause
  // once, so the rail (and the build sheet, which opens from the same room)
  // prints the short form and no refresh promise. Before Week 1 the pause is a
  // missed refresh and the sentence says so.
  const draftValueUnavailableReason =
    modelSourceIssue === null
      ? null
      : isBestBallBoardFrozen(snapshot, preset)
        ? "Paused on the frozen board. Nothing here refreshes this season."
        : `Draft Outlook is paused because ${modelSourceIssue}. It will return after the published sources refresh.`;
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
  const rankedPlayers = useMemo(
    () => sortBestBallRankings(modelPlayers, preset),
    [modelPlayers, preset]
  );
  const rankedAvailablePlayers = useMemo(
    () => rankedPlayers.filter((player) => !draftedIds.has(player.id)),
    [draftedIds, rankedPlayers]
  );
  // A sticker and a pick-grid cell print the position rank beside the
  // position. On a row the ranking layer has withheld, that rank comes from the
  // consensus the board just declared unusable, so those picks go to the shared
  // parts without it.
  const displayPicks = useMemo(() => {
    const withheld = new Set(
      rankedPlayers.filter((player) => player.consensusWithheld).map((player) => player.id)
    );
    if (withheld.size === 0) return draft.state.picks;
    return draft.state.picks.map((pick) =>
      withheld.has(pick.player.id)
        ? { ...pick, player: { ...pick.player, positionRank: undefined } }
        : pick
    );
  }, [draft.state.picks, rankedPlayers]);
  const lastPicks = useMemo(() => displayPicks.slice(-8).reverse(), [displayPicks]);
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
  // honest about that and does not leave the visitor to guess.
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

  // The drawer prints tier, position rank, and a reach or value reading from
  // the published consensus. On a row the ranking layer has withheld, those
  // three come from the same rank the board just declared unusable, so the
  // drawer gets the player without them, and it prints "Withheld" where they
  // were. The expert range and the sourced average stay because they are the
  // fields the rank contradicts.
  const drawerPlayer = useMemo(() => {
    if (!detailPlayer?.consensusWithheld) return detailPlayer;
    const { tier: _tier, positionRank: _positionRank, ...rest } = detailPlayer;
    return rest;
  }, [detailPlayer]);

  // `startedAt` is persisted with the room, so an open room stays open across
  // reloads even after every pick has been rewound. Reset clears it.
  const showSetup = !draft.isRoomOpen;

  // Tells the page shell whether a room is open so it can collapse the pitch
  // head, mirroring the redraft tracker's setup-versus-running split.
  const roomOpen = draft.isLoaded && !showSetup;
  useEffect(() => {
    onRoomOpenChange?.(roomOpen);
    return () => onRoomOpenChange?.(false);
  }, [onRoomOpenChange, roomOpen]);

  useEffect(() => {
    const element = bugRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () => setBugHeight(element.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [roomOpen]);

  useEffect(() => {
    const pending = pendingFocusRef.current;
    const heading = statusHeadingRef.current;
    if (!pending || !roomOpen || !heading) return;
    pendingFocusRef.current = null;
    if (pending === "open") {
      // The scorebug is pinned, so its own box says nothing about where the
      // room starts once the page is scrolled past it. The marker before it does.
      const marker = roomTopRef.current ?? heading;
      const top = marker.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "instant" : "smooth" });
    }
    if (pending === "if-lost") {
      const active = document.activeElement;
      // A button that just disabled itself is about to lose the focus too.
      const held =
        active &&
        active !== document.body &&
        active.isConnected &&
        !(active instanceof HTMLButtonElement && active.disabled);
      if (held) return;
    }
    heading.focus({ preventScroll: true });
  }, [draft.currentPick, reduceMotion, roomOpen]);

  useEffect(() => {
    if (!showSetup || !pendingSetupFocusRef.current) return;
    pendingSetupFocusRef.current = false;
    setupHeadingRef.current?.focus();
  }, [showSetup]);

  useEffect(() => {
    if (resetArmed || !pendingResetFocusRef.current) return;
    pendingResetFocusRef.current = false;
    resetButtonRef.current?.focus();
  }, [resetArmed]);

  if (!draft.isLoaded) {
    return (
      <p role="status" className="ffb-copy">
        Checking this browser for a saved {preset.shortName} room.
      </p>
    );
  }

  // When the browser is blocking local saves, nothing on the page says "saved".
  const storageNotice = draft.persistenceError ?? draft.restoreNotice;
  const savedHere = !draft.persistenceError;

  if (showSetup) {
    return (
      <div className="ffb-br-setup">
        {storageNotice ? (
          <div role="status" className="ffb-notice ffb-notice-warn">
            <p>{storageNotice}</p>
          </div>
        ) : null}

        <section className="ffb-br-slot" aria-labelledby="best-ball-room-setup-heading">
          <div className="ffb-sechead ffb-sechead-lg">
            <h2
              id="best-ball-room-setup-heading"
              ref={setupHeadingRef}
              tabIndex={-1}
              className="ffb-h2"
            >
              Choose your draft slot
            </h2>
          </div>

          {VARIABLE_ROOM_CONTESTS.has(preset.id) ? (
            <div role="note" className="ffb-notice ffb-notice-warn">
              <p>{preset.rulesNote}</p>
            </div>
          ) : null}

          <fieldset className="ffb-choices ffb-br-slots">
            <legend className="ffb-label">Your slot in the snake</legend>
            {Array.from({ length: preset.teams }, (_, index) => index + 1).map((slot) => (
              <label key={slot} className="ffb-choice ffb-choice-mine">
                <input
                  type="radio"
                  name="best-ball-user-slot"
                  value={slot}
                  checked={draft.state.userSlot === slot}
                  onChange={() => draft.setUserSlot(slot)}
                />
                {slot}
              </label>
            ))}
          </fieldset>

          <button
            type="button"
            onClick={openRoom}
            className="ffb-btn ffb-btn-primary ffb-btn-lg ffb-br-open"
          >
            Open draft room from slot {draft.state.userSlot}
          </button>

          {savedHere ? (
            <p className="ffb-fine">
              This room is saved under the {snapshot.season} season and {preset.shortName} contest. Changing formats opens a separate saved room, so one set of picks never overwrites another.
            </p>
          ) : null}
        </section>

        <aside aria-label="Contest details" className="ffb-br-contest">
          <div className="ffb-sechead ffb-sechead-lg">
            <h2 className="ffb-h2">{preset.name}</h2>
          </div>
          <p className="ffb-copy">{preset.description}</p>
          <dl className="ffb-facts ffb-facts-sm">
            <div className="ffb-fact">
              <dt>Room</dt>
              <dd>
                {preset.teams} teams · {preset.rounds} rounds · {preset.rosterSize} players
              </dd>
            </div>
            <div className="ffb-fact">
              <dt>Weekly lineup</dt>
              <dd>{lineupLabel(preset)}</dd>
            </div>
            <div className="ffb-fact">
              <dt>Rules checked</dt>
              <dd>{formatSnapshotDate(preset.rulesAsOf)}</dd>
            </div>
          </dl>
          {/* A variable contest prints its note once, as the warning beside the slot picker. */}
          {VARIABLE_ROOM_CONTESTS.has(preset.id) ? null : (
            <p className="ffb-fine">{preset.rulesNote}</p>
          )}
          <p>
            <a
              href={preset.officialRulesUrl}
              target="_blank"
              rel="noreferrer"
              className="ffb-link ffb-link-out"
            >
              Read the official rules
            </a>
          </p>
        </aside>
      </div>
    );
  }

  const userSlot = draft.state.userSlot;
  const picksUntilTurn = nextUserPick === null ? 0 : nextUserPick - draft.currentPick;
  const followingUserPick = draft.isUserPick
    ? getNextUserPick(draft.currentPick, userSlot, preset.teams, preset.rounds, {
        strictlyAfter: true,
      })
    : null;
  const nextTurn = draft.isUserPick
    ? { value: "Now", note: followingUserPick ? `then #${followingUserPick}` : "last turn" }
    : nextUserPick
      ? {
          value: `#${nextUserPick}`,
          note: `in ${picksUntilTurn} ${picksUntilTurn === 1 ? "pick" : "picks"}`,
        }
      : { value: "None left", note: "" };
  const statusName = draft.isComplete
    ? "Draft complete"
    : draft.isUserPick
      ? `You are on the clock at pick ${draft.currentPick}`
      : `Slot ${draft.currentTeamNumber} is on the clock`;
  const statusShort = draft.isComplete
    ? "Complete"
    : draft.isUserPick
      ? "You"
      : `Slot ${draft.currentTeamNumber}`;
  // The room's one announcement per pick. It changes only when a pick is
  // logged or undone, so the new state is read out once.
  const roomAnnouncement = draft.isComplete
    ? "Draft complete."
    : `Pick ${draft.currentPick} of ${draft.totalPicks}, round ${draft.currentRound}. ${
        draft.isUserPick ? "You are on the clock." : `Slot ${draft.currentTeamNumber} is on the clock.`
      }${lastPick ? ` Last pick: ${endOnName(lastPick.player.name)}` : ""}`;

  // The board is hundreds of rows and each row is two tab stops, so a keyboard
  // gets a way past it. Where the rail is not beside the list, the bar's
  // build button is the way in.
  function skipToBuild() {
    const rail = railRef.current;
    if (rail && getComputedStyle(rail).display !== "none") rail.focus();
    else buildTriggerRef.current?.focus();
  }

  function confirmReset() {
    pendingSetupFocusRef.current = true;
    draft.resetDraft();
    setResetArmed(false);
    setBuildOpen(false);
  }

  // The rail and the build sheet hold the same blocks, under different heading
  // ids. The sheet mounts only while it is open, so each block is in the page once.
  function renderBuild(headingId: string) {
    return (
      <>
        <BestBallBuildPanel
          analysis={analysis}
          preset={preset}
          userPicks={draft.userPicks}
          currentPick={draft.currentPick}
          totalPicks={draft.totalPicks}
          week17Available={scheduleAvailable}
          headingId={headingId}
        />
        <DraftPickGrid
          picks={displayPicks}
          totalTeams={preset.teams}
          userTeam={userSlot}
          rounds={preset.rounds}
          slotForPick={(pickNumber) => getBestBallTeamForPick(pickNumber, preset.teams)}
          currentPick={draft.currentPick}
          currentRound={draft.currentRound}
          isComplete={draft.isComplete}
        />
        <DraftValuePanel
          report={userDraftValue}
          unavailableReason={draftValueUnavailableReason}
          headingId={`${headingId}-draft-outlook`}
          economics={preset.economics}
          economicsContestName={preset.name}
          economicsSourceUrl={preset.economics?.sourceUrl}
          defaultEntryCost={preset.economics?.entryFee}
          calculatorValue={returnAssumptions}
          onCalculatorChange={setReturnAssumptions}
        />
        <section aria-labelledby={`${headingId}-controls`} className="ffb-br-controls ffb-br-noprint">
          <div className="ffb-sechead">
            <h3 id={`${headingId}-controls`} className="ffb-h3">
              {savedHere ? "Saved in this browser" : "Room controls"}
            </h3>
            <p className="ffb-sechead-note">
              {snapshot.season} · {preset.shortName} · slot {userSlot}
            </p>
          </div>
          {resetArmed ? (
            <div className="ffb-confirm">
              <span className="ffb-confirm-q">
                Reset this room and its {draft.state.picks.length}{" "}
                {draft.state.picks.length === 1 ? "pick" : "picks"}?
              </span>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  pendingResetFocusRef.current = true;
                  setResetArmed(false);
                }}
                className="ffb-btn ffb-btn-quiet"
              >
                Keep room
              </button>
              <button type="button" onClick={confirmReset} className="ffb-btn ffb-btn-danger ffb-btn-primary">
                Confirm reset
              </button>
            </div>
          ) : (
            <button
              ref={resetButtonRef}
              type="button"
              onClick={() => setResetArmed(true)}
              className="ffb-btn"
            >
              <RotateCcw size={15} aria-hidden="true" />
              Reset this room
            </button>
          )}
          <Link href={`/fantasy-football/best-ball?contest=${preset.id}`} className="ffb-link ffb-link-arrow">
            Back to best ball rankings
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      {storageNotice ? (
        <div className="ffb-br-notices">
          <div role="status" className="ffb-notice ffb-notice-warn">
            <p>{storageNotice}</p>
          </div>
        </div>
      ) : null}

      <div ref={roomTopRef} />

      {/*
        The scorebug is the single authority for the pick, the round, who is on
        the clock, and the user's next turn, and nothing below repeats those
        numbers. Its hidden status line announces the new room state once per
        pick. A finished draft has nobody on the clock and no next turn, so the
        bar is the one cell that says so.
      */}
      <DraftScorebug
        label="Live draft status"
        sectionRef={bugRef}
        announcement={roomAnnouncement}
        className="ffb-br-bug"
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                pendingFocusRef.current = "if-lost";
                undoLastPick();
              }}
              disabled={draft.state.picks.length === 0}
              aria-label="Undo last pick"
              aria-describedby={lastPick ? "best-ball-undo-target" : undefined}
              title="Undo last pick"
              className="ffb-bug-btn"
            >
              <Undo2 size={15} aria-hidden="true" />
              <span className="ffb-bug-long">Undo last pick</span>
            </button>
            <button
              type="button"
              onClick={() => {
                pendingFocusRef.current = "if-lost";
                redoLastPick();
              }}
              disabled={!draft.canRedo}
              aria-label={
                draft.nextRedoPick
                  ? `Redo pick ${draft.nextRedoPick.pickNumber} (${draft.nextRedoPick.player.name})`
                  : "Redo pick (nothing to redo)"
              }
              title="Redo pick"
              className="ffb-bug-btn"
            >
              <Redo2 size={15} aria-hidden="true" />
              <span className="ffb-bug-long">Redo pick</span>
            </button>
          </>
        }
      >
        {draft.isComplete ? null : (
          <>
            <DraftScorebugCell label="Overall" className="ffb-br-cell-pick">
              Pick {draft.currentPick} <small>of {draft.totalPicks}</small>
            </DraftScorebugCell>
            <DraftScorebugCell label="Round" className="ffb-br-cell-round">
              {draft.currentRound} <small>of {preset.rounds}</small>
            </DraftScorebugCell>
          </>
        )}
        {/* The one cell written by hand, since its value is the status heading
            and the shared cell's value is a paragraph. The heading's name is
            the full sentence, and what shows is its short form, so the bar
            keeps one height and the heading keeps its name and its focus. */}
        <div
          className={draft.isComplete ? "ffb-bug-seg ffb-br-done" : "ffb-bug-seg ffb-bug-live ffb-rm-live"}
        >
          <span className="ffb-bug-label">{draft.isComplete ? "Draft" : "On the clock"}</span>
          <h2
            id="best-ball-room-status-heading"
            ref={statusHeadingRef}
            tabIndex={-1}
            className="ffb-bug-value"
          >
            <span className="ffb-vh">{statusName}</span>
            <span aria-hidden="true">{statusShort}</span>
          </h2>
        </div>
        {draft.isComplete ? null : (
          <DraftScorebugCell
            label={
              <>
                <span className="ffb-only-phone">Next turn</span>
                <span className="ffb-not-phone">Your next turn</span>
              </>
            }
            className="ffb-br-cell-next"
          >
            {nextTurn.value}
            {nextTurn.note ? <> <small>{nextTurn.note}</small></> : null}
          </DraftScorebugCell>
        )}
      </DraftScorebug>

      <DraftLastPicks
        picks={lastPicks}
        userTeam={userSlot}
        onUndoToPick={(pickNumber) => {
          pendingFocusRef.current = "if-lost";
          undoToPick(pickNumber);
        }}
      />
      {lastPick ? (
        <p id="best-ball-undo-target" className="ffb-fine ffb-br-undo-note ffb-br-noprint">
          Undo removes pick {lastPick.pickNumber}, {lastPick.player.name}.{" "}
          {/* A phone keeps the sentence that names the pick. The note beside the last picks says the rest there. */}
          <span className="ffb-not-phone">
            The picks above reach further back. Choosing one takes back that pick and everything
            logged after it, and Redo pick restores the removed picks in order.
          </span>
        </p>
      ) : null}

      {/* The scorebug's measured height is where the board's bar and the rail pin. */}
      <div className="ffb-work" style={{ "--ffb-sticky-top": `${bugHeight}px` } as CSSProperties}>
        <div>
          <BestBallRecommendations
            recommendations={recommendations}
            isUserPick={draft.isUserPick}
            isComplete={draft.isComplete}
            adpAvailable={adpAvailable}
            recommendationMode={preset.recommendationMode}
            recommendationReason={preset.recommendationReason}
            sourceIssue={recommendationSourceIssue}
            onDraftPlayer={logPickFromCard}
            onOpenDetail={(player) => {
              const ranked = rankedAvailablePlayers.find((candidate) => candidate.id === player.id);
              if (ranked) setDetailPlayer(ranked);
            }}
          />
          <a
            href="#best-ball-build"
            onClick={(event) => {
              event.preventDefault();
              skipToBuild();
            }}
            className="ffb-btn ffb-br-skip"
          >
            Skip to your roster
          </a>
          <BestBallDraftBoard
            players={rankedAvailablePlayers}
            currentPick={draft.currentPick}
            isComplete={draft.isComplete}
            adpAvailable={adpAvailable}
            onDraftPlayer={draft.draftPlayer}
            onOpenDetail={setDetailPlayer}
          />
        </div>

        {/* Beside the list from 1200px. Below that the bar and the build sheet carry it. */}
        <aside
          ref={railRef}
          id="best-ball-build"
          tabIndex={-1}
          aria-label="Roster build"
          className="ffb-rail ffb-rail-scroll max-[1199px]:hidden"
        >
          {renderBuild("best-ball-desktop-build-heading")}
        </aside>
      </div>

      {/*
        Undo shares the fixed bottom bar with the build trigger, where a thumb
        reaches it. Its accessible name is "Undo", distinct from the scorebug's
        button, so neither shadows the other. The bar sits under the drawer and
        the sheet, so it needs no step aside while either is open.
      */}
      <div className="ffb-tray-space ffb-br-noprint min-[1200px]:hidden" />
      <div className="ffb-tray min-[1200px]:hidden">
        <div className={`${SHELL_CLASS} ffb-tray-row ffb-br-bar`}>
          <button
            type="button"
            onClick={() => {
              pendingFocusRef.current = "if-lost";
              undoLastPick();
            }}
            disabled={draft.state.picks.length === 0}
            className="ffb-btn ffb-btn-lg"
          >
            <Undo2 size={15} aria-hidden="true" />
            Undo
          </button>
          <button
            ref={buildTriggerRef}
            type="button"
            onClick={() => setBuildOpen(true)}
            aria-expanded={buildOpen}
            aria-controls="best-ball-build-sheet"
            className="ffb-btn ffb-btn-primary ffb-btn-lg ffb-br-bar-build"
          >
            <span>My build</span>{" "}
            <span>
              {draft.userPicks.length} / {preset.rosterSize}
            </span>
          </button>
        </div>
      </div>

      <BestBallBuildSheet open={buildOpen} onClose={closeBuild} returnFocusRef={buildTriggerRef}>
        {renderBuild("best-ball-mobile-build-heading")}
      </BestBallBuildSheet>

      {/*
        Same drawer contract as the best ball board page: a contest-floor
        placeholder hides its synthetic ADP, the room mounts no CompareTray so
        the Compare button stays out, and logging from the drawer records the
        current pick and closes it, mirroring the redraft tracker. While the
        room is withholding its read, the drawer drops its market sentence too.
      */}
      <DeferredPlayerDetailDrawer
        player={drawerPlayer}
        publishedRank={detailPlayer ? String(detailPlayer.bestBallRank) : undefined}
        publishedRankLabel="Board rank"
        adpAvailable={adpAvailable && !detailPlayer?.isUndraftedAtContestFloor}
        valueSignalAvailable={adpAvailable && !detailPlayer?.consensusWithheld}
        verdictAvailable={draftValueUnavailableReason === null}
        consensusWithheld={Boolean(detailPlayer?.consensusWithheld)}
        compareAvailable={false}
        onLogPick={
          !draft.isComplete && detailPlayer && !draftedIds.has(detailPlayer.id)
            ? (player) => {
                logPickFromCard(player);
                setDetailPlayer(null);
              }
            : undefined
        }
        onClose={() => setDetailPlayer(null)}
      />
    </>
  );
}
