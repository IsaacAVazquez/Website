'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

/**
 * RB Tier Data Interface
 * Matches the structure in public/fantasy/rb_current.json
 */
interface RBPlayer {
  name: string;
  team: string;
  avgRank: number;
  consensusRank: number;
  tier: number;
  stdDev?: number;
}

interface RBTierData {
  week: number;
  generatedAt: string;
  season: string;
  scoringFormat: string;
  players: RBPlayer[];
}

interface RBTiersChartProps {
  /**
   * Width of the chart in pixels (default: 900)
   */
  width?: number;
  /**
   * Height of the chart in pixels (default: 600)
   */
  height?: number;
  /**
   * Show player labels on the chart (may be cluttered for many players)
   * Default: false (uses tooltips instead)
   */
  showLabels?: boolean;
  /**
   * Optional className for styling
   */
  className?: string;
}

/**
 * RB Tiers Scatter Plot Chart
 *
 * Displays running back tier rankings as a scatter plot with:
 * - X-axis: Average Expert Rank
 * - Y-axis: Expert Consensus Rank
 * - Color-coded by tier (1-8)
 * - Tooltips on hover showing player details
 * - Legend showing tier colors
 *
 * Data source: /public/fantasy/rb_current.json (static weekly snapshot)
 *
 * To update data weekly:
 * 1. Run: npm run update:fantasy-rb
 * 2. Or use GitHub Actions automation (runs every Wednesday)
 */
export function RBTiersChart({
  width = 900,
  height = 600,
  showLabels = false,
  className = ''
}: RBTiersChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<RBTierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tier color scheme (warm colors inspired by the site theme)
  const tierColors = [
    '#FF6B35', // Tier 1 - Sunset Orange (Elite)
    '#FF8E53', // Tier 2 - Coral
    '#F7B32B', // Tier 3 - Golden Yellow
    '#FFB020', // Tier 4 - Warm Amber
    '#6BCF7F', // Tier 5 - Fresh Green
    '#8FE39E', // Tier 6 - Light Green
    '#00D9FF', // Tier 7 - Electric Blue
    '#00F5FF'  // Tier 8 - Cyber Teal
  ];

  // Fetch static JSON data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/fantasy/rb_current.json');

        if (!response.ok) {
          throw new Error(`Failed to load RB tier data: ${response.status}`);
        }

        const jsonData: RBTierData = await response.json();

        if (!jsonData.players || jsonData.players.length === 0) {
          throw new Error('No player data available in rb_current.json');
        }

        setData(jsonData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error loading data';
        setError(errorMessage);
        console.error('Error loading RB tier data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Render D3 chart when data is available
  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Chart dimensions and margins
    const margin = { top: 60, right: 120, bottom: 70, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create chart group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xExtent = d3.extent(data.players, d => d.avgRank) as [number, number];
    const yExtent = d3.extent(data.players, d => d.consensusRank) as [number, number];

    const xScale = d3.scaleLinear()
      .domain([0, Math.max(xExtent[1] + 2, 45)])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, Math.max(yExtent[1] + 2, 45)])
      .range([chartHeight, 0]);

    // X-axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).ticks(10))
      .style('color', '#9CA3AF')
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#9CA3AF');

    // Y-axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(10))
      .style('color', '#9CA3AF')
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#9CA3AF');

    // Axis labels
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 50)
      .attr('text-anchor', 'middle')
      .style('fill', '#E5E7EB')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .text('Average Expert Rank');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .style('fill', '#E5E7EB')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .text('Expert Consensus Rank');

    // Chart title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('fill', '#F9FAFB')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .text(`Week ${data.week} – RB Tiers (${data.scoringFormat})`);

    // Tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'rb-tier-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(17, 24, 39, 0.95)')
      .style('color', '#F9FAFB')
      .style('padding', '12px')
      .style('border-radius', '8px')
      .style('border', '1px solid #374151')
      .style('font-size', '13px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.3)');

    // Plot points
    g.selectAll('.player-point')
      .data(data.players)
      .enter()
      .append('circle')
      .attr('class', 'player-point')
      .attr('cx', d => xScale(d.avgRank))
      .attr('cy', d => yScale(d.consensusRank))
      .attr('r', 6)
      .style('fill', d => tierColors[d.tier - 1] || '#6B7280')
      .style('stroke', '#1F2937')
      .style('stroke-width', '2px')
      .style('opacity', 0.85)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 9)
          .style('opacity', 1);

        tooltip
          .style('visibility', 'visible')
          .html(`
            <div style="font-weight: bold; color: ${tierColors[d.tier - 1]}; margin-bottom: 6px;">
              ${d.name}
            </div>
            <div style="color: #D1D5DB; margin-bottom: 4px;">
              ${d.team} • Tier ${d.tier}
            </div>
            <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px; font-size: 12px;">
              <span style="color: #9CA3AF;">Avg Rank:</span>
              <span style="color: #E5E7EB; font-weight: 600;">${d.avgRank.toFixed(1)}</span>
              <span style="color: #9CA3AF;">Consensus:</span>
              <span style="color: #E5E7EB; font-weight: 600;">${d.consensusRank.toFixed(1)}</span>
              ${d.stdDev !== undefined ? `
                <span style="color: #9CA3AF;">Std Dev:</span>
                <span style="color: #E5E7EB; font-weight: 600;">${d.stdDev.toFixed(1)}</span>
              ` : ''}
            </div>
          `);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 15) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 6)
          .style('opacity', 0.85);

        tooltip.style('visibility', 'hidden');
      });

    // Optional labels (only show for top players if enabled)
    if (showLabels) {
      g.selectAll('.player-label')
        .data(data.players.filter((_, i) => i < 15)) // Only label top 15
        .enter()
        .append('text')
        .attr('class', 'player-label')
        .attr('x', d => xScale(d.avgRank) + 8)
        .attr('y', d => yScale(d.consensusRank) + 4)
        .style('font-size', '10px')
        .style('fill', '#D1D5DB')
        .style('pointer-events', 'none')
        .text(d => d.name.split(' ').pop() || ''); // Show last name only
    }

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 110}, ${margin.top})`);

    legend.append('text')
      .attr('x', 0)
      .attr('y', -10)
      .style('fill', '#E5E7EB')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .text('Tiers');

    const tierCount = Math.max(...data.players.map(p => p.tier));

    for (let i = 0; i < tierCount; i++) {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 22})`);

      legendRow.append('circle')
        .attr('cx', 6)
        .attr('cy', 6)
        .attr('r', 5)
        .style('fill', tierColors[i]);

      legendRow.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .style('fill', '#D1D5DB')
        .style('font-size', '11px')
        .text(`Tier ${i + 1}`);
    }

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, [data, width, height, showLabels]);

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tier chart...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <div className="text-center max-w-md p-6 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-red-400 font-semibold mb-2">Error Loading Chart</p>
          <p className="text-gray-400 text-sm">{error}</p>
          <p className="text-gray-500 text-xs mt-3">
            Make sure the file <code className="bg-gray-800 px-1 rounded">/public/fantasy/rb_current.json</code> exists and is valid.
          </p>
        </div>
      </div>
    );
  }

  // Chart render
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {/* Last updated timestamp */}
      {data && (
        <div className="text-sm text-gray-400 mb-3 text-center">
          Last updated: {new Date(data.generatedAt).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          })}
        </div>
      )}

      {/* SVG Chart */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
        <svg ref={svgRef} style={{ display: 'block', margin: '0 auto' }} />
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
        <p className="text-sm text-gray-300">
          <span className="text-[#FF6B35] font-semibold">How to read:</span> Each point represents a running back.
          Lower and left = better rank. Color indicates tier grouping (Tier 1 = elite, Tier 8 = deeper options).
          Hover over points for detailed player information.
        </p>
      </div>
    </motion.div>
  );
}

export default RBTiersChart;
