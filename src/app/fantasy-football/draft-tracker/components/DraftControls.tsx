"use client";

import { motion } from "framer-motion";
import { DraftState } from "@/types";
import { WarmCard } from "@/components/ui/WarmCard";
import { Heading } from "@/components/ui/Heading";
import { ModernButton } from "@/components/ui/ModernButton";
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
      <WarmCard hover={false} padding="md">
        <div className="flex items-center gap-2 mb-4">
          <IconTrendingUp className="text-[#FF6B35] dark:text-[#FF8E53]" size={20} />
          <Heading level={5}>Draft Progress</Heading>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">Completion</span>
            <span className="text-sm font-medium text-[#4A3426] dark:text-[#FFE4D6]">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-[#FFE4D6] dark:bg-[#4A3426] rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-[#FF6B35] to-[#6BCF7F] h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="text-center p-2 bg-[#FFF8F0] dark:bg-[#4A3426]/30 rounded">
            <div className="text-[#6B4F3D] dark:text-[#D4A88E]">Picks Made</div>
            <div className="font-medium text-[#4A3426] dark:text-[#FFE4D6]">
              {draftState.picks.length}/{totalPicks}
            </div>
          </div>

          <div className="text-center p-2 bg-[#FFF8F0] dark:bg-[#4A3426]/30 rounded">
            <div className="text-[#6B4F3D] dark:text-[#D4A88E]">Duration</div>
            <div className="font-medium text-[#4A3426] dark:text-[#FFE4D6]">{getDraftDuration()}</div>
          </div>

          <div className="text-center p-2 bg-[#FFF8F0] dark:bg-[#4A3426]/30 rounded">
            <div className="text-[#6B4F3D] dark:text-[#D4A88E]">Round</div>
            <div className="font-medium text-[#4A3426] dark:text-[#FFE4D6]">
              {draftState.currentRound}/{draftState.settings.rounds}
            </div>
          </div>

          <div className="text-center p-2 bg-[#FFF8F0] dark:bg-[#4A3426]/30 rounded">
            <div className="text-[#6B4F3D] dark:text-[#D4A88E]">Format</div>
            <div className="font-medium text-[#4A3426] dark:text-[#FFE4D6]">{draftState.settings.scoringFormat}</div>
          </div>
        </div>
      </WarmCard>

      {/* Draft Analysis */}
      {draftState.picks.length > 5 && (
        <WarmCard hover={false} padding="md">
          <div className="flex items-center gap-2 mb-4">
            <IconTarget className="text-[#6BCF7F] dark:text-[#8FE39E]" size={20} />
            <Heading level={5}>Draft Analysis</Heading>
          </div>

          {/* Best Values */}
          {bestValues.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" size="xs">Best Values</Badge>
              </div>
              <div className="space-y-2">
                {bestValues.map(pick => (
                  <div
                    key={pick.pickNumber}
                    className="flex items-center justify-between p-2 bg-[#6BCF7F]/10 dark:bg-[#6BCF7F]/20 rounded text-xs"
                  >
                    <div>
                      <div className="font-medium text-[#4A3426] dark:text-[#FFE4D6]">{pick.player.name}</div>
                      <div className="text-[#6BCF7F] dark:text-[#8FE39E]">{pick.player.position} • {pick.player.team}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#6B4F3D] dark:text-[#D4A88E]">Pick {pick.pickNumber}</div>
                      <div className="text-[#6BCF7F] dark:text-[#8FE39E]">ADP {pick.player.adp}</div>
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
                    className="flex items-center justify-between p-2 bg-[#FFB020]/10 dark:bg-[#FFC857]/20 rounded text-xs"
                  >
                    <div>
                      <div className="font-medium text-[#4A3426] dark:text-[#FFE4D6]">{pick.player.name}</div>
                      <div className="text-[#FFB020] dark:text-[#FFC857]">{pick.player.position} • {pick.player.team}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#6B4F3D] dark:text-[#D4A88E]">Pick {pick.pickNumber}</div>
                      <div className="text-[#FFB020] dark:text-[#FFC857]">ADP {pick.player.adp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bestValues.length === 0 && reaches.length === 0 && (
            <div className="text-center py-4">
              <p className="text-[#6B4F3D]/70 dark:text-[#D4A88E]/70 text-sm">More data after 10+ picks</p>
            </div>
          )}
        </WarmCard>
      )}

      {/* League Settings Summary */}
      <WarmCard hover={false} padding="md">
        <div className="flex items-center gap-2 mb-4">
          <IconUsers className="text-[#FF6B35] dark:text-[#FF8E53]" size={20} />
          <Heading level={5}>League Info</Heading>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#6B4F3D] dark:text-[#D4A88E]">League:</span>
            <span className="text-[#4A3426] dark:text-[#FFE4D6] font-medium">{draftState.settings.leagueName}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#6B4F3D] dark:text-[#D4A88E]">Teams:</span>
            <span className="text-[#4A3426] dark:text-[#FFE4D6]">{draftState.settings.totalTeams}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#6B4F3D] dark:text-[#D4A88E]">Your Position:</span>
            <span className="text-[#6BCF7F] dark:text-[#8FE39E] font-medium">{draftState.settings.userTeam}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#6B4F3D] dark:text-[#D4A88E]">Draft Type:</span>
            <span className="text-[#4A3426] dark:text-[#FFE4D6] capitalize">{draftState.settings.draftType}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#6B4F3D] dark:text-[#D4A88E]">Rounds:</span>
            <span className="text-[#4A3426] dark:text-[#FFE4D6]">{draftState.settings.rounds}</span>
          </div>
        </div>
      </WarmCard>

      {/* Action Buttons */}
      <WarmCard hover={false} padding="md">
        <div className="flex items-center gap-2 mb-4">
          <IconTrophy className="text-[#FF6B35] dark:text-[#FF8E53]" size={20} />
          <Heading level={5}>Actions</Heading>
        </div>

        <div className="space-y-3">
          {/* Export Buttons */}
          <div className="space-y-2">
            <p className="text-xs text-[#6B4F3D] dark:text-[#D4A88E]">Export Draft Results</p>
            <div className="grid grid-cols-2 gap-2">
              <ModernButton
                onClick={() => onExport('csv')}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 justify-center"
              >
                <IconDownload size={12} />
                CSV
              </ModernButton>

              <ModernButton
                onClick={() => onExport('json')}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 justify-center"
              >
                <IconDownload size={12} />
                JSON
              </ModernButton>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-2 border-t-2 border-[#FFE4D6] dark:border-[#FF8E53]/30">
            <ModernButton
              onClick={onReset}
              variant="ghost"
              size="sm"
              fullWidth
              className="flex items-center gap-2 justify-center"
            >
              <IconRefresh size={12} />
              New Draft
            </ModernButton>
          </div>
        </div>
      </WarmCard>
    </div>
  );
}