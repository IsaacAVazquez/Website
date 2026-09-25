"use client";

import { Boxes, Cloud, PanelsTopLeft, Terminal } from "lucide-react";
import {
  AI_DEV_TOOL_CATEGORY_LABELS,
  AI_DEV_TOOL_PRICING_LABELS,
  type AiDevTool,
  type AiDevToolCategory,
} from "./ai-dev-tools-data";
import { surfaceMap, type SurfaceMapRow } from "./surface-map";
import "./ai-dev-tools.css";

interface ToolCategoryIconProps {
  category: AiDevToolCategory;
  className?: string;
}

export function ToolCategoryIcon({ category, className = "h-4 w-4" }: ToolCategoryIconProps) {
  switch (category) {
    case "cloud-agent":
      return <Cloud aria-hidden="true" className={className} />;
    case "terminal-agent":
      return <Terminal aria-hidden="true" className={className} />;
    case "review-ci":
      return <Boxes aria-hidden="true" className={className} />;
    case "ide":
    case "editor-extension":
    case "enterprise-platform":
    default:
      return <PanelsTopLeft aria-hidden="true" className={className} />;
  }
}

function categoryLabel(category: string): string {
  return category in AI_DEV_TOOL_CATEGORY_LABELS
    ? AI_DEV_TOOL_CATEGORY_LABELS[category as AiDevToolCategory]
    : category;
}

function pricingLabel(pricing: string): string {
  return pricing in AI_DEV_TOOL_PRICING_LABELS
    ? AI_DEV_TOOL_PRICING_LABELS[pricing as keyof typeof AI_DEV_TOOL_PRICING_LABELS]
    : pricing;
}

interface SurfaceMapProps {
  tools: AiDevTool[];
  categories: string[];
  pricing: string[];
  selectedToolId: string | null;
  onSelect: (toolId: string) => void;
}

function Plate({
  tool,
  isSelected,
  onSelect,
}: {
  tool: AiDevTool;
  isSelected: boolean;
  onSelect: (toolId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tool.id)}
      aria-pressed={isSelected}
      className={`c97-surface-map-plate${isSelected ? " c97-offset" : ""}`}
    >
      <ToolCategoryIcon category={tool.category} className="h-3.5 w-3.5" />
      {tool.name}
    </button>
  );
}

/**
 * The page's signature. Every tool sits at the intersection of what it is
 * (category, down the side) and what it costs (pricing model, across the
 * top), so the shape of the market reads before a single filter is touched.
 * A plate opens the same detail rail the directory list below uses.
 *
 * Two markups share one data model: a CSS grid for anything wide enough to
 * show both axes at once, and a stacked list, grouped by category then
 * pricing, for a 390px phone. `ai-dev-tools.css` toggles which one paints.
 */
export function SurfaceMap({ tools, categories, pricing, selectedToolId, onSelect }: SurfaceMapProps) {
  const rows = surfaceMap(tools, categories, pricing);
  if (rows.length === 0) return null;
  const colKeys = rows[0].cells.map((cell) => cell.pricing);
  const plate = (tool: AiDevTool) => (
    <Plate key={tool.id} tool={tool} isSelected={tool.id === selectedToolId} onSelect={onSelect} />
  );

  return (
    // The map is a plate on its own paper, not printed straight onto the hero
    // ink: the field tint behind an empty cell and a plate's hover state
    // both only clear contrast against paper, not against every ink's own
    // (sometimes inverted) ink colour.
    <div data-c97-surface="paper" className="c97-offset c97-surface-map-sheet">
      <div
        role="table"
        aria-label="AI dev tools by category and pricing model"
        className="c97-surface-map"
        style={{ "--c97-surface-map-cols": colKeys.length } as React.CSSProperties}
      >
        <div role="row" className="c97-surface-map-row">
          <span role="columnheader" aria-hidden="true" />
          {colKeys.map((pricingKey) => (
            <span key={pricingKey} role="columnheader" className="c97-kicker c97-surface-map-col-header">
              {pricingLabel(pricingKey)}
            </span>
          ))}
        </div>
        {rows.map((row) => (
          <div key={row.category} role="row" className="c97-surface-map-row">
            <span role="rowheader" className="c97-poster-sm c97-surface-map-row-header">
              {categoryLabel(row.category)}
            </span>
            {row.cells.map((cell) => (
              <div key={cell.pricing} role="cell" className="c97-surface-map-cell">
                {cell.tools.map(plate)}
              </div>
            ))}
          </div>
        ))}
      </div>

      <dl className="c97-surface-map-list">
        {rows.map((row: SurfaceMapRow) => {
          const cellsWithTools = row.cells.filter((cell) => cell.tools.length > 0);
          if (cellsWithTools.length === 0) return null;
          return (
            <div key={row.category} className="c97-surface-map-list-group">
              <dt className="c97-poster-sm">{categoryLabel(row.category)}</dt>
              {cellsWithTools.map((cell) => (
                <dd key={cell.pricing} className="c97-surface-map-list-cell">
                  <span className="c97-kicker">{pricingLabel(cell.pricing)}</span>
                  <div className="c97-surface-map-list-plates">{cell.tools.map(plate)}</div>
                </dd>
              ))}
            </div>
          );
        })}
      </dl>
    </div>
  );
}
