"use client";

import { select, extent, scaleLog, axisBottom, axisLeft } from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  blendedPricePerMTokens,
  formatPriceUsd,
  formatTokenCount,
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

const PROVIDER_COLORS: Record<FrontierProvider, string> = {
  anthropic: "#d97706",
  openai: "#10a37f",
  google: "#4285f4",
  meta: "#1877f2",
  xai: "#475569",
  deepseek: "#7c3aed",
  mistral: "#fa5400",
};

const HEIGHT = 360;
const MARGIN = { top: 20, right: 24, bottom: 56, left: 64 };

export function FrontierCostContextChart({
  models,
  selectedModelId,
  onSelectModel,
}: FrontierCostContextChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
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
        `Scatter plot of blended price per million tokens versus context window for ${plotted.length} frontier models. Use the list view for a fully sortable, screen-reader accessible version.`
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

    const axisColor = "color-mix(in srgb, var(--home-ink) 55%, var(--home-paper))";
    const gridColor = "color-mix(in srgb, var(--home-ink) 12%, var(--home-paper))";

    const xAxis = axisBottom(xScale)
      .ticks(5, ".2s")
      .tickFormat((value) => formatTokenCount(Number(value)));
    const yAxis = axisLeft(yScale)
      .ticks(5, ".2s")
      .tickFormat((value) => `$${Number(value).toFixed(Number(value) < 1 ? 2 : 0)}`);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((selection) => {
        selection.selectAll("path,line").attr("stroke", axisColor);
        selection.selectAll("text").attr("fill", axisColor).attr("font-size", "11px");
      });

    g.append("g")
      .call(yAxis)
      .call((selection) => {
        selection.selectAll("path,line").attr("stroke", axisColor);
        selection.selectAll("text").attr("fill", axisColor).attr("font-size", "11px");
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

    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 40)
      .attr("text-anchor", "middle")
      .attr("fill", axisColor)
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("letter-spacing", "0.18em")
      .attr("text-transform", "uppercase")
      .text("CONTEXT WINDOW (TOKENS, LOG)");

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
      .attr("r", (d) => (d.model.id === selectedModelId ? 9 : 6))
      .attr("fill", (d) => PROVIDER_COLORS[d.model.provider])
      .attr("fill-opacity", 0.85)
      .attr("stroke", "var(--home-paper)")
      .attr("stroke-width", 2)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr(
        "aria-label",
        (d) =>
          `${d.model.providerLabel} ${d.model.name}, context ${formatTokenCount(d.model.contextWindow)}, blended price ${formatPriceUsd(d.y)} per 1M tokens`
      )
      .style("cursor", "pointer")
      .on("click", (_, d) => {
        onSelectModel(d.model.id === selectedModelId ? null : d.model.id);
      })
      .on("keydown", (event: KeyboardEvent, d) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectModel(d.model.id === selectedModelId ? null : d.model.id);
        }
      })
      .append("title")
      .text(
        (d) =>
          `${d.model.providerLabel} ${d.model.name}\nContext: ${formatTokenCount(d.model.contextWindow)}\nBlended price: ${formatPriceUsd(d.y)} / 1M`
      );
  }, [containerWidth, plotted, selectedModelId, onSelectModel]);

  const providersInChart = useMemo(() => {
    const seen = new Map<FrontierProvider, string>();
    plotted.forEach((entry) => {
      seen.set(entry.model.provider, entry.model.providerLabel);
    });
    return Array.from(seen.entries());
  }, [plotted]);

  if (plotted.length === 0) {
    return (
      <div className="home-card p-6 text-center text-sm text-[var(--home-ink-muted)]">
        No models match the current filters.
      </div>
    );
  }

  return (
    <div className="home-card p-4 sm:p-6">
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} className="w-full" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--home-ink-muted)]">
        {providersInChart.map(([provider, label]) => (
          <span key={provider} className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: PROVIDER_COLORS[provider] }}
            />
            <span className="text-[var(--home-ink)]">{label}</span>
          </span>
        ))}
        <span className="ml-auto text-[var(--home-ink-muted)]">
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
