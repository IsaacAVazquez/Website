"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { WarmCard } from "@/components/ui/WarmCard";
import type { EnhancedHolding } from "@/types/investment";

interface Props {
  holdings: EnhancedHolding[];
}

// Matches the brand palette CSS variables as hex for D3 (which needs hex/rgb)
const PALETTE = [
  "#2563EB", "#059669", "#D97706", "#DC2626",
  "#7C3AED", "#0891B2", "#65A30D", "#EA580C",
  "#DB2777", "#0D9488",
];

export function AllocationChart({ holdings }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const data = holdings
    .filter((h) => h.allocationPercent !== null && h.allocationPercent > 0)
    .sort((a, b) => (b.allocationPercent ?? 0) - (a.allocationPercent ?? 0));

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const size = 220;
    const radius = size / 2;
    const innerRadius = radius * 0.55;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", size)
      .attr("height", size)
      .attr("role", "img")
      .attr("aria-label", "Portfolio allocation donut chart");

    const g = svg.append("g").attr("transform", `translate(${radius},${radius})`);

    const pie = d3
      .pie<EnhancedHolding>()
      .value((d) => d.allocationPercent ?? 0)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<EnhancedHolding>>()
      .innerRadius(innerRadius)
      .outerRadius(radius - 4);

    const hoverArc = d3.arc<d3.PieArcDatum<EnhancedHolding>>()
      .innerRadius(innerRadius)
      .outerRadius(radius - 1);

    const arcs = g
      .selectAll<SVGPathElement, d3.PieArcDatum<EnhancedHolding>>("path")
      .data(pie(data))
      .join("path")
      .attr("d", arc)
      .attr("fill", (_, i) => PALETTE[i % PALETTE.length])
      .attr("stroke", "var(--surface-elevated)")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .style("transition", "opacity 0.15s ease");

    // Hover interactions
    arcs
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("d", hoverArc(d) ?? "");
        if (!tooltipRef.current) return;
        const tooltip = tooltipRef.current;
        tooltip.style.display = "block";
        tooltip.innerHTML = `<strong>${d.data.symbol}</strong><br/>${(d.data.allocationPercent ?? 0).toFixed(1)}%<br/>${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(d.data.currentValue)}`;
      })
      .on("mousemove", function (event) {
        if (!tooltipRef.current) return;
        const parent = svgRef.current?.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        tooltipRef.current.style.left = `${event.clientX - rect.left + 12}px`;
        tooltipRef.current.style.top = `${event.clientY - rect.top - 32}px`;
      })
      .on("mouseleave", function (event, d) {
        d3.select(this).attr("d", arc(d) ?? "");
        if (tooltipRef.current) tooltipRef.current.style.display = "none";
      });

    // Center label: total value
    const totalValue = data.reduce((s, h) => s + h.currentValue, 0);
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.3em")
      .attr("fill", "var(--text-secondary)")
      .attr("font-size", "11px")
      .text("Portfolio");
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.1em")
      .attr("fill", "var(--text-primary)")
      .attr("font-size", "13px")
      .attr("font-weight", "600")
      .text(
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(totalValue)
      );
  }, [data]);

  if (data.length === 0) return null;

  return (
    <WarmCard padding="sm" ariaLabel="Portfolio allocation chart" className="rounded-[28px] shadow-[var(--shadow-sm)]">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Allocation</h3>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          Position weights based on current market value.
        </p>
      </div>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div className="relative shrink-0 self-center rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-4">
          <svg ref={svgRef} />
          <div
            ref={tooltipRef}
            style={{ display: "none", position: "absolute", pointerEvents: "none" }}
            className="px-2 py-1.5 rounded text-xs bg-[var(--neutral-900)] text-white shadow-lg whitespace-nowrap leading-relaxed"
          />
        </div>

        <ol className="space-y-1.5 text-sm w-full">
          {data.map((h, i) => (
            <li key={h.symbol} className="flex items-center gap-2 rounded-[18px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-2.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                aria-hidden="true"
              />
              <span className="font-medium text-[var(--text-primary)] w-14 shrink-0">{h.symbol}</span>
              <div className="flex-1 h-1 rounded-full bg-[var(--neutral-200)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(h.allocationPercent ?? 0, 100)}%`,
                    backgroundColor: PALETTE[i % PALETTE.length],
                  }}
                />
              </div>
              <span className="text-[var(--text-secondary)] shrink-0 w-12 text-right">
                {(h.allocationPercent ?? 0).toFixed(1)}%
              </span>
            </li>
          ))}
        </ol>
      </div>
    </WarmCard>
  );
}
