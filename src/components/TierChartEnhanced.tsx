'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Player, TierGroup, ChartDimensions } from '@/types';
import { clusterPlayersIntoTiers } from '@/lib/clustering';
import { calculateUnifiedTiers, UnifiedTier, convertToUnifiedTier } from '@/lib/unifiedTierCalculator';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';
import { DataFreshnessIndicator } from './DataFreshnessIndicator';
import PlayerImageService from '@/lib/playerImageService';

interface TierChartEnhancedProps {
  players: Player[];
  width?: number;
  height?: number;
  numberOfTiers?: number;
  scoringFormat?: string;
  hiddenTiers?: Set<number>;
  onTierCountChange?: (tierCount: number) => void;
  onTierGroupsChange?: (tierGroups: TierGroup[]) => void;
}

export default function TierChartEnhanced({ 
  players, 
  width = 900, 
  height = 600,
  numberOfTiers = 6,
  scoringFormat = 'PPR',
  hiddenTiers = new Set<number>(),
  onTierCountChange,
  onTierGroupsChange
}: TierChartEnhancedProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPlayer, setHoveredPlayer] = useState<Player | null>(null);
  const [tierGroups, setTierGroups] = useState<UnifiedTier[]>([]);
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [playerImages, setPlayerImages] = useState<Map<string, string>>(new Map());
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  const dimensions: ChartDimensions = {
    width,
    height,
    margin: { top: 60, right: 120, bottom: 80, left: 220 }
  };

  const innerWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
  const innerHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  useEffect(() => {
    if (players.length === 0) {
      setTierGroups([]);
      return;
    }

    // Use unified tier calculation system
    const unifiedTiers = calculateUnifiedTiers(players, numberOfTiers, scoringFormat);
    setTierGroups(unifiedTiers);
    
    // Load player images
    loadPlayerImages(players);
    
    // Notify parent about tier count and groups (convert to old format for compatibility)
    if (onTierCountChange) {
      onTierCountChange(unifiedTiers.length);
    }
    if (onTierGroupsChange) {
      // Convert UnifiedTier back to TierGroup for parent component compatibility
      const legacyTiers: TierGroup[] = unifiedTiers.map(tier => ({
        tier: tier.tier,
        players: tier.players,
        color: tier.color,
        minRank: tier.minRank,
        maxRank: tier.maxRank,
        avgRank: tier.avgRank
      }));
      onTierGroupsChange(legacyTiers);
    }
  }, [players, numberOfTiers, scoringFormat, onTierCountChange, onTierGroupsChange]);

  const loadPlayerImages = async (playersToLoad: Player[]) => {
    setIsLoadingImages(true);
    const imageMap = new Map<string, string>();
    
    // Preload images with error handling and validation
    const imagePromises = playersToLoad.map(async (player) => {
      try {
        const imageUrl = await PlayerImageService.getPlayerImageUrl(player);
        
        if (imageUrl) {
          // Validate image exists and is loadable
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              imageMap.set(`${player.name}-${player.team}`, imageUrl);
              resolve();
            };
            img.onerror = () => {
              // Image failed to load, skip it
              console.warn(`Failed to load image for ${player.name}`);
              resolve();
            };
            img.src = imageUrl;
          });
        }
      } catch (error) {
        console.warn(`Error loading image for ${player.name}:`, error);
      }
    });

    // Wait for all images to load (or fail)
    await Promise.all(imagePromises.filter(Boolean));
    setPlayerImages(imageMap);
    setIsLoadingImages(false);
  };

  useEffect(() => {
    if (tierGroups.length === 0 || !svgRef.current) {
      return;
    }

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    // Create a container for zoom/pan
    const container = svg.append('g')
      .attr('class', 'zoom-container');

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
        setCurrentZoom(event.transform.k);
      });

    // Apply zoom behavior to svg
    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Create chart group inside container
    const g = container.append('g')
      .attr('transform', `translate(${dimensions.margin.left},${dimensions.margin.top})`);

    // Filter visible tiers
    const visibleTiers = tierGroups.filter(tier => !hiddenTiers.has(tier.tier));
    
    // Calculate total players in visible tiers
    const visibleTotalPlayers = visibleTiers.reduce((sum, tier) => sum + tier.players.length, 0);

    // Get all visible players
    const visiblePlayers = visibleTiers.flatMap(tier => tier.players);
    
    // Calculate X-axis domain based on visible players only
    const visibleRanks = visiblePlayers.map(p => {
      return typeof p.averageRank === 'string' ? parseFloat(p.averageRank) : p.averageRank;
    });
    
    const minRank = visibleRanks.length > 0 ? Math.min(...visibleRanks) : 0;
    const maxRank = visibleRanks.length > 0 ? Math.max(...visibleRanks) : 30;
    
    // Implement minimum range for better readability
    const dataRange = maxRank - minRank;
    const MIN_RANGE = 30; // Minimum range to ensure readability
    
    let domainMin: number;
    let domainMax: number;
    
    if (dataRange < MIN_RANGE) {
      // Center the data within the minimum range
      const center = (minRank + maxRank) / 2;
      domainMin = Math.max(0, center - MIN_RANGE / 2);
      domainMax = center + MIN_RANGE / 2;
    } else {
      // Use smart padding: 10% of range or minimum 3 ranks
      const rankPadding = Math.max(dataRange * 0.1, 3);
      domainMin = Math.max(0, minRank - rankPadding);
      domainMax = maxRank + rankPadding;
    }
    
    const xScale = d3.scaleLinear()
      .domain([domainMin, domainMax])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, visibleTotalPlayers])
      .range([0, innerHeight]);

    // Add background for better contrast
    g.append('rect')
      .attr('x', -dimensions.margin.left)
      .attr('y', -dimensions.margin.top)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .attr('fill', '#0A0A0B')
      .attr('opacity', 0.95);

    // Add X axis with smart tick generation
    const tickCount = Math.max(6, Math.min(10, (domainMax - domainMin) / 5)); // 6-10 ticks based on range
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .ticks(tickCount)
        .tickFormat(d => Math.round(Number(d)).toString())
      )
      .style('color', 'white');
    
    // Style the X axis
    xAxis.selectAll('text')
      .style('fill', 'white')
      .style('font-size', '12px');
    
    xAxis.selectAll('path, line')
      .style('stroke', 'white');
    
    // Add X axis label
    xAxis.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 50)
      .attr('fill', 'white')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Average Expert Rank');

    // Add grid lines matching the axis ticks
    const grid = g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .ticks(tickCount)
        .tickSize(-innerHeight)
        .tickFormat(() => '')
      );
    
    // Style grid lines
    grid.selectAll('line')
      .style('stroke', 'white')
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);
    
    grid.select('.domain').remove(); // Remove the main axis line for grid

    // Draw tiers
    let yPosition = 0;
    
    visibleTiers.forEach((tier, tierIndex) => {
      const tierHeight = (tier.players.length / visibleTotalPlayers) * innerHeight;
      
      // Draw tier background
      g.append('rect')
        .attr('x', 0)
        .attr('y', yPosition)
        .attr('width', innerWidth)
        .attr('height', tierHeight)
        .attr('fill', tier.color)
        .attr('opacity', 0.1)
        .attr('stroke', tier.color)
        .attr('stroke-width', 2);

      // Add tier label on the right side
      g.append('text')
        .attr('x', innerWidth + 15)
        .attr('y', yPosition + tierHeight / 2)
        .attr('text-anchor', 'start')
        .attr('alignment-baseline', 'middle')
        .attr('fill', tier.color)
        .style('font-weight', 'bold')
        .style('font-size', '18px')
        .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
        .text(tier.label || `Tier ${tier.tier}`);

      // Draw players in tier with size based on data density
      const totalVisiblePlayers = visiblePlayers.length;
      const baseRadius = totalVisiblePlayers < 20 ? 8 : totalVisiblePlayers < 50 ? 6 : 5;
      const hoverRadius = baseRadius + 3;
      const strokeWidth = totalVisiblePlayers < 20 ? 3 : 2;
      
      tier.players.forEach((player, playerIndex) => {
        const playerY = yPosition + (playerIndex + 0.5) * (tierHeight / tier.players.length);
        const playerRank = typeof player.averageRank === 'string' ? parseFloat(player.averageRank) : player.averageRank;
        const playerStdDev = typeof player.standardDeviation === 'string' ? parseFloat(player.standardDeviation) : player.standardDeviation;
        
        // Draw error bars FIRST (so they appear behind player images)
        const errorBarWidth = xScale(playerRank + playerStdDev) - xScale(playerRank - playerStdDev);
        
        g.append('line')
          .attr('x1', xScale(playerRank - playerStdDev))
          .attr('x2', xScale(playerRank + playerStdDev))
          .attr('y1', playerY)
          .attr('y2', playerY)
          .attr('stroke', tier.color)
          .attr('stroke-width', 2)
          .attr('opacity', 0.6);

        // Error bar caps
        [-1, 1].forEach(direction => {
          g.append('line')
            .attr('x1', xScale(playerRank + direction * playerStdDev))
            .attr('x2', xScale(playerRank + direction * playerStdDev))
            .attr('y1', playerY - 4)
            .attr('y2', playerY + 4)
            .attr('stroke', tier.color)
            .attr('stroke-width', 2)
            .attr('opacity', 0.6);
        });

        // Player image or fallback circle (drawn AFTER error bars)
        const imageUrl = playerImages.get(`${player.name}-${player.team}`);
        const imageSize = baseRadius * 2;
        
        if (imageUrl) {
          // Create player image
          const imageElement = g.append('image')
            .attr('href', imageUrl)
            .attr('x', xScale(playerRank) - baseRadius)
            .attr('y', playerY - baseRadius)
            .attr('width', imageSize)
            .attr('height', imageSize)
            .style('cursor', 'pointer')
            .on('mouseenter', function() {
              d3.select(this)
                .transition()
                .duration(200)
                .attr('x', xScale(playerRank) - hoverRadius)
                .attr('y', playerY - hoverRadius)
                .attr('width', hoverRadius * 2)
                .attr('height', hoverRadius * 2);
              setHoveredPlayer(player);
            })
            .on('mouseleave', function() {
              d3.select(this)
                .transition()
                .duration(200)
                .attr('x', xScale(playerRank) - baseRadius)
                .attr('y', playerY - baseRadius)
                .attr('width', imageSize)
                .attr('height', imageSize);
              setHoveredPlayer(null);
            })
            .on('error', function() {
              // Fallback to circle if image fails to load
              d3.select(this).remove();
              g.append('circle')
                .attr('cx', xScale(playerRank))
                .attr('cy', playerY)
                .attr('r', baseRadius)
                .attr('fill', tier.color)
                .attr('stroke', 'white')
                .attr('stroke-width', strokeWidth)
                .attr('opacity', 0.95)
                .style('cursor', 'pointer');
            });
        } else {
          // Fallback circle for players without images
          g.append('circle')
            .attr('cx', xScale(playerRank))
            .attr('cy', playerY)
            .attr('r', baseRadius)
            .attr('fill', tier.color)
            .attr('stroke', 'white')
            .attr('stroke-width', strokeWidth)
            .attr('opacity', 0.95)
            .style('cursor', 'pointer')
            .on('mouseenter', function() {
              d3.select(this)
                .transition()
                .duration(200)
                .attr('r', hoverRadius)
                .attr('stroke-width', strokeWidth + 1)
                .attr('opacity', 1);
              setHoveredPlayer(player);
            })
            .on('mouseleave', function() {
              d3.select(this)
                .transition()
                .duration(200)
                .attr('r', baseRadius)
                .attr('stroke-width', strokeWidth)
                .attr('opacity', 0.95);
              setHoveredPlayer(null);
            });
        }

        // Player name on the left side with better spacing
        // Check if we're in overall view (mixed positions)
        const positions = new Set(visiblePlayers.map(p => p.position));
        const isOverallView = positions.size > 1;
        
        g.append('text')
          .attr('x', -10)
          .attr('y', playerY)
          .attr('text-anchor', 'end')
          .attr('alignment-baseline', 'middle')
          .attr('fill', 'white')
          .style('font-size', '11px')
          .style('font-weight', '500')
          .text(`${player.name} (${player.team})${isOverallView ? ` - ${player.position}` : ''}`);
      });

      yPosition += tierHeight;
    });

    // Add title
    container.append('text')
      .attr('x', dimensions.width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .text(`Fantasy Football Tier Rankings (${scoringFormat})`);

  }, [tierGroups, players, numberOfTiers, width, height, scoringFormat, hiddenTiers, playerImages]);

  // Zoom control functions
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(zoomBehaviorRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(zoomBehaviorRef.current.scaleBy, 0.7);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div className="relative w-full h-full">
      {/* Data Freshness Indicator */}
      <div className="absolute top-2 left-2 z-20">
        <DataFreshnessIndicator />
      </div>
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleZoomIn}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-white" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleZoomOut}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-white" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleResetZoom}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4 text-white" />
        </motion.button>
      </div>

      {/* Image Loading Indicator */}
      {isLoadingImages && (
        <div className="absolute bottom-16 right-4 bg-cyan-900/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-cyan-600">
          <div className="flex items-center gap-2 text-sm text-cyan-300">
            <div className="w-3 h-3 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading player images...</span>
          </div>
        </div>
      )}

      {/* Zoom Indicator */}
      <div className="absolute bottom-4 right-4 bg-gray-800/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Move className="w-3 h-3" />
          <span>{Math.round(currentZoom * 100)}%</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-gray-800/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-gray-700">
        <p className="text-xs text-gray-400">Scroll to zoom • Drag to pan</p>
      </div>

      <svg 
        ref={svgRef} 
        width={dimensions.width} 
        height={dimensions.height}
        className="block cursor-move"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      
      {/* Tooltip */}
      {hoveredPlayer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm pointer-events-none"
          style={{
            left: '50%',
            top: '20px',
            transform: 'translateX(-50%)',
            zIndex: 30
          }}
        >
          <div className="font-bold text-white">{hoveredPlayer.name}</div>
          <div className="text-gray-400">{hoveredPlayer.team} - {hoveredPlayer.position}</div>
          <div className="mt-2 space-y-1">
            <div>Avg Rank: <span className="text-cyan-400">{
              typeof hoveredPlayer.averageRank === 'string' 
                ? parseFloat(hoveredPlayer.averageRank).toFixed(1)
                : hoveredPlayer.averageRank.toFixed(1)
            }</span></div>
            <div>Proj Points: <span className="text-green-400">{hoveredPlayer.projectedPoints}</span></div>
            <div>Std Dev: <span className="text-yellow-400">±{
              typeof hoveredPlayer.standardDeviation === 'string' 
                ? parseFloat(hoveredPlayer.standardDeviation).toFixed(1)
                : hoveredPlayer.standardDeviation.toFixed(1)
            }</span></div>
          </div>
        </motion.div>
      )}
    </div>
  );
}