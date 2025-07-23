"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { IconChevronRight, IconFilter, IconAdjustments, IconRefresh, IconDatabase } from "@tabler/icons-react";
import { Heading } from "@/components/ui/Heading";
import DraftTierChart from "@/components/DraftTierChart";
import { Player, ScoringFormat as ScoringFormatType } from "@/types";
import { useAllFantasyData } from "@/hooks/useAllFantasyData";

type ScoringFormat = "standard" | "halfPPR" | "ppr";
type PositionFilter = "ALL" | "QB" | "RB" | "WR" | "TE" | "FLEX" | "K" | "DST";

export default function DraftTiersContent() {
  const [scoringFormat, setScoringFormat] = useState<ScoringFormat>("halfPPR");
  const [positionFilter, setPositionFilter] = useState<PositionFilter>("ALL");
  const [showSettings, setShowSettings] = useState(false);

  // Convert local scoring format to the type expected by the hook
  const apiScoringFormat: ScoringFormatType = scoringFormat === 'halfPPR' ? 'HALF_PPR' : scoringFormat.toUpperCase() as ScoringFormatType;

  // Load all players using real data
  const {
    players: allPlayers,
    isLoading,
    error,
    dataSource,
    cacheStatus,
    lastUpdated,
    refresh,
    clearCache,
    getCacheInfo
  } = useAllFantasyData({
    scoringFormat: apiScoringFormat,
    autoRefresh: true,
    refreshInterval: 10 * 60 * 1000 // 10 minutes
  });

  const cacheInfo = getCacheInfo();

  // Filter players based on position
  const filteredPlayers = useMemo(() => {
    let players = [...allPlayers];

    // Apply position filter
    if (positionFilter !== "ALL") {
      if (positionFilter === "FLEX") {
        players = players.filter(p => ["RB", "WR", "TE"].includes(p.position));
      } else {
        players = players.filter(p => p.position === positionFilter);
      }
    }

    // Sort by averageRank
    players.sort((a, b) => {
      const aRank = parseFloat(a.averageRank?.toString() || "999");
      const bRank = parseFloat(b.averageRank?.toString() || "999");
      return aRank - bRank;
    });

    return players;
  }, [allPlayers, positionFilter, scoringFormat]);

  const positionOptions: { value: PositionFilter; label: string }[] = [
    { value: "ALL", label: "All Positions" },
    { value: "QB", label: "Quarterbacks" },
    { value: "RB", label: "Running Backs" },
    { value: "WR", label: "Wide Receivers" },
    { value: "TE", label: "Tight Ends" },
    { value: "FLEX", label: "FLEX (RB/WR/TE)" },
    { value: "K", label: "Kickers" },
    { value: "DST", label: "Defense/ST" },
  ];

  const scoringOptions: { value: ScoringFormat; label: string }[] = [
    { value: "standard", label: "Standard" },
    { value: "halfPPR", label: "Half-PPR" },
    { value: "ppr", label: "PPR" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-electric-blue/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-matrix-green/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Heading as="h1" className="text-center mb-4 text-4xl font-bold bg-gradient-to-r from-electric-blue to-matrix-green text-transparent bg-clip-text">
            Fantasy Draft Tiers
          </Heading>
          <p className="text-center text-slate-400 max-w-2xl mx-auto">
            Interactive tier-based rankings to optimize your fantasy football draft strategy.
            Players are grouped by similar value to help you make the best picks.
          </p>
        </motion.div>

        {/* Data Source Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <div className="flex items-center justify-center gap-4 text-sm">
            {/* Data Source Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                dataSource === 'api' ? 'bg-matrix-green' : 
                dataSource === 'cache' ? 'bg-electric-blue' : 
                'bg-warning-amber'
              }`}></div>
              <span className="text-slate-400">
                {dataSource === 'api' ? 'Live FantasyPros Data' :
                 dataSource === 'cache' ? 'Cached FantasyPros Data' :
                 'Sample Data (Demo)'}
              </span>
            </div>
            
            {/* Last Updated */}
            {lastUpdated && (
              <span className="text-slate-500">
                Updated: {lastUpdated}
              </span>
            )}
            
            {/* Refresh Button */}
            <button
              onClick={refresh}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
            >
              <IconRefresh className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mt-3 text-center text-warning-amber text-sm">
              ⚠️ {error}
            </div>
          )}
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Position Filter */}
              <div className="flex items-center gap-4 flex-wrap justify-center lg:justify-start">
                <span className="text-slate-400 text-sm font-medium">Position:</span>
                <div className="flex flex-wrap gap-2">
                  {positionOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPositionFilter(option.value)}
                      className={`
                        px-4 py-2 rounded-md text-sm font-medium transition-all
                        ${positionFilter === option.value
                          ? "bg-electric-blue text-slate-900 shadow-lg shadow-electric-blue/25"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scoring Format */}
              <div className="flex items-center gap-4">
                <span className="text-slate-400 text-sm font-medium">Scoring:</span>
                <div className="flex gap-2">
                  {scoringOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setScoringFormat(option.value)}
                      className={`
                        px-4 py-2 rounded-md text-sm font-medium transition-all
                        ${scoringFormat === option.value
                          ? "bg-matrix-green text-slate-900 shadow-lg shadow-matrix-green/25"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <IconAdjustments className="text-electric-blue mt-1" size={20} />
              <div className="text-sm text-slate-400">
                <p className="mb-2">
                  Players are grouped into tiers based on their projected fantasy value. 
                  Players within the same tier are considered roughly equivalent in value.
                </p>
                <p>
                  <strong className="text-slate-300">Tip:</strong> When it's your turn to pick, 
                  choose any player from the highest available tier based on your team needs.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tier Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-96 bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-lg">
              <div className="text-center">
                <IconRefresh className="w-8 h-8 animate-spin text-electric-blue mx-auto mb-4" />
                <p className="text-slate-400">Loading draft tiers...</p>
                <p className="text-slate-500 text-sm mt-2">
                  Fetching real fantasy data from FantasyPros
                </p>
              </div>
            </div>
          ) : (
            <DraftTierChart 
              players={filteredPlayers} 
              scoringFormat={scoringFormat}
              positionFilter={positionFilter}
            />
          )}
        </motion.div>

        {/* Stats & Data Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          {/* Player Count Stats */}
          <div className="text-center text-sm text-slate-500 mb-6">
            Showing {filteredPlayers.length} players
            {positionFilter !== "ALL" && ` • ${positionOptions.find(o => o.value === positionFilter)?.label}`}
            {` • ${scoringOptions.find(o => o.value === scoringFormat)?.label} Scoring`}
          </div>
          
          {/* Data Source Info */}
          <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <IconDatabase className="text-electric-blue mt-1" size={20} />
              <div className="text-sm text-slate-400">
                <h4 className="text-slate-300 font-medium mb-2">Data Source</h4>
                <p>
                  {dataSource === 'api' 
                    ? 'Real-time data from FantasyPros expert consensus rankings. Data is automatically cached for faster loading.'
                    : dataSource === 'cache'
                    ? 'Cached data from FantasyPros expert consensus rankings. Data persists between visits for offline access.'
                    : 'Sample demonstration data. Use the admin panel to fetch live FantasyPros data for current rankings.'
                  }
                </p>
                {(dataSource === 'cache' || dataSource === 'api') && (
                  <p className="text-electric-blue text-xs mt-2">
                    💾 Data cached for offline access • Auto-refreshes every 10 minutes
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}