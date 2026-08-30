"use client";

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { DraftState, DraftSettings, DraftPick, Player, TeamRoster, ScoringFormat } from '@/types';
import {
  classifyPickValue,
  computeDraftAnalytics,
  getPickDelta,
  reconcileTeamRosters,
} from '@/lib/draftAnalytics';
import { DEFAULT_REDRAFT_LINEUP, normalizeRedraftLineup } from '@/lib/redraftLineup';

export const DRAFT_STORAGE_VERSION = 3;
const LEGACY_FANTASY_DRAFT_STORAGE_KEY = 'fantasy-draft-tracker';

/**
 * NFL season for the current draft window. The league year rolls over with
 * the new league year in March, so anything before March belongs to the prior
 * season. Used to scope persisted draft state per-season so a stale 2025
 * draft doesn't bleed into a fresh 2026 setup.
 */
export function getCurrentDraftSeason(now: Date = new Date()): number {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  return month < 2 ? year - 1 : year;
}

export function getFantasyDraftStorageKey(season: number = getCurrentDraftSeason()): string {
  return `fantasy-draft-tracker-v${DRAFT_STORAGE_VERSION}-${season}`;
}

// Exposed for tests and callers that want the active key without recomputing
// the season. Old unversioned key is intentionally NOT migrated — the schema
// has shifted across versions and a one-time forced reset is cleaner than
// guessing how to coerce a legacy payload. We just delete it.
export const FANTASY_DRAFT_STORAGE_KEY = getFantasyDraftStorageKey();
const PREVIOUS_FANTASY_DRAFT_STORAGE_KEY = `fantasy-draft-tracker-v2-${getCurrentDraftSeason()}`;

// Default draft settings
export const getDefaultSettings = (): DraftSettings => ({
  totalTeams: 12,
  userTeam: 1,
  scoringFormat: 'PPR' as ScoringFormat,
  draftType: 'snake',
  rounds: 15,
  lineup: { ...DEFAULT_REDRAFT_LINEUP },
  timerSeconds: 90,
  leagueName: 'My Fantasy League',
  draftDate: new Date(),
});

// Initialize empty team rosters
export const initializeTeams = (totalTeams: number): TeamRoster[] => {
  return Array.from({ length: totalTeams }, (_, index) => ({
    teamNumber: index + 1,
    teamName: `Team ${index + 1}`,
    picks: [],
    positionCounts: {
      QB: 0,
      RB: 0,
      WR: 0,
      TE: 0,
      K: 0,
      DST: 0,
    },
    totalValue: 0,
    projectedPoints: 0,
  }));
};

// Rebuild every team roster from a flat list of kept picks. Used by multi-level
// undo so position counts and value totals stay exactly consistent with the
// remaining picks instead of being decremented one at a time.
const rebuildTeams = (
  totalTeams: number,
  picks: DraftPick[],
  previousTeams: readonly TeamRoster[] = []
): TeamRoster[] => {
  const teams = initializeTeams(totalTeams);
  for (const previousTeam of previousTeams) {
    const team = teams[previousTeam.teamNumber - 1];
    if (team && typeof previousTeam.teamName === 'string') {
      team.teamName = previousTeam.teamName;
    }
  }
  for (const pick of picks) {
    const team = teams[pick.teamNumber - 1];
    if (!team) continue;
    team.picks.push(pick);
    if (pick.player.position !== 'FLEX' && pick.player.position !== 'OVERALL') {
      team.positionCounts[pick.player.position as keyof typeof team.positionCounts]++;
    }
    team.totalValue += pick.player.auctionValue || 0;
    team.projectedPoints += pick.player.projectedPoints || 0;
  }
  return teams;
};

// Calculate draft order for snake draft
export const calculateDraftOrder = (pick: number, totalTeams: number, draftType: 'snake' | 'linear'): number => {
  if (draftType === 'linear') {
    return ((pick - 1) % totalTeams) + 1;
  }
  
  // Snake draft logic
  const round = Math.ceil(pick / totalTeams);
  const positionInRound = ((pick - 1) % totalTeams) + 1;
  
  if (round % 2 === 1) {
    // Odd rounds: 1, 2, 3, ..., totalTeams
    return positionInRound;
  } else {
    // Even rounds: totalTeams, ..., 3, 2, 1
    return totalTeams - positionInRound + 1;
  }
};

// Calculate current round
export const calculateCurrentRound = (pick: number, totalTeams: number): number => {
  return Math.ceil(pick / totalTeams);
};

const calculateCappedCurrentRound = (
  pick: number,
  totalTeams: number,
  rounds: number
): number => Math.min(rounds, calculateCurrentRound(pick, totalTeams));

type UnknownRecord = Record<string, unknown>;

const SUPPORTED_TEAM_COUNTS = [8, 10, 12, 14, 16] as const;
const SUPPORTED_ROUND_COUNTS = [13, 14, 15, 16, 17, 18] as const;
const SUPPORTED_TIMER_SECONDS = [0, 45, 60, 90, 120, 180] as const;
const DRAFT_ROSTER_POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'] as const;
type DraftRosterPosition = (typeof DRAFT_ROSTER_POSITIONS)[number];

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isDraftRosterPosition(value: unknown): value is DraftRosterPosition {
  return DRAFT_ROSTER_POSITIONS.includes(value as DraftRosterPosition);
}

function nearestSupportedInteger(
  value: unknown,
  supported: readonly number[],
  fallback: number
): number {
  if (!isFiniteNumber(value)) return fallback;
  const rounded = Math.round(value);
  return supported.reduce((nearest, candidate) =>
    Math.abs(candidate - rounded) < Math.abs(nearest - rounded) ? candidate : nearest
  );
}

function clampInteger(value: unknown, minimum: number, maximum: number, fallback: number): number {
  if (!isFiniteNumber(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

function decodeDate(value: unknown): Date | undefined {
  if (!(typeof value === 'string' || typeof value === 'number' || value instanceof Date)) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function decodeDraftSettings(value: unknown): DraftSettings {
  const defaults = getDefaultSettings();
  const record = isRecord(value) ? value : {};
  const totalTeams = nearestSupportedInteger(
    record.totalTeams,
    SUPPORTED_TEAM_COUNTS,
    defaults.totalTeams
  );
  const rounds = nearestSupportedInteger(
    record.rounds,
    SUPPORTED_ROUND_COUNTS,
    defaults.rounds
  );
  const scoringFormat =
    record.scoringFormat === 'STANDARD' ||
    record.scoringFormat === 'PPR' ||
    record.scoringFormat === 'HALF_PPR'
      ? record.scoringFormat
      : defaults.scoringFormat;
  const draftType =
    record.draftType === 'snake' || record.draftType === 'linear'
      ? record.draftType
      : defaults.draftType;
  const timerSeconds = nearestSupportedInteger(
    record.timerSeconds,
    SUPPORTED_TIMER_SECONDS,
    defaults.timerSeconds ?? 90
  );
  const draftDate = decodeDate(record.draftDate) ?? defaults.draftDate;

  return {
    totalTeams,
    userTeam: clampInteger(record.userTeam, 1, totalTeams, defaults.userTeam),
    scoringFormat,
    draftType,
    rounds,
    lineup: normalizeRedraftLineup(
      isRecord(record.lineup) ? record.lineup as Partial<DraftSettings['lineup']> : undefined
    ),
    timerSeconds,
    leagueName:
      typeof record.leagueName === 'string'
        ? record.leagueName.slice(0, 60)
        : defaults.leagueName,
    draftDate,
  };
}

function decodePlayer(value: unknown): Player | null {
  if (!isRecord(value)) return null;

  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const team = typeof value.team === 'string' ? value.team.trim() : null;
  const averageRank = [value.averageRank, value.rankEcr, value.rank, value.positionRank]
    .find((rank): rank is number => isFiniteNumber(rank) && rank > 0);
  if (!id || !name || team === null || !isDraftRosterPosition(value.position) || !averageRank) {
    return null;
  }

  const player: Player = {
    id: id.slice(0, 200),
    name: name.slice(0, 200),
    team: team.slice(0, 20),
    position: value.position,
    averageRank,
  };

  if (isFiniteNumber(value.standardDeviation) && value.standardDeviation >= 0) {
    player.standardDeviation = value.standardDeviation;
  }

  const numericFields = [
    'projectedPoints',
    'tier',
    'positionRank',
    'minRank',
    'maxRank',
    'byeWeek',
    'adp',
    'adpHigh',
    'adpLow',
    'adpStandardDeviation',
    'adpTimesDrafted',
    'ownership',
    'rankAverage',
    'rankEcr',
    'superflexRank',
    'superflexTier',
    'overallValue',
    'auctionValue',
    'expertCount',
  ] as const satisfies ReadonlyArray<keyof Player>;
  for (const field of numericFields) {
    const fieldValue = value[field];
    if (isFiniteNumber(fieldValue)) {
      (player as unknown as UnknownRecord)[field] = fieldValue;
    }
  }

  if (Array.isArray(value.expertRanks)) {
    const expertRanks = value.expertRanks.filter(isFiniteNumber);
    if (expertRanks.length > 0) player.expertRanks = expertRanks;
  }
  if (typeof value.lastUpdated === 'string') player.lastUpdated = value.lastUpdated;
  if (typeof value.headshotUrl === 'string') player.headshotUrl = value.headshotUrl;
  if (typeof value.teamLogoUrl === 'string') player.teamLogoUrl = value.teamLogoUrl;
  if (typeof value.upside === 'string') player.upside = value.upside;
  if (typeof value.downside === 'string') player.downside = value.downside;
  if (typeof value.bottomLine === 'string') player.bottomLine = value.bottomLine;
  if (
    value.consensusLevel === 'high' ||
    value.consensusLevel === 'medium' ||
    value.consensusLevel === 'low'
  ) {
    player.consensusLevel = value.consensusLevel;
  }

  return player;
}

function decodePick(value: unknown): DraftPick | null {
  if (!isRecord(value)) return null;
  const player = decodePlayer(value.player);
  const timestamp = decodeDate(value.timestamp);
  if (
    !player ||
    !timestamp ||
    !Number.isInteger(value.pickNumber) ||
    !Number.isInteger(value.round) ||
    !Number.isInteger(value.teamNumber)
  ) {
    return null;
  }

  return {
    pickNumber: Number(value.pickNumber),
    round: Number(value.round),
    teamNumber: Number(value.teamNumber),
    player,
    timestamp,
    pickTimeSeconds: clampInteger(value.pickTimeSeconds, 0, 3600, 0),
    isKeeper: value.isKeeper === true,
  };
}

function pickMatchesDraftOrder(pick: DraftPick, settings: DraftSettings): boolean {
  return (
    pick.round === calculateCurrentRound(pick.pickNumber, settings.totalTeams) &&
    pick.teamNumber ===
      calculateDraftOrder(pick.pickNumber, settings.totalTeams, settings.draftType)
  );
}

function decodePicks(value: unknown, settings: DraftSettings): DraftPick[] {
  if (!Array.isArray(value)) return [];
  const candidates = value
    .map(decodePick)
    .filter((pick): pick is DraftPick => pick !== null)
    .sort((left, right) => left.pickNumber - right.pickNumber);
  const totalPicks = settings.totalTeams * settings.rounds;
  const kept: DraftPick[] = [];
  const playerIds = new Set<string>();

  for (const pick of candidates) {
    const expectedPickNumber = kept.length + 1;
    if (
      pick.pickNumber !== expectedPickNumber ||
      pick.pickNumber > totalPicks ||
      !pickMatchesDraftOrder(pick, settings) ||
      playerIds.has(pick.player.id)
    ) {
      break;
    }
    kept.push(pick);
    playerIds.add(pick.player.id);
  }

  return kept;
}

function decodeUndoHistory(
  value: unknown,
  settings: DraftSettings,
  picks: readonly DraftPick[]
): DraftPick[] {
  if (!Array.isArray(value)) return [];
  const decoded = value.map(decodePick);
  if (decoded.some((pick) => pick === null)) return [];

  const history = decoded as DraftPick[];
  const totalPicks = settings.totalTeams * settings.rounds;
  const usedPickNumbers = new Set(picks.map((pick) => pick.pickNumber));
  const usedPlayerIds = new Set(picks.map((pick) => pick.player.id));
  let expectedPickNumber = picks.length + history.length;

  for (const pick of history) {
    if (
      pick.pickNumber !== expectedPickNumber ||
      pick.pickNumber > totalPicks ||
      !pickMatchesDraftOrder(pick, settings) ||
      usedPickNumbers.has(pick.pickNumber) ||
      usedPlayerIds.has(pick.player.id)
    ) {
      return [];
    }
    usedPickNumbers.add(pick.pickNumber);
    usedPlayerIds.add(pick.player.id);
    expectedPickNumber -= 1;
  }

  return history;
}

function decodeTeamNames(value: unknown, totalTeams: number): Map<number, string> {
  const names = new Map<number, string>();
  if (!Array.isArray(value)) return names;

  for (const team of value) {
    if (
      !isRecord(team) ||
      !Number.isInteger(team.teamNumber) ||
      Number(team.teamNumber) < 1 ||
      Number(team.teamNumber) > totalTeams ||
      typeof team.teamName !== 'string' ||
      names.has(Number(team.teamNumber))
    ) {
      continue;
    }
    const name = team.teamName.trim().slice(0, 40);
    if (name) names.set(Number(team.teamNumber), name);
  }

  return names;
}

function decodePersistedDraftState(value: unknown): DraftState {
  const record = isRecord(value) ? value : {};
  const settings = decodeDraftSettings(record.settings);
  const picks = decodePicks(record.picks, settings);
  const undoHistory = decodeUndoHistory(record.undoHistory, settings, picks);
  const teams = rebuildTeams(settings.totalTeams, picks);
  const teamNames = decodeTeamNames(record.teams, settings.totalTeams);
  for (const team of teams) {
    const teamName = teamNames.get(team.teamNumber);
    if (teamName) team.teamName = teamName;
  }

  const totalPicks = settings.totalTeams * settings.rounds;
  const currentPick = picks.length + 1;
  const isComplete = picks.length >= totalPicks;
  const hadPersistedPicks = Array.isArray(record.picks) && record.picks.length > 0;
  const startTime = decodeDate(record.startTime);
  const endTime = isComplete ? decodeDate(record.endTime) : undefined;
  const draftId =
    typeof record.draftId === 'string' && record.draftId.trim()
      ? record.draftId.trim().slice(0, 100)
      : generateDraftId();

  return {
    settings,
    picks,
    currentPick,
    currentRound: calculateCappedCurrentRound(currentPick, settings.totalTeams, settings.rounds),
    isActive:
      !isComplete &&
      (picks.length > 0 || (!hadPersistedPicks && record.isActive === true)),
    undoHistory,
    teams,
    draftId,
    ...(startTime ? { startTime } : {}),
    ...(endTime ? { endTime } : {}),
  };
}

// Generate unique draft ID
const generateDraftId = (): string => {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

// Escape a single CSV field per RFC 4180: wrap in quotes and double any
// embedded quotes when the value contains a comma, quote, or newline. NFL
// player names are usually comma-free, but this keeps the export from breaking
// on the occasional edge case.
const escapeCsvValue = (value: string | number): string => {
  const stringValue = String(value);
  return /[",\n\r]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
};

export const useDraftState = () => {
  const [draftState, setDraftState] = useState<DraftState>(() => {
    // Initialize with default state
    const settings = getDefaultSettings();
    return {
      settings,
      picks: [],
      currentPick: 1,
      currentRound: 1,
      isActive: false,
      undoHistory: [],
      teams: initializeTeams(settings.totalTeams),
      draftId: generateDraftId(),
    };
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // One-time cleanup: if the old unversioned key is still hanging around,
      // drop it. We do not attempt to migrate the payload — the schema has
      // shifted across versions and forcing a fresh start is safer than
      // silently restoring a partially-compatible draft.
      try {
        if (localStorage.getItem(LEGACY_FANTASY_DRAFT_STORAGE_KEY) !== null) {
          localStorage.removeItem(LEGACY_FANTASY_DRAFT_STORAGE_KEY);
        }
      } catch {
        // Ignore — localStorage may be disabled or full; we'll just skip.
      }

      let saved: string | null = null;
      let loadedPreviousVersion = false;
      try {
        saved = localStorage.getItem(FANTASY_DRAFT_STORAGE_KEY);
        if (!saved) {
          saved = localStorage.getItem(PREVIOUS_FANTASY_DRAFT_STORAGE_KEY);
          loadedPreviousVersion = saved !== null;
        }
      } catch {
        // The tracker remains fully usable in memory when browser storage is
        // blocked. Surface that limitation instead of letting the page crash.
        // eslint-disable-next-line react-hooks/set-state-in-effect -- report an external storage failure detected during hydration
        setPersistenceError("This draft is running in this tab, but your browser is blocking local saves.");
      }
      if (saved) {
        try {
          const decodedState = decodePersistedDraftState(JSON.parse(saved));
          setDraftState(decodedState);
          if (loadedPreviousVersion) {
            try {
              localStorage.setItem(FANTASY_DRAFT_STORAGE_KEY, JSON.stringify(decodedState));
              localStorage.removeItem(PREVIOUS_FANTASY_DRAFT_STORAGE_KEY);
            } catch {
              // The migrated state still runs in memory if the write is blocked.
            }
          }
        } catch (error) {
          logger.error("Draft state failed to load from localStorage", error);
          // Persisted blob is corrupt — drop it so we start clean on next save
          // instead of looping through this catch on every mount.
          try {
            localStorage.removeItem(FANTASY_DRAFT_STORAGE_KEY);
            if (loadedPreviousVersion) {
              localStorage.removeItem(PREVIOUS_FANTASY_DRAFT_STORAGE_KEY);
            }
          } catch {
            // Same as above — best-effort.
          }
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever state changes (after initial load)
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      const saveState = { ...draftState };
      try {
        localStorage.setItem(FANTASY_DRAFT_STORAGE_KEY, JSON.stringify(saveState));
      } catch {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- report an external storage failure detected while persisting
        setPersistenceError("This draft is running in this tab, but changes cannot be saved locally.");
      }
    }
  }, [draftState, isLoaded]);

  // Update draft settings
  const updateSettings = useCallback((newSettings: Partial<DraftSettings>) => {
    setDraftState(prev => {
      const mergedSettings = { ...prev.settings, ...newSettings };
      const normalizedUserTeam = Math.min(mergedSettings.userTeam, mergedSettings.totalTeams);

      return {
        ...prev,
        settings: {
          ...mergedSettings,
          userTeam: normalizedUserTeam,
          lineup: normalizeRedraftLineup(mergedSettings.lineup),
        },
        teams:
          newSettings.totalTeams !== undefined &&
          newSettings.totalTeams !== prev.settings.totalTeams
            ? rebuildTeams(mergedSettings.totalTeams, prev.picks, prev.teams)
            : prev.teams,
      };
    });
  }, []);

  const startDraft = useCallback(() => {
    setDraftState((prev) => ({
      ...prev,
      isActive: true,
      startTime: prev.startTime ?? new Date(),
    }));
  }, []);

  // Draft a player
  const draftPlayer = useCallback((player: Player) => {
    setDraftState(prev => {
      const totalPicks = prev.settings.totalTeams * prev.settings.rounds;
      if (
        prev.currentPick > totalPicks ||
        prev.picks.some((pick) => pick.player.id === player.id)
      ) {
        return prev;
      }

      const currentTeam = calculateDraftOrder(prev.currentPick, prev.settings.totalTeams, prev.settings.draftType);
      const currentRound = calculateCurrentRound(prev.currentPick, prev.settings.totalTeams);
      
      const pick: DraftPick = {
        pickNumber: prev.currentPick,
        round: currentRound,
        teamNumber: currentTeam,
        player,
        timestamp: new Date(),
        pickTimeSeconds: 0,
        isKeeper: false,
      };

      // Update team roster
      const updatedTeams = prev.teams.map(team => {
        if (team.teamNumber === currentTeam) {
          const newPositionCounts = { ...team.positionCounts };
          if (player.position !== 'FLEX' && player.position !== 'OVERALL') {
            newPositionCounts[player.position as keyof typeof newPositionCounts]++;
          }
          
          return {
            ...team,
            picks: [...team.picks, pick],
            positionCounts: newPositionCounts,
            totalValue: team.totalValue + (player.auctionValue || 0),
            projectedPoints: team.projectedPoints + (player.projectedPoints || 0),
          };
        }
        return team;
      });

      const isComplete = prev.currentPick >= totalPicks;
      
      return {
        ...prev,
        picks: [...prev.picks, pick],
        currentPick: prev.currentPick + 1,
        currentRound: calculateCappedCurrentRound(
          prev.currentPick + 1,
          prev.settings.totalTeams,
          prev.settings.rounds
        ),
        teams: updatedTeams,
        isActive: !isComplete,
        endTime: isComplete ? new Date() : prev.endTime,
        startTime: prev.picks.length === 0 ? new Date() : prev.startTime,
        // A fresh manual pick branches the timeline, so any redo stack from a
        // prior undo no longer applies.
        undoHistory: [],
      };
    });
  }, []);

  // Undo last pick
  const undoLastPick = useCallback(() => {
    setDraftState(prev => {
      if (prev.picks.length === 0) return prev;
      
      const lastPick = prev.picks[prev.picks.length - 1];
      const updatedPicks = prev.picks.slice(0, -1);
      
      // Update team rosters
      const updatedTeams = prev.teams.map(team => {
        if (team.teamNumber === lastPick.teamNumber) {
          const teamPicks = team.picks.filter(pick => pick.pickNumber !== lastPick.pickNumber);
          const newPositionCounts = { ...team.positionCounts };
          
          if (lastPick.player.position !== 'FLEX' && lastPick.player.position !== 'OVERALL') {
            newPositionCounts[lastPick.player.position as keyof typeof newPositionCounts]--;
          }
          
          return {
            ...team,
            picks: teamPicks,
            positionCounts: newPositionCounts,
            totalValue: team.totalValue - (lastPick.player.auctionValue || 0),
            projectedPoints: team.projectedPoints - (lastPick.player.projectedPoints || 0),
          };
        }
        return team;
      });

      return {
        ...prev,
        picks: updatedPicks,
        currentPick: lastPick.pickNumber,
        currentRound: calculateCurrentRound(lastPick.pickNumber, prev.settings.totalTeams),
        teams: updatedTeams,
        undoHistory: [...prev.undoHistory, lastPick],
        isActive: true,
        endTime: undefined,
      };
    });
  }, []);

  // Redo the most recently undone pick, replaying it at the current slot.
  const redoLastPick = useCallback(() => {
    setDraftState(prev => {
      if (prev.undoHistory.length === 0) return prev;
      const totalPicks = prev.settings.totalTeams * prev.settings.rounds;
      if (prev.currentPick > totalPicks) return prev;

      const player = prev.undoHistory[prev.undoHistory.length - 1].player;
      if (prev.picks.some((pick) => pick.player.id === player.id)) return prev;
      const currentTeam = calculateDraftOrder(prev.currentPick, prev.settings.totalTeams, prev.settings.draftType);
      const currentRound = calculateCurrentRound(prev.currentPick, prev.settings.totalTeams);

      const pick: DraftPick = {
        pickNumber: prev.currentPick,
        round: currentRound,
        teamNumber: currentTeam,
        player,
        timestamp: new Date(),
        pickTimeSeconds: 0,
        isKeeper: false,
      };

      const updatedTeams = prev.teams.map(team => {
        if (team.teamNumber === currentTeam) {
          const newPositionCounts = { ...team.positionCounts };
          if (player.position !== 'FLEX' && player.position !== 'OVERALL') {
            newPositionCounts[player.position as keyof typeof newPositionCounts]++;
          }
          return {
            ...team,
            picks: [...team.picks, pick],
            positionCounts: newPositionCounts,
            totalValue: team.totalValue + (player.auctionValue || 0),
            projectedPoints: team.projectedPoints + (player.projectedPoints || 0),
          };
        }
        return team;
      });

      const isComplete = prev.currentPick >= totalPicks;
      return {
        ...prev,
        picks: [...prev.picks, pick],
        currentPick: prev.currentPick + 1,
        currentRound: calculateCappedCurrentRound(
          prev.currentPick + 1,
          prev.settings.totalTeams,
          prev.settings.rounds
        ),
        teams: updatedTeams,
        isActive: !isComplete,
        endTime: isComplete ? new Date() : prev.endTime,
        undoHistory: prev.undoHistory.slice(0, -1),
      };
    });
  }, []);

  // Undo every pick back to (and including) a target pick number, rebuilding the
  // affected rosters in one pass. Undone picks land on the redo stack newest-out.
  const undoToPick = useCallback((targetPickNumber: number) => {
    setDraftState(prev => {
      const removed = prev.picks.filter(pick => pick.pickNumber >= targetPickNumber);
      if (removed.length === 0) return prev;

      const keptPicks = prev.picks.filter(pick => pick.pickNumber < targetPickNumber);
      const newCurrentPick = keptPicks.length + 1;

      return {
        ...prev,
        picks: keptPicks,
        teams: rebuildTeams(prev.settings.totalTeams, keptPicks, prev.teams),
        currentPick: newCurrentPick,
        currentRound: calculateCurrentRound(newCurrentPick, prev.settings.totalTeams),
        undoHistory: [
          ...prev.undoHistory,
          ...[...removed].sort((left, right) => right.pickNumber - left.pickNumber),
        ],
        isActive: true,
        endTime: undefined,
      };
    });
  }, []);

  // Rename a team in the room (league-mate personalization).
  const setTeamName = useCallback((teamNumber: number, name: string) => {
    setDraftState(prev => ({
      ...prev,
      teams: prev.teams.map(team =>
        team.teamNumber === teamNumber ? { ...team, teamName: name.slice(0, 40) } : team
      ),
    }));
  }, []);

  // Reset draft
  const resetDraft = useCallback(() => {
    setDraftState(prev => ({
      settings: prev.settings,
      picks: [],
      currentPick: 1,
      currentRound: 1,
      isActive: false,
      undoHistory: [],
      teams: rebuildTeams(prev.settings.totalTeams, [], prev.teams),
      draftId: generateDraftId(),
    }));
  }, []);

  // Resolve a team's display name, falling back to "Team N".
  const resolveTeamName = useCallback(
    (teamNumber: number) => {
      const team = draftState.teams.find((entry) => entry.teamNumber === teamNumber);
      return team?.teamName?.trim() || `Team ${teamNumber}`;
    },
    [draftState.teams]
  );

  function downloadBlob(parts: BlobPart[], type: string, filename: string) {
    const blob = new Blob(parts, { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toCsv(rows: (string | number)[][]): string {
    // CRLF row endings per RFC 4180.
    return rows.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');
  }

  // Export draft results. CSV is the per-pick log (now with value deltas,
  // steal/reach flags, team names, and your private notes); recap-csv is one row
  // per team with market deltas and roster coverage; json is the full structured blob.
  const exportDraftResults = useCallback(
    (
      format: 'csv' | 'json' | 'recap-csv',
      options: { notes?: Record<string, string>; picks?: DraftPick[] } = {}
    ) => {
      const notes = options.notes ?? {};
      const exportPicks = options.picks ?? draftState.picks;
      const exportTeams = reconcileTeamRosters(draftState.teams, exportPicks);

      if (format === 'csv') {
        const headers = [
          'Pick', 'Round', 'Team', 'Player', 'Position', 'NFL Team', 'Consensus Rank',
          'Tier', 'Expert Range', 'ADP', 'Value Delta', 'Signal', 'Note',
        ];
        const rows: (string | number)[][] = exportPicks.map((pick) => {
          const delta = getPickDelta(pick);
          const signal = classifyPickValue(pick);
          const consensusRank = Number.isFinite(pick.player.rankEcr)
            ? Number(pick.player.rankEcr)
            : Number.isFinite(pick.player.averageRank)
              ? pick.player.averageRank
              : '';
          return [
            pick.pickNumber,
            pick.round,
            resolveTeamName(pick.teamNumber),
            pick.player.name,
            pick.player.position,
            pick.player.team,
            consensusRank,
            pick.player.tier ? `Tier ${pick.player.tier}` : '',
            pick.player.minRank !== undefined && pick.player.maxRank !== undefined
              ? `${pick.player.minRank}-${pick.player.maxRank}`
              : '',
            typeof pick.player.adp === 'number' && Number.isFinite(pick.player.adp)
              ? pick.player.adp.toFixed(1)
              : '',
            delta === null ? '' : delta,
            signal ?? '',
            notes[pick.player.id] ?? '',
          ];
        });

        // UTF-8 BOM so Excel on Windows doesn't garble accented player names.
        downloadBlob(
          ['\uFEFF', toCsv([headers, ...rows])],
          'text/csv;charset=utf-8',
          `draft-results-${draftState.draftId}.csv`
        );
        return;
      }

      if (format === 'recap-csv') {
        const analytics = computeDraftAnalytics(exportPicks, exportTeams, {
          lineup: draftState.settings.lineup,
          rounds: draftState.settings.rounds,
        });
        const headers = [
          'Team', 'Net Market Value', 'Depth Targets Met', 'Open Starting Slots', 'QB', 'RB', 'WR', 'TE', 'K', 'DST',
        ];
        const rows: (string | number)[][] = [...analytics.teamStrengths]
          .sort((left, right) => (right.valueTotal ?? 0) - (left.valueTotal ?? 0))
          .map((team) => {
            const counts =
              exportTeams.find((entry) => entry.teamNumber === team.teamNumber)?.positionCounts;
            return [
              resolveTeamName(team.teamNumber),
              team.valueTotal ?? 0,
              team.strengths.join(' '),
              team.weaknesses.join(' '),
              counts?.QB ?? 0,
              counts?.RB ?? 0,
              counts?.WR ?? 0,
              counts?.TE ?? 0,
              counts?.K ?? 0,
              counts?.DST ?? 0,
            ];
          });

        downloadBlob(
          ['\uFEFF', toCsv([headers, ...rows])],
          'text/csv;charset=utf-8',
          `draft-recap-${draftState.draftId}.csv`
        );
        return;
      }

      const exportData = {
        settings: draftState.settings,
        picks: exportPicks,
        teams: exportTeams,
        analytics: computeDraftAnalytics(exportPicks, exportTeams, {
          lineup: draftState.settings.lineup,
          rounds: draftState.settings.rounds,
        }),
        draftId: draftState.draftId,
        exportDate: new Date().toISOString(),
      };
      downloadBlob(
        [JSON.stringify(exportData, null, 2)],
        'application/json',
        `draft-results-${draftState.draftId}.json`
      );
    },
    [draftState, resolveTeamName]
  );

  // Computed values
  const isDraftComplete = useMemo(() => {
    const totalPicks = draftState.settings.totalTeams * draftState.settings.rounds;
    return draftState.currentPick > totalPicks;
  }, [draftState.currentPick, draftState.settings.totalTeams, draftState.settings.rounds]);

  const isUserPick = useMemo(() => {
    const currentTeam = calculateDraftOrder(draftState.currentPick, draftState.settings.totalTeams, draftState.settings.draftType);
    return currentTeam === draftState.settings.userTeam && !isDraftComplete;
  }, [draftState.currentPick, draftState.settings.totalTeams, draftState.settings.draftType, draftState.settings.userTeam, isDraftComplete]);

  const currentTeamNumber = useMemo(() => {
    return calculateDraftOrder(draftState.currentPick, draftState.settings.totalTeams, draftState.settings.draftType);
  }, [draftState.currentPick, draftState.settings.totalTeams, draftState.settings.draftType]);

  const currentTeamName = useMemo(() => {
    if (isDraftComplete) return 'Draft Complete';
    const resolvedName = resolveTeamName(currentTeamNumber);
    if (currentTeamNumber !== draftState.settings.userTeam) return resolvedName;
    return resolvedName === `Team ${currentTeamNumber}` ? 'Your Turn' : `${resolvedName} (you)`;
  }, [currentTeamNumber, draftState.settings.userTeam, isDraftComplete, resolveTeamName]);

  const userTeam = useMemo(() => {
    return draftState.teams.find(team => team.teamNumber === draftState.settings.userTeam);
  }, [draftState.teams, draftState.settings.userTeam]);

  const canRedo = draftState.undoHistory.length > 0 && !isDraftComplete;

  return {
    draftState,
    updateSettings,
    startDraft,
    draftPlayer,
    undoLastPick,
    redoLastPick,
    undoToPick,
    setTeamName,
    getTeamName: resolveTeamName,
    canRedo,
    resetDraft,
    exportDraftResults,
    isUserPick,
    isDraftComplete,
    currentTeamNumber,
    currentTeamName,
    userTeam,
    isLoaded,
    persistenceError,
  };
};
