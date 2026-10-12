import type { ReadonlyURLSearchParams } from "next/navigation";
import { readParam, type SearchParamInput } from "@/lib/searchParams";

export type FantasyFormula1Sort = "value" | "projection" | "price" | "form";
export type FantasyFormula1Focus = "drivers" | "constructors" | null;

export interface FantasyFormula1RouteState {
  sort: FantasyFormula1Sort;
  focus: FantasyFormula1Focus;
}

export const FANTASY_FORMULA1_ROUTE = "/fantasy-formula-1";

export const FANTASY_FORMULA1_SORT_OPTIONS = ["value", "projection", "price", "form"] as const;
export const FANTASY_FORMULA1_FOCUS_OPTIONS = ["drivers", "constructors"] as const;

const VALID_SORTS = new Set<FantasyFormula1Sort>(FANTASY_FORMULA1_SORT_OPTIONS);
const VALID_FOCUS = new Set<Exclude<FantasyFormula1Focus, null>>(
  FANTASY_FORMULA1_FOCUS_OPTIONS
);

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

function normalizeSort(value: string | null): FantasyFormula1Sort {
  return VALID_SORTS.has((value ?? "") as FantasyFormula1Sort)
    ? (value as FantasyFormula1Sort)
    : DEFAULT_FANTASY_FORMULA1_STATE.sort;
}

function normalizeFocus(value: string | null): FantasyFormula1Focus {
  return VALID_FOCUS.has((value ?? "") as Exclude<FantasyFormula1Focus, null>)
    ? (value as Exclude<FantasyFormula1Focus, null>)
    : DEFAULT_FANTASY_FORMULA1_STATE.focus;
}

export function normalizeFantasyFormula1State(
  input: SearchParamInput
): FantasyFormula1RouteState {
  return {
    sort: normalizeSort(readParam(input, "sort")),
    focus: normalizeFocus(readParam(input, "focus")),
  };
}

export function buildFantasyFormula1Href(
  state: FantasyFormula1RouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );

  // The page had builder, assets, and rules views until 2026-10-12, when the
  // slate became one list. An old link's view param is dropped, not kept.
  params.delete("view");

  if (state.sort === DEFAULT_FANTASY_FORMULA1_STATE.sort) {
    params.delete("sort");
  } else {
    params.set("sort", state.sort);
  }

  if (state.focus && state.focus !== DEFAULT_FANTASY_FORMULA1_STATE.focus) {
    params.set("focus", state.focus);
  } else {
    params.delete("focus");
  }

  const query = params.toString();
  return `${FANTASY_FORMULA1_ROUTE}${query ? `?${query}` : ""}`;
}
