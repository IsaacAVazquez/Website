/**
 * Investment Tracking Type Definitions
 */

export interface AnalystBreakdown {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  total: number;
}

export interface AnalystRating {
  recommendationMean: number; // 1 = Strong Buy, 5 = Strong Sell
  recommendationKey: string;  // "strong_buy" | "buy" | "hold" | "sell" | "strong_sell"
  targetHighPrice: number | null;
  targetLowPrice: number | null;
  targetMeanPrice: number | null;
  targetMedianPrice: number | null;
  numberOfAnalysts: number | null;
  breakdown: AnalystBreakdown;
}

export interface StockDetail {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  description: string;
  website: string;
  employees: number | null;

  // Price
  price: number;
  change: number;
  changePercent: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  volume: number;

  // 52-week
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekChange: number | null;
  fiftyDayAverage: number | null;
  twoHundredDayAverage: number | null;

  // Valuation
  marketCap: number;
  enterpriseValue: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  bookValue: number | null;

  // Profitability
  profitMargins: number | null;
  operatingMargins: number | null;
  grossMargins: number | null;
  returnOnAssets: number | null;
  returnOnEquity: number | null;

  // Growth
  revenueGrowth: number | null;
  earningsGrowth: number | null;

  // Balance sheet
  totalRevenue: number | null;
  totalCash: number | null;
  totalDebt: number | null;

  // Dividends
  dividendYield: number | null;
  dividendRate: number | null;
  payoutRatio: number | null;

  // Risk
  beta: number | null;
  averageVolume: number | null;

  // Analyst
  analyst: AnalystRating;

  error?: string;
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

export interface PortfolioHolding {
  symbol: string;
  shares: number;
  averageCost: number;
  purchaseDate?: string;
  notes?: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface EnhancedHolding extends PortfolioHolding {
  currentPrice: number;
  currentValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
}
