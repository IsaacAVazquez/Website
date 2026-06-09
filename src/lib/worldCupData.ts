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

const KNOCKOUT_ROUNDS: Array<{ id: string; name: string; order: number; test: RegExp }> = [
  { id: "round-of-32", name: "Round of 32", order: 0, test: /round of 32|1\/16/i },
  { id: "round-of-16", name: "Round of 16", order: 1, test: /round of 16|1\/8/i },
  { id: "quarterfinals", name: "Quarterfinals", order: 2, test: /quarter/i },
  { id: "semifinals", name: "Semifinals", order: 3, test: /semi/i },
  { id: "third-place", name: "Third-place match", order: 4, test: /third|3rd/i },
  { id: "final", name: "Final", order: 5, test: /final/i },
];

interface StageInfo {
  stage: string;
  group: string | null;
  knockout: { id: string; name: string; order: number } | null;
}

function classifyStage(headline: string | null | undefined): StageInfo {
  const text = headline ?? "";
  const groupLetter = groupLetterFromName(text);
  if (groupLetter) {
    return { stage: `Group ${groupLetter}`, group: groupLetter, knockout: null };
  }
  // Check the final before the generic round matchers so "Final" doesn't get
  // swallowed by "semiFINAL"/"quarterFINAL"; iterate most-specific first.
  for (const round of [...KNOCKOUT_ROUNDS].reverse()) {
    if (round.test.test(text)) {
      return {
        stage: round.name,
        group: null,
        knockout: { id: round.id, name: round.name, order: round.order },
      };
    }
  }
  return { stage: "Group stage", group: null, knockout: null };
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

function buildFixture(event: EspnEvent): WorldCupFixture | null {
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

  const stageInfo = classifyStage(
    competition?.notes?.[0]?.headline ?? event.name
  );

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
    score: { winner, home: homeScore, away: awayScore },
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
    if (fixture.score.winner === "DRAW" || gf === ga) result = "D";
    else if (
      (isHome && fixture.score.winner === "HOME_TEAM") ||
      (!isHome && fixture.score.winner === "AWAY_TEAM")
    )
      result = "W";
    else result = "L";
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
        "Group standings, the bracket, and scorers fill in here once the tournament kicks off on June 11.",
    };
  }
  const finalFixture = fixtures.find((fixture) => fixture.stage === "Final");
  if (finalFixture && finalFixture.status === "FINISHED") {
    return { phase: "Complete", status: "The tournament is complete." };
  }
  const hasKnockout = fixtures.some((fixture) => fixture.group === null && fixture.stage !== "Group stage");
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
      "Group standings, the bracket, and scorers fill in here once the tournament kicks off on June 11.",
  };
}

// --- Builder -----------------------------------------------------------------

export async function buildWorldCupSnapshotData(): Promise<WorldCupSnapshot> {
  const seedTournament = worldCupSnapshot.tournament;
  const generatedAt = new Date().toISOString();

  const [standingsData, fixtures] = await Promise.all([
    fetchJson<EspnStandingsResponse>(STANDINGS_URL).catch(() => null),
    fetchAllFixtures(seedTournament.startDate, seedTournament.endDate).catch(
      () => [] as WorldCupFixture[]
    ),
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

  // Fall back to fixtures for team options when standings are unavailable.
  for (const fixture of fixtures) {
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
    const info = classifyStage(fixture.stage);
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

  if (teamOptions.length === 0 && fixtures.length === 0) {
    throw new Error(
      "ESPN World Cup feed returned no teams or fixtures; keeping the existing snapshot."
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
