"use client";

import { useIsClient } from "@/hooks/useIsClient";
import { isFiniteNumber } from "@/lib/utils";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import "@/components/fantasy/fantasy-draft.css";
import { SeasonalScopeNote } from "@/components/fantasy/SeasonalScopeNote";
import { FreshnessParts } from "@/components/fantasy/FantasyRouteHeader";
import Link from "next/link";
import { DraftAnalyticsPanel } from "./components/DraftAnalyticsPanel";
import { DraftBoard } from "./components/DraftBoard";
import { DraftRecapPanel } from "./components/DraftRecapPanel";
import { Redo2, Undo2 } from "lucide-react";
import {
  DraftLastPicks,
  DraftPickGrid,
  DraftRoster,
  DraftScorebug,
  DraftScorebugCell,
} from "@/components/fantasy/DraftRoomParts";
import { positionClass } from "@/components/fantasy/positionClass";
import { DraftSetup } from "./components/DraftSetup";
import { calculateDraftOrder, useDraftState } from "./hooks/useDraftState";
import { useDraftTelemetry } from "./hooks/useDraftTelemetry";
import { DraftClockCell, DraftClockProvider } from "./components/DraftClock";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import { loadNotes } from "@/lib/fantasyLocal";
import {
  computeDraftAnalytics,
  isPlayerValueAtPick,
  reconcileTeamRosters,
} from "@/lib/draftAnalytics";
import { getSpecialistNote } from "@/lib/draftEarlySpecialistNote";
import { resolveDraftTelemetry } from "@/lib/draftTelemetry";
import { calculateRedraftDraftValues } from "@/lib/fantasyTeamValue";
import {
  calculateRedraftDraftDecision,
  describeRedraftWait,
  type RedraftPositionDecision,
} from "@/lib/redraftDraftDecision";
import {
  buildFantasyVorpIndex,
  isFantasyVorpTeamSize,
  type FantasyVorpRankingEntry,
} from "@/lib/fantasyVorp";
import {
  FANTASY_SCORING_LABELS,
  getCrossBoardFantasyPlayers,
  getFantasyWeekLabel,
  scoringFormatToRouteScoring,
} from "@/lib/fantasy";
import {
  SHELL_CLASS,
  assignLineupSlots,
  formatAdp,
  formatRankValue,
  formatUpdatedAt,
  getFantasySourceCapabilities,
  getNflRegularSeasonWeek,
  resolveDraftPicksForModel,
  shortName,
  withoutPlayerAdp,
} from "@/lib/fantasyUtils";
import { DraftValuePanel, type ExpectedReturnFormState } from "@/components/fantasy/DraftValuePanel";
import { DeferredPlayerDetailDrawer } from "@/components/fantasy/DeferredPlayerDetailDrawer";
import { RedraftDecisionPanel } from "@/components/fantasy/RedraftDecisionPanel";
import type { Player, RedraftLineupSettings, ScoringFormat } from "@/types";

function publishedDraftRank(player: Player): string {
  return formatRankValue(player.rankEcr ?? player.averageRank);
}

function numericDraftRank(player: Player): number | null {
  if (isFiniteNumber(player.rankEcr)) return player.rankEcr;
  return isFiniteNumber(player.averageRank) ? player.averageRank : null;
}

interface DecisionRec {
  tag: string;
  player: Player;
  why: string;
}

/**
 * The wait-cost cell of the on-clock strip: projected points when VORP covers
 * the league size, the ordinal spot cost otherwise, and an honest dash when
 * the market cannot price the question.
 */
function waitCellReading(
  decision: RedraftPositionDecision | null
): { value: string; sub: string; title?: string } {
  if (!decision) {
    return { value: "—", sub: "No measurable position" };
  }
  const wait = decision.wait;
  if (wait.kind === "measured") {
    const survivorName = shortName(wait.survivor.player);
    return {
      value:
        // A drop that rounds to zero must not read as "waiting is free"; the
        // shared describe copy guards the same case.
        wait.survivor.pointsDrop !== null
          ? Math.round(wait.survivor.pointsDrop) >= 1
            ? `−${Math.round(wait.survivor.pointsDrop)} pts`
            : `−${wait.survivor.pointsDrop.toFixed(1)} pts`
          : `−${wait.survivor.rankCost.toFixed(0)} spots`,
      sub: `to #${wait.nextPick} · ${survivorName} likely lasts`,
      title: describeRedraftWait(wait),
    };
  }
  if (wait.kind === "no-priced-survivor") {
    return {
      value: "Unpriced",
      sub: `no midpoint option reaches #${wait.nextPick}`,
      title: describeRedraftWait(wait),
    };
  }
  switch (wait.reason) {
    case "market-unavailable":
      return { value: "—", sub: "ADP unavailable" };
    case "no-next-pick":
      return { value: "—", sub: "your final turn" };
    default:
      return { value: "—", sub: "not measurable here" };
  }
}

/**
 * One recommendation card on the on-clock strip: its label, the position chip,
 * the player's detail button, an optional Log action, and either the one-line
 * reading or the longer "why" line once the disclosure opens. `now` marks the
 * one action that is the user's to take, which takes the highlighter.
 */
function StripPlayerCard({
  label,
  tone,
  player,
  publishedRank,
  sub,
  detail,
  onOpenDetail,
  onLog,
  logLabel,
  now = false,
}: {
  label: string;
  tone?: "warn";
  player: Player;
  publishedRank: number | string;
  sub: string;
  detail: string | null;
  onOpenDetail: () => void;
  onLog?: () => void;
  logLabel: string;
  now?: boolean;
}) {
  return (
    <div className="ffb-strip-item">
      <span className={tone === "warn" ? "ffb-label ffb-warn" : "ffb-label"}>{label}</span>
      <div className="ffb-strip-line">
        <span className={`ffb-chip ${positionClass(player.position)}`.trimEnd()}>
          {player.position}
          {player.positionRank ?? ""}
        </span>
        <button
          type="button"
          onClick={onOpenDetail}
          aria-label={`Open ${player.name} detail`}
          title={player.name}
          className="ffb-c-name"
        >
          {player.name}
        </button>
        {onLog ? (
          <button
            type="button"
            onClick={onLog}
            aria-label={logLabel}
            className={now ? "ffb-btn ffb-btn-now" : "ffb-log"}
          >
            Log
          </button>
        ) : null}
      </div>
      <p className="ffb-strip-note">{detail ?? `#${publishedRank} · ${sub}`}</p>
    </div>
  );
}

export function DraftTrackerClient() {
  const isHydrated = useIsClient();
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

  const telemetry = useDraftTelemetry(draftState.draftId);

  // A running room stays immutable behind New room. Setup can preview another
  // scoring board without changing that room until the user confirms Start.
  const [roomSetupOpen, setRoomSetupOpen] = useState(false);
  const [setupScoringFormat, setSetupScoringFormat] = useState<ScoringFormat | null>(null);
  const hasRoom = draftState.picks.length > 0 || draftState.isActive;
  const showSetup = roomSetupOpen || !hasRoom;
  const snapshotScoringFormat = showSetup
    ? setupScoringFormat ?? draftState.settings.scoringFormat
    : draftState.settings.scoringFormat;
  const scoringKey = scoringFormatToRouteScoring(snapshotScoringFormat);
  const { snapshot, metadata, isLoading, error, retry } = useFantasySnapshot({
    scoring: scoringKey,
    all: true,
  });
  // useFantasySnapshot intentionally keeps its last value until the effect for
  // a new scoring key runs. A restored room can therefore see the previous
  // scoring board for one render. Nothing that can log or model a pick may use
  // that transition value.
  const snapshotMatchesScoring = snapshot?.scoringFormat === snapshotScoringFormat;
  const matchingSnapshot = snapshotMatchesScoring ? snapshot : null;
  const matchingMetadata = snapshotMatchesScoring ? metadata : null;
  const overallSliceMetadata = matchingSnapshot?.sliceMetadata?.overall ?? null;
  const rankingsUnavailable = Boolean(overallSliceMetadata && !overallSliceMetadata.available);
  const rankingsUpdatedAt = overallSliceMetadata?.updatedAt ?? matchingMetadata?.upstreamUpdatedAt;

  const hasUsableDraftBoard = Boolean(
    !isLoading &&
      !error &&
      matchingSnapshot &&
      overallSliceMetadata?.available === true &&
      matchingSnapshot.overall.length > 0
  );
  const draftSnapshot = hasUsableDraftBoard ? matchingSnapshot : null;
  const draftMetadata = draftSnapshot ? matchingMetadata : null;
  const vorpTeamSize = isFantasyVorpTeamSize(draftState.settings.totalTeams)
    ? draftState.settings.totalTeams
    : null;
  const sourceCapabilities = getFantasySourceCapabilities({
    rankingAsOf: rankingsUpdatedAt,
    vorpAsOf: draftSnapshot?.vorpSource?.asOf,
    marketAsOf: draftMetadata?.adpSource?.asOf,
    season: draftMetadata?.season,
  });
  const vorpValues = useMemo(
    () =>
      vorpTeamSize && draftSnapshot?.vorpSource && sourceCapabilities.vorp.usable
        ? buildFantasyVorpIndex(draftSnapshot.vorpRankings, vorpTeamSize)
        : new Map<string, FantasyVorpRankingEntry>(),
    [draftSnapshot, sourceCapabilities.vorp.usable, vorpTeamSize]
  );
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
  // Focus target after a logged pick (the fascia's on-the-clock tile) and the
  // counter logPick bumps so the post-commit effect knows a pick just landed.
  const onClockRef = useRef<HTMLDivElement | null>(null);
  const [focusRequests, setFocusRequests] = useState(0);
  const requestRoomFocus = () => setFocusRequests((count) => count + 1);
  // The rail, which the skip link before the board moves focus to.
  const railRef = useRef<HTMLElement | null>(null);
  const [showTeamEditor, setShowTeamEditor] = useState(false);
  // The compact strip answers "who now"; the four-position analysis and the
  // full recommendation cards sit behind this toggle so the board stays high.
  const [showDecisionDetail, setShowDecisionDetail] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [specialistNote, setSpecialistNote] = useState<string | null>(null);
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
  const clockVisible =
    (draftState.settings.timerSeconds ?? 0) > 0 && !showSetup && hasUsableDraftBoard;

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

  const redraftDecision = useMemo(
    () =>
      calculateRedraftDraftDecision({
        players: draftBoardPlayers,
        positionBoards: {
          QB: draftSnapshot?.positions.QB ?? [],
          RB: draftSnapshot?.positions.RB ?? [],
          WR: draftSnapshot?.positions.WR ?? [],
          TE: draftSnapshot?.positions.TE ?? [],
        },
        picks: modelPicks,
        room: {
          teams: draftState.settings.totalTeams,
          rounds: draftState.settings.rounds,
          userTeam: draftState.settings.userTeam,
          draftOrder: draftState.settings.draftType,
          lineup: draftState.settings.lineup,
        },
        currentPick: draftState.currentPick,
        rankingUsable: draftGuidanceAvailable,
        marketCurrent: adpAvailable,
        vorpValues,
      }),
    [
      adpAvailable,
      draftBoardPlayers,
      draftGuidanceAvailable,
      draftSnapshot?.positions.QB,
      draftSnapshot?.positions.RB,
      draftSnapshot?.positions.TE,
      draftSnapshot?.positions.WR,
      draftState.currentPick,
      draftState.settings,
      modelPicks,
      vorpValues,
    ]
  );
  const replacementValues = useMemo(
    () =>
      new Map(
        redraftDecision.playerValues.map((reading) => [
          reading.player.id,
          reading.value,
        ])
      ),
    [redraftDecision.playerValues]
  );
  const positionDecisionByPosition = useMemo(
    () =>
      new Map(
        redraftDecision.positions.map((entry) => [entry.position, entry])
      ),
    [redraftDecision.positions]
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

    const replacementPart = (player: Player): string => {
      const value = replacementValues.get(player.id);
      return value === undefined ? "" : `Index ${value.toFixed(1)}`;
    };
    const vorpPart = (player: Player): string => {
      const reading = vorpValues.get(player.id);
      return reading === undefined ? "" : `VORP ${Math.round(reading.value)}`;
    };

    const best = available[0];
    used.add(best.id);
    const bestParts = [`Board #${publishedDraftRank(best)}`];
    if (isFiniteNumber(best.tier)) bestParts.push(`Tier ${best.tier}`);
    const bestVorp = vorpPart(best);
    if (bestVorp) bestParts.push(bestVorp);
    const bestReplacement = replacementPart(best);
    if (bestReplacement) bestParts.push(bestReplacement);
    if (
      adpAvailable &&
      isFiniteNumber(best.adp) &&
      isPlayerValueAtPick(best, currentPick, draftState.currentRound)
    ) {
      bestParts.push(`lasted +${(currentPick - best.adp).toFixed(1)} past ADP`);
    }
    recs.push({ tag: "Best left", player: best, why: bestParts.join(" · ") });

    const mostAtRisk = redraftDecision.mostAtRisk;
    const riskPlayer = mostAtRisk?.bestAvailable?.player;
    if (mostAtRisk && riskPlayer && !used.has(riskPlayer.id)) {
      used.add(riskPlayer.id);
      const riskParts = [vorpPart(riskPlayer), replacementPart(riskPlayer)];
      if (mostAtRisk.tier.tier !== null) {
        riskParts.push(
          `${mostAtRisk.position} Tier ${mostAtRisk.tier.tier} has ${mostAtRisk.tier.remaining} left`
        );
      }
      if (mostAtRisk.wait.kind === "measured") {
        riskParts.push(
          `waiting to #${mostAtRisk.wait.nextPick} costs ${mostAtRisk.wait.survivor.rankCost.toFixed(0)} consensus spots`
        );
      } else if (mostAtRisk.wait.kind === "no-priced-survivor") {
        riskParts.push(`no reliably priced option reaches #${mostAtRisk.wait.nextPick}`);
      }
      recs.push({
        tag: `Most at risk · ${mostAtRisk.position}`,
        player: riskPlayer,
        why: riskParts.filter(Boolean).join(" · "),
      });
    }

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
      const positionDecision = positionDecisionByPosition.get(
        fillPlayer.position as "QB" | "RB" | "WR" | "TE"
      );
      if (positionDecision?.tier.tier !== null && positionDecision?.tier.tier !== undefined) {
        fillParts.push(
          `Position Tier ${positionDecision.tier.tier} has ${positionDecision.tier.remaining} left`
        );
      }
      const fillVorp = vorpPart(fillPlayer);
      if (fillVorp) fillParts.push(fillVorp);
      const fillReplacement = replacementPart(fillPlayer);
      if (fillReplacement) fillParts.push(fillReplacement);
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
        const valueParts = [
          `ADP ${formatAdp(valuePlayer.adp)}`,
          `lasted +${valueDelta.toFixed(1)} past the market`,
        ];
        const valueVorp = vorpPart(valuePlayer);
        if (valueVorp) valueParts.push(valueVorp);
        const valueReplacement = replacementPart(valuePlayer);
        if (valueReplacement) valueParts.push(valueReplacement);
        recs.push({
          tag: "Value",
          player: valuePlayer,
          why: valueParts.join(" · "),
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
    positionDecisionByPosition,
    redraftDecision.mostAtRisk,
    replacementValues,
    vorpValues,
  ]);

  const previousPick = picksForDisplay[picksForDisplay.length - 1] ?? null;
  const tapePicks = useMemo(() => picksForDisplay.slice(-8).reverse(), [picksForDisplay]);

  // On-clock strip inputs: best on the board, the position most at risk, and
  // the wait cost at the best-available position (falling back to the at-risk
  // position when the best player is a kicker or defense with no decision row).
  const bestAvailable = availableBoardPlayers[0] ?? null;
  const riskDecision = redraftDecision.mostAtRisk;
  const riskPlayer = riskDecision?.bestAvailable?.player ?? null;
  const bestDecision = bestAvailable
    ? positionDecisionByPosition.get(
        bestAvailable.position as "QB" | "RB" | "WR" | "TE"
      ) ?? null
    : null;
  const stripWait = waitCellReading(bestDecision ?? riskDecision);
  const stripWaitPosition = (bestDecision ?? riskDecision)?.position ?? null;
  const stripVisible =
    isUserPick &&
    !isDraftComplete &&
    Boolean(draftSnapshot) &&
    draftGuidanceAvailable &&
    bestAvailable !== null;
  const bestVorpEntry = bestAvailable ? vorpValues.get(bestAvailable.id) : undefined;
  const bestReplacement = bestAvailable ? replacementValues.get(bestAvailable.id) : undefined;
  const bestStripSub = bestAvailable
    ? [
        isFiniteNumber(bestAvailable.tier) ? `Tier ${bestAvailable.tier}` : null,
        bestVorpEntry ? `VORP ${Math.round(bestVorpEntry.value)}` : null,
        bestReplacement !== undefined ? `Index ${bestReplacement.toFixed(1)}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "Top of the published board"
    : "";
  // The strip cards and the disclosure share one recommendation list, so the
  // "why" line lands on the card that already shows the player and the recs
  // for anyone else (the lineup fill, a market value) join the grid when open.
  const recByPlayerId = new Map(decisionRecs.map((rec) => [rec.player.id, rec]));
  const extraRecs = decisionRecs.filter(
    (rec) => rec.player.id !== bestAvailable?.id && rec.player.id !== riskPlayer?.id
  );
  const riskStripSub = riskDecision
    ? riskDecision.tier.tier !== null
      ? `${riskDecision.position} Tier ${riskDecision.tier.tier} has ${riskDecision.tier.remaining} left`
      : "scarce before your next turn"
    : "No open position is at risk before your next turn.";

  // The running head's league line describes the room. Setup leaves it out,
  // because the form below is what describes the room being set up.
  const roomLineParts = [
    draftState.settings.leagueName?.trim() || "Draft room",
    `${draftState.settings.totalTeams}-team ${draftState.settings.draftType}`,
    `${FANTASY_SCORING_LABELS[scoringKey]} scoring`,
  ];
  const freshnessParts: { label: string; tone?: "warning" }[] = [
    ...(showSetup ? [{ label: `${FANTASY_SCORING_LABELS[scoringKey]} scoring` }] : []),
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
          ? ("warning" as const)
          : undefined,
    },
  ];

  function handleNewRoom() {
    setSetupScoringFormat(null);
    setRoomSetupOpen(true);
  }

  // Every pick path routes through here so a user turn records what the strip
  // showed at the moment of logging. Outcomes are derived later from the pick
  // log, never stored, so undone turns cannot leave stale verdicts.
  function logPick(player: Player) {
    const snapshotAtPick = draftSnapshot;
    if (stripVisible && bestAvailable && snapshotAtPick) {
      const decision = bestDecision ?? riskDecision;
      const wait = decision?.wait;
      const survivor = wait && wait.kind === "measured" ? wait.survivor : null;
      const baseline = decision?.bestAvailable ?? null;
      telemetry.appendRecord({
        pick: draftState.currentPick,
        nextUserPick: redraftDecision.followingUserPick,
        chosenPlayerId: player.id,
        chosenPlayerName: player.name,
        bestAvailableId: bestAvailable.id,
        bestAvailableName: bestAvailable.name,
        waitPosition: decision?.position ?? null,
        waitBaselineId: baseline?.player.id ?? null,
        waitBaselineName: baseline?.player.name ?? null,
        waitBaselineRank: baseline?.expertRank ?? null,
        expectedSurvivorId: survivor?.player.id ?? null,
        expectedSurvivorName: survivor?.player.name ?? null,
        expectedSurvivorRank: survivor?.expertRank ?? null,
        waitCostSpots: survivor?.rankCost ?? null,
        waitCostPoints: survivor?.pointsDrop ?? null,
        atRiskPlayerId: riskPlayer?.id ?? null,
        atRiskPlayerName: riskPlayer?.name ?? null,
        atRiskPosition: riskDecision?.position ?? null,
        recommendedIds: decisionRecs.map((rec) => rec.player.id),
        modelVersion: redraftDecision.modelVersion,
        snapshotRevision: snapshotAtPick.generatedAt,
        rankingAsOf: rankingsUpdatedAt ?? null,
        marketAsOf: draftMetadata?.adpSource?.asOf ?? null,
        vorpAsOf: snapshotAtPick.vorpSource?.asOf ?? null,
        waitCandidates: decision
          ? availableBoardPlayers.flatMap((candidate) => {
              if (candidate.position !== decision.position) return [];
              const rank = numericDraftRank(candidate);
              if (rank === null) return [];
              return [
                {
                  playerId: candidate.id,
                  playerName: candidate.name,
                  rank,
                  projectedPointsAboveReplacement:
                    vorpValues.get(candidate.id)?.value ?? null,
                },
              ];
            })
          : [],
        recordedAt: new Date().toISOString(),
      });
    }
    const note = getSpecialistNote(
      { round: draftState.currentRound, teamNumber: currentTeamNumber, player },
      draftState.settings.userTeam,
      draftState.picks,
    );
    if (note) setSpecialistNote(note);
    requestRoomFocus();
    draftPlayer(player);
  }

  function handleStartFromSetup() {
    // Starting over an existing room is the destructive step; "New room" only
    // parked it, and "Back to room" was the escape hatch on the setup screen.
    if (draftState.picks.length > 0) {
      resetDraft();
    }
    setSpecialistNote(null);
    startDraft();
    setSetupScoringFormat(null);
    setRoomSetupOpen(false);
    // The Start button leaves with the setup screen.
    requestRoomFocus();
  }

  function handleExport(format: "csv" | "recap-csv" | "json") {
    // Read at export time. Subscribing to the notes store here re-rendered the
    // whole room on every keystroke in a note.
    exportDraftResults(format, { notes: loadNotes(), picks: picksForDisplay });
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

  const picksUntilTurn = nextUserPick - draftState.currentPick;
  const nextTurn = isUserPick
    ? { value: "Now", note: nextUserPick ? `then #${nextUserPick}` : "last turn" }
    : nextUserPick
      ? {
          value: `#${nextUserPick}`,
          note: `in ${picksUntilTurn} ${picksUntilTurn === 1 ? "pick" : "picks"}`,
        }
      : { value: "None left", note: "" };
  // The scorebug holds the per-second clock, so it cannot be a live region.
  // This sentence carries the announcement instead: it changes only when a pick
  // is logged or undone, so logging a pick announces the new room state once.
  const roomAnnouncement = isDraftComplete
    ? "Draft complete."
    : `Pick ${draftState.currentPick} of ${totalPicks}, round ${draftState.currentRound}. ${
        isUserPick ? "You are on the clock." : `${onClockLabel} is on the clock.`
      }${previousPick ? ` Last pick: ${previousPick.player.name}.` : ""}`;

  // A logged pick unmounts the control that logged it (a board row, a strip
  // card, or the drawer's opener), so focus would fall to the document. Start
  // draft, Back to room, and an undo back to a pick take their control away
  // the same way, and Redo and Undo disable themselves once there is nothing
  // left to do. After the commit, if nothing else holds focus (the board
  // refocuses its search when a query was active), move it to the on-the-clock
  // cell, which exists in every running state, or to the "Done" cell once the
  // draft is complete. The mock draft carries the same pattern.
  useEffect(() => {
    if (focusRequests === 0) return;
    const active = document.activeElement;
    // The drawer's "Log this pick" closes the drawer, whose panel stays in the
    // DOM through its exit animation, so focus inside a modal counts as lost.
    // A button that just disabled itself is about to lose focus too.
    const focusHeld =
      active &&
      active !== document.body &&
      active.isConnected &&
      !(active instanceof HTMLButtonElement && active.disabled) &&
      !active.closest('[aria-modal="true"]');
    if (focusHeld) return;
    onClockRef.current?.focus({ preventScroll: true });
  }, [focusRequests]);

  // The board is hundreds of rows and each row is three tab stops, so a
  // keyboard gets a way past it. The rail is not a box where it drops under
  // the list (the kit sets display: contents there), so the first block after
  // the list takes the focus instead.
  function skipToRail() {
    const rail = railRef.current;
    if (!rail) return;
    rail.focus();
    if (document.activeElement === rail) return;
    const firstAfterList = rail.querySelector<HTMLElement>(":scope > :not(.ffb-rail-lead)");
    if (!firstAfterList) return;
    firstAfterList.tabIndex = -1;
    firstAfterList.focus();
  }

  // The board's bar and the rail pin underneath the scorebug, and the scorebug
  // takes a second row once the column is narrow, so measure it instead of
  // assuming a height. Both read the result as --ffb-sticky-top.
  const fasciaRef = useRef<HTMLElement | null>(null);
  const [fasciaHeight, setFasciaHeight] = useState(0);

  useEffect(() => {
    const element = fasciaRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () => setFasciaHeight(element.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [showSetup, rankingsUnavailable]);

  // Keyboard draft flow: U undoes the last pick from anywhere outside a form
  // field, the setup screen, or the open drawer. Search focus ("/"), result
  // navigation, and Enter-to-log live in DraftBoard beside the input they act on.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "u" && event.key !== "U") return;
      if (showSetup || detailPlayer) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      if (draftState.picks.length === 0) return;
      event.preventDefault();
      undoLastPick();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [detailPlayer, draftState.picks.length, showSetup, undoLastPick]);

  // Every board in this room is a draft board. Once the season starts it stops
  // describing a live market, so say which season it covers rather than letting it
  // look like a surface that quietly stopped working.
  const seasonalWeek = getNflRegularSeasonWeek(draftMetadata?.season ?? 0);

  const userTurnTotal = useMemo(
    () =>
      picksForDisplay.filter(
        (pick) => pick.teamNumber === draftState.settings.userTeam
      ).length,
    [draftState.settings.userTeam, picksForDisplay]
  );
  const draftRecap = useMemo(() => {
    // Computed whenever the board can score it: mid-draft records feed the
    // "recap so far" disclosure, and a completed room with zero records still
    // needs a recap object so the explainer can say why nothing was scored.
    if (!draftSnapshot || (telemetry.records.length === 0 && !isDraftComplete)) {
      return null;
    }
    return resolveDraftTelemetry({
      records: telemetry.records,
      picks: modelPicks,
      players: draftBoardPlayers,
      rankOf: numericDraftRank,
      vorpOf: (playerId) => vorpValues.get(playerId)?.value ?? null,
    });
  }, [
    draftBoardPlayers,
    draftSnapshot,
    isDraftComplete,
    modelPicks,
    telemetry.records,
    vorpValues,
  ]);

  const hasNotices =
    seasonalWeek >= 1 || Boolean(persistenceError) || rankingsStale || adpSourceStale;
  const adpUnavailableReason =
    sourceCapabilities.market.freshness === "prior-season"
      ? ("reference" as const)
      : hasAdpSource
        ? ("stale" as const)
        : ("missing" as const);

  return (
    // The pick clock ticks inside this provider, so a tick renders the one
    // cell that reads it and leaves the room below alone.
    <DraftClockProvider
      currentPick={draftState.currentPick}
      durationSeconds={draftState.settings.timerSeconds ?? 0}
      enabled={timerEnabled}
      isActive={draftState.isActive}
    >
    <section
      className="relative overflow-x-clip min-h-dvh"
      aria-label="Fantasy football draft assistant"
      data-testid="fantasy-draft-tracker-shell"
      data-hydrated={isHydrated ? "true" : "false"}
    >
      <div className={SHELL_CLASS}>
        {/* Setup keeps a headline and the pitch. A running draft gets one compact line. */}
        <header className={showSetup ? "ffb-head ffb-head-setup" : "ffb-head ffb-head-run"}>
          <h1 className="ffb-title">Draft Tracker</h1>
          {showSetup ? (
            <p className="ffb-lede">
              Settings lock when the draft starts. The board logs every pick in the room, not just
              yours.
            </p>
          ) : (
            <p className="ffb-lede">
              {roomLineParts.map((part, index) => (
                <Fragment key={index}>
                  {index > 0 ? <>{" "}<span aria-hidden="true">·</span>{" "}</> : null}
                  <span>{part}</span>
                </Fragment>
              ))}
            </p>
          )}
          <FreshnessParts parts={freshnessParts} />
        </header>

        {/* The room's one announcement. It is mounted on every screen, so the sentence that
            arrives on Start draft is a change inside a region a screen reader already knows. */}
        <p role="status" aria-live="polite" className="sr-only">
          {showSetup || rankingsUnavailable ? "" : roomAnnouncement}
        </p>

        {hasNotices ? (
          <div className="ffb-dt-notices">
            {seasonalWeek >= 1 ? (
              <SeasonalScopeNote season={draftMetadata?.season ?? 0} week={seasonalWeek}>
                This room tracks a draft against the preseason consensus board, and that board stops refreshing once the season is under way, so it is here for next summer. This week&apos;s ranks are on the <Link href="/fantasy-football/weekly">weekly board</Link>.
              </SeasonalScopeNote>
            ) : null}
            {persistenceError ? (
              <div role="status" className="ffb-notice">
                <p className="ffb-notice-title">Local save is unavailable.</p>
                <p>{persistenceError}</p>
              </div>
            ) : null}
            {rankingsStale ? (
              <div role="alert" className="ffb-notice ffb-notice-warn">
                <p>
                  The ranking source is stale, so Draft Outlook and calculated draft signals are paused.
                  You can keep logging picks against the dated board, but check current player news and
                  your room&apos;s market before using it for a live decision.
                </p>
              </div>
            ) : null}
            {!rankingsStale && adpSourceStale ? (
              <div role="status" className="ffb-notice ffb-notice-warn">
                <p>
                  The mock-draft ADP source is stale, so market price signals are hidden. The room is
                  using the current consensus board for its remaining draft signals.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {showSetup ? (
          <DraftSetup
            settings={draftState.settings}
            onSaveSettings={updateSettings}
            onPreviewScoring={setSetupScoringFormat}
            onStartDraft={handleStartFromSetup}
            rankingsStatus={setupRankingsStatus}
            rankingsError={setupRankingsError}
            onRetryRankings={retry}
            canResume={roomSetupOpen && hasRoom}
            onResume={() => {
              setSetupScoringFormat(null);
              setRoomSetupOpen(false);
              requestRoomFocus();
            }}
            // New room swaps the view, so the setup heading takes the focus.
            // On a first visit nothing was pressed, and nothing is moved.
            focusHeadingOnMount={roomSetupOpen}
            parkedPickCount={draftState.picks.length}
          />
        ) : rankingsUnavailable ? (
          <div className="ffb-notice ffb-notice-warn">
            <p className="ffb-notice-title">Draft assistant unavailable for this scoring format</p>
            <p>
              {overallSliceMetadata?.reason ??
                "The draft assistant needs a published overall board. Switch scoring or wait for the next snapshot update."}
            </p>
          </div>
        ) : (
          <>
            {/* The scorebug's cells are this room's own: Pick, Round, On the clock
                with the pick just logged under it, the clock, Your next turn,
                and Pool. A finished draft has nobody on the clock and no next
                turn, so the bar is the pick counter and the pool, and the
                counter's cell takes the focus. */}
            <DraftScorebug
              label="Live draft status"
              sectionRef={fasciaRef}
              className="ffb-dt-bug"
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => {
                      undoLastPick();
                      requestRoomFocus();
                    }}
                    disabled={draftState.picks.length === 0}
                    aria-label={
                      draftState.picks.length === 0 ? "Undo last pick (no picks yet)" : "Undo last pick"
                    }
                    title="Undo last pick"
                    className="ffb-bug-btn"
                  >
                    <Undo2 size={15} aria-hidden="true" />
                    <span className="ffb-bug-long">Undo pick</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      redoLastPick();
                      requestRoomFocus();
                    }}
                    disabled={!canRedo}
                    aria-label={canRedo ? "Redo the last undone pick" : "Redo (nothing to redo)"}
                    title="Redo the last undone pick"
                    className="ffb-bug-btn"
                  >
                    <Redo2 size={15} aria-hidden="true" />
                    <span className="ffb-bug-long">Redo pick</span>
                  </button>
                  <button type="button" onClick={handleNewRoom} className="ffb-bug-btn ffb-bug-btn-quiet">
                    New room
                  </button>
                </>
              }
            >
              <DraftScorebugCell
                label="Pick"
                ref={isDraftComplete ? onClockRef : undefined}
                tabIndex={isDraftComplete ? -1 : undefined}
                className={isDraftComplete ? "ffb-dt-done" : "ffb-dt-cell-pick"}
              >
                {isDraftComplete ? (
                  "Done"
                ) : (
                  <>
                    {/* A phone cell is too narrow for the spaced form, and the counter must never truncate. */}
                    <span className="ffb-only-phone">{`#${draftState.currentPick}/${totalPicks}`}</span>
                    <span className="ffb-not-phone">{`#${draftState.currentPick} / ${totalPicks}`}</span>
                  </>
                )}
              </DraftScorebugCell>
              {isDraftComplete ? null : (
                <>
                  <DraftScorebugCell label="Round" className="ffb-dt-cell-round">
                    {draftState.currentRound} <small>of {draftState.settings.rounds}</small>
                  </DraftScorebugCell>
                  <DraftScorebugCell
                    label="On the clock"
                    live
                    ref={onClockRef}
                    tabIndex={-1}
                    title={onClockLabel}
                    note={
                      previousPick
                        ? `Prev · ${shortName(previousPick.player)} #${previousPick.pickNumber}`
                        : "First overall pick"
                    }
                  >
                    {onClockLabel}
                  </DraftScorebugCell>
                  {clockVisible ? (
                    <DraftClockCell
                      secondsPerPick={draftState.settings.timerSeconds ?? 0}
                      mine={isUserPick}
                      canBeUrgent={timerEnabled && isUserPick}
                    />
                  ) : null}
                  <DraftScorebugCell
                    label={
                      <>
                        <span className="ffb-only-phone">Next turn</span>
                        <span className="ffb-not-phone">Your next turn</span>
                      </>
                    }
                    className="ffb-dt-cell-next"
                  >
                    {nextTurn.value}
                    {nextTurn.note ? <> <small>{nextTurn.note}</small></> : null}
                  </DraftScorebugCell>
                </>
              )}
              {/* The board's own count says the same thing, so the pinned band leaves this cell out on a phone. */}
              <DraftScorebugCell label="Pool" className="ffb-not-phone ffb-dt-cell-pool">
                {draftSnapshot ? (
                  <>
                    {availableBoardPlayers.length} <small>left</small>
                  </>
                ) : (
                  <>
                    — <small>board loading</small>
                  </>
                )}
              </DraftScorebugCell>
            </DraftScorebug>

            {/* The page goes from the h1 to the room's h3 headings with nothing
                between, so name the room here the way the rankings board and the
                mock draft both do. */}
            <h2 className="sr-only">Your draft room</h2>

            <DraftLastPicks
              picks={tapePicks}
              userTeam={draftState.settings.userTeam}
              onUndoToPick={(pickNumber) => {
                undoToPick(pickNumber);
                requestRoomFocus();
              }}
            />

            {/* The scorebug's measured height is where the board's bar and the rail pin. */}
            <div
              className="ffb-work ffb-work-split"
              style={{ "--ffb-sticky-top": `${fasciaHeight}px` } as CSSProperties}
            >
              <div>
                {/* Kept mounted so the note announces when it appears. */}
                <div role="status" aria-live="polite">
                  {specialistNote ? (
                    <div className="ffb-notice ffb-notice-warn ffb-dt-note">
                      <p>{specialistNote}</p>
                      <button
                        type="button"
                        onClick={() => setSpecialistNote(null)}
                        aria-label="Dismiss note"
                        className="ffb-iconbtn"
                      >
                        ✕
                      </button>
                    </div>
                  ) : null}
                </div>

                {stripVisible && bestAvailable && (
                  <section aria-label="Your pick recommendations" className="ffb-block">
                    <div className="ffb-strip-head">
                      <h3 className="ffb-turn-tab">Your pick is live</h3>
                      <button
                        type="button"
                        onClick={() => setShowDecisionDetail((open) => !open)}
                        aria-expanded={showDecisionDetail}
                        aria-controls="draft-decision-strip draft-decision-detail"
                        className="ffb-btn ffb-btn-quiet ffb-noprint"
                      >
                        Why these picks <span aria-hidden="true">{showDecisionDetail ? "▴" : "▾"}</span>
                      </button>
                    </div>
                    {/* Opening "Why these picks" adds each card's reasoning line and the
                        remaining recommendations (the lineup fill, a market value) to
                        this grid, so one Log button exists per player. The four-position
                        panel below carries the long-form reading. The grid's column floor
                        is in the route's stylesheet. */}
                    <div id="draft-decision-strip" className="ffb-strip ffb-dt-strip">
                      <StripPlayerCard
                        label="Best available"
                        player={bestAvailable}
                        publishedRank={publishedDraftRank(bestAvailable)}
                        sub={bestStripSub}
                        detail={
                          showDecisionDetail ? (recByPlayerId.get(bestAvailable.id)?.why ?? null) : null
                        }
                        onOpenDetail={() => setDetailPlayer(bestAvailable)}
                        onLog={() => logPick(bestAvailable)}
                        logLabel={`Log ${bestAvailable.name} as pick ${draftState.currentPick}`}
                        now
                      />

                      {riskPlayer ? (
                        <StripPlayerCard
                          label={`Most at risk${riskDecision ? ` · ${riskDecision.position}` : ""}`}
                          tone="warn"
                          player={riskPlayer}
                          publishedRank={publishedDraftRank(riskPlayer)}
                          sub={riskStripSub}
                          detail={
                            showDecisionDetail && riskPlayer.id !== bestAvailable.id
                              ? (recByPlayerId.get(riskPlayer.id)?.why ?? null)
                              : null
                          }
                          onOpenDetail={() => setDetailPlayer(riskPlayer)}
                          onLog={riskPlayer.id !== bestAvailable.id ? () => logPick(riskPlayer) : undefined}
                          logLabel={`Log ${riskPlayer.name} as pick ${draftState.currentPick}`}
                        />
                      ) : (
                        <div className="ffb-strip-item">
                          <span className="ffb-label ffb-warn">Most at risk</span>
                          <p className="ffb-strip-note">{riskStripSub}</p>
                        </div>
                      )}

                      <div className="ffb-strip-item" title={stripWait.title}>
                        <span className="ffb-label">
                          If you wait{stripWaitPosition ? ` · ${stripWaitPosition}` : ""}
                        </span>
                        <p className="ffb-strip-value">{stripWait.value}</p>
                        <p className="ffb-strip-note">{stripWait.sub}</p>
                      </div>

                      {showDecisionDetail
                        ? extraRecs.map((rec) => (
                            <StripPlayerCard
                              key={`rec-${rec.tag}-${rec.player.id}`}
                              label={rec.tag}
                              player={rec.player}
                              publishedRank={publishedDraftRank(rec.player)}
                              sub={rec.why}
                              detail={rec.why}
                              onOpenDetail={() => setDetailPlayer(rec.player)}
                              onLog={() => logPick(rec.player)}
                              logLabel={`Log ${rec.player.name} as pick ${draftState.currentPick}`}
                            />
                          ))
                        : null}
                    </div>
                  </section>
                )}

                {!isDraftComplete && redraftDecision.guidanceAvailable && !stripVisible ? (
                  <div className="ffb-dt-waitrow ffb-noprint">
                    <button
                      type="button"
                      onClick={() => setShowDecisionDetail((open) => !open)}
                      aria-expanded={showDecisionDetail}
                      aria-controls="draft-decision-detail"
                      className="ffb-btn ffb-btn-quiet"
                    >
                      What changes if you wait <span aria-hidden="true">{showDecisionDetail ? "▴" : "▾"}</span>
                    </button>
                  </div>
                ) : null}

                {!isDraftComplete && redraftDecision.guidanceAvailable && showDecisionDetail ? (
                  <div id="draft-decision-detail" className="ffb-block">
                    <RedraftDecisionPanel
                      report={redraftDecision}
                      onOpenPlayer={setDetailPlayer}
                    />
                  </div>
                ) : null}

                {isDraftComplete && (
                  <div className="ffb-notice ffb-notice-good ffb-block">
                    <p className="ffb-notice-title">Draft complete.</p>
                    <p>Every pick is logged in this room. Start a new room to run it back.</p>
                  </div>
                )}

                {isDraftComplete && draftRecap && draftRecap.totalTurns > 0 && (
                  <div className="ffb-block">
                    <DraftRecapPanel recap={draftRecap} totalUserTurns={userTurnTotal} />
                  </div>
                )}
                {isDraftComplete && draftRecap && draftRecap.totalTurns === 0 && userTurnTotal > 0 && (
                  <p className="ffb-method ffb-block">
                    No model recap. None of your turns carried a recorded recommendation, which
                    usually means draft guidance was unavailable while you picked, for example
                    when the ADP source was stale and the decision strip stayed hidden.
                  </p>
                )}

                {!draftSnapshot ? (
                  <div role="status" className={error ? "ffb-notice ffb-notice-bad" : "ffb-notice"}>
                    <p className="ffb-notice-title">
                      {error
                        ? "Draft board unavailable"
                        : `Loading the ${FANTASY_SCORING_LABELS[scoringKey]} board`}
                    </p>
                    <p>
                      {error
                        ? "Your room and picks are still saved. Retry the published snapshot before logging another pick."
                        : "Your room is ready. Picks, the timer, and Draft Outlook will resume when the matching snapshot finishes loading."}
                    </p>
                    {error ? (
                      <div className="ffb-notice-actions">
                        <button type="button" onClick={retry} className="ffb-btn">
                          Retry rankings
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : !isDraftComplete ? (
                  <>
                  <a
                    href="#your-draft"
                    onClick={(event) => {
                      event.preventDefault();
                      skipToRail();
                    }}
                    className="ffb-btn ffb-skip"
                  >
                    Skip to your roster
                  </a>
                  <DraftBoard
                    players={draftBoardPlayers}
                    draftedPlayerIds={draftedPlayerIds}
                    onDraftPlayer={logPick}
                    onOpenDetail={setDetailPlayer}
                    currentPick={draftState.currentPick}
                    currentRound={draftState.currentRound}
                    adpAvailable={adpAvailable}
                    guidanceAvailable={draftGuidanceAvailable}
                    vorpValues={vorpValues}
                    vorpTeamSize={vorpTeamSize}
                    nextUserPick={nextUserPick}
                  />
                  </>
                ) : analytics ? (
                  <DraftAnalyticsPanel
                    analytics={analytics}
                    picks={modelPicks}
                    currentPick={draftState.currentPick}
                    isDraftComplete
                    userTeamNumber={draftState.settings.userTeam}
                    adpAvailable={adpAvailable}
                    adpUnavailableReason={adpUnavailableReason}
                    getTeamName={getTeamName}
                  />
                ) : null}
              </div>

              <aside ref={railRef} tabIndex={-1} className="ffb-rail ffb-rail-scroll" aria-label="Your draft">
                <DraftRoster
                  assignment={lineupAssignment}
                  picked={userTeam?.picks.length ?? 0}
                  rounds={draftState.settings.rounds}
                />
                <DraftPickGrid
                  picks={picksForDisplay}
                  totalTeams={draftState.settings.totalTeams}
                  userTeam={draftState.settings.userTeam}
                  rounds={draftState.settings.rounds}
                  slotForPick={(pickNumber) =>
                    calculateDraftOrder(pickNumber, draftState.settings.totalTeams, draftState.settings.draftType)
                  }
                  currentPick={draftState.currentPick}
                  currentRound={draftState.currentRound}
                  isComplete={isDraftComplete}
                />
                {draftSnapshot ? (
                  <DraftValuePanel
                    report={userDraftValue}
                    headingId="draft-tracker-outlook-heading"
                    calculatorValue={returnAssumptions}
                    onCalculatorChange={setReturnAssumptions}
                    unavailableReason={draftOutlookUnavailableReason}
                    adpAvailable={adpAvailable}
                  />
                ) : null}
                {draftSnapshot && analytics && !isDraftComplete ? (
                  <DraftAnalyticsPanel
                    analytics={analytics}
                    picks={modelPicks}
                    currentPick={draftState.currentPick}
                    isDraftComplete={false}
                    userTeamNumber={draftState.settings.userTeam}
                    adpAvailable={adpAvailable}
                    adpUnavailableReason={adpUnavailableReason}
                    getTeamName={getTeamName}
                  />
                ) : null}
                {draftSnapshot && !isDraftComplete && draftRecap && draftRecap.totalTurns > 0 ? (
                  <details className="ffb-details">
                    <summary>
                      Model recap so far · {draftRecap.totalTurns} recorded{" "}
                      {draftRecap.totalTurns === 1 ? "turn" : "turns"}
                    </summary>
                    <div className="ffb-details-body">
                      <DraftRecapPanel recap={draftRecap} totalUserTurns={userTurnTotal} />
                    </div>
                  </details>
                ) : null}
                {draftSnapshot ? (
                  <section aria-labelledby="draft-room-actions-heading" className="ffb-noprint">
                    <div className="ffb-sechead">
                      <h3 id="draft-room-actions-heading" className="ffb-h3">
                        Room actions
                      </h3>
                    </div>
                    <div className="ffb-stack ffb-stack-tight">
                      <div className="ffb-cluster">
                        {([
                          { format: "csv", label: "Picks CSV" },
                          { format: "recap-csv", label: "Recap CSV" },
                          { format: "json", label: "JSON" },
                        ] as const).map((option) => (
                          <button
                            key={option.format}
                            type="button"
                            onClick={() => handleExport(option.format)}
                            className="ffb-btn"
                          >
                            {option.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setShowTeamEditor((open) => !open)}
                          aria-expanded={showTeamEditor}
                          className="ffb-btn"
                        >
                          Name the teams <span aria-hidden="true">{showTeamEditor ? "▴" : "▾"}</span>
                        </button>
                      </div>
                      {showTeamEditor && (
                        <div className="ffb-dt-teams">
                          {draftState.teams.map((team) => (
                            <label key={team.teamNumber} className="ffb-field">
                              <span className="ffb-field-label">
                                Slot {team.teamNumber}
                                {team.teamNumber === draftState.settings.userTeam ? " (you)" : ""}
                              </span>
                              <input
                                value={team.teamName ?? ""}
                                onChange={(event) => setTeamName(team.teamNumber, event.target.value)}
                                maxLength={40}
                                placeholder={`Team ${team.teamNumber}`}
                                className="ffb-input"
                              />
                            </label>
                          ))}
                        </div>
                      )}
                      <p className="ffb-method">
                        Change league settings by starting a new room. Active drafts keep one fixed room
                        configuration, and picks stay on this device.
                      </p>
                    </div>
                  </section>
                ) : null}
              </aside>
            </div>

            <p className="ffb-method ffb-method-ruled ffb-dt-foot">
              Advisory clock only, nothing auto-picks at zero · picks stay on this device
            </p>
          </>
        )}
      </div>

      <div aria-live="polite" role="status">
        {exportToast ? <div className="ffb-toast ffb-enter-rise">{exportToast}</div> : null}
      </div>

      <DeferredPlayerDetailDrawer
        player={detailPlayer}
        publishedRank={detailPlayer ? publishedDraftRank(detailPlayer) : undefined}
        boardTierCount={boardTierCount > 0 ? boardTierCount : undefined}
        adpAvailable={adpAvailable}
        compareAvailable={false}
        onLogPick={
          !showSetup &&
          !isDraftComplete &&
          detailPlayer &&
          !draftedPlayerIds.has(detailPlayer.id)
            ? (player) => {
                logPick(player);
                setDetailPlayer(null);
              }
            : undefined
        }
        onClose={() => setDetailPlayer(null)}
      />
    </section>
    </DraftClockProvider>
  );
}
