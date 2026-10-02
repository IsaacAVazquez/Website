import type { WineEntry, WineType } from "@/types/wine";
import { groupBy } from "@/lib/utils";

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
  const groups = groupBy(entries, (entry) => entry.region.trim() || UNKNOWN_REGION);
  return Array.from(groups.entries())
    .map(([region, group]) => ({ region, slots: group.map(toSlot) }))
    .sort(
      (a, b) => b.slots.length - a.slots.length || a.region.localeCompare(b.region)
    );
}

/**
 * The seven wine types onto the chart ramp. Only four steps read apart in
 * light mode (chart-4 and chart-5 sit a few shades from chart-6 and chart-2),
 * so related types share a step and the lighter or rarer one is drawn hollow.
 * Red and rose print in the wine step, white and orange in the straw step,
 * dessert and fortified in the darkest step, and sparkling in the teal.
 */
export const WINE_TYPE_MARK: Record<WineType, { token: string; hollow: boolean }> = {
  red: { token: "--c97-chart-3", hollow: false },
  rose: { token: "--c97-chart-3", hollow: true },
  white: { token: "--c97-chart-2", hollow: false },
  orange: { token: "--c97-chart-2", hollow: true },
  sparkling: { token: "--c97-chart-1", hollow: false },
  dessert: { token: "--c97-chart-6", hollow: false },
  fortified: { token: "--c97-chart-6", hollow: true },
};
