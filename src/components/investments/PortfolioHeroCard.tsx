"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  select,
  scaleTime,
  scaleLinear,
  extent,
  min,
  max,
  area as d3Area,
  line as d3Line,
  curveMonotoneX,
  format,
  timeFormat,
} from "d3";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { parseLocalDateKey, toLocalDateKey } from "@/lib/date-formatters";
import { useClientNow } from "@/hooks/useClientNow";
import {
  formatBalance,
  formatMinutesAgo,
  formatPercent,
  formatSignedCurrency,
} from "@/lib/investmentFormatting";
import type { PortfolioSnapshot, PortfolioSummary as PortfolioSummaryType } from "@/types/investment";

interface Props {
  summary: PortfolioSummaryType;
  snapshots: PortfolioSnapshot[];
  isLoading: boolean;
  onAddHolding?: () => void;
  onRefresh?: () => void;
  lastUpdated?: Date | null;
  marketStatus: string;
  hasLiveQuotes: boolean;
  allQuotesLive: boolean;
}

const RANGES = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
  { label: "ALL", days: Infinity },
] as const;

type RangeLabel = (typeof RANGES)[number]["label"];

// `now` is the caller's `useClientNow()` reading (null on the server and
// during hydration): `lastUpdated` is a live-fetched instant, so computing
// "ago" straight from `Date.now()` at render time would print different text
// on the server than the client's first render and break hydration.
function formatRefreshLabel(lastUpdated: Date | null | undefined, now: number | null): string {
  if (!lastUpdated || now === null) return "Refresh data";
  return `Refresh data · ${formatMinutesAgo(lastUpdated, now)}`;
}

export function PortfolioHeroCard({
  summary,
  snapshots,
  isLoading,
  onAddHolding,
  onRefresh,
  lastUpdated,
  marketStatus,
  hasLiveQuotes,
  allQuotesLive,
}: Props) {
  const now = useClientNow();
  // null = automatic: the narrowest range with at least two saved points.
  // History only records a point on days the page is visited, so a fixed 1M
  // default rendered an empty chart on arrival for sparse histories.
  const [pickedRange, setPickedRange] = useState<RangeLabel | null>(null);
  const autoRange = useMemo<RangeLabel>(() => {
    // `snapshots` is always [] until a client-only effect loads it (never
    // seeded during SSR), and every `s.date` in it was written with
    // `toLocalDateKey` in the visitor's own zone, so this cutoff has to stay
    // in that same local zone to compare correctly, it never runs against
    // real data before hydration completes, so there's nothing to mismatch.
    for (const r of RANGES) {
      if (r.days === Infinity) break;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - r.days);
      const cutoffStr = toLocalDateKey(cutoff);
      if (snapshots.filter((s) => s.date >= cutoffStr).length >= 2) {
        return r.label;
      }
    }
    return "ALL";
  }, [snapshots]);
  const range = pickedRange ?? autoRange;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const filteredSnapshots = useMemo(() => {
    // Same local-zone cutoff as autoRange above, and the same reasoning: it
    // only ever filters real (client-loaded) snapshots, so it's browser-only
    // in practice even though the memo also runs on the empty SSR pass.
    const r = RANGES.find((x) => x.label === range);
    if (!r || r.days === Infinity) return snapshots;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - r.days);
    const cutoffStr = toLocalDateKey(cutoff);
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

    select(svg).selectAll("*").remove();

    if (filteredSnapshots.length < 2) {
      const root = select(svg)
        .attr("width", width)
        .attr("height", HEIGHT)
        .append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
      // Two short lines centred on the whole svg, so the note fits a phone-width chart.
      const lines =
        snapshots.length === 0
          ? ["A point is saved each day you visit,", "and the line draws once there are two."]
          : ["Not enough saved points", "in this range yet."];
      const note = root
        .append("text")
        .attr("y", innerH / 2 - 8)
        .attr("text-anchor", "middle")
        .style("fill", "var(--c97-ink-2)")
        .style("font-size", "12px")
        .style("font-style", "italic");
      lines.forEach((line, i) => {
        note
          .append("tspan")
          .attr("x", width / 2 - MARGIN.left)
          .attr("dy", i === 0 ? 0 : 16)
          .text(line);
      });
      return;
    }

    const data = filteredSnapshots.map((s) => ({
      date: parseLocalDateKey(s.date) ?? new Date(s.date),
      value: s.totalValue,
    }));

    const xScale = scaleTime()
      .domain(extent(data, (d) => d.date) as [Date, Date])
      .range([0, innerW]);
    const yMin = min(data, (d) => d.value) as number;
    const yMax = max(data, (d) => d.value) as number;
    const yPad = (yMax - yMin) * 0.12 || 1;
    const yScale = scaleLinear()
      .domain([yMin - yPad, yMax + yPad])
      .range([innerH, 0]);

    const root = select(svg)
      .attr("width", width)
      .attr("height", HEIGHT)
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const defs = select(svg).append("defs");
    const fillId = `inv-hero-fill-${range}`;
    const strokeId = `inv-hero-stroke-${range}`;
    const fillGrad = defs
      .append("linearGradient")
      .attr("id", fillId)
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", 1);
    fillGrad.append("stop").attr("offset", "0%").style("stop-color", "var(--c97-accent)").attr("stop-opacity", 0.28);
    fillGrad.append("stop").attr("offset", "100%").style("stop-color", "var(--c97-accent)").attr("stop-opacity", 0);

    const strokeGrad = defs
      .append("linearGradient")
      .attr("id", strokeId)
      .attr("x1", 0)
      .attr("x2", 1)
      .attr("y1", 0)
      .attr("y2", 0);
    strokeGrad.append("stop").attr("offset", "0%").style("stop-color", "var(--c97-accent)");
    strokeGrad.append("stop").attr("offset", "100%").style("stop-color", "var(--c97-ink)");

    [0.25, 0.5, 0.75].forEach((p) => {
      root
        .append("line")
        .attr("x1", 0)
        .attr("x2", innerW)
        .attr("y1", innerH * p)
        .attr("y2", innerH * p)
        .style("stroke", "color-mix(in srgb, var(--c97-ink) 8%, transparent)")
        .attr("stroke-dasharray", "3 4");
    });

    const area = d3Area<(typeof data)[number]>()
      .x((d) => xScale(d.date))
      .y0(innerH)
      .y1((d) => yScale(d.value))
      .curve(curveMonotoneX);
    root.append("path").datum(data).attr("d", area).attr("fill", `url(#${fillId})`);

    const line = d3Line<(typeof data)[number]>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value))
      .curve(curveMonotoneX);
    root
      .append("path")
      .datum(data)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", `url(#${strokeId})`)
      .attr("stroke-width", 2.4)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round");

    if (data.length <= 20) {
      root
        .selectAll("circle.inv-hero-point")
        .data(data)
        .join("circle")
        .attr("class", "inv-hero-point")
        .attr("cx", (d) => xScale(d.date))
        .attr("cy", (d) => yScale(d.value))
        .attr("r", 2.5)
        .style("fill", "var(--c97-accent)")
        .style("stroke", "var(--c97-surface)")
        .attr("stroke-width", 1);
    }

    const last = data[data.length - 1];
    const lastX = xScale(last.date);
    const lastY = yScale(last.value);
    root.append("circle").attr("cx", lastX).attr("cy", lastY).attr("r", 4).style("fill", "var(--c97-ink)");
    const pulse = root
      .append("circle")
      .attr("cx", lastX)
      .attr("cy", lastY)
      .attr("r", 6)
      .attr("fill", "none")
      .style("stroke", "var(--c97-accent)")
      .attr("stroke-opacity", 0.5);
    // Skip the looping SMIL pulse for users who prefer reduced motion; the
    // static ring above still marks the latest point. (CSS `animation:none`
    // can't reliably stop SVG SMIL <animate>, so we gate at the source.)
    if (!shouldReduceMotion) {
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
    }

    const yAxisG = select(svg)
      .append("g")
      .attr("transform", `translate(${width - MARGIN.right + 8},${MARGIN.top})`);
    const tickValues = yScale.ticks(4);
    tickValues.forEach((v) => {
      yAxisG
        .append("text")
        .attr("x", 0)
        .attr("y", yScale(v))
        .attr("dominant-baseline", "middle")
        .style("fill", "color-mix(in srgb, var(--c97-ink) 38%, var(--c97-surface))")
        .style("font", "10.5px var(--c97-font-mono)")
        .text(`$${format(".2~s")(v).replace("G", "B")}`);
    });

    const xAxisG = select(svg)
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
        .style("fill", "color-mix(in srgb, var(--c97-ink) 38%, var(--c97-surface))")
        .style("font", "10.5px var(--c97-font-mono)")
        .text(timeFormat("%b %d")(d));
    });
  }, [filteredSnapshots, snapshots.length, width, range, shouldReduceMotion]);

  if (isLoading && snapshots.length === 0 && summary.totalValue === 0) {
    return (
      <div id="performance" className="invest-hero invest-rail-target">
        <div className="invest-hero-left">
          <span className="invest-hero-eyebrow" role="status">
            <span className="invest-hero-livedot" aria-hidden="true" />
            Fetching market quotes
          </span>
          <span className="c97-skeleton" style={{ height: 48, width: 224, maxWidth: "100%", marginBlock: "var(--c97-sp-1)" }} />
          <span className="c97-skeleton" style={{ height: 20, width: 176, maxWidth: "100%" }} />
        </div>
        <div className="invest-chart-wrap">
          <span className="c97-skeleton" style={{ height: 128, width: "75%", margin: "auto" }} />
        </div>
      </div>
    );
  }

  const balance = formatBalance(summary.totalValue);
  const dayPositive = summary.dayChange >= 0;

  return (
    <section id="performance" className="invest-hero invest-rail-target" aria-label="Portfolio total value">
      <div className="invest-hero-left">
        <span className="invest-hero-eyebrow">
          {hasLiveQuotes ? <span className="invest-hero-livedot" aria-hidden="true" /> : null}
          Total portfolio value · {marketStatus}
        </span>

        <p className="invest-hero-balance">
          <span>{balance.whole}</span>
          <span className="cents">{balance.cents}</span>
          <span className="ccy">USD</span>
        </p>

        <div className="invest-hero-delta">
          {hasLiveQuotes ? (
            <>
              <span className={`chip ${dayPositive ? "pos" : "neg"}`}>
                {formatSignedCurrency(summary.dayChange)}
              </span>
              <span className={dayPositive ? "text-[var(--c97-positive)]" : "text-[var(--c97-negative)]"}>
                {formatPercent(summary.dayChangePercent)} latest session{allQuotesLive ? "" : " · partial"}
              </span>
            </>
          ) : (
            <span className="muted">Day change unavailable</span>
          )}
          <span className="muted">·</span>
          <span className="muted">
            {formatPercent(summary.totalGainLossPercent)} all time
          </span>
        </div>

        <div style={{ marginTop: "var(--c97-sp-2)" }}>
          <div className="invest-timeframe" role="group" aria-label="Performance timeframe">
            {RANGES.map((r) => (
              <button
                key={r.label}
                type="button"
                aria-pressed={range === r.label}
                className={range === r.label ? "is-on" : ""}
                onClick={() => setPickedRange(r.label)}
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
              {formatRefreshLabel(lastUpdated, now)}
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
