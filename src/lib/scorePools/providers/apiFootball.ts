// ============================================================
// Fixtures/results/standings adapter — API-Football (api-sports.io)
//
// Build-time only. Maps fixtures, final scores (including extra
// time and shootouts), standings, injuries, and confirmed lineups
// into provider-neutral shapes. Swappable: anything producing the
// same shapes can replace it per league.
// ============================================================

import type {
  SnapshotFixtureStatus,
  SnapshotResult,
  SnapshotStandingsGroup,
} from "@/types/scorePools";

export interface ProviderFixture {
  id: string;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  round: string | null;
  status: SnapshotFixtureStatus;
  result: SnapshotResult | null;
}

const API_BASE = "https://v3.football.api-sports.io";

interface ApiFootballGoals {
  home: number | null;
  away: number | null;
}

interface ApiFootballFixtureResponse {
  fixture: { id: number; date: string; status: { short: string } };
  league: { round?: string | null };
  teams: { home: { name: string }; away: { name: string } };
  goals: ApiFootballGoals;
  score: {
    fulltime: ApiFootballGoals;
    extratime: ApiFootballGoals;
    penalty: ApiFootballGoals;
  };
}

async function apiFootballGet<T>(
  path: string,
  apiKey: string,
  fetchImpl: typeof fetch,
): Promise<T> {
  const response = await fetchImpl(`${API_BASE}${path}`, {
    headers: { "x-apisports-key": apiKey },
  });
  if (!response.ok) {
    throw Object.assign(new Error(`API-Football responded ${response.status} for ${path}`), {
      status: response.status,
      headers: response.headers,
    });
  }
  const payload = (await response.json()) as { response: T; errors?: unknown };
  return payload.response;
}

const FINISHED = new Set(["FT", "AET", "PEN"]);
const IN_PLAY = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);
const POSTPONED = new Set(["PST", "CANC", "ABD", "SUSP", "AWD", "WO"]);

function mapStatus(short: string): SnapshotFixtureStatus {
  if (FINISHED.has(short)) return "finished";
  if (IN_PLAY.has(short)) return "in_play";
  if (POSTPONED.has(short)) return "postponed";
  return "scheduled";
}

/**
 * Reduce the provider's score object to the engine's result shape.
 * `goals` is the final tally excluding the shootout, `score.fulltime` is
 * the 90-minute score, and `score.penalty` is the shootout itself — which
 * is exactly the decomposition the two scoring bases need.
 */
function mapResult(raw: ApiFootballFixtureResponse): SnapshotResult | null {
  const short = raw.fixture.status.short;
  if (!FINISHED.has(short)) return null;
  const ninety = raw.score.fulltime.home !== null ? raw.score.fulltime : raw.goals;
  if (ninety.home === null || ninety.away === null) return null;
  const wentLong = short === "AET" || short === "PEN";
  const afterExtraTime =
    wentLong && raw.goals.home !== null && raw.goals.away !== null
      ? { home: raw.goals.home, away: raw.goals.away }
      : null;
  let penaltyWinner: SnapshotResult["penaltyWinner"] = null;
  if (short === "PEN" && raw.score.penalty.home !== null && raw.score.penalty.away !== null) {
    penaltyWinner = raw.score.penalty.home > raw.score.penalty.away ? "home" : "away";
  }
  return {
    ninetyMinutes: { home: ninety.home, away: ninety.away },
    afterExtraTime,
    penaltyWinner,
  };
}

export async function fetchApiFootballFixtures(
  leagueId: number,
  season: number,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ProviderFixture[]> {
  const raw = await apiFootballGet<ApiFootballFixtureResponse[]>(
    `/fixtures?league=${leagueId}&season=${season}`,
    apiKey,
    fetchImpl,
  );
  return raw.map((entry) => ({
    id: `af-${entry.fixture.id}`,
    kickoff: new Date(entry.fixture.date).toISOString(),
    homeTeam: entry.teams.home.name,
    awayTeam: entry.teams.away.name,
    round: entry.league.round ?? null,
    status: mapStatus(entry.fixture.status.short),
    result: mapResult(entry),
  }));
}

interface ApiFootballStandingRow {
  rank: number;
  team: { name: string };
  points: number;
  group?: string | null;
  all: { played: number };
}

interface ApiFootballStandingsResponse {
  league: { standings: ApiFootballStandingRow[][] };
}

export async function fetchApiFootballStandings(
  leagueId: number,
  season: number,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SnapshotStandingsGroup[]> {
  const raw = await apiFootballGet<ApiFootballStandingsResponse[]>(
    `/standings?league=${leagueId}&season=${season}`,
    apiKey,
    fetchImpl,
  );
  const groups = raw[0]?.league.standings ?? [];
  return groups.map((rows) => ({
    group: rows[0]?.group ?? null,
    rows: rows.map((row) => ({
      team: row.team.name,
      position: row.rank,
      played: row.all.played,
      points: row.points,
      // The feed describes what a position means, not whether it's clinched,
      // so qualification state stays unknown unless entered manually.
      qualified: null,
      eliminated: null,
    })),
  }));
}

interface ApiFootballInjury {
  player: { name: string; reason?: string | null };
  team: { name: string };
}

/** Best-effort injury notes per team name. Missing feed access returns empty. */
export async function fetchApiFootballInjuries(
  leagueId: number,
  season: number,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Map<string, string[]>> {
  const raw = await apiFootballGet<ApiFootballInjury[]>(
    `/injuries?league=${leagueId}&season=${season}`,
    apiKey,
    fetchImpl,
  );
  const byTeam = new Map<string, string[]>();
  for (const injury of raw) {
    const notes = byTeam.get(injury.team.name) ?? [];
    if (notes.length < 5) {
      notes.push(
        injury.player.reason
          ? `${injury.player.name} (${injury.player.reason})`
          : injury.player.name,
      );
    }
    byTeam.set(injury.team.name, notes);
  }
  return byTeam;
}

interface ApiFootballLineup {
  team: { name: string };
  startXI: unknown[];
}

/** True when both starting elevens are published for a fixture. */
export async function fetchApiFootballLineupsConfirmed(
  providerFixtureId: number,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const raw = await apiFootballGet<ApiFootballLineup[]>(
    `/fixtures/lineups?fixture=${providerFixtureId}`,
    apiKey,
    fetchImpl,
  );
  return raw.length >= 2 && raw.every((lineup) => (lineup.startXI?.length ?? 0) >= 11);
}
