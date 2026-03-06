"use client";

import * as d3 from "d3";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { WarmCard } from "@/components/ui/WarmCard";

export interface PortfolioSnapshot {
  date: string; // "2026-03-05"
  totalValue: number;
  totalCost: number;
  holdingCount: number;
}

interface Props {
  snapshots: PortfolioSnapshot[];
}

const RANGES = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "All", days: Infinity },
] as const;

const MARGIN = { top: 10, right: 20, bottom: 30, left: 60 };
const HEIGHT = 220;

export function PortfolioPerformanceChart({ snapshots }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [selectedRange, setSelectedRange] = useState<string>("All");
  const [containerWidth, setContainerWidth] = useState(0);

  // Observe container width for responsiveness
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const filteredSnapshots = React.useMemo(() => {
    const range = RANGES.find((r) => r.label === selectedRange);
    if (!range || range.days === Infinity) return snapshots;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range.days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    return snapshots.filter((s) => s.date >= cutoffStr);
  }, [snapshots, selectedRange]);

  const drawChart = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || containerWidth === 0 || filteredSnapshots.length < 2) return;

    const width = containerWidth;
    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    // Clear previous content
    d3.select(svg).selectAll("*").remove();

    const root = d3
      .select(svg)
      .attr("width", width)
      .attr("height", HEIGHT)
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // Parse data
    const data = filteredSnapshots.map((s) => ({
      date: new Date(s.date),
      value: s.totalValue,
      cost: s.totalCost,
    }));

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const allValues = data.flatMap((d) => [d.value, d.cost]);
    const yMin = d3.min(allValues) as number;
    const yMax = d3.max(allValues) as number;
    const yPadding = (yMax - yMin) * 0.1 || 1;

    const yScale = d3
      .scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([innerHeight, 0]);

    // Read CSS variable colors from the DOM
    const computedStyle = getComputedStyle(document.documentElement);
    const colorPrimary =
      computedStyle.getPropertyValue("--color-primary").trim() || "#2563EB";
    const textTertiary =
      computedStyle.getPropertyValue("--text-tertiary").trim() || "#64748B";
    const textSecondary =
      computedStyle.getPropertyValue("--text-secondary").trim() || "#475569";
    const borderPrimary =
      computedStyle.getPropertyValue("--border-primary").trim() || "#E2E8F0";

    // X axis
    root
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(Math.min(data.length, 6))
          .tickFormat((d) => d3.timeFormat("%b %d")(d as Date))
      )
      .call((g) => g.select(".domain").attr("stroke", borderPrimary))
      .call((g) => g.selectAll(".tick line").attr("stroke", borderPrimary))
      .call((g) =>
        g.selectAll(".tick text").attr("fill", textTertiary).style("font-size", "11px")
      );

    // Y axis
    root
      .append("g")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => `$${d3.format(",.0f")(d as number)}`)
      )
      .call((g) => g.select(".domain").attr("stroke", borderPrimary))
      .call((g) => g.selectAll(".tick line").attr("stroke", borderPrimary))
      .call((g) =>
        g.selectAll(".tick text").attr("fill", textTertiary).style("font-size", "11px")
      );

    // Area fill for value line
    const area = d3
      .area<(typeof data)[number]>()
      .x((d) => xScale(d.date))
      .y0(innerHeight)
      .y1((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    root
      .append("path")
      .datum(data)
      .attr("d", area)
      .attr("fill", colorPrimary)
      .attr("fill-opacity", 0.12);

    // Value line (solid)
    const valueLine = d3
      .line<(typeof data)[number]>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    root
      .append("path")
      .datum(data)
      .attr("d", valueLine)
      .attr("fill", "none")
      .attr("stroke", colorPrimary)
      .attr("stroke-width", 2);

    // Cost basis line (dashed)
    const costLine = d3
      .line<(typeof data)[number]>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.cost))
      .curve(d3.curveMonotoneX);

    root
      .append("path")
      .datum(data)
      .attr("d", costLine)
      .attr("fill", "none")
      .attr("stroke", textTertiary)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "6 3");

    // Tooltip hover overlay
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const bisect = d3.bisector<(typeof data)[number], Date>((d) => d.date).left;

    const hoverRect = root
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .style("cursor", "crosshair");

    const hoverLine = root
      .append("line")
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", borderPrimary)
      .attr("stroke-width", 1)
      .style("opacity", 0)
      .style("pointer-events", "none");

    const hoverDot = root
      .append("circle")
      .attr("r", 4)
      .attr("fill", colorPrimary)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("opacity", 0)
      .style("pointer-events", "none");

    hoverRect
      .on("mousemove", (event: MouseEvent) => {
        const [mx] = d3.pointer(event);
        const dateAtMouse = xScale.invert(mx);
        const idx = bisect(data, dateAtMouse, 1);
        const d0 = data[idx - 1];
        const d1 = data[idx];
        if (!d0) return;
        const d =
          d1 && dateAtMouse.getTime() - d0.date.getTime() > d1.date.getTime() - dateAtMouse.getTime()
            ? d1
            : d0;

        const xPos = xScale(d.date);
        const yPos = yScale(d.value);

        hoverLine.attr("x1", xPos).attr("x2", xPos).style("opacity", 1);
        hoverDot.attr("cx", xPos).attr("cy", yPos).style("opacity", 1);

        const gainLoss = d.value - d.cost;
        const gainLossPct = d.cost > 0 ? (gainLoss / d.cost) * 100 : 0;
        const sign = gainLoss >= 0 ? "+" : "";
        const gainColor = gainLoss >= 0 ? "var(--color-success)" : "var(--color-error)";

        tooltip.style.opacity = "1";
        tooltip.innerHTML = `
          <div style="font-size:11px;color:${textSecondary};margin-bottom:2px;">
            ${d3.timeFormat("%b %d, %Y")(d.date)}
          </div>
          <div style="font-size:13px;font-weight:600;color:var(--text-primary);">
            $${d3.format(",.2f")(d.value)}
          </div>
          <div style="font-size:11px;color:${gainColor};margin-top:1px;">
            ${sign}$${d3.format(",.2f")(gainLoss)} (${sign}${gainLossPct.toFixed(1)}%)
          </div>
        `;

        // Position tooltip
        const svgRect = svg.getBoundingClientRect();
        const tooltipWidth = tooltip.offsetWidth;
        let left = xPos + MARGIN.left + 12;
        if (left + tooltipWidth > svgRect.width) {
          left = xPos + MARGIN.left - tooltipWidth - 12;
        }
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${yPos + MARGIN.top - 10}px`;
      })
      .on("mouseleave", () => {
        hoverLine.style("opacity", 0);
        hoverDot.style("opacity", 0);
        tooltip.style.opacity = "0";
      });
  }, [filteredSnapshots, containerWidth]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  if (snapshots.length < 2) {
    return (
      <WarmCard padding="sm">
        <h3
          className="text-base font-semibold mb-0"
          style={{ color: "var(--text-primary)" }}
        >
          Portfolio Performance
        </h3>
        <div
          className="py-12 text-center text-sm"
          style={{ color: "var(--text-tertiary)" }}
        >
          Performance tracking starts after 2 days of data
        </div>
      </WarmCard>
    );
  }

  return (
    <WarmCard padding="sm">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Portfolio Performance
        </h3>

        {/* Range selector */}
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setSelectedRange(r.label)}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors min-h-[32px]"
              style={{
                backgroundColor:
                  selectedRange === r.label
                    ? "var(--color-primary)"
                    : "transparent",
                color:
                  selectedRange === r.label
                    ? "#ffffff"
                    : "var(--text-tertiary)",
              }}
              aria-label={`Show ${r.label} range`}
              aria-pressed={selectedRange === r.label}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div ref={containerRef} className="relative w-full">
        <svg ref={svgRef} className="w-full" style={{ height: HEIGHT }} />
        <div
          ref={tooltipRef}
          className="absolute rounded-lg shadow-lg pointer-events-none transition-opacity duration-150"
          style={{
            opacity: 0,
            padding: "8px 10px",
            backgroundColor: "var(--surface-elevated)",
            border: "1px solid var(--border-primary)",
            zIndex: 10,
          }}
        />
      </div>

      {/* Legend */}
      <div
        className="flex items-center gap-5 mt-2 pt-2 text-xs"
        style={{
          borderTop: "1px solid var(--border-primary)",
          color: "var(--text-tertiary)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <svg width="20" height="2" aria-hidden="true">
            <line
              x1="0"
              y1="1"
              x2="20"
              y2="1"
              stroke="var(--color-primary)"
              strokeWidth="2"
            />
          </svg>
          <span>Value</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="2" aria-hidden="true">
            <line
              x1="0"
              y1="1"
              x2="20"
              y2="1"
              stroke="var(--text-tertiary)"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          </svg>
          <span>Cost Basis</span>
        </div>
      </div>
    </WarmCard>
  );
}
