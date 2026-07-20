import { worldCupSnapshot } from "@/data/worldCupSnapshot";
import type {
  WorldCupFixture,
  WorldCupFixtureTeam,
  WorldCupFormSummary,
  WorldCupGroup,
  WorldCupKnockoutRound,
  WorldCupScorer,
  WorldCupSnapshot,
  WorldCupStandingRow,
  WorldCupTeamOption,
  WorldCupTeamSnapshot,
} from "@/types/worldCup";

/**
 * Builds the World Cup snapshot from ESPN's public soccer/fifa.world endpoints.
 * ESPN's site API needs no token (the NBA and golf pipelines already rely on
 * it). Parsing is deliberately defensive: every field is optional-chained with a
 * sensible default. The builder throws (rather than emit a hollow snapshot) when
 * it can't find any teams or fixtures, and the script wrapper turns that throw
 * into "keep the previous snapshot", so a bad upstream response never wipes the
 * hand-authored seed.
 *
 * The stable tournament facts (host nations, venues, format, dates, match
 * counts) live in the seed and are carried forward on every refresh; only the
 * live phase, status, and generatedAt are recomputed here.
 */

const STANDINGS_URL =
  "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings";
const SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const REQUEST_TIMEOUT_MS = 20_000;

// --- ESPN response shapes (only the fields we read) --------------------------

interface EspnLogo {
  href?: string | null;
}

interface EspnTeam {
  id?: string | null;
  displayName?: string | null;
  shortDisplayName?: string | null;
  name?: string | null;
  abbreviation?: string | null;
  logos?: EspnLogo[] | null;
  logo?: string | null;
}

interface EspnStat {
  name?: string | null;
  abbreviation?: string | null;
  type?: string | null;
  value?: number | string | null;
  displayValue?: string | null;
}

interface EspnStandingsEntry {
  team?: EspnTeam | null;
  stats?: EspnStat[] | null;
}

interface EspnStandingsGroup {
  name?: string | null;
  abbreviation?: string | null;
  standings?: { entries?: EspnStandingsEntry[] | null } | null;
}

interface EspnStandingsResponse {
  children?: EspnStandingsGroup[] | null;
  groups?: EspnStandingsGroup[] | null;
}

interface EspnStatusType {
  state?: string | null;
  completed?: boolean | null;
  description?: string | null;
  name?: string | null;
}

interface EspnCompetitor {
  homeAway?: string | null;
  winner?: boolean | null;
  score?: number | string | null;
  /** Penalty shootout tally; present only on knockout ties decided on pens. */
  shootoutScore?: number | string | null;
  team?: EspnTeam | null;
}

interface EspnNote {
  headline?: string | null;
  type?: string | null;
}

interface EspnCompetition {
  date?: string | null;
  competitors?: EspnCompetitor[] | null;
  venue?: { fullName?: string | null } | null;
  notes?: EspnNote[] | null;
  status?: { type?: EspnStatusType | null } | null;
}

interface EspnEvent {
  id?: string | null;
  date?: string | null;
  name?: string | null;
  shortName?: string | null;
  competitions?: EspnCompetition[] | null;
  status?: { type?: EspnStatusType | null } | null;
}

interface EspnScoreboardResponse {
  events?: EspnEvent[] | null;
}

// --- Parsing helpers ---------------------------------------------------------

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
}

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value).replace("+", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function teamLogo(team: EspnTeam | null | undefined): string | null {
  return team?.logos?.[0]?.href ?? team?.logo ?? null;
}

function teamCode(team: EspnTeam | null | undefined): string {
  return (team?.abbreviation ?? "").toUpperCase();
}

function teamName(team: EspnTeam | null | undefined): string {
  return team?.displayName ?? team?.name ?? team?.shortDisplayName ?? "";
}

function teamShortName(team: EspnTeam | null | undefined): string {
  return team?.shortDisplayName ?? team?.abbreviation ?? teamName(team);
}

function teamSlug(team: EspnTeam | null | undefined): string {
  const name = teamName(team);
  const slug = slugify(name);
  if (slug) return slug;
  return team?.id ? `team-${team.id}` : "team";
}

function findStat(stats: EspnStat[] | null | undefined, names: string[]): number {
  if (!stats) return 0;
  const match = stats.find((stat) => {
    const key = (stat.type ?? stat.name ?? stat.abbreviation ?? "").toLowerCase();
    return names.includes(key);
  });
  if (!match) return 0;
  return toNumber(match.value ?? match.displayValue);
}

function groupLetterFromName(name: string | null | undefined): string {
  const match = (name ?? "").match(/group\s+([a-l])/i);
  return match ? match[1].toUpperCase() : "";
}

/**
 * FIFA's published 2026 calendar, expressed as UTC boundaries. Fixtures are
 * classified by kickoff time because ESPN's note headlines describe the
 * participants' provenance ("RD16 W1 vs RD16 W2", "1A vs 3RD C/E/F/H/I"),
 * not the fixture's own round — text matching filed the whole pre-tournament
 * bracket under the wrong rounds and leaked placeholders as group fixtures.
 *
 * Each boundary sits at 10:00 UTC on the round's first day: the previous
 * round's latest kickoff (a 21:00 Pacific start) lands by ~04:00 UTC and the
 * next round's earliest (a morning Eastern start) after ~13:00 UTC, so every
 * scheduled match falls cleanly on one side.
 */
const KNOCKOUT_WINDOWS: Array<{ id: string; name: string; order: number; from: number }> = [
  { id: "round-of-32", name: "Round of 32", order: 0, from: Date.parse("2026-06-28T10:00:00Z") },
  { id: "round-of-16", name: "Round of 16", order: 1, from: Date.parse("2026-07-04T10:00:00Z") },
  { id: "quarterfinals", name: "Quarterfinals", order: 2, from: Date.parse("2026-07-08T10:00:00Z") },
  { id: "semifinals", name: "Semifinals", order: 3, from: Date.parse("2026-07-13T10:00:00Z") },
  { id: "third-place", name: "Third-place match", order: 4, from: Date.parse("2026-07-17T10:00:00Z") },
  { id: "final", name: "Final", order: 5, from: Date.parse("2026-07-19T10:00:00Z") },
];

interface StageInfo {
  stage: string;
  group: string | null;
  knockout: { id: string; name: string; order: number } | null;
}

export function classifyStageByDate(utcDate: string | null | undefined): StageInfo {
  const timestamp = Date.parse(utcDate ?? "");
  let matched: (typeof KNOCKOUT_WINDOWS)[number] | null = null;
  if (Number.isFinite(timestamp)) {
    for (const window of KNOCKOUT_WINDOWS) {
      if (timestamp >= window.from) matched = window;
    }
  }
  if (!matched) {
    // Group letters come from the standings tables later in the build; the
    // headline text is unreliable for them too.
    return { stage: "Group stage", group: null, knockout: null };
  }
  return {
    stage: matched.name,
    group: null,
    knockout: { id: matched.id, name: matched.name, order: matched.order },
  };
}

function normalizeStatus(type: EspnStatusType | null | undefined): string {
  const state = type?.state;
  if (state === "post" || type?.completed) return "FINISHED";
  if (state === "in") return "IN_PLAY";
  return "SCHEDULED";
}

function fixtureTeam(competitor: EspnCompetitor | undefined): WorldCupFixtureTeam {
  const team = competitor?.team;
  return {
    id: teamSlug(team),
    code: teamCode(team),
    shortName: teamShortName(team),
    crest: teamLogo(team),
  };
}

export function buildFixture(event: EspnEvent): WorldCupFixture | null {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const home = competitors.find((c) => c.homeAway === "home") ?? competitors[0];
  const away = competitors.find((c) => c.homeAway === "away") ?? competitors[1];
  if (!home || !away) return null;

  const status = normalizeStatus(
    competition?.status?.type ?? event.status?.type
  );
  const homeScore = home.score != null ? toNumber(home.score) : null;
  const awayScore = away.score != null ? toNumber(away.score) : null;
  // Penalty shootout tallies (null when absent, never 0-defaulted): a knockout
  // tie level after regulation and extra time is decided on penalties, and
  // ESPN reports each side's count here. Without them a "1-1" result with a
  // winner renders as a bare draw. Only home/away goals default to 0 elsewhere;
  // a missing shootout must stay null so we can tell "no shootout" from "0".
  const homeShootout =
    home.shootoutScore != null ? toNumber(home.shootoutScore) : null;
  const awayShootout =
    away.shootoutScore != null ? toNumber(away.shootoutScore) : null;
  const hasShootout = homeShootout != null || awayShootout != null;
  let winner: WorldCupFixture["score"]["winner"] = null;
  if (status === "FINISHED") {
    if (home.winner) winner = "HOME_TEAM";
    else if (away.winner) winner = "AWAY_TEAM";
    else if (homeScore != null && awayScore != null) {
      winner =
        homeScore > awayScore
          ? "HOME_TEAM"
          : awayScore > homeScore
            ? "AWAY_TEAM"
            : "DRAW";
    }
  }

  const stageInfo = classifyStageByDate(competition?.date ?? event.date);

  return {
    id: event.id ?? `${event.date ?? ""}-${teamSlug(home.team)}`,
    utcDate: competition?.date ?? event.date ?? "",
    status,
    stage: stageInfo.stage,
    group: stageInfo.group,
    matchday: null,
    venue: competition?.venue?.fullName ?? null,
    homeTeam: fixtureTeam(home),
    awayTeam: fixtureTeam(away),
    score: {
      winner,
      home: homeScore,
      away: awayScore,
      // Keep regular-time results byte-identical to before by only adding the
      // shootout fields when a shootout actually happened.
      ...(hasShootout
        ? { shootoutHome: homeShootout, shootoutAway: awayShootout }
        : {}),
    },
  };
}

function formatYyyymmdd(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

async function fetchJson<T>(url: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        const error = new Error(
          `ESPN World Cup request failed with status ${response.status}.`
        );
        (error as { retryable?: boolean }).retryable = response.status >= 500;
        throw error;
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      const isTimeout =
        error instanceof Error &&
        (error.name === "AbortError" || error.name === "TimeoutError");
      const isNetwork = error instanceof TypeError;
      const isRetryable = Boolean((error as { retryable?: boolean })?.retryable);
      if (attempt < 2 && (isTimeout || isNetwork || isRetryable)) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/** Pull every event across the tournament window in ~10-day scoreboard pages. */
async function fetchAllFixtures(
  startDate: string,
  endDate: string
): Promise<WorldCupFixture[]> {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const byId = new Map<string, WorldCupFixture>();

  for (
    let cursor = new Date(start);
    cursor <= end;
    cursor.setUTCDate(cursor.getUTCDate() + 10)
  ) {
    const windowEnd = new Date(cursor);
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 9);
    const clampedEnd = windowEnd > end ? end : windowEnd;
    const range = `${formatYyyymmdd(cursor)}-${formatYyyymmdd(clampedEnd)}`;
    const data = await fetchJson<EspnScoreboardResponse>(
      `${SCOREBOARD_URL}?dates=${range}`
    );
    for (const event of data.events ?? []) {
      const fixture = buildFixture(event);
      if (fixture && fixture.id && !byId.has(fixture.id)) {
        byId.set(fixture.id, fixture);
      }
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  );
}

function buildStandingRow(
  entry: EspnStandingsEntry,
  rank: number
): WorldCupStandingRow {
  const team = entry.team;
  const wins = findStat(entry.stats, ["wins"]);
  const draws = findStat(entry.stats, ["ties", "draws"]);
  const losses = findStat(entry.stats, ["losses"]);
  const goalsFor = findStat(entry.stats, ["pointsfor", "goalsfor"]);
  const goalsAgainst = findStat(entry.stats, ["pointsagainst", "goalsagainst"]);
  const played =
    findStat(entry.stats, ["gamesplayed"]) || wins + draws + losses;
  const points =
    findStat(entry.stats, ["points"]) || wins * 3 + draws;
  const goalDifference =
    findStat(entry.stats, ["pointdifferential", "goaldifference"]) ||
    goalsFor - goalsAgainst;

  return {
    teamId: teamSlug(team),
    name: teamName(team),
    code: teamCode(team),
    crest: teamLogo(team),
    rank: findStat(entry.stats, ["rank"]) || rank,
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDifference,
    points,
    form: [],
  };
}

function deriveForm(
  teamId: string,
  fixtures: WorldCupFixture[]
): WorldCupFormSummary {
  const finished = fixtures
    .filter(
      (fixture) =>
        fixture.status === "FINISHED" &&
        (fixture.homeTeam.id === teamId || fixture.awayTeam.id === teamId)
    )
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

  const summary: WorldCupFormSummary = {
    sequence: [],
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  };

  for (const fixture of finished) {
    const isHome = fixture.homeTeam.id === teamId;
    const gf = (isHome ? fixture.score.home : fixture.score.away) ?? 0;
    const ga = (isHome ? fixture.score.away : fixture.score.home) ?? 0;
    summary.goalsFor += gf;
    summary.goalsAgainst += ga;
    let result: "W" | "D" | "L";
    const winner = fixture.score.winner;
    // Check the winner flag before comparing goals: a knockout tie that is
    // level after extra time and decided on penalties has gf === ga but a
    // real winner, and must not be recorded as a draw.
    if (winner === "HOME_TEAM" || winner === "AWAY_TEAM") {
      result =
        (isHome && winner === "HOME_TEAM") || (!isHome && winner === "AWAY_TEAM")
          ? "W"
          : "L";
    } else if (winner === "DRAW" || gf === ga) {
      result = "D";
    } else {
      result = gf > ga ? "W" : "L";
    }
    summary.sequence.push(result);
    if (result === "W") summary.wins += 1;
    else if (result === "D") summary.draws += 1;
    else summary.losses += 1;
  }

  summary.sequence = summary.sequence.slice(-5);
  return summary;
}

function computePhase(
  fixtures: WorldCupFixture[]
): { phase: string; status: string } {
  if (fixtures.length === 0) {
    return {
      phase: "Upcoming",
      status:
        "Group standings and the bracket fill in here once the tournament kicks off on June 11.",
    };
  }
  // Pick the latest-dated "Final" so a single fixture is selected even if the
  // feed ever labels more than one match "Final" (and so we never mistake an
  // earlier-round match for the final).
  const finalFixture = fixtures
    .filter((fixture) => fixture.stage === "Final")
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())[0];
  if (finalFixture && finalFixture.status === "FINISHED") {
    return { phase: "Complete", status: "The tournament is complete." };
  }
  // ESPN publishes the full bracket skeleton (SCHEDULED placeholders) before the
  // group stage even starts, so require a knockout fixture that has actually
  // kicked off before declaring the knockout phase.
  const hasKnockout = fixtures.some(
    (fixture) =>
      fixture.group === null &&
      fixture.stage !== "Group stage" &&
      fixture.status !== "SCHEDULED"
  );
  const anyStarted = fixtures.some((fixture) => fixture.status !== "SCHEDULED");
  if (hasKnockout && anyStarted) {
    return {
      phase: "Knockout stage",
      status: "The knockout bracket is underway.",
    };
  }
  if (anyStarted) {
    return { phase: "Group stage", status: "The group stage is underway." };
  }
  return {
    phase: "Upcoming",
    status:
      "Group standings and the bracket fill in here once the tournament kicks off on June 11.",
  };
}

// --- Builder -----------------------------------------------------------------

export async function buildWorldCupSnapshotData(): Promise<WorldCupSnapshot> {
  const seedTournament = worldCupSnapshot.tournament;
  const generatedAt = new Date().toISOString();

  // Both sources must succeed. Swallowing one fetch failure and building from
  // the other commits a half-wiped snapshot (no groups, or no fixtures) over
  // previously good data — throwing here lets the build script keep the
  // existing snapshot instead.
  const [standingsData, fixtures] = await Promise.all([
    fetchJson<EspnStandingsResponse>(STANDINGS_URL),
    fetchAllFixtures(seedTournament.startDate, seedTournament.endDate),
  ]);

  // Build groups + team options from the standings response.
  const rawGroups = standingsData?.children ?? standingsData?.groups ?? [];
  const groups: WorldCupGroup[] = [];
  const teamOptionById = new Map<string, WorldCupTeamOption>();

  for (const rawGroup of rawGroups) {
    const letter = groupLetterFromName(rawGroup.name) || (rawGroup.abbreviation ?? "");
    const entries = rawGroup.standings?.entries ?? [];
    const standings = entries
      .map((entry, index) => buildStandingRow(entry, index + 1))
      .filter((row) => row.teamId && row.name)
      .sort((a, b) => a.rank - b.rank);
    if (standings.length === 0) continue;

    for (const row of standings) {
      row.form = deriveForm(row.teamId, fixtures).sequence;
      teamOptionById.set(row.teamId, {
        id: row.teamId,
        name: row.name,
        code: row.code,
        group: letter,
        crest: row.crest,
      });
    }

    groups.push({
      letter,
      name: letter ? `Group ${letter}` : rawGroup.name ?? "Group",
      standings,
    });
  }

  groups.sort((a, b) => a.letter.localeCompare(b.letter));

  // Group letters come from the standings tables: assign them to group-stage
  // fixtures by team membership (ESPN's fixture text doesn't carry the
  // fixture's own group reliably).
  const groupByTeam = new Map<string, string>();
  for (const group of groups) {
    if (!group.letter) continue;
    for (const row of group.standings) groupByTeam.set(row.teamId, group.letter);
  }
  for (const fixture of fixtures) {
    if (fixture.group || fixture.stage !== "Group stage") continue;
    fixture.group =
      groupByTeam.get(fixture.homeTeam.id) ??
      groupByTeam.get(fixture.awayTeam.id) ??
      null;
  }

  // Fall back to fixtures for team options when standings are unavailable.
  // Only group-stage fixtures carry real teams; knockout fixtures use ESPN
  // bracket placeholders ("QF W1", "1E", "3RD A/B/C") that must not become
  // selectable teams. Every real team appears in group-stage fixtures, so this
  // still fully populates the fallback.
  for (const fixture of fixtures) {
    if (fixture.stage !== "Group stage") continue;
    for (const team of [fixture.homeTeam, fixture.awayTeam]) {
      if (!team.id || teamOptionById.has(team.id)) continue;
      teamOptionById.set(team.id, {
        id: team.id,
        name: team.shortName || team.code,
        code: team.code,
        group: fixture.group ?? "",
        crest: team.crest,
      });
    }
  }

  // Knockout rounds, grouped by round and ordered earliest to latest.
  const knockoutByRound = new Map<string, WorldCupKnockoutRound>();
  for (const fixture of fixtures) {
    const info = classifyStageByDate(fixture.utcDate);
    if (!info.knockout) continue;
    const existing = knockoutByRound.get(info.knockout.id);
    if (existing) {
      existing.fixtures.push(fixture);
    } else {
      knockoutByRound.set(info.knockout.id, {
        id: info.knockout.id,
        name: info.knockout.name,
        order: info.knockout.order,
        fixtures: [fixture],
      });
    }
  }
  const knockout = Array.from(knockoutByRound.values()).sort(
    (a, b) => a.order - b.order
  );

  const finished = fixtures
    .filter((fixture) => fixture.status === "FINISHED")
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime());
  const upcoming = fixtures
    .filter((fixture) => fixture.status !== "FINISHED")
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

  // Per-team snapshots.
  const teamSnapshots: Record<string, WorldCupTeamSnapshot> = {};
  const standingByTeam = new Map<string, WorldCupStandingRow>();
  for (const group of groups) {
    for (const row of group.standings) standingByTeam.set(row.teamId, row);
  }

  for (const option of teamOptionById.values()) {
    const teamFixtures = fixtures.filter(
      (fixture) =>
        fixture.homeTeam.id === option.id || fixture.awayTeam.id === option.id
    );
    teamSnapshots[option.id] = {
      team: {
        id: option.id,
        name: option.name,
        code: option.code,
        group: option.group,
        crest: option.crest,
      },
      standing: standingByTeam.get(option.id) ?? null,
      recentFixtures: teamFixtures
        .filter((fixture) => fixture.status === "FINISHED")
        .sort(
          (a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime()
        ),
      upcomingFixtures: teamFixtures
        .filter((fixture) => fixture.status !== "FINISHED")
        .sort(
          (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
        ),
      form: deriveForm(option.id, fixtures),
      generatedAt,
    };
  }

  // Top scorers are best-effort: derive own-goal-free goal counts from finished
  // fixtures isn't possible without lineup data, so scorers stay empty until a
  // reliable source is wired in. The UI degrades gracefully when empty.
  const scorers: WorldCupScorer[] = [];

  const teamOptions = Array.from(teamOptionById.values()).sort((a, b) => {
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    return a.name.localeCompare(b.name);
  });

  // Either section coming back empty while the other has data means a partial
  // ESPN outage — keep the existing snapshot rather than committing a
  // half-wiped one. (Before ESPN publishes anything, both are empty and the
  // seed is preserved the same way.)
  if (teamOptions.length === 0 || fixtures.length === 0) {
    throw new Error(
      "ESPN World Cup feed returned no teams or no fixtures; keeping the existing snapshot."
    );
  }

  const { phase, status } = computePhase(fixtures);

  return {
    tournament: {
      ...seedTournament,
      phase,
      status,
      generatedAt,
    },
    groups,
    knockout,
    recentFixtures: finished,
    upcomingFixtures: upcoming,
    scorers,
    teamOptions,
    teamSnapshots,
  };
}
