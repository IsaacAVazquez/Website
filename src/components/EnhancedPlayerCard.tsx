'use client';

import React, { useState } from 'react';
import { Player } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { WarmCard } from '@/components/ui/WarmCard';
import { ModernButton } from '@/components/ui/ModernButton';
import { ExpertConsensusIndicator } from '@/components/ExpertConsensusIndicator';
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Target,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';

interface EnhancedPlayerCardProps {
  player: Player;
  onDraft?: (player: Player) => void;
  isDrafted?: boolean;
  showDraftButton?: boolean;
  compact?: boolean;
  className?: string;
}

function EnhancedPlayerCardComponent({
  player,
  onDraft,
  isDrafted = false,
  showDraftButton = false,
  compact = false,
  className = ''
}: EnhancedPlayerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showProjections, setShowProjections] = useState(false);

  // Position-specific colors
  const getPositionColor = (position: string) => {
    const colors = {
      QB: 'from-red-500/20 to-red-600/10 border-red-500/30',
      RB: 'from-green-500/20 to-green-600/10 border-green-500/30', 
      WR: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
      TE: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
      K: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
      DST: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    };
    return colors[position as keyof typeof colors] || 'from-slate-500/20 to-slate-600/10 border-slate-500/30';
  };

  const rank = typeof player.averageRank === 'string' ? 
               parseFloat(player.averageRank) : player.averageRank;

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`p-3 rounded-lg bg-gradient-to-br ${getPositionColor(player.position)} 
                   border backdrop-blur-sm ${isDrafted ? 'opacity-50' : ''} ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-[var(--text-primary)] dark:text-[var(--neutral-100)] text-sm">{player.name}</h4>
              <Badge variant="secondary" size="sm">
                {player.team} {player.position}
              </Badge>
              <ExpertConsensusIndicator player={player} showDetails={false} />
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-primary)] dark:text-[var(--neutral-100)]">
              <span>#{rank}</span>
              {player.auctionValue && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  ${player.auctionValue}
                </span>
              )}
              {player.byeWeek && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Bye {player.byeWeek}
                </span>
              )}
            </div>
          </div>

          {showDraftButton && !isDrafted && (
            <ModernButton
              onClick={() => onDraft?.(player)}
              variant="primary"
              size="sm"
            >
              Draft
            </ModernButton>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <WarmCard hover={false} padding="lg" className={`${isDrafted ? 'opacity-50' : ''} ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-[var(--text-primary)] dark:text-[var(--neutral-100)]">{player.name}</h3>
              <Badge variant="primary">
                {player.team} {player.position}
              </Badge>
              <span className="text-sm text-[var(--text-secondary)] dark:text-[var(--neutral-400)]">#{rank}</span>
            </div>

            <div className="flex items-center gap-4 text-sm text-[var(--text-primary)] dark:text-[var(--neutral-100)]">
              {player.auctionValue && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-[var(--color-primary)] dark:text-[var(--color-accent)]" />
                  <span className="font-semibold">${player.auctionValue}</span>
                </div>
              )}

              {player.byeWeek && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-[var(--color-warning)]" />
                  <span>Bye Week {player.byeWeek}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Target className="w-4 h-4 text-[var(--color-success)] dark:text-[var(--color-success)]" />
                <span>{player.projectedPoints.toFixed(1)} pts</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showDraftButton && !isDrafted && (
              <ModernButton
                onClick={() => onDraft?.(player)}
                variant="primary"
              >
                Draft Player
              </ModernButton>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg bg-[var(--surface-secondary)] dark:bg-[var(--neutral-800)]/50 hover:bg-[var(--neutral-100)] dark:hover:bg-[var(--neutral-700)]/50
                       transition-colors border border-[var(--border-primary)] dark:border-[var(--color-accent)]/30"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-[var(--text-secondary)] dark:text-[var(--neutral-400)]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[var(--text-secondary)] dark:text-[var(--neutral-400)]" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Expert Consensus */}
        <ExpertConsensusIndicator player={player} />

        {/* Player Analysis */}
        {(player.upside || player.downside || player.bottomLine) && (
          <div className="space-y-3">
            {player.bottomLine && (
              <div className="p-3 rounded-lg bg-[var(--color-primary)]/10 dark:bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/20 dark:border-[var(--color-primary)]/30">
                <h5 className="text-[var(--color-primary)] dark:text-[var(--color-accent)] font-semibold text-sm mb-1">Bottom Line</h5>
                <p className="text-sm text-[var(--text-primary)] dark:text-[var(--neutral-100)]">{player.bottomLine}</p>
              </div>
            )}

            {player.upside && (
              <div className="p-3 rounded-lg bg-[var(--color-success)]/10 dark:bg-[var(--color-success)]/20 border border-[var(--color-success)]/20 dark:border-[var(--color-success)]/30">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-[var(--color-success)]" />
                  <h5 className="text-[var(--color-success)] font-semibold text-sm">Upside</h5>
                </div>
                <p className="text-sm text-[var(--text-primary)] dark:text-[var(--neutral-100)]">{player.upside}</p>
              </div>
            )}

            {player.downside && (
              <div className="p-3 rounded-lg bg-[var(--color-warning)]/10 dark:bg-[var(--color-warning)]/20 border border-[var(--color-warning)]/20 dark:border-[var(--color-warning)]/30">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-[var(--color-warning)]" />
                  <h5 className="text-[var(--color-warning)] font-semibold text-sm">Risk Factors</h5>
                </div>
                <p className="text-sm text-[var(--text-primary)] dark:text-[var(--neutral-100)]">{player.downside}</p>
              </div>
            )}
          </div>
        )}

        {/* Expandable projections */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Projection toggle */}
              {player.projections && Object.keys(player.projections).length > 0 && (
                <div className="flex items-center justify-between">
                  <h5 className="text-[var(--text-primary)] dark:text-[var(--neutral-100)] font-semibold">Season Projections</h5>
                  <button
                    onClick={() => setShowProjections(!showProjections)}
                    className="flex items-center gap-1 text-sm text-[var(--color-primary)] dark:text-[var(--color-accent)] hover:text-[var(--text-primary)] dark:hover:text-[var(--neutral-100)] transition-colors"
                  >
                    {showProjections ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Show
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Projections grid */}
              {showProjections && player.projections && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(player.projections)
                    .filter(([_, value]) => value !== undefined && value !== null)
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="p-3 rounded-lg bg-[var(--surface-secondary)] dark:bg-[var(--neutral-800)]/30 border border-[var(--border-primary)] dark:border-[var(--color-accent)]/30"
                      >
                        <div className="text-xs text-[var(--text-secondary)] dark:text-[var(--neutral-400)] uppercase tracking-wide">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-lg font-bold text-[var(--text-primary)] dark:text-[var(--neutral-100)]">
                          {typeof value === 'number' ?
                            (key.includes('Percentage') || key.includes('Share') ?
                              `${(value * 100).toFixed(1)}%` :
                              value.toLocaleString()
                            ) :
                            value
                          }
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Weekly projections preview */}
              {player.weeklyProjections && player.weeklyProjections.length > 0 && (
                <div>
                  <h5 className="text-[var(--text-primary)] dark:text-[var(--neutral-100)] font-semibold mb-3">Upcoming Weeks</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {player.weeklyProjections.slice(0, 4).map((week) => (
                      <div
                        key={week.week}
                        className={`p-2 rounded border text-center ${
                          week.difficulty === 'easy' ? 'bg-[var(--color-success)]/10 dark:bg-[var(--color-success)]/20 border-[var(--color-success)]/20 dark:border-[var(--color-success)]/30' :
                          week.difficulty === 'hard' ? 'bg-[var(--color-error)]/10 dark:bg-[var(--color-error)]/20 border-[var(--color-error)]/20 dark:border-[var(--color-error)]/30' :
                          'bg-[var(--neutral-100)]/20 dark:bg-[var(--neutral-700)]/20 border-[var(--border-primary)] dark:border-[var(--neutral-700)]/20'
                        }`}
                      >
                        <div className="text-xs text-[var(--text-secondary)] dark:text-[var(--neutral-400)]">Week {week.week}</div>
                        <div className="text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--neutral-100)]">
                          {week.projectedPoints.toFixed(1)}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] dark:text-[var(--neutral-400)]">vs {week.opponent}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </WarmCard>
  );
}

// Memoize the component to prevent unnecessary re-renders
const EnhancedPlayerCard = React.memo(EnhancedPlayerCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.player.id === nextProps.player.id &&
    prevProps.isDrafted === nextProps.isDrafted &&
    prevProps.showDraftButton === nextProps.showDraftButton &&
    prevProps.compact === nextProps.compact &&
    prevProps.className === nextProps.className &&
    prevProps.onDraft === nextProps.onDraft
  );
});

EnhancedPlayerCard.displayName = 'EnhancedPlayerCard';

// Export both as named and default to support different import styles
export { EnhancedPlayerCard };
export default EnhancedPlayerCard;