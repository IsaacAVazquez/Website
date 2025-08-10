"use client";

import { useState, useMemo, useEffect } from "react";
import { IconFilter, IconAdjustments, IconRefresh, IconDatabase } from "@tabler/icons-react";
import { Heading } from "@/components/ui/Heading";
import { LazyDraftTierChartWrapper } from "@/components/lazy/LazyFantasyComponents";
import { ScoringFormat as ScoringFormatType, Position } from "@/types";
import { useUnifiedFantasyData } from "@/hooks/useUnifiedFantasyData";
import { logger } from '@/lib/logger';

type ScoringFormat = "standard" | "halfPPR" | "ppr";
type PositionFilter = "ALL" | "QB" | "RB" | "WR" | "TE" | "FLEX" | "K" | "DST";

export default function DraftTiersContent() {
  const [scoringFormat, setScoringFormat] = useState<ScoringFormat>("halfPPR");
  const [positionFilter, setPositionFilter] = useState<PositionFilter>("ALL");

  // Convert local scoring format to the type expected by the hook
  const apiScoringFormat: ScoringFormatType = scoringFormat === 'halfPPR' ? 'HALF' : 
    scoringFormat === 'ppr' ? 'PPR' : 'STD';

  // Convert position filter to Position type (undefined for ALL)
  const apiPosition: Position | undefined = positionFilter === "ALL" ? undefined : positionFilter as Position;

  // Use unified fantasy data hook with tier calculation
  const {
    players: allPlayers,
    tierData,
    isLoading,
    error,
    dataSource,
    lastUpdated,
    executionTime,
    cacheHit,
    refresh,
    refreshTiers,
    getDataStatus
  } = useUnifiedFantasyData({
    position: apiPosition,
    scoringFormat: apiScoringFormat,
    autoRefresh: false, // Manual refresh only
    withTiers: positionFilter !== "ALL", // Only calculate tiers for specific positions
    preferredMethod: 'auto'
  });

  // Filter players based on position (simplified since unified hook handles most filtering)
  const filteredPlayers = useMemo(() => {
    try {
      if (!allPlayers || allPlayers.length === 0) {
        return [];
      }

      let players = [...allPlayers];

      // Additional client-side filtering for FLEX position when getting all positions
      if (positionFilter === "FLEX" && apiPosition === undefined) {
        // FLEX includes RB, WR, TE from all positions data
        players = players.filter(player => 
          player && player.position && ["RB", "WR", "TE"].includes(player.position)
        );
        
        // Sort by average rank for consistency
        players.sort((a, b) => {
          if (!a || !b) return 0;
          const aRank = parseFloat(a.averageRank?.toString() || "999");
          const bRank = parseFloat(b.averageRank?.toString() || "999");
          return aRank - bRank;
        });
      }

      return players;
    } catch (error) {
      logger.error('Error filtering players:', error);
      return [];
    }
  }, [allPlayers, positionFilter, apiPosition]);

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

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Heading as="h1" className="text-center mb-4 text-4xl font-bold bg-gradient-to-r from-electric-blue to-matrix-green text-transparent bg-clip-text">
            Fantasy Draft Tiers
          </Heading>
          <p className="text-center text-slate-400 max-w-2xl mx-auto">
            Interactive tier-based rankings to optimize your fantasy football draft strategy.
            Players are grouped by similar value to help you make the best picks.
          </p>
        </div>

        {/* Data Source Status */}
        <div className="mb-6">
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
        </div>

        {/* Controls */}
        <div className="mb-8">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6">
            <div className="space-y-6">
              {/* Position Filter */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <IconFilter className="text-electric-blue" size={18} />
                  <span className="text-slate-300 font-medium">Position Filter</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {positionOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPositionFilter(option.value)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${positionFilter === option.value
                          ? "bg-electric-blue text-slate-900 shadow-lg shadow-electric-blue/25 transform scale-105"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scoring Format */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <IconAdjustments className="text-matrix-green" size={18} />
                  <span className="text-slate-300 font-medium">Scoring Format</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {scoringOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setScoringFormat(option.value)}
                      className={`
                        px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${scoringFormat === option.value
                          ? "bg-matrix-green text-slate-900 shadow-lg shadow-matrix-green/25 transform scale-105"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Selection Summary */}
              <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-800">
                <div className="text-center">
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Showing</div>
                  <div className="text-sm text-slate-300 font-medium">
                    {positionOptions.find(o => o.value === positionFilter)?.label}
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-700"></div>
                <div className="text-center">
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Format</div>
                  <div className="text-sm text-slate-300 font-medium">
                    {scoringOptions.find(o => o.value === scoringFormat)?.label}
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-700"></div>
                <div className="text-center">
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Players</div>
                  <div className="text-sm text-electric-blue font-medium">
                    {filteredPlayers.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mb-8">
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
        </div>

        {/* Tier Chart */}
        <div>
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
            <LazyDraftTierChartWrapper 
              players={filteredPlayers} 
              allPlayers={allPlayers}
              scoringFormat={scoringFormat}
              positionFilter={positionFilter}
            />
          )}
        </div>

        {/* Data Source Info */}
        <div className="mt-8">
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
        </div>
      </div>
    </div>
  );
}