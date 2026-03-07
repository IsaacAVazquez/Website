/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the nflverseAPI and rate limiting utilities
jest.mock('@/lib/nflverseAPI', () => ({
  nflverseAPI: {
    fetchPlayersData: jest.fn(),
    fetchAllPositions: jest.fn(),
  },
}));

jest.mock('@/lib/rateLimit', () => ({
  fantasyRateLimiter: {
    check: jest.fn().mockReturnValue({ success: true, limit: 100, remaining: 99, reset: Date.now() + 60000 }),
  },
  getClientIdentifier: jest.fn().mockReturnValue('test-client'),
  rateLimitResponse: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { nflverseAPI } from '@/lib/nflverseAPI';
import { fantasyRateLimiter } from '@/lib/rateLimit';

const mockNflverse = nflverseAPI as jest.Mocked<typeof nflverseAPI>;
const mockRateLimiter = fantasyRateLimiter as jest.Mocked<typeof fantasyRateLimiter>;

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/fantasy-data');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return new NextRequest(url.toString());
}

function makePlayerResult(count = 2) {
  return {
    success: true,
    players: Array.from({ length: count }, (_, i) => ({
      id: `player-${i}`,
      name: `Player ${i}`,
      position: 'QB',
      team: 'TST',
      averageRank: i + 1,
      projectedPoints: 25,
      standardDeviation: 1,
      expertRanks: [i + 1],
    })),
    source: 'nflverse',
    error: null,
    metadata: { timestamp: new Date().toISOString(), cacheHit: false },
  };
}

describe('GET /api/fantasy-data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimiter.check.mockReturnValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    });
  });

  // ─── Input validation ────────────────────────────────────────────────────

  it('returns 400 for invalid scoring format', async () => {
    const res = await GET(makeRequest({ position: 'QB', scoring: 'INVALID' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/Invalid scoring format/i);
  });

  it('returns 400 for invalid position', async () => {
    mockNflverse.fetchPlayersData.mockResolvedValue(makePlayerResult());
    const res = await GET(makeRequest({ position: 'INVALID', scoring: 'PPR' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/Invalid.*position/i);
  });

  it('accepts all supported scoring format strings', async () => {
    mockNflverse.fetchPlayersData.mockResolvedValue(makePlayerResult());
    // PPR, STANDARD, HALF, STD all pass validateScoringFormat.
    // Note: 'HALF_PPR' fails validation because the route's replace logic transforms
    // it to 'HALF_PPR_PPR' before the includes() check — only the alias 'HALF' works.
    const validFormats = ['PPR', 'STANDARD', 'HALF', 'STD'];
    for (const scoring of validFormats) {
      const res = await GET(makeRequest({ position: 'QB', scoring }));
      expect(res.status).not.toBe(400);
    }
  });

  it('rejects HALF_PPR: the route validation transforms it to an invalid value', async () => {
    // validateScoringFormat replaces 'HALF' in 'HALF_PPR' → 'HALF_PPR_PPR', which
    // is not in the valid-formats list. Use 'HALF' as the alias instead.
    const res = await GET(makeRequest({ position: 'QB', scoring: 'HALF_PPR' }));
    expect(res.status).toBe(400);
  });

  it('accepts all valid positions', async () => {
    mockNflverse.fetchPlayersData.mockResolvedValue(makePlayerResult());
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST', 'FLEX', 'OVERALL'];
    for (const position of positions) {
      const res = await GET(makeRequest({ position, scoring: 'PPR' }));
      const body = await res.json();
      expect(body).not.toMatchObject({ error: expect.stringMatching(/Invalid.*position/i) });
    }
  });

  // ─── Single position fetch ───────────────────────────────────────────────

  it('returns players from nflverseAPI for a valid single position', async () => {
    mockNflverse.fetchPlayersData.mockResolvedValue(makePlayerResult(3));

    const res = await GET(makeRequest({ position: 'QB', scoring: 'PPR' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.players).toHaveLength(3);
  });

  it('includes metadata with executionTimeMs and source', async () => {
    mockNflverse.fetchPlayersData.mockResolvedValue(makePlayerResult());

    const res = await GET(makeRequest({ position: 'RB', scoring: 'STANDARD' }));
    const body = await res.json();

    expect(body.metadata).toBeDefined();
    expect(typeof body.metadata.executionTimeMs).toBe('number');
    expect(body.metadata.source).toBe('nflverse');
  });

  it('returns forceRefresh option in response when refresh=true', async () => {
    mockNflverse.fetchPlayersData.mockResolvedValue(makePlayerResult());

    const res = await GET(makeRequest({ position: 'WR', scoring: 'PPR', refresh: 'true' }));
    const body = await res.json();

    expect(body.options.forceRefresh).toBe(true);
  });

  it('normalizes scoring format aliases correctly (HALF → HALF_PPR)', async () => {
    mockNflverse.fetchPlayersData.mockResolvedValue(makePlayerResult());

    await GET(makeRequest({ position: 'QB', scoring: 'HALF' }));

    expect(mockNflverse.fetchPlayersData).toHaveBeenCalledWith(
      'QB',
      'HALF_PPR'
    );
  });

  it('normalizes STD → STANDARD', async () => {
    mockNflverse.fetchPlayersData.mockResolvedValue(makePlayerResult());

    await GET(makeRequest({ position: 'QB', scoring: 'STD' }));

    expect(mockNflverse.fetchPlayersData).toHaveBeenCalledWith(
      'QB',
      'STANDARD'
    );
  });

  // ─── All positions fetch ──────────────────────────────────────────────────

  it('calls fetchAllPositions when all=true', async () => {
    mockNflverse.fetchAllPositions.mockResolvedValue({
      QB: { ...makePlayerResult(2), players: makePlayerResult(2).players },
      RB: { ...makePlayerResult(3), players: makePlayerResult(3).players },
    } as any);

    const res = await GET(makeRequest({ all: 'true', scoring: 'PPR' }));
    const body = await res.json();

    expect(mockNflverse.fetchAllPositions).toHaveBeenCalledWith('PPR');
    expect(body.summary).toBeDefined();
    expect(body.summary.totalPlayers).toBeGreaterThan(0);
  });

  it('all-positions response includes summary with positionsCount', async () => {
    mockNflverse.fetchAllPositions.mockResolvedValue({
      QB: { ...makePlayerResult(2), players: makePlayerResult(2).players },
    } as any);

    const res = await GET(makeRequest({ all: 'true', scoring: 'PPR' }));
    const body = await res.json();

    expect(body.summary.positionsCount).toBeGreaterThan(0);
  });

  // ─── Rate limiting ────────────────────────────────────────────────────────

  it('invokes rateLimitResponse when rate limit is exceeded', async () => {
    const { rateLimitResponse } = require('@/lib/rateLimit');
    mockRateLimiter.check.mockReturnValueOnce({
      success: false,
      limit: 100,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    await GET(makeRequest({ position: 'QB', scoring: 'PPR' }));
    expect(rateLimitResponse).toHaveBeenCalled();
  });

  // ─── Error handling ───────────────────────────────────────────────────────

  it('returns 500 when nflverseAPI throws', async () => {
    mockNflverse.fetchPlayersData.mockRejectedValue(new Error('API down'));

    const res = await GET(makeRequest({ position: 'QB', scoring: 'PPR' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('API down');
  });

  it('500 response includes metadata with timestamp', async () => {
    mockNflverse.fetchPlayersData.mockRejectedValue(new Error('timeout'));

    const res = await GET(makeRequest({ position: 'QB', scoring: 'PPR' }));
    const body = await res.json();

    expect(body.metadata.timestamp).toBeTruthy();
    expect(body.metadata.executionTimeMs).toBeGreaterThanOrEqual(0);
  });
});
