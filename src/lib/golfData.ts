import type {
  GolfCutState,
  GolfLeaderboardEntry,
  GolfPlayerOption,
  GolfPlayerSnapshot,
  GolfScoringBreakdown,
  GolfSnapshot,
  GolfSummary,
  GolfTournament,
} from "@/types/golf";
import { slugify, toNumber } from "@/lib/utils";

/**
 * Builds the golf snapshot from ESPN's public golf leaderboard endpoint. ESPN's
 * site API needs no token (the NBA pipeline already relies on it). The build
 * tracks whichever PGA Tour event ESPN is featuring — an in-progress event when
 * one exists, otherwise the most recent by start date.
 *
 * Parsing is deliberately defensive: every field is optional-chained with a
 * sensible default, and the builder throws (rather than emit a hollow snapshot)
 * when the leaderboard is too thin to trust. The script wrapper turns that throw
 * into "keep the previous snapshot", so a bad upstream response never wipes good
 * data.
 */

const ESPN_LEADERBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard";
const REQUEST_TIMEOUT_MS = 15_000;
const MIN_LEADERBOARD_SIZE = 5;

// --- ESPN response shapes (only the fields we read) --------------------------

interface EspnFlag {
  alt?: string | null;
}

interface EspnAthlete {
  id?: string | null;
  displayName?: string | null;
  shortName?: string | null;
  flag?: EspnFlag | null;
  citizenship?: string | null;
}

interface EspnPosition {
  id?: string | null;
  displayName?: string | null;
}

interface EspnStatusType {
  state?: string | null;
  completed?: boolean | null;
  description?: string | null;
  detail?: string | null;
}

interface EspnCompetitorStatus {
  position?: EspnPosition | null;
  thru?: number | string | null;
  today?: number | string | null;
  teeTime?: string | null;
  displayValue?: string | null;
  type?: EspnStatusType | null;
}

interface EspnStatistic {
  name?: string | null;
  displayName?: string | null;
  value?: number | string | null;
  displayValue?: string | null;
}

interface EspnLinescore {
  period?: number | null;
  value?: number | null;
  displayValue?: string | null;
}

interface EspnScoreObject {
  value?: number | null;
  displayValue?: string | null;
}

interface EspnCompetitor {
  id?: string | null;
  athlete?: EspnAthlete | null;
  // Team formats (Zurich Classic pairs, Presidents Cup sides) carry a team
  // here and no athlete.
  team?: { displayName?: string | null } | null;
  status?: EspnCompetitorStatus | null;
  score?: number | string | EspnScoreObject | null;
  movement?: number | null;
  linescores?: EspnLinescore[] | null;
  statistics?: EspnStatistic[] | null;
}

interface EspnAddress {
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

interface EspnCourse {
  name?: string | null;
  shotsToPar?: number | null;
  par?: number | null;
  address?: EspnAddress | null;
}

interface EspnCompetitionStatus {
  type?: EspnStatusType | null;
  period?: number | null;
  cutLine?: EspnScoreObject | number | null;
}

interface EspnCompetition {
  date?: string | null;
  competitors?: EspnCompetitor[] | null;
  status?: EspnCompetitionStatus | null;
  venue?: { fullName?: string | null } | null;
}

interface EspnLeague {
  name?: string | null;
  abbreviation?: string | null;
}

interface EspnEvent {
  id?: string | null;
  name?: string | null;
  shortName?: string | null;
  // The leaderboard endpoint sends the start as `date`. `startDate` is kept
  // because the sibling scoreboard endpoint uses it.
  date?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  // False on an opposite-field event played the same week as the main one.
  primary?: boolean | null;
  // Match play nests this as sessions of matches, hence the array member.
  competitions?: Array<EspnCompetition | EspnCompetition[]> | null;
  courses?: EspnCourse[] | null;
  status?: EspnCompetitionStatus | null;
  tournament?: {
    displayName?: string | null;
    // "Medal" is individual stroke play. "Match" (Presidents Cup) and
    // "Teamstroke" (Zurich Classic) have no individual board.
    scoringSystem?: { name?: string | null } | null;
    // ESPN publishes the cut here, not on status: cutScore is the to-par cut
    // (e.g. -3), cutRound the round it applies after, cutCount the survivors.
    // cutRound is a static format field (present even after the event is FINAL),
    // so its presence tells us the format has a cut at all; numberOfRounds
    // confirms ESPN fully described the format.
    cutScore?: EspnScoreObject | number | null;
    cutRound?: number | null;
    cutCount?: number | null;
    numberOfRounds?: number | null;
  } | null;
  league?: EspnLeague | null;
  leagues?: EspnLeague[] | null;
}

interface EspnLeaderboardResponse {
  events?: EspnEvent[] | null;
  leagues?: EspnLeague[] | null;
}

// --- Parsing helpers ---------------------------------------------------------

/** Parses a golf "to par" value (number, "E", "+3", "-8", or score object). */
function parseToPar(
  value: number | string | EspnScoreObject | null | undefined
): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "object") {
    return parseToPar(value.value ?? value.displayValue ?? null);
  }
  const trimmed = value.trim();
  if (trimmed === "" || /^e$/i.test(trimmed)) return 0;
  const parsed = Number(trimmed.replace("+", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatThru(status: EspnCompetitorStatus | null | undefined): string {
  if (status?.type?.state === "post" || status?.type?.completed) return "F";
  const thru = status?.thru;
  if (thru == null || thru === "") return "—";
  const numeric = typeof thru === "number" ? thru : Number(thru);
  if (Number.isFinite(numeric)) {
    if (numeric >= 18) return "F";
    if (numeric <= 0) return "—";
    return String(numeric);
  }
  return String(thru);
}

function formatTeeTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
}

function findStat(
  stats: EspnStatistic[] | null | undefined,
  names: string[]
): number | null {
  if (!stats) return null;
  const match = stats.find((stat) => {
    const key = (stat.name ?? stat.displayName ?? "").toLowerCase();
    return names.includes(key);
  });
  if (!match) return null;
  return toNumber(match.value ?? match.displayValue);
}

function parseCutLine(cut: EspnCompetitionStatus["cutLine"]): number | null {
  if (cut == null) return null;
  if (typeof cut === "number") return Number.isFinite(cut) ? cut : null;
  if (typeof cut.value === "number") return cut.value;
  if (cut.displayValue) {
    const parsed = parseToPar(cut.displayValue);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Resolves a tournament's cut line from ESPN's real shape. ESPN publishes the cut
 * on `event.tournament.cutScore` (a to-par number like -3) and leaves the legacy
 * `status.cutLine` empty, so read the tournament first and only fall back to the
 * status fields for safety. Returns null when no cut score is set — the cut is
 * either not yet made or the event genuinely has none — while preserving an
 * even-par cut of 0 rather than collapsing it to "missing".
 */
export function extractCutScore(
  event: EspnEvent | null | undefined
): number | null {
  if (!event) return null;
  // ESPN sends cutScore 0 beside cutCount 0 before a cut is made and on events
  // that have none, so a score with no survivors is a placeholder.
  const fromTournament =
    event.tournament?.cutCount === 0
      ? null
      : parseCutLine(event.tournament?.cutScore ?? null);
  if (fromTournament != null) return fromTournament;
  return parseCutLine(
    firstCompetition(event)?.status?.cutLine ?? event.status?.cutLine ?? null
  );
}

/**
 * Resolves the cut line into a three-way state so the UI can tell "the cut is
 * still to come" apart from "this event has no cut", instead of collapsing both
 * to a bare "TBD". ESPN carries `cutRound`/`cutCount`/`numberOfRounds` as static
 * format fields on `event.tournament`, so a positive `cutRound` means the format
 * has a cut (pending until `cutScore` is set), and an explicitly absent cut round
 * on an otherwise-described format is a genuine no-cut event. Anything short of
 * that stays "unknown" → the UI shows a neutral "TBD" rather than a false "No cut".
 */
export function deriveCutState(event: EspnEvent | null | undefined): {
  cutLine: number | null;
  cutState: GolfCutState;
  cutCount: number | null;
} {
  const cutLine = extractCutScore(event);
  const tournament = event?.tournament ?? null;
  const cutRound =
    typeof tournament?.cutRound === "number" ? tournament.cutRound : null;
  const cutCount =
    typeof tournament?.cutCount === "number" ? tournament.cutCount : null;
  const describedFormat =
    tournament != null && typeof tournament.numberOfRounds === "number";

  let cutState: GolfCutState;
  if (cutLine != null) {
    cutState = "made";
  } else if (cutRound != null && cutRound > 0) {
    cutState = "pending";
  } else if (describedFormat && (cutRound === null || cutRound === 0)) {
    cutState = "none";
  } else {
    cutState = "unknown";
  }

  return { cutLine, cutState, cutCount: cutLine != null ? cutCount : null };
}

/** `||` rather than `??`, because ESPN can send an empty string. */
function eventStart(event: EspnEvent): string {
  return event.startDate || event.date || "";
}

/**
 * ESPN's tournament.displayName is a legacy label that lags sponsor renames. In
 * the 2026 calendar it was out of date for 22 of 49 events, and it named the
 * FedEx St. Jude Championship "WGC-Bridgestone Invitational", so the event's
 * own name leads.
 */
function eventName(event: EspnEvent): string {
  return event.name || event.tournament?.displayName || event.shortName || "";
}

function firstCompetition(event: EspnEvent): EspnCompetition | null {
  const first = event.competitions?.[0];
  return first && !Array.isArray(first) ? first : null;
}

/**
 * True when the event has no individual stroke-play board. It keys on what
 * ESPN positively reports (the scoring system, nested sessions, or competitors
 * that carry a team), so a field that merely lost its athlete names still
 * fails loudly instead of reading as a team event.
 */
function isTeamFormat(event: EspnEvent): boolean {
  const scoring = event.tournament?.scoringSystem?.name ?? "";
  if (/^(match|teamstroke)$/i.test(scoring)) return true;
  if (Array.isArray(event.competitions?.[0])) return true;
  const entries = firstCompetition(event)?.competitors ?? [];
  return entries.length > 0 && entries.every((entry) => entry.team && !entry.athlete);
}

function eventState(event: EspnEvent): string {
  return (
    firstCompetition(event)?.status?.type?.state ??
    event.status?.type?.state ??
    ""
  );
}

function pickEvent(events: EspnEvent[]): EspnEvent | null {
  if (events.length === 0) return null;
  const inProgress = events.filter(
    (event) =>
      event.status?.type?.state === "in" ||
      firstCompetition(event)?.status?.type?.state === "in"
  );
  // In a week with an opposite-field event, follow the main one.
  const live = inProgress.find((event) => event.primary !== false) ?? inProgress[0];
  if (live) return live;
  // Coerce any unparseable date to 0 so the comparator stays deterministic.
  const startEpoch = (event: EspnEvent) => {
    const ms = new Date(eventStart(event)).getTime();
    return Number.isNaN(ms) ? 0 : ms;
  };
  const sorted = [...events].sort((a, b) => startEpoch(b) - startEpoch(a));
  // A finished board outranks an unstarted field listed beside it.
  const finished = sorted.find((event) => eventState(event) === "post");
  return finished ?? sorted[0] ?? events[0];
}

async function fetchGolfJson<T>(url: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        const error = new Error(
          `ESPN golf request failed with status ${response.status}.`
        );
        // 4xx won't recover on retry; 5xx might.
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

// --- Builder -----------------------------------------------------------------

/**
 * Thrown when ESPN's scoreboard lists only an upcoming event with no field
 * posted yet, which is what the feed looks like between tournaments. The
 * builder treats it as "nothing new to fetch" rather than a broken source.
 */
export class GolfNoLiveEventError extends Error {
  constructor(
    readonly nextEventName: string,
    readonly nextEventDate: string
  ) {
    super(
      `ESPN golf scoreboard has no individual field to score; listed event ${nextEventName} starts ${
        nextEventDate || "on an unannounced date"
      }.`
    );
    this.name = "GolfNoLiveEventError";
  }
}

export async function buildGolfSnapshotData(): Promise<GolfSnapshot> {
  const response = await fetchGolfJson<EspnLeaderboardResponse>(
    ESPN_LEADERBOARD_URL
  );
  const events = (response.events ?? []).filter(
    (event): event is EspnEvent => Boolean(event)
  );
  const event = pickEvent(events);
  if (!event) {
    throw new Error("ESPN golf leaderboard returned no events.");
  }

  const competition = firstCompetition(event);
  const competitors = (competition?.competitors ?? []).filter(
    (competitor) => competitor.athlete?.displayName
  );
  // An unstarted event has no board to score even once its field is posted.
  // Building one from it put a leader at even par and a cut at zero on the page
  // every Tuesday or Wednesday. A team event (Presidents Cup and Zurich
  // Classic, both probed 2026-09-27) has no individual board either.
  if (
    eventState(event) === "pre" ||
    (competitors.length === 0 && isTeamFormat(event))
  ) {
    throw new GolfNoLiveEventError(
      eventName(event) || "the next event",
      (eventStart(event) || competition?.date || "").slice(0, 10)
    );
  }
  if (!competition || competitors.length < MIN_LEADERBOARD_SIZE) {
    throw new Error(
      `Golf leaderboard returned too few competitors (${competitors.length}).`
    );
  }

  const course = event.courses?.[0];
  const coursePar = course?.shotsToPar ?? course?.par ?? 72;
  if (!Number.isFinite(coursePar) || coursePar <= 0) {
    throw new Error("Golf course par is missing from the ESPN response.");
  }

  const generatedAt = new Date().toISOString();
  const name = eventName(event) || "Golf Tournament";
  const tour =
    event.league?.name ??
    event.leagues?.[0]?.name ??
    response.leagues?.[0]?.name ??
    "PGA Tour";
  const location =
    [course?.address?.city, course?.address?.state, course?.address?.country]
      .filter(Boolean)
      .join(", ") ||
    competition.venue?.fullName ||
    "";
  const statusType = competition.status?.type ?? event.status?.type;
  const period = competition.status?.period ?? event.status?.period ?? null;
  // Guard NaN: an invalid (not just missing) startDate must not produce a
  // "tournament-NaN" id.
  // UTC getters: this runs in the build script, which may run from a
  // non-UTC machine, so a local getter could roll the year at a Dec 31/Jan 1
  // build boundary.
  const startDate = eventStart(event);
  const startYear = startDate ? new Date(startDate).getUTCFullYear() : NaN;
  const year = Number.isFinite(startYear)
    ? startYear
    : new Date(generatedAt).getUTCFullYear();

  const cut = deriveCutState(event);
  // A playoff arrives as one more period (the Travelers sent period 5 with a
  // value of 3 strokes), which is extra holes and not a round.
  const scheduledRounds = event.tournament?.numberOfRounds ?? 4;
  const tournament: GolfTournament = {
    id: `${slugify(name) || event.id || "tournament"}-${year}`,
    name,
    tour,
    course: course?.name ?? "",
    coursePar,
    location,
    startDate: Number.isFinite(Date.parse(startDate))
      ? startDate.slice(0, 10)
      : "",
    endDate: Number.isFinite(Date.parse(event.endDate ?? ""))
      ? (event.endDate ?? "").slice(0, 10)
      : "",
    roundLabel: !period
      ? ""
      : period > scheduledRounds
        ? "Playoff"
        : `Round ${period}`,
    status: statusType?.detail ?? statusType?.description ?? "",
    fieldSize: competitors.length,
    cutLine: cut.cutLine,
    cutState: cut.cutState,
    cutCount: cut.cutCount,
    generatedAt,
  };

  const leaderboard: GolfLeaderboardEntry[] = [];
  const players: GolfPlayerOption[] = [];
  const playerSnapshots: Record<string, GolfPlayerSnapshot> = {};
  const usedIds = new Set<string>();

  for (const competitor of competitors) {
    const athlete = competitor.athlete!;
    let id = slugify(athlete.displayName ?? "");
    if (!id) id = athlete.id ? `player-${athlete.id}` : "player";
    if (usedIds.has(id)) {
      let suffix = 2;
      while (usedIds.has(`${id}-${suffix}`)) suffix += 1;
      id = `${id}-${suffix}`;
    }
    usedIds.add(id);

    const country = athlete.flag?.alt ?? athlete.citizenship ?? "";
    const position = competitor.status?.position?.displayName ?? "—";
    const roundScores = (competitor.linescores ?? [])
      .filter((line) => (line.period ?? 1) <= scheduledRounds)
      .map((line) => line.value)
      .filter((value): value is number => typeof value === "number" && value > 0);
    // ESPN's `competitor.score` is the cumulative STROKE total, not a to-par
    // value, so it can't be stored directly. Prefer an explicit to-par stat when
    // one is present; otherwise derive it from completed rounds
    // (cumulativeStrokes - coursePar * roundsPlayed). A player with no completed
    // rounds keeps 0 rather than a bogus negative number.
    const explicitToPar = findStat(competitor.statistics, [
      "scoretopar",
      "topar",
    ]);
    const cumulativeStrokes =
      competitor.score != null ? parseToPar(competitor.score) : null;
    const roundsPlayed = roundScores.length;
    const totalToPar =
      explicitToPar ??
      (cumulativeStrokes != null && roundsPlayed > 0
        ? cumulativeStrokes - coursePar * roundsPlayed
        : findStat(competitor.statistics, ["score"]) ?? 0);
    const today = toNumber(competitor.status?.today);
    const thru = formatThru(competitor.status);
    const movement =
      typeof competitor.movement === "number" ? competitor.movement : 0;
    const statusText =
      competitor.status?.type?.description ??
      competitor.status?.displayValue ??
      (competitor.status?.type?.state === "pre" ? "Scheduled" : "");

    leaderboard.push({
      playerId: id,
      playerName: athlete.displayName ?? "",
      country,
      position,
      totalToPar,
      today,
      thru,
      status: statusText,
      roundScores,
      movement,
    });

    players.push({
      id,
      name: athlete.displayName ?? "",
      country,
      position,
    });

    const birdies = findStat(competitor.statistics, ["birdies"]);
    const eagles = findStat(competitor.statistics, ["eagles"]);
    const bogeys = findStat(competitor.statistics, ["bogeys"]);
    const doubleBogeys = findStat(competitor.statistics, [
      "doublebogeys",
      "double bogeys",
    ]);
    const hasScoringDetail = [birdies, eagles, bogeys, doubleBogeys].some(
      (value) => value != null
    );
    const holesPlayed = roundScores.length * 18;
    const scoring: GolfScoringBreakdown = {
      birdies: birdies ?? 0,
      bogeys: bogeys ?? 0,
      eagles: eagles ?? 0,
      doubleBogeys: doubleBogeys ?? 0,
      pars: hasScoringDetail
        ? Math.max(
            0,
            holesPlayed -
              (birdies ?? 0) -
              (eagles ?? 0) -
              (bogeys ?? 0) -
              (doubleBogeys ?? 0)
          )
        : 0,
    };

    playerSnapshots[id] = {
      player: { id, name: athlete.displayName ?? "", country },
      tournamentStatus: {
        position,
        totalToPar,
        today,
        thru,
        status: statusText,
        movement,
        nextTeeTime: formatTeeTime(competitor.status?.teeTime),
      },
      roundByRound: roundScores.map((score, index) => ({
        round: index + 1,
        score,
        relativeToPar: score - coursePar,
      })),
      scoring,
      generatedAt,
    };
  }

  // ESPN returns competitors in raw response order, so sort ascending by
  // to-par (lowest score leads) before deriving hero stats and returning, so
  // leaderboard[0] is the actual leader. Prefer a numeric finishing position
  // when one parses cleanly; fall back to to-par for ties / unscored players.
  const finishingPosition = (entry: GolfLeaderboardEntry): number => {
    const parsed = Number(entry.position.replace(/[^0-9]/g, ""));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.POSITIVE_INFINITY;
  };
  leaderboard.sort((a, b) => {
    const posDiff = finishingPosition(a) - finishingPosition(b);
    if (posDiff !== 0) return posDiff;
    return a.totalToPar - b.totalToPar;
  });

  const summary: GolfSummary = {
    tournament,
    heroStats: {
      leaderName: leaderboard[0]?.playerName ?? null,
      leaderScore: leaderboard[0]?.totalToPar ?? null,
      playersUnderPar: leaderboard.filter((entry) => entry.totalToPar < 0).length,
      cutLine: tournament.cutLine,
      cutState: tournament.cutState,
      cutCount: tournament.cutCount,
      fieldSize: tournament.fieldSize,
    },
    leaderboard,
    players,
  };

  return { summary, playerSnapshots };
}
