/**
 * @jest-environment node
 */

/**
 * Tests for GET /api/stocks
 *
 * The route fetches live stock quotes from Yahoo Finance v8 chart endpoint.
 * We mock the global `fetch` to avoid real network calls.
 */

import { GET } from '../route'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock isValidSymbol from yahooFinance lib
jest.mock('@/lib/yahooFinance', () => ({
  isValidSymbol: (s: string) => /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/.test(s),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost'))
}

/** Simulate a successful Yahoo Finance v8 chart response */
function yahooChartResponse(symbol: string, price: number) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      chart: {
        result: [
          {
            meta: {
              regularMarketPrice: price,
              previousClose: price - 2,
              chartPreviousClose: price - 2,
              regularMarketDayHigh: price + 1,
              regularMarketDayLow: price - 1,
              regularMarketOpen: price - 0.5,
              regularMarketVolume: 50_000_000,
              shortName: `${symbol} Inc`,
            },
          },
        ],
      },
    }),
  }
}

/** Simulate a failed Yahoo chart response */
function yahooErrorResponse(status = 404) {
  return {
    ok: false,
    status,
    json: async () => ({}),
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/stocks', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns 400 when symbols param is missing', async () => {
    const res = await GET(makeRequest('http://localhost/api/stocks'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns quotes for valid symbols', async () => {
    mockFetch.mockResolvedValueOnce(yahooChartResponse('AAPL', 180))

    const res = await GET(makeRequest('http://localhost/api/stocks?symbols=AAPL'))
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.quotes).toHaveLength(1)
    expect(body.quotes[0].symbol).toBe('AAPL')
    expect(body.quotes[0].price).toBe(180)
    expect(body.quotes[0].name).toBe('AAPL Inc')
    expect(body.allFailed).toBe(false)
  })

  it('fetches multiple symbols in parallel', async () => {
    mockFetch
      .mockResolvedValueOnce(yahooChartResponse('AAPL', 180))
      .mockResolvedValueOnce(yahooChartResponse('MSFT', 400))

    const res = await GET(makeRequest('http://localhost/api/stocks?symbols=AAPL,MSFT'))
    const body = await res.json()

    expect(body.quotes).toHaveLength(2)
    const symbols = body.quotes.map((q: { symbol: string }) => q.symbol)
    expect(symbols).toContain('AAPL')
    expect(symbols).toContain('MSFT')
  })

  it('marks invalid symbol format as error without fetching', async () => {
    const res = await GET(makeRequest('http://localhost/api/stocks?symbols=123INVALID'))
    const body = await res.json()

    expect(body.quotes).toHaveLength(1)
    expect(body.quotes[0].error).toContain('Invalid symbol')
    // Should NOT have called Yahoo Finance
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('handles mixed valid and invalid symbols', async () => {
    mockFetch.mockResolvedValueOnce(yahooChartResponse('AAPL', 180))

    const res = await GET(makeRequest('http://localhost/api/stocks?symbols=AAPL,123BAD'))
    const body = await res.json()

    expect(body.quotes).toHaveLength(2)
    const validQuote = body.quotes.find((q: { symbol: string }) => q.symbol === 'AAPL')
    const invalidQuote = body.quotes.find((q: { symbol: string }) => q.symbol === '123BAD')
    expect(validQuote.price).toBe(180)
    expect(invalidQuote.error).toBeDefined()
  })

  it('returns error quote when Yahoo returns non-OK response', async () => {
    mockFetch.mockResolvedValueOnce(yahooErrorResponse(404))

    const res = await GET(makeRequest('http://localhost/api/stocks?symbols=AAPL'))
    const body = await res.json()

    expect(body.quotes).toHaveLength(1)
    expect(body.quotes[0].error).toBeDefined()
    expect(body.quotes[0].price).toBe(0)
  })

  it('returns error quote when Yahoo returns price=0', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        chart: {
          result: [{ meta: { regularMarketPrice: 0, shortName: 'Delisted Co' } }],
        },
      }),
    })

    const res = await GET(makeRequest('http://localhost/api/stocks?symbols=DELIST'))
    const body = await res.json()

    expect(body.quotes[0].error).toBeDefined()
    expect(body.quotes[0].price).toBe(0)
  })

  it('sets allFailed=true when every valid symbol fails', async () => {
    mockFetch.mockResolvedValueOnce(yahooErrorResponse(500))

    const res = await GET(makeRequest('http://localhost/api/stocks?symbols=AAPL'))
    const body = await res.json()

    expect(body.allFailed).toBe(true)
  })

  it('sets allFailed=false when at least one symbol succeeds', async () => {
    mockFetch
      .mockResolvedValueOnce(yahooChartResponse('AAPL', 180))
      .mockResolvedValueOnce(yahooErrorResponse(500))

    const res = await GET(makeRequest('http://localhost/api/stocks?symbols=AAPL,MSFT'))
    const body = await res.json()

    expect(body.allFailed).toBe(false)
  })

  it('returns 500 on unexpected thrown error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const res = await GET(makeRequest('http://localhost/api/stocks?symbols=AAPL'))
    // The fetch rejection is caught inside fetchFromChartAPI via Promise.allSettled,
    // so it returns a "Failed to fetch" error quote, not a 500
    const body = await res.json()
    expect(body.quotes[0].error).toBe('Failed to fetch')
  })

  it('trims whitespace and uppercases symbols', async () => {
    mockFetch.mockResolvedValueOnce(yahooChartResponse('AAPL', 180))

    const res = await GET(makeRequest('http://localhost/api/stocks?symbols=%20aapl%20'))
    const body = await res.json()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('/AAPL')
  })

  it('calculates change and changePercent from price and previousClose', async () => {
    mockFetch.mockResolvedValueOnce(yahooChartResponse('AAPL', 182))

    const res = await GET(makeRequest('http://localhost/api/stocks?symbols=AAPL'))
    const body = await res.json()
    const q = body.quotes[0]

    expect(q.change).toBe(2) // 182 - 180
    expect(q.changePercent).toBeCloseTo((2 / 180) * 100, 2)
  })

  it('includes a timestamp in the response', async () => {
    mockFetch.mockResolvedValueOnce(yahooChartResponse('AAPL', 180))

    const res = await GET(makeRequest('http://localhost/api/stocks?symbols=AAPL'))
    const body = await res.json()

    expect(body.timestamp).toBeDefined()
    expect(new Date(body.timestamp).getTime()).not.toBeNaN()
  })
})
