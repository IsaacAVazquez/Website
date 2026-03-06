"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
import { ErrorState } from "./ErrorState";

interface Props { symbol: string }

interface GrowthRecord {
  metric?: string;
  yoyGrowth?: number;
  value?: number;
  prevYearValue?: number;
  reportDate?: string;
  [key: string]: unknown;
}

// Try to pull a meaningful metric name + growth value out of whatever the API returns
function extractMetrics(raw: unknown): { label: string; growth: number }[] {
  if (!raw || typeof raw !== "object") return [];

  // Array of records
  if (Array.isArray(raw)) {
    return raw
      .map((r: GrowthRecord) => {
        const label = String(r.metric ?? r.reportDate ?? "");
        const growth = Number(r.yoyGrowth ?? r.value ?? 0);
        return { label, growth };
      })
      .filter((r) => r.label && !isNaN(r.growth));
  }

  // Object of { metric: growthValue }
  return Object.entries(raw as Record<string, unknown>)
    .map(([k, v]) => ({ label: k, growth: Number(v) }))
    .filter((r) => !isNaN(r.growth));
}

function GrowthChart({ data }: { data: { label: string; growth: number }[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const margin = { top: 10, right: 20, bottom: 60, left: 50 };
    const width = svgRef.current.parentElement?.clientWidth ?? 400;
    const height = 200;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("role", "img")
      .attr("aria-label", "Year-over-year growth chart");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerW])
      .padding(0.25);

    const maxAbs = d3.max(data, (d) => Math.abs(d.growth)) ?? 50;
    const y = d3.scaleLinear().domain([-maxAbs * 1.1, maxAbs * 1.1]).nice().range([innerH, 0]);

    // Zero line
    g.append("line")
      .attr("x1", 0).attr("x2", innerW)
      .attr("y1", y(0)).attr("y2", y(0))
      .attr("stroke", "var(--border-primary)")
      .attr("stroke-width", 1);

    // Bars
    g.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.label) ?? 0)
      .attr("y", (d) => (d.growth >= 0 ? y(d.growth) : y(0)))
      .attr("width", x.bandwidth())
      .attr("height", (d) => Math.abs(y(d.growth) - y(0)))
      .attr("rx", 3)
      .attr("fill", (d) =>
        d.growth >= 0 ? "var(--color-success)" : "var(--color-error)"
      );

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call((ax) => ax.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "var(--text-tertiary)")
      .attr("font-size", "10px")
      .attr("transform", "rotate(-35)")
      .attr("text-anchor", "end")
      .attr("dy", "0.5em");

    // Y axis
    g.append("g")
      .call(
        d3.axisLeft(y)
          .tickFormat((v) => `${Number(v).toFixed(0)}%`)
          .ticks(5)
          .tickSize(-innerW)
      )
      .call((ax) => ax.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "var(--text-tertiary)")
      .attr("font-size", "10px");

    g.selectAll(".tick line")
      .attr("stroke", "var(--border-primary)")
      .attr("stroke-dasharray", "3,3");
  }, [data]);

  return <svg ref={svgRef} className="w-full" />;
}

export function GrowthPanel({ symbol }: Props) {
  const { data: raw, isLoading, error, isNotFetched, refetch } = useStockData(symbol, "growth");
  const metrics = extractMetrics(raw);

  return (
    <WarmCard padding="sm">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">YoY Growth</h3>

      {isLoading && (
        <div className="h-48 rounded bg-[var(--neutral-200)] animate-pulse" />
      )}

      {!isLoading && (error || metrics.length === 0) && (
        <ErrorState message={error ?? "Growth data unavailable"} isNotFetched={isNotFetched} onRetry={refetch} />
      )}

      {!isLoading && metrics.length > 0 && (
        <>
          <GrowthChart data={metrics} />
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {metrics.map((m) => (
              <div key={m.label} className="text-center">
                <p className="text-xs text-[var(--text-tertiary)] truncate">{m.label}</p>
                <p
                  className={`text-sm font-semibold ${
                    m.growth >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
                  }`}
                >
                  {m.growth >= 0 ? "+" : ""}
                  {m.growth.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </WarmCard>
  );
}
