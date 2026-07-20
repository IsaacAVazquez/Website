import type {
  InvestmentCapabilities,
  InvestmentSection,
} from "@/types/investment";

type JsonRecord = Record<string, unknown>;

function hasRows(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function hasMeaningfulValue(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasMeaningfulValue);
  if (value && typeof value === "object") {
    return Object.values(value as JsonRecord).some(hasMeaningfulValue);
  }
  return false;
}

function hasFinancialRows(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const record = value as JsonRecord;
  return (
    ((record.quarterly as unknown[] | undefined)?.length ?? 0) +
      ((record.annual as unknown[] | undefined)?.length ?? 0) >
    0
  );
}

/**
 * Derive display capabilities from the data that will actually be served.
 * Provider error placeholders such as `{}` and `[{}]` must not unlock empty
 * research panels, even when an older snapshot claimed the section existed.
 */
export function buildInvestmentCapabilities(
  sections: Partial<Record<InvestmentSection, unknown>>
): InvestmentCapabilities {
  const capabilities: InvestmentCapabilities = {
    price: hasRows(sections.price),
    info: hasMeaningfulValue(sections.info),
    fundamentals: hasMeaningfulValue(sections.fundamentals),
    profitability: hasMeaningfulValue(sections.profitability),
    margins: hasMeaningfulValue(sections.margins),
    growth: hasMeaningfulValue(sections.growth),
    income_statement: hasFinancialRows(sections.income_statement),
    balance_sheet: hasFinancialRows(sections.balance_sheet),
    cash_flow: hasFinancialRows(sections.cash_flow),
    wacc: hasMeaningfulValue(sections.wacc),
    industry: hasMeaningfulValue(sections.industry),
    beta: hasMeaningfulValue(sections.beta),
    news: hasRows(sections.news),
    officers: hasRows(sections.officers),
    compare: false,
  };

  capabilities.compare = [
    capabilities.fundamentals,
    capabilities.profitability,
    capabilities.margins,
    capabilities.growth,
    capabilities.beta,
  ].filter(Boolean).length >= 2;

  return capabilities;
}
