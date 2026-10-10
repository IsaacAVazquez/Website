"use client";

import { select, extent, scaleLog, axisBottom, axisLeft } from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  blendedPricePerMTokens,
  formatPriceUsd,
  formatTokenCount,
  FRONTIER_PROVIDER_COLORS,
} from "@/lib/frontierModels";
import type {
  FrontierModel,
  FrontierProvider,
} from "@/types/frontierModels";

interface FrontierCostContextChartProps {
  models: FrontierModel[];
  selectedModelId: string | null;
  onSelectModel: (id: string | null) => void;
}

interface PlottedModel {
  model: FrontierModel;
  x: number;
  y: number;
}

const HEIGHT = 360;
const MARGIN = { top: 20, right: 24, bottom: 56, left: 64 };

export function FrontierCostContextChart({
  models,
  selectedModelId,
  onSelectModel,
}: FrontierCostContextChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { resolvedTheme } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const plotted = useMemo<PlottedModel[]>(
    () =>
      models
        .map((model) => {
          const blended = blendedPricePerMTokens(model);
          if (blended === null || blended <= 0) {
            return null;
          }
          return {
            model,
            x: model.contextWindow,
            y: blended,
          };
        })
        .filter((entry): entry is PlottedModel => entry !== null),
    [models]
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || containerWidth === 0 || plotted.length === 0) {
      return;
    }

    const width = containerWidth;
    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    select(svg).selectAll("*").remove();

    const root = select(svg)
      .attr("width", width)
      .attr("height", HEIGHT)
      .attr("role", "img")
      .attr(
        "aria-label",
        `Scatter plot of blended price per million tokens versus context window for ${plotted.length} frontier models. The spec sheet below carries the same figures in a sortable table.`
      );

    const g = root
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const xExtent = extent(plotted, (d) => d.x) as [number, number];
    const yExtent = extent(plotted, (d) => d.y) as [number, number];

    const xScale = scaleLog()
      .domain([Math.max(1000, xExtent[0] * 0.8), xExtent[1] * 1.2])
      .range([0, innerWidth]);
    const yScale = scaleLog()
      .domain([Math.max(0.05, yExtent[0] * 0.6), yExtent[1] * 1.4])
      .range([innerHeight, 0]);

    // SVG presentation attributes can't substitute var()/color-mix(), so
    // resolve the tokens at render time (re-resolved when the theme flips).
    // Read from the svg itself rather than document.documentElement, since
    // the Catalog 97 tokens are scoped to the `[data-c97]` page root and the
    // document root would miss the repaint.
    const computedStyle = getComputedStyle(svg);
    const axisColor =
      computedStyle.getPropertyValue("--c97-ink-2").trim() || "currentColor";
    const gridColor =
      computedStyle.getPropertyValue("--c97-rule").trim() || "currentColor";

    // Log ticks label every mantissa step, which piles up. Keep 1, 2, and 5
    // per decade on context and 1 and 3 per decade on price.
    const leadingDigit = (value: number) => Number(value.toExponential().charAt(0));
    // A narrow domain can hold no 1, 2, 3, or 5 tick at all, so fall back to d3's own.
    const pick = (ticks: number[], keep: number[]) => {
      const kept = ticks.filter((value) => keep.includes(leadingDigit(value)));
      return kept.length >= 2 ? kept : ticks;
    };
    const xAxis = axisBottom(xScale)
      .tickValues(pick(xScale.ticks(), [1, 2, 5]))
      .tickFormat((value) => formatTokenCount(Number(value)));
    const yAxis = axisLeft(yScale)
      .tickValues(pick(yScale.ticks(), [1, 3]))
      .tickFormat((value) => `$${Number(value).toFixed(Number(value) < 1 ? 2 : 0)}`);

    // A sub-decade log domain makes d3 ignore the tick count hint and label
    // every mantissa step, which overlaps at phone width. Thinning to every
    // other label below 480px keeps the axis legible without inventing tick
    // values of its own.
    const thinTicks = width < 480;

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((selection) => {
        selection.selectAll("path,line").attr("stroke", axisColor);
        selection.selectAll("text").attr("fill", axisColor).attr("font-size", "11px");
        if (thinTicks) {
          selection.selectAll(".tick").each(function (_, i) {
            if (i % 2 === 1) select(this).select("text").attr("display", "none");
          });
        }
      });

    g.append("g")
      .call(yAxis)
      .call((selection) => {
        selection.selectAll("path,line").attr("stroke", axisColor);
        selection.selectAll("text").attr("fill", axisColor).attr("font-size", "11px");
        if (thinTicks) {
          selection.selectAll(".tick").each(function (_, i) {
            if (i % 2 === 1) select(this).select("text").attr("display", "none");
          });
        }
      });

    g.append("g")
      .attr("class", "grid-x")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        axisBottom(xScale)
          .ticks(5)
          .tickSize(-innerHeight)
          .tickFormat(() => "")
      )
      .call((selection) => {
        selection.selectAll("path").attr("stroke", "transparent");
        selection.selectAll("line").attr("stroke", gridColor).attr("stroke-dasharray", "2,3");
      });

    const xTitle = g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 40)
      .attr("text-anchor", "middle")
      .attr("fill", axisColor)
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("letter-spacing", "0.18em")
      .attr("text-transform", "uppercase")
      .text("CONTEXT WINDOW (TOKENS, LOG)");
    // The title centres on the plot, 20px right of the chart's centre, so it fits
    // while it is under width - 40. A phone's chart is narrower and drops "window".
    if ((xTitle.node()?.getComputedTextLength?.() ?? 0) > width - 40) {
      xTitle.text("CONTEXT (TOKENS, LOG)");
    }

    g.append("text")
      .attr("transform", `translate(-46,${innerHeight / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("fill", axisColor)
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("letter-spacing", "0.18em")
      .attr("text-transform", "uppercase")
      .text("BLENDED PRICE / 1M (USD, LOG)");

    g.selectAll<SVGCircleElement, PlottedModel>("circle.point")
      .data(plotted, (d) => d.model.id)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", (d) => (d.model.id === selectedModelId ? 11 : 8))
      .attr("fill", (d) => FRONTIER_PROVIDER_COLORS[d.model.provider])
      .attr("fill-opacity", 0.85)
      // A provider colour alone doesn't clear 3:1 against the plate in every
      // theme (blended anthropic/openai/google/meta/mistral fall short on
      // light paper, xai/deepseek on dark paper), so every dot gets an ink
      // edge as its own contrasting boundary rather than the surface colour,
      // which did nothing against a same-colour background.
      .attr("stroke", axisColor)
      .attr("stroke-width", 1.5)
      // Pointer only. A 16px dot is no keyboard target, and the spec sheet
      // below opens the same row from a real button, so the marks stay
      // presentational inside the role="img" plot, as the treemap's do.
      .style("cursor", "pointer")
      .on("click", (_, d) => {
        onSelectModel(d.model.id === selectedModelId ? null : d.model.id);
      })
      .append("title")
      .text(
        (d) =>
          `${d.model.providerLabel} ${d.model.name}\nContext: ${formatTokenCount(d.model.contextWindow)}\nBlended price: ${formatPriceUsd(d.y)} / 1M`
      );
  }, [containerWidth, plotted, selectedModelId, onSelectModel, resolvedTheme]);

  const providersInChart = useMemo(() => {
    const seen = new Map<FrontierProvider, string>();
    plotted.forEach((entry) => {
      seen.set(entry.model.provider, entry.model.providerLabel);
    });
    return Array.from(seen.entries());
  }, [plotted]);

  if (plotted.length === 0) {
    return (
      <p className="c97-meta" style={{ padding: "var(--c97-sp-4) 0" }}>
        No models match the current filters.
      </p>
    );
  }

  return (
    <div>
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} className="w-full" />
      </div>
      <div
        className="flex flex-wrap items-center text-xs"
        style={{ marginTop: "var(--c97-sp-2)", rowGap: "var(--c97-sp-1)", columnGap: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}
      >
        {providersInChart.map(([provider, label]) => (
          <span key={provider} className="inline-flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5"
              style={{
                background: FRONTIER_PROVIDER_COLORS[provider],
                border: "1px solid var(--c97-ink-2)",
              }}
            />
            <span style={{ color: "var(--c97-ink)" }}>{label}</span>
          </span>
        ))}
        <span className="ml-auto" style={{ color: "var(--c97-ink-2)" }}>
          Blended price = (input + 3 × output) / 4
        </span>
      </div>
      <ol className="sr-only">
        {plotted.map((entry) => (
          <li key={entry.model.id}>
            {entry.model.providerLabel} {entry.model.name}: context{" "}
            {formatTokenCount(entry.model.contextWindow)}, blended price{" "}
            {formatPriceUsd(entry.y)} per million tokens.
          </li>
        ))}
      </ol>
    </div>
  );
}
