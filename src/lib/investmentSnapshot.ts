import { transformIndustryWithStockValues, transformSection } from "@/lib/investmentTransforms";
import { buildInvestmentFreshness, getPriceAsOf } from "@/lib/investmentFreshness";
import { buildInvestmentCapabilities } from "@/lib/investmentCapabilities";
import { isStrictIsoCalendarDate } from "@/lib/investmentsPriceHealth";
import type {
  InvestmentSection,
  InvestmentSnapshot,
  NewsData,
  OfficerInfo,
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

  const dedupedRows = new Map<string, StockPrice>();

  raw
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
        !isStrictIsoCalendarDate(date) ||
        [open, high, low, close, volume].some((value) => !Number.isFinite(value)) ||
        open <= 0 ||
        high <= 0 ||
        low <= 0 ||
        close <= 0 ||
        volume < 0 ||
        low > Math.min(open, close) ||
        high < Math.max(open, close) ||
        high < low
      ) {
        return null;
      }

      return {
        date: date.slice(0, 10),
        open,
        high,
        low,
        close,
        volume,
      } satisfies StockPrice;
    })
    .filter(Boolean)
    .forEach((row) => {
      dedupedRows.set((row as StockPrice).date, row as StockPrice);
    });

  const rows = [...dedupedRows.values()].sort((a, b) => a.date.localeCompare(b.date));

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

function normalizeOfficers(raw: unknown): OfficerInfo[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const officers: OfficerInfo[] = [];
  for (const entry of raw) {
    const r = entry as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.replace(/\s{2,}/g, " ").trim() : undefined;
    const title = typeof r.title === "string" ? r.title : undefined;
    if (!name || !title) continue;
    officers.push({
      name,
      title,
      age: typeof r.age === "number" ? r.age : undefined,
      yearBorn: typeof r.born === "number" ? r.born : (typeof r.yearBorn === "number" ? r.yearBorn : undefined),
      totalPay: typeof r.pay === "number" && r.pay > 0 ? r.pay : (typeof r.totalPay === "number" ? r.totalPay : undefined),
    });
  }
  return officers.length > 0 ? officers : undefined;
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
  officers?: unknown;
}

export function buildInvestmentSnapshot(
  symbol: string,
  lastUpdated: string | null,
  raw: RawInvestmentSnapshotInputs
): InvestmentSnapshot {
  const normalizedPrice = normalizeSection("price", raw.price);
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
    price: normalizedPrice,
    news: normalizeSection("news", raw.news),
    officers: normalizeOfficers(raw.officers),
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

  const capabilities = buildInvestmentCapabilities(sections);
  const freshness = buildInvestmentFreshness({
    snapshotBuiltAt: lastUpdated,
    sections: {
      price: getPriceAsOf(normalizedPrice),
    },
  });

  return {
    symbol,
    lastUpdated,
    freshness,
    source: "prefetched",
    capabilities,
    sections,
  };
}
