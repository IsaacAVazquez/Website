"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  select,
  scaleTime,
  scaleLinear,
  min,
  max,
  axisBottom,
  axisLeft,
  timeParse,
  area as d3Area,
  line as d3Line,
  curveMonotoneX,
  bisector,
  pointer,
} from "d3";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
import { formatHistoryAsOf, getHistoricalPriceFreshness } from "@/lib/investmentsHistory";
import type { PriceData, StockPrice } from "@/types/investment";
import { ErrorState } from "./ErrorState";

interface Props {
  symbol: string;
  /** Average cost of the held lot, drawn as a reference line when present. */
  costBasis?: number | null;
}

type Range = "1M" | "3M" | "6M" | "1Y";

const RANGE_DAYS: Record<Range, number> = {
  "1M": 21,
  "3M": 63,
  "6M": 126,
  "1Y": 252,
};

const RANGES: Range[] = ["1M", "3M", "6M", "1Y"];

const MA_WINDOW = 50;

/** Price entry enriched with a trailing moving average and day-over-day direction. */
type EnrichedPrice = StockPrice & { ma50: number | null; up: boolean };

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

export function PriceChartPanel({ symbol, costBasis = null }: Props) {
  const {
    data: raw,
    isLoading,
    error,
    isNotFetched,
    refetch,
    lastUpdated: datasetLastUpdated,
  } = useStockData<PriceData>(symbol, "price");
  const [range, setRange] = useState<Range>("1Y");
  const [showMA, setShowMA] = useState(true);
  const [showCostBasis, setShowCostBasis] = useState(true);

  const priceRef = useRef<SVGSVGElement>(null);
  const volumeRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const hasCostBasis = typeof costBasis === "number" && Number.isFinite(costBasis) && costBasis > 0;

  // Normalize, then enrich with a trailing moving average + up/down direction.
  // Both are computed over the full series so the values are correct at the
  // start of a sliced window (the MA "warms up" using data before the view).
  const allEntries: EnrichedPrice[] = React.useMemo(() => {
    if (!raw || !Array.isArray(raw)) return [];
    const normalized = (raw as (StockPrice & { report_date?: string })[]).map(normalizeEntry);
    return normalized.map((d, i) => {
      let ma50: number | null = null;
      if (i >= MA_WINDOW - 1) {
        let sum = 0;
        for (let j = i - MA_WINDOW + 1; j <= i; j++) sum += normalized[j].close;
        ma50 = sum / MA_WINDOW;
      }
      const up = i > 0 ? d.close >= normalized[i - 1].close : true;
      return { ...d, ma50, up };
    });
  }, [raw]);

  const slicedData = React.useMemo(() => {
    const days = RANGE_DAYS[range];
    return allEntries.slice(-days);
  }, [allEntries, range]);
  const latestHistoricalDate = allEntries[allEntries.length - 1]?.date;
  const historyFreshness = getHistoricalPriceFreshness(latestHistoricalDate, datasetLastUpdated);

  useEffect(() => {
    if (!priceRef.current || !volumeRef.current || slicedData.length === 0) return;

    const parseDate = timeParse("%Y-%m-%d");
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

    const pSvg = select(priceRef.current);
    pSvg.selectAll("*").remove();
    pSvg
      .attr("width", pWidth)
      .attr("height", pHeight)
      .attr("role", "img")
      .attr("aria-label", `${symbol} price chart`);

    const pg = pSvg.append("g").attr("transform", `translate(${pMargin.left},${pMargin.top})`);

    const xScale = scaleTime()
      .domain([dates[0], dates[dates.length - 1]])
      .range([0, pInnerW]);

    // Domain spans the visible closes and the visible MA. Cost basis is
    // deliberately excluded so a far-out-of-range entry price can't squash the
    // price line; the cost line is instead clamped to the chart edge below.
    const domainValues = [...closes];
    if (showMA) {
      for (const e of entries) if (e.ma50 !== null) domainValues.push(e.ma50);
    }
    const minClose = min(domainValues) ?? 0;
    const maxClose = max(domainValues) ?? 0;
    const yScale = scaleLinear()
      .domain([minClose * 0.97, maxClose * 1.03])
      .range([pInnerH, 0]);

    // Gridlines
    pg.append("g")
      .call(axisLeft(yScale).tickSize(-pInnerW).ticks(5))
      .call((ax) => ax.select(".domain").remove())
      .call((ax) =>
        ax
          .selectAll(".tick line")
          .style("stroke", "var(--home-rule)")
          .attr("stroke-opacity", "0.4")
      )
      .selectAll("text")
      .style("fill", "var(--home-ink-soft)")
      .attr("font-size", "10px")
      .attr("dx", "-4px");

    // Y axis label (USD)
    pg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -pInnerH / 2)
      .attr("y", -48)
      .attr("text-anchor", "middle")
      .style("fill", "var(--home-ink-soft)")
      .attr("font-size", "10px")
      .text("Price (USD)");

    // Area fill
    const area = d3Area<(typeof entries)[0]>()
      .x((d) => xScale(d.parsedDate))
      .y0(pInnerH)
      .y1((d) => yScale(d.close))
      .curve(curveMonotoneX);

    pg.append("path")
      .datum(entries)
      .attr("d", area)
      .style("fill", "var(--home-signal)")
      .attr("fill-opacity", "0.12");

    // Line
    const line = d3Line<(typeof entries)[0]>()
      .x((d) => xScale(d.parsedDate))
      .y((d) => yScale(d.close))
      .curve(curveMonotoneX);

    pg.append("path")
      .datum(entries)
      .attr("d", line)
      .attr("fill", "none")
      .style("stroke", "var(--home-signal)")
      .attr("stroke-width", 1.5);

    // 50-day moving average (dashed, neutral) — only the points that have a
    // warmed-up average are drawn.
    if (showMA) {
      const maLine = d3Line<(typeof entries)[0]>()
        .defined((d) => d.ma50 !== null)
        .x((d) => xScale(d.parsedDate))
        .y((d) => yScale(d.ma50 as number))
        .curve(curveMonotoneX);

      pg.append("path")
        .datum(entries)
        .attr("d", maLine)
        .attr("fill", "none")
        .style("stroke", "var(--home-ink-muted)")
        .attr("stroke-width", 1.25)
        .attr("stroke-dasharray", "5,4")
        .attr("opacity", 0.85);
    }

    // Cost-basis reference line (dashed green) with a mono price label. The y
    // position is clamped to the plot so an out-of-range entry pins to the edge
    // (signaling "cost sits above/below this window") instead of being clipped.
    if (showCostBasis && hasCostBasis) {
      const cy = Math.max(0, Math.min(pInnerH, yScale(costBasis as number)));
      pg.append("line")
        .attr("x1", 0)
        .attr("x2", pInnerW)
        .attr("y1", cy)
        .attr("y2", cy)
        .style("stroke", "var(--home-positive)")
        .attr("stroke-width", 1.25)
        .attr("stroke-dasharray", "2,3");
      pg.append("text")
        .attr("x", pInnerW)
        .attr("y", cy - 4)
        .attr("text-anchor", "end")
        .style("fill", "var(--home-positive)")
        .attr("font-size", "9px")
        .attr("font-family", "var(--font-jetbrains-mono, monospace)")
        .text(`Cost $${(costBasis as number).toFixed(2)}`);
    }

    // X axis
    pg.append("g")
      .attr("transform", `translate(0,${pInnerH})`)
      .call(axisBottom(xScale).ticks(5))
      .call((ax) => ax.select(".domain").remove())
      .selectAll("text")
      .style("fill", "var(--home-ink-soft)")
      .attr("font-size", "10px");

    // Hairline + tooltip on hover
    const hairline = pg
      .append("line")
      .style("stroke", "var(--home-ink-soft)")
      .attr("stroke-dasharray", "3,3")
      .attr("y1", 0)
      .attr("y2", pInnerH)
      .attr("opacity", 0);

    const bisectDate = bisector<(typeof entries)[0], Date>((d) => d.parsedDate).left;

    pg.append("rect")
      .attr("width", pInnerW)
      .attr("height", pInnerH)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mousemove", function (event) {
        if (!tooltipRef.current || !priceRef.current) return;
        const [mx] = pointer(event);
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

    const vSvg = select(volumeRef.current);
    vSvg.selectAll("*").remove();
    vSvg.attr("width", vWidth).attr("height", vHeight);

    const vg = vSvg.append("g").attr("transform", `translate(${vMargin.left},${vMargin.top})`);

    const vxScale = scaleTime()
      .domain([dates[0], dates[dates.length - 1]])
      .range([0, vInnerW]);

    const vyScale = scaleLinear()
      .domain([0, max(volumes) ?? 0])
      .range([vInnerH, 0]);

    const barWidth = Math.max(1, vInnerW / entries.length - 0.5);

    vg.selectAll("rect")
      .data(entries)
      .join("rect")
      .attr("x", (d) => vxScale(d.parsedDate) - barWidth / 2)
      .attr("y", (d) => vyScale(d.volume))
      .attr("width", barWidth)
      .attr("height", (d) => vInnerH - vyScale(d.volume))
      .attr("fill", (d) => (d.up ? "var(--home-positive)" : "var(--home-negative)"))
      .attr("opacity", "0.45");

    // X axis on volume chart
    vg.append("g")
      .attr("transform", `translate(0,${vInnerH})`)
      .call(axisBottom(vxScale).ticks(5))
      .call((ax) => ax.select(".domain").remove())
      .selectAll("text")
      .style("fill", "var(--home-ink-soft)")
      .attr("font-size", "10px");

    // Volume label
    vg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -vInnerH / 2)
      .attr("y", -48)
      .attr("text-anchor", "middle")
      .style("fill", "var(--home-ink-soft)")
      .attr("font-size", "9px")
      .text("Volume");
  }, [slicedData, symbol, showMA, showCostBasis, hasCostBasis, costBasis]);

  const isError = !isLoading && (!!error || (raw && !Array.isArray(raw)));
  const isEmpty = !isLoading && !error && slicedData.length === 0;

  return (
    <WarmCard padding="sm" ariaLabel="Price chart" className="rounded-[var(--radius-3xl)] shadow-[var(--shadow-sm)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--home-ink)]">Price History</h3>
          <p className="mt-1 text-xs text-[var(--home-ink-soft)]">
            Trend and volume from the curated research snapshot.
          </p>
          <p className="mt-2 text-xs text-[var(--home-ink-muted)]">
            Historical series through {formatHistoryAsOf(latestHistoricalDate)}. Live pricing, when available, appears in the research header.
          </p>
          {historyFreshness.isStale ? (
            <p className="mt-1 text-xs font-medium text-[var(--home-warning)]">
              Historical chart data trails the dataset by {historyFreshness.lagDays} days.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Chart overlays">
            <button
              type="button"
              onClick={() => setShowMA((v) => !v)}
              aria-pressed={showMA}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                showMA
                  ? "border border-[var(--home-ink-muted)] bg-[var(--home-paper-alt)] text-[var(--home-ink)]"
                  : "border border-[var(--home-rule)] text-[var(--home-ink-soft)] hover:bg-[var(--home-paper-alt)]"
              }`}
            >
              <span
                aria-hidden="true"
                className="inline-block h-0 w-4 border-t-[1.5px] border-dashed"
                style={{ borderColor: "var(--home-ink-muted)" }}
              />
              50-day MA
            </button>
            {hasCostBasis ? (
              <button
                type="button"
                onClick={() => setShowCostBasis((v) => !v)}
                aria-pressed={showCostBasis}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  showCostBasis
                    ? "border border-[color-mix(in_srgb,var(--home-positive)_45%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-positive)_10%,var(--home-paper-alt))] text-[var(--home-ink)]"
                    : "border border-[var(--home-rule)] text-[var(--home-ink-soft)] hover:bg-[var(--home-paper-alt)]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-0 w-4 border-t-[1.5px] border-dashed"
                  style={{ borderColor: "var(--home-positive)" }}
                />
                Cost basis
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`min-h-[44px] min-w-[44px] rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  range === r
                    ? "bg-[var(--home-signal)] text-white shadow-[var(--shadow-sm)]"
                    : "border border-[var(--home-rule)] text-[var(--home-ink-muted)] hover:bg-[var(--home-paper-alt)] hover:text-[var(--home-ink)]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <div className="h-[260px] rounded bg-[var(--home-stone)] animate-pulse" />
          <div className="h-[80px] rounded bg-[var(--home-stone)] animate-pulse" />
        </div>
      )}

      {(isError || isEmpty) && !isLoading && (
        <ErrorState message={error ?? "Price data unavailable"} isNotFetched={isNotFetched} onRetry={refetch} />
      )}

      {!isLoading && slicedData.length > 0 && (
        <div className="relative">
          <svg ref={priceRef} className="w-full" />
          <svg ref={volumeRef} className="mt-2 w-full" />
          <div
            ref={tooltipRef}
            className="absolute pointer-events-none hidden z-10 bg-[var(--home-paper-raised)] border border-[var(--home-rule)] rounded px-2 py-1 text-xs text-[var(--home-ink)] shadow-md whitespace-nowrap"
          />
        </div>
      )}
    </WarmCard>
  );
}
