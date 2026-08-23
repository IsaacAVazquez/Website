"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { SeasonalScopeNote } from "@/components/fantasy/SeasonalScopeNote";
import Link from "next/link";
import { DraftAnalyticsPanel } from "./components/DraftAnalyticsPanel";
import { DraftBoard } from "./components/DraftBoard";
import { DraftSetup } from "./components/DraftSetup";
import { calculateDraftOrder, useDraftState } from "./hooks/useDraftState";
import { useDraftTimer } from "./hooks/useDraftTimer";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import { usePlayerNotes } from "@/hooks/usePlayerNotes";
import {
  computeDraftAnalytics,
  isPlayerValueAtPick,
  reconcileTeamRosters,
} from "@/lib/draftAnalytics";
import { calculateRedraftDraftValues } from "@/lib/fantasyTeamValue";
import {
  FANTASY_SCORING_LABELS,
  getCrossBoardFantasyPlayers,
  getFantasyWeekLabel,
  scoringFormatToRouteScoring,
} from "@/lib/fantasy";
import {
  FASCIA_TOP_CLASS,
  HEADER_CHIP_CLASS,
  MONO_LABEL_CLASS,
  PILL_BUTTON_CLASS,
  PILL_BUTTON_STYLE,
  POSITION_CHIP_CLASS,
  SHELL_CLASS,
  WARNING_CARD_STYLE,
  assignLineupSlots,
  formatAdp,
  formatRankValue,
  formatUpdatedAt,
  getFantasySourceCapabilities,
  getNflRegularSeasonWeek,
  getPositionTone,
  resolveDraftPicksForModel,
  shortName,
  withoutPlayerAdp,
} from "@/lib/fantasyUtils";
import {
  DraftValuePanel,
  PlayerDetailDrawer,
  type ExpectedReturnFormState,
} from "@/components/fantasy";
import type { Player, RedraftLineupSettings } from "@/types";

const subscribeToHydration = () => () => undefined;
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function publishedDraftRank(player: Player): string {
  return formatRankValue(player.rankEcr ?? player.averageRank);
}

/** "J. Chase" for the tight fascia and tape rows; DST names stay whole. */
function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

interface DecisionRec {
  tag: string;
  player: Player;
  why: string;
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
    currentTeamNumber,
    persistenceError,
  } = useDraftState();

  const notes = usePlayerNotes();

  const scoringKey = scoringFormatToRouteScoring(draftState.settings.scoringFormat);
  const { snapshot, metadata, isLoading, error, retry } = useFantasySnapshot({
    scoring: scoringKey,
    all: true,
  });
  // useFantasySnapshot intentionally keeps its last value until the effect for
  // a new scoring key runs. A restored room can therefore see the previous
  // scoring board for one render. Nothing that can log or model a pick may use
  // that transition value.
  const snapshotMatchesScoring = snapshot?.scoringFormat === draftState.settings.scoringFormat;
  const matchingSnapshot = snapshotMatchesScoring ? snapshot : null;
  const matchingMetadata = snapshotMatchesScoring ? metadata : null;
  const overallSliceMetadata = matchingSnapshot?.sliceMetadata?.overall ?? null;
  const rankingsUnavailable = Boolean(overallSliceMetadata && !overallSliceMetadata.available);
  const rankingsUpdatedAt = overallSliceMetadata?.updatedAt ?? matchingMetadata?.upstreamUpdatedAt;

  // "New room" parks a running draft behind the setup screen without wiping it;
  // starting from that screen is what resets the picks.
  const [roomSetupOpen, setRoomSetupOpen] = useState(false);
  const hasRoom = draftState.picks.length > 0 || draftState.isActive;
  const showSetup = roomSetupOpen || !hasRoom;

  const hasUsableDraftBoard = Boolean(
    !isLoading &&
      !error &&
      matchingSnapshot &&
      overallSliceMetadata?.available === true &&
      matchingSnapshot.overall.length > 0
  );
  const draftSnapshot = hasUsableDraftBoard ? matchingSnapshot : null;
  const draftMetadata = draftSnapshot ? matchingMetadata : null;
  const sourceCapabilities = getFantasySourceCapabilities({
    rankingAsOf: rankingsUpdatedAt,
    marketAsOf: draftMetadata?.adpSource?.asOf,
    season: draftMetadata?.season,
  });
  const rankingsStale = hasUsableDraftBoard && !sourceCapabilities.ranking.usable;
  const draftGuidanceAvailable = hasUsableDraftBoard && sourceCapabilities.ranking.usable;
  const draftOutlookUnavailableReason = rankingsStale
    ? "The ranking source is stale. Draft Outlook will return after the published board refreshes. Your room and manual pick log remain available."
    : null;
  const setupRankingsStatus =
    isLoading || (Boolean(snapshot) && !snapshotMatchesScoring)
      ? "loading"
      : error || !hasUsableDraftBoard
        ? "error"
        : "ready";
  const setupRankingsError =
    error ??
    (setupRankingsStatus === "error"
      ? "The published draft snapshot did not include any players."
      : null);

  const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);
  const [showTeamEditor, setShowTeamEditor] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [returnAssumptions, setReturnAssumptions] = useState<ExpectedReturnFormState>({
    entryCost: "",
    payoutProbability: "",
    averagePayout: "",
  });

  const draftedPlayerIds = useMemo(
    () => new Set(draftState.picks.map((pick) => pick.player.id)),
    [draftState.picks]
  );
  const hasAdpSource = Boolean(draftMetadata?.adpSource);
  const adpAvailable = hasAdpSource && sourceCapabilities.market.current;
  const adpSourceStale = hasAdpSource && !sourceCapabilities.market.usable;
  const adpStatusLabel = sourceCapabilities.market.freshness === "prior-season"
    ? "Prior-season ADP reference only"
    : adpAvailable
      ? "ADP current"
      : adpSourceStale
        ? "ADP stale, consensus only"
        : "ADP unavailable, consensus only";
  const totalPicks = draftState.settings.totalTeams * draftState.settings.rounds;

  const draftBoardPlayers = useMemo(
    () =>
      (draftSnapshot?.overall ?? []).map((player) =>
        adpAvailable ? player : withoutPlayerAdp(player)
      ),
    [adpAvailable, draftSnapshot]
  );
  const currentPlayerUniverse = useMemo(
    () =>
      (draftSnapshot ? getCrossBoardFantasyPlayers(draftSnapshot) : []).map((player) =>
        adpAvailable ? player : withoutPlayerAdp(player)
      ),
    [adpAvailable, draftSnapshot]
  );
  const modelPicks = useMemo(
    () =>
      draftSnapshot
        ? resolveDraftPicksForModel(
            draftState.picks,
            draftBoardPlayers,
            adpAvailable,
            currentPlayerUniverse
          )
        : [],
    [adpAvailable, currentPlayerUniverse, draftBoardPlayers, draftSnapshot, draftState.picks]
  );
  const modelTeams = useMemo(
    () =>
      draftSnapshot
        ? reconcileTeamRosters(draftState.teams, modelPicks)
        : draftState.teams,
    [draftSnapshot, draftState.teams, modelPicks]
  );
  const userTeam = useMemo(
    () => modelTeams.find((team) => team.teamNumber === draftState.settings.userTeam),
    [draftState.settings.userTeam, modelTeams]
  );
  const picksForDisplay = draftSnapshot ? modelPicks : draftState.picks;
  const analytics = useMemo(
    () =>
      draftSnapshot && draftGuidanceAvailable
        ? computeDraftAnalytics(modelPicks, modelTeams, {
            lineup: draftState.settings.lineup,
            rounds: draftState.settings.rounds,
          })
        : null,
    [
      draftGuidanceAvailable,
      draftSnapshot,
      draftState.settings.lineup,
      draftState.settings.rounds,
      modelPicks,
      modelTeams,
    ]
  );
  const draftValueReports = useMemo(
    () =>
      draftSnapshot && draftGuidanceAvailable
        ? calculateRedraftDraftValues(modelPicks, draftState.settings)
        : [],
    [draftGuidanceAvailable, draftSnapshot, draftState.settings, modelPicks]
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
  const availableBoardPlayers = useMemo(
    () => draftBoardPlayers.filter((player) => !draftedPlayerIds.has(player.id)),
    [draftBoardPlayers, draftedPlayerIds]
  );

  const timerEnabled =
    (draftState.settings.timerSeconds ?? 0) > 0 &&
    !showSetup &&
    !isDraftComplete &&
    hasUsableDraftBoard &&
    !isLoading &&
    !error;
  const timer = useDraftTimer({
    currentPick: draftState.currentPick,
    durationSeconds: draftState.settings.timerSeconds ?? 0,
    enabled: timerEnabled,
    isActive: draftState.isActive,
  });
  const clockVisible =
    (draftState.settings.timerSeconds ?? 0) > 0 && !showSetup && hasUsableDraftBoard;
  // The clock is advisory and nothing fires at zero, so it stays quiet by
  // default: muted while other teams pick, and it only earns the signal accent
  // in the final 15 seconds of the user's own pick.
  const clockUrgent = timerEnabled && !timer.isExpired && timer.secondsLeft <= 15 && isUserPick;

  const nextUserPick = useMemo(() => {
    if (isDraftComplete) return 0;
    const { totalTeams, draftType, userTeam: userSlot } = draftState.settings;
    const start = draftState.currentPick + (isUserPick ? 1 : 0);
    for (let pickNumber = start; pickNumber <= totalPicks; pickNumber++) {
      if (calculateDraftOrder(pickNumber, totalTeams, draftType) === userSlot) {
        return pickNumber;
      }
    }
    return 0;
  }, [draftState.currentPick, draftState.settings, isDraftComplete, isUserPick, totalPicks]);

  const lineupAssignment = useMemo(
    () =>
      assignLineupSlots(
        draftState.settings.lineup,
        (userTeam?.picks ?? []).map((pick) => pick.player)
      ),
    [draftState.settings.lineup, userTeam]
  );

  const decisionRecs = useMemo<DecisionRec[]>(() => {
    if (!draftSnapshot || !isUserPick || isDraftComplete || !draftGuidanceAvailable) return [];
    const available = availableBoardPlayers;
    if (available.length === 0) return [];
    const { openExact, flexOpen } = lineupAssignment;
    const lineup = draftState.settings.lineup;
    const currentPick = draftState.currentPick;
    const used = new Set<string>();
    const recs: DecisionRec[] = [];

    const tierLeft = (position: string): string => {
      const pool = available.filter((player) => player.position === position);
      const tiers = pool.map((player) => player.tier).filter(isFiniteNumber);
      if (tiers.length === 0) return "";
      const top = Math.min(...tiers);
      const left = pool.filter((player) => player.tier === top).length;
      return `T${top} has ${left} left`;
    };

    const best = available[0];
    used.add(best.id);
    const bestParts = [`Board #${publishedDraftRank(best)}`];
    if (isFiniteNumber(best.tier)) bestParts.push(`Tier ${best.tier}`);
    if (
      adpAvailable &&
      isFiniteNumber(best.adp) &&
      isPlayerValueAtPick(best, currentPick, draftState.currentRound)
    ) {
      bestParts.push(`lasted +${(currentPick - best.adp).toFixed(1)} past ADP`);
    }
    recs.push({ tag: "Best left", player: best, why: bestParts.join(" · ") });

    const needOrder = ["RB", "WR", "TE", "QB", "K", "DST"].filter(
      (position) => (openExact[position] ?? 0) > 0
    );
    let fillPlayer: Player | undefined;
    let fillSlot = "";
    for (const position of needOrder) {
      const candidate = available.find(
        (player) => player.position === position && !used.has(player.id)
      );
      if (candidate) {
        fillPlayer = candidate;
        fillSlot = `${position}${
          (lineup[position as keyof RedraftLineupSettings] || 0) - (openExact[position] ?? 0) + 1
        }`;
        break;
      }
    }
    if (!fillPlayer && flexOpen) {
      fillPlayer = available.find(
        (player) => ["RB", "WR", "TE"].includes(player.position) && !used.has(player.id)
      );
      fillSlot = "FLX";
    }
    if (fillPlayer) {
      used.add(fillPlayer.id);
      const fillParts = [`${fillPlayer.position} board`];
      if (isFiniteNumber(fillPlayer.tier)) fillParts.push(`Tier ${fillPlayer.tier}`);
      const left = tierLeft(fillPlayer.position);
      if (left) fillParts.push(left);
      recs.push({ tag: `Fills ${fillSlot}`, player: fillPlayer, why: fillParts.join(" · ") });
    }

    if (adpAvailable) {
      let valuePlayer: Player | null = null;
      let valueDelta = 0;
      for (const player of available.slice(0, 40)) {
        if (used.has(player.id) || !isFiniteNumber(player.adp)) continue;
        const delta = currentPick - player.adp;
        if (
          delta > valueDelta &&
          isPlayerValueAtPick(player, currentPick, draftState.currentRound)
        ) {
          valueDelta = delta;
          valuePlayer = player;
        }
      }
      if (valuePlayer) {
        recs.push({
          tag: "Value",
          player: valuePlayer,
          why: `ADP ${formatAdp(valuePlayer.adp)} · lasted +${valueDelta.toFixed(1)} past the market`,
        });
      }
    }

    return recs;
  }, [
    adpAvailable,
    availableBoardPlayers,
    draftGuidanceAvailable,
    draftSnapshot,
    draftState.currentPick,
    draftState.currentRound,
    draftState.settings.lineup,
    isDraftComplete,
    isUserPick,
    lineupAssignment,
  ]);

  const scarcity = useMemo(() => {
    if (!draftSnapshot) return [];
    return (["QB", "RB", "WR", "TE"] as const).map((position) => {
      const pool = availableBoardPlayers.filter((player) => player.position === position);
      const tiers = pool.map((player) => player.tier).filter(isFiniteNumber);
      const topTier = tiers.length > 0 ? Math.min(...tiers) : null;
      const left = topTier !== null ? pool.filter((player) => player.tier === topTier).length : pool.length;
      const cliff = pool.length > 0 && topTier !== null && left <= 2;
      const need = (lineupAssignment.openExact[position] ?? 0) > 0;
      const flag = need && cliff ? "Need · cliff" : cliff ? "Cliff" : need ? "Need" : "";
      return {
        position,
        text:
          pool.length === 0
            ? "board empty"
            : topTier !== null
              ? `T${topTier} · ${left} left`
              : `${pool.length} left`,
        flag,
        flagColor: cliff ? "var(--home-warning)" : "var(--home-positive)",
        background: need
          ? "color-mix(in srgb, var(--home-positive) 6%, var(--home-paper))"
          : "var(--home-paper)",
        tip: cliff
          ? `The current ${position} tier is nearly empty, so its value drops once it clears`
          : need
            ? `Your lineup still has an open ${position} starting spot`
            : `${position} tiers are holding`,
      };
    });
  }, [availableBoardPlayers, draftSnapshot, lineupAssignment.openExact]);

  const previousPick = picksForDisplay[picksForDisplay.length - 1] ?? null;
  const tapePicks = useMemo(() => picksForDisplay.slice(-8).reverse(), [picksForDisplay]);

  const kicker = showSetup
    ? "Draft assistant · Setup"
    : isDraftComplete
      ? "Draft assistant · Complete"
      : `Draft assistant · Live · Pick #${draftState.currentPick}`;

  const headerChips: { label: string; tone?: CSSProperties }[] = [
    { label: draftState.settings.leagueName?.trim() || "Draft room" },
    { label: `${draftState.settings.totalTeams}-team ${draftState.settings.draftType}` },
    { label: `${FANTASY_SCORING_LABELS[scoringKey]} scoring` },
    {
      label: matchingMetadata
        ? `${matchingMetadata.season} ${getFantasyWeekLabel(matchingMetadata.week)}`
        : "Loading snapshot",
    },
    { label: `Source updated ${formatUpdatedAt(rankingsUpdatedAt)}` },
    {
      label: adpStatusLabel,
      tone:
        adpSourceStale || sourceCapabilities.market.freshness === "prior-season"
          ? {
              background: "color-mix(in srgb, var(--home-warning) 18%, var(--home-paper))",
              borderColor: "color-mix(in srgb, var(--home-warning) 32%, var(--home-rule))",
              color: "var(--home-ink)",
            }
          : undefined,
    },
  ];

  function handleNewRoom() {
    setRoomSetupOpen(true);
  }

  function handleStartFromSetup() {
    // Starting over an existing room is the destructive step; "New room" only
    // parked it, and "Back to room" was the escape hatch on the setup screen.
    if (draftState.picks.length > 0) {
      resetDraft();
    }
    startDraft();
    setRoomSetupOpen(false);
  }

  function handleExport(format: "csv" | "recap-csv" | "json") {
    exportDraftResults(format, { notes: notes.notes, picks: picksForDisplay });
    const label =
      format === "recap-csv" ? "team recap CSV" : format === "json" ? "JSON" : "picks CSV";
    setExportToast(`Exported ${label}.`);
    window.setTimeout(() => setExportToast(null), 3500);
  }

  const onClockLabel = (() => {
    if (isDraftComplete) return "—";
    if (isUserPick) return "You";
    const name = getTeamName(currentTeamNumber);
    return name === `Team ${currentTeamNumber}` ? `Slot ${currentTeamNumber}` : name;
  })();

  interface FasciaCell {
    key: string;
    label: string;
    value: string;
    sub: string;
    valueColor?: string;
    background?: string;
    timer?: boolean;
  }

  const fasciaCells: FasciaCell[] = [
    {
      key: "pick",
      label: "Pick",
      value: isDraftComplete ? "Done" : `#${draftState.currentPick} / ${totalPicks}`,
      sub: `Round ${draftState.currentRound} of ${draftState.settings.rounds}`,
    },
    {
      key: "clock-team",
      label: "On the clock",
      value: onClockLabel,
      sub: previousPick
        ? `Prev · ${shortName(previousPick.player)} #${picksForDisplay.length}`
        : "First overall pick",
      /* Signal on a signal wash measures 4.09:1 in light mode. Mixing the text 72%
         toward ink is the same repair the mock draft fascia already carries. */
      valueColor: isUserPick
        ? "color-mix(in srgb, var(--home-signal) 72%, var(--home-ink))"
        : undefined,
      background: isUserPick
        ? "color-mix(in srgb, var(--home-signal) 8%, var(--home-paper))"
        : undefined,
    },
    ...(clockVisible
      ? [
          {
            key: "clock",
            label: "Clock",
            value: isDraftComplete ? "—" : formatClock(Math.max(0, timer.secondsLeft)),
            sub: `advisory · ${draftState.settings.timerSeconds}s per pick`,
            valueColor: clockUrgent
              ? "color-mix(in srgb, var(--home-signal) 72%, var(--home-ink))"
              : isUserPick
                ? "var(--home-ink)"
                : "var(--home-ink-muted)",
            background: clockUrgent
              ? "color-mix(in srgb, var(--home-signal) 10%, var(--home-paper))"
              : undefined,
            timer: !isDraftComplete,
          } satisfies FasciaCell,
        ]
      : []),
    {
      key: "next-turn",
      label: "Your next turn",
      value: isDraftComplete
        ? "—"
        : isUserPick
          ? "Now"
          : nextUserPick
            ? `#${nextUserPick}`
            : "None left",
      sub: isUserPick
        ? nextUserPick
          ? `then #${nextUserPick}`
          : "last turn"
        : nextUserPick
          ? `in ${nextUserPick - draftState.currentPick} picks · slot ${draftState.settings.userTeam}`
          : `slot ${draftState.settings.userTeam}`,
      valueColor: isUserPick ? "var(--home-signal)" : undefined,
    },
    {
      key: "pool",
      label: "Pool",
      value: draftSnapshot ? `${availableBoardPlayers.length} left` : "—",
      sub: draftSnapshot ? `of ${draftBoardPlayers.length} ranked` : "board loading",
    },
  ];

  // The board's own controls stick underneath the live fascia rather than under
  // the page header, and the fascia wraps to two rows once the shell is narrow,
  // so measure it instead of assuming a height.
  const fasciaRef = useRef<HTMLElement | null>(null);
  const [fasciaHeight, setFasciaHeight] = useState(0);
  const boardStickyTop = `calc(4.5rem + ${fasciaHeight}px)`;

  useEffect(() => {
    const element = fasciaRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () => setFasciaHeight(element.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [showSetup, rankingsUnavailable]);

  // Every board in this room is a draft board. Once the season starts it stops
  // describing a live market, so say which season it covers rather than letting it
  // look like a surface that quietly stopped working.
  const seasonalWeek = getNflRegularSeasonWeek(draftMetadata?.season ?? 0);

  return (
    <section
      className="home-page home-dash min-h-screen"
      aria-label="Fantasy football draft assistant"
      data-testid="fantasy-draft-tracker-shell"
      data-hydrated={isHydrated ? "true" : "false"}
    >
      <header
        className={`${SHELL_CLASS} flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 pb-3.5 pt-7`}
      >
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
          <span
            className="inline-flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.1em]"
            style={{ color: "var(--home-ink-muted)" }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--home-signal)" }}
              aria-hidden="true"
            />
            {kicker}
          </span>
          <h1
            className="m-0 font-semibold leading-none"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.125rem)", letterSpacing: "-0.05em" }}
          >
            Draft{" "}
            <em style={{ fontFamily: "var(--font-home-serif)", fontStyle: "italic", fontWeight: 500 }}>
              Tracker
            </em>
          </h1>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {headerChips.map((chip) => (
            <span
              key={chip.label}
              className={HEADER_CHIP_CLASS}
              style={
                chip.tone ?? {
                  borderColor: "var(--home-rule)",
                  background: "var(--home-paper-alt)",
                  color: "var(--home-ink-muted)",
                }
              }
            >
              {chip.label}
            </span>
          ))}
        </div>
      </header>

        {seasonalWeek >= 1 ? (
          <SeasonalScopeNote season={draftMetadata?.season ?? 0} week={seasonalWeek}>
            This room tracks a draft against the preseason consensus board, and that board stops refreshing once the season is under way, so it is here for next summer rather than for this week. Ranks that still move are on the <Link href="/fantasy-football/weekly" className="underline decoration-[var(--home-signal)] underline-offset-4">weekly board</Link>.
          </SeasonalScopeNote>
        ) : null}

      {(persistenceError || rankingsStale || (!rankingsStale && adpSourceStale)) && (
        <div className={`${SHELL_CLASS} grid gap-2.5 pb-3`}>
          {persistenceError ? (
            <div role="status" className="rounded border px-3.5 py-2.5 text-sm" style={WARNING_CARD_STYLE}>
              <p className="m-0 font-semibold">Local save is unavailable.</p>
              <p className="m-0 mt-1" style={{ color: "var(--home-ink-muted)" }}>
                {persistenceError}
              </p>
            </div>
          ) : null}
          {rankingsStale ? (
            <div
              role="alert"
              className="rounded border px-3.5 py-2.5 text-sm leading-6"
              style={WARNING_CARD_STYLE}
            >
              The ranking source is stale, so Draft Outlook and calculated draft signals are paused.
              You can keep logging picks against the dated board, but check current player news and
              your room&apos;s market before using it for a live decision.
            </div>
          ) : null}
          {!rankingsStale && adpSourceStale ? (
            <div
              role="status"
              className="rounded border px-3.5 py-2.5 text-sm leading-6"
              style={WARNING_CARD_STYLE}
            >
              The mock-draft ADP source is stale, so market price signals are hidden. The room is
              using the current consensus board for its remaining draft signals.
            </div>
          ) : null}
        </div>
      )}

      {showSetup ? (
        <div className="mx-auto w-full max-w-[820px] px-[clamp(1rem,4vw,2.5rem)] pb-12 pt-1">
          <DraftSetup
            settings={draftState.settings}
            onSaveSettings={updateSettings}
            onStartDraft={handleStartFromSetup}
            rankingsStatus={setupRankingsStatus}
            rankingsError={setupRankingsError}
            onRetryRankings={retry}
            canResume={roomSetupOpen && hasRoom}
            onResume={() => setRoomSetupOpen(false)}
            parkedPickCount={draftState.picks.length}
          />
          <p className="mx-0.5 mt-3.5 font-mono text-2xs leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
            Settings lock when the draft starts. The board logs every pick in the room, not just
            yours.
          </p>
        </div>
      ) : rankingsUnavailable ? (
        <div className={`${SHELL_CLASS} pb-12 pt-1`}>
          <div
            className="rounded-lg border px-6 py-8 text-center"
            style={{ borderColor: "var(--home-warning)", background: "var(--home-paper-raised)" }}
          >
            <p className="m-0 text-lg font-semibold">
              Draft assistant unavailable for this scoring format
            </p>
            <p className="mx-auto mt-2.5 max-w-[52ch] text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
              {overallSliceMetadata?.reason ??
                "The draft assistant needs a published overall board. Switch scoring or wait for the next snapshot update."}
            </p>
          </div>
        </div>
      ) : (
        <>
          <section
            ref={fasciaRef}
            aria-label="Live draft status"
            className={`sticky ${FASCIA_TOP_CLASS} z-30 border-y`}
            style={{
              borderColor: "var(--home-rule)",
              background: "color-mix(in srgb, var(--home-paper) 90%, transparent)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            {/*
              The fascia grid holds the per-second pick clock, so the section
              itself cannot be a live region the way the best ball fascia is.
              This line carries the announcement instead: its content changes
              only when a pick is logged or undone, so logging a pick announces
              the new room state once, matching the mock draft and best ball rooms.
            */}
            <p role="status" aria-live="polite" className="sr-only">
              {isDraftComplete
                ? "Draft complete."
                : `Pick ${draftState.currentPick} of ${totalPicks}, round ${draftState.currentRound}. ${
                    isUserPick ? "You are on the clock." : `${onClockLabel} is on the clock.`
                  }${previousPick ? ` Last pick: ${previousPick.player.name}.` : ""}`}
            </p>
            <div className={SHELL_CLASS}>
              <div
                className="grid gap-px border-x"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(148px, 30vw), 1fr))",
                  background: "var(--home-rule)",
                  borderColor: "var(--home-rule)",
                }}
              >
                {fasciaCells.map((cell) => (
                  <div
                    key={cell.key}
                    className="min-w-0 px-3 py-2"
                    style={{ background: cell.background ?? "var(--home-paper)" }}
                    {...(cell.timer
                      ? {
                          role: "timer",
                          "aria-live": "off" as const,
                          "aria-label": timer.isExpired
                            ? "Pick clock expired"
                            : `${timer.secondsLeft} seconds left on the pick clock`,
                        }
                      : {})}
                  >
                    <p className={`m-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--home-ink-muted)" }}>
                      {cell.label}
                    </p>
                    <p
                      className="m-0 mt-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-lg leading-tight tabular-nums"
                      style={{ color: cell.valueColor ?? "var(--home-ink)" }}
                    >
                      {cell.value}
                    </p>
                    <p
                      className="m-0 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-3xs"
                      style={{ color: "var(--home-ink-muted)" }}
                    >
                      {cell.sub}
                    </p>
                  </div>
                ))}
                <div
                  className="flex min-w-0 flex-wrap content-center items-center gap-1.5 px-3 py-2"
                  style={{ background: "var(--home-paper)" }}
                >
                  <button
                    type="button"
                    onClick={undoLastPick}
                    disabled={draftState.picks.length === 0}
                    aria-label={
                      draftState.picks.length === 0 ? "Undo last pick (no picks yet)" : "Undo last pick"
                    }
                    className={PILL_BUTTON_CLASS}
                    style={PILL_BUTTON_STYLE}
                  >
                    ↶ Undo pick
                  </button>
                  <button
                    type="button"
                    onClick={handleNewRoom}
                    className={PILL_BUTTON_CLASS}
                    style={{ ...PILL_BUTTON_STYLE, color: "var(--home-ink-muted)" }}
                  >
                    New room
                  </button>
                </div>
              </div>
            </div>
          </section>

          {tapePicks.length > 0 && (
            <div className={`${SHELL_CLASS} flex items-center gap-2 overflow-x-auto pt-2.5`}>
              <span className={`${MONO_LABEL_CLASS} flex-none`} style={{ color: "var(--home-ink-muted)" }}>
                Last picks
              </span>
              {tapePicks.map((pick) => (
                <button
                  key={`tape-${pick.pickNumber}`}
                  type="button"
                  onClick={() => undoToPick(pick.pickNumber)}
                  title="Undo back to this pick"
                  aria-label={`Undo back to pick ${pick.pickNumber} (${pick.player.name})`}
                  className="inline-flex min-h-touch flex-none items-baseline gap-1.5 rounded-[2px] border px-2 font-mono text-2xs"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "var(--home-paper-raised)",
                    color: "var(--home-ink)",
                  }}
                >
                  <span style={{ color: "var(--home-ink-muted)" }}>#{pick.pickNumber}</span>
                  <span className="font-sans text-xs font-semibold tracking-[-0.01em]">
                    {shortName(pick.player)}
                  </span>
                  <span style={{ color: "var(--home-ink-muted)" }}>
                    {pick.player.position} ·{" "}
                    {pick.teamNumber === draftState.settings.userTeam ? "You" : `S${pick.teamNumber}`}
                  </span>
                </button>
              ))}
            </div>
          )}

          <section
            aria-label="Your roster"
            className={`${SHELL_CLASS} flex flex-wrap items-center gap-1.5 pt-2.5`}
          >
            <span className={`${MONO_LABEL_CLASS} flex-none`} style={{ color: "var(--home-ink-muted)" }}>
              Your roster
            </span>
            {lineupAssignment.slots.map((slot, index) => (
              <span
                key={`slot-${slot.slot}-${index}`}
                className="inline-flex items-baseline gap-1.5 rounded-[2px] border px-1.5 py-0.5 font-mono text-3xs uppercase tracking-[0.06em]"
                style={
                  slot.player
                    ? {
                        borderStyle: "solid",
                        borderColor: "var(--home-rule)",
                        background: "var(--home-paper-raised)",
                        color: "var(--home-ink-muted)",
                      }
                    : {
                        borderStyle: "dashed",
                        borderColor: "color-mix(in srgb, var(--home-rule) 80%, transparent)",
                        background: "transparent",
                        color: "var(--home-ink-muted)",
                      }
                }
              >
                {slot.slot}
                <span
                  className="font-sans text-xs font-semibold normal-case tracking-[-0.01em]"
                  style={{ color: slot.player ? "var(--home-ink)" : undefined }}
                >
                  {slot.player ? shortName(slot.player) : "open"}
                </span>
              </span>
            ))}
            {lineupAssignment.bench > 0 && (
              <span className="font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                +{lineupAssignment.bench} bench
              </span>
            )}
          </section>

          {decisionRecs.length > 0 && (
            <section aria-label="Your pick recommendations" className={`${SHELL_CLASS} pt-3.5`}>
              <div
                className="overflow-hidden rounded-lg border"
                style={{
                  borderColor: "color-mix(in srgb, var(--home-signal) 45%, var(--home-rule))",
                  background: "color-mix(in srgb, var(--home-signal) 7%, var(--home-paper))",
                }}
              >
                <div
                  className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5 border-b px-3.5 py-2"
                  style={{ borderColor: "color-mix(in srgb, var(--home-signal) 28%, var(--home-rule))" }}
                >
                  {/* 11px signal on the card's 7% signal wash measures 4.15:1. The dot
                      keeps the pure accent so the state still reads at a glance, and the
                      label takes the 72%-toward-ink mix so it clears AA. */}
                  <span
                    className="inline-flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.12em]"
                    style={{ color: "color-mix(in srgb, var(--home-signal) 72%, var(--home-ink))" }}
                  >
                    <span
                      className="h-[7px] w-[7px] rounded-full"
                      style={{ background: "var(--home-signal)" }}
                      aria-hidden="true"
                    />
                    Your pick is live
                  </span>
                  <span className="font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                    Pick #{draftState.currentPick} of {totalPicks}
                    {timerEnabled ? ` · ${formatClock(Math.max(0, timer.secondsLeft))} advisory` : ""}
                    {nextUserPick ? ` · your next turn #${nextUserPick}` : ""}
                  </span>
                </div>
                <div
                  className="grid gap-px"
                  style={{
                    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                    background: "color-mix(in srgb, var(--home-signal) 20%, var(--home-rule))",
                  }}
                >
                  {decisionRecs.map((rec) => (
                    <div
                      key={`rec-${rec.tag}-${rec.player.id}`}
                      className="flex flex-col gap-1.5 px-3.5 py-2.5"
                      style={{ background: "var(--home-paper)" }}
                    >
                      <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-signal)" }}>
                        {rec.tag}
                      </span>
                      <div className="flex min-w-0 items-baseline gap-2">
                        <span className="flex-none font-mono text-sm" style={{ color: "var(--home-ink-muted)" }}>
                          #{publishedDraftRank(rec.player)}
                        </span>
                        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold tracking-[-0.02em]">
                          {rec.player.name}
                        </span>
                        <span className={POSITION_CHIP_CLASS} style={getPositionTone(rec.player.position)}>
                          {rec.player.position}
                        </span>
                      </div>
                      <p className="m-0 font-mono text-2xs leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
                        {rec.why}
                      </p>
                      <button
                        type="button"
                        onClick={() => draftPlayer(rec.player)}
                        aria-label={`Log ${rec.player.name} as pick ${draftState.currentPick}`}
                        className="mt-0.5 inline-flex min-h-touch items-center justify-center self-start rounded-full border px-4 font-mono text-2xs uppercase tracking-[0.08em]"
                        style={{
                          borderColor: "var(--home-ink)",
                          background: "var(--home-ink)",
                          color: "var(--home-paper)",
                        }}
                      >
                        Log pick
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {scarcity.length > 0 && !isDraftComplete && (
            <section aria-label="Tier scarcity by position" className={`${SHELL_CLASS} pt-3.5`}>
              <div
                className="grid gap-px overflow-hidden rounded border"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  background: "var(--home-rule)",
                  borderColor: "var(--home-rule)",
                }}
              >
                {scarcity.map((entry) => (
                  <div
                    key={`scarcity-${entry.position}`}
                    title={entry.tip}
                    className="flex min-w-0 items-baseline gap-2 px-2.5 py-2"
                    style={{ background: entry.background }}
                  >
                    <span className={POSITION_CHIP_CLASS} style={getPositionTone(entry.position)}>
                      {entry.position}
                    </span>
                    <span className="whitespace-nowrap font-mono text-2xs">{entry.text}</span>
                    {entry.flag && (
                      <span
                        className="ml-auto whitespace-nowrap font-mono text-3xs uppercase tracking-[0.1em]"
                        style={{ color: entry.flagColor }}
                      >
                        {entry.flag}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className={`${SHELL_CLASS} pb-11 pt-4`}>
            {/* The running page goes h1 to the Draft Outlook h3 with nothing
                between, so name the room here the way the rankings board and the
                mock draft both do. */}
            <h2 className="sr-only">Your draft room</h2>
            {isDraftComplete && (
              <div
                className="mb-4 rounded-lg border border-dashed px-6 py-7 text-center"
                style={{ borderColor: "var(--home-rule)" }}
              >
                <p className="m-0 text-lg font-semibold tracking-[-0.02em]">Draft complete.</p>
                <p className="m-0 mt-2 font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                  Every pick is logged in this room. Start a new room to run it back.
                </p>
                <button
                  type="button"
                  onClick={handleNewRoom}
                  className="mt-3.5 inline-flex min-h-touch items-center justify-center rounded-full border px-4 font-mono text-2xs uppercase tracking-[0.06em]"
                  style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
                >
                  New room
                </button>
              </div>
            )}

            {!draftSnapshot ? (
              <div
                className="rounded-lg border px-6 py-8 text-center"
                style={{ borderColor: "var(--home-rule)", background: "var(--home-paper-raised)" }}
                role="status"
              >
                <p className="m-0 text-lg font-semibold">
                  {error
                    ? "Draft board unavailable"
                    : `Loading the ${FANTASY_SCORING_LABELS[scoringKey]} board`}
                </p>
                <p className="mx-auto mt-2.5 max-w-[52ch] text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
                  {error
                    ? "Your room and picks are still saved. Retry the published snapshot before logging another pick."
                    : "Your room is ready. Picks, the timer, and Draft Outlook will resume when the matching snapshot finishes loading."}
                </p>
                {error ? (
                  <button
                    type="button"
                    onClick={retry}
                    className="mt-4 inline-flex min-h-touch items-center justify-center rounded-full border px-4 text-sm font-semibold"
                    style={PILL_BUTTON_STYLE}
                  >
                    Retry rankings
                  </button>
                ) : null}
              </div>
            ) : !isDraftComplete ? (
              <DraftBoard
                players={draftBoardPlayers}
                draftedPlayerIds={draftedPlayerIds}
                onDraftPlayer={draftPlayer}
                onOpenDetail={setDetailPlayer}
                currentPick={draftState.currentPick}
                currentRound={draftState.currentRound}
                adpAvailable={adpAvailable}
                guidanceAvailable={draftGuidanceAvailable}
                stickyTop={boardStickyTop}
              />
            ) : null}

            {draftSnapshot && (
              <div className="mt-6 grid gap-4">
                <article className="home-card p-5 sm:p-6">
                  <DraftValuePanel
                    report={userDraftValue}
                    headingId="draft-tracker-outlook-heading"
                    calculatorValue={returnAssumptions}
                    onCalculatorChange={setReturnAssumptions}
                    unavailableReason={draftOutlookUnavailableReason}
                  />
                </article>
                {analytics && (
                  <DraftAnalyticsPanel
                    analytics={analytics}
                    picks={modelPicks}
                    currentPick={draftState.currentPick}
                    isDraftComplete={isDraftComplete}
                    userTeamNumber={draftState.settings.userTeam}
                    adpAvailable={adpAvailable}
                    adpUnavailableReason={
                      sourceCapabilities.market.freshness === "prior-season"
                        ? "reference"
                        : hasAdpSource
                          ? "stale"
                          : "missing"
                    }
                    getTeamName={getTeamName}
                  />
                )}
                <article className="home-card p-5 sm:p-6">
                  <p className="home-kicker mb-1">Room actions</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={redoLastPick}
                      disabled={!canRedo}
                      aria-label={canRedo ? "Redo the last undone pick" : "Redo (nothing to redo)"}
                      className={PILL_BUTTON_CLASS}
                      style={PILL_BUTTON_STYLE}
                    >
                      ↷ Redo pick
                    </button>
                    {([
                      { format: "csv", label: "Picks CSV" },
                      { format: "recap-csv", label: "Recap CSV" },
                      { format: "json", label: "JSON" },
                    ] as const).map((option) => (
                      <button
                        key={option.format}
                        type="button"
                        onClick={() => handleExport(option.format)}
                        className={PILL_BUTTON_CLASS}
                        style={PILL_BUTTON_STYLE}
                      >
                        {option.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowTeamEditor((open) => !open)}
                      aria-expanded={showTeamEditor}
                      className={PILL_BUTTON_CLASS}
                      style={PILL_BUTTON_STYLE}
                    >
                      Name the teams {showTeamEditor ? "▴" : "▾"}
                    </button>
                  </div>
                  {showTeamEditor && (
                    <div
                      className="mt-4 grid gap-x-4 gap-y-2.5"
                      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
                    >
                      {draftState.teams.map((team) => (
                        <label key={team.teamNumber} className="grid gap-1 text-xs">
                          <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
                            Slot {team.teamNumber}
                            {team.teamNumber === draftState.settings.userTeam ? " (you)" : ""}
                          </span>
                          <input
                            value={team.teamName ?? ""}
                            onChange={(event) => setTeamName(team.teamNumber, event.target.value)}
                            maxLength={40}
                            placeholder={`Team ${team.teamNumber}`}
                            className="min-h-touch rounded border px-3 font-mono text-xs"
                            style={{
                              borderColor: "var(--home-rule)",
                              background: "var(--home-paper)",
                              color: "var(--home-ink)",
                            }}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-xs leading-6" style={{ color: "var(--home-ink-muted)" }}>
                    Change league settings by starting a new room. Active drafts keep one fixed room
                    configuration, and picks stay on this device.
                  </p>
                </article>
              </div>
            )}

            <div
              className="mt-6 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2 border-t pt-3.5"
              style={{ borderColor: "var(--home-rule)" }}
            >
              <span className="font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                Advisory clock only, nothing auto-picks at zero · picks stay on this device
              </span>
              <Link
                href="/fantasy-football"
                className="inline-flex min-h-touch items-center text-sm font-semibold no-underline"
              >
                Open the rankings board ↗
              </Link>
            </div>
          </div>
        </>
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

      <PlayerDetailDrawer
        player={detailPlayer}
        publishedRank={detailPlayer ? publishedDraftRank(detailPlayer) : undefined}
        boardTierCount={boardTierCount > 0 ? boardTierCount : undefined}
        compareAvailable={false}
        onClose={() => setDetailPlayer(null)}
      />
    </section>
  );
}
