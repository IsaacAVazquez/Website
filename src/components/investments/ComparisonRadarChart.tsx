"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export interface RadarDimension {
  dimension: string;
  scoreA: number;
  scoreB: number;
}

interface Props {
  data: RadarDimension[];
  symbolA: string;
  symbolB: string;
}

const COLOR_A = "var(--home-haze)";
const COLOR_B = "#D97706";
const COLOR_A_HEX = "#2563EB";
const COLOR_B_HEX = "#D97706";

export function ComparisonRadarChart({ data, symbolA, symbolB }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const size = 320;
    const margin = 60;
    const radius = (size - margin * 2) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const levels = 4;
    const n = data.length;
    const angleSlice = (Math.PI * 2) / n;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);

    // Grid circles (concentric rings)
    for (let lvl = 1; lvl <= levels; lvl++) {
      const r = (radius / levels) * lvl;
      g.append("circle")
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "var(--home-rule)")
        .attr("stroke-width", 1)
        .attr("opacity", 0.6);
    }

    // Axis lines
    data.forEach((_, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", y)
        .attr("stroke", "var(--home-rule)")
        .attr("stroke-width", 1)
        .attr("opacity", 0.5);
    });

    // Axis labels
    data.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const labelRadius = radius + 22;
      const x = labelRadius * Math.cos(angle);
      const y = labelRadius * Math.sin(angle);
      g.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", "0.35em")
        .attr("text-anchor", Math.abs(x) < 5 ? "middle" : x > 0 ? "start" : "end")
        .attr("fill", "var(--home-ink-muted)")
        .attr("font-size", "11px")
        .attr("font-family", "var(--font-inter, system-ui)")
        .text(d.dimension);
    });

    // Helper: polygon path from scores
    function polygonPath(scores: number[]) {
      const points = scores.map((score, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const r = (score / 100) * radius;
        return [r * Math.cos(angle), r * Math.sin(angle)] as [number, number];
      });
      return d3.line()(points.concat([points[0]])) ?? "";
    }

    const scoresA = data.map((d) => d.scoreA);
    const scoresB = data.map((d) => d.scoreB);

    // Stock B polygon (drawn first so A is on top)
    g.append("path")
      .attr("d", polygonPath(scoresB))
      .attr("fill", COLOR_B_HEX)
      .attr("fill-opacity", 0.18)
      .attr("stroke", COLOR_B_HEX)
      .attr("stroke-width", 2);

    // Stock A polygon
    g.append("path")
      .attr("d", polygonPath(scoresA))
      .attr("fill", COLOR_A_HEX)
      .attr("fill-opacity", 0.18)
      .attr("stroke", COLOR_A_HEX)
      .attr("stroke-width", 2);

    // Dots for A
    scoresA.forEach((score, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const r = (score / 100) * radius;
      g.append("circle")
        .attr("cx", r * Math.cos(angle))
        .attr("cy", r * Math.sin(angle))
        .attr("r", 4)
        .attr("fill", COLOR_A_HEX)
        .attr("stroke", "white")
        .attr("stroke-width", 1.5);
    });

    // Dots for B
    scoresB.forEach((score, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const r = (score / 100) * radius;
      g.append("circle")
        .attr("cx", r * Math.cos(angle))
        .attr("cy", r * Math.sin(angle))
        .attr("r", 4)
        .attr("fill", COLOR_B_HEX)
        .attr("stroke", "white")
        .attr("stroke-width", 1.5);
    });
  }, [data, symbolA, symbolB]);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        ref={svgRef}
        viewBox="0 0 320 320"
        className="w-full max-w-[320px]"
        aria-label={`Radar comparison chart: ${symbolA} vs ${symbolB}`}
      />
      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: COLOR_A_HEX }}
          />
          <span className="font-medium" style={{ color: COLOR_A }}>
            {symbolA}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: COLOR_B_HEX }}
          />
          <span className="font-medium" style={{ color: COLOR_B }}>
            {symbolB}
          </span>
        </span>
      </div>
    </div>
  );
}
