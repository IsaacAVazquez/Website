'use client';

import React, { useState } from 'react';
import { Player } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { MorphButton } from '@/components/ui/MorphButton';
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
              <h4 className="font-semibold text-white text-sm">{player.name}</h4>
              <Badge variant="secondary" size="sm">
                {player.team} {player.position}
              </Badge>
              <ExpertConsensusIndicator player={player} showDetails={false} />
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-300">
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
            <MorphButton
              onClick={() => onDraft?.(player)}
              variant="primary"
              size="sm"
            >
              Draft
            </MorphButton>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <GlassCard className={`p-6 ${isDrafted ? 'opacity-50' : ''} ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-white">{player.name}</h3>
              <Badge variant="primary">
                {player.team} {player.position}
              </Badge>
              <span className="text-sm text-slate-400">#{rank}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-slate-300">
              {player.auctionValue && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-electric-blue" />
                  <span className="font-semibold">${player.auctionValue}</span>
                </div>
              )}
              
              {player.byeWeek && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-warning-amber" />
                  <span>Bye Week {player.byeWeek}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4 text-matrix-green" />
                <span>{player.projectedPoints.toFixed(1)} pts</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showDraftButton && !isDrafted && (
              <MorphButton
                onClick={() => onDraft?.(player)}
                variant="primary"
              >
                Draft Player
              </MorphButton>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 
                       transition-colors border border-slate-600/30"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
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
              <div className="p-3 rounded-lg bg-electric-blue/10 border border-electric-blue/20">
                <h5 className="text-electric-blue font-semibold text-sm mb-1">Bottom Line</h5>
                <p className="text-sm text-slate-300">{player.bottomLine}</p>
              </div>
            )}
            
            {player.upside && (
              <div className="p-3 rounded-lg bg-matrix-green/10 border border-matrix-green/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-matrix-green" />
                  <h5 className="text-matrix-green font-semibold text-sm">Upside</h5>
                </div>
                <p className="text-sm text-slate-300">{player.upside}</p>
              </div>
            )}
            
            {player.downside && (
              <div className="p-3 rounded-lg bg-warning-amber/10 border border-warning-amber/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-warning-amber" />
                  <h5 className="text-warning-amber font-semibold text-sm">Risk Factors</h5>
                </div>
                <p className="text-sm text-slate-300">{player.downside}</p>
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
                  <h5 className="text-slate-300 font-semibold">Season Projections</h5>
                  <button
                    onClick={() => setShowProjections(!showProjections)}
                    className="flex items-center gap-1 text-sm text-electric-blue hover:text-white transition-colors"
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
                        className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
                      >
                        <div className="text-xs text-slate-500 uppercase tracking-wide">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-lg font-bold text-white">
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
                  <h5 className="text-slate-300 font-semibold mb-3">Upcoming Weeks</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {player.weeklyProjections.slice(0, 4).map((week) => (
                      <div 
                        key={week.week}
                        className={`p-2 rounded border text-center ${
                          week.difficulty === 'easy' ? 'bg-matrix-green/10 border-matrix-green/20' :
                          week.difficulty === 'hard' ? 'bg-error-red/10 border-error-red/20' :
                          'bg-slate-700/20 border-slate-600/20'
                        }`}
                      >
                        <div className="text-xs text-slate-400">Week {week.week}</div>
                        <div className="text-sm font-semibold text-white">
                          {week.projectedPoints.toFixed(1)}
                        </div>
                        <div className="text-xs text-slate-500">vs {week.opponent}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
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