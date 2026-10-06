import type { ReadonlyURLSearchParams } from "next/navigation";
import { readParam, type SearchParamInput } from "@/lib/searchParams";

/** The workspace the page prints first. The other two follow it. */
export type InvestmentsTask = "portfolio" | "research" | "retirement";
export type ResearchTab =
  | "overview"
  | "financials"
  | "growth"
  | "valuation"
  | "industry"
  | "chart"
  | "compare";

export interface InvestmentsSearchState {
  task: InvestmentsTask;
  symbol: string;
  section: ResearchTab;
}

export const DEFAULT_INVESTMENTS_STATE: InvestmentsSearchState = {
  task: "portfolio",
  symbol: "",
  section: "overview",
};

const VALID_SYMBOL_PATTERN = /^[A-Z0-9.-]{1,10}$/;
const VALID_TASKS = new Set<InvestmentsTask>(["portfolio", "research", "retirement"]);
const VALID_SECTIONS = new Set<ResearchTab>([
  "overview",
  "financials",
  "growth",
  "valuation",
  "industry",
  "chart",
  "compare",
]);

function normalizeSymbol(rawSymbol: string | null): string {
  const upper = rawSymbol?.trim().toUpperCase() ?? "";
  if (!upper) return DEFAULT_INVESTMENTS_STATE.symbol;
  return VALID_SYMBOL_PATTERN.test(upper) ? upper : DEFAULT_INVESTMENTS_STATE.symbol;
}

export function normalizeInvestmentsState(input: SearchParamInput): InvestmentsSearchState {
  const task = readParam(input, "task");
  const symbol = readParam(input, "symbol");
  const section = readParam(input, "section");

  return {
    task: VALID_TASKS.has((task ?? "") as InvestmentsTask)
      ? (task as InvestmentsTask)
      : DEFAULT_INVESTMENTS_STATE.task,
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
  // ?view= is the retired two-view switch, so strip any legacy values. The
  // task choice has its own param and stays off the URL while it is the default.
  params.delete("view");
  if (state.task === DEFAULT_INVESTMENTS_STATE.task) {
    params.delete("task");
  } else {
    params.set("task", state.task);
  }
  if (state.symbol) {
    params.set("symbol", state.symbol);
  } else {
    params.delete("symbol");
  }
  params.set("section", state.section);
  return `/investments?${params.toString()}`;
}
