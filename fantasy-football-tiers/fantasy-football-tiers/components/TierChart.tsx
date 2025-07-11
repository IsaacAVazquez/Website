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
}

export default function TierChart({ 
  players, 
  width = 900, 
  height = 600,
  numberOfTiers = 6 
}: TierChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPlayer, setHoveredPlayer] = useState<Player | null>(null);
  const [tierGroups, setTierGroups] = useState<TierGroup[]>([]);

  const dimensions: ChartDimensions = {
    width,
    height,
    margin: { top: 40, right: 60, bottom: 60, left: 150 }
  };

  const innerWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
  const innerHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  useEffect(() => {
    if (players.length === 0) return;

    // Cluster players into tiers
    const tiers = clusterPlayersIntoTiers(players, numberOfTiers);
    setTierGroups(tiers);

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const g = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left},${dimensions.margin.top})`);

    // Calculate total players for y-scale
    let totalPlayers = 0;
    tiers.forEach(tier => {
      totalPlayers += tier.players.length;
    });

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(players, d => d.averageRank) || 30])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, totalPlayers])
      .range([0, innerHeight]);

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 40)
      .attr('fill', 'white')
      .style('text-anchor', 'middle')
      .text('Average Expert Rank');

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);

    // Draw tiers
    let yPosition = 0;
    
    tiers.forEach((tier, tierIndex) => {
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

      // Add tier label
      g.append('text')
        .attr('x', -10)
        .attr('y', yPosition + tierHeight / 2)
        .attr('text-anchor', 'end')
        .attr('alignment-baseline', 'middle')
        .attr('fill', tier.color)
        .style('font-weight', 'bold')
        .style('font-size', '14px')
        .text(`Tier ${tier.tier}`);

      // Draw players in tier
      tier.players.forEach((player, playerIndex) => {
        const playerY = yPosition + (playerIndex + 0.5) * (tierHeight / tier.players.length);
        
        // Player dot
        g.append('circle')
          .attr('cx', xScale(player.averageRank))
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
        const errorBarWidth = xScale(player.averageRank + player.standardDeviation) - xScale(player.averageRank - player.standardDeviation);
        
        g.append('line')
          .attr('x1', xScale(player.averageRank - player.standardDeviation))
          .attr('x2', xScale(player.averageRank + player.standardDeviation))
          .attr('y1', playerY)
          .attr('y2', playerY)
          .attr('stroke', tier.color)
          .attr('stroke-width', 2)
          .attr('opacity', 0.6);

        // Error bar caps
        [-1, 1].forEach(direction => {
          g.append('line')
            .attr('x1', xScale(player.averageRank + direction * player.standardDeviation))
            .attr('x2', xScale(player.averageRank + direction * player.standardDeviation))
            .attr('y1', playerY - 4)
            .attr('y2', playerY + 4)
            .attr('stroke', tier.color)
            .attr('stroke-width', 2)
            .attr('opacity', 0.6);
        });

        // Player name
        g.append('text')
          .attr('x', -15)
          .attr('y', playerY)
          .attr('text-anchor', 'end')
          .attr('alignment-baseline', 'middle')
          .attr('fill', 'white')
          .style('font-size', '12px')
          .text(`${player.name} (${player.team})`);
      });

      yPosition += tierHeight;
    });

    // Add title
    svg.append('text')
      .attr('x', dimensions.width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .text('Fantasy Football Tier Rankings');

  }, [players, numberOfTiers, dimensions, innerWidth, innerHeight]);

  return (
    <div className="relative">
      <svg ref={svgRef} className="w-full h-full" />
      
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
            <div>Avg Rank: <span className="text-cyan-400">{hoveredPlayer.averageRank.toFixed(1)}</span></div>
            <div>Proj Points: <span className="text-green-400">{hoveredPlayer.projectedPoints}</span></div>
            <div>Std Dev: <span className="text-yellow-400">±{hoveredPlayer.standardDeviation.toFixed(1)}</span></div>
          </div>
        </motion.div>
      )}
    </div>
  );
}