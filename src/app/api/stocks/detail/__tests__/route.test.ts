/**
 * @jest-environment node
 */

/**
 * Tests for GET /api/stocks/detail
 *
 * The route fetches comprehensive stock data including analyst ratings
 * from Yahoo Finance. We mock yahooFetch to avoid real network calls.
 */

import { GET } from '../route'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockYahooFetch = jest.fn()
jest.mock('@/lib/yahooFinance', () => ({
  yahooFetch: (...args: unknown[]) => mockYahooFetch(...args),
  isValidSymbol: (s: string) => /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/.test(s),
}))

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost'))
}

/** Simulate a successful chart response */
function chartResponse(price = 180, previousClose = 178) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      chart: {
        result: [
          {
            meta: {
              regularMarketPrice: price,
              previousClose,
              regularMarketOpen: 179,
              regularMarketDayHigh: 182,
              regularMarketDayLow: 177,
              regularMarketVolume: 60_000_000,
              fiftyTwoWeekHigh: 200,
              fiftyTwoWeekLow: 120,
              marketCap: 2_800_000_000_000,
            },
          },
        ],
      },
    }),
  }
}

/** Simulate a successful summary response with financial & analyst data */
function summaryResponse() {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      quoteSummary: {
        result: [
          {
            financialData: {
              targetHighPrice: { raw: 220 },
              targetLowPrice: { raw: 150 },
              targetMeanPrice: { raw: 195 },
              targetMedianPrice: { raw: 190 },
              numberOfAnalystOpinions: { raw: 40 },
              recommendationMean: { raw: 1.8 },
              recommendationKey: 'buy',
              profitMargins: { raw: 0.26 },
              operatingMargins: { raw: 0.30 },
              grossMargins: { raw: 0.46 },
              returnOnAssets: { raw: 0.22 },
              returnOnEquity: { raw: 1.47 },
              revenueGrowth: { raw: 0.05 },
              earningsGrowth: { raw: 0.11 },
              totalRevenue: { raw: 383_000_000_000 },
              totalCash: { raw: 62_000_000_000 },
              totalDebt: { raw: 111_000_000_000 },
            },
            recommendationTrend: {
              trend: [
                { strongBuy: 12, buy: 20, hold: 6, sell: 1, strongSell: 1 },
              ],
            },
            summaryDetail: {
              marketCap: { raw: 2_800_000_000_000 },
              trailingPE: { raw: 29.5 },
              forwardPE: { raw: 27.1 },
              fiftyTwoWeekHigh: { raw: 200 },
              fiftyTwoWeekLow: { raw: 120 },
              fiftyDayAverage: { raw: 175 },
              twoHundredDayAverage: { raw: 165 },
              beta: { raw: 1.24 },
              dividendYield: { raw: 0.005 },
              dividendRate: { raw: 0.96 },
              payoutRatio: { raw: 0.16 },
              averageVolume: { raw: 55_000_000 },
            },
            defaultKeyStatistics: {
              enterpriseValue: { raw: 2_900_000_000_000 },
              pegRatio: { raw: 2.2 },
              priceToBook: { raw: 48.5 },
              bookValue: { raw: 3.77 },
              '52WeekChange': { raw: 0.35 },
            },
            assetProfile: {
              longName: 'Apple Inc.',
              shortName: 'Apple',
              sector: 'Technology',
              industry: 'Consumer Electronics',
              longBusinessSummary: 'Apple designs consumer electronics.',
              website: 'https://apple.com',
              fullTimeEmployees: 164000,
            },
          },
        ],
      },
    }),
  }
}

function failedResponse(status = 500) {
  return {
    ok: false,
    status,
    json: async () => ({}),
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/stocks/detail', () => {
  beforeEach(() => {
    mockYahooFetch.mockReset()
  })

  it('returns 400 when symbol param is missing', async () => {
    const res = await GET(makeRequest('http://localhost/api/stocks/detail'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns 400 for invalid symbol format', async () => {
    const res = await GET(makeRequest('http://localhost/api/stocks/detail?symbol=123'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Invalid symbol')
  })

  it('returns full stock detail with chart + summary data', async () => {
    mockYahooFetch
      .mockResolvedValueOnce(chartResponse(180, 178))
      .mockResolvedValueOnce(summaryResponse())

    const res = await GET(makeRequest('http://localhost/api/stocks/detail?symbol=AAPL'))
    expect(res.status).toBe(200)
    const body = await res.json()

    // Basic info from assetProfile
    expect(body.symbol).toBe('AAPL')
    expect(body.name).toBe('Apple Inc.')
    expect(body.sector).toBe('Technology')
    expect(body.industry).toBe('Consumer Electronics')
    expect(body.employees).toBe(164000)

    // Price data from chart
    expect(body.price).toBe(180)
    expect(body.change).toBe(2) // 180 - 178
    expect(body.changePercent).toBeCloseTo((2 / 178) * 100, 2)

    // Analyst ratings
    expect(body.analyst.recommendationMean).toBe(1.8)
    expect(body.analyst.recommendationKey).toBe('buy')
    expect(body.analyst.targetHighPrice).toBe(220)
    expect(body.analyst.breakdown.strongBuy).toBe(12)
    expect(body.analyst.breakdown.total).toBe(40) // 12+20+6+1+1

    // Valuation
    expect(body.trailingPE).toBe(29.5)
    expect(body.forwardPE).toBe(27.1)
    expect(body.pegRatio).toBe(2.2)
  })

  it('returns partial data when only chart succeeds', async () => {
    mockYahooFetch
      .mockResolvedValueOnce(chartResponse(180, 178))
      .mockRejectedValueOnce(new Error('Summary failed'))

    const res = await GET(makeRequest('http://localhost/api/stocks/detail?symbol=AAPL'))
    expect(res.status).toBe(200)
    const body = await res.json()

    // Price data from chart should still be present
    expect(body.price).toBe(180)
    // Analyst defaults when summary is null
    expect(body.analyst.recommendationMean).toBe(3) // default
    expect(body.analyst.recommendationKey).toBe('hold') // default
  })

  it('returns partial data when only summary succeeds', async () => {
    mockYahooFetch
      .mockRejectedValueOnce(new Error('Chart failed'))
      .mockResolvedValueOnce(summaryResponse())

    const res = await GET(makeRequest('http://localhost/api/stocks/detail?symbol=AAPL'))
    expect(res.status).toBe(200)
    const body = await res.json()

    // Price from chart is 0 since chart failed
    expect(body.price).toBe(0)
    // But analyst data from summary should be present
    expect(body.analyst.recommendationMean).toBe(1.8)
    expect(body.name).toBe('Apple Inc.')
  })

  it('returns 500 when both chart and summary fail', async () => {
    mockYahooFetch
      .mockRejectedValueOnce(new Error('Chart failed'))
      .mockRejectedValueOnce(new Error('Summary failed'))

    const res = await GET(makeRequest('http://localhost/api/stocks/detail?symbol=AAPL'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('uppercases the symbol parameter', async () => {
    mockYahooFetch
      .mockResolvedValueOnce(chartResponse())
      .mockResolvedValueOnce(summaryResponse())

    const res = await GET(makeRequest('http://localhost/api/stocks/detail?symbol=aapl'))
    const body = await res.json()
    expect(body.symbol).toBe('AAPL')
  })

  it('sets cache-control headers for CDN caching', async () => {
    mockYahooFetch
      .mockResolvedValueOnce(chartResponse())
      .mockResolvedValueOnce(summaryResponse())

    const res = await GET(makeRequest('http://localhost/api/stocks/detail?symbol=AAPL'))
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=60, stale-while-revalidate=300'
    )
  })

  it('handles gracefully when chart data has no result array', async () => {
    mockYahooFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ chart: { result: [] } }),
      })
      .mockResolvedValueOnce(summaryResponse())

    const res = await GET(makeRequest('http://localhost/api/stocks/detail?symbol=AAPL'))
    const body = await res.json()

    // Should not crash — falls back to 0 prices
    expect(body.price).toBe(0)
    expect(body.name).toBe('Apple Inc.')
  })
})
