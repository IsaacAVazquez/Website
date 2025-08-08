"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Player } from '@/types';
import Image from 'next/image';
import { IconUser, IconTrendingUp } from '@tabler/icons-react';
import { usePlayerImageCache } from '@/hooks/usePlayerImageCache';

interface VirtualizedPlayerListProps {
  players: Player[];
  onPlayerClick?: (player: Player) => void;
  onPlayerDraft?: (player: Player) => void;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
  showDraftButton?: boolean;
  showRanks?: boolean;
}

interface VirtualListItem {
  player: Player;
  index: number;
  rank?: number;
}

const BUFFER_SIZE = 5; // Render extra items above/below viewport

export const VirtualizedPlayerList: React.FC<VirtualizedPlayerListProps> = ({
  players,
  onPlayerClick,
  onPlayerDraft,
  itemHeight = 80,
  containerHeight = 600,
  className = "",
  showDraftButton = false,
  showRanks = true
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { getCachedImage, isLoading } = usePlayerImageCache();

  // Calculate which items are visible
  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      players.length - 1
    );
    
    // Add buffer for smooth scrolling
    const startIndex = Math.max(0, visibleStart - BUFFER_SIZE);
    const endIndex = Math.min(players.length - 1, visibleEnd + BUFFER_SIZE);
    
    return { startIndex, endIndex, visibleStart, visibleEnd };
  }, [scrollTop, itemHeight, containerHeight, players.length]);

  // Create virtual items to render
  const virtualItems: VirtualListItem[] = useMemo(() => {
    const items: VirtualListItem[] = [];
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      items.push({
        player: players[i],
        index: i,
        rank: showRanks ? i + 1 : undefined
      });
    }
    return items;
  }, [players, visibleRange, showRanks]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Position colors for different positions
  const getPositionColor = useCallback((position: string): string => {
    const colors: Record<string, string> = {
      QB: "bg-red-500/20 text-red-400 border-red-500/30",
      RB: "bg-green-500/20 text-green-400 border-green-500/30",
      WR: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      TE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      K: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      DST: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return colors[position] || "bg-slate-700/20 text-slate-400 border-slate-500/30";
  }, []);

  const totalHeight = players.length * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total height container to enable scrollbar */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${visibleRange.startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {virtualItems.map((item) => (
            <PlayerItem
              key={`${item.player.id}-${item.index}`}
              item={item}
              height={itemHeight}
              isHovered={hoveredIndex === item.index}
              onHover={() => setHoveredIndex(item.index)}
              onLeave={() => setHoveredIndex(null)}
              onClick={onPlayerClick}
              onDraft={onPlayerDraft}
              showDraftButton={showDraftButton}
              getPositionColor={getPositionColor}
              getCachedImage={getCachedImage}
              isImageLoading={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Loading indicator when no players */}
      {players.length === 0 && (
        <div className="flex items-center justify-center h-full text-slate-400">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading players...</p>
          </div>
        </div>
      )}

      {/* Scroll position indicator */}
      {players.length > 20 && (
        <div className="absolute top-2 right-2 bg-slate-800/80 text-slate-300 text-xs px-2 py-1 rounded">
          {Math.floor((scrollTop / totalHeight) * 100)}%
        </div>
      )}
    </div>
  );
};

// Memoized player item component to prevent unnecessary re-renders
interface PlayerItemProps {
  item: VirtualListItem;
  height: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick?: (player: Player) => void;
  onDraft?: (player: Player) => void;
  showDraftButton: boolean;
  getPositionColor: (position: string) => string;
  getCachedImage: (key: string) => string | null;
  isImageLoading: (key: string) => boolean;
}

const PlayerItem = React.memo<PlayerItemProps>(({
  item,
  height,
  isHovered,
  onHover,
  onLeave,
  onClick,
  onDraft,
  showDraftButton,
  getPositionColor,
  getCachedImage,
  isImageLoading
}) => {
  const { player, rank } = item;
  const imageKey = `${player.name}-${player.team}`;
  const imageUrl = getCachedImage(imageKey);
  const isLoadingImage = isImageLoading(imageKey);

  const handleClick = useCallback(() => {
    onClick?.(player);
  }, [onClick, player]);

  const handleDraft = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDraft?.(player);
  }, [onDraft, player]);

  return (
    <div
      style={{ height }}
      className={`
        relative flex items-center gap-3 p-3 border-b border-slate-800
        transition-colors duration-200 cursor-pointer
        ${isHovered ? 'bg-slate-800/50 border-electric-blue' : 'hover:bg-slate-800/30'}
      `}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={handleClick}
    >
      {/* Rank Badge */}
      {rank && (
        <div className="flex-shrink-0">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center
            text-xs font-bold shadow-lg
            ${isHovered ? 'bg-electric-blue text-slate-900' : 'bg-slate-700 text-slate-300'}
          `}>
            {rank}
          </div>
        </div>
      )}

      {/* Player Image */}
      <div className="relative w-12 h-12 flex-shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={player.name}
            fill
            className="rounded-full object-cover border-2 border-slate-700"
            sizes="48px"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-slate-700 rounded-full flex items-center justify-center">
            {isLoadingImage ? (
              <div className="w-4 h-4 border border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <IconUser size={20} className="text-slate-500" />
            )}
          </div>
        )}
      </div>

      {/* Player Info */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm text-slate-200 truncate">
            {player.name}
          </h4>
          <span className={`
            px-2 py-0.5 rounded text-xs font-medium border
            ${getPositionColor(player.position)}
          `}>
            {player.position}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{player.team}</span>
          {player.adp && (
            <div className="flex items-center gap-1">
              <IconTrendingUp size={12} />
              <span>ADP: {player.adp}</span>
            </div>
          )}
          {player.averageRank && (
            <span>Avg: {typeof player.averageRank === 'string' ? player.averageRank : player.averageRank.toFixed(1)}</span>
          )}
        </div>
      </div>

      {/* Draft Button */}
      {showDraftButton && onDraft && (
        <div className="flex-shrink-0">
          <button
            onClick={handleDraft}
            className={`
              px-3 py-1 rounded text-xs font-medium transition-all duration-200
              ${isHovered 
                ? 'bg-electric-blue text-slate-900 shadow-lg' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }
            `}
          >
            Draft
          </button>
        </div>
      )}
    </div>
  );
});

PlayerItem.displayName = 'PlayerItem';

export default VirtualizedPlayerList;