"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type { PortfolioSummary as PortfolioSummaryType } from "@/types/investment";
import type { PortfolioSnapshot } from "./PortfolioPerformanceChart";

interface Props {
  summary: PortfolioSummaryType;
  snapshots: PortfolioSnapshot[];
  isLoading: boolean;
  onAddHolding?: () => void;
  onRefresh?: () => void;
  lastUpdated?: Date | null;
}

const RANGES = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
  { label: "ALL", days: Infinity },
] as const;

type RangeLabel = (typeof RANGES)[number]["label"];

function formatBalance(n: number): { whole: string; cents: string } {
  if (!Number.isFinite(n)) return { whole: "$0", cents: ".00" };
  const sign = n < 0 ? "−" : "";
  const abs = Math.abs(n);
  const whole = Math.floor(abs);
  const cents = Math.round((abs - whole) * 100);
  return {
    whole: `${sign}$${whole.toLocaleString("en-US")}`,
    cents: `.${cents.toString().padStart(2, "0")}`,
  };
}

function formatSignedCurrency(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const abs = Math.abs(n);
  return `${sign}${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs)}`;
}

function formatPercent(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(2)}%`;
}

function formatRefreshLabel(lastUpdated: Date | null | undefined): string {
  if (!lastUpdated) return "Refresh data";
  const minutes = Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 60000));
  if (minutes < 1) return "Refresh data · just now";
  if (minutes === 1) return "Refresh data · 1m ago";
  if (minutes < 60) return `Refresh data · ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `Refresh data · ${hours}h ago`;
}

export function PortfolioHeroCard({
  summary,
  snapshots,
  isLoading,
  onAddHolding,
  onRefresh,
  lastUpdated,
}: Props) {
  const [range, setRange] = useState<RangeLabel>("1M");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(0);

  const filteredSnapshots = useMemo(() => {
    const r = RANGES.find((x) => x.label === range);
    if (!r || r.days === Infinity) return snapshots;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - r.days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return snapshots.filter((s) => s.date >= cutoffStr);
  }, [snapshots, range]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || width === 0) return;
    const HEIGHT = 220;
    const MARGIN = { top: 12, right: 60, bottom: 22, left: 8 };
    const innerW = Math.max(40, width - MARGIN.left - MARGIN.right);
    const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

    d3.select(svg).selectAll("*").remove();

    if (filteredSnapshots.length < 2) {
      const root = d3
        .select(svg)
        .attr("width", width)
        .attr("height", HEIGHT)
        .append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
      root
        .append("text")
        .attr("x", innerW / 2)
        .attr("y", innerH / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "var(--home-ink-muted)")
        .style("font-size", "12px")
        .style("font-style", "italic")
        .text(
          snapshots.length === 0
            ? "Performance chart appears once you save snapshots"
            : "Not enough data for this range yet",
        );
      return;
    }

    const data = filteredSnapshots.map((s) => ({ date: new Date(s.date), value: s.totalValue }));

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, innerW]);
    const yMin = d3.min(data, (d) => d.value) as number;
    const yMax = d3.max(data, (d) => d.value) as number;
    const yPad = (yMax - yMin) * 0.12 || 1;
    const yScale = d3
      .scaleLinear()
      .domain([yMin - yPad, yMax + yPad])
      .range([innerH, 0]);

    const root = d3
      .select(svg)
      .attr("width", width)
      .attr("height", HEIGHT)
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const defs = d3.select(svg).append("defs");
    const fillId = `inv-hero-fill-${range}`;
    const strokeId = `inv-hero-stroke-${range}`;
    const fillGrad = defs
      .append("linearGradient")
      .attr("id", fillId)
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", 1);
    fillGrad.append("stop").attr("offset", "0%").attr("stop-color", "var(--home-haze)").attr("stop-opacity", 0.28);
    fillGrad.append("stop").attr("offset", "100%").attr("stop-color", "var(--home-haze)").attr("stop-opacity", 0);

    const strokeGrad = defs
      .append("linearGradient")
      .attr("id", strokeId)
      .attr("x1", 0)
      .attr("x2", 1)
      .attr("y1", 0)
      .attr("y2", 0);
    strokeGrad.append("stop").attr("offset", "0%").attr("stop-color", "var(--home-haze)");
    strokeGrad.append("stop").attr("offset", "100%").attr("stop-color", "var(--home-ink)");

    [0.25, 0.5, 0.75].forEach((p) => {
      root
        .append("line")
        .attr("x1", 0)
        .attr("x2", innerW)
        .attr("y1", innerH * p)
        .attr("y2", innerH * p)
        .attr("stroke", "color-mix(in srgb, var(--home-ink) 8%, transparent)")
        .attr("stroke-dasharray", "3 4");
    });

    const area = d3
      .area<(typeof data)[number]>()
      .x((d) => xScale(d.date))
      .y0(innerH)
      .y1((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);
    root.append("path").datum(data).attr("d", area).attr("fill", `url(#${fillId})`);

    const line = d3
      .line<(typeof data)[number]>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);
    root
      .append("path")
      .datum(data)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", `url(#${strokeId})`)
      .attr("stroke-width", 2.4)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round");

    const last = data[data.length - 1];
    const lastX = xScale(last.date);
    const lastY = yScale(last.value);
    root.append("circle").attr("cx", lastX).attr("cy", lastY).attr("r", 4).attr("fill", "var(--home-ink)");
    const pulse = root
      .append("circle")
      .attr("cx", lastX)
      .attr("cy", lastY)
      .attr("r", 6)
      .attr("fill", "none")
      .attr("stroke", "var(--home-haze)")
      .attr("stroke-opacity", 0.5);
    pulse
      .append("animate")
      .attr("attributeName", "r")
      .attr("values", "6;14;6")
      .attr("dur", "2.4s")
      .attr("repeatCount", "indefinite");
    pulse
      .append("animate")
      .attr("attributeName", "stroke-opacity")
      .attr("values", "0.55;0;0.55")
      .attr("dur", "2.4s")
      .attr("repeatCount", "indefinite");

    const yAxisG = d3
      .select(svg)
      .append("g")
      .attr("transform", `translate(${width - MARGIN.right + 8},${MARGIN.top})`);
    const tickValues = yScale.ticks(4);
    tickValues.forEach((v) => {
      yAxisG
        .append("text")
        .attr("x", 0)
        .attr("y", yScale(v))
        .attr("dominant-baseline", "middle")
        .attr("fill", "color-mix(in srgb, var(--home-ink) 38%, var(--home-paper))")
        .style("font", "10.5px var(--font-mono)")
        .text(`$${d3.format(".2~s")(v).replace("G", "B")}`);
    });

    const xAxisG = d3
      .select(svg)
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${HEIGHT - 6})`);
    const tickCount = Math.min(data.length, 5);
    const xTicks = xScale.ticks(tickCount);
    xTicks.forEach((d) => {
      xAxisG
        .append("text")
        .attr("x", xScale(d))
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .attr("fill", "color-mix(in srgb, var(--home-ink) 38%, var(--home-paper))")
        .style("font", "10.5px var(--font-mono)")
        .text(d3.timeFormat("%b %d")(d));
    });
  }, [filteredSnapshots, snapshots.length, width, range]);

  if (isLoading && snapshots.length === 0 && summary.totalValue === 0) {
    return (
      <div className="invest-hero">
        <div className="invest-hero-left">
          <span className="invest-hero-eyebrow">
            <span className="invest-hero-livedot" aria-hidden="true" />
            Total portfolio value · Live
          </span>
          <div className="my-3 h-12 w-56 rounded bg-[var(--home-paper-alt)] animate-pulse" />
          <div className="h-5 w-44 rounded bg-[var(--home-paper-alt)] animate-pulse" />
        </div>
        <div className="invest-chart-wrap">
          <div className="m-auto h-32 w-3/4 rounded bg-[var(--home-paper-alt)] animate-pulse" />
        </div>
      </div>
    );
  }

  const balance = formatBalance(summary.totalValue);
  const dayPositive = summary.dayChange >= 0;

  return (
    <section className="invest-hero" aria-label="Portfolio total value">
      <div className="invest-hero-left">
        <span className="invest-hero-eyebrow">
          <span className="invest-hero-livedot" aria-hidden="true" />
          Total portfolio value · Live
        </span>

        <p className="invest-hero-balance">
          <span>{balance.whole}</span>
          <span className="cents">{balance.cents}</span>
          <span className="ccy">USD</span>
        </p>

        <div className="invest-hero-delta">
          <span className={`chip ${dayPositive ? "pos" : "neg"}`}>
            {formatSignedCurrency(summary.dayChange)}
          </span>
          <span className={dayPositive ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}>
            {formatPercent(summary.dayChangePercent)} today
          </span>
          <span className="muted">·</span>
          <span className="muted">
            {formatPercent(summary.totalGainLossPercent)} all time
          </span>
        </div>

        <div className="mt-4">
          <div className="invest-timeframe" role="tablist" aria-label="Performance timeframe">
            {RANGES.map((r) => (
              <button
                key={r.label}
                type="button"
                role="tab"
                aria-selected={range === r.label}
                className={range === r.label ? "is-on" : ""}
                onClick={() => setRange(r.label)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="invest-hero-actions">
          {onAddHolding ? (
            <button type="button" className="invest-ghost is-primary" onClick={onAddHolding}>
              Add holding
            </button>
          ) : null}
          {onRefresh ? (
            <button type="button" className="invest-ghost" onClick={onRefresh} disabled={isLoading}>
              {formatRefreshLabel(lastUpdated)}
            </button>
          ) : null}
          <a href="#research-section" className="invest-ghost">
            Open research
          </a>
        </div>
      </div>

      <div className="invest-chart-wrap" ref={containerRef}>
        <svg ref={svgRef} aria-hidden="true" />
      </div>
    </section>
  );
}
