'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

/**
 * Player Data Interface
 * Matches the structure in public/fantasy/*_current.json
 */
interface Player {
  name: string;
  team: string;
  avgRank: number;
  consensusRank: number;
  tier: number;
  stdDev?: number;
}

interface PositionTierData {
  week: number;
  generatedAt: string;
  season: string;
  scoringFormat: string;
  players: Player[];
}

export type PositionType = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';

interface PositionTiersChartProps {
  /**
   * Position to display (QB, RB, WR, TE, K, DST)
   */
  position: PositionType;
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
  /**
   * Show live data indicator
   */
  showDataIndicator?: boolean;
}

/**
 * Position Tiers Scatter Plot Chart (Generic for all positions)
 *
 * Displays tier rankings as a scatter plot with:
 * - X-axis: Average Expert Rank
 * - Y-axis: Expert Consensus Rank
 * - Color-coded by tier (1-8)
 * - Tooltips on hover showing player details
 * - Legend showing tier colors
 * - Live data freshness indicator
 *
 * Data source: /public/fantasy/{position}_current.json (static weekly snapshot)
 *
 * To update data weekly:
 * 1. Run: npm run update:fantasy-all
 * 2. Or use GitHub Actions automation (runs every Wednesday)
 */
export function PositionTiersChart({
  position,
  width = 900,
  height = 600,
  showLabels = false,
  className = '',
  showDataIndicator = true
}: PositionTiersChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<PositionTierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataAge, setDataAge] = useState<string>('');

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

  // Position display names
  const positionNames: Record<PositionType, string> = {
    QB: 'Quarterback',
    RB: 'Running Back',
    WR: 'Wide Receiver',
    TE: 'Tight End',
    K: 'Kicker',
    DST: 'Defense/Special Teams'
  };

  // Calculate data age
  const calculateDataAge = (timestamp: string): string => {
    const now = new Date();
    const generated = new Date(timestamp);
    const diffMs = now.getTime() - generated.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes > 0 ? `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago` : 'just now';
    }
  };

  // Fetch static JSON data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const dataFile = `/fantasy/${position.toLowerCase()}_current.json`;
        const response = await fetch(dataFile);

        if (!response.ok) {
          throw new Error(`Failed to load ${position} tier data: ${response.status}`);
        }

        const jsonData: PositionTierData = await response.json();

        if (!jsonData.players || jsonData.players.length === 0) {
          throw new Error(`No player data available in ${position}_current.json`);
        }

        setData(jsonData);
        setDataAge(calculateDataAge(jsonData.generatedAt));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error loading data';
        setError(errorMessage);
        console.error(`Error loading ${position} tier data:`, err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [position]);

  // Update data age every minute
  useEffect(() => {
    if (!data) return;

    const interval = setInterval(() => {
      setDataAge(calculateDataAge(data.generatedAt));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [data]);

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

    const maxRank = Math.max(xExtent[1], yExtent[1]) + 2;

    const xScale = d3.scaleLinear()
      .domain([0, maxRank])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, maxRank])
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
      .text(`Week ${data.week} – ${positionNames[position]} Tiers (${data.scoringFormat})`);

    // Tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', `tier-tooltip-${position}`)
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
        .data(data.players.filter((_, i) => i < 10)) // Only label top 10
        .enter()
        .append('text')
        .attr('class', 'player-label')
        .attr('x', d => xScale(d.avgRank) + 8)
        .attr('y', d => yScale(d.consensusRank) + 4)
        .style('font-size', '10px')
        .style('fill', '#D1D5DB')
        .style('pointer-events', 'none')
        .text(d => {
          // For DST, show team name
          if (position === 'DST') return d.team;
          // For others, show last name only
          return d.name.split(' ').pop() || '';
        });
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
  }, [data, width, height, showLabels, position]);

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#FF6B35] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading {position} tier chart...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <div className="text-center max-w-md p-6 bg-red-900/20 border border-red-800 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-semibold mb-2">Error Loading Chart</p>
          <p className="text-gray-400 text-sm">{error}</p>
          <p className="text-gray-500 text-xs mt-3">
            Make sure the file <code className="bg-gray-800 px-1 rounded">/public/fantasy/{position.toLowerCase()}_current.json</code> exists and is valid.
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
      {/* Data Freshness Indicator */}
      {showDataIndicator && data && (
        <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
          {/* Last updated timestamp */}
          <div className="flex items-center gap-3 bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2">
            <Clock className="w-4 h-4 text-[#6BCF7F]" />
            <div>
              <p className="text-xs text-gray-500">Last Updated</p>
              <p className="text-sm text-gray-300 font-semibold">
                {new Date(data.generatedAt).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Data age badge */}
          <div className="flex items-center gap-3 bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2">
            <CheckCircle2 className="w-4 h-4 text-[#6BCF7F]" />
            <div>
              <p className="text-xs text-gray-500">Data Age</p>
              <p className="text-sm text-[#6BCF7F] font-semibold">{dataAge}</p>
            </div>
          </div>

          {/* Week and format info */}
          <div className="flex items-center gap-3 bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2">
            <div className="w-8 h-8 bg-[#FF6B35]/20 rounded-full flex items-center justify-center">
              <span className="text-[#FF6B35] font-bold text-sm">{data.week}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500">Week / Format</p>
              <p className="text-sm text-gray-300 font-semibold">
                Week {data.week} • {data.scoringFormat}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SVG Chart */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
        <svg ref={svgRef} style={{ display: 'block', margin: '0 auto' }} />
      </div>
    </motion.div>
  );
}

export default PositionTiersChart;
