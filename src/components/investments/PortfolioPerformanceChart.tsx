"use client";

import {
  select,
  scaleTime,
  scaleLinear,
  extent,
  min,
  max,
  axisBottom,
  axisLeft,
  timeFormat,
  format,
  area as d3Area,
  line,
  curveMonotoneX,
  bisector,
  pointer,
} from "d3";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { parseLocalDateKey, toLocalDateKey } from "@/lib/date-formatters";
import { TerminalPanel } from "./TerminalPanel";

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
  const { resolvedTheme } = useTheme();

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
    const cutoffStr = toLocalDateKey(cutoff);

    return snapshots.filter((s) => s.date >= cutoffStr);
  }, [snapshots, selectedRange]);

  const drawChart = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || containerWidth === 0 || filteredSnapshots.length < 2) return;

    const width = containerWidth;
    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    // Clear previous content
    select(svg).selectAll("*").remove();

    const root = select(svg)
      .attr("width", width)
      .attr("height", HEIGHT)
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // Parse data
    const data = filteredSnapshots.map((s) => ({
      date: parseLocalDateKey(s.date) ?? new Date(s.date),
      value: s.totalValue,
      cost: s.totalCost,
    }));

    // Scales
    const xScale = scaleTime()
      .domain(extent(data, (d) => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const allValues = data.flatMap((d) => [d.value, d.cost]);
    const yMin = min(allValues) as number;
    const yMax = max(allValues) as number;
    const yPadding = (yMax - yMin) * 0.1 || 1;

    const yScale = scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([innerHeight, 0]);

    // Read CSS variable colors from the DOM
    const computedStyle = getComputedStyle(document.documentElement);
    const homeSignal =
      computedStyle.getPropertyValue("--home-signal").trim() || "#C93F19";
    const homeInkMuted =
      computedStyle.getPropertyValue("--home-ink-muted").trim() || "#615B52";
    const homeRule =
      computedStyle.getPropertyValue("--home-rule").trim() || "rgba(18,17,15,0.12)";

    // X axis
    root
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        axisBottom(xScale)
          .ticks(Math.min(data.length, 6))
          .tickFormat((d) => timeFormat("%b %d")(d as Date))
      )
      .call((g) => g.select(".domain").attr("stroke", homeRule))
      .call((g) => g.selectAll(".tick line").attr("stroke", homeRule))
      .call((g) =>
        g.selectAll(".tick text").attr("fill", homeInkMuted).style("font-size", "11px")
      );

    // Y axis
    root
      .append("g")
      .call(
        axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => `$${format(",.0f")(d as number)}`)
      )
      .call((g) => g.select(".domain").attr("stroke", homeRule))
      .call((g) => g.selectAll(".tick line").attr("stroke", homeRule))
      .call((g) =>
        g.selectAll(".tick text").attr("fill", homeInkMuted).style("font-size", "11px")
      );

    // Area fill for value line
    const area = d3Area<(typeof data)[number]>()
      .x((d) => xScale(d.date))
      .y0(innerHeight)
      .y1((d) => yScale(d.value))
      .curve(curveMonotoneX);

    root
      .append("path")
      .datum(data)
      .attr("d", area)
      .attr("fill", homeSignal)
      .attr("fill-opacity", 0.12);

    // Value line (solid)
    const valueLine = line<(typeof data)[number]>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value))
      .curve(curveMonotoneX);

    root
      .append("path")
      .datum(data)
      .attr("d", valueLine)
      .attr("fill", "none")
      .attr("stroke", homeSignal)
      .attr("stroke-width", 2);

    // Cost basis line (dashed)
    const costLine = line<(typeof data)[number]>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.cost))
      .curve(curveMonotoneX);

    root
      .append("path")
      .datum(data)
      .attr("d", costLine)
      .attr("fill", "none")
      .attr("stroke", homeInkMuted)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "6 3");

    // With a sparse visit-day history, show the actual saved points so the
    // interpolated line doesn't read as a continuous daily record.
    if (data.length <= 20) {
      root
        .selectAll("circle.perf-point")
        .data(data)
        .join("circle")
        .attr("class", "perf-point")
        .attr("cx", (d) => xScale(d.date))
        .attr("cy", (d) => yScale(d.value))
        .attr("r", 2.5)
        .attr("fill", homeSignal)
        .style("stroke", "var(--home-paper)")
        .attr("stroke-width", 1);
    }

    // Tooltip hover overlay
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const bisect = bisector<(typeof data)[number], Date>((d) => d.date).left;

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
      .attr("stroke", homeRule)
      .attr("stroke-width", 1)
      .style("opacity", 0)
      .style("pointer-events", "none");

    const hoverDot = root
      .append("circle")
      .attr("r", 4)
      .attr("fill", homeSignal)
      .attr("stroke", "var(--home-paper)")
      .attr("stroke-width", 2)
      .style("opacity", 0)
      .style("pointer-events", "none");

    hoverRect
      .on("mousemove", (event: MouseEvent) => {
        const [mx] = pointer(event);
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
        const gainColor = gainLoss >= 0 ? "var(--home-positive)" : "var(--home-negative)";

        tooltip.style.opacity = "1";
        tooltip.innerHTML = `
          <div style="font-size:11px;color:${homeInkMuted};margin-bottom:2px;">
            ${timeFormat("%b %d, %Y")(d.date)}
          </div>
          <div style="font-size:13px;font-weight:600;color:var(--home-ink);">
            $${format(",.2f")(d.value)}
          </div>
          <div style="font-size:11px;color:${gainColor};margin-top:1px;">
            ${sign}$${format(",.2f")(gainLoss)} (${sign}${gainLossPct.toFixed(1)}%)
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
    if (!resolvedTheme) return;
    drawChart();
  }, [drawChart, resolvedTheme]);

  if (snapshots.length < 2) {
    return (
      <TerminalPanel padding="sm">
        <h3
          className="text-base font-semibold mb-0"
          style={{ color: "var(--home-ink)" }}
        >
          Portfolio Value History
        </h3>
        <div
          className="py-12 text-center text-sm"
          style={{ color: "var(--home-ink-soft)" }}
        >
          Value history starts after 2 days of data
        </div>
      </TerminalPanel>
    );
  }

  return (
    <TerminalPanel padding="sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--home-ink)" }}
          >
            Portfolio Value History
          </h3>
          <p className="mt-1 text-xs text-[var(--home-ink-soft)]">
            Value versus cost basis across the saved snapshot history.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setSelectedRange(r.label)}
              className="min-h-[44px] rounded-full px-3.5 py-2 text-xs font-semibold transition-colors"
              style={{
                backgroundColor:
                  selectedRange === r.label
                    ? "var(--home-signal)"
                    : "var(--home-paper-alt)",
                color:
                  selectedRange === r.label
                    ? "var(--home-paper)"
                    : "var(--home-ink-soft)",
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
        className="absolute rounded-[var(--radius-sm)] pointer-events-none transition-opacity duration-150"
        style={{
          opacity: 0,
          padding: "8px 10px",
            backgroundColor: "var(--home-paper-raised)",
            border: "1px solid var(--home-rule)",
            zIndex: 10,
          }}
        />
      </div>

      {/* Legend */}
      <div
        className="mt-3 flex flex-wrap items-center gap-5 border-t border-[var(--home-rule)] pt-3 text-xs text-[var(--home-ink-soft)]"
        style={{
          color: "var(--home-ink-soft)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <svg width="20" height="2" aria-hidden="true">
            <line
              x1="0"
              y1="1"
              x2="20"
              y2="1"
              stroke="var(--home-signal)"
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
              stroke="var(--home-ink-soft)"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          </svg>
          <span>Cost Basis</span>
        </div>
      </div>
    </TerminalPanel>
  );
}
