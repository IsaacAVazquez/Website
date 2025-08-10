"use client";

import { motion } from "framer-motion";
import { DraftState } from "@/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { Heading } from "@/components/ui/Heading";
import { MorphButton } from "@/components/ui/MorphButton";
import { Badge } from "@/components/ui/Badge";
import { 
  IconDownload, 
  IconRefresh, 
  IconClock, 
  IconTrendingUp,
  IconUsers,
  IconTarget,
  IconTrophy
} from "@tabler/icons-react";

interface DraftControlsProps {
  draftState: DraftState;
  onExport: (format: 'csv' | 'json') => void;
  onReset: () => void;
}

export function DraftControls({ draftState, onExport, onReset }: DraftControlsProps) {
  const totalPicks = draftState.settings.totalTeams * draftState.settings.rounds;
  const completionPercentage = Math.round((draftState.picks.length / totalPicks) * 100);
  
  // Calculate draft duration if started
  const getDraftDuration = (): string => {
    if (!draftState.startTime) return '--';
    
    const endTime = draftState.endTime || new Date();
    const durationMs = endTime.getTime() - draftState.startTime.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  // Find best value picks (players drafted significantly below their ADP)
  const getBestValues = () => {
    return draftState.picks
      .filter(pick => pick.player.adp && pick.player.adp > pick.pickNumber + 10) // drafted 10+ spots early
      .sort((a, b) => (b.player.adp || 0) - (a.player.adp || 0) - (b.pickNumber - a.pickNumber))
      .slice(0, 3);
  };

  // Find reaches (players drafted significantly above their ADP)
  const getReaches = () => {
    return draftState.picks
      .filter(pick => pick.player.adp && pick.pickNumber > pick.player.adp + 10) // drafted 10+ spots late
      .sort((a, b) => (a.pickNumber - (a.player.adp || 0)) - (b.pickNumber - (b.player.adp || 0)))
      .slice(0, 3);
  };

  const bestValues = getBestValues();
  const reaches = getReaches();

  return (
    <div className="space-y-4">
      {/* Draft Progress */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <IconTrendingUp className="text-electric-blue" size={20} />
          <Heading level={5}>Draft Progress</Heading>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">Completion</span>
            <span className="text-sm font-medium text-white">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-electric-blue to-matrix-green h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="text-center p-2 bg-slate-800/30 rounded">
            <div className="text-slate-400">Picks Made</div>
            <div className="font-medium text-white">
              {draftState.picks.length}/{totalPicks}
            </div>
          </div>
          
          <div className="text-center p-2 bg-slate-800/30 rounded">
            <div className="text-slate-400">Duration</div>
            <div className="font-medium text-white">{getDraftDuration()}</div>
          </div>
          
          <div className="text-center p-2 bg-slate-800/30 rounded">
            <div className="text-slate-400">Round</div>
            <div className="font-medium text-white">
              {draftState.currentRound}/{draftState.settings.rounds}
            </div>
          </div>
          
          <div className="text-center p-2 bg-slate-800/30 rounded">
            <div className="text-slate-400">Format</div>
            <div className="font-medium text-white">{draftState.settings.scoringFormat}</div>
          </div>
        </div>
      </GlassCard>

      {/* Draft Analysis */}
      {draftState.picks.length > 5 && (
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <IconTarget className="text-matrix-green" size={20} />
            <Heading level={5}>Draft Analysis</Heading>
          </div>

          {/* Best Values */}
          {bestValues.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="matrix" size="xs">Best Values</Badge>
              </div>
              <div className="space-y-2">
                {bestValues.map(pick => (
                  <div 
                    key={pick.pickNumber} 
                    className="flex items-center justify-between p-2 bg-matrix-green/10 rounded text-xs"
                  >
                    <div>
                      <div className="font-medium text-white">{pick.player.name}</div>
                      <div className="text-matrix-green">{pick.player.position} • {pick.player.team}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400">Pick {pick.pickNumber}</div>
                      <div className="text-matrix-green">ADP {pick.player.adp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reaches */}
          {reaches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" size="xs">Reaches</Badge>
              </div>
              <div className="space-y-2">
                {reaches.map(pick => (
                  <div 
                    key={pick.pickNumber} 
                    className="flex items-center justify-between p-2 bg-warning-amber/10 rounded text-xs"
                  >
                    <div>
                      <div className="font-medium text-white">{pick.player.name}</div>
                      <div className="text-warning-amber">{pick.player.position} • {pick.player.team}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400">Pick {pick.pickNumber}</div>
                      <div className="text-warning-amber">ADP {pick.player.adp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bestValues.length === 0 && reaches.length === 0 && (
            <div className="text-center py-4">
              <p className="text-slate-500 text-sm">More data after 10+ picks</p>
            </div>
          )}
        </GlassCard>
      )}

      {/* League Settings Summary */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <IconUsers className="text-electric-blue" size={20} />
          <Heading level={5}>League Info</Heading>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">League:</span>
            <span className="text-white font-medium">{draftState.settings.leagueName}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-400">Teams:</span>
            <span className="text-white">{draftState.settings.totalTeams}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-400">Your Position:</span>
            <span className="text-matrix-green font-medium">{draftState.settings.userTeam}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-400">Draft Type:</span>
            <span className="text-white capitalize">{draftState.settings.draftType}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-400">Rounds:</span>
            <span className="text-white">{draftState.settings.rounds}</span>
          </div>
        </div>
      </GlassCard>

      {/* Action Buttons */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <IconTrophy className="text-electric-blue" size={20} />
          <Heading level={5}>Actions</Heading>
        </div>

        <div className="space-y-3">
          {/* Export Buttons */}
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Export Draft Results</p>
            <div className="grid grid-cols-2 gap-2">
              <MorphButton
                onClick={() => onExport('csv')}
                variant="outline"
                size="xs"
                className="flex items-center gap-1 justify-center"
              >
                <IconDownload size={12} />
                CSV
              </MorphButton>
              
              <MorphButton
                onClick={() => onExport('json')}
                variant="outline"
                size="xs"
                className="flex items-center gap-1 justify-center"
              >
                <IconDownload size={12} />
                JSON
              </MorphButton>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-2 border-t border-slate-700/50">
            <MorphButton
              onClick={onReset}
              variant="ghost"
              size="xs"
              className="w-full flex items-center gap-2 justify-center text-slate-400 hover:text-white"
            >
              <IconRefresh size={12} />
              New Draft
            </MorphButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}