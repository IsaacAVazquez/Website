"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DraftState, DraftSettings, DraftPick, Player, TeamRoster, ScoringFormat } from '@/types';
import { classifyPickValue, computeDraftAnalytics, getPickDelta } from '@/lib/draftAnalytics';

export const DRAFT_STORAGE_VERSION = 2;
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

interface PersistedDraftState extends Omit<DraftState, 'settings' | 'picks' | 'startTime' | 'endTime'> {
  settings?: DraftSettings & {
    draftDate?: string | Date;
  };
  startTime?: string | Date;
  endTime?: string | Date;
  picks?: Array<Omit<DraftPick, 'timestamp'> & { timestamp: string | Date }>;
}

// Default draft settings
export const getDefaultSettings = (): DraftSettings => ({
  totalTeams: 10,
  userTeam: 1,
  scoringFormat: 'PPR' as ScoringFormat,
  draftType: 'snake',
  rounds: 15,
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
const rebuildTeams = (totalTeams: number, picks: DraftPick[]): TeamRoster[] => {
  const teams = initializeTeams(totalTeams);
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

      const saved = localStorage.getItem(FANTASY_DRAFT_STORAGE_KEY);
      if (saved) {
        try {
          const parsedState = JSON.parse(saved) as PersistedDraftState;
          // Ensure dates are properly parsed
          if (parsedState.settings?.draftDate) {
            parsedState.settings.draftDate = new Date(parsedState.settings.draftDate);
          }
          if (parsedState.startTime) {
            parsedState.startTime = new Date(parsedState.startTime);
          }
          if (parsedState.endTime) {
            parsedState.endTime = new Date(parsedState.endTime);
          }
          // Parse pick timestamps
          if (parsedState.picks) {
            parsedState.picks = parsedState.picks.map((pick) => ({
              ...pick,
              timestamp: new Date(pick.timestamp),
            }));
          }
          // Hydrate over full defaults so a blob written by an older build
          // (same storage version, smaller shape — e.g. before undoHistory,
          // teams, or draftId existed) can't strand the tracker with
          // undefined fields. Guarded fields fall back individually; teams
          // are rebuilt from the kept picks so rosters stay consistent.
          const mergedSettings: DraftSettings = {
            ...getDefaultSettings(),
            ...(parsedState.settings ?? {}),
          } as DraftSettings;
          const mergedPicks = (parsedState.picks ?? []) as DraftPick[];
          const defaults: DraftState = {
            settings: mergedSettings,
            picks: [],
            currentPick: 1,
            currentRound: 1,
            isActive: false,
            undoHistory: [],
            teams: [],
            draftId: generateDraftId(),
          };
          const merged: DraftState = {
            ...defaults,
            ...(parsedState as Partial<DraftState>),
            settings: mergedSettings,
            picks: mergedPicks,
            undoHistory: Array.isArray(parsedState.undoHistory)
              ? parsedState.undoHistory
              : [],
            teams:
              Array.isArray(parsedState.teams) &&
              parsedState.teams.length === mergedSettings.totalTeams
                ? parsedState.teams
                : rebuildTeams(mergedSettings.totalTeams, mergedPicks),
            draftId:
              typeof parsedState.draftId === "string" && parsedState.draftId
                ? parsedState.draftId
                : defaults.draftId,
          };
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setDraftState(merged);
        } catch (error) {
          console.error('Error loading draft state from localStorage:', error);
          // Persisted blob is corrupt — drop it so we start clean on next save
          // instead of looping through this catch on every mount.
          try {
            localStorage.removeItem(FANTASY_DRAFT_STORAGE_KEY);
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
      localStorage.setItem(FANTASY_DRAFT_STORAGE_KEY, JSON.stringify(saveState));
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
        },
        teams: newSettings.totalTeams ? initializeTeams(mergedSettings.totalTeams) : prev.teams,
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
      if (prev.currentPick > totalPicks) {
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
        currentRound: calculateCurrentRound(prev.currentPick + 1, prev.settings.totalTeams),
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
        currentRound: calculateCurrentRound(prev.currentPick + 1, prev.settings.totalTeams),
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
        teams: rebuildTeams(prev.settings.totalTeams, keptPicks),
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
    const settings = draftState.settings;
    setDraftState({
      settings,
      picks: [],
      currentPick: 1,
      currentRound: 1,
      isActive: false,
      undoHistory: [],
      teams: initializeTeams(settings.totalTeams),
      draftId: generateDraftId(),
    });
  }, [draftState.settings]);

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
  // per team with grades; json is the full structured blob including analytics.
  const exportDraftResults = useCallback(
    (format: 'csv' | 'json' | 'recap-csv', options: { notes?: Record<string, string> } = {}) => {
      const notes = options.notes ?? {};

      if (format === 'csv') {
        const headers = [
          'Pick', 'Round', 'Team', 'Player', 'Position', 'NFL Team', 'Consensus Rank',
          'Tier', 'Expert Range', 'ADP', 'Value Delta', 'Signal', 'Note',
        ];
        const rows: (string | number)[][] = draftState.picks.map((pick) => {
          const delta = getPickDelta(pick);
          const signal = classifyPickValue(pick);
          return [
            pick.pickNumber,
            pick.round,
            resolveTeamName(pick.teamNumber),
            pick.player.name,
            pick.player.position,
            pick.player.team,
            pick.player.rankEcr || pick.player.averageRank,
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
        const analytics = computeDraftAnalytics(draftState.picks, draftState.teams);
        const headers = [
          'Team', 'Grade', 'Net Value', 'Strengths', 'Weaknesses', 'QB', 'RB', 'WR', 'TE', 'K', 'DST',
        ];
        const rows: (string | number)[][] = [...analytics.teamStrengths]
          .sort((left, right) => (right.valueTotal ?? 0) - (left.valueTotal ?? 0))
          .map((team) => {
            const counts =
              draftState.teams.find((entry) => entry.teamNumber === team.teamNumber)?.positionCounts;
            return [
              resolveTeamName(team.teamNumber),
              team.overallGrade,
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
        picks: draftState.picks,
        teams: draftState.teams,
        analytics: computeDraftAnalytics(draftState.picks, draftState.teams),
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
    return currentTeamNumber === draftState.settings.userTeam ? 'Your Turn' : `Team ${currentTeamNumber}`;
  }, [currentTeamNumber, draftState.settings.userTeam, isDraftComplete]);

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
  };
};
