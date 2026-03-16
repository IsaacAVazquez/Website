import { promises as fs } from "fs";
import path from "path";
import { computeDcf, transformIndustryWithStockValues, transformSection } from "@/lib/investmentTransforms";
import { yahooFetch } from "@/lib/yahooFinance";
import type {
  BetaData,
  CompanyInfo,
  DcfData,
  Fundamentals,
  GrowthData,
  GrowthMetric,
  InvestmentCapabilities,
  InvestmentDataEnvelope,
  InvestmentDataSource,
  InvestmentSection,
  InvestmentsIndex,
  MarginsData,
  PriceData,
  Profitability,
  WaccData,
} from "@/types/investment";

type JsonRecord = Record<string, unknown>;

interface InvestmentContext {
  source: InvestmentDataSource;
  capabilities: InvestmentCapabilities;
  lastUpdated: string | null;
  seeded: boolean;
  snapshot?: OnDemandSnapshot;
}

interface OnDemandSnapshot {
  fetchedAt: string;
  capabilities: InvestmentCapabilities;
  sections: Partial<Record<InvestmentSection, unknown>>;
}

interface ChartPriceRow {
  symbol: string;
  report_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const DATA_DIR = path.join(process.cwd(), "public", "data", "investments");
const INDEX_TTL_MS = 5 * 60 * 1000;
const ON_DEMAND_TTL_MS = 5 * 60 * 1000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const PREFETCHED_CAPABILITIES: InvestmentCapabilities = {
  price: true,
  fundamentals: true,
  profitability: true,
  margins: true,
  growth: true,
  income_statement: true,
  balance_sheet: true,
  cash_flow: true,
  wacc: true,
  industry: true,
  revenue_segments: true,
  beta: true,
  transcripts: true,
  news: true,
  dcf: true,
  info: true,
  officers: true,
  compare: true,
};

let indexCache:
  | {
      data: InvestmentsIndex;
      expiresAt: number;
    }
  | null = null;

const onDemandCache = new Map<
  string,
  {
    snapshot: OnDemandSnapshot;
    expiresAt: number;
  }
>();

const INCOME_STATEMENT_METRICS = [
  ["totalRevenue", "Total Revenue"],
  ["grossProfit", "Gross Profit"],
  ["operatingIncome", "Operating Income"],
  ["ebit", "EBIT"],
  ["netIncome", "Net Income"],
  ["researchDevelopment", "R&D"],
  ["sellingGeneralAdministrative", "SG&A"],
] as const;

const BALANCE_SHEET_METRICS = [
  ["cash", "Cash"],
  ["shortTermInvestments", "Short-Term Investments"],
  ["netReceivables", "Net Receivables"],
  ["inventory", "Inventory"],
  ["totalCurrentAssets", "Total Current Assets"],
  ["totalAssets", "Total Assets"],
  ["totalCurrentLiabilities", "Total Current Liabilities"],
  ["longTermDebt", "Long-Term Debt"],
  ["totalLiab", "Total Liabilities"],
  ["totalStockholderEquity", "Stockholder Equity"],
] as const;

const CASH_FLOW_METRICS = [
  ["totalCashFromOperatingActivities", "Operating Cash Flow"],
  ["capitalExpenditures", "Capital Expenditures"],
  ["depreciation", "Depreciation"],
  ["investments", "Investments"],
  ["dividendsPaid", "Dividends Paid"],
  ["netBorrowings", "Net Borrowings"],
] as const;

function getFromRaw(entry: unknown): unknown {
  if (entry && typeof entry === "object") {
    const record = entry as JsonRecord;
    if (record.raw !== undefined) {
      return record.raw;
    }
    if (record.fmt !== undefined) {
      return record.fmt;
    }
  }
  return entry;
}

function getNumber(entry: unknown): number | undefined {
  const raw = getFromRaw(entry);
  if (raw === null || raw === undefined || raw === "") {
    return undefined;
  }
  const value = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function getString(entry: unknown): string | undefined {
  const raw = getFromRaw(entry);
  if (raw === null || raw === undefined) {
    return undefined;
  }
  return String(raw);
}

function getDateKey(entry: unknown): string | undefined {
  const raw = getFromRaw(entry);
  if (typeof raw === "number") {
    return new Date(raw * 1000).toISOString().split("T")[0];
  }
  if (typeof raw === "string") {
    return raw.includes("T") ? raw.split("T")[0] : raw;
  }
  return undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function percentFromRatio(value: number | undefined): number | undefined {
  return value === undefined ? undefined : value * 100;
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function loadInvestmentsIndex(): Promise<InvestmentsIndex> {
  if (indexCache && indexCache.expiresAt > Date.now()) {
    return indexCache.data;
  }

  const data = await readJsonFile<InvestmentsIndex>(path.join(DATA_DIR, "index.json"));
  const safeData: InvestmentsIndex = data ?? {
    symbols: [],
    failed: [],
    lastUpdated: "",
  };

  indexCache = {
    data: safeData,
    expiresAt: Date.now() + INDEX_TTL_MS,
  };

  return safeData;
}

export async function getInvestmentsIndex(): Promise<InvestmentsIndex> {
  return loadInvestmentsIndex();
}

async function readPrefetchedSection(
  symbol: string,
  section: InvestmentSection | string
): Promise<unknown | null> {
  const symbolDir = path.join(DATA_DIR, symbol);

  if (section === "dcf") {
    const [waccRaw, fundRaw, growthRaw, priceRaw] = await Promise.all([
      readJsonFile(path.join(symbolDir, "wacc.json")),
      readJsonFile(path.join(symbolDir, "fundamentals.json")),
      readJsonFile(path.join(symbolDir, "growth.json")),
      readJsonFile(path.join(symbolDir, "price.json")),
    ]);
    if (!waccRaw || !fundRaw || !growthRaw || !priceRaw) {
      return null;
    }
    return computeDcf(waccRaw, fundRaw, growthRaw, priceRaw);
  }

  if (section === "industry") {
    const [industryRaw, fundRaw, profRaw, marginsRaw] = await Promise.all([
      readJsonFile(path.join(symbolDir, "industry.json")),
      readJsonFile(path.join(symbolDir, "fundamentals.json")),
      readJsonFile(path.join(symbolDir, "profitability.json")),
      readJsonFile(path.join(symbolDir, "margins.json")),
    ]);
    if (!industryRaw) {
      return null;
    }
    return transformIndustryWithStockValues(industryRaw, fundRaw, profRaw, marginsRaw);
  }

  const fileName = `${section}.json`;
  const raw = await readJsonFile(path.join(symbolDir, fileName));
  if (!raw) {
    return null;
  }

  return transformSection(section, raw);
}

async function fetchChartHistory(symbol: string): Promise<PriceData> {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y&includePrePost=false&events=div%2Csplits`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        Referer: "https://finance.yahoo.com/",
        Origin: "https://finance.yahoo.com",
        "Accept-Language": "en-US,en;q=0.5",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw Object.assign(new Error(`Yahoo chart unavailable for ${symbol}`), {
      status: response.status,
    });
  }

  const payload = (await response.json()) as JsonRecord;
  const result = ((payload.chart as JsonRecord | undefined)?.result as JsonRecord[] | undefined)?.[0];
  const timestamps = (result?.timestamp as number[] | undefined) ?? [];
  const quote = (((result?.indicators as JsonRecord | undefined)?.quote as JsonRecord[] | undefined) ?? [])[0] as
    | JsonRecord
    | undefined;

  if (!quote || timestamps.length === 0) {
    throw Object.assign(new Error(`No price history available for ${symbol}`), {
      status: 404,
    });
  }

  const opens = (quote.open as Array<number | null>) ?? [];
  const highs = (quote.high as Array<number | null>) ?? [];
  const lows = (quote.low as Array<number | null>) ?? [];
  const closes = (quote.close as Array<number | null>) ?? [];
  const volumes = (quote.volume as Array<number | null>) ?? [];

  const rows = timestamps
    .map((timestamp, index) => {
      const open = opens[index];
      const high = highs[index];
      const low = lows[index];
      const close = closes[index];
      const volume = volumes[index];
      if (
        open === null ||
        high === null ||
        low === null ||
        close === null ||
        volume === null
      ) {
        return null;
      }
      return {
        symbol,
        report_date: new Date(timestamp * 1000).toISOString().split("T")[0],
        open,
        high,
        low,
        close,
        volume,
      };
    })
    .filter(Boolean) as ChartPriceRow[];

  return rows as unknown as PriceData;
}

async function fetchQuoteSummary(symbol: string): Promise<JsonRecord> {
  const modules = [
    "price",
    "summaryDetail",
    "defaultKeyStatistics",
    "financialData",
    "assetProfile",
    "earnings",
    "incomeStatementHistory",
    "incomeStatementHistoryQuarterly",
    "balanceSheetHistory",
    "balanceSheetHistoryQuarterly",
    "cashflowStatementHistory",
    "cashflowStatementHistoryQuarterly",
  ];

  const response = await yahooFetch(
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${modules.join(",")}`
  );

  if (!response.ok) {
    throw Object.assign(new Error(`Yahoo research data unavailable for ${symbol}`), {
      status: response.status,
    });
  }

  const payload = (await response.json()) as JsonRecord;
  const result = ((payload.quoteSummary as JsonRecord | undefined)?.result as JsonRecord[] | undefined)?.[0];
  if (!result) {
    throw Object.assign(new Error(`No research data available for ${symbol}`), {
      status: 404,
    });
  }

  return result;
}

function getStatementEntries(
  module: JsonRecord | undefined,
  key: string
): JsonRecord[] {
  const entries = module?.[key];
  return Array.isArray(entries) ? (entries as JsonRecord[]) : [];
}

function buildStatementTable(
  statements: JsonRecord[],
  metrics: readonly (readonly [string, string])[]
): JsonRecord[] {
  const sliced = statements.slice(0, 8);
  return metrics
    .map(([field, label]) => {
      const row: JsonRecord = { Breakdown: label };
      for (const statement of sliced) {
        const period = getDateKey(statement.endDate);
        const value = getNumber(statement[field]);
        if (!period || value === undefined) {
          continue;
        }
        row[period] = value;
      }
      return row;
    })
    .filter((row) => Object.keys(row).length > 1);
}

function computeStatementGrowth(
  statements: JsonRecord[],
  field: string
): number | undefined {
  if (statements.length < 4) {
    return undefined;
  }

  const latest = getNumber(statements[0]?.[field]);
  const prior = getNumber(statements[3]?.[field]);
  if (latest === undefined || prior === undefined || prior === 0) {
    return undefined;
  }

  return ((latest - prior) / Math.abs(prior)) * 100;
}

function computeEpsGrowth(earnings: JsonRecord | undefined): number | undefined {
  const quarterly = (earnings?.earningsChart as JsonRecord | undefined)?.quarterly;
  if (!Array.isArray(quarterly) || quarterly.length < 4) {
    return undefined;
  }

  const latest = getNumber((quarterly[0] as JsonRecord).actual);
  const prior = getNumber((quarterly[3] as JsonRecord).actual);
  if (latest === undefined || prior === undefined || prior === 0) {
    return undefined;
  }

  return ((latest - prior) / Math.abs(prior)) * 100;
}

function deriveTaxRate(annualIncomeStatements: JsonRecord[]): number {
  const latestAnnual = annualIncomeStatements[0];
  const taxExpense =
    getNumber(latestAnnual?.incomeTaxExpense) ?? getNumber(latestAnnual?.taxProvision);
  const pretaxIncome =
    getNumber(latestAnnual?.incomeBeforeTax) ?? getNumber(latestAnnual?.pretaxIncome);

  if (taxExpense !== undefined && pretaxIncome && pretaxIncome !== 0) {
    return clamp(Math.abs(taxExpense / pretaxIncome), 0.05, 0.35);
  }

  return 0.21;
}

function deriveCostOfDebt(
  totalDebt: number | undefined,
  annualIncomeStatements: JsonRecord[]
): number {
  const latestAnnual = annualIncomeStatements[0];
  const interestExpense = getNumber(latestAnnual?.interestExpense);
  if (interestExpense !== undefined && totalDebt && totalDebt > 0) {
    return clamp(Math.abs(interestExpense) / totalDebt, 0.02, 0.12);
  }

  return 0.045;
}

function buildGrowthData(
  financialData: JsonRecord | undefined,
  quarterlyIncomeStatements: JsonRecord[],
  quarterlyCashFlowStatements: JsonRecord[],
  earnings: JsonRecord | undefined
): GrowthData {
  const metrics: GrowthMetric[] = [];

  const revenueGrowth =
    computeStatementGrowth(quarterlyIncomeStatements, "totalRevenue") ??
    percentFromRatio(getNumber(financialData?.revenueGrowth));
  const operatingIncomeGrowth = computeStatementGrowth(
    quarterlyIncomeStatements,
    "operatingIncome"
  );
  const netIncomeGrowth = computeStatementGrowth(quarterlyIncomeStatements, "netIncome");
  const epsGrowth =
    computeEpsGrowth(earnings) ??
    percentFromRatio(getNumber(financialData?.earningsGrowth));

  const latestOperatingCashFlow = getNumber(
    quarterlyCashFlowStatements[0]?.totalCashFromOperatingActivities
  );
  const latestCapex = getNumber(quarterlyCashFlowStatements[0]?.capitalExpenditures);
  const priorOperatingCashFlow = getNumber(
    quarterlyCashFlowStatements[3]?.totalCashFromOperatingActivities
  );
  const priorCapex = getNumber(quarterlyCashFlowStatements[3]?.capitalExpenditures);

  let freeCashFlowGrowth: number | undefined;
  if (
    latestOperatingCashFlow !== undefined &&
    latestCapex !== undefined &&
    priorOperatingCashFlow !== undefined &&
    priorCapex !== undefined
  ) {
    const latestFreeCashFlow = latestOperatingCashFlow + latestCapex;
    const priorFreeCashFlow = priorOperatingCashFlow + priorCapex;
    if (priorFreeCashFlow !== 0) {
      freeCashFlowGrowth =
        ((latestFreeCashFlow - priorFreeCashFlow) / Math.abs(priorFreeCashFlow)) * 100;
    }
  }

  const candidates: Array<[string, number | undefined]> = [
    ["Revenue YoY", revenueGrowth],
    ["Operating Income YoY", operatingIncomeGrowth],
    ["Net Income YoY", netIncomeGrowth],
    ["FCF YoY", freeCashFlowGrowth],
    ["EPS YoY", epsGrowth],
  ];

  for (const [metric, yoyGrowth] of candidates) {
    if (yoyGrowth === undefined || Number.isNaN(yoyGrowth)) {
      continue;
    }
    metrics.push({ metric, yoyGrowth });
  }

  return metrics;
}

function buildWaccData(
  beta: number | undefined,
  marketCap: number | undefined,
  totalDebt: number | undefined,
  annualIncomeStatements: JsonRecord[]
): WaccData | null {
  if (!marketCap) {
    return null;
  }

  const effectiveBeta = clamp(beta ?? 1, 0.5, 2.5);
  const riskFreeRate = 0.0425;
  const equityRiskPremium = 0.055;
  const costOfEquity = riskFreeRate + effectiveBeta * equityRiskPremium;
  const taxRate = deriveTaxRate(annualIncomeStatements);
  const costOfDebt = deriveCostOfDebt(totalDebt, annualIncomeStatements);
  const debtValue = totalDebt ?? 0;
  const enterpriseValue = marketCap + debtValue;
  const wacc =
    enterpriseValue > 0
      ? (marketCap / enterpriseValue) * costOfEquity +
        (debtValue / enterpriseValue) * costOfDebt * (1 - taxRate)
      : costOfEquity;

  return {
    wacc: wacc * 100,
    costOfEquity: costOfEquity * 100,
    costOfDebt: costOfDebt * 100,
    taxRate: taxRate * 100,
    beta: effectiveBeta,
    marketCap,
  };
}

function buildDcfData(
  currentPrice: number | undefined,
  fundamentals: Fundamentals,
  growth: GrowthData,
  wacc: WaccData | null
): DcfData | null {
  const baseEarnings = fundamentals.ttmEps;
  const waccFraction = wacc?.wacc !== undefined ? wacc.wacc / 100 : undefined;
  if (!currentPrice || !baseEarnings || !waccFraction) {
    return null;
  }

  const growthItems = Array.isArray(growth) ? growth : [];
  const epsGrowth =
    growthItems.find((item) => item.metric === "EPS YoY")?.yoyGrowth ??
    growthItems.find((item) => item.metric === "Revenue YoY")?.yoyGrowth;
  const shortTermGrowth = clamp((epsGrowth ?? 8) / 100, -0.1, 0.22);
  const terminalGrowth = 0.03;
  const effectiveWacc = Math.max(waccFraction, terminalGrowth + 0.01);

  let projected = baseEarnings;
  let presentValue = 0;
  for (let year = 1; year <= 5; year++) {
    const growthRate =
      shortTermGrowth + ((terminalGrowth - shortTermGrowth) * year) / 5;
    projected = projected * (1 + growthRate);
    presentValue += projected / Math.pow(1 + effectiveWacc, year);
  }

  const terminalValue =
    (projected * (1 + terminalGrowth)) / (effectiveWacc - terminalGrowth);
  const fairValue = presentValue + terminalValue / Math.pow(1 + effectiveWacc, 5);
  const upside = ((fairValue - currentPrice) / currentPrice) * 100;

  return {
    fairValue: Math.round(fairValue * 100) / 100,
    currentPrice,
    upside: Math.round(upside * 100) / 100,
    wacc: Math.round((effectiveWacc * 100) * 100) / 100,
    growthEstimates: {
      short_term: Math.round(shortTermGrowth * 10000) / 100,
      terminal: Math.round(terminalGrowth * 10000) / 100,
    },
    recommendation: upside > 15 ? "Buy" : upside < -10 ? "Sell" : "Hold",
  };
}

async function buildOnDemandSnapshot(symbol: string): Promise<OnDemandSnapshot> {
  const cached = onDemandCache.get(symbol);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.snapshot;
  }

  const [summary, rawPriceHistory] = await Promise.all([
    fetchQuoteSummary(symbol),
    fetchChartHistory(symbol),
  ]);
  const priceHistory = rawPriceHistory as unknown as ChartPriceRow[];

  const price = (summary.price as JsonRecord | undefined) ?? {};
  const summaryDetail = (summary.summaryDetail as JsonRecord | undefined) ?? {};
  const financialData = (summary.financialData as JsonRecord | undefined) ?? {};
  const defaultKeyStatistics =
    (summary.defaultKeyStatistics as JsonRecord | undefined) ?? {};
  const assetProfile = (summary.assetProfile as JsonRecord | undefined) ?? {};
  const earnings = (summary.earnings as JsonRecord | undefined) ?? {};
  const quarterlyIncomeStatements = getStatementEntries(
    summary.incomeStatementHistoryQuarterly as JsonRecord | undefined,
    "incomeStatementHistory"
  );
  const annualIncomeStatements = getStatementEntries(
    summary.incomeStatementHistory as JsonRecord | undefined,
    "incomeStatementHistory"
  );
  const quarterlyBalanceSheets = getStatementEntries(
    summary.balanceSheetHistoryQuarterly as JsonRecord | undefined,
    "balanceSheetStatements"
  );
  const annualBalanceSheets = getStatementEntries(
    summary.balanceSheetHistory as JsonRecord | undefined,
    "balanceSheetStatements"
  );
  const quarterlyCashFlows = getStatementEntries(
    summary.cashflowStatementHistoryQuarterly as JsonRecord | undefined,
    "cashflowStatements"
  );
  const annualCashFlows = getStatementEntries(
    summary.cashflowStatementHistory as JsonRecord | undefined,
    "cashflowStatements"
  );

  const currentPrice =
    getNumber(price.regularMarketPrice) ??
    getNumber(summaryDetail.regularMarketPrice) ??
    priceHistory.at(-1)?.close;
  const marketCap =
    getNumber(price.marketCap) ?? getNumber(defaultKeyStatistics.marketCap);
  const betaValue = getNumber(defaultKeyStatistics.beta);
  const totalRevenue =
    getNumber(financialData.totalRevenue) ??
    getNumber(quarterlyIncomeStatements[0]?.totalRevenue);
  const freeCashFlow = getNumber(financialData.freeCashflow);

  const info: CompanyInfo = {
    address: getString(assetProfile.address1),
    city: getString(assetProfile.city),
    country: getString(assetProfile.country),
    industry: getString(assetProfile.industry),
    sector: getString(assetProfile.sector),
    longBusinessSummary: getString(assetProfile.longBusinessSummary),
    fullTimeEmployees: getNumber(assetProfile.fullTimeEmployees),
    website: getString(assetProfile.website),
    shortName: getString(price.shortName) ?? symbol,
    longName: getString(price.longName) ?? getString(price.shortName) ?? symbol,
  };

  const fundamentals: Fundamentals = {
    ttmEps:
      getNumber(defaultKeyStatistics.trailingEps) ??
      getNumber(defaultKeyStatistics.epsTrailingTwelveMonths),
    ttmPe:
      getNumber(summaryDetail.trailingPE) ??
      getNumber(defaultKeyStatistics.trailingPE),
    marketCap,
    psRatio: getNumber(defaultKeyStatistics.priceToSalesTrailing12Months),
    pbRatio: getNumber(defaultKeyStatistics.priceToBook),
    pegRatio: getNumber(defaultKeyStatistics.pegRatio),
  };

  const profitability: Profitability = {
    roe: percentFromRatio(getNumber(financialData.returnOnEquity)),
    roa: percentFromRatio(getNumber(financialData.returnOnAssets)),
    roic: percentFromRatio(getNumber(financialData.returnOnCapital)),
  };

  const margins: MarginsData = [
    {
      grossMargin: percentFromRatio(getNumber(financialData.grossMargins)),
      operatingMargin: percentFromRatio(getNumber(financialData.operatingMargins)),
      netMargin: percentFromRatio(getNumber(financialData.profitMargins)),
      ebitdaMargin: percentFromRatio(getNumber(financialData.ebitdaMargins)),
      fcfMargin:
        freeCashFlow !== undefined && totalRevenue
          ? (freeCashFlow / totalRevenue) * 100
          : undefined,
    },
  ];

  const growth = buildGrowthData(
    financialData,
    quarterlyIncomeStatements,
    quarterlyCashFlows,
    earnings
  );

  const incomeStatement = {
    quarterly: buildStatementTable(quarterlyIncomeStatements, INCOME_STATEMENT_METRICS),
    annual: buildStatementTable(annualIncomeStatements, INCOME_STATEMENT_METRICS),
  };
  const balanceSheet = {
    quarterly: buildStatementTable(quarterlyBalanceSheets, BALANCE_SHEET_METRICS),
    annual: buildStatementTable(annualBalanceSheets, BALANCE_SHEET_METRICS),
  };
  const cashFlow = {
    quarterly: buildStatementTable(quarterlyCashFlows, CASH_FLOW_METRICS),
    annual: buildStatementTable(annualCashFlows, CASH_FLOW_METRICS),
  };

  const beta: BetaData = {
    beta5y: betaValue,
  };

  const wacc = buildWaccData(
    betaValue,
    marketCap,
    getNumber(financialData.totalDebt),
    annualIncomeStatements
  );
  const dcf = buildDcfData(currentPrice, fundamentals, growth, wacc);

  const capabilities: InvestmentCapabilities = {
    price: priceHistory.length > 0,
    fundamentals: true,
    profitability: true,
    margins: true,
    growth: Array.isArray(growth) && growth.length > 0,
    income_statement: incomeStatement.quarterly.length > 0 || incomeStatement.annual.length > 0,
    balance_sheet: balanceSheet.quarterly.length > 0 || balanceSheet.annual.length > 0,
    cash_flow: cashFlow.quarterly.length > 0 || cashFlow.annual.length > 0,
    wacc: !!wacc,
    beta: beta.beta5y !== undefined,
    dcf: !!dcf,
    info: true,
    industry: false,
    transcripts: false,
    news: false,
    compare: false,
  };

  const snapshot: OnDemandSnapshot = {
    fetchedAt: new Date().toISOString(),
    capabilities,
    sections: {
      price: priceHistory,
      fundamentals,
      profitability,
      margins,
      growth,
      income_statement: incomeStatement,
      balance_sheet: balanceSheet,
      cash_flow: cashFlow,
      beta,
      wacc: wacc ?? undefined,
      dcf: dcf ?? undefined,
      info,
    },
  };

  onDemandCache.set(symbol, {
    snapshot,
    expiresAt: Date.now() + ON_DEMAND_TTL_MS,
  });

  return snapshot;
}

export async function getInvestmentContext(symbol: string): Promise<InvestmentContext> {
  const index = await loadInvestmentsIndex();
  const seeded = index.symbols.includes(symbol);

  if (seeded) {
    return {
      source: "prefetched",
      capabilities: PREFETCHED_CAPABILITIES,
      lastUpdated: index.lastUpdated || null,
      seeded: true,
    };
  }

  const snapshot = await buildOnDemandSnapshot(symbol);
  return {
    source: "on-demand",
    capabilities: snapshot.capabilities,
    lastUpdated: snapshot.fetchedAt,
    seeded: false,
    snapshot,
  };
}

export async function getInvestmentDataEnvelope<T = unknown>(
  symbol: string,
  section: InvestmentSection | string,
  context?: InvestmentContext
): Promise<InvestmentDataEnvelope<T>> {
  const resolvedContext = context ?? (await getInvestmentContext(symbol));

  if (resolvedContext.seeded) {
    const data = await readPrefetchedSection(symbol, section);
    if (data === null) {
      throw Object.assign(
        new Error(`Section "${section}" not available for ${symbol}`),
        {
          status: 404,
          source: resolvedContext.source,
          capabilities: resolvedContext.capabilities,
          lastUpdated: resolvedContext.lastUpdated,
        }
      );
    }

    return {
      data: data as T,
      source: resolvedContext.source,
      capabilities: resolvedContext.capabilities,
      lastUpdated: resolvedContext.lastUpdated,
    };
  }

  const snapshot = resolvedContext.snapshot;
  const data = snapshot?.sections[section as InvestmentSection];
  if (data === undefined || data === null) {
    throw Object.assign(
      new Error(
        `Section "${section}" is available for curated research symbols only.`
      ),
      {
        status: 404,
        source: resolvedContext.source,
        capabilities: resolvedContext.capabilities,
        lastUpdated: resolvedContext.lastUpdated,
      }
    );
  }

  return {
    data: data as T,
    source: resolvedContext.source,
    capabilities: resolvedContext.capabilities,
    lastUpdated: resolvedContext.lastUpdated,
  };
}
