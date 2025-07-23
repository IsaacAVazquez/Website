"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { IconUser, IconTrendingUp } from "@tabler/icons-react";
import { Player } from "@/types";
import { calculateUnifiedTiers } from "@/lib/unifiedTierCalculator";
import { usePlayerImageCache } from "@/hooks/usePlayerImageCache";

interface DraftTierChartProps {
  players: Player[];
  allPlayers: Player[];
  scoringFormat: "standard" | "halfPPR" | "ppr";
  positionFilter: string;
}

export default function DraftTierChart({
  players,
  allPlayers,
  scoringFormat,
  positionFilter
}: DraftTierChartProps) {
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  
  // Use the cached image service
  const { preloadImages, getCachedImage, isLoading } = usePlayerImageCache();

  // Calculate tiers using unified system
  const tiers = useMemo(() => {
    const maxTiers = positionFilter === "ALL" ? 12 : 8;
    const scoringFormatStr = scoringFormat === "halfPPR" ? "HALF_PPR" : scoringFormat.toUpperCase();
    return calculateUnifiedTiers(players, maxTiers, scoringFormatStr);
  }, [players, scoringFormat, positionFilter]);

  // Smart preloading of images with position-based priority
  useEffect(() => {
    if (players.length === 0) return;

    // Preload images for visible players immediately
    preloadImages(players);

    // Smart preloading: if looking at specific position, preload likely next positions
    if (positionFilter !== "ALL") {
      const nextPositions = getNextLikelyPositions(positionFilter);
      const nextPositionPlayers = allPlayers.filter(p => 
        nextPositions.includes(p.position) && !players.includes(p)
      ).slice(0, 20); // Limit to top 20 players per position
      
      // Preload in background with slight delay
      setTimeout(() => preloadImages(nextPositionPlayers), 500);
    }
  }, [players, allPlayers, positionFilter, preloadImages]);

  // Helper function to determine likely next positions user might view
  const getNextLikelyPositions = (currentPosition: string): string[] => {
    const positionSequences: Record<string, string[]> = {
      'QB': ['RB', 'WR'],
      'RB': ['WR', 'QB', 'TE'],
      'WR': ['RB', 'TE', 'QB'],
      'TE': ['RB', 'WR', 'QB'],
      'K': ['DST'],
      'DST': ['K'],
    };
    return positionSequences[currentPosition] || [];
  };

  // Position colors
  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      QB: "bg-red-500/20 text-red-400 border-red-500/30",
      RB: "bg-green-500/20 text-green-400 border-green-500/30",
      WR: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      TE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      K: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      DST: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return colors[position] || "bg-slate-700/20 text-slate-400 border-slate-500/30";
  };

  if (players.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-12 text-center">
        <p className="text-slate-400">No players found for the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tiers.map((tier, tierIndex) => {
        const tierColor = tier.color;
        const isSelected = selectedTier === tier.tier;
        const isOtherSelected = selectedTier !== null && selectedTier !== tier.tier;

        return (
          <motion.div
            key={tier.tier}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isOtherSelected ? 0.5 : 1, 
              y: 0,
              scale: isSelected ? 1.02 : 1
            }}
            transition={{ 
              delay: tierIndex * 0.05,
              scale: { type: "spring", stiffness: 300 }
            }}
            className="relative"
            onMouseEnter={() => setSelectedTier(tier.tier)}
            onMouseLeave={() => setSelectedTier(null)}
          >
            {/* Tier Header */}
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="h-px flex-1 transition-all duration-300"
                style={{ 
                  backgroundColor: isSelected ? tierColor : `${tierColor}50`,
                  boxShadow: isSelected ? `0 0 20px ${tierColor}` : 'none'
                }}
              />
              <motion.div 
                className="flex items-center gap-3"
                animate={{ scale: isSelected ? 1.1 : 1 }}
              >
                <div 
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: tierColor }}
                />
                <h3 
                  className="text-lg font-bold transition-all duration-300"
                  style={{ color: isSelected ? tierColor : '#CBD5E1' }}
                >
                  {tier.label}
                </h3>
                <span className="text-sm text-slate-500">
                  Ranks {tier.minRank}-{tier.maxRank}
                </span>
              </motion.div>
              <div 
                className="h-px flex-1 transition-all duration-300"
                style={{ 
                  backgroundColor: isSelected ? tierColor : `${tierColor}50`,
                  boxShadow: isSelected ? `0 0 20px ${tierColor}` : 'none'
                }}
              />
            </div>

            {/* Players Grid */}
            <div className={`
              bg-slate-900/30 backdrop-blur-sm border rounded-lg p-4
              transition-all duration-300
              ${isSelected ? 'border-opacity-50 shadow-2xl' : 'border-slate-800'}
            `}
            style={{
              borderColor: isSelected ? tierColor : undefined,
              boxShadow: isSelected ? `0 0 30px ${tierColor}20` : undefined
            }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {tier.players.map((player, playerIndex) => {
                  const imageUrl = getCachedImage(`${player.name}-${player.team}`);
                  const isHovered = hoveredPlayer === player.id;
                  // Calculate integer rank based on position in allPlayers list
                  const overallRank = allPlayers.findIndex(p => p.id === player.id) + 1;

                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ 
                        opacity: 1, 
                        scale: isHovered ? 1.05 : 1,
                        y: isHovered ? -4 : 0
                      }}
                      transition={{ 
                        delay: tierIndex * 0.05 + playerIndex * 0.01,
                        scale: { type: "spring", stiffness: 400 }
                      }}
                      onMouseEnter={() => setHoveredPlayer(player.id)}
                      onMouseLeave={() => setHoveredPlayer(null)}
                      className={`
                        relative bg-slate-800/50 border rounded-lg p-3
                        transition-all duration-200 cursor-pointer
                        ${isHovered ? 'border-electric-blue shadow-lg shadow-electric-blue/20' : 'border-slate-700'}
                      `}
                    >
                      {/* Rank Badge */}
                      <div className="absolute -top-2 -left-2 z-10">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          text-xs font-bold shadow-lg
                          ${isHovered ? 'bg-electric-blue text-slate-900' : 'bg-slate-700 text-slate-300'}
                        `}>
                          {overallRank}
                        </div>
                      </div>

                      {/* Player Content */}
                      <div className="flex flex-col items-center text-center">
                        {/* Player Image */}
                        <div className="relative w-16 h-16 mb-2">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={player.name}
                              fill
                              className="rounded-full object-cover border-2 border-slate-700"
                              sizes="64px"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`${imageUrl ? 'hidden' : ''} absolute inset-0 bg-slate-700 rounded-full flex items-center justify-center`}>
                            {isLoading(`${player.name}-${player.team}`) ? (
                              <div className="w-4 h-4 border border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <IconUser size={24} className="text-slate-500" />
                            )}
                          </div>
                        </div>

                        {/* Player Name */}
                        <h4 className="font-medium text-sm text-slate-200 mb-1 line-clamp-2">
                          {player.name}
                        </h4>

                        {/* Position & Team */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`
                            px-2 py-0.5 rounded text-xs font-medium border
                            ${getPositionColor(player.position)}
                          `}>
                            {player.position}
                          </span>
                          <span className="text-xs text-slate-500">
                            {player.team}
                          </span>
                        </div>

                        {/* ADP if available */}
                        {player.adp && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <IconTrendingUp size={12} />
                            <span>ADP: {player.adp}</span>
                          </div>
                        )}
                      </div>

                      {/* Hover Effect Glow */}
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 rounded-lg pointer-events-none"
                            style={{
                              background: `radial-gradient(circle at center, ${tierColor}10 0%, transparent 100%)`,
                            }}
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}