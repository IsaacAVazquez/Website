'use client';

import React from 'react';
import { Player } from '@/types';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Users, AlertTriangle } from 'lucide-react';

interface ExpertConsensusIndicatorProps {
  player: Player;
  showDetails?: boolean;
  className?: string;
}

export function ExpertConsensusIndicator({ 
  player, 
  showDetails = true,
  className = '' 
}: ExpertConsensusIndicatorProps) {
  const { consensusLevel, expertCount = 0, expertRanks = [] } = player;
  
  // Calculate rank variance
  const minRank = expertRanks.length > 0 ? Math.min(...expertRanks) : 0;
  const maxRank = expertRanks.length > 0 ? Math.max(...expertRanks) : 0;
  const rankRange = maxRank - minRank;

  // Consensus colors and icons
  const getConsensusConfig = (level: string) => {
    switch (level) {
      case 'high':
        return {
          color: 'text-matrix-green',
          bgColor: 'bg-matrix-green/20',
          borderColor: 'border-matrix-green/30',
          icon: TrendingUp,
          label: 'Strong Consensus',
          description: 'Experts agree on this player\'s value'
        };
      case 'medium':
        return {
          color: 'text-warning-amber',
          bgColor: 'bg-warning-amber/20',
          borderColor: 'border-warning-amber/30',
          icon: Minus,
          label: 'Mixed Opinions',
          description: 'Some disagreement among experts'
        };
      case 'low':
        return {
          color: 'text-error-red',
          bgColor: 'bg-error-red/20',
          borderColor: 'border-error-red/30',
          icon: TrendingDown,
          label: 'High Uncertainty',
          description: 'Significant expert disagreement'
        };
      default:
        return {
          color: 'text-slate-400',
          bgColor: 'bg-slate-400/20',
          borderColor: 'border-slate-400/30',
          icon: AlertTriangle,
          label: 'Unknown',
          description: 'Insufficient expert data'
        };
    }
  };

  const config = getConsensusConfig(consensusLevel || 'low');
  const IconComponent = config.icon;

  if (!showDetails) {
    // Compact indicator for lists
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div 
          className={`w-2 h-2 rounded-full ${config.bgColor.replace('/20', '')}`}
          title={`${config.label}: ${expertCount} experts`}
        />
        <span className={`text-xs ${config.color}`}>
          {expertCount}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3 ${className}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <IconComponent className={`w-5 h-5 ${config.color}`} />
        <div>
          <h4 className={`font-semibold ${config.color} text-sm`}>
            {config.label}
          </h4>
          <p className="text-xs text-slate-400">
            {config.description}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {/* Expert count */}
        <div className="flex items-center gap-2 text-xs">
          <Users className="w-3 h-3 text-slate-500" />
          <span className="text-slate-400">
            Based on {expertCount} expert{expertCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Rank variance */}
        {expertRanks.length > 1 && (
          <div className="text-xs text-slate-400">
            <span>Rank range: #{minRank} - #{maxRank}</span>
            {rankRange > 0 && (
              <span className={`ml-2 font-medium ${
                rankRange <= 10 ? 'text-matrix-green' :
                rankRange <= 25 ? 'text-warning-amber' :
                'text-error-red'
              }`}>
                (±{Math.round(rankRange / 2)})
              </span>
            )}
          </div>
        )}

        {/* Expert rank distribution visualization */}
        {expertRanks.length > 2 && (
          <div className="mt-3">
            <div className="text-xs text-slate-500 mb-1">Expert Rankings:</div>
            <div className="flex flex-wrap gap-1">
              {expertRanks.slice(0, 10).map((rank, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded text-xs font-mono ${
                    rank === minRank ? 'bg-matrix-green/30 text-matrix-green' :
                    rank === maxRank ? 'bg-error-red/30 text-error-red' :
                    'bg-slate-700/50 text-slate-300'
                  }`}
                >
                  #{rank}
                </span>
              ))}
              {expertRanks.length > 10 && (
                <span className="px-2 py-1 rounded text-xs bg-slate-600/30 text-slate-500">
                  +{expertRanks.length - 10}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ExpertConsensusIndicator;