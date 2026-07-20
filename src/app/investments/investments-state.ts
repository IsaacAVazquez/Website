import type { ReadonlyURLSearchParams } from "next/navigation";

export type InvestmentsView = "research" | "portfolio";
export type ResearchTab =
  | "overview"
  | "financials"
  | "growth"
  | "valuation"
  | "industry"
  | "chart"
  | "compare";

export interface InvestmentsSearchState {
  view: InvestmentsView;
  symbol: string;
  section: ResearchTab;
}

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

export const DEFAULT_INVESTMENTS_STATE: InvestmentsSearchState = {
  view: "portfolio",
  symbol: "",
  section: "overview",
};

const VALID_SYMBOL_PATTERN = /^[A-Z0-9.-]{1,10}$/;
const VALID_VIEWS = new Set<InvestmentsView>(["research", "portfolio"]);
const VALID_SECTIONS = new Set<ResearchTab>([
  "overview",
  "financials",
  "growth",
  "valuation",
  "industry",
  "chart",
  "compare",
]);

function readParam(input: SearchParamInput, key: keyof InvestmentsSearchState): string | null {
  if ("get" in input && typeof input.get === "function") {
    return input.get(key);
  }

  const rawValue = (input as Record<string, string | string[] | undefined | null>)[key];
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }

  return rawValue ?? null;
}

function normalizeSymbol(rawSymbol: string | null): string {
  const upper = rawSymbol?.trim().toUpperCase() ?? "";
  if (!upper) return DEFAULT_INVESTMENTS_STATE.symbol;
  return VALID_SYMBOL_PATTERN.test(upper) ? upper : DEFAULT_INVESTMENTS_STATE.symbol;
}

export function normalizeInvestmentsState(input: SearchParamInput): InvestmentsSearchState {
  const view = readParam(input, "view");
  const symbol = readParam(input, "symbol");
  const section = readParam(input, "section");

  return {
    view: VALID_VIEWS.has((view ?? "") as InvestmentsView)
      ? (view as InvestmentsView)
      : DEFAULT_INVESTMENTS_STATE.view,
    symbol: normalizeSymbol(symbol),
    section: VALID_SECTIONS.has((section ?? "") as ResearchTab)
      ? (section as ResearchTab)
      : DEFAULT_INVESTMENTS_STATE.section,
  };
}

export function buildInvestmentsHref(
  state: InvestmentsSearchState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(baseSearchParams ? Array.from(baseSearchParams.entries()) : []);
  // The unified dashboard no longer uses ?view=, so strip any legacy values.
  params.delete("view");
  if (state.symbol) {
    params.set("symbol", state.symbol);
  } else {
    params.delete("symbol");
  }
  params.set("section", state.section);
  return `/investments?${params.toString()}`;
}
