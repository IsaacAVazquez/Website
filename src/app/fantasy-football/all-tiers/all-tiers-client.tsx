'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import PositionTiersChart, { PositionType } from '@/components/PositionTiersChart';
import { ModernButton } from '@/components/ui/ModernButton';

export default function AllTiersClient() {
  const [selectedPosition, setSelectedPosition] = useState<PositionType>('RB');

  const positions: { value: PositionType; label: string; emoji: string }[] = [
    { value: 'QB', label: 'Quarterbacks', emoji: '🏈' },
    { value: 'RB', label: 'Running Backs', emoji: '🏃' },
    { value: 'WR', label: 'Wide Receivers', emoji: '✋' },
    { value: 'TE', label: 'Tight Ends', emoji: '🎯' },
    { value: 'K', label: 'Kickers', emoji: '⚡' },
    { value: 'DST', label: 'Defense/ST', emoji: '🛡️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/fantasy-football"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fantasy Football
        </Link>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#6BCF7F]" />
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#FF6B35] via-[#F7B32B] to-[#FF8E53] text-transparent bg-clip-text">
              Live Fantasy Tier Rankings
            </h1>
          </div>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-4">
            All position tier rankings updated weekly with live data indicators.
            Interactive scatter plots showing average expert rank vs consensus rank.
          </p>

          {/* Live Data Badge */}
          <div className="inline-flex items-center gap-2 bg-[#6BCF7F]/20 border border-[#6BCF7F]/40 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-[#6BCF7F] rounded-full animate-pulse"></div>
            <span className="text-sm text-[#6BCF7F] font-semibold">Live Data • Updated Weekly</span>
          </div>
        </motion.header>

        {/* Position Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {positions.map((pos) => (
              <button
                key={pos.value}
                onClick={() => setSelectedPosition(pos.value)}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200
                  ${
                    selectedPosition === pos.value
                      ? 'bg-[#FF6B35]/20 border-[#FF6B35] shadow-lg shadow-[#FF6B35]/20'
                      : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                  }
                `}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{pos.emoji}</div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    {pos.value}
                  </div>
                  <div className="text-sm text-white font-medium">
                    {pos.label}
                  </div>
                </div>
                {selectedPosition === pos.value && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-[#FF6B35] rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Data Accuracy Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 bg-blue-900/20 border border-blue-800/30 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-semibold mb-1">
                Accurate & Live Data
              </p>
              <p className="text-xs text-gray-400">
                All rankings are sourced from expert consensus data and updated weekly (every Wednesday).
                The data freshness indicators below show exactly when each position was last updated.
                Tier calculations use statistical clustering algorithms to group players with similar projected performance.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <PositionTiersChart
            position={selectedPosition}
            width={900}
            height={600}
            showLabels={false}
            showDataIndicator={true}
            className="w-full"
          />
        </motion.div>

        {/* How to Read */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
            <h3 className="text-sm font-semibold mb-2 text-[#FF6B35]">Understanding the Chart</h3>
            <p className="text-xs text-gray-400">
              Each point represents a player. Lower and left = better rank.
              Points clustered together are in the same tier (similar value).
            </p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
            <h3 className="text-sm font-semibold mb-2 text-[#F7B32B]">Data Freshness</h3>
            <p className="text-xs text-gray-400">
              The indicators above the chart show when data was last updated.
              Green badges indicate fresh data updated within the last week.
            </p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
            <h3 className="text-sm font-semibold mb-2 text-[#6BCF7F]">Tier Colors</h3>
            <p className="text-xs text-gray-400">
              Tier 1 (orange) = Elite players. Tier 8 (teal) = Deep sleepers.
              Use tiers to identify players with similar projected value.
            </p>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/fantasy-football">
            <ModernButton variant="primary" size="md">
              View Original Charts
            </ModernButton>
          </Link>
          <Link href="/fantasy-football/draft-tracker">
            <ModernButton variant="outline" size="md">
              Open Draft Tracker
            </ModernButton>
          </Link>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center text-xs text-gray-500"
        >
          <p className="mb-2">
            Rankings are for informational purposes only. Always do your own research before making draft decisions.
          </p>
          <p>
            Data updated automatically every Wednesday at 9:00 AM PST via GitHub Actions.
            Manual updates: <code className="bg-gray-800 px-2 py-0.5 rounded">npm run update:fantasy-all</code>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
