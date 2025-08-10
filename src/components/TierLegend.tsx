import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TierInfo {
  tier: number;
  color: string;
  label: string;
  playerCount: number;
}

interface TierLegendProps {
  tiers: TierInfo[];
  hiddenTiers: Set<number>;
  onToggleTier: (tier: number) => void;
  onToggleAll: (visible: boolean) => void;
  className?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function TierLegend({
  tiers,
  hiddenTiers,
  onToggleTier,
  onToggleAll,
  className = '',
  collapsed = false,
  onCollapsedChange
}: TierLegendProps) {
  const [localCollapsed, setLocalCollapsed] = useState(collapsed);
  const allVisible = hiddenTiers.size === 0;
  const allHidden = hiddenTiers.size === tiers.length;

  useEffect(() => {
    setLocalCollapsed(collapsed);
  }, [collapsed]);

  const handleCollapsedChange = (newCollapsed: boolean) => {
    setLocalCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

  // Tier color mapping (matching the chart colors)
  const tierColors = [
    '#FF073A', // Tier 1 - Red (elite)
    '#FFB800', // Tier 2 - Amber
    '#39FF14', // Tier 3 - Matrix Green
    '#00F5FF', // Tier 4 - Electric Blue
    '#BF00FF', // Tier 5 - Neon Purple
    '#00FFBF', // Tier 6 - Cyber Teal
    '#FF1493', // Tier 7 - Deep Pink
    '#FFD700', // Tier 8 - Gold
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-800',
        'shadow-lg',
        localCollapsed ? 'w-12' : 'w-64',
        'transition-all duration-300',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        {!localCollapsed && (
          <h3 className="text-sm font-semibold text-white">Tier Legend</h3>
        )}
        <button
          onClick={() => handleCollapsedChange(!localCollapsed)}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label={localCollapsed ? 'Expand legend' : 'Collapse legend'}
        >
          {localCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {!localCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Show/Hide All Buttons */}
            <div className="p-3 border-b border-gray-800 flex gap-2">
              <button
                onClick={() => onToggleAll(true)}
                disabled={allVisible}
                className={cn(
                  'flex-1 px-2 py-1 text-xs rounded transition-colors',
                  allVisible
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                )}
              >
                Show All
              </button>
              <button
                onClick={() => onToggleAll(false)}
                disabled={allHidden}
                className={cn(
                  'flex-1 px-2 py-1 text-xs rounded transition-colors',
                  allHidden
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                )}
              >
                Hide All
              </button>
            </div>

            {/* Tier List */}
            <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
              {tiers.map((tierInfo) => {
                const isHidden = hiddenTiers.has(tierInfo.tier);
                const color = tierInfo.color || tierColors[(tierInfo.tier - 1) % tierColors.length];

                return (
                  <motion.div
                    key={tierInfo.tier}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (tierInfo.tier - 1) * 0.05 }}
                    className={cn(
                      'flex items-center justify-between p-2 rounded',
                      'hover:bg-gray-800/50 transition-colors cursor-pointer',
                      isHidden && 'opacity-50'
                    )}
                    onClick={() => onToggleTier(tierInfo.tier)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Color Indicator */}
                      <div
                        className="w-4 h-4 rounded"
                        style={{ 
                          backgroundColor: color,
                          opacity: isHidden ? 0.3 : 1,
                          boxShadow: isHidden ? 'none' : `0 0 8px ${color}40`
                        }}
                      />
                      
                      {/* Tier Label */}
                      <div className="flex flex-col">
                        <span className={cn(
                          'text-sm font-medium',
                          isHidden ? 'text-gray-500' : 'text-white'
                        )}>
                          {tierInfo.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {tierInfo.playerCount} players
                        </span>
                      </div>
                    </div>

                    {/* Toggle Icon */}
                    <div className="text-gray-400">
                      {isHidden ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer Info */}
            <div className="p-3 border-t border-gray-800">
              <p className="text-xs text-gray-500 text-center">
                Click tiers to toggle visibility
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Hook for persisting tier visibility preferences
export function useTierVisibility(position: string, scoringFormat: string) {
  const storageKey = `ff_tier_visibility_${position}_${scoringFormat}`;
  
  const [hiddenTiers, setHiddenTiers] = useState<Set<number>>(() => {
    if (typeof window === 'undefined') return new Set();
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      }
    } catch (error) {
      console.warn('Failed to load tier visibility preferences:', error);
    }
    
    // Default to showing only tiers 1-4 (hide tier 5+)
    return new Set([5, 6, 7, 8, 9, 10, 11, 12]);
  });

  // Save preferences when they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(hiddenTiers)));
    } catch (error) {
      console.warn('Failed to save tier visibility preferences:', error);
    }
  }, [hiddenTiers, storageKey]);

  const toggleTier = (tier: number) => {
    setHiddenTiers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tier)) {
        newSet.delete(tier);
      } else {
        newSet.add(tier);
      }
      return newSet;
    });
  };

  const setAllVisible = (visible: boolean, tierCount?: number) => {
    if (visible) {
      setHiddenTiers(new Set());
    } else if (tierCount !== undefined) {
      // Hide all tiers
      setHiddenTiers(new Set(Array.from({ length: tierCount }, (_, i) => i + 1)));
    }
  };

  return {
    hiddenTiers,
    toggleTier,
    setAllVisible
  };
}