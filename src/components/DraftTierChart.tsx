"use client";

import { useState, useMemo, useEffect, memo } from "react";
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

const DraftTierChart = memo(function DraftTierChart({
  players,
  allPlayers,
  scoringFormat,
  positionFilter
}: DraftTierChartProps) {
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [visibleTierCount, setVisibleTierCount] = useState<number>(3); // Initially show only 3 tiers
  
  // Reset visible tier count when position or players change
  useEffect(() => {
    setVisibleTierCount(3);
  }, [positionFilter, players.length]);
  
  // Use the cached image service
  const { preloadImages, getCachedImage, isLoading } = usePlayerImageCache();

  // Pre-calculate player ranks to avoid O(n²) complexity
  const playerRankMap = useMemo(() => {
    const rankMap = new Map<string, number>();
    if (allPlayers && Array.isArray(allPlayers)) {
      allPlayers.forEach((player, index) => {
        if (player && player.id) {
          rankMap.set(player.id, index + 1);
        }
      });
    }
    return rankMap;
  }, [allPlayers]);

  // Calculate tiers using unified system
  const tiers = useMemo(() => {
    try {
      if (!players || players.length === 0) {
        return [];
      }
      const maxTiers = positionFilter === "ALL" ? 12 : 8;
      const scoringFormatStr = scoringFormat === "halfPPR" ? "HALF_PPR" : scoringFormat.toUpperCase();
      return calculateUnifiedTiers(players, maxTiers, scoringFormatStr);
    } catch (error) {
      console.error('Error calculating tiers:', error);
      return [];
    }
  }, [players, scoringFormat, positionFilter]);

  // Only preload top tier images to avoid overwhelming the browser
  useEffect(() => {
    if (players.length === 0 || tiers.length === 0) return;

    // Only preload images for the first tier (elite players)
    const firstTierPlayers = tiers[0]?.players || [];
    if (firstTierPlayers.length > 0) {
      preloadImages(firstTierPlayers.slice(0, 10)); // Limit to top 10 players
    }
  }, [tiers, preloadImages]);

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

  // Position colors - memoized to avoid recreating on every render
  const getPositionColor = useMemo(() => {
    const colors: Record<string, string> = {
      QB: "bg-red-500/20 text-red-400 border-red-500/30",
      RB: "bg-green-500/20 text-green-400 border-green-500/30",
      WR: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      TE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      K: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      DST: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return (position: string) => colors[position] || "bg-slate-700/20 text-slate-400 border-slate-500/30";
  }, []);

  if (players.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-12 text-center">
        <p className="text-slate-400">No players found for the selected filters.</p>
      </div>
    );
  }

  // Only show visible tiers
  const visibleTiers = tiers.slice(0, visibleTierCount);
  const hasMoreTiers = tiers.length > visibleTierCount;

  return (
    <div className="space-y-6">
      {visibleTiers.map((tier, tierIndex) => {
        const tierColor = tier.color;
        const isSelected = selectedTier === tier.tier;
        const isOtherSelected = selectedTier !== null && selectedTier !== tier.tier;

        return (
          <div
            key={tier.tier}
            className={`relative transition-all duration-300 ${isOtherSelected ? 'opacity-50' : 'opacity-100'} ${isSelected ? 'scale-[1.02]' : 'scale-100'}`}
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
              <div 
                className={`flex items-center gap-3 transition-transform duration-300 ${isSelected ? 'scale-110' : 'scale-100'}`}
              >
                <div 
                  className="w-3 h-3 rounded-full"
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
              </div>
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
                  // Get pre-calculated rank (O(1) lookup instead of O(n) search)
                  const overallRank = playerRankMap.get(player.id) || 999;

                  return (
                    <div
                      key={player.id}
                      onMouseEnter={() => setHoveredPlayer(player.id)}
                      onMouseLeave={() => setHoveredPlayer(null)}
                      className={`
                        relative bg-slate-800/50 border rounded-lg p-3
                        transition-colors duration-200 cursor-pointer
                        ${isHovered ? 'border-electric-blue' : 'border-slate-700'}
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
                              loading="lazy"
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

                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Show More Button */}
      {hasMoreTiers && (
        <div className="text-center mt-8">
          <button
            onClick={() => setVisibleTierCount(prev => Math.min(prev + 3, tiers.length))}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:border-electric-blue transition-all duration-200"
          >
            Show More Tiers ({tiers.length - visibleTierCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
});

export default DraftTierChart;