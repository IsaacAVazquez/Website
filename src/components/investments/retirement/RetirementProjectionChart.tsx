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
const MARGIN = { top: 16, right: 18, bottom: 36 };
const ACCENT = "var(--c97-accent)";
// investments.module.css doubles the chart type at this width.
const PHONE_TYPE = "(max-width: 639px)";

/**
 * Balance over time with a shaded 10th–90th percentile confidence band and a
 * median line — communicating the *range* of outcomes, not a single false-
 * precision line (spec §5.2, §6.2). All figures in today's dollars.
 */
export function RetirementProjectionChart({ result }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const bands = result.monteCarlo.bands;

  useEffect(() => {
    const node = ref.current;
    if (!node || bands.length === 0) return;
    const phoneType = window.matchMedia(PHONE_TYPE);

    const draw = () => {
      const svg = select(node);
      svg.selectAll("*").remove();

      const maxY = max(bands, (b) => b.p90) ?? 1;
      const y = scaleLinear().domain([0, maxY * 1.05]).nice();
      const yTicks = y.ticks(5);

      // The left margin fits the widest tick label at the type the stylesheet
      // sets, so "$3.5M" keeps its "$" at desktop size and its digits at the
      // doubled phone size. A fixed 60 clipped both.
      const probe = svg.append("g");
      const probeLabels = probe
        .selectAll<SVGTextElement, number>("text")
        .data(yTicks)
        .join("text")
        .attr("class", "invest-retire-chart-label")
        .text((d) => formatCompactCurrency(d));
      const labelWidth = Math.max(0, ...probeLabels.nodes().map((t) => t.getComputedTextLength?.() ?? 0));
      probe.remove();
      const left = Math.ceil(labelWidth) + 16;

      const innerW = W - left - MARGIN.right;
      const innerH = H - MARGIN.top - MARGIN.bottom;

      const x = scaleLinear()
        .domain([bands[0].age, bands[bands.length - 1].age])
        .range([0, innerW]);
      y.range([innerH, 0]);

      const g = svg.append("g").attr("transform", `translate(${left},${MARGIN.top})`);

      // Gridlines + y axis.
      g.selectAll("line.grid")
        .data(yTicks)
        .join("line")
        .attr("class", "grid")
        .attr("x1", 0)
        .attr("x2", innerW)
        .attr("y1", (d) => y(d))
        .attr("y2", (d) => y(d))
        .attr("stroke", "var(--c97-rule)")
        .attr("stroke-dasharray", "2 3")
        .attr("opacity", 0.6);

      g.selectAll("text.invest-retire-chart-label")
        .data(yTicks)
        .join("text")
        .attr("class", "invest-retire-chart-label")
        .attr("x", -10)
        .attr("y", (d) => y(d))
        .attr("dy", "0.32em")
        .attr("text-anchor", "end")
        .attr("fill", "var(--c97-ink-2)")
        .text((d) => formatCompactCurrency(d));

      // X axis (age) ticks. The caption names the axis, because a label on this
      // baseline ran into whichever tick landed near the right edge.
      const xTicks = x.ticks(6);
      g.selectAll("text.invest-retire-chart-label.is-x")
        .data(xTicks)
        .join("text")
        .attr("class", "invest-retire-chart-label is-x")
        .attr("x", (d) => x(d))
        .attr("y", innerH + 22)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--c97-ink-2)")
        .text((d) => `${d}`);

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
          .attr("stroke", "var(--c97-ink)")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4 3")
          .attr("opacity", 0.5);
        g.append("text")
          .attr("class", "invest-retire-chart-label is-marker")
          .attr("x", x(retireAge) + 4)
          .attr("y", 12)
          .attr("font-weight", "600")
          .attr("fill", "var(--c97-ink)")
          .text(`retire ${retireAge}`);
      }
    };

    draw();
    // The type doubles across the phone breakpoint, so the margin is measured again.
    phoneType.addEventListener("change", draw);
    return () => phoneType.removeEventListener("change", draw);
  }, [bands, result.input.retirementAge]);

  const summary = `Projected portfolio balance from age ${result.input.currentAge} to ${result.input.horizonAge}, today's dollars. Median at retirement ${formatCompactCurrency(result.monteCarlo.balanceAtRetirement.p50)}, with a 10th–90th percentile range.`;

  return (
    <figure className="invest-retire-chart" aria-label="Projected balance over time">
      <figcaption className="invest-retire-chart-cap">
        Projected balance by age · today&apos;s dollars
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
