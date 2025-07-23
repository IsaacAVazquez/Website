'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Player, TierGroup, ChartDimensions } from '@/types';
import { clusterPlayersIntoTiers } from '@/lib/clustering';
import { motion } from 'framer-motion';

interface TierChartProps {
  players: Player[];
  width?: number;
  height?: number;
  numberOfTiers?: number;
  scoringFormat?: string;
}

export default function TierChart({ 
  players, 
  width = 900, 
  height = 600,
  numberOfTiers = 6,
  scoringFormat = 'PPR'
}: TierChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPlayer, setHoveredPlayer] = useState<Player | null>(null);
  const [tierGroups, setTierGroups] = useState<TierGroup[]>([]);
  const [currentZoom, setCurrentZoom] = useState<d3.ZoomTransform | null>(null);

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
  }, [players, numberOfTiers]);

  useEffect(() => {
    if (tierGroups.length === 0) {
      return;
    }

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const g = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left},${dimensions.margin.top})`);

    // Calculate total players for y-scale
    let totalPlayers = 0;
    tierGroups.forEach(tier => {
      totalPlayers += tier.players.length;
    });

    // Create scales - handle string and number averageRank values
    const maxRank = d3.max(players, d => {
      const rank = typeof d.averageRank === 'string' ? parseFloat(d.averageRank) : d.averageRank;
      return rank;
    }) || 30;
    
    const xScale = d3.scaleLinear()
      .domain([0, maxRank])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, totalPlayers])
      .range([0, innerHeight]);

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
    
    tierGroups.forEach((tier, tierIndex) => {
      const tierHeight = (tier.players.length / totalPlayers) * innerHeight;
      
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
    svg.append('text')
      .attr('x', dimensions.width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .text(`Fantasy Football Tier Rankings (${scoringFormat})`);

  }, [tierGroups, players, numberOfTiers, width, height, scoringFormat, dimensions.margin.left, dimensions.margin.top, innerWidth, innerHeight]);

  return (
    <div className="relative w-full h-full">
      <svg 
        ref={svgRef} 
        width={dimensions.width} 
        height={dimensions.height}
        className="block"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      
      {/* Tooltip */}
      {hoveredPlayer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm"
          style={{
            left: '50%',
            top: '20px',
            transform: 'translateX(-50%)',
            zIndex: 10
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