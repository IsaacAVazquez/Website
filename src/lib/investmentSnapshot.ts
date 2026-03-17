import { computeDcf, transformIndustryWithStockValues, transformSection } from "@/lib/investmentTransforms";
import type {
  DcfData,
  InvestmentCapabilities,
  InvestmentSection,
  InvestmentSnapshot,
  NewsData,
  PriceData,
  StockPrice,
} from "@/types/investment";

type JsonRecord = Record<string, unknown>;

const SNAPSHOT_PRICE_LIMIT = 252;
const SNAPSHOT_NEWS_LIMIT = 10;

function hasErrorShape(value: unknown): boolean {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "error" in (value as Record<string, unknown>)
  );
}

function hasRows(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function normalizePriceRows(raw: unknown): PriceData | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }

  const rows = raw
    .map((entry) => {
      const record = entry as JsonRecord;
      const date = typeof record.report_date === "string"
        ? record.report_date
        : typeof record.date === "string"
          ? record.date
          : null;
      const open = Number(record.open);
      const high = Number(record.high);
      const low = Number(record.low);
      const close = Number(record.close);
      const volume = Number(record.volume);

      if (
        !date ||
        [open, high, low, close, volume].some((value) => Number.isNaN(value))
      ) {
        return null;
      }

      return {
        date,
        open,
        high,
        low,
        close,
        volume,
      } satisfies StockPrice;
    })
    .filter(Boolean) as StockPrice[];

  if (rows.length === 0) {
    return undefined;
  }

  return rows.slice(-SNAPSHOT_PRICE_LIMIT);
}

function normalizeNews(raw: unknown): NewsData | undefined {
  const transformed = transformSection("news", raw);
  if (!Array.isArray(transformed)) {
    return hasErrorShape(transformed) ? undefined : (transformed as NewsData);
  }

  const news = transformed
    .filter((item) => {
      const record = item as JsonRecord;
      return typeof record.title === "string" && record.title.trim().length > 0;
    })
    .slice(0, SNAPSHOT_NEWS_LIMIT);

  return news.length > 0 ? (news as NewsData) : undefined;
}

function normalizeSection(
  section: InvestmentSection,
  raw: unknown
): unknown {
  if (raw === undefined || raw === null || hasErrorShape(raw)) {
    return undefined;
  }

  if (section === "price") {
    return normalizePriceRows(raw);
  }

  if (section === "news") {
    return normalizeNews(raw);
  }

  const transformed = transformSection(section, raw);
  return hasErrorShape(transformed) ? undefined : transformed;
}

function buildCapabilities(
  sections: Partial<Record<InvestmentSection, unknown>>
): InvestmentCapabilities {
  const capabilities: InvestmentCapabilities = {
    price: hasRows(sections.price),
    info: sections.info !== undefined,
    fundamentals: sections.fundamentals !== undefined,
    profitability: sections.profitability !== undefined,
    margins: hasRows(sections.margins),
    growth: hasRows(sections.growth),
    income_statement:
      !!sections.income_statement &&
      typeof sections.income_statement === "object" &&
      (((sections.income_statement as JsonRecord).quarterly as unknown[] | undefined)?.length ?? 0) +
        (((sections.income_statement as JsonRecord).annual as unknown[] | undefined)?.length ?? 0) >
        0,
    balance_sheet:
      !!sections.balance_sheet &&
      typeof sections.balance_sheet === "object" &&
      (((sections.balance_sheet as JsonRecord).quarterly as unknown[] | undefined)?.length ?? 0) +
        (((sections.balance_sheet as JsonRecord).annual as unknown[] | undefined)?.length ?? 0) >
        0,
    cash_flow:
      !!sections.cash_flow &&
      typeof sections.cash_flow === "object" &&
      (((sections.cash_flow as JsonRecord).quarterly as unknown[] | undefined)?.length ?? 0) +
        (((sections.cash_flow as JsonRecord).annual as unknown[] | undefined)?.length ?? 0) >
        0,
    wacc: sections.wacc !== undefined,
    industry: hasRows(sections.industry),
    beta: sections.beta !== undefined,
    news: hasRows(sections.news),
    dcf: sections.dcf !== undefined,
    compare: true,
  };

  return capabilities;
}

export interface RawInvestmentSnapshotInputs {
  info?: unknown;
  fundamentals?: unknown;
  profitability?: unknown;
  margins?: unknown;
  growth?: unknown;
  income_statement?: unknown;
  balance_sheet?: unknown;
  cash_flow?: unknown;
  wacc?: unknown;
  industry?: unknown;
  beta?: unknown;
  news?: unknown;
  price?: unknown;
}

export function buildInvestmentSnapshot(
  symbol: string,
  lastUpdated: string | null,
  raw: RawInvestmentSnapshotInputs
): InvestmentSnapshot {
  const sections: Partial<Record<InvestmentSection, unknown>> = {
    info: normalizeSection("info", raw.info),
    fundamentals: normalizeSection("fundamentals", raw.fundamentals),
    profitability: normalizeSection("profitability", raw.profitability),
    margins: normalizeSection("margins", raw.margins),
    growth: normalizeSection("growth", raw.growth),
    income_statement: normalizeSection("income_statement", raw.income_statement),
    balance_sheet: normalizeSection("balance_sheet", raw.balance_sheet),
    cash_flow: normalizeSection("cash_flow", raw.cash_flow),
    wacc: normalizeSection("wacc", raw.wacc),
    beta: normalizeSection("beta", raw.beta),
    price: normalizeSection("price", raw.price),
    news: normalizeSection("news", raw.news),
  };

  const industry = raw.industry
    ? transformIndustryWithStockValues(
        raw.industry,
        raw.fundamentals,
        raw.profitability,
        raw.margins
      )
    : undefined;

  sections.industry = hasErrorShape(industry) || !hasRows(industry)
    ? undefined
    : industry;

  const dcf = raw.wacc && raw.fundamentals && raw.growth && raw.price
    ? computeDcf(raw.wacc, raw.fundamentals, raw.growth, raw.price)
    : undefined;
  sections.dcf = dcf && !hasErrorShape(dcf) ? (dcf as DcfData) : undefined;

  const capabilities = buildCapabilities(sections);

  return {
    symbol,
    lastUpdated,
    source: "prefetched",
    capabilities,
    sections,
  };
}
