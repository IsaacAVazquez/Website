import {
  FANTASY_FORMULA1_CONSTRUCTOR_SLOTS,
  FANTASY_FORMULA1_DRIVER_SLOTS,
} from "@/lib/fantasyFormula1";
import type { FantasyFormula1Asset, FantasyFormula1LineupSummary } from "@/types/fantasyFormula1";

export interface GarageSlot {
  kind: "driver" | "constructor";
  asset: FantasyFormula1Asset | null;
}

export interface GarageBudgetBar {
  /** Share of the track the spend inside the budget fills. */
  spentWidth: number;
  /** Share of the track the spend past the budget fills, 0 when under. */
  overWidth: number;
  /** Where the budget line sits on the track, 1 unless the lineup runs over. */
  budgetLineAt: number;
  isOver: boolean;
}

export interface GarageLayout {
  driverSlots: GarageSlot[];
  constructorSlots: GarageSlot[];
  budget: GarageBudgetBar;
}

function buildSlots(
  kind: GarageSlot["kind"],
  assets: FantasyFormula1Asset[],
  slotCount: number
): GarageSlot[] {
  return Array.from({ length: slotCount }, (_, index) => ({
    kind,
    asset: assets[index] ?? null,
  }));
}

/**
 * Maps a lineup summary onto the garage's five driver boxes and two
 * constructor boxes, in the order the picks were made, and turns the spend
 * into the budget bar, whose track stretches to the lineup's cost when it
 * runs over so the budget line and the overspend both stay on it.
 */
export function garageSlots(summary: FantasyFormula1LineupSummary, budget: number): GarageLayout {
  const driverSlots = buildSlots("driver", summary.drivers, FANTASY_FORMULA1_DRIVER_SLOTS);
  const constructorSlots = buildSlots(
    "constructor",
    summary.constructors,
    FANTASY_FORMULA1_CONSTRUCTOR_SLOTS
  );

  // The track is the budget, or the lineup's cost when it runs over, so an
  // overspend of any size stays on the track beside the budget line.
  const safeBudget = budget > 0 ? budget : 0;
  const spent = Math.max(0, summary.totalPrice);
  const isOver = spent > safeBudget;
  const track = Math.max(safeBudget, spent);
  const round = (value: number) => Math.round(value * 1000) / 1000;
  const spentWidth = track > 0 ? round(Math.min(spent, safeBudget) / track) : 0;
  const overWidth = isOver ? round((spent - safeBudget) / track) : 0;
  const budgetLineAt = track > 0 ? round(safeBudget / track) : 1;

  return {
    driverSlots,
    constructorSlots,
    budget: { spentWidth, overWidth, budgetLineAt, isOver },
  };
}

/** Prices in millions: "$12.5m", "-$0.4m". */
export function formatMoney(value: number): string {
  return `${value < 0 ? "-" : ""}$${Math.abs(value).toFixed(1)}m`;
}

/** Some snapshots store a team colour without its leading "#"; null means no colour. */
export function normaliseTeamColor(color: string | null): string | null {
  if (!color) {
    return null;
  }

  return color.startsWith("#") ? color : `#${color}`;
}
