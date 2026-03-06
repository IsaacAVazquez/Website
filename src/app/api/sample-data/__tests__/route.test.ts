/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, HEAD } from '../route';

// Mock sampleData module to avoid loading the full dataset
jest.mock('@/data/sampleData', () => ({
  getSampleDataByPosition: jest.fn((position: string) => {
    const data: Record<string, any[]> = {
      QB: [
        { id: 'fp-QB-1', name: 'Josh Allen', position: 'QB', averageRank: '1.39', projectedPoints: 364, standardDeviation: '0.58', team: 'BUF', tier: 1, expertRanks: [1, 2, 1] },
        { id: 'fp-QB-2', name: 'Lamar Jackson', position: 'QB', averageRank: '2.5', projectedPoints: 340, standardDeviation: '0.9', team: 'BAL', tier: 1, expertRanks: [2, 3, 2] },
      ],
      RB: [
        { id: 'fp-RB-1', name: 'CJ Stroud', position: 'RB', averageRank: '1.0', projectedPoints: 280, standardDeviation: '0.5', team: 'HOU', tier: 1, expertRanks: [1, 1, 1] },
      ],
      WR: [],
      TE: [],
      K: [],
      DST: [],
    };
    return data[position] || [];
  }),
}));

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/sample-data');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return new NextRequest(url.toString());
}

describe('GET /api/sample-data', () => {
  it('returns success:true with pagination metadata', async () => {
    const res = await GET(makeRequest({ position: 'QB' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pagination).toBeDefined();
    expect(typeof body.pagination.total).toBe('number');
    expect(typeof body.pagination.totalPages).toBe('number');
  });

  it('returns player data for a specific position', async () => {
    const res = await GET(makeRequest({ position: 'QB' }));
    const body = await res.json();

    // Use Array.isArray to avoid cross-realm instanceof issues
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].position).toBe('QB');
  });

  it('returns all-positions data when no position is specified', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.metadata.position).toBe('all');
  });

  it('applies pagination correctly', async () => {
    const res = await GET(makeRequest({ position: 'QB', page: '1', limit: '1' }));
    const body = await res.json();

    expect(body.data.length).toBeLessThanOrEqual(1);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(1);
  });

  it('pagination hasPrev is false on page 1', async () => {
    const res = await GET(makeRequest({ position: 'QB', page: '1', limit: '10' }));
    const body = await res.json();

    expect(body.pagination.hasPrev).toBe(false);
  });

  it('pagination hasNext is true when more data exists', async () => {
    const res = await GET(makeRequest({ position: 'QB', page: '1', limit: '1' }));
    const body = await res.json();

    // We have 2 QB records, limit 1 → hasNext should be true
    expect(body.pagination.hasNext).toBe(true);
  });

  it('returns empty data array for a position with no players', async () => {
    const res = await GET(makeRequest({ position: 'WR' }));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });

  it('includes metadata with position and cached fields', async () => {
    const res = await GET(makeRequest({ position: 'QB' }));
    const body = await res.json();

    expect(body.metadata).toBeDefined();
    expect(body.metadata.position).toBe('QB');
    expect(body.metadata.cached).toBe(true);
  });

  it('returns second page data correctly', async () => {
    const res = await GET(makeRequest({ position: 'QB', page: '2', limit: '1' }));
    const body = await res.json();

    expect(body.pagination.page).toBe(2);
    expect(body.pagination.hasPrev).toBe(true);
    expect(body.data.length).toBe(1);
    // Second player (sorted by insertion order from the mock)
    expect(body.data[0].name).toBe('Lamar Jackson');
  });

  it('includes totalPages in pagination', async () => {
    const res = await GET(makeRequest({ position: 'QB', page: '1', limit: '1' }));
    const body = await res.json();

    // 2 QB players, limit 1 → 2 total pages
    expect(body.pagination.totalPages).toBe(2);
  });
});

describe('HEAD /api/sample-data', () => {
  it('returns 200 with Cache-Control header', async () => {
    const res = await HEAD(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toContain('max-age=3600');
  });

  it('returns Last-Modified header', async () => {
    const res = await HEAD(makeRequest());
    expect(res.headers.get('Last-Modified')).toBeTruthy();
  });
});
