import { renderHook, act, waitFor } from '@testing-library/react'
import { useInvestments } from '../useInvestments'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value }),
    removeItem: jest.fn((key: string) => { delete store[key] }),
    clear: jest.fn(() => { store = {} }),
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockQuoteResponse(quotes: object[], extra = {}) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({
      quotes,
      rateLimited: false,
      allFailed: false,
      timestamp: new Date().toISOString(),
      ...extra,
    }),
  })
}

function mockRateLimitResponse() {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 429,
    json: async () => ({
      quotes: [],
      rateLimited: true,
      allFailed: true,
      timestamp: new Date().toISOString(),
    }),
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useInvestments', () => {
  beforeEach(() => {
    localStorageMock.clear()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    mockFetch.mockClear()
  })

  // ── Initialisation ────────────────────────────────────────────────────────

  it('initializes with empty portfolio when localStorage is empty', async () => {
    const { result } = renderHook(() => useInvestments())
    await waitFor(() => expect(result.current.initialized).toBe(true))
    expect(result.current.holdings).toEqual([])
    expect(result.current.quotesReady).toBe(true)
    expect(result.current.loading).toBe(false)
  })

  it('loads holdings from localStorage on mount', async () => {
    const stored = [{ symbol: 'AAPL', shares: 10, averageCost: 150 }]
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(stored))
    mockQuoteResponse([
      { symbol: 'AAPL', price: 180, change: 2, changePercent: 1.12, error: null },
    ])

    const { result } = renderHook(() => useInvestments())
    await waitFor(() => expect(result.current.initialized).toBe(true))
    await waitFor(() => expect(result.current.quotesReady).toBe(true))

    expect(result.current.holdings).toHaveLength(1)
    expect(result.current.holdings[0].symbol).toBe('AAPL')
  })

  // ── addHolding ────────────────────────────────────────────────────────────

  it('adds a new holding and returns true', async () => {
    mockQuoteResponse([
      { symbol: 'MSFT', price: 400, change: 5, changePercent: 1.26, error: null },
    ])

    const { result } = renderHook(() => useInvestments())
    await waitFor(() => expect(result.current.initialized).toBe(true))

    let added: boolean
    act(() => {
      added = result.current.addHolding({ symbol: 'MSFT', shares: 5, averageCost: 380 })
    })

    await waitFor(() => expect(result.current.holdings).toHaveLength(1))
    expect(added!).toBe(true)
    expect(result.current.holdings[0].symbol).toBe('MSFT')
  })

  it('rejects duplicate symbol and returns false', async () => {
    localStorageMock.getItem.mockReturnValueOnce(
      JSON.stringify([{ symbol: 'AAPL', shares: 10, averageCost: 150 }])
    )
    mockQuoteResponse([
      { symbol: 'AAPL', price: 180, change: 1, changePercent: 0.56, error: null },
    ])

    const { result } = renderHook(() => useInvestments())
    await waitFor(() => expect(result.current.quotesReady).toBe(true))

    let added: boolean
    act(() => {
      added = result.current.addHolding({ symbol: 'AAPL', shares: 5, averageCost: 170 })
    })

    expect(added!).toBe(false)
    expect(result.current.holdings).toHaveLength(1) // unchanged
    expect(result.current.error).toContain('AAPL')
  })

  // ── removeHolding ─────────────────────────────────────────────────────────

  it('removes a holding by symbol', async () => {
    localStorageMock.getItem.mockReturnValueOnce(
      JSON.stringify([{ symbol: 'AAPL', shares: 10, averageCost: 150 }])
    )
    mockQuoteResponse([
      { symbol: 'AAPL', price: 180, change: 1, changePercent: 0.56, error: null },
    ])

    const { result } = renderHook(() => useInvestments())
    await waitFor(() => expect(result.current.quotesReady).toBe(true))

    // After remove there are no holdings so fetchQuotes won't be called again
    act(() => {
      result.current.removeHolding('AAPL')
    })

    await waitFor(() => expect(result.current.holdings).toHaveLength(0))
  })

  // ── enhancedHoldings ──────────────────────────────────────────────────────

  it('computes enhanced holdings with live price', async () => {
    localStorageMock.getItem.mockReturnValueOnce(
      JSON.stringify([{ symbol: 'AAPL', shares: 10, averageCost: 150 }])
    )
    mockQuoteResponse([
      { symbol: 'AAPL', price: 200, change: 3, changePercent: 1.52, error: null },
    ])

    const { result } = renderHook(() => useInvestments())
    await waitFor(() => expect(result.current.quotesReady).toBe(true))

    const holding = result.current.enhancedHoldings[0]
    expect(holding.currentPrice).toBe(200)
    expect(holding.currentValue).toBe(2000)    // 10 * 200
    expect(holding.totalCost).toBe(1500)        // 10 * 150
    expect(holding.gainLoss).toBe(500)          // 2000 - 1500
    expect(holding.gainLossPercent).toBeCloseTo(33.33, 1) // 500/1500 * 100
    expect(holding.hasError).toBeFalsy()
  })

  it('falls back to cost basis and marks hasError when quote unavailable', async () => {
    localStorageMock.getItem.mockReturnValueOnce(
      JSON.stringify([{ symbol: 'AAPL', shares: 10, averageCost: 150 }])
    )
    // Quote with price=0 and an error field
    mockQuoteResponse([
      { symbol: 'AAPL', price: 0, change: 0, changePercent: 0, error: 'Symbol not found' },
    ])

    const { result } = renderHook(() => useInvestments())
    await waitFor(() => expect(result.current.quotesReady).toBe(true))

    const holding = result.current.enhancedHoldings[0]
    expect(holding.currentPrice).toBe(150) // falls back to averageCost
    expect(holding.gainLoss).toBe(0)
    expect(holding.hasError).toBe(true)
  })

  // ── portfolio summary ─────────────────────────────────────────────────────

  it('calculates correct portfolio summary', async () => {
    localStorageMock.getItem.mockReturnValueOnce(
      JSON.stringify([
        { symbol: 'AAPL', shares: 10, averageCost: 100 },
        { symbol: 'MSFT', shares: 5,  averageCost: 200 },
      ])
    )
    mockQuoteResponse([
      { symbol: 'AAPL', price: 150, change: 5,  changePercent: 3.45, error: null },
      { symbol: 'MSFT', price: 300, change: 10, changePercent: 3.45, error: null },
    ])

    const { result } = renderHook(() => useInvestments())
    await waitFor(() => expect(result.current.quotesReady).toBe(true))

    const s = result.current.summary
    expect(s.totalValue).toBe(3000)     // 10*150 + 5*300
    expect(s.totalCost).toBe(2000)      // 10*100 + 5*200
    expect(s.totalGainLoss).toBe(1000)  // 3000 - 2000
    expect(s.totalGainLossPercent).toBe(50) // 1000/2000*100
  })

  // ── error handling ────────────────────────────────────────────────────────

  it('sets rate limit error message on 429 response', async () => {
    localStorageMock.getItem.mockReturnValueOnce(
      JSON.stringify([{ symbol: 'AAPL', shares: 5, averageCost: 150 }])
    )
    mockRateLimitResponse()

    const { result } = renderHook(() => useInvestments())
    await waitFor(() => expect(result.current.quotesReady).toBe(true))

    expect(result.current.error).toContain('rate limit')
  })

  it('sets error message on fetch timeout (AbortError)', async () => {
    localStorageMock.getItem.mockReturnValueOnce(
      JSON.stringify([{ symbol: 'AAPL', shares: 5, averageCost: 150 }])
    )
    mockFetch.mockRejectedValueOnce(
      Object.assign(new DOMException('Aborted', 'AbortError'))
    )

    const { result } = renderHook(() => useInvestments())
    await waitFor(() => expect(result.current.quotesReady).toBe(true))

    expect(result.current.error).toContain('timed out')
  })

  // ── localStorage persistence ──────────────────────────────────────────────

  it('persists holdings to localStorage when a holding is added', async () => {
    mockQuoteResponse([
      { symbol: 'GOOGL', price: 170, change: 2, changePercent: 1.19, error: null },
    ])

    const { result } = renderHook(() => useInvestments())
    await waitFor(() => expect(result.current.initialized).toBe(true))

    act(() => {
      result.current.addHolding({ symbol: 'GOOGL', shares: 3, averageCost: 160 })
    })

    await waitFor(() => expect(result.current.holdings).toHaveLength(1))
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'portfolio_holdings',
      JSON.stringify([{ symbol: 'GOOGL', shares: 3, averageCost: 160 }])
    )
  })

  it('persists holdings to localStorage when a holding is removed', async () => {
    localStorageMock.getItem.mockReturnValueOnce(
      JSON.stringify([{ symbol: 'AAPL', shares: 10, averageCost: 150 }])
    )
    mockQuoteResponse([
      { symbol: 'AAPL', price: 180, change: 1, changePercent: 0.56, error: null },
    ])

    const { result } = renderHook(() => useInvestments())
    await waitFor(() => expect(result.current.quotesReady).toBe(true))

    act(() => {
      result.current.removeHolding('AAPL')
    })

    await waitFor(() => expect(result.current.holdings).toHaveLength(0))
    expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
      'portfolio_holdings',
      JSON.stringify([])
    )
  })
})
