'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Player, TierGroup, ChartDimensions } from '@/types';
import { clusterPlayersIntoTiers } from '@/lib/clustering';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';

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
  const [tierGroups, setTierGroups] = useState<TierGroup[]>([]);
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

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

    // Cluster players into tiers
    const tiers = clusterPlayersIntoTiers(players, numberOfTiers);
    setTierGroups(tiers);
    
    // Notify parent about tier count and groups
    if (onTierCountChange) {
      onTierCountChange(tiers.length);
    }
    if (onTierGroupsChange) {
      onTierGroupsChange(tiers);
    }
  }, [players, numberOfTiers, onTierCountChange]);

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
    
    // Add some padding to the domain
    const rankPadding = (maxRank - minRank) * 0.1;
    const xScale = d3.scaleLinear()
      .domain([Math.max(0, minRank - rankPadding), maxRank + rankPadding])
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

    // Add X axis
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d => d.toString()))
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

    // Add grid lines
    const grid = g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
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
        .text(`Tier ${tier.tier}`);

      // Draw players in tier
      tier.players.forEach((player, playerIndex) => {
        const playerY = yPosition + (playerIndex + 0.5) * (tierHeight / tier.players.length);
        const playerRank = typeof player.averageRank === 'string' ? parseFloat(player.averageRank) : player.averageRank;
        const playerStdDev = typeof player.standardDeviation === 'string' ? parseFloat(player.standardDeviation) : player.standardDeviation;
        
        // Player dot
        g.append('circle')
          .attr('cx', xScale(playerRank))
          .attr('cy', playerY)
          .attr('r', 6)
          .attr('fill', tier.color)
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer')
          .on('mouseenter', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 9);
            setHoveredPlayer(player);
          })
          .on('mouseleave', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 6);
            setHoveredPlayer(null);
          });

        // Error bars (standard deviation)
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

        // Player name on the left side with better spacing
        g.append('text')
          .attr('x', -10)
          .attr('y', playerY)
          .attr('text-anchor', 'end')
          .attr('alignment-baseline', 'middle')
          .attr('fill', 'white')
          .style('font-size', '11px')
          .style('font-weight', '500')
          .text(`${player.name} (${player.team})`);
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

  }, [tierGroups, players, numberOfTiers, width, height, scoringFormat, hiddenTiers]);

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