'use client';

import React, { useState } from 'react';
import TierChartEnhanced from '@/components/TierChartEnhanced';
import PositionSelector from '@/components/PositionSelector';
import DataComparison from '@/components/DataComparison';
import TierLegend, { useTierVisibility } from '@/components/TierLegend';
import { Position, ScoringFormat } from '@/types';
import { getScoringFormatDisplay } from '@/lib/scoringFormatUtils';
import { useFantasyData } from '@/hooks/useFantasyData';
import { ArrowLeft, Database, RefreshCw, FileText } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MorphButton } from '@/components/ui/MorphButton';

export default function FantasyFootballPage() {
  const [selectedPosition, setSelectedPosition] = useState<Position>('QB');
  const [selectedFormat, setSelectedFormat] = useState<ScoringFormat>('PPR');
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [tierCount, setTierCount] = useState<number>(6);
  const [tierGroups, setTierGroups] = useState<any[]>([]);

  // Use the new fantasy data hook with caching
  const {
    players,
    isLoading,
    error,
    dataSource,
    cacheStatus,
    lastUpdated,
    refresh,
    clearCache,
    getCacheInfo
  } = useFantasyData({
    position: selectedPosition,
    scoringFormat: selectedFormat,
    autoRefresh: true,
    refreshInterval: 10 * 60 * 1000 // 10 minutes for production
  });

  const cacheInfo = getCacheInfo();

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
      label: `Tier ${tierGroup.tier}`,
      playerCount: tierGroup.players.length
    };
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10">
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
              {/* Static Tier Pages Link */}
              <Link href={`/fantasy-football/tiers/${selectedPosition.toLowerCase()}`}>
                <MorphButton variant="secondary" size="sm" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  View Static Tiers
                </MorphButton>
              </Link>
              {/* Subtle Status Indicator */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  dataSource === 'api' ? 'bg-matrix-green' : 
                  dataSource === 'cache' ? 'bg-electric-blue' : 
                  'bg-warning-amber'
                }`}></div>
                <span>{cacheInfo.message}</span>
              </div>
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

        {/* Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
              <TierChartEnhanced 
                players={players}
                width={Math.max(1400, players.length * 15 + 600)}
                height={Math.max(700, players.length * 9 + 300)}
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
                <Database className="w-4 h-4 text-electric-blue" />
                <span className="text-xs text-electric-blue">
                  Data cached for offline access
                </span>
              </div>
            )}
          </div>
        </motion.div>

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