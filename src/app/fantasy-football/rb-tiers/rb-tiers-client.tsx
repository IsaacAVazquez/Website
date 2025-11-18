'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, TrendingUp, Info } from 'lucide-react';
import Link from 'next/link';
import RBTiersChart from '@/components/RBTiersChart';
import { ModernButton } from '@/components/ui/ModernButton';

export default function RBTiersChartPage() {
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
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#FF6B35] via-[#F7B32B] to-[#FF8E53] text-transparent bg-clip-text mb-4">
            RB Tier Rankings
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Weekly running back tier rankings visualized as a scatter plot.
            Players are grouped into tiers based on expert consensus rankings.
          </p>
        </motion.header>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {/* How to Read */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#FF6B35] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold mb-1 text-[#FF8E53]">How to Read</h3>
                <p className="text-xs text-gray-400">
                  Lower and left = better rank. Points closer together = similar tier.
                  Hover for player details.
                </p>
              </div>
            </div>
          </div>

          {/* Tier Colors */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-[#F7B32B] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold mb-1 text-[#F7B32B]">Tier System</h3>
                <p className="text-xs text-gray-400">
                  8 color-coded tiers from elite (Tier 1) to deep sleepers (Tier 8).
                  Players in the same tier have similar value.
                </p>
              </div>
            </div>
          </div>

          {/* Data Source */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-[#6BCF7F] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold mb-1 text-[#6BCF7F]">Weekly Updates</h3>
                <p className="text-xs text-gray-400">
                  Rankings updated every Wednesday at 9:00 AM PST via automated data pipeline.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <RBTiersChart
            width={900}
            height={600}
            showLabels={false}
            className="w-full"
          />
        </motion.div>

        {/* Technical Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* About This Visualization */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-[#FF6B35]">
              About This Visualization
            </h3>
            <div className="space-y-3 text-sm text-gray-400">
              <p>
                This scatter plot shows running back rankings on two axes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong className="text-gray-300">X-axis (horizontal):</strong> Average expert rank from multiple sources</li>
                <li><strong className="text-gray-300">Y-axis (vertical):</strong> Expert consensus rank (ECR)</li>
                <li><strong className="text-gray-300">Color:</strong> Tier grouping (1-8), calculated algorithmically</li>
                <li><strong className="text-gray-300">Position:</strong> Players clustered in the lower-left are the highest ranked</li>
              </ul>
            </div>
          </div>

          {/* Data & Technology */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-[#F7B32B]">
              Data & Technology
            </h3>
            <div className="space-y-3 text-sm text-gray-400">
              <p>
                <strong className="text-gray-300">Data Source:</strong> Weekly static snapshot from fantasy football expert rankings
              </p>
              <p>
                <strong className="text-gray-300">Update Frequency:</strong> Every Wednesday via automated GitHub Actions workflow
              </p>
              <p>
                <strong className="text-gray-300">Visualization:</strong> Built with D3.js for interactive data visualization
              </p>
              <p>
                <strong className="text-gray-300">Tier Algorithm:</strong> Rank-based grouping system (Tier 1: ranks 1-4, Tier 2: 5-9, etc.)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/fantasy-football">
            <ModernButton variant="primary" size="md">
              View All Positions
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
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-xs text-gray-500"
        >
          <p>
            Rankings are for informational purposes only. Always do your own research before making draft decisions.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
