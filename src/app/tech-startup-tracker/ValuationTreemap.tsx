"use client";

import { useMemo } from "react";
import { formatUsdCompact } from "@/lib/techStartups";
import { SECTOR_LABEL_MIN_HEIGHT, valuationTreemap, type TreemapStartup } from "./treemap";

interface ValuationTreemapProps {
  startups: TreemapStartup[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Display names for the sector ids, e.g. "AI & ML" for "sector-ai". */
  sectorLabels?: Readonly<Record<string, string>>;
}

const W = 1000;
const H = 520;
const CHART_TOKENS = [
  "var(--c97-chart-1)",
  "var(--c97-chart-2)",
  "var(--c97-chart-3)",
  "var(--c97-chart-4)",
  "var(--c97-chart-5)",
  "var(--c97-chart-6)",
];

// ponytail: character-count width estimates, not real text measurement (no
// canvas or ref at this render point). Calibrated against getBBox() widths of
// the rendered labels: tile names in Newsreader at 15px run about 6.4 to 8.5
// units a character, and the uppercase sector labels in Archivo at 11px with
// 0.08em tracking about 7 to 8.3. Both round up so a label truncates a touch
// early rather than overflow. Upgrade path is a layout-effect pass that
// measures getBBox() per label, if a future name stops fitting the estimate.
const NAME_CHAR_WIDTH = 7.5;
const SECTOR_CHAR_WIDTH = 8.5;
const NAME_BACKDROP_MAX = 176;
const TILE_LABEL_MIN_HEIGHT = 48;

/** Truncates `text` with an ellipsis so it fits in `available` units. */
function fitLabel(text: string, available: number, charWidth: number): string {
  if (text.length * charWidth <= available) return text;
  const maxChars = Math.max(1, Math.floor(available / charWidth) - 1);
  return `${text.slice(0, maxChars)}…`;
}

/**
 * The page's signature, a valuation treemap. Each disclosed startup becomes
 * a rectangle sized by valuation and grouped by sector, so a $300B company
 * beside a $6B one shows the concentration the table below can't. A tile
 * responds to a pointer; the table is the keyboard path to the same
 * selection.
 */
export function ValuationTreemap({ startups, selectedId, onSelect, sectorLabels }: ValuationTreemapProps) {
  const sectors = useMemo(() => valuationTreemap(startups, W, H), [startups]);

  if (sectors.length === 0) {
    return <p className="c97-meta">No disclosed valuations in this filter.</p>;
  }

  const allTiles = sectors.flatMap((sector) => sector.tiles);
  const largest = allTiles.reduce((top, tile) => (tile.valuation > top.valuation ? tile : top));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-labelledby="startup-treemap-title"
      className="c97-startup-treemap"
    >
      <title id="startup-treemap-title">
        {`Disclosed valuations by sector. The largest is ${largest.name}, at ${formatUsdCompact(largest.valuation)}.`}
      </title>
      {sectors.map((sector, sectorIndex) => (
        <g key={sector.sector}>
          {sector.tiles.map((tile) => {
            const width = Math.max(tile.x1 - tile.x0, 0);
            const height = Math.max(tile.y1 - tile.y0, 0);
            const showLabel = width > 90 && height > TILE_LABEL_MIN_HEIGHT;
            const backdropWidth = Math.min(width - 8, NAME_BACKDROP_MAX);
            const isSelected = tile.id === selectedId;
            return (
              // Pointer only. The table below is the keyboard path, and
              // role="img" makes these marks presentational anyway.
              <g
                key={tile.id}
                data-selected={isSelected}
                className="c97-startup-treemap-tile"
                onClick={() => onSelect(tile.id)}
              >
                <title>{`${tile.name}, ${formatUsdCompact(tile.valuation)}`}</title>
                {/* Tokens go through `style`, since an SVG presentation
                    attribute cannot substitute var(). The stroke lives in
                    the route CSS so the selected rule can outrank it. */}
                <rect
                  x={tile.x0}
                  y={tile.y0}
                  width={width}
                  height={height}
                  fillOpacity={isSelected ? 1 : 0.85}
                  style={{ fill: CHART_TOKENS[sectorIndex % CHART_TOKENS.length] }}
                />
                {showLabel ? (
                  <g className="c97-startup-treemap-tile-label">
                    {/* A tile's fill is a data colour with no guaranteed
                        contrast against any one text colour, so the label
                        sits on its own opaque backdrop in the hero's own
                        surface and ink tokens, the same pairing the
                        catalog97-inks test already clears. Hidden at phone
                        width, where the viewBox scales down enough that
                        this much text stops being legible; the tile's
                        <title> and the table below still carry it. */}
                    <rect
                      x={tile.x0 + 4}
                      y={tile.y0 + 6}
                      width={backdropWidth}
                      height={40}
                      fillOpacity={0.88}
                      style={{ fill: "var(--c97-surface)" }}
                    />
                    <text x={tile.x0 + 10} y={tile.y0 + 22} className="c97-startup-treemap-tile-name">
                      {fitLabel(tile.name, backdropWidth - 12, NAME_CHAR_WIDTH)}
                    </text>
                    <text x={tile.x0 + 10} y={tile.y0 + 40} className="c97-startup-treemap-tile-value">
                      {formatUsdCompact(tile.valuation)}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
          {sector.y1 - sector.y0 >= SECTOR_LABEL_MIN_HEIGHT
            ? (() => {
                const sectorWidth = sector.x1 - sector.x0;
                const label = fitLabel(sectorLabels?.[sector.sector] ?? sector.sector, sectorWidth - 8, SECTOR_CHAR_WIDTH);
                return (
                  <g className="c97-startup-treemap-sector-label-group">
                    <rect
                      x={sector.x0}
                      y={sector.y0}
                      width={Math.min(sectorWidth, label.length * SECTOR_CHAR_WIDTH + 8)}
                      height={18}
                      fillOpacity={0.85}
                      style={{ fill: "var(--c97-surface)" }}
                    />
                    <text x={sector.x0 + 4} y={sector.y0 + 13} className="c97-startup-treemap-sector-label">
                      {label}
                    </text>
                  </g>
                );
              })()
            : null}
        </g>
      ))}
    </svg>
  );
}
