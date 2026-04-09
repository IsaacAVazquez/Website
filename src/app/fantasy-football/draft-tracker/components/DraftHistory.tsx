"use client";

import { motion, AnimatePresence } from "framer-motion";
import { DraftPick, TeamRoster } from "@/types";
import { WarmCard } from "@/components/ui/WarmCard";
import { Heading } from "@/components/ui/Heading";
import { ModernButton } from "@/components/ui/ModernButton";
import { Badge } from "@/components/ui/Badge";
import { IconArrowBack, IconUser, IconCrown } from "@tabler/icons-react";
import { useState } from "react";

interface DraftHistoryProps {
  picks: DraftPick[];
  teams: TeamRoster[];
  userTeam: number;
  onUndo: () => void;
}

export function DraftHistory({ picks, teams, userTeam, onUndo }: DraftHistoryProps) {
  const [viewMode, setViewMode] = useState<'recent' | 'teams'>('recent');
  
  // Get recent picks (last 10)
  const recentPicks = picks.slice(-10).reverse();
  
  // Get user team picks
  const userPicks = picks.filter(pick => pick.teamNumber === userTeam);
  
  // Helper function to get position color
  const getPositionColor = (position: string): string => {
    switch (position) {
      case 'QB': return 'text-blue-400';
      case 'RB': return 'text-green-400';
      case 'WR': return 'text-amber-400';
      case 'TE': return 'text-red-400';
      case 'K': return 'text-violet-400';
      case 'DST': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  };

  // Helper function to format pick time
  const formatPickTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  return (
    <WarmCard hover={false} padding="md" className="h-fit">
      <div className="p-4 border-b border-[var(--home-rule)]">
        <div className="flex items-center justify-between mb-4">
          <Heading level={4}>Draft Activity</Heading>
          {picks.length > 0 && (
            <ModernButton
              onClick={onUndo}
              variant="outline"
              size="xs"
              className="flex items-center gap-1"
            >
              <IconArrowBack size={14} />
              Undo
            </ModernButton>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-[var(--home-paper-alt)] p-1 rounded-lg">
          <button
            onClick={() => setViewMode('recent')}
            className={`
              flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all
              ${viewMode === 'recent'
                ? 'bg-[var(--home-haze)] text-white'
                : 'text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]'
              }
            `}
          >
            Recent Picks
          </button>
          <button
            onClick={() => setViewMode('teams')}
            className={`
              flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all
              ${viewMode === 'teams'
                ? 'bg-[var(--home-haze)] text-white'
                : 'text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]'
              }
            `}
          >
            Your Team
          </button>
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {viewMode === 'recent' ? (
            <motion.div
              key="recent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {recentPicks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))] mb-2">📋</div>
                  <p className="text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))] text-sm">No picks yet</p>
                </div>
              ) : (
                recentPicks.map((pick, index) => (
                  <motion.div
                    key={pick.pickNumber}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      p-3 rounded-lg border transition-all
                      ${pick.teamNumber === userTeam
                        ? 'border-[var(--color-success)] bg-[var(--color-success)]/10'
                        : 'border-[var(--home-rule)] bg-[var(--home-paper)]'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" size="xs">
                          #{pick.pickNumber}
                        </Badge>
                        {pick.teamNumber === userTeam && (
                          <IconCrown size={14} className="text-[var(--color-success)]" />
                        )}
                      </div>
                      <span className="text-xs text-[var(--home-ink-muted)]">
                        {formatPickTime(pick.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[var(--home-ink)] text-sm truncate">
                          {pick.player.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={getPositionColor(pick.player.position)}>
                            {pick.player.position}
                          </span>
                          <span className="text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">•</span>
                          <span className="text-[var(--home-ink-muted)]">{pick.player.team}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-[var(--home-ink-muted)]">Team {pick.teamNumber}</p>
                        <p className="text-xs text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">R{pick.round}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="teams"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {userPicks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))] mb-2">👤</div>
                  <p className="text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))] text-sm">No picks yet</p>
                  <p className="text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))] text-xs mt-1">Your drafted players will appear here</p>
                </div>
              ) : (
                <>
                  {/* Your Team Stats */}
                  <div className="p-3 bg-[#6BCF7F]/10 dark:bg-[#6BCF7F]/20 border border-[var(--color-success)] rounded-lg mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <IconUser size={16} className="text-[var(--color-success)]" />
                      <span className="font-medium text-[var(--color-success)]">Your Team</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-[var(--home-ink)] font-medium">{userPicks.length}</div>
                        <div className="text-[var(--home-ink-muted)]">Players</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[var(--home-ink)] font-medium">
                          {Math.round(userPicks.reduce((sum, pick) => sum + pick.player.projectedPoints, 0))}
                        </div>
                        <div className="text-[var(--home-ink-muted)]">Proj Pts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[var(--home-ink)] font-medium">
                          ${userPicks.reduce((sum, pick) => sum + (pick.player.auctionValue || 0), 0)}
                        </div>
                        <div className="text-[var(--home-ink-muted)]">Value</div>
                      </div>
                    </div>
                  </div>

                  {/* Position Breakdown */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {Object.entries(teams.find(t => t.teamNumber === userTeam)?.positionCounts || {}).map(([pos, count]) => (
                      <div key={pos} className="flex items-center justify-between p-2 bg-[var(--home-paper-alt)] rounded">
                        <span className={`text-xs font-medium ${getPositionColor(pos)}`}>{pos}</span>
                        <Badge variant="outline" size="xs">{count}</Badge>
                      </div>
                    ))}
                  </div>

                  {/* Your Picks */}
                  {userPicks.map((pick, index) => (
                    <motion.div
                      key={pick.pickNumber}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 border border-[var(--color-success)] bg-[var(--color-success)]/10 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="matrix" size="xs">
                          Pick #{pick.pickNumber}
                        </Badge>
                        <span className="text-xs text-[var(--home-ink-muted)]">Round {pick.round}</span>
                      </div>

                      <div>
                        <p className="font-medium text-[var(--home-ink)] text-sm">
                          {pick.player.name}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className={getPositionColor(pick.player.position)}>
                              {pick.player.position}
                            </span>
                            <span className="text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">•</span>
                            <span className="text-[var(--home-ink-muted)]">{pick.player.team}</span>
                          </div>
                          <span className="text-xs text-[var(--color-success)]">
                            {Math.round(pick.player.projectedPoints)} pts
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </WarmCard>
  );
}