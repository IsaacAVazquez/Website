"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Player, Position, ScoringFormat } from "@/types";
import { WarmCard } from "@/components/ui/WarmCard";
import { Heading } from "@/components/ui/Heading";
import { Badge } from "@/components/ui/Badge";
import { IconSearch, IconFilter, IconSortDescending } from "@tabler/icons-react";
import { PlayerDraftCard } from "./PlayerDraftCard";
import { useDebounce } from "@/hooks/useDebounce";
import { calculateUnifiedTiers } from "@/lib/unifiedTierCalculator";

interface DraftBoardProps {
  players: Player[];
  draftedPlayerIds: Set<string>;
  onDraftPlayer: (player: Player) => void;
  currentPick: number;
  isUserPick: boolean;
  scoringFormat: ScoringFormat;
}

type FilterPosition = Position | 'ALL';
type SortOption = 'rank' | 'tier' | 'points' | 'adp';

export function DraftBoard({
  players,
  draftedPlayerIds,
  onDraftPlayer,
  currentPick: _currentPick,
  isUserPick,
  scoringFormat
}: DraftBoardProps) {
  const [selectedPosition, setSelectedPosition] = useState<FilterPosition>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('rank');
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Calculate tiers for all available players
  const playersWithTiers = useMemo(() => {
    const availablePlayers = players.filter(p => !draftedPlayerIds.has(p.id));
    if (availablePlayers.length === 0) return [];

    // Skip tier calculation during build/SSR to prevent initialization errors
    if (typeof window === 'undefined') {
      return availablePlayers;
    }

    try {
      // Calculate tiers for all available players
      const tiers = calculateUnifiedTiers(availablePlayers, 8, scoringFormat);
      
      // Assign tier info to players
      const tieredPlayers = availablePlayers.map(player => {
        const tier = tiers.find(t => t.players.some(p => p.id === player.id));
        return {
          ...player,
          tier: tier?.tier || player.tier,
          tierColor: tier?.color,
        };
      });

      return tieredPlayers;
    } catch (error) {
      console.error('Error calculating tiers:', error);
      // Fallback to original players if tier calculation fails
      return availablePlayers;
    }
  }, [players, draftedPlayerIds, scoringFormat]);

  // Available positions with counts
  const positionCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: playersWithTiers.length };
    
    playersWithTiers.forEach(player => {
      if (player.position !== 'FLEX' && player.position !== 'OVERALL') {
        counts[player.position] = (counts[player.position] || 0) + 1;
      }
    });
    
    return counts;
  }, [playersWithTiers]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = [...playersWithTiers];

    // Position filter
    if (selectedPosition !== 'ALL') {
      filtered = filtered.filter(player => player.position === selectedPosition);
    }

    // Search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(query) ||
        player.team.toLowerCase().includes(query) ||
        player.position.toLowerCase().includes(query)
      );
    }

    // Sort players
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rank': {
          const rankA = typeof a.averageRank === 'number' ? a.averageRank : parseFloat(a.averageRank as string) || 999;
          const rankB = typeof b.averageRank === 'number' ? b.averageRank : parseFloat(b.averageRank as string) || 999;
          return rankA - rankB;
        }
        case 'tier':
          return (a.tier || 999) - (b.tier || 999);
        case 'points':
          return b.projectedPoints - a.projectedPoints;
        case 'adp':
          return (a.adp || 999) - (b.adp || 999);
        default:
          return 0;
      }
    });

    return filtered;
  }, [playersWithTiers, selectedPosition, debouncedSearchQuery, sortBy]);

  const positions: { value: FilterPosition; label: string; icon?: string }[] = [
    { value: 'ALL', label: 'All Players', icon: '🏈' },
    { value: 'QB', label: 'Quarterback', icon: '🎯' },
    { value: 'RB', label: 'Running Back', icon: '🏃' },
    { value: 'WR', label: 'Wide Receiver', icon: '🙌' },
    { value: 'TE', label: 'Tight End', icon: '⚡' },
    { value: 'K', label: 'Kicker', icon: '🦵' },
    { value: 'DST', label: 'Defense', icon: '🛡️' },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'rank', label: 'Expert Rank' },
    { value: 'tier', label: 'Tier' },
    { value: 'points', label: 'Projected Points' },
    { value: 'adp', label: 'ADP' },
  ];

  return (
    <WarmCard hover={false} padding="none" className="h-full">
      <div className="p-6 border-b-2 border-[#FFE4D6] dark:border-[#FF8E53]/30">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <Heading level={3} className="mb-2">Available Players</Heading>
            <div className="flex items-center gap-2 text-sm text-[#6B4F3D] dark:text-[#D4A88E]">
              <span>{filteredPlayers.length} players available</span>
              {selectedPosition !== 'ALL' && (
                <>
                  <span>•</span>
                  <span>{selectedPosition} position</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-[#FFF8F0] dark:bg-[#4A3426]/50 border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30 rounded-lg text-[#4A3426] dark:text-[#FFE4D6] hover:border-[#FF6B35] dark:hover:border-[#FF8E53] transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <IconFilter size={16} />
              Filters
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B4F3D] dark:text-[#D4A88E]" size={20} />
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#2D1B12] border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30 rounded-lg text-[#4A3426] dark:text-[#FFE4D6] placeholder-[#6B4F3D] dark:placeholder-[#D4A88E] focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors"
          />
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 mb-4"
            >
              {/* Position Filter */}
              <div>
                <label className="block text-sm font-medium text-[#4A3426] dark:text-[#FFE4D6] mb-2">Position</label>
                <div className="flex flex-wrap gap-2">
                  {positions.map(position => (
                    <motion.button
                      key={position.value}
                      onClick={() => setSelectedPosition(position.value)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${selectedPosition === position.value
                          ? 'bg-[#FF6B35] dark:bg-[#FF8E53] text-white'
                          : 'bg-[#FFF8F0] dark:bg-[#4A3426]/50 text-[#4A3426] dark:text-[#FFE4D6] hover:bg-[#FFE4D6] dark:hover:bg-[#4A3426]'
                        }
                      `}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>{position.icon}</span>
                      <span>{position.label}</span>
                      <Badge variant="outline" size="sm" className="ml-1">
                        {positionCounts[position.value] || 0}
                      </Badge>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-[#4A3426] dark:text-[#FFE4D6] mb-2">Sort By</label>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map(option => (
                    <motion.button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${sortBy === option.value
                          ? 'bg-[#6BCF7F] dark:bg-[#8FE39E] text-white'
                          : 'bg-[#FFF8F0] dark:bg-[#4A3426]/50 text-[#4A3426] dark:text-[#FFE4D6] hover:bg-[#FFE4D6] dark:hover:bg-[#4A3426]'
                        }
                      `}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconSortDescending size={14} />
                      {option.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Player Grid */}
      <div className="p-6">
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-[#6B4F3D] dark:text-[#D4A88E] mb-4 text-lg">🔍</div>
            <Heading level={4} className="text-[#6B4F3D] dark:text-[#D4A88E] mb-2">No players found</Heading>
            <p className="text-[#6B4F3D]/70 dark:text-[#D4A88E]/70">
              {debouncedSearchQuery ? "Try adjusting your search terms" : "Try changing your filters"}
            </p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredPlayers.slice(0, 50).map((player, index) => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                >
                  <PlayerDraftCard
                    player={player}
                    onDraft={() => onDraftPlayer(player)}
                    showDraftButton={isUserPick}
                    scoringFormat={scoringFormat}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {filteredPlayers.length > 50 && (
          <div className="text-center mt-6">
            <Badge variant="outline">
              Showing first 50 of {filteredPlayers.length} players
            </Badge>
          </div>
        )}
      </div>
    </WarmCard>
  );
}