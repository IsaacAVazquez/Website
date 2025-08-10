"use client";

import { useState, useEffect } from "react";
import "./styles.css";
import { motion, AnimatePresence } from "framer-motion";
import { Player, ScoringFormat } from "@/types";
import { useAllFantasyData } from "@/hooks/useAllFantasyData";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { GlassCard } from "@/components/ui/GlassCard";
import { MorphButton } from "@/components/ui/MorphButton";
import { Badge } from "@/components/ui/Badge";
import { IconSettings, IconPlayerPlay, IconRefresh, IconDownload } from "@tabler/icons-react";
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
          className="w-12 h-12 border-4 border-electric-blue border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Cyberpunk Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--electric-blue)_0%,_transparent_50%)] opacity-5" />
        <div className="absolute top-0 -left-4 w-72 h-72 bg-matrix-green rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-electric-blue rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000" />
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
                    <span className="bg-gradient-to-r from-electric-blue via-matrix-green to-cyber-teal bg-clip-text text-transparent">
                      Draft Tracker
                    </span>
                  </Heading>
                  <Paragraph size="lg" className="text-slate-400 max-w-2xl mx-auto">
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
                  <div className="flex items-center gap-4 text-slate-400">
                    <span>Pick #{draftState.currentPick}</span>
                    <span>•</span>
                    <span>Round {draftState.currentRound}</span>
                    <span>•</span>
                    <span className={isUserPick ? "text-matrix-green font-medium" : ""}>
                      {currentTeamName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MorphButton
                    onClick={handleNewDraft}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <IconRefresh size={16} />
                    New Draft
                  </MorphButton>
                  
                  <MorphButton
                    onClick={() => exportDraftResults('csv')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <IconDownload size={16} />
                    Export
                  </MorphButton>

                  <MorphButton
                    onClick={() => setShowSetup(true)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <IconSettings size={16} />
                    Settings
                  </MorphButton>
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
                    <GlassCard className="border-matrix-green bg-matrix-green/5 max-w-md mx-auto">
                      <motion.div
                        animate={{ 
                          boxShadow: [
                            "0 0 20px rgba(57, 255, 20, 0.5)",
                            "0 0 40px rgba(57, 255, 20, 0.7)", 
                            "0 0 20px rgba(57, 255, 20, 0.5)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="p-4 text-center"
                      >
                        <Heading level={3} className="text-matrix-green mb-2">
                          🎯 Your Pick!
                        </Heading>
                        <Paragraph className="text-slate-300">
                          Choose your next player from the board below
                        </Paragraph>
                      </motion.div>
                    </GlassCard>
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