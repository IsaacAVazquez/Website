"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ScoringFormat } from "@/types";
import { WarmCard } from "@/components/ui/WarmCard";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { ModernButton } from "@/components/ui/ModernButton";
import { Badge } from "@/components/ui/Badge";
import { IconPlayerPlay, IconUsers, IconSettings, IconTrophy } from "@tabler/icons-react";
import { useDraftState } from "../hooks/useDraftState";

interface DraftSetupProps {
  onStartDraft: () => void;
  scoringFormat: ScoringFormat;
  onScoringFormatChange: (format: ScoringFormat) => void;
}

export function DraftSetup({ onStartDraft, scoringFormat, onScoringFormatChange }: DraftSetupProps) {
  const { draftState, updateSettings } = useDraftState();
  const [leagueName, setLeagueName] = useState(draftState.settings.leagueName || "My Fantasy League");
  const [totalTeams, setTotalTeams] = useState(draftState.settings.totalTeams);
  const [userTeam, setUserTeam] = useState(draftState.settings.userTeam);
  const [draftType, setDraftType] = useState(draftState.settings.draftType);
  const [rounds, setRounds] = useState(draftState.settings.rounds);

  const handleStartDraft = () => {
    // Update settings before starting
    updateSettings({
      leagueName,
      totalTeams,
      userTeam,
      draftType,
      rounds,
      scoringFormat,
    });
    
    onStartDraft();
  };

  const scoringFormats = [
    { 
      value: 'STANDARD' as ScoringFormat, 
      label: 'Standard', 
      description: 'No points for receptions',
      badge: 'Classic'
    },
    { 
      value: 'HALF_PPR' as ScoringFormat, 
      label: 'Half PPR', 
      description: '0.5 points per reception',
      badge: 'Balanced'
    },
    { 
      value: 'PPR' as ScoringFormat, 
      label: 'Full PPR', 
      description: '1 point per reception',
      badge: 'Popular'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* League Setup */}
      <WarmCard hover={false} padding="lg" className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <IconTrophy className="text-[#FF6B35] dark:text-[#FF8E53]" size={24} />
          <Heading level={3}>League Settings</Heading>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#4A3426] dark:text-[#FFE4D6] mb-2">
              League Name
            </label>
            <input
              type="text"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-[#2D1B12] border border-[#FFE4D6] dark:border-[#FF8E53]/30 rounded-lg text-[#4A3426] dark:text-[#FFE4D6] placeholder-slate-400 focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors"
              placeholder="Enter your league name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A3426] dark:text-[#FFE4D6] mb-2">
              Total Teams
            </label>
            <select
              value={totalTeams}
              onChange={(e) => setTotalTeams(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white dark:bg-[#2D1B12] border border-[#FFE4D6] dark:border-[#FF8E53]/30 rounded-lg text-[#4A3426] dark:text-[#FFE4D6] focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors"
            >
              {[8, 10, 12, 14, 16].map(num => (
                <option key={num} value={num}>{num} Teams</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A3426] dark:text-[#FFE4D6] mb-2">
              Your Draft Position
            </label>
            <select
              value={userTeam}
              onChange={(e) => setUserTeam(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white dark:bg-[#2D1B12] border border-[#FFE4D6] dark:border-[#FF8E53]/30 rounded-lg text-[#4A3426] dark:text-[#FFE4D6] focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors"
            >
              {Array.from({ length: totalTeams }, (_, i) => i + 1).map(pos => (
                <option key={pos} value={pos}>Position {pos}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A3426] dark:text-[#FFE4D6] mb-2">
              Total Rounds
            </label>
            <select
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white dark:bg-[#2D1B12] border border-[#FFE4D6] dark:border-[#FF8E53]/30 rounded-lg text-[#4A3426] dark:text-[#FFE4D6] focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors"
            >
              {[13, 14, 15, 16, 17, 18].map(num => (
                <option key={num} value={num}>{num} Rounds</option>
              ))}
            </select>
          </div>
        </div>
      </WarmCard>

      {/* Draft Type */}
      <WarmCard hover={false} padding="lg" className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <IconSettings className="text-[#FF6B35] dark:text-[#FF8E53]" size={24} />
          <Heading level={3}>Draft Format</Heading>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              value: 'snake',
              label: 'Snake Draft',
              description: 'Draft order reverses each round (recommended)',
              recommended: true
            },
            {
              value: 'linear',
              label: 'Linear Draft',
              description: 'Same draft order every round'
            },
          ].map(type => (
            <motion.div
              key={type.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="draftType"
                  value={type.value}
                  checked={draftType === type.value}
                  onChange={(e) => setDraftType(e.target.value as 'snake' | 'linear')}
                  className="sr-only"
                />
                <div className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${draftType === type.value
                    ? 'border-[#FF6B35] dark:border-[#FF8E53] bg-[#FF6B35]/10 dark:bg-[#FF8E53]/20'
                    : 'border-[#FFE4D6] dark:border-[#FF8E53]/30 bg-white dark:bg-[#2D1B12] hover:border-slate-600'
                  }
                `}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[#4A3426] dark:text-[#FFE4D6]">{type.label}</span>
                    {type.recommended && (
                      <Badge variant="matrix" size="sm">Recommended</Badge>
                    )}
                  </div>
                  <Paragraph size="sm" className="text-slate-400">
                    {type.description}
                  </Paragraph>
                </div>
              </label>
            </motion.div>
          ))}
        </div>
      </WarmCard>

      {/* Scoring Format */}
      <WarmCard hover={false} padding="lg" className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <IconUsers className="text-[#FF6B35] dark:text-[#FF8E53]" size={24} />
          <Heading level={3}>Scoring Format</Heading>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scoringFormats.map(format => (
            <motion.div
              key={format.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="scoringFormat"
                  value={format.value}
                  checked={scoringFormat === format.value}
                  onChange={(e) => onScoringFormatChange(e.target.value as ScoringFormat)}
                  className="sr-only"
                />
                <div className={`
                  p-4 rounded-lg border-2 transition-all duration-200 h-full
                  ${scoringFormat === format.value
                    ? 'border-[#FF6B35] dark:border-[#FF8E53] bg-[#FF6B35]/10 dark:bg-[#FF8E53]/20'
                    : 'border-[#FFE4D6] dark:border-[#FF8E53]/30 bg-white dark:bg-[#2D1B12] hover:border-slate-600'
                  }
                `}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[#4A3426] dark:text-[#FFE4D6]">{format.label}</span>
                    <Badge variant="outline" size="sm">{format.badge}</Badge>
                  </div>
                  <Paragraph size="sm" className="text-slate-400">
                    {format.description}
                  </Paragraph>
                </div>
              </label>
            </motion.div>
          ))}
        </div>
      </WarmCard>

      {/* Start Draft Button */}
      <div className="text-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ModernButton
            onClick={handleStartDraft}
            variant="primary"
            size="lg"
            className="px-12 py-4 text-lg font-semibold flex items-center gap-3"
          >
            <IconPlayerPlay size={20} />
            Start Draft Tracker
          </ModernButton>
        </motion.div>

        <Paragraph className="text-slate-400 mt-4 max-w-md mx-auto">
          Ready to track your draft? Click above to begin and start making picks with real-time analytics.
        </Paragraph>
      </div>
    </motion.div>
  );
}