// ============================================================
// Portfolio (localStorage)
// ============================================================

export interface PortfolioHolding {
  symbol: string;
  shares: number;
  averageCost: number;
  purchaseDate?: string;
  notes?: string;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  volume: number;
  marketCap: number;
  name: string;
  error?: string;
}

export interface EnhancedHolding extends PortfolioHolding {
  currentPrice: number;
  currentValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  allocationPercent: number | null;
  name: string;
  isLoading: boolean;
  error?: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

// ============================================================
// defeatbeta-api pre-built data
// ============================================================

export interface Fundamentals {
  ttmEps?: number;
  ttmPe?: number;
  psRatio?: number;
  pbRatio?: number;
  pegRatio?: number;
  marketCap?: number;
  reportDate?: string;
  error?: string;
}

export interface Profitability {
  roe?: number;
  roa?: number;
  roic?: number;
  equityMultiplier?: number;
  assetTurnover?: number;
  reportDate?: string;
  error?: string;
}

export interface Margin {
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  ebitdaMargin?: number;
  fcfMargin?: number;
  totalRevenue?: number;
  reportDate?: string;
  error?: string;
}

/** Raw margins data is an array of period records */
export type MarginsData = Margin[] | { error: string };

export interface GrowthMetric {
  metric: string;
  value?: number;
  prevYearValue?: number;
  yoyGrowth?: number;
  reportDate?: string;
}

/** Growth data is an array of growth records (or error) */
export type GrowthData = GrowthMetric[] | Record<string, unknown> | { error: string };

export interface FinancialStatementRow {
  [column: string]: number | string | null;
}

export interface FinancialStatement {
  columns: string[];
  rows: FinancialStatementRow[];
  error?: string;
}

export interface WaccData {
  wacc?: number;
  costOfEquity?: number;
  costOfDebt?: number;
  taxRate?: number;
  beta?: number;
  marketCap?: number;
  reportDate?: string;
  error?: string;
}

export interface IndustryMetric {
  industry?: string;
  metric?: string;
  value?: number;
  industryAvg?: number;
  reportDate?: string;
  [key: string]: unknown;
}

export type IndustryData = IndustryMetric[] | Record<string, unknown> | { error: string };

export interface NewsItem {
  uuid?: string;
  title: string;
  publisher?: string;
  reportDate?: string;
  type?: string;
  link?: string;
  [key: string]: unknown;
}

export type NewsData = NewsItem[] | { error: string };

export interface DcfData {
  fairValue?: number;
  currentPrice?: number;
  upside?: number;
  wacc?: number;
  growthEstimates?: Record<string, number>;
  recommendation?: "Buy" | "Sell" | "Hold" | string;
  error?: string;
}

export interface CompanyInfo {
  address?: string;
  city?: string;
  country?: string;
  industry?: string;
  sector?: string;
  longBusinessSummary?: string;
  fullTimeEmployees?: number;
  website?: string;
  shortName?: string;
  longName?: string;
  error?: string;
}

export interface StockPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type PriceData = StockPrice[] | { error: string };

export interface BetaData {
  beta5y?: number;
  beta3y?: number;
  beta1y?: number;
  error?: string;
}

export interface OfficerInfo {
  name?: string;
  title?: string;
  age?: number;
  yearBorn?: number;
  totalPay?: number;
  [key: string]: unknown;
}

export type OfficersData = OfficerInfo[] | { error: string };

export interface RevenueSegment {
  segment?: string;
  geography?: string;
  product?: string;
  value?: number;
  reportDate?: string;
  [key: string]: unknown;
}

export type RevenueSegmentsData = RevenueSegment[] | Record<string, unknown> | { error: string };

// ============================================================
// Investments Index
// ============================================================

export interface InvestmentsIndex {
  symbols: string[];
  failed: string[];
  lastUpdated: string;
}

// ============================================================
// Utility
// ============================================================

export type InvestmentSection =
  | "price"
  | "fundamentals"
  | "profitability"
  | "margins"
  | "growth"
  | "income_statement"
  | "balance_sheet"
  | "cash_flow"
  | "wacc"
  | "industry"
  | "revenue_segments"
  | "beta"
  | "news"
  | "dcf"
  | "info"
  | "officers";

export type InvestmentDataSource = "prefetched" | "on-demand";

export type InvestmentCapabilityKey = InvestmentSection | "compare";

export type InvestmentCapabilities = Partial<
  Record<InvestmentCapabilityKey, boolean>
>;

export interface InvestmentDataEnvelope<T> {
  data: T;
  source: InvestmentDataSource;
  capabilities: InvestmentCapabilities;
  lastUpdated: string | null;
}
