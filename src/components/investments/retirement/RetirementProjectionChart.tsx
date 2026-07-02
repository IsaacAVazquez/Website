"use client";

import React, { useEffect, useRef } from "react";
import { select, scaleLinear, max, area, line, curveMonotoneX } from "d3";
import type { RetirementResult } from "@/lib/retirement";
import { formatCompactCurrency } from "@/lib/retirement";

interface Props {
  result: RetirementResult;
}

const W = 760;
const H = 340;
const MARGIN = { top: 16, right: 18, bottom: 36, left: 60 };
const ACCENT = "var(--home-signal)";

/**
 * Balance over time with a shaded 10th–90th percentile confidence band and a
 * median line — communicating the *range* of outcomes, not a single false-
 * precision line (spec §5.2, §6.2). All figures in today's dollars.
 */
export function RetirementProjectionChart({ result }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const bands = result.monteCarlo.bands;

  useEffect(() => {
    if (!ref.current || bands.length === 0) return;
    const svg = select(ref.current);
    svg.selectAll("*").remove();

    const innerW = W - MARGIN.left - MARGIN.right;
    const innerH = H - MARGIN.top - MARGIN.bottom;

    const x = scaleLinear()
      .domain([bands[0].age, bands[bands.length - 1].age])
      .range([0, innerW]);

    const maxY = max(bands, (b) => b.p90) ?? 1;
    const y = scaleLinear().domain([0, maxY * 1.05]).nice().range([innerH, 0]);

    const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // Gridlines + y axis.
    const yTicks = y.ticks(5);
    g.selectAll("line.grid")
      .data(yTicks)
      .join("line")
      .attr("class", "grid")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d))
      .attr("stroke", "var(--home-rule)")
      .attr("stroke-dasharray", "2 3")
      .attr("opacity", 0.6);

    g.selectAll("text.ylabel")
      .data(yTicks)
      .join("text")
      .attr("class", "ylabel")
      .attr("x", -10)
      .attr("y", (d) => y(d))
      .attr("dy", "0.32em")
      .attr("text-anchor", "end")
      .attr("font-size", "10px")
      .attr("fill", "var(--home-ink-muted)")
      .text((d) => formatCompactCurrency(d));

    // X axis (age) ticks.
    const xTicks = x.ticks(6);
    g.selectAll("text.xlabel")
      .data(xTicks)
      .join("text")
      .attr("class", "xlabel")
      .attr("x", (d) => x(d))
      .attr("y", innerH + 22)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "var(--home-ink-muted)")
      .text((d) => `${d}`);

    g.append("text")
      .attr("x", innerW)
      .attr("y", innerH + 22)
      .attr("text-anchor", "end")
      .attr("font-size", "9px")
      .attr("fill", "var(--home-ink-muted)")
      .attr("opacity", 0.7)
      .text("age →");

    // Outer band (p10–p90).
    const outerArea = area<(typeof bands)[number]>()
      .x((d) => x(d.age))
      .y0((d) => y(d.p10))
      .y1((d) => y(d.p90))
      .curve(curveMonotoneX);

    // Inner band (p25–p75).
    const innerArea = area<(typeof bands)[number]>()
      .x((d) => x(d.age))
      .y0((d) => y(d.p25))
      .y1((d) => y(d.p75))
      .curve(curveMonotoneX);

    g.append("path").datum(bands).attr("d", outerArea).attr("fill", ACCENT).attr("opacity", 0.12);
    g.append("path").datum(bands).attr("d", innerArea).attr("fill", ACCENT).attr("opacity", 0.2);

    // Median line.
    const median = line<(typeof bands)[number]>()
      .x((d) => x(d.age))
      .y((d) => y(d.p50))
      .curve(curveMonotoneX);
    g.append("path")
      .datum(bands)
      .attr("d", median)
      .attr("fill", "none")
      .attr("stroke", ACCENT)
      .attr("stroke-width", 2.5);

    // Retirement-age marker.
    const retireAge = result.input.retirementAge;
    if (retireAge >= bands[0].age && retireAge <= bands[bands.length - 1].age) {
      g.append("line")
        .attr("x1", x(retireAge))
        .attr("x2", x(retireAge))
        .attr("y1", 0)
        .attr("y2", innerH)
        .attr("stroke", "var(--home-ink)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 3")
        .attr("opacity", 0.5);
      g.append("text")
        .attr("x", x(retireAge) + 4)
        .attr("y", 12)
        .attr("font-size", "9.5px")
        .attr("font-weight", "600")
        .attr("fill", "var(--home-ink)")
        .text(`retire ${retireAge}`);
    }
  }, [bands, result.input.retirementAge]);

  const summary = `Projected portfolio balance from age ${result.input.currentAge} to ${result.input.horizonAge}, today's dollars. Median at retirement ${formatCompactCurrency(result.monteCarlo.balanceAtRetirement.p50)}, with a 10th–90th percentile range.`;

  return (
    <figure className="invest-retire-chart" aria-label="Projected balance over time">
      <figcaption className="invest-retire-chart-cap">
        Projected balance · today&apos;s dollars
        <span className="invest-retire-chart-legend">
          <span className="invest-retire-legend-band" /> 10–90th percentile
          <span className="invest-retire-legend-line" /> median
        </span>
      </figcaption>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={summary}
        style={{ width: "100%", height: "auto" }}
      />
    </figure>
  );
}
