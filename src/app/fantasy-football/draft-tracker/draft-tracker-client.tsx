"use client";

import { useState, useEffect } from "react";
import "./styles.css";
import { motion, AnimatePresence } from "framer-motion";
import { ScoringFormat } from "@/types";
import { useAllFantasyData } from "@/hooks/useAllFantasyData";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { Badge } from "@/components/ui/Badge";
import { IconSettings, IconRefresh, IconDownload } from "@tabler/icons-react";
import { DraftSetup } from "./components/DraftSetup";
import { DraftBoard } from "./components/DraftBoard";
import { DraftHistory } from "./components/DraftHistory";
import { DraftControls } from "./components/DraftControls";
import { useDraftState } from "./hooks/useDraftState";

export function DraftTrackerClient() {
  const [showSetup, setShowSetup] = useState(true);
  const [scoringFormat, setScoringFormat] = useState<ScoringFormat>('PPR');
  
  const { players, isLoading } = useAllFantasyData({ scoringFormat });
  const { 
    draftState, 
    draftPlayer, 
    undoLastPick, 
    resetDraft, 
    isUserPick, 
    currentTeamName,
    exportDraftResults,
    isDraftComplete
  } = useDraftState();

  // Show setup screen if draft hasn't started
  useEffect(() => {
    if (draftState.picks.length > 0) {
      setShowSetup(false);
    }
  }, [draftState.picks.length]);

  const handleStartDraft = () => {
    setShowSetup(false);
  };

  const handleNewDraft = () => {
    resetDraft();
    setShowSetup(true);
  };

  const getDraftedPlayerIds = (): Set<string> => {
    return new Set(draftState.picks.map(pick => pick.player.id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#FF6B35] dark:border-[#FF8E53] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#FFF8F0] via-[#FFFCF7] to-[#FFF8F0] dark:from-[#2D1B12] dark:via-[#1C1410] dark:to-[#2D1B12]">
      {/* Warm Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#FF6B35_0%,_transparent_50%)] opacity-5" />
        <div className="absolute top-0 -left-4 w-72 h-72 bg-[#F7B32B] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-[#FF6B35] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {showSetup ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <Heading level={1} className="mb-4">
                    Fantasy Football{" "}
                    <span className="bg-gradient-to-r from-[#FF6B35] via-[#F7B32B] to-[#FF8E53] bg-clip-text text-transparent">
                      Draft Tracker
                    </span>
                  </Heading>
                  <Paragraph size="lg" className="text-[#6B4F3D] dark:text-[#D4A88E] max-w-2xl mx-auto">
                    Track your fantasy football draft with real-time analytics, tier-based player rankings,
                    and intelligent draft insights. Perfect for both mock drafts and live draft day.
                  </Paragraph>
                </div>

                <DraftSetup 
                  onStartDraft={handleStartDraft}
                  scoringFormat={scoringFormat}
                  onScoringFormatChange={setScoringFormat}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="draft"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Draft Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Heading level={2} className="mb-0">
                      Live Draft Tracker
                    </Heading>
                    {isDraftComplete && (
                      <Badge variant="matrix" className="animate-pulse">
                        Complete!
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[#6B4F3D] dark:text-[#D4A88E]">
                    <span>Pick #{draftState.currentPick}</span>
                    <span>•</span>
                    <span>Round {draftState.currentRound}</span>
                    <span>•</span>
                    <span className={isUserPick ? "text-[#6BCF7F] dark:text-[#8FE39E] font-medium" : ""}>
                      {currentTeamName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ModernButton
                    onClick={handleNewDraft}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <IconRefresh size={16} />
                    New Draft
                  </ModernButton>

                  <ModernButton
                    onClick={() => exportDraftResults('csv')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <IconDownload size={16} />
                    Export
                  </ModernButton>

                  <ModernButton
                    onClick={() => setShowSetup(true)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <IconSettings size={16} />
                    Settings
                  </ModernButton>
                </div>
              </div>

              {/* Your Pick Indicator */}
              <AnimatePresence>
                {isUserPick && !isDraftComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center"
                  >
                    <WarmCard hover={false} padding="md" className="border-[#6BCF7F] dark:border-[#8FE39E] bg-[#6BCF7F]/5 dark:bg-[#6BCF7F]/10 max-w-md mx-auto">
                      <motion.div
                        animate={{
                          boxShadow: [
                            "0 0 20px rgba(107, 207, 127, 0.5)",
                            "0 0 40px rgba(107, 207, 127, 0.7)",
                            "0 0 20px rgba(107, 207, 127, 0.5)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="p-4 text-center"
                      >
                        <Heading level={3} className="text-[#6BCF7F] dark:text-[#8FE39E] mb-2">
                          🎯 Your Pick!
                        </Heading>
                        <Paragraph className="text-[#4A3426] dark:text-[#FFE4D6]">
                          Choose your next player from the board below
                        </Paragraph>
                      </motion.div>
                    </WarmCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Draft Interface */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Draft Board - Takes up most space */}
                <div className="xl:col-span-3">
                  <DraftBoard
                    players={players || []}
                    draftedPlayerIds={getDraftedPlayerIds()}
                    onDraftPlayer={draftPlayer}
                    currentPick={draftState.currentPick}
                    isUserPick={isUserPick}
                    scoringFormat={scoringFormat}
                  />
                </div>

                {/* Sidebar with History and Controls */}
                <div className="space-y-6">
                  <DraftHistory
                    picks={draftState.picks}
                    teams={draftState.teams}
                    userTeam={draftState.settings.userTeam}
                    onUndo={undoLastPick}
                  />
                  
                  <DraftControls
                    draftState={draftState}
                    onExport={exportDraftResults}
                    onReset={handleNewDraft}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}