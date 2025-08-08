"use client";

import React, { useMemo, useCallback, useState, memo } from 'react';
import { Player } from '@/types';
import { LazyPlayerImage } from '@/components/ui/LazyPlayerImage';
import { VirtualizedPlayerList } from '@/components/ui/VirtualizedPlayerList';
import { calculateOptimizedTiers } from '@/lib/optimizedTierCalculator';

interface LightweightTierChartProps {
  players: Player[];
  scoringFormat?: string;
  numberOfTiers?: number;
  onPlayerClick?: (player: Player) => void;
  onPlayerDraft?: (player: Player) => void;
  showDraftButton?: boolean;
  maxHeight?: number;
  className?: string;
}

interface TierVisualization {
  tier: number;
  players: Player[];
  color: string;
  label: string;
  minRank: number;
  maxRank: number;
  playerCount: number;
  width: number; // Width percentage for visualization
}

// Lightweight tier chart without D3.js dependency
export const LightweightTierChart = memo<LightweightTierChartProps>(({
  players,
  scoringFormat = 'PPR',
  numberOfTiers = 6,
  onPlayerClick,
  onPlayerDraft,
  showDraftButton = false,
  maxHeight = 600,
  className = ""
}) => {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal');

  // Calculate tiers using optimized calculator
  const tiers = useMemo(async () => {
    return calculateOptimizedTiers(players, numberOfTiers, scoringFormat, true);
  }, [players, numberOfTiers, scoringFormat]);

  // Resolve tiers (handle async)
  const [resolvedTiers, setResolvedTiers] = useState<any[]>([]);
  
  React.useEffect(() => {
    if (tiers instanceof Promise) {
      tiers.then(setResolvedTiers);
    } else {
      setResolvedTiers(tiers);
    }
  }, [tiers]);

  // Transform tiers for visualization
  const tierVisualizations = useMemo((): TierVisualization[] => {
    if (!resolvedTiers.length) return [];

    const maxPlayers = Math.max(...resolvedTiers.map(t => t.players.length));
    
    return resolvedTiers.map(tier => ({
      ...tier,
      width: (tier.players.length / maxPlayers) * 100
    }));
  }, [resolvedTiers]);

  const handleTierSelect = useCallback((tierNumber: number) => {
    setSelectedTier(selectedTier === tierNumber ? null : tierNumber);
  }, [selectedTier]);

  if (!players.length) {
    return (
      <div className={`flex items-center justify-center h-64 bg-slate-900/30 rounded-lg ${className}`}>
        <p className="text-slate-400">No players available</p>
      </div>
    );
  }

  if (!resolvedTiers.length) {
    return (
      <div className={`flex items-center justify-center h-64 bg-slate-900/30 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Calculating tiers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-slate-200">
            Player Tiers ({players.length} players)
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('horizontal')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'horizontal' 
                  ? 'bg-electric-blue text-black' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Horizontal
            </button>
            <button
              onClick={() => setViewMode('vertical')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'vertical' 
                  ? 'bg-electric-blue text-black' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Vertical
            </button>
          </div>
        </div>

        {/* Tier Legend */}
        <div className="flex items-center gap-2 text-xs">
          {tierVisualizations.slice(0, 6).map((tier) => (
            <div key={tier.tier} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: tier.color }}
              />
              <span className="text-slate-400">{tier.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal View */}
      {viewMode === 'horizontal' && (
        <div className="space-y-4">
          {tierVisualizations.map((tier) => (
            <TierRow
              key={tier.tier}
              tier={tier}
              isSelected={selectedTier === tier.tier}
              onSelect={handleTierSelect}
              onPlayerClick={onPlayerClick}
              onPlayerDraft={onPlayerDraft}
              showDraftButton={showDraftButton}
            />
          ))}
        </div>
      )}

      {/* Vertical View */}
      {viewMode === 'vertical' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tierVisualizations.map((tier) => (
            <TierColumn
              key={tier.tier}
              tier={tier}
              isSelected={selectedTier === tier.tier}
              onSelect={handleTierSelect}
              onPlayerClick={onPlayerClick}
              onPlayerDraft={onPlayerDraft}
              showDraftButton={showDraftButton}
              maxHeight={maxHeight}
            />
          ))}
        </div>
      )}
    </div>
  );
});

LightweightTierChart.displayName = 'LightweightTierChart';

// Individual tier row component for horizontal view
interface TierRowProps {
  tier: TierVisualization;
  isSelected: boolean;
  onSelect: (tierNumber: number) => void;
  onPlayerClick?: (player: Player) => void;
  onPlayerDraft?: (player: Player) => void;
  showDraftButton: boolean;
}

const TierRow = memo<TierRowProps>(({
  tier,
  isSelected,
  onSelect,
  onPlayerClick,
  onPlayerDraft,
  showDraftButton
}) => {
  return (
    <div
      className={`
        relative border rounded-lg p-4 transition-all duration-300 cursor-pointer
        ${isSelected 
          ? 'border-opacity-50 shadow-2xl scale-[1.02]' 
          : 'border-slate-700 hover:border-slate-600'
        }
      `}
      style={{
        borderColor: isSelected ? tier.color : undefined,
        boxShadow: isSelected ? `0 0 20px ${tier.color}20` : undefined
      }}
      onClick={() => onSelect(tier.tier)}
    >
      {/* Tier Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: tier.color }}
          />
          <h4 className="text-lg font-bold text-slate-200">{tier.label}</h4>
          <span className="text-sm text-slate-500">
            Ranks {tier.minRank}-{tier.maxRank} • {tier.playerCount} players
          </span>
        </div>

        {/* Visual bar */}
        <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              backgroundColor: tier.color,
              width: `${tier.width}%`
            }}
          />
        </div>
      </div>

      {/* Player List */}
      <div className={`transition-all duration-300 ${isSelected ? 'max-h-96' : 'max-h-24'} overflow-hidden`}>
        <VirtualizedPlayerList
          players={tier.players}
          onPlayerClick={onPlayerClick}
          onPlayerDraft={onPlayerDraft}
          itemHeight={60}
          containerHeight={isSelected ? 320 : 80}
          showDraftButton={showDraftButton}
          showRanks={false}
        />
      </div>

      {/* Expand indicator */}
      <div className="absolute bottom-2 right-2">
        <div className={`
          w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center
          transition-transform duration-300
          ${isSelected ? 'rotate-180' : ''}
        `}>
          <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
});

TierRow.displayName = 'TierRow';

// Individual tier column component for vertical view
interface TierColumnProps extends TierRowProps {
  maxHeight: number;
}

const TierColumn = memo<TierColumnProps>(({
  tier,
  isSelected,
  onSelect,
  onPlayerClick,
  onPlayerDraft,
  showDraftButton,
  maxHeight
}) => {
  return (
    <div
      className={`
        relative border rounded-lg p-4 transition-all duration-300
        ${isSelected 
          ? 'border-opacity-50 shadow-xl' 
          : 'border-slate-700 hover:border-slate-600'
        }
      `}
      style={{
        borderColor: isSelected ? tier.color : undefined,
        boxShadow: isSelected ? `0 0 15px ${tier.color}20` : undefined
      }}
    >
      {/* Tier Header */}
      <div 
        className="cursor-pointer pb-3 border-b border-slate-700"
        onClick={() => onSelect(tier.tier)}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: tier.color }}
          />
          <h4 className="font-bold text-slate-200">{tier.label}</h4>
        </div>
        <p className="text-xs text-slate-500">
          {tier.playerCount} players • Ranks {tier.minRank}-{tier.maxRank}
        </p>
      </div>

      {/* Player List */}
      <div className="pt-3">
        <VirtualizedPlayerList
          players={tier.players}
          onPlayerClick={onPlayerClick}
          onPlayerDraft={onPlayerDraft}
          itemHeight={70}
          containerHeight={Math.min(maxHeight - 120, tier.players.length * 70)}
          showDraftButton={showDraftButton}
          showRanks={false}
          className="border-none"
        />
      </div>
    </div>
  );
});

TierColumn.displayName = 'TierColumn';

export default LightweightTierChart;