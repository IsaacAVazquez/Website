import type { ReadonlyURLSearchParams } from "next/navigation";
import { buildHref, readEnum, readParam, type SearchParamInput } from "@/lib/searchParams";

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
const TASKS = ["portfolio", "research", "retirement"] as const;
const SECTIONS = [
  "overview",
  "financials",
  "growth",
  "valuation",
  "industry",
  "chart",
  "compare",
] as const;

function normalizeSymbol(rawSymbol: string | null): string {
  const upper = rawSymbol?.trim().toUpperCase() ?? "";
  return VALID_SYMBOL_PATTERN.test(upper) ? upper : DEFAULT_INVESTMENTS_STATE.symbol;
}

export function normalizeInvestmentsState(input: SearchParamInput): InvestmentsSearchState {
  return {
    task: readEnum(input, "task", TASKS, DEFAULT_INVESTMENTS_STATE.task),
    symbol: normalizeSymbol(readParam(input, "symbol")),
    section: readEnum(input, "section", SECTIONS, DEFAULT_INVESTMENTS_STATE.section),
  };
}

export function buildInvestmentsHref(
  state: InvestmentsSearchState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  return buildHref(
    "/investments",
    {
      // ?view= is the retired two-view switch, so strip any legacy values. The
      // task choice has its own param and stays off the URL while it is the
      // default; the section is always written.
      view: null,
      task: state.task,
      symbol: state.symbol || null,
      section: state.section,
    },
    { task: DEFAULT_INVESTMENTS_STATE.task },
    baseSearchParams
  );
}
