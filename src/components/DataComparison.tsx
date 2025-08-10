'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Player, Position } from '@/types';
import { motion } from 'framer-motion';
import { BarChart2, Users, TrendingUp, Eye, EyeOff } from 'lucide-react';

interface ComparisonData {
  [dataset: string]: {
    players: Player[];
    count: number;
  };
}

interface DataComparisonProps {
  position: Position;
  isVisible: boolean;
  onToggle: () => void;
}

export default function DataComparison({ position, isVisible, onToggle }: DataComparisonProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchComparisonData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/data-manager?position=${position}&compare=true`);
      const data = await response.json();

      if (data.success) {
        setComparisonData(data.comparison);
      } else {
        setError('Failed to fetch comparison data');
      }
    } catch (err) {
      setError('Error fetching comparison data');
      console.error('Comparison fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [position]);

  useEffect(() => {
    if (isVisible) {
      fetchComparisonData();
    }
  }, [position, isVisible, fetchComparisonData]);

  const getDatasetLabel = (dataset: string) => {
    switch (dataset) {
      case 'free-ranking': return 'Free Rankings';
      case 'fantasypros-session': return 'FantasyPros Login';
      case 'current': return 'Current Data';
      default: return dataset;
    }
  };

  const getDatasetColor = (dataset: string) => {
    switch (dataset) {
      case 'free-ranking': return 'bg-yellow-500';
      case 'fantasypros-session': return 'bg-green-500';
      case 'current': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const findPlayerDifferences = (dataset1: Player[], dataset2: Player[]) => {
    const differences = [];
    const names1 = new Set(dataset1.map(p => p.name));
    const names2 = new Set(dataset2.map(p => p.name));
    
    // Players only in dataset1
    const onlyIn1 = dataset1.filter(p => !names2.has(p.name));
    const onlyIn2 = dataset2.filter(p => !names1.has(p.name));
    
    return {
      onlyInFirst: onlyIn1,
      onlyInSecond: onlyIn2,
      common: dataset1.filter(p => names2.has(p.name)).length
    };
  };

  const getRankingDifferences = (player1: Player, player2: Player) => {
    const rank1 = typeof player1.averageRank === 'string' ? parseFloat(player1.averageRank) : player1.averageRank;
    const rank2 = typeof player2.averageRank === 'string' ? parseFloat(player2.averageRank) : player2.averageRank;
    return Math.abs(rank1 - rank2);
  };

  if (!isVisible) {
    return (
      <motion.button
        onClick={onToggle}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Eye className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed top-0 right-0 h-full w-96 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 p-6 overflow-y-auto z-40"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Data Comparison</h3>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <EyeOff className="w-5 h-5" />
        </button>
      </div>

      {/* Position Badge */}
      <div className="mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          {position} Position Analysis
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Comparison Data */}
      {comparisonData && !loading && (
        <div className="space-y-6">
          {/* Dataset Overview */}
          <div className="space-y-3">
            <h4 className="text-md font-semibold text-gray-200 mb-3">Dataset Overview</h4>
            {Object.entries(comparisonData).map(([dataset, data]) => (
              <div key={dataset} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getDatasetColor(dataset)}`}></div>
                    <span className="font-medium text-white">{getDatasetLabel(dataset)}</span>
                  </div>
                  <span className="text-cyan-400 font-mono">{data.count}</span>
                </div>
                
                {data.count > 0 && (
                  <div className="text-xs text-gray-400 mt-2">
                    Top 3: {data.players.slice(0, 3).map(p => p.name).join(', ')}
                    {data.count > 3 && '...'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Detailed Comparison */}
          {Object.keys(comparisonData).length >= 2 && (
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-200">Detailed Analysis</h4>
              
              {/* Compare Free Rankings vs FantasyPros Login */}
              {comparisonData['free-ranking'] && comparisonData['fantasypros-session'] && (
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h5 className="font-medium text-gray-200 mb-3">Free vs Login Data</h5>
                  
                  {(() => {
                    const freeData = comparisonData['free-ranking'].players;
                    const sessionData = comparisonData['fantasypros-session'].players;
                    const diff = findPlayerDifferences(freeData, sessionData);
                    
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Common Players:</span>
                          <span className="text-green-400">{diff.common}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Only in Free:</span>
                          <span className="text-yellow-400">{diff.onlyInFirst.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Only in Login:</span>
                          <span className="text-blue-400">{diff.onlyInSecond.length}</span>
                        </div>
                        
                        {diff.onlyInFirst.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-yellow-400 mb-1">Free-only players:</p>
                            <p className="text-xs text-gray-300">
                              {diff.onlyInFirst.slice(0, 3).map(p => p.name).join(', ')}
                              {diff.onlyInFirst.length > 3 && ` +${diff.onlyInFirst.length - 3} more`}
                            </p>
                          </div>
                        )}
                        
                        {diff.onlyInSecond.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-blue-400 mb-1">Login-only players:</p>
                            <p className="text-xs text-gray-300">
                              {diff.onlyInSecond.slice(0, 3).map(p => p.name).join(', ')}
                              {diff.onlyInSecond.length > 3 && ` +${diff.onlyInSecond.length - 3} more`}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Data Quality Metrics */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h5 className="font-medium text-gray-200 mb-3">Data Quality</h5>
                <div className="space-y-2 text-sm">
                  {Object.entries(comparisonData).map(([dataset, data]) => {
                    const validRanks = data.players.filter(p => {
                      const rank = typeof p.averageRank === 'string' ? parseFloat(p.averageRank) : p.averageRank;
                      return !isNaN(rank) && rank > 0;
                    }).length;
                    
                    const completeness = data.count > 0 ? (validRanks / data.count * 100).toFixed(1) : '0';
                    
                    return (
                      <div key={dataset} className="flex justify-between">
                        <span className="text-gray-400">{getDatasetLabel(dataset)}:</span>
                        <span className={`${parseFloat(completeness) > 90 ? 'text-green-400' : parseFloat(completeness) > 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {completeness}% complete
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={fetchComparisonData}
            disabled={loading}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white py-2 px-4 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Refreshing...' : 'Refresh Comparison'}
          </button>
        </div>
      )}
    </motion.div>
  );
}