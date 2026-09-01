import type { DraftPick, Player } from "@/types";

/**
 * Per-turn recommendation telemetry for the redraft tracker. At every user
 * turn the client stores what the decision strip showed at the moment the
 * pick was logged. Outcomes are never stored: they are derived on demand from
 * the room's final pick log, so undone and replayed turns cannot leave stale
 * verdicts behind, and a record whose pick no longer matches the log is
 * simply ignored.
 */

export const DRAFT_TELEMETRY_STORAGE_PREFIX = "fantasy-draft-telemetry-v2-";

export function getDraftTelemetryStorageKey(draftId: string): string {
  return `${DRAFT_TELEMETRY_STORAGE_PREFIX}${draftId}`;
}

export interface DraftTelemetryWaitCandidate {
  playerId: string;
  playerName: string;
  rank: number;
  projectedPointsAboveReplacement: number | null;
}

export interface DraftTurnRecord {
  /** The user's pick number this record describes. */
  pick: number;
  /** The user's following pick at the moment of logging, if any. */
  nextUserPick: number | null;
  chosenPlayerId: string;
  chosenPlayerName: string;
  /** Top of the overall board when the pick was logged. */
  bestAvailableId: string | null;
  bestAvailableName: string | null;
  /** The position the wait reading priced (the strip's "if you wait" cell). */
  waitPosition: string | null;
  /** Best available at that position when the pick was logged. */
  waitBaselineId: string | null;
  waitBaselineName: string | null;
  waitBaselineRank: number | null;
  /** The market-midpoint survivor the model expected at the next turn. */
  expectedSurvivorId: string | null;
  expectedSurvivorName: string | null;
  expectedSurvivorRank: number | null;
  /** Predicted cost of waiting, in consensus spots and projected points. */
  waitCostSpots: number | null;
  waitCostPoints: number | null;
  /** The player the model flagged as most likely to disappear. */
  atRiskPlayerId: string | null;
  atRiskPlayerName: string | null;
  atRiskPosition: string | null;
  /** Every player the recommendation cards offered this turn. */
  recommendedIds: readonly string[];
  /** Identity of the inputs that produced this recommendation. */
  modelVersion: string | null;
  snapshotRevision: string | null;
  rankingAsOf: string | null;
  marketAsOf: string | null;
  vorpAsOf: string | null;
  /**
   * The available board at the priced position when the turn was logged.
   * Keeping ranks and VORP here makes the realized wait result reproducible
   * after the public snapshot changes.
   */
  waitCandidates: readonly DraftTelemetryWaitCandidate[];
  recordedAt: string;
}

export interface DraftTurnOutcome {
  record: DraftTurnRecord;
  /** Whether the user's next turn exists in the log, making the window scoreable. */
  measured: boolean;
  /** Expected survivor still on the board at the next turn; null when the user took him or nothing was predicted. */
  survivorSurvived: boolean | null;
  /** Most-at-risk player drafted by another team before the next turn; null when the user took him or nothing was flagged. */
  atRiskGone: boolean | null;
  followedRecommendation: boolean;
  /** Best player actually available at the priced position when the next turn arrived. */
  realizedBestId: string | null;
  realizedBestName: string | null;
  realizedDropSpots: number | null;
  realizedDropPoints: number | null;
}

export interface DraftTelemetryRecap {
  outcomes: readonly DraftTurnOutcome[];
  totalTurns: number;
  recommendedHits: number;
  survivalMeasured: number;
  survivalCorrect: number;
  atRiskMeasured: number;
  atRiskGone: number;
  realizedDropMeasured: number;
  averagePredictedDropSpots: number | null;
  averageRealizedDropSpots: number | null;
  /** Predicted points cost on the same turns, so the realized figure has a column to calibrate against. */
  averagePredictedDropPoints: number | null;
  averageRealizedDropPoints: number | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function decodeWaitCandidates(value: unknown): DraftTelemetryWaitCandidate[] {
  if (!Array.isArray(value)) return [];
  const candidates: DraftTelemetryWaitCandidate[] = [];
  const seen = new Set<string>();
  for (const entry of value.slice(0, 600)) {
    if (!isRecord(entry)) continue;
    const playerId = stringOrNull(entry.playerId);
    const playerName = stringOrNull(entry.playerName);
    const rank = finiteOrNull(entry.rank);
    if (!playerId || !playerName || rank === null || rank <= 0 || seen.has(playerId)) {
      continue;
    }
    candidates.push({
      playerId,
      playerName,
      rank,
      projectedPointsAboveReplacement: finiteOrNull(
        entry.projectedPointsAboveReplacement
      ),
    });
    seen.add(playerId);
  }
  return candidates.sort((left, right) => left.rank - right.rank);
}

/** Defensive reader for the persisted blob: invalid entries drop, duplicates drop. */
export function decodeDraftTurnRecords(value: unknown): DraftTurnRecord[] {
  if (!Array.isArray(value)) return [];
  const records: DraftTurnRecord[] = [];
  const seen = new Set<number>();
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const pick = entry.pick;
    const chosenPlayerId = stringOrNull(entry.chosenPlayerId);
    const chosenPlayerName = stringOrNull(entry.chosenPlayerName);
    if (
      !Number.isInteger(pick) ||
      (pick as number) < 1 ||
      seen.has(pick as number) ||
      !chosenPlayerId ||
      !chosenPlayerName
    ) {
      continue;
    }
    const nextUserPick = entry.nextUserPick;
    records.push({
      pick: pick as number,
      nextUserPick:
        Number.isInteger(nextUserPick) && (nextUserPick as number) > (pick as number)
          ? (nextUserPick as number)
          : null,
      chosenPlayerId,
      chosenPlayerName,
      bestAvailableId: stringOrNull(entry.bestAvailableId),
      bestAvailableName: stringOrNull(entry.bestAvailableName),
      waitPosition: stringOrNull(entry.waitPosition),
      waitBaselineId: stringOrNull(entry.waitBaselineId),
      waitBaselineName: stringOrNull(entry.waitBaselineName),
      waitBaselineRank: finiteOrNull(entry.waitBaselineRank),
      expectedSurvivorId: stringOrNull(entry.expectedSurvivorId),
      expectedSurvivorName: stringOrNull(entry.expectedSurvivorName),
      expectedSurvivorRank: finiteOrNull(entry.expectedSurvivorRank),
      waitCostSpots: finiteOrNull(entry.waitCostSpots),
      waitCostPoints: finiteOrNull(entry.waitCostPoints),
      atRiskPlayerId: stringOrNull(entry.atRiskPlayerId),
      atRiskPlayerName: stringOrNull(entry.atRiskPlayerName),
      atRiskPosition: stringOrNull(entry.atRiskPosition),
      recommendedIds: Array.isArray(entry.recommendedIds)
        ? entry.recommendedIds.filter((id): id is string => typeof id === "string")
        : [],
      modelVersion: stringOrNull(entry.modelVersion),
      snapshotRevision: stringOrNull(entry.snapshotRevision),
      rankingAsOf: stringOrNull(entry.rankingAsOf),
      marketAsOf: stringOrNull(entry.marketAsOf),
      vorpAsOf: stringOrNull(entry.vorpAsOf),
      waitCandidates: decodeWaitCandidates(entry.waitCandidates),
      recordedAt: stringOrNull(entry.recordedAt) ?? "",
    });
    seen.add(pick as number);
  }
  return records.sort((left, right) => left.pick - right.pick);
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return roundOne(values.reduce((sum, value) => sum + value, 0) / values.length);
}

/**
 * Scores stored per-turn records against the room's final pick log. A record
 * only counts when the logged pick at its number still matches the chosen
 * player, so undone timelines fall out on their own. Realized wait cost is
 * reconstructed from the pick log and the current board rather than stored.
 */
export function resolveDraftTelemetry({
  records,
  picks,
  players,
  rankOf,
  vorpOf,
}: {
  records: readonly DraftTurnRecord[];
  picks: readonly DraftPick[];
  players: readonly Player[];
  rankOf: (player: Player) => number | null;
  vorpOf: (playerId: string) => number | null;
}): DraftTelemetryRecap {
  const pickByNumber = new Map(picks.map((pick) => [pick.pickNumber, pick]));
  const playerById = new Map(players.map((player) => [player.id, player]));
  const valid = [...records]
    .filter((record) => pickByNumber.get(record.pick)?.player.id === record.chosenPlayerId)
    .sort((left, right) => left.pick - right.pick);

  const outcomes: DraftTurnOutcome[] = valid.map((record) => {
    const nextPick = record.nextUserPick;
    const measured = nextPick !== null && pickByNumber.has(nextPick);
    const windowIds = new Set<string>();
    if (nextPick !== null) {
      for (let pickNumber = record.pick + 1; pickNumber < nextPick; pickNumber += 1) {
        const windowPick = pickByNumber.get(pickNumber);
        if (windowPick) windowIds.add(windowPick.player.id);
      }
    }

    const survivorSurvived =
      measured &&
      record.expectedSurvivorId &&
      record.expectedSurvivorId !== record.chosenPlayerId
        ? !windowIds.has(record.expectedSurvivorId)
        : null;
    const atRiskGone =
      measured && record.atRiskPlayerId && record.atRiskPlayerId !== record.chosenPlayerId
        ? windowIds.has(record.atRiskPlayerId)
        : null;

    let realizedBestId: string | null = null;
    let realizedBestName: string | null = null;
    let realizedBestRank: number | null = null;
    let realizedDropSpots: number | null = null;
    let realizedDropPoints: number | null = null;
    if (measured && record.waitPosition) {
      if (record.waitCandidates.length > 0) {
        const baseline = record.waitBaselineId
          ? record.waitCandidates.find(
              (candidate) => candidate.playerId === record.waitBaselineId
            )
          : undefined;
        const realizedBest = record.waitCandidates.find(
          (candidate) => !windowIds.has(candidate.playerId)
        );
        if (realizedBest) {
          realizedBestId = realizedBest.playerId;
          realizedBestName = realizedBest.playerName;
        }
        if (baseline && realizedBest) {
          realizedDropSpots = roundOne(
            Math.max(0, realizedBest.rank - baseline.rank)
          );
          if (
            baseline.projectedPointsAboveReplacement !== null &&
            realizedBest.projectedPointsAboveReplacement !== null
          ) {
            realizedDropPoints = roundOne(
              Math.max(
                0,
                baseline.projectedPointsAboveReplacement -
                  realizedBest.projectedPointsAboveReplacement
              )
            );
          }
        }
      } else {
        // Legacy records do not carry a frozen position board. Keep their old
        // recap behavior, while every v2 record remains tied to its draft-time
        // inputs. The user's own pick is a choice rather than market attrition.
        const takenBeforeNext = new Set<string>();
        for (const loggedPick of picks) {
          if (
            loggedPick.pickNumber < (nextPick as number) &&
            loggedPick.pickNumber !== record.pick
          ) {
            takenBeforeNext.add(loggedPick.player.id);
          }
        }
        let realizedBest: Player | null = null;
        for (const candidate of players) {
          if (
            candidate.position !== record.waitPosition ||
            takenBeforeNext.has(candidate.id)
          ) {
            continue;
          }
          const rank = rankOf(candidate);
          if (rank === null) continue;
          if (realizedBestRank === null || rank < realizedBestRank) {
            realizedBest = candidate;
            realizedBestId = candidate.id;
            realizedBestName = candidate.name;
            realizedBestRank = rank;
          }
        }
        const baselinePlayer = record.waitBaselineId
          ? playerById.get(record.waitBaselineId)
          : undefined;
        const baselineRank = baselinePlayer ? rankOf(baselinePlayer) : null;
        if (realizedBestRank !== null && baselineRank !== null) {
          realizedDropSpots = roundOne(
            Math.max(0, realizedBestRank - baselineRank)
          );
        }
        const baselineVorp = record.waitBaselineId
          ? vorpOf(record.waitBaselineId)
          : null;
        const realizedVorp = realizedBest ? vorpOf(realizedBest.id) : null;
        if (baselineVorp !== null && realizedVorp !== null) {
          realizedDropPoints = roundOne(
            Math.max(0, baselineVorp - realizedVorp)
          );
        }
      }
    }

    return {
      record,
      measured,
      survivorSurvived,
      atRiskGone,
      followedRecommendation: record.recommendedIds.includes(record.chosenPlayerId),
      realizedBestId,
      realizedBestName,
      realizedDropSpots,
      realizedDropPoints,
    };
  });

  const survivorCalls = outcomes.filter((outcome) => outcome.survivorSurvived !== null);
  const atRiskCalls = outcomes.filter((outcome) => outcome.atRiskGone !== null);
  const realizedDrops = outcomes
    .map((outcome) => outcome.realizedDropSpots)
    .filter((value): value is number => value !== null);
  const realizedPointDrops = outcomes
    .map((outcome) => outcome.realizedDropPoints)
    .filter((value): value is number => value !== null);
  // Each predicted average runs over exactly the turns its realized
  // counterpart resolved on, so the two columns share a denominator and read
  // as a calibration pair rather than two averages of different turns.
  const predictedDrops = outcomes
    .filter(
      (outcome) => outcome.realizedDropSpots !== null && outcome.record.waitCostSpots !== null
    )
    .map((outcome) => outcome.record.waitCostSpots as number);
  const predictedPointDrops = outcomes
    .filter(
      (outcome) => outcome.realizedDropPoints !== null && outcome.record.waitCostPoints !== null
    )
    .map((outcome) => outcome.record.waitCostPoints as number);

  return {
    outcomes,
    totalTurns: outcomes.length,
    recommendedHits: outcomes.filter((outcome) => outcome.followedRecommendation).length,
    survivalMeasured: survivorCalls.length,
    survivalCorrect: survivorCalls.filter((outcome) => outcome.survivorSurvived === true).length,
    atRiskMeasured: atRiskCalls.length,
    atRiskGone: atRiskCalls.filter((outcome) => outcome.atRiskGone === true).length,
    realizedDropMeasured: realizedDrops.length,
    averagePredictedDropSpots: average(predictedDrops),
    averageRealizedDropSpots: average(realizedDrops),
    averagePredictedDropPoints: average(predictedPointDrops),
    averageRealizedDropPoints: average(realizedPointDrops),
  };
}
