import type { WineEntry, WineType } from "@/types/wine";

export interface WineRackSlot {
  id: string;
  type: WineType;
  name: string;
  producer: string;
  vintage: number | null;
  rating: number;
}

export interface WineRackRow {
  region: string;
  slots: WineRackSlot[];
}

const UNKNOWN_REGION = "Unknown region";

function toSlot(entry: WineEntry): WineRackSlot {
  return {
    id: entry.id,
    type: entry.type,
    name: entry.name,
    producer: entry.producer,
    vintage: entry.vintage,
    rating: entry.rating,
  };
}

/**
 * The rack: one row per region, ranked by how many bottles it holds so the
 * busiest region reads first, ties broken alphabetically. A blank region
 * still gets its own row rather than disappearing.
 */
export function wineRack(entries: WineEntry[]): WineRackRow[] {
  const groups = new Map<string, WineEntry[]>();
  for (const entry of entries) {
    const key = entry.region.trim() || UNKNOWN_REGION;
    const bucket = groups.get(key);
    if (bucket) bucket.push(entry);
    else groups.set(key, [entry]);
  }
  return Array.from(groups.entries())
    .map(([region, group]) => ({ region, slots: group.map(toSlot) }))
    .sort(
      (a, b) => b.slots.length - a.slots.length || a.region.localeCompare(b.region)
    );
}

/**
 * The seven wine types onto the six-step chart ramp. Orange reuses white's
 * step, since extended skin-contact whites are its closest relative, but
 * drawn hollow (a ring) so it never reads as the same mark as white.
 */
export const WINE_TYPE_MARK: Record<WineType, { token: string; hollow: boolean }> = {
  red: { token: "--c97-chart-1", hollow: false },
  white: { token: "--c97-chart-2", hollow: false },
  rose: { token: "--c97-chart-3", hollow: false },
  sparkling: { token: "--c97-chart-4", hollow: false },
  dessert: { token: "--c97-chart-5", hollow: false },
  fortified: { token: "--c97-chart-6", hollow: false },
  orange: { token: "--c97-chart-2", hollow: true },
};
