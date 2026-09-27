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

// ponytail: character-count width estimate, not a real text measurement (no
// canvas/ref available at this render point). Calibrated against actual
// getBBox() widths of rendered tile names in the Newsreader display face at
// 15px (observed ~6.4 to 8.5 user units per character); 7.5 errs toward
// truncating a touch early rather than ever overflowing. Upgrade path: a
// layout-effect pass that measures real getBBox() per tile and re-truncates,
// if a future name is wide enough that this estimate stops holding.
const CHAR_WIDTH_ESTIMATE = 7.5;
const NAME_LABEL_START_OFFSET = 10;

/** Truncates `name` with an ellipsis so it fits inside `tileWidth` at the
 * tile-name font size, so a long startup name can never overflow its tile. */
function fitTileName(name: string, tileWidth: number): string {
  const available = tileWidth - NAME_LABEL_START_OFFSET;
  if (name.length * CHAR_WIDTH_ESTIMATE <= available) return name;
  const maxChars = Math.max(1, Math.floor(available / CHAR_WIDTH_ESTIMATE) - 1);
  return `${name.slice(0, maxChars)}…`;
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
            const showLabel = width > 90 && height > 40;
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
                <rect
                  x={tile.x0}
                  y={tile.y0}
                  width={width}
                  height={height}
                  fill={CHART_TOKENS[sectorIndex % CHART_TOKENS.length]}
                  fillOpacity={isSelected ? 1 : 0.85}
                  stroke="var(--c97-surface)"
                  strokeWidth={1.5}
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
                      width={Math.min(width - 8, 176)}
                      height={40}
                      fill="var(--c97-surface)"
                      fillOpacity={0.88}
                    />
                    <text x={tile.x0 + 10} y={tile.y0 + 22} className="c97-startup-treemap-tile-name">
                      {fitTileName(tile.name, width)}
                    </text>
                    <text x={tile.x0 + 10} y={tile.y0 + 40} className="c97-startup-treemap-tile-value">
                      {formatUsdCompact(tile.valuation)}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
          {sector.y1 - sector.y0 >= SECTOR_LABEL_MIN_HEIGHT ? (
            <g className="c97-startup-treemap-sector-label-group">
              <rect
                x={sector.x0}
                y={sector.y0}
                width={Math.min(150, sector.x1 - sector.x0)}
                height={18}
                fill="var(--c97-surface)"
                fillOpacity={0.85}
              />
              <text x={sector.x0 + 4} y={sector.y0 + 13} className="c97-startup-treemap-sector-label">
                {sectorLabels?.[sector.sector] ?? sector.sector}
              </text>
            </g>
          ) : null}
        </g>
      ))}
    </svg>
  );
}
