import type { ReadonlyURLSearchParams } from "next/navigation";

export type FantasyFormula1View = "builder" | "assets" | "rules";
export type FantasyFormula1Sort = "value" | "projection" | "price" | "form";
export type FantasyFormula1Focus = "drivers" | "constructors" | null;

export interface FantasyFormula1RouteState {
  view: FantasyFormula1View;
  sort: FantasyFormula1Sort;
  focus: FantasyFormula1Focus;
}

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

export const FANTASY_FORMULA1_ROUTE = "/fantasy-formula-1";

export const FANTASY_FORMULA1_VIEW_OPTIONS = ["builder", "assets", "rules"] as const;
export const FANTASY_FORMULA1_SORT_OPTIONS = ["value", "projection", "price", "form"] as const;
export const FANTASY_FORMULA1_FOCUS_OPTIONS = ["drivers", "constructors"] as const;

const VALID_VIEWS = new Set<FantasyFormula1View>(FANTASY_FORMULA1_VIEW_OPTIONS);
const VALID_SORTS = new Set<FantasyFormula1Sort>(FANTASY_FORMULA1_SORT_OPTIONS);
const VALID_FOCUS = new Set<Exclude<FantasyFormula1Focus, null>>(
  FANTASY_FORMULA1_FOCUS_OPTIONS
);

export const DEFAULT_FANTASY_FORMULA1_STATE: FantasyFormula1RouteState = {
  view: "builder",
  sort: "value",
  focus: null,
};

export const FANTASY_FORMULA1_VIEW_LABELS: Record<FantasyFormula1View, string> = {
  builder: "Builder",
  assets: "Assets",
  rules: "Rules",
};

export const FANTASY_FORMULA1_SORT_LABELS: Record<FantasyFormula1Sort, string> = {
  value: "Value",
  projection: "Projection",
  price: "Price",
  form: "Form",
};

function readParam(input: SearchParamInput, key: keyof FantasyFormula1RouteState): string | null {
  if ("get" in input && typeof input.get === "function") {
    return input.get(key);
  }

  const rawValue = (input as SearchParamRecord)[key];
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }

  return rawValue ?? null;
}

function normalizeView(value: string | null): FantasyFormula1View {
  return VALID_VIEWS.has((value ?? "") as FantasyFormula1View)
    ? (value as FantasyFormula1View)
    : DEFAULT_FANTASY_FORMULA1_STATE.view;
}

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
    view: normalizeView(readParam(input, "view")),
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

  if (state.view === DEFAULT_FANTASY_FORMULA1_STATE.view) {
    params.delete("view");
  } else {
    params.set("view", state.view);
  }

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
