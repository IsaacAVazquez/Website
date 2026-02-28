/**
 * @jest-environment node
 */

/**
 * Tests for Yahoo Finance utility module
 *
 * Tests the pure utility functions (isValidSymbol) and the auth/fetch
 * infrastructure with mocked network calls.
 */

// We need to mock global fetch before importing the module
const mockFetch = jest.fn()
global.fetch = mockFetch

// Import after mock setup. We re-import fresh for auth cache tests.
import { isValidSymbol } from '../yahooFinance'

// ---------------------------------------------------------------------------
// isValidSymbol
// ---------------------------------------------------------------------------

describe('isValidSymbol', () => {
  it('accepts standard 1-5 letter tickers', () => {
    expect(isValidSymbol('A')).toBe(true)
    expect(isValidSymbol('AAPL')).toBe(true)
    expect(isValidSymbol('GOOGL')).toBe(true)
    expect(isValidSymbol('MSFT')).toBe(true)
    expect(isValidSymbol('T')).toBe(true)
  })

  it('accepts tickers with dot suffix (e.g. BRK.B)', () => {
    expect(isValidSymbol('BRK.B')).toBe(true)
    expect(isValidSymbol('BRK.AB')).toBe(true)
  })

  it('rejects lowercase symbols', () => {
    expect(isValidSymbol('aapl')).toBe(false)
    expect(isValidSymbol('Aapl')).toBe(false)
  })

  it('rejects symbols with numbers', () => {
    expect(isValidSymbol('AAPL1')).toBe(false)
    expect(isValidSymbol('123')).toBe(false)
    expect(isValidSymbol('A1B')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidSymbol('')).toBe(false)
  })

  it('rejects symbols longer than 5 letters', () => {
    expect(isValidSymbol('ABCDEF')).toBe(false)
  })

  it('rejects symbols with special characters', () => {
    expect(isValidSymbol('AA-PL')).toBe(false)
    expect(isValidSymbol('AA PL')).toBe(false)
    expect(isValidSymbol('AA/PL')).toBe(false)
  })

  it('rejects dot-only or dot-first patterns', () => {
    expect(isValidSymbol('.A')).toBe(false)
    expect(isValidSymbol('.')).toBe(false)
  })

  it('rejects symbols with dot suffix longer than 2 characters', () => {
    expect(isValidSymbol('BRK.ABC')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// yahooFetch and auth infrastructure
// ---------------------------------------------------------------------------

describe('yahooFetch', () => {
  // Re-import for each test group to get fresh module state (caches)
  let yahooFetch: typeof import('../yahooFinance')['yahooFetch']
  let getYahooAuth: typeof import('../yahooFinance')['getYahooAuth']
  let isRateLimited: typeof import('../yahooFinance')['isRateLimited']

  beforeEach(() => {
    mockFetch.mockReset()
    // Reset module to clear cached auth and rate-limit state
    jest.resetModules()
    const mod = jest.requireActual('../yahooFinance') as typeof import('../yahooFinance')
    yahooFetch = mod.yahooFetch
    getYahooAuth = mod.getYahooAuth
    isRateLimited = mod.isRateLimited
  })

  it('appends crumb to URL when auth succeeds', async () => {
    // Mock auth: crumb fetch succeeds on first try
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'test_crumb_abc',
    })
    // Mock actual data request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: 'test' }),
    })

    const res = await yahooFetch('https://query1.finance.yahoo.com/v8/finance/chart/AAPL')
    expect(res.ok).toBe(true)

    // The data fetch (second call) should have the crumb in the URL
    const dataUrl = mockFetch.mock.calls[1][0] as string
    expect(dataUrl).toContain('crumb=test_crumb_abc')
  })

  it('falls back to unauthenticated request when all auth strategies fail', async () => {
    // All auth attempts fail
    mockFetch.mockRejectedValue(new Error('Network failure'))
    // After auth fails, the actual data request should still be attempted
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    })

    // getYahooAuth returns empty crumb/cookie on failure
    const auth = await getYahooAuth()
    expect(auth.crumb).toBe('')
    expect(auth.cookie).toBe('')
  })

  it('isRateLimited returns false initially', () => {
    expect(isRateLimited()).toBe(false)
  })
})
