'use client';

import React, { useState, useEffect } from 'react';
import { LazyTierChartEnhancedWrapper } from '@/components/lazy/LazyFantasyComponents';
import PositionSelector from '@/components/PositionSelector';
import DataComparison from '@/components/DataComparison';
import TierLegend, { useTierVisibility } from '@/components/TierLegend';
import { Position, ScoringFormat, TierGroup } from '@/types';
import { getScoringFormatDisplay } from '@/lib/scoringFormatUtils';
import { useUnifiedFantasyData } from '@/hooks/useUnifiedFantasyData';
import { useOverallFantasyData } from '@/hooks/useOverallFantasyData';
import { useAllFantasyData } from '@/hooks/useAllFantasyData';
import { ArrowLeft, Database, RefreshCw, FileText, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ModernButton } from '@/components/ui/ModernButton';
import { EnhancedPlayerCard } from '@/components/EnhancedPlayerCard';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';

export default function FantasyFootballPage() {
  const [selectedPosition, setSelectedPosition] = useState<Position>('QB');
  const [selectedFormat, setSelectedFormat] = useState<ScoringFormat>('PPR');
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [tierCount, setTierCount] = useState<number>(6);
  const [tierGroups, setTierGroups] = useState<TierGroup[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Conditional hook usage based on selected position
  const overallData = useOverallFantasyData({
    scoringFormat: selectedFormat,
    autoRefresh: false
  });
  
  const allData = useAllFantasyData({
    scoringFormat: selectedFormat,
    autoRefresh: false
  });
  
  const apiPosition = selectedPosition === 'OVERALL' || selectedPosition === 'ALL' ? undefined : selectedPosition;
  const regularData = useUnifiedFantasyData({
    position: apiPosition,
    scoringFormat: selectedFormat,
    autoRefresh: false,
    withTiers: selectedPosition !== 'OVERALL' && selectedPosition !== 'ALL' && selectedPosition !== 'FLEX',
    preferredMethod: 'auto',
    enhancedData: true
  });

  // Select appropriate data source based on position
  const currentData = selectedPosition === 'OVERALL' ? overallData : 
                     selectedPosition === 'ALL' ? allData : 
                     regularData;
  
  const {
    players: allPlayers,
    isLoading,
    error,
    dataSource,
    lastUpdated,
    refresh
  } = currentData;
  
  // Get additional data from regular hook when available
  const tierData = selectedPosition !== 'OVERALL' && selectedPosition !== 'ALL' ? regularData.tierData : null;
  const executionTime = selectedPosition !== 'OVERALL' && selectedPosition !== 'ALL' ? regularData.executionTime : 0;
  const cacheHit = selectedPosition !== 'OVERALL' && selectedPosition !== 'ALL' ? regularData.cacheHit : currentData.cacheStatus === 'fresh';
  const getDataStatus = selectedPosition !== 'OVERALL' && selectedPosition !== 'ALL' ? regularData.getDataStatus : () => ({ status: 'success' as const, message: 'Data loaded', color: 'green' });

  // Filter players for FLEX position if needed
  const players = selectedPosition === 'FLEX' && apiPosition === undefined 
    ? allPlayers.filter(p => ['RB', 'WR', 'TE'].includes(p.position))
    : allPlayers;

  // Create legacy compatibility object for existing code
  const cacheInfo = currentData.getCacheInfo ? currentData.getCacheInfo() : {
    status: cacheHit ? 'fresh' : 'stale',
    message: cacheHit ? 'Data is fresh' : 'Data needs refresh',
    color: cacheHit ? 'green' : 'yellow'
  };

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Data refresh is automatically handled by the unified hook

  // Tier visibility management
  const { hiddenTiers, toggleTier, setAllVisible } = useTierVisibility(
    selectedPosition,
    selectedFormat
  );

  // Prepare tier info for the legend using real tier groups
  const tierInfo = tierGroups.map((tierGroup) => {
    return {
      tier: tierGroup.tier,
      color: tierGroup.color,
      label: tierGroup.label || `Tier ${tierGroup.tier}`, // Use the unified label
      playerCount: tierGroup.players.length
    };
  });

  // Calculate dynamic chart height based on visible players
  const visiblePlayers = tierGroups
    .filter(tier => !hiddenTiers.has(tier.tier))
    .reduce((total, tier) => total + tier.players.length, 0);
  const PLAYER_HEIGHT = 35;
  const TIER_PADDING = 10;
  const visibleTierCount = tierGroups.filter(tier => !hiddenTiers.has(tier.tier)).length;
  const dynamicHeight = Math.max(400, visiblePlayers * PLAYER_HEIGHT + (visibleTierCount - 1) * TIER_PADDING + 200); // 200px for margins/labels

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Fantasy Football", href: "/fantasy-football" }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs customItems={breadcrumbs} className="text-cyan-400" />
        </div>

        {/* Back Button */}
        <Link 
          href="/projects"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
              Fantasy Football Tier Rankings
            </h1>
            <div className="flex items-center gap-4">
              {/* RB Tiers Scatter Plot Link */}
              <Link href="/fantasy-football/rb-tiers">
                <ModernButton variant="primary" size="sm" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  RB Scatter Plot
                </ModernButton>
              </Link>
              {/* Subtle Status Indicator */}
              {isClient && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    dataSource === 'api' ? 'bg-[#6BCF7F] dark:bg-[#8FE39E]' :
                    dataSource === 'cache' ? 'bg-[#FF6B35] dark:bg-[#FF8E53]' :
                    'bg-[#FFB020]'
                  }`}></div>
                  <span>{cacheInfo.message}</span>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-center text-gray-400 max-w-2xl mx-auto">
            Visualizing player tiers using clustering algorithms. 
            Players are grouped based on expert consensus rankings and uncertainty analysis.
          </p>
          
          {/* Last Updated */}
          {lastUpdated && (
            <p className="text-center text-gray-500 text-sm mt-2">
              Last updated: {lastUpdated}
            </p>
          )}
          
          {/* Error Message */}
          {error && (
            <p className="text-center text-red-400 text-sm mt-2">
              ⚠️ {error}
            </p>
          )}
        </motion.header>

        {/* Featured: RB Scatter Plot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Link href="/fantasy-football/rb-tiers">
            <div className="bg-gradient-to-r from-[#FF6B35]/20 to-[#F7B32B]/20 border border-[#FF6B35]/30 rounded-lg p-6 hover:border-[#FF6B35]/50 transition-all cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-[#FF6B35]" />
                    <span className="text-xs font-semibold text-[#FF6B35] uppercase tracking-wide">New Feature</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    RB Tier Rankings Scatter Plot
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Visualize running back tiers with an interactive scatter plot showing average expert rank vs consensus rank.
                    Updated weekly with color-coded tier groupings.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-[#FF8E53]">
                    <span>View RB Scatter Plot</span>
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="w-20 h-20 bg-[#FF6B35]/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-10 h-10 text-[#FF6B35]" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <PositionSelector
            selectedPosition={selectedPosition}
            selectedFormat={selectedFormat}
            onPositionChange={setSelectedPosition}
            onFormatChange={setSelectedFormat}
          />
        </motion.div>

        {/* Chart Container with Tier Legend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 mb-8"
        >
          {/* Main Chart */}
          <div className="flex-1 bg-gray-900 rounded-lg border border-gray-800 p-2 sm:p-4 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
                <p className="text-gray-400">Loading tier chart...</p>
              </div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <LazyTierChartEnhancedWrapper 
                players={players}
                width={Math.max(1400, players.length * 15 + 600)}
                height={dynamicHeight}
                numberOfTiers={6}
                scoringFormat={getScoringFormatDisplay(selectedFormat)}
                hiddenTiers={hiddenTiers}
                onTierCountChange={setTierCount}
                onTierGroupsChange={setTierGroups}
              />
            </div>
          )}
          </div>
          
          {/* Tier Legend */}
          {!isLoading && players.length > 0 && (
            <TierLegend
              tiers={tierInfo}
              hiddenTiers={hiddenTiers}
              onToggleTier={toggleTier}
              onToggleAll={(visible) => setAllVisible(visible, tierGroups.length)}
              className="sticky top-20"
            />
          )}
        </motion.div>

        {/* Technical Details */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
            <h3 className="text-lg font-semibold mb-2 text-cyan-400">How to Read</h3>
            <p className="text-sm text-gray-400">
              Players are grouped into color-coded tiers based on expert consensus rankings, not my own rankings.
              Horizontal bars show ranking uncertainty.
            </p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
            <h3 className="text-lg font-semibold mb-2 text-green-400">Tier Colors</h3>
            <p className="text-sm text-gray-400">
              Red → Yellow → Green → Blue represents decreasing player value.
              Players in the same tier are considered similar options.
            </p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
            <h3 className="text-lg font-semibold mb-2 text-yellow-400">Algorithm</h3>
            <p className="text-sm text-gray-400">
              Uses k-means clustering on expert rankings and standard deviations
              to identify natural player groupings.
            </p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
            <h3 className="text-lg font-semibold mb-2 text-purple-400">Data Source</h3>
            <p className="text-sm text-gray-400">
              {dataSource === 'api' 
                ? 'Live data from FantasyPros expert consensus rankings via session-based authentication.'
                : dataSource === 'cache'
                ? 'Cached data from previous FantasyPros fetch. Data persists between page visits for faster loading.'
                : 'Sample data for demonstration. Use admin panel to fetch live FantasyPros data.'
              }
            </p>
            {(dataSource === 'cache' || dataSource === 'api') && (
              <div className="mt-2 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#FF6B35] dark:text-[#FF8E53]" />
                <span className="text-xs text-[#FF6B35] dark:text-[#FF8E53]">
                  Data cached for offline access
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Enhanced Player Preview */}
        {!isLoading && players.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-[#FF6B35] dark:text-[#FF8E53]" />
              <h3 className="text-2xl font-bold text-white">Enhanced Player Cards</h3>
              <span className="px-3 py-1 bg-[#6BCF7F]/20 dark:bg-[#6BCF7F]/30 text-[#6BCF7F] dark:text-[#8FE39E] text-sm rounded-full border border-[#6BCF7F]/30 dark:border-[#6BCF7F]/40">
                NEW
              </span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {players.slice(0, 4).map((player) => (
                <EnhancedPlayerCard
                  key={player.id}
                  player={player}
                  compact={false}
                />
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-[#FF6B35]/10 dark:bg-[#FF6B35]/20 border border-[#FF6B35]/20 dark:border-[#FF6B35]/30 rounded-lg">
              <p className="text-sm text-[#4A3426] dark:text-[#FFE4D6] text-center">
                <span className="text-[#FF6B35] dark:text-[#FF8E53] font-semibold">Enhanced Data:</span>
                {' '}Now featuring expert consensus analysis, auction values, detailed projections,
                and advanced player insights inspired by The Ringer's approach.
              </p>
            </div>
          </motion.div>
        )}

        {/* Tech Stack */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-800"
        >
          <h3 className="text-xl font-semibold mb-4 text-center">Tech Stack</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-cyan-400 font-semibold">D3.js</div>
              <div className="text-sm text-gray-400">Data Visualization</div>
            </div>
            <div>
              <div className="text-green-400 font-semibold">K-Means</div>
              <div className="text-sm text-gray-400">Machine Learning</div>
            </div>
            <div>
              <div className="text-yellow-400 font-semibold">TypeScript</div>
              <div className="text-sm text-gray-400">Type Safety</div>
            </div>
            <div>
              <div className="text-purple-400 font-semibold">Framer Motion</div>
              <div className="text-sm text-gray-400">Animations</div>
            </div>
          </div>
        </motion.div>

        {/* Data Comparison Sidebar */}
        <DataComparison 
          position={selectedPosition}
          isVisible={showComparison}
          onToggle={() => setShowComparison(!showComparison)}
        />
      </div>
    </div>
  );
}