"use client";

import { motion } from "framer-motion";
import { Player, ScoringFormat } from "@/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { MorphButton } from "@/components/ui/MorphButton";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { IconTrendingUp, IconTarget, IconBolt, IconShield } from "@tabler/icons-react";
import { UNIFIED_TIER_COLORS } from "@/lib/unifiedTierCalculator";

interface PlayerDraftCardProps {
  player: Player;
  onDraft: () => void;
  showDraftButton: boolean;
  scoringFormat: ScoringFormat;
}

// Helper function to get tier color (using unified tier colors)
const getTierColor = (tier?: number, tierColor?: string): string => {
  // Use provided tier color if available (from unified tier calculation)
  if (tierColor) return tierColor;
  
  // Fallback to unified tier colors if tier number is available
  if (tier && tier > 0) {
    return UNIFIED_TIER_COLORS[tier - 1] || UNIFIED_TIER_COLORS[UNIFIED_TIER_COLORS.length - 1];
  }
  
  return '#64748b'; // slate-500 default
};

// Helper function to get position icon
const getPositionIcon = (position: string) => {
  switch (position) {
    case 'QB': return IconTarget;
    case 'RB': return IconBolt;
    case 'WR': return IconTrendingUp;
    case 'TE': return IconTarget;
    case 'K': return IconBolt;
    case 'DST': return IconShield;
    default: return IconBolt;
  }
};

// Helper function to format rank
const formatRank = (rank: number | string): string => {
  const numRank = typeof rank === 'number' ? rank : parseFloat(rank as string);
  return isNaN(numRank) ? '--' : Math.round(numRank).toString();
};

// Helper function to get position color
const getPositionColor = (position: string): string => {
  switch (position) {
    case 'QB': return '#3b82f6'; // blue
    case 'RB': return '#22c55e'; // green
    case 'WR': return '#f59e0b'; // amber
    case 'TE': return '#ef4444'; // red
    case 'K': return '#8b5cf6'; // violet
    case 'DST': return '#64748b'; // slate
    default: return '#64748b';
  }
};

export function PlayerDraftCard({ player, onDraft, showDraftButton, scoringFormat }: PlayerDraftCardProps) {
  const tierColor = getTierColor(player.tier, (player as any).tierColor);
  const positionColor = getPositionColor(player.position);
  const PositionIcon = getPositionIcon(player.position);
  
  // Generate player image path (using the existing image naming convention)
  const getPlayerImagePath = (player: Player): string => {
    const teamLower = player.team.toLowerCase();
    const nameLower = player.name.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, '') // Remove spaces
      .replace(/jr$|sr$|ii$|iii$|iv$/, '') // Remove suffixes
      .trim();
    
    return `/player-images/${teamLower}-${nameLower}.jpg`;
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <GlassCard 
        className="h-full relative overflow-hidden group"
        style={{
          borderColor: `${tierColor}40`,
        }}
      >
        {/* Tier Indicator */}
        {player.tier && (
          <div 
            className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white z-10"
            style={{ backgroundColor: tierColor }}
          >
            {player.tier}
          </div>
        )}

        {/* Player Image */}
        <div className="relative h-24 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
          <OptimizedImage
            src={getPlayerImagePath(player)}
            alt={player.name}
            className="w-full h-full object-cover"
            fallbackSrc="/player-images/default-player.jpg"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
          
          {/* Position badge */}
          <div className="absolute bottom-2 right-2">
            <Badge 
              variant="solid"
              size="sm"
              className="text-white font-bold"
              style={{ backgroundColor: positionColor }}
            >
              {player.position}
            </Badge>
          </div>
        </div>

        {/* Player Info */}
        <div className="p-3 space-y-3">
          {/* Name and Team */}
          <div>
            <h4 className="font-semibold text-white text-sm truncate group-hover:text-electric-blue transition-colors">
              {player.name}
            </h4>
            <p className="text-xs text-slate-400">
              {player.team} • #{formatRank(player.averageRank)}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-slate-800/50 rounded">
              <div className="text-slate-400">Proj</div>
              <div className="font-medium text-white">
                {Math.round(player.projectedPoints)}
              </div>
            </div>
            
            <div className="text-center p-2 bg-slate-800/50 rounded">
              <div className="text-slate-400">ADP</div>
              <div className="font-medium text-white">
                {player.adp ? Math.round(player.adp) : '--'}
              </div>
            </div>
          </div>

          {/* Additional Stats Row */}
          {player.auctionValue && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Value:</span>
              <span className="font-medium text-matrix-green">${player.auctionValue}</span>
            </div>
          )}

          {/* Upside/Risk Indicators */}
          {(player.upside || player.downside) && (
            <div className="space-y-1">
              {player.upside && (
                <div className="flex items-center gap-1 text-xs">
                  <IconTrendingUp size={12} className="text-matrix-green" />
                  <span className="text-matrix-green truncate">{player.upside.slice(0, 30)}...</span>
                </div>
              )}
              {player.downside && (
                <div className="flex items-center gap-1 text-xs">
                  <IconTarget size={12} className="text-warning-amber" />
                  <span className="text-warning-amber truncate">{player.downside.slice(0, 30)}...</span>
                </div>
              )}
            </div>
          )}

          {/* Draft Button */}
          {showDraftButton && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-2"
            >
              <MorphButton
                onClick={onDraft}
                variant="primary"
                size="sm"
                className="w-full text-xs font-medium"
              >
                Draft Player
              </MorphButton>
            </motion.div>
          )}

          {/* Tier Glow Effect */}
          <motion.div
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"
            style={{
              boxShadow: `inset 0 0 20px ${tierColor}`,
            }}
          />
        </div>
      </GlassCard>
    </motion.div>
  );
}