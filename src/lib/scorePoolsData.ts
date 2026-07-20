// ============================================================
// Score pools — snapshot build orchestration (build time only)
//
// Pulls fixtures/results/standings from the fixtures provider,
// odds from the odds provider, merges manual and CSV entries, and
// carries forward the previous snapshot's odds history so every
// price ever fetched stays queryable. Fail-soft throughout: a dead
// provider keeps the last good league data instead of wiping it.
// ============================================================

import {
  fetchApiFootballFixtures,
  fetchApiFootballInjuries,
  fetchApiFootballLineupsConfirmed,
  fetchApiFootballStandings,
  type ProviderFixture,
} from "./scorePools/providers/apiFootball";
import {
  fetchTheOddsApiEvents,
  type ProviderOddsEvent,
} from "./scorePools/providers/theOddsApi";
import {
  manualFixtureToSnapshot,
  manualOddsToEntry,
  type ManualFixtureInput,
  type ManualLeagueInput,
} from "./scorePools/providers/manual";
import type {
  ScorePoolLeagueSnapshot,
  ScorePoolsSnapshot,
  SnapshotFixture,
  SnapshotOddsEntry,
} from "@/types/scorePools";

/** Build-time source configuration for a provider-backed league. */
export interface ScorePoolLeagueSource {
  key: string;
  name: string;
  sport: string;
  season: string | null;
  /** The Odds API sport key, e.g. "soccer_epl". Null skips fetched odds. */
  theOddsApiSportKey: string | null;
  /** API-Football league id + season year. Null skips fetched fixtures. */
  apiFootball: { leagueId: number; season: number } | null;
  /** Rounds matching this pattern are knockout games (extra time possible). */
  knockoutRoundPattern: string | null;
  /** Odds-provider team name → fixtures-provider team name. */
  teamAliases: Record<string, string>;
}

export interface ScorePoolsBuildInputs {
  leagues: ScorePoolLeagueSource[];
  manualLeagues: ManualLeagueInput[];
  /** CSV-sourced fixtures keyed by league key, parsed by the builder. */
  csvFixturesByLeague: Record<string, ManualFixtureInput[]>;
  previous: ScorePoolsSnapshot | null;
  keys: { theOddsApi: string | null; apiFootball: string | null };
  now?: string;
  fetchImpl?: typeof fetch;
}

/** Keep this many odds snapshots per fixture — enough movement history to
 * read a line without letting the committed file grow unbounded. */
export const MAX_ODDS_HISTORY = 48;

const DEFAULT_KNOCKOUT_PATTERN =
  "final|semi|quarter|round of|knockout|play.?off|1\\/8|1\\/4|1\\/2";

// ─── Team matching (tiered exact, never fuzzy) ──────────────────────────────

const DROPPED_TOKENS = new Set(["fc", "cf", "afc", "sc", "ac", "cd", "club", "ssc", "if", "bk", "fk"]);

export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 0 && !DROPPED_TOKENS.has(token))
    .join(" ");
}

function matchFixtureForOdds(
  fixtures: SnapshotFixture[],
  event: ProviderOddsEvent,
  aliases: Record<string, string>,
): SnapshotFixture | null {
  const resolve = (name: string) => normalizeTeamName(aliases[name] ?? name);
  const home = resolve(event.homeTeam);
  const away = resolve(event.awayTeam);
  const candidates = fixtures.filter(
    (fixture) =>
      normalizeTeamName(fixture.homeTeam) === home &&
      normalizeTeamName(fixture.awayTeam) === away,
  );
  if (candidates.length === 0) return null;
  const eventTime = new Date(event.commenceTime).getTime();
  let best: SnapshotFixture | null = null;
  let bestGap = Number.POSITIVE_INFINITY;
  for (const fixture of candidates) {
    const gap = Math.abs(new Date(fixture.kickoff).getTime() - eventTime);
    if (gap < bestGap) {
      best = fixture;
      bestGap = gap;
    }
  }
  return bestGap <= 48 * 3600_000 ? best : null;
}

// ─── Odds history ────────────────────────────────────────────────────────────

function samePrices(a: SnapshotOddsEntry, b: SnapshotOddsEntry): boolean {
  return (
    a.moneyline.home === b.moneyline.home &&
    a.moneyline.draw === b.moneyline.draw &&
    a.moneyline.away === b.moneyline.away &&
    a.totals?.line === b.totals?.line &&
    a.totals?.over === b.totals?.over &&
    a.totals?.under === b.totals?.under
  );
}

/**
 * Append an odds snapshot to a fixture's history. Unchanged prices refresh
 * the latest entry's timestamp (it is still current as of now) instead of
 * growing the file; changed prices append, capped to the newest
 * MAX_ODDS_HISTORY entries.
 */
export function appendOddsEntry(
  history: SnapshotOddsEntry[],
  entry: SnapshotOddsEntry,
): SnapshotOddsEntry[] {
  const latest = history[history.length - 1];
  if (latest && samePrices(latest, entry)) {
    return [...history.slice(0, -1), { ...latest, fetchedAt: entry.fetchedAt }];
  }
  return [...history, entry].slice(-MAX_ODDS_HISTORY);
}

// ─── League assembly ─────────────────────────────────────────────────────────

function providerFixtureToSnapshot(
  fixture: ProviderFixture,
  knockoutPattern: RegExp,
): SnapshotFixture {
  return {
    id: fixture.id,
    kickoff: fixture.kickoff,
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    stage: null,
    round: fixture.round,
    knockout: fixture.round !== null && knockoutPattern.test(fixture.round),
    status: fixture.status,
    result: fixture.result,
    lineupsConfirmed: null,
    injuryNotes: [],
    odds: [],
  };
}

function mergeManualFixtures(
  fixtures: SnapshotFixture[],
  manual: ManualFixtureInput[],
  defaults: { allKnockout?: boolean },
  now: string,
  notes: string[],
): SnapshotFixture[] {
  const merged = [...fixtures];
  for (const entry of manual) {
    const existing =
      merged.find((fixture) => fixture.id === entry.id) ??
      merged.find(
        (fixture) =>
          normalizeTeamName(fixture.homeTeam) === normalizeTeamName(entry.homeTeam) &&
          normalizeTeamName(fixture.awayTeam) === normalizeTeamName(entry.awayTeam) &&
          Math.abs(new Date(fixture.kickoff).getTime() - new Date(entry.kickoff).getTime()) <=
            48 * 3600_000,
      );
    if (!existing) {
      merged.push(manualFixtureToSnapshot(entry, defaults, now));
      continue;
    }
    if (entry.odds) {
      existing.odds = appendOddsEntry(existing.odds, manualOddsToEntry(entry.odds, now));
    }
    if (entry.result && !existing.result) {
      existing.result = {
        ninetyMinutes: entry.result.ninetyMinutes,
        afterExtraTime: entry.result.afterExtraTime ?? null,
        penaltyWinner: entry.result.penaltyWinner ?? null,
      };
      existing.status = "finished";
      notes.push(`Result for ${entry.homeTeam} vs ${entry.awayTeam} came from a manual entry.`);
    }
    if (entry.knockout !== undefined) existing.knockout = entry.knockout;
  }
  return merged;
}

function carryForwardHistory(
  fixtures: SnapshotFixture[],
  previousLeague: ScorePoolLeagueSnapshot | undefined,
): void {
  if (!previousLeague) return;
  const previousById = new Map(previousLeague.fixtures.map((fixture) => [fixture.id, fixture]));
  for (const fixture of fixtures) {
    const prior = previousById.get(fixture.id);
    if (!prior) continue;
    // The freshly-built fixture holds this run's odds (if any); the previous
    // snapshot holds everything older. Replay the new entries onto the old
    // history so dedupe and the cap apply consistently.
    const newEntries = fixture.odds;
    fixture.odds = [...prior.odds];
    for (const entry of newEntries) {
      fixture.odds = appendOddsEntry(fixture.odds, entry);
    }
    if (fixture.lineupsConfirmed === null) fixture.lineupsConfirmed = prior.lineupsConfirmed;
    if (fixture.injuryNotes.length === 0) fixture.injuryNotes = prior.injuryNotes;
  }
}

async function buildProviderLeague(
  source: ScorePoolLeagueSource,
  inputs: ScorePoolsBuildInputs,
  now: string,
): Promise<ScorePoolLeagueSnapshot> {
  const fetchImpl = inputs.fetchImpl ?? fetch;
  const previousLeague = inputs.previous?.leagues.find((league) => league.key === source.key);
  const notes: string[] = [];
  const knockoutPattern = new RegExp(
    source.knockoutRoundPattern ?? DEFAULT_KNOCKOUT_PATTERN,
    "i",
  );

  // Fixtures, results, standings.
  let fixtures: SnapshotFixture[] = [];
  let standings: ScorePoolLeagueSnapshot["standings"] = [];
  let fixturesSource = "manual entry";
  if (source.apiFootball && inputs.keys.apiFootball) {
    try {
      const providerFixtures = await fetchApiFootballFixtures(
        source.apiFootball.leagueId,
        source.apiFootball.season,
        inputs.keys.apiFootball,
        fetchImpl,
      );
      fixtures = providerFixtures.map((fixture) =>
        providerFixtureToSnapshot(fixture, knockoutPattern),
      );
      fixturesSource = "API-Football";
      standings = await fetchApiFootballStandings(
        source.apiFootball.leagueId,
        source.apiFootball.season,
        inputs.keys.apiFootball,
        fetchImpl,
      );
    } catch (error) {
      if (previousLeague) {
        // Keep the last good league rather than wiping it.
        return {
          ...previousLeague,
          notes: [
            ...previousLeague.notes.filter((note) => !note.startsWith("Refresh failed")),
            `Refresh failed at ${now}; showing the previous snapshot. (${
              error instanceof Error ? error.message : String(error)
            })`,
          ],
        };
      }
      notes.push(
        `Fixtures fetch failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } else if (source.apiFootball && !inputs.keys.apiFootball) {
    notes.push("API_FOOTBALL_KEY is not set, so fixtures come from manual/CSV entries only.");
  }

  // Manual + CSV entries for this league.
  const manualLeague = inputs.manualLeagues.find((league) => league.key === source.key);
  const manualFixtures = [
    ...(manualLeague?.fixtures ?? []),
    ...(inputs.csvFixturesByLeague[source.key] ?? []),
  ];
  fixtures = mergeManualFixtures(
    fixtures,
    manualFixtures,
    { allKnockout: manualLeague?.allKnockout },
    now,
    notes,
  );
  if (standings.length === 0 && manualLeague?.standings) {
    standings = manualLeague.standings;
  }

  // Fetched odds.
  let oddsSource = "manual entry";
  if (source.theOddsApiSportKey && inputs.keys.theOddsApi) {
    try {
      const events = await fetchTheOddsApiEvents(
        source.theOddsApiSportKey,
        inputs.keys.theOddsApi,
        fetchImpl,
      );
      oddsSource = "The Odds API";
      let unmatched = 0;
      for (const event of events) {
        const fixture = matchFixtureForOdds(fixtures, event, source.teamAliases);
        if (!fixture) {
          unmatched += 1;
          continue;
        }
        fixture.odds = appendOddsEntry(fixture.odds, {
          fetchedAt: now,
          bookmaker: event.bookmaker,
          manual: false,
          moneyline: event.moneyline,
          totals: event.totals,
        });
      }
      if (unmatched > 0) {
        notes.push(
          `${unmatched} odds event(s) had no matching fixture; add teamAliases if names differ between providers.`,
        );
      }
    } catch (error) {
      notes.push(
        `Odds fetch failed: ${error instanceof Error ? error.message : String(error)}. Existing odds history is preserved.`,
      );
    }
  } else if (source.theOddsApiSportKey && !inputs.keys.theOddsApi) {
    notes.push("THE_ODDS_API_KEY is not set, so odds come from manual/CSV entries only.");
  }

  // Injuries and near-kickoff lineups, best-effort.
  if (source.apiFootball && inputs.keys.apiFootball && fixtures.length > 0) {
    try {
      const injuries = await fetchApiFootballInjuries(
        source.apiFootball.leagueId,
        source.apiFootball.season,
        inputs.keys.apiFootball,
        fetchImpl,
      );
      for (const fixture of fixtures) {
        if (fixture.status !== "scheduled") continue;
        const noteList = [
          ...(injuries.get(fixture.homeTeam) ?? []).map((note) => `${fixture.homeTeam}: ${note}`),
          ...(injuries.get(fixture.awayTeam) ?? []).map((note) => `${fixture.awayTeam}: ${note}`),
        ];
        if (noteList.length > 0) fixture.injuryNotes = noteList.slice(0, 8);
      }
    } catch {
      // Injuries are a nice-to-have; skip quietly.
    }

    const nowMs = new Date(now).getTime();
    const imminent = fixtures
      .filter(
        (fixture) =>
          fixture.status === "scheduled" &&
          new Date(fixture.kickoff).getTime() - nowMs < 150 * 60_000 &&
          new Date(fixture.kickoff).getTime() - nowMs > -30 * 60_000 &&
          fixture.id.startsWith("af-"),
      )
      .slice(0, 5);
    for (const fixture of imminent) {
      try {
        fixture.lineupsConfirmed = await fetchApiFootballLineupsConfirmed(
          Number.parseInt(fixture.id.slice(3), 10),
          inputs.keys.apiFootball,
          fetchImpl,
        );
      } catch {
        // Leave null — the recheck list treats unknown lineups as open.
      }
    }
  }

  carryForwardHistory(fixtures, previousLeague);
  fixtures.sort((a, b) => a.kickoff.localeCompare(b.kickoff));

  return {
    key: source.key,
    name: source.name,
    sport: source.sport,
    season: source.season,
    sources: {
      fixtures: fixturesSource,
      odds: oddsSource,
    },
    generatedAt: now,
    sample: false,
    notes,
    fixtures,
    standings,
  };
}

function buildManualLeague(
  league: ManualLeagueInput,
  inputs: ScorePoolsBuildInputs,
  now: string,
): ScorePoolLeagueSnapshot {
  const notes = [...(league.notes ?? [])];
  let fixtures = league.fixtures.map((fixture) =>
    manualFixtureToSnapshot(fixture, { allKnockout: league.allKnockout }, now),
  );
  fixtures = mergeManualFixtures(
    fixtures,
    inputs.csvFixturesByLeague[league.key] ?? [],
    { allKnockout: league.allKnockout },
    now,
    notes,
  );
  carryForwardHistory(
    fixtures,
    inputs.previous?.leagues.find((prev) => prev.key === league.key),
  );
  fixtures.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  return {
    key: league.key,
    name: league.name,
    sport: league.sport ?? "soccer",
    season: league.season ?? null,
    sources: { fixtures: "manual entry", odds: "manual entry" },
    generatedAt: now,
    sample: league.sample ?? false,
    notes,
    fixtures,
    standings: league.standings ?? [],
  };
}

export async function buildScorePoolsSnapshotData(
  inputs: ScorePoolsBuildInputs,
): Promise<ScorePoolsSnapshot> {
  const now = inputs.now ?? new Date().toISOString();
  const leagues: ScorePoolLeagueSnapshot[] = [];
  for (const source of inputs.leagues) {
    leagues.push(await buildProviderLeague(source, inputs, now));
  }
  const providerKeys = new Set(inputs.leagues.map((league) => league.key));
  for (const manualLeague of inputs.manualLeagues) {
    if (!providerKeys.has(manualLeague.key)) {
      leagues.push(buildManualLeague(manualLeague, inputs, now));
    }
  }
  return { generatedAt: now, leagues };
}
