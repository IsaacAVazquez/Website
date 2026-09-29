"use client";

import React, { useEffect, useRef } from "react";
import { select, scaleLinear, max, area, line, curveMonotoneX } from "d3";
import type { RetirementResult } from "@/lib/retirement";
import { formatCompactCurrency } from "@/lib/retirement";

interface Props {
  result: RetirementResult;
}

const W = 760;
const PLOT_H = 288;
// The drawing's spacing as set for 20 unit type. investments.module.css doubles
// the type under 640px, and every one of these grows with it, so a label keeps
// the same room at either size.
const TYPE = 20;
const SPACE = {
  top: 16,
  right: 18,
  bottom: 36,
  // Baseline of the age ticks, measured down from the plot.
  tickRow: 22,
  // Baseline of the retirement label, measured down from the top of the plot.
  markerRow: 12,
  // Clear space beside a label.
  pad: 4,
  // Clear space between the balance labels and the drawing's left edge.
  edge: 6,
};
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

      const firstAge = bands[0].age;
      const lastAge = bands[bands.length - 1].age;
      const x = scaleLinear().domain([firstAge, lastAge]);

      // Every margin is fitted to the labels at the type the stylesheet sets.
      // Fixed margins clipped the labels at the edges of the plot once the type
      // doubled, and a fixed 60 on the left clipped "$3.5M" at either size.
      const probe = svg.append("text").attr("class", "invest-retire-chart-label");
      const probeNode = probe.node();
      const widthOf = (label: string) => {
        probe.text(label);
        return probeNode?.getComputedTextLength?.() ?? 0;
      };
      const type = probeNode ? parseFloat(getComputedStyle(probeNode).fontSize) : NaN;
      const scale = type / TYPE || 1;
      const pad = SPACE.pad * scale;
      const balanceWidth = Math.max(0, ...yTicks.map((d) => widthOf(formatCompactCurrency(d))));

      const fit = (count: number) => {
        // Ages are whole numbers, and a plan under five years ticks on the half year.
        const ticks = x.ticks(count).filter(Number.isInteger);
        const widths = ticks.map((d) => widthOf(`${d}`));
        const first = widths[0] ?? 0;
        const last = widths[widths.length - 1] ?? 0;
        // An age label is centred on its tick, so a tick on either edge of the
        // plot puts half its label outside. The balance labels stand that far
        // clear on the left, and the right margin holds it.
        const gap = Math.ceil(first / 2 + pad);
        const left = Math.ceil(balanceWidth) + gap + SPACE.edge * scale;
        const right = Math.max(SPACE.right * scale, Math.ceil(last / 2 + pad));
        const innerW = W - left - right;
        // The last two labels are the widest pair, since ages only gain digits,
        // and each of them keeps its pad.
        const between = ((ticks[1] - ticks[0]) / (lastAge - firstAge)) * innerW;
        const crowded = ticks.length > 1 && between < (last + widths[widths.length - 2]) / 2 + 2 * pad;
        return { ticks, gap, left, innerW, crowded };
      };
      // A long plan at the doubled type has more ages than the row can hold, so
      // the row thins until they stand clear of each other.
      let count = 6;
      let fitted = fit(count);
      while (fitted.crowded && count > 1) fitted = fit(--count);
      probe.remove();

      const { ticks: xTicks, gap, left, innerW } = fitted;
      const top = SPACE.top * scale;
      const innerH = PLOT_H;
      // The plot keeps its height, and the drawing grows to hold the margins.
      svg.attr("viewBox", `0 0 ${W} ${top + innerH + SPACE.bottom * scale}`);

      x.range([0, innerW]);
      y.range([innerH, 0]);

      const g = svg.append("g").attr("transform", `translate(${left},${top})`);

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
        .attr("x", -gap)
        .attr("y", (d) => y(d))
        .attr("dy", "0.32em")
        .attr("text-anchor", "end")
        .attr("fill", "var(--c97-ink-2)")
        .text((d) => formatCompactCurrency(d));

      // X axis (age) ticks. The caption names the axis, because a label on this
      // baseline ran into whichever tick landed near the right edge.
      g.selectAll("text.invest-retire-chart-label.is-x")
        .data(xTicks)
        .join("text")
        .attr("class", "invest-retire-chart-label is-x")
        .attr("x", (d) => x(d))
        .attr("y", innerH + SPACE.tickRow * scale)
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
        const marker = g
          .append("text")
          .attr("class", "invest-retire-chart-label is-marker")
          .attr("y", SPACE.markerRow * scale)
          .attr("font-weight", "600")
          .attr("fill", "var(--c97-ink)")
          .text(`retire ${retireAge}`);
        // The label reads to the right of the marker until a late retirement
        // would run it past the plot, and then it reads to the left.
        const markerWidth = marker.node()?.getComputedTextLength?.() ?? 0;
        const fits = x(retireAge) + pad + markerWidth <= innerW;
        marker
          .attr("x", x(retireAge) + (fits ? pad : -pad))
          .attr("text-anchor", fits ? "start" : "end");
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
        viewBox={`0 0 ${W} ${SPACE.top + PLOT_H + SPACE.bottom}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={summary}
        style={{ width: "100%", height: "auto" }}
      />
    </figure>
  );
}
