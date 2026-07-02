"use client";

import { useRef, useEffect } from "react";
import { select, scaleLinear, extent, line, area, curveMonotoneX } from "d3";

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

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = 2;
    const innerWidth = width - margin * 2;
    const innerHeight = height - margin * 2;

    const xScale = scaleLinear()
      .domain([0, data.length - 1])
      .range([margin, margin + innerWidth]);

    const yScale = scaleLinear()
      .domain(extent(data) as [number, number])
      .range([margin + innerHeight, margin]);

    const lineGenerator = line<number>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d))
      .curve(curveMonotoneX);

    const areaGenerator = area<number>()
      .x((_, i) => xScale(i))
      .y0(margin + innerHeight)
      .y1((d) => yScale(d))
      .curve(curveMonotoneX);

    const color = isUp ? "var(--home-positive)" : "var(--home-negative)";

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

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      role="img"
      aria-label="Price trend"
      className={className}
    />
  );
}
