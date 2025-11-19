"use client";

import React from 'react';
import { TierGroup } from '@/lib/tierImageGenerator';
import { WarmCard } from '@/components/ui/WarmCard';
import { Heading } from '@/components/ui/Heading';
import { motion } from 'framer-motion';
import { ThumbnailImage } from '@/components/ui/OptimizedImage';

interface TierDisplayProps {
  tierGroups: TierGroup[];
  position: string;
  showImages?: boolean;
}

export function TierDisplay({ tierGroups, position: _position, showImages = true }: TierDisplayProps) {

  return (
    <div className="space-y-8">
      {tierGroups.map((tierGroup, groupIndex) => (
        <motion.div
          key={tierGroup.tierNumber}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.1 }}
        >
          <WarmCard hover={false} padding="md" elevation={2} className="overflow-hidden">
            {/* Tier Header */}
            <div 
              className="px-6 py-4 border-b border-terminal-border"
              style={{ backgroundColor: `${tierGroup.color}20` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tierGroup.color }}
                  />
                  <Heading as="h3" className="text-slate-100">
                    Tier {tierGroup.tierNumber}
                  </Heading>
                </div>
                <div className="text-sm text-slate-400">
                  Ranks {Math.round(tierGroup.minRank)}-{Math.round(tierGroup.maxRank)}
                </div>
              </div>
            </div>

            {/* Players Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tierGroup.players.map((player, playerIndex) => (
                  <motion.div
                    key={`${player.name}-${playerIndex}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: groupIndex * 0.1 + playerIndex * 0.02 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-terminal-bg/50 border border-terminal-border hover:border-electric-blue/50 transition-all"
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-12 text-center">
                      <span className="text-2xl font-bold text-electric-blue">
                        {Math.round(Number(player.averageRank))}
                      </span>
                    </div>

                    {/* Player Image */}
                    {showImages && (
                      <div className="flex-shrink-0">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-terminal-border">
                          {player.headshotUrl ? (
                            <ThumbnailImage
                              src={player.headshotUrl}
                              alt={player.name || 'Player'}
                              width={48}
                              height={48}
                              className="rounded-full"
                              objectFit="cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ backgroundColor: tierGroup.color }}
                            >
                              {(player.name || 'XX').split(' ').map((n: string) => n[0]).join('')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-100 truncate">
                        {player.name || 'Unknown Player'}
                      </div>
                      <div className="text-sm text-slate-400">
                        {player.team || 'FA'} • {player.position}
                      </div>
                    </div>

                    {/* Stats */}
                    {player.standardDeviation && (
                      <div className="flex-shrink-0 text-right">
                        <div className="text-xs text-slate-500">±{Number(player.standardDeviation).toFixed(1)}</div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </WarmCard>
        </motion.div>
      ))}
    </div>
  );
}