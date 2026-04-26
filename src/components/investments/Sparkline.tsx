"use client";

import { useRef, useEffect } from "react";
import * as d3 from "d3";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 30,
  className,
}: SparklineProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const isUp = data.length >= 2 && data[data.length - 1] >= data[0];

  useEffect(() => {
    if (!svgRef.current || data.length < 2) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = 2;
    const innerWidth = width - margin * 2;
    const innerHeight = height - margin * 2;

    const xScale = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([margin, margin + innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(data) as [number, number])
      .range([margin + innerHeight, margin]);

    const lineGenerator = d3
      .line<number>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    const areaGenerator = d3
      .area<number>()
      .x((_, i) => xScale(i))
      .y0(margin + innerHeight)
      .y1((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    const color = isUp ? "var(--color-success)" : "var(--color-error)";

    svg
      .append("path")
      .datum(data)
      .attr("d", areaGenerator)
      .attr("fill", color)
      .attr("fill-opacity", 0.15);

    svg
      .append("path")
      .datum(data)
      .attr("d", lineGenerator)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.5);
  }, [data, width, height, isUp]);

  if (data.length < 2) return null;

  const first = data[0];
  const last = data[data.length - 1];
  const pctChange = first ? ((last - first) / first) * 100 : 0;
  const direction = pctChange === 0 ? "flat" : pctChange > 0 ? "up" : "down";
  const ariaLabel = `Price trend ${direction} ${Math.abs(pctChange).toFixed(2)}% over the last ${data.length} points`;

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      role="img"
      aria-label={ariaLabel}
      className={className}
    />
  );
}
