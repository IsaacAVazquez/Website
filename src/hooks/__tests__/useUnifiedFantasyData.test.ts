import { renderHook, act, waitFor } from '@testing-library/react';
import { useUnifiedFantasyData } from '../useUnifiedFantasyData';
import { Player } from '@/types';

// Silence logger in tests
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

function makePlayer(id: string, averageRank: number): Player {
  return {
    id,
    name: `Player ${id}`,
    team: 'TST',
    position: 'QB',
    averageRank,
    projectedPoints: 25,
    standardDeviation: 1,
    expertRanks: [averageRank],
  };
}

function mockFetchSuccess(players: Player[], metadata = {}) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      players,
      metadata: {
        source: 'test-api',
        executionTimeMs: 42,
        cacheHit: false,
        ...metadata,
      },
    }),
  } as Response);
}

function mockFetchFailure(status = 500, error = 'Internal Server Error') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error }),
  } as Response);
}

function mockFetchNetworkError() {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));
}

describe('useUnifiedFantasyData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── Initial state ────────────────────────────────────────────────────────

  it('starts in loading state', () => {
    mockFetchSuccess([]);
    const { result } = renderHook(() =>
      useUnifiedFantasyData({ position: 'QB', scoringFormat: 'PPR' })
    );
    expect(result.current.isLoading).toBe(true);
    expect(result.current.players).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  // ─── Successful fetch ─────────────────────────────────────────────────────

  it('populates players after successful fetch', async () => {
    const players = [makePlayer('p1', 1), makePlayer('p2', 2)];
    mockFetchSuccess(players);

    const { result } = renderHook(() =>
      useUnifiedFantasyData({ position: 'QB', scoringFormat: 'PPR' })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.players).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('sets dataSource from response metadata', async () => {
    mockFetchSuccess([makePlayer('p1', 1)], { source: 'fantasypros' });

    const { result } = renderHook(() =>
      useUnifiedFantasyData({ position: 'QB', scoringFormat: 'PPR' })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.dataSource).toBe('fantasypros');
  });

  it('sets executionTime from response metadata', async () => {
    mockFetchSuccess([makePlayer('p1', 1)], { executionTimeMs: 99 });

    const { result } = renderHook(() =>
      useUnifiedFantasyData({ position: 'QB', scoringFormat: 'PPR' })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.executionTime).toBe(99);
  });

  it('sets cacheHit from response metadata', async () => {
    mockFetchSuccess([makePlayer('p1', 1)], { cacheHit: true });

    const { result } = renderHook(() =>
      useUnifiedFantasyData({ position: 'QB', scoringFormat: 'PPR' })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.cacheHit).toBe(true);
  });

  it('sets lastUpdated as a non-empty string after success', async () => {
    mockFetchSuccess([makePlayer('p1', 1)]);

    const { result } = renderHook(() =>
      useUnifiedFantasyData({ position: 'QB', scoringFormat: 'PPR' })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.lastUpdated).toBeTruthy();
  });

  // ─── Error handling ───────────────────────────────────────────────────────

  it('sets error on non-ok HTTP response', async () => {
    mockFetchFailure(500, 'Server Error');

    const { result } = renderHook(() =>
      useUnifiedFantasyData({ position: 'RB', scoringFormat: 'STANDARD' })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.players).toEqual([]);
  });

  it('sets error on network failure', async () => {
    mockFetchNetworkError();

    const { result } = renderHook(() =>
      useUnifiedFantasyData({ position: 'WR', scoringFormat: 'HALF_PPR' })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeTruthy();
  });

  it('sets error when API returns success:false', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: 'No data available' }),
    } as Response);

    const { result } = renderHook(() =>
      useUnifiedFantasyData({ position: 'TE', scoringFormat: 'PPR' })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeTruthy();
  });

  // ─── getDataStatus ────────────────────────────────────────────────────────

  it('getDataStatus returns loading status while fetching', () => {
    mockFetchSuccess([]);
    const { result } = renderHook(() =>
      useUnifiedFantasyData({ position: 'QB', scoringFormat: 'PPR' })
    );
    const status = result.current.getDataStatus();
    expect(status.status).toBe('loading');
    expect(status.color).toBe('blue');
  });

  it('getDataStatus returns error status when fetch fails', async () => {
    mockFetchFailure();

    const { result } = renderHook(() =>
      useUnifiedFantasyData({ position: 'QB', scoringFormat: 'PPR' })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const status = result.current.getDataStatus();
    expect(status.status).toBe('error');
    expect(status.color).toBe('red');
  });

  it('getDataStatus returns empty status when no players', async () => {
    mockFetchSuccess([]);

    const { result } = renderHook(() =>
      useUnifiedFantasyData({ position: 'K', scoringFormat: 'STANDARD' })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const status = result.current.getDataStatus();
    expect(status.status).toBe('empty');
    expect(status.color).toBe('gray');
  });

  it('getDataStatus returns success status with player count message', async () => {
    mockFetchSuccess([makePlayer('p1', 1), makePlayer('p2', 2)]);

    const { result } = renderHook(() =>
      useUnifiedFantasyData({ position: 'QB', scoringFormat: 'PPR' })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const status = result.current.getDataStatus();
    expect(status.status).toBe('success');
    expect(status.color).toBe('green');
    expect(status.message).toContain('2');
  });

  // ─── refresh ──────────────────────────────────────────────────────────────

  it('refresh triggers a new fetch with forceRefresh=true', async () => {
    // Use a single persistent mock so call count accumulates across both fetches
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        players: [makePlayer('p1', 1)],
        metadata: { source: 'test', executionTimeMs: 10, cacheHit: false },
      }),
    } as Response);
    global.fetch = fetchMock;

    const { result } = renderHook(() =>
      useUnifiedFantasyData({ position: 'QB', scoringFormat: 'PPR' })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const callsAfterInit = fetchMock.mock.calls.length;
    expect(callsAfterInit).toBeGreaterThanOrEqual(1);

    await act(async () => {
      await result.current.refresh();
    });

    // At least one more fetch should have been issued for the refresh
    expect(fetchMock.mock.calls.length).toBeGreaterThan(callsAfterInit);

    // The refresh call URL should contain refresh=true
    const refreshCallUrl = fetchMock.mock.calls[callsAfterInit][0] as string;
    expect(refreshCallUrl).toContain('refresh=true');
  });

  // ─── URL parameter construction ───────────────────────────────────────────

  it('includes position in the API URL', async () => {
    mockFetchSuccess([]);

    renderHook(() =>
      useUnifiedFantasyData({ position: 'TE', scoringFormat: 'PPR' })
    );

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalled()
    );

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('position=TE');
    expect(url).toContain('scoring=PPR');
  });

  it('includes all=true when no position is specified', async () => {
    mockFetchSuccess([]);

    renderHook(() =>
      useUnifiedFantasyData({ scoringFormat: 'PPR' })
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('all=true');
  });

  it('includes method when preferredMethod is not auto', async () => {
    mockFetchSuccess([]);

    renderHook(() =>
      useUnifiedFantasyData({ position: 'QB', scoringFormat: 'PPR', preferredMethod: 'free' })
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('method=free');
  });

  // ─── tierData ─────────────────────────────────────────────────────────────

  it('tierData is null (tiers are calculated client-side, not fetched)', async () => {
    mockFetchSuccess([makePlayer('p1', 1)]);

    const { result } = renderHook(() =>
      useUnifiedFantasyData({ position: 'QB', scoringFormat: 'PPR', withTiers: true })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tierData).toBeNull();
  });
});
