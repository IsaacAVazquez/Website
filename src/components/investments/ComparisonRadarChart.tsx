"use client";

import React, { useEffect, useRef } from "react";
import { select, line } from "d3";

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

    // SVG presentation attributes can't substitute var(), so each mark takes
    // its token as a style and follows a theme change by itself. A colour
    // resolved here would be the old theme's after a manual toggle, since a
    // child's effect runs before the theme class moves on <html>.
    const colorA = "var(--c97-accent, currentColor)";
    const colorB = "var(--c97-ink, currentColor)";
    const inkMuted = "var(--c97-ink-2, currentColor)";
    const rule = "var(--c97-rule, currentColor)";
    const paper = "var(--c97-surface, currentColor)";

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);

    // Grid circles (concentric rings)
    for (let lvl = 1; lvl <= levels; lvl++) {
      const r = (radius / levels) * lvl;
      g.append("circle")
        .attr("r", r)
        .attr("fill", "none")
        .style("stroke", rule)
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
        .style("stroke", rule)
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
        .style("fill", inkMuted)
        .attr("font-size", "11px")
        .style("font-family", "var(--c97-font-body), system-ui")
        .text(d.dimension);
    });

    // Helper: polygon path from scores
    function polygonPath(scores: number[]) {
      const points = scores.map((score, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const r = (score / 100) * radius;
        return [r * Math.cos(angle), r * Math.sin(angle)] as [number, number];
      });
      return line()(points.concat([points[0]])) ?? "";
    }

    const scoresA = data.map((d) => d.scoreA);
    const scoresB = data.map((d) => d.scoreB);

    // Stock B polygon (drawn first so A is on top)
    g.append("path")
      .attr("d", polygonPath(scoresB))
      .style("fill", colorB)
      .attr("fill-opacity", 0.14)
      .style("stroke", colorB)
      .attr("stroke-width", 2);

    // Stock A polygon
    g.append("path")
      .attr("d", polygonPath(scoresA))
      .style("fill", colorA)
      .attr("fill-opacity", 0.18)
      .style("stroke", colorA)
      .attr("stroke-width", 2);

    // Dots for A
    scoresA.forEach((score, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const r = (score / 100) * radius;
      g.append("circle")
        .attr("cx", r * Math.cos(angle))
        .attr("cy", r * Math.sin(angle))
        .attr("r", 4)
        .style("fill", colorA)
        .style("stroke", paper)
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
        .style("fill", colorB)
        .style("stroke", paper)
        .attr("stroke-width", 1.5);
    });
  }, [data, symbolA, symbolB]);

  if (data.length < 3) {
    return (
      <p className="text-center text-sm text-[var(--c97-ink-2)]" style={{ paddingBlock: "var(--c97-sp-5)" }}>
        There are not enough shared, verified metrics to draw this comparison.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center" style={{ gap: "var(--c97-sp-1)" }}>
      <svg
        ref={svgRef}
        viewBox="0 0 320 320"
        className="w-full max-w-[320px]"
        aria-label={`Radar comparison chart: ${symbolA} vs ${symbolB}`}
      />
      {/* Legend (HTML context, so inline style can use the tokens directly) */}
      <div className="flex items-center text-sm" style={{ gap: "var(--c97-sp-3)" }}>
        <span className="flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
          <span
            className="inline-block h-3 w-3"
            style={{ backgroundColor: "var(--c97-accent)" }}
          />
          <span className="font-medium" style={{ color: "var(--c97-accent)" }}>
            {symbolA}
          </span>
        </span>
        <span className="flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
          <span
            className="inline-block h-3 w-3"
            style={{ backgroundColor: "var(--c97-ink)" }}
          />
          <span className="font-medium" style={{ color: "var(--c97-ink)" }}>
            {symbolB}
          </span>
        </span>
      </div>
    </div>
  );
}
