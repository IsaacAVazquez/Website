"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
import type { PriceData, StockPrice } from "@/types/investment";

interface Props {
  symbol: string;
}

type Range = "1M" | "3M" | "6M" | "1Y";

const RANGE_DAYS: Record<Range, number> = {
  "1M": 21,
  "3M": 63,
  "6M": 126,
  "1Y": 252,
};

const RANGES: Range[] = ["1M", "3M", "6M", "1Y"];

function normalizeEntry(entry: StockPrice & { report_date?: string; symbol?: string }): StockPrice {
  return {
    date: entry.report_date ?? entry.date,
    open: entry.open,
    high: entry.high,
    low: entry.low,
    close: entry.close,
    volume: entry.volume,
  };
}

export function PriceChartPanel({ symbol }: Props) {
  const { data: raw, isLoading, error } = useStockData<PriceData>(symbol, "price");
  const [range, setRange] = useState<Range>("1Y");

  const priceRef = useRef<SVGSVGElement>(null);
  const volumeRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Normalize and slice data
  const allEntries: StockPrice[] = React.useMemo(() => {
    if (!raw || !Array.isArray(raw)) return [];
    return (raw as (StockPrice & { report_date?: string })[]).map(normalizeEntry);
  }, [raw]);

  const slicedData = React.useMemo(() => {
    const days = RANGE_DAYS[range];
    return allEntries.slice(-days);
  }, [allEntries, range]);

  useEffect(() => {
    if (!priceRef.current || !volumeRef.current || slicedData.length === 0) return;

    const parseDate = d3.timeParse("%Y-%m-%d");
    const entries = slicedData
      .map((d) => ({ ...d, parsedDate: parseDate(d.date) }))
      .filter((d): d is typeof d & { parsedDate: Date } => d.parsedDate !== null);

    if (entries.length === 0) return;

    const dates = entries.map((d) => d.parsedDate);
    const closes = entries.map((d) => d.close);
    const volumes = entries.map((d) => d.volume);

    // ── Price chart ──────────────────────────────────────────────────────────
    const pMargin = { top: 10, right: 20, bottom: 30, left: 60 };
    const pHeight = 260;
    const pWidth = priceRef.current.parentElement?.clientWidth ?? 500;
    const pInnerW = pWidth - pMargin.left - pMargin.right;
    const pInnerH = pHeight - pMargin.top - pMargin.bottom;

    const pSvg = d3.select(priceRef.current);
    pSvg.selectAll("*").remove();
    pSvg
      .attr("width", pWidth)
      .attr("height", pHeight)
      .attr("role", "img")
      .attr("aria-label", `${symbol} price chart`);

    const pg = pSvg.append("g").attr("transform", `translate(${pMargin.left},${pMargin.top})`);

    const xScale = d3
      .scaleTime()
      .domain([dates[0], dates[dates.length - 1]])
      .range([0, pInnerW]);

    const minClose = d3.min(closes) ?? 0;
    const maxClose = d3.max(closes) ?? 0;
    const yScale = d3
      .scaleLinear()
      .domain([minClose * 0.97, maxClose * 1.03])
      .range([pInnerH, 0]);

    // Gridlines
    pg.append("g")
      .call(d3.axisLeft(yScale).tickSize(-pInnerW).ticks(5))
      .call((ax) => ax.select(".domain").remove())
      .call((ax) =>
        ax
          .selectAll(".tick line")
          .attr("stroke", "var(--border-primary)")
          .attr("stroke-opacity", "0.4")
      )
      .selectAll("text")
      .attr("fill", "var(--text-tertiary)")
      .attr("font-size", "10px")
      .attr("dx", "-4px");

    // Y axis label (USD)
    pg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -pInnerH / 2)
      .attr("y", -48)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--text-tertiary)")
      .attr("font-size", "10px")
      .text("Price (USD)");

    // Area fill
    const area = d3
      .area<(typeof entries)[0]>()
      .x((d) => xScale(d.parsedDate))
      .y0(pInnerH)
      .y1((d) => yScale(d.close))
      .curve(d3.curveMonotoneX);

    pg.append("path")
      .datum(entries)
      .attr("d", area)
      .attr("fill", "var(--color-primary)")
      .attr("fill-opacity", "0.12");

    // Line
    const line = d3
      .line<(typeof entries)[0]>()
      .x((d) => xScale(d.parsedDate))
      .y((d) => yScale(d.close))
      .curve(d3.curveMonotoneX);

    pg.append("path")
      .datum(entries)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "var(--color-primary)")
      .attr("stroke-width", 1.5);

    // X axis
    pg.append("g")
      .attr("transform", `translate(0,${pInnerH})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .call((ax) => ax.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "var(--text-tertiary)")
      .attr("font-size", "10px");

    // Hairline + tooltip on hover
    const hairline = pg
      .append("line")
      .attr("stroke", "var(--text-tertiary)")
      .attr("stroke-dasharray", "3,3")
      .attr("y1", 0)
      .attr("y2", pInnerH)
      .attr("opacity", 0);

    const bisectDate = d3.bisector<(typeof entries)[0], Date>((d) => d.parsedDate).left;

    pg.append("rect")
      .attr("width", pInnerW)
      .attr("height", pInnerH)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mousemove", function (event) {
        if (!tooltipRef.current || !priceRef.current) return;
        const [mx] = d3.pointer(event);
        const hovered = xScale.invert(mx);
        const idx = Math.max(
          0,
          Math.min(entries.length - 1, bisectDate(entries, hovered, 1) - 1)
        );
        const pt = entries[idx];
        if (!pt) return;

        hairline.attr("x1", xScale(pt.parsedDate)).attr("x2", xScale(pt.parsedDate)).attr("opacity", 1);

        const parent = priceRef.current.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        tooltipRef.current.style.left = `${event.clientX - rect.left + 12}px`;
        tooltipRef.current.style.top = `${event.clientY - rect.top - 40}px`;
        tooltipRef.current.style.display = "block";
        tooltipRef.current.innerHTML = `<span class="font-medium">${pt.date}</span><br/>Close: $${pt.close.toFixed(2)}`;
      })
      .on("mouseleave", function () {
        hairline.attr("opacity", 0);
        if (tooltipRef.current) tooltipRef.current.style.display = "none";
      });

    // ── Volume chart ─────────────────────────────────────────────────────────
    const vMargin = { top: 5, right: 20, bottom: 40, left: 60 };
    const vHeight = 80;
    const vWidth = pWidth;
    const vInnerW = vWidth - vMargin.left - vMargin.right;
    const vInnerH = vHeight - vMargin.top - vMargin.bottom;

    const vSvg = d3.select(volumeRef.current);
    vSvg.selectAll("*").remove();
    vSvg.attr("width", vWidth).attr("height", vHeight);

    const vg = vSvg.append("g").attr("transform", `translate(${vMargin.left},${vMargin.top})`);

    const vxScale = d3
      .scaleTime()
      .domain([dates[0], dates[dates.length - 1]])
      .range([0, vInnerW]);

    const vyScale = d3
      .scaleLinear()
      .domain([0, d3.max(volumes) ?? 0])
      .range([vInnerH, 0]);

    const barWidth = Math.max(1, vInnerW / entries.length - 0.5);

    vg.selectAll("rect")
      .data(entries)
      .join("rect")
      .attr("x", (d) => vxScale(d.parsedDate) - barWidth / 2)
      .attr("y", (d) => vyScale(d.volume))
      .attr("width", barWidth)
      .attr("height", (d) => vInnerH - vyScale(d.volume))
      .attr("fill", "var(--color-primary)")
      .attr("opacity", "0.4");

    // X axis on volume chart
    vg.append("g")
      .attr("transform", `translate(0,${vInnerH})`)
      .call(d3.axisBottom(vxScale).ticks(5))
      .call((ax) => ax.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "var(--text-tertiary)")
      .attr("font-size", "10px");

    // Volume label
    vg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -vInnerH / 2)
      .attr("y", -48)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--text-tertiary)")
      .attr("font-size", "9px")
      .text("Volume");
  }, [slicedData, symbol]);

  const isError = !isLoading && (!!error || (raw && !Array.isArray(raw)));
  const isEmpty = !isLoading && !error && slicedData.length === 0;

  return (
    <WarmCard padding="sm" ariaLabel="Price chart">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Price History</h3>
        <div className="flex gap-1" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded min-h-[44px] min-w-[44px] transition ${
                range === r
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <div className="h-[260px] rounded bg-[var(--neutral-200)] animate-pulse" />
          <div className="h-[80px] rounded bg-[var(--neutral-200)] animate-pulse" />
        </div>
      )}

      {(isError || isEmpty) && !isLoading && (
        <div className="flex items-center justify-center h-40">
          <p className="text-sm text-[var(--text-tertiary)]">Price data unavailable.</p>
        </div>
      )}

      {!isLoading && slicedData.length > 0 && (
        <div className="relative">
          <svg ref={priceRef} className="w-full" />
          <svg ref={volumeRef} className="w-full mt-1" />
          <div
            ref={tooltipRef}
            className="absolute pointer-events-none hidden z-10 bg-[var(--surface-elevated)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs text-[var(--text-primary)] shadow-md whitespace-nowrap"
          />
        </div>
      )}
    </WarmCard>
  );
}
