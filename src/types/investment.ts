/**
 * Investment Tracking Type Definitions
 */

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
