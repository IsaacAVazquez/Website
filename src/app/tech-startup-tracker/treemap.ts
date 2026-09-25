import { hierarchy, treemap, treemapSquarify } from "d3";

export interface TreemapStartup {
  id: string;
  name: string;
  sector: string;
  valuation: number | null;
}

export interface ValuationTile {
  id: string;
  name: string;
  valuation: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface SectorBlock {
  sector: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  tiles: ValuationTile[];
}

const PAD = 2;

/** A sector shorter than this shows no kicker label (there's no room for one
 * without it colliding with its tiles), so it skips the gutter below and
 * gives tiles the full band. `ValuationTreemap` uses the same threshold to
 * decide whether to draw the label. */
export const SECTOR_LABEL_MIN_HEIGHT = 30;
const LABEL_GUTTER = 20;

/**
 * Disclosed valuations grouped by sector, sized so a $300B company beside a
 * $6B one shows the concentration a table can't. Startups with a missing,
 * zero, or negative valuation are left out, since there's nothing to size a
 * tile against. Squarified, so a busy sector reads as tiles rather than slivers.
 */
export function valuationTreemap(
  startups: TreemapStartup[],
  width: number,
  height: number
): SectorBlock[] {
  const valid = startups.filter(
    (startup): startup is TreemapStartup & { valuation: number } =>
      typeof startup.valuation === "number" && startup.valuation > 0
  );
  if (valid.length === 0) return [];

  type Node = { name: string; id?: string; valuation?: number; children?: Node[] };
  const bySector = new Map<string, Node[]>();
  for (const startup of valid) {
    const list = bySector.get(startup.sector) ?? [];
    list.push({ name: startup.name, id: startup.id, valuation: startup.valuation });
    bySector.set(startup.sector, list);
  }
  const root = hierarchy<Node>({
    name: "all",
    children: [...bySector.entries()].map(([sector, children]) => ({ name: sector, children })),
  })
    .sum((node) => node.valuation ?? 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const laidOut = treemap<Node>()
    .tile(treemapSquarify)
    .size([width, height])
    .paddingInner(PAD)
    .paddingTop((node) => (node.depth === 1 ? LABEL_GUTTER : 0))(root);

  return (laidOut.children ?? []).map((sector) => ({
    sector: sector.data.name,
    x0: sector.x0,
    y0: sector.y0,
    x1: sector.x1,
    y1: sector.y1,
    tiles: (sector.children ?? []).map((tile) => ({
      id: tile.data.id ?? tile.data.name,
      name: tile.data.name,
      valuation: tile.data.valuation ?? 0,
      x0: tile.x0,
      y0: tile.y0,
      x1: tile.x1,
      y1: tile.y1,
    })),
  }));
}
