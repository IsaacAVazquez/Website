import type { ReadonlyURLSearchParams } from "next/navigation";
import { buildHref, readEnum, type SearchParamInput } from "@/lib/searchParams";

export type FantasyFormula1Sort = "value" | "projection" | "price" | "form";
export type FantasyFormula1Focus = "drivers" | "constructors" | null;

export interface FantasyFormula1RouteState {
  sort: FantasyFormula1Sort;
  focus: FantasyFormula1Focus;
}

export const FANTASY_FORMULA1_ROUTE = "/fantasy-formula-1";

export const FANTASY_FORMULA1_SORT_OPTIONS = ["value", "projection", "price", "form"] as const;
export const FANTASY_FORMULA1_FOCUS_OPTIONS = ["drivers", "constructors"] as const;

export const DEFAULT_FANTASY_FORMULA1_STATE: FantasyFormula1RouteState = {
  sort: "value",
  focus: null,
};

export const FANTASY_FORMULA1_SORT_LABELS: Record<FantasyFormula1Sort, string> = {
  value: "Value",
  projection: "Projection",
  price: "Price",
  form: "Form",
};

export function normalizeFantasyFormula1State(
  input: SearchParamInput
): FantasyFormula1RouteState {
  return {
    sort: readEnum(input, "sort", FANTASY_FORMULA1_SORT_OPTIONS, DEFAULT_FANTASY_FORMULA1_STATE.sort),
    focus: readEnum(input, "focus", FANTASY_FORMULA1_FOCUS_OPTIONS, DEFAULT_FANTASY_FORMULA1_STATE.focus),
  };
}

export function buildFantasyFormula1Href(
  state: FantasyFormula1RouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  return buildHref(
    FANTASY_FORMULA1_ROUTE,
    // The page had builder, assets, and rules views until 2026-10-12, when the
    // slate became one list. An old link's view param is dropped, not kept.
    { view: null, sort: state.sort, focus: state.focus },
    DEFAULT_FANTASY_FORMULA1_STATE,
    baseSearchParams
  );
}
