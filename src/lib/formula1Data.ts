import type {
  Formula1ConstructorStanding,
  Formula1DriverStanding,
  Formula1MeetingStatus,
  Formula1MeetingSummary,
  Formula1RaceResultEntry,
  Formula1RaceResultStatus,
  Formula1SeasonMetrics,
  Formula1SessionSummary,
  Formula1Snapshot,
} from "@/types/formula1";

const OPEN_F1_API_BASE_URL = "https://api.openf1.org/v1";
const OPEN_F1_DOCS_URL = "https://openf1.org/docs/";
const OPEN_F1_PROJECT_URL = "https://openf1.org/";
const OPEN_F1_MIN_YEAR = 2023;
const REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_MIN_INTERVAL_MS = 2_100;

interface OpenF1Meeting {
  meeting_key?: number | null;
  meeting_name?: string | null;
  meeting_official_name?: string | null;
  location?: string | null;
  country_code?: string | null;
  country_name?: string | null;
  country_flag?: string | null;
  circuit_key?: number | null;
  circuit_short_name?: string | null;
  circuit_type?: string | null;
  circuit_image?: string | null;
  gmt_offset?: string | null;
  date_start?: string | null;
  date_end?: string | null;
  year?: number | null;
}

interface OpenF1Session {
  session_key?: number | null;
  session_type?: string | null;
  session_name?: string | null;
  date_start?: string | null;
  date_end?: string | null;
  meeting_key?: number | null;
}

interface OpenF1SessionResult {
  position?: number | null;
  driver_number?: number | null;
  number_of_laps?: number | null;
  points?: number | null;
  dnf?: boolean | null;
  dns?: boolean | null;
  dsq?: boolean | null;
  duration?: number | null;
  gap_to_leader?: number | string | null;
}

interface OpenF1DriverStanding {
  driver_number?: number | null;
  position_start?: number | null;
  position_current?: number | null;
  points_start?: number | null;
  points_current?: number | null;
}

interface OpenF1ConstructorStanding {
  team_name?: string | null;
  position_start?: number | null;
  position_current?: number | null;
  points_start?: number | null;
  points_current?: number | null;
}

interface OpenF1Driver {
  driver_number?: number | null;
  broadcast_name?: string | null;
  full_name?: string | null;
  name_acronym?: string | null;
  team_name?: string | null;
  team_colour?: string | null;
  headshot_url?: string | null;
}

interface DriverDirectoryEntry {
  driverName: string;
  broadcastName: string | null;
  acronym: string | null;
  teamName: string | null;
  teamColor: string | null;
  headshotUrl: string | null;
}

interface Formula1DataError extends Error {
  status: number;
}

export interface BuildFormula1SnapshotDataOptions {
  fetchImpl?: typeof fetch;
  now?: Date;
  seasonYear?: number;
  minIntervalMs?: number;
}

function createFormula1DataError(message: string, status: number): Formula1DataError {
  return Object.assign(new Error(message), { status });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeColor(rawColor: string | null | undefined): string | null {
  const trimmed = rawColor?.trim();
  if (!trimmed) {
    return null;
  }

  return /^[0-9a-f]{6}$/i.test(trimmed) ? `#${trimmed.toUpperCase()}` : null;
}

function formatDuration(durationSeconds: number | null | undefined): string | null {
  if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds)) {
    return null;
  }

  const totalMilliseconds = Math.round(durationSeconds * 1_000);
  const hours = Math.floor(totalMilliseconds / 3_600_000);
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMilliseconds % 60_000) / 1_000);
  const milliseconds = totalMilliseconds % 1_000;
  const minuteLabel = String(minutes).padStart(hours > 0 ? 2 : 1, "0");
  const secondLabel = String(seconds).padStart(2, "0");
  const millisecondLabel = String(milliseconds).padStart(3, "0");

  return hours > 0
    ? `${hours}:${minuteLabel}:${secondLabel}.${millisecondLabel}`
    : `${minuteLabel}:${secondLabel}.${millisecondLabel}`;
}

function formatGapToLeader(gap: number | string | null | undefined): string | null {
  if (typeof gap === "string") {
    return gap.trim() || null;
  }

  if (typeof gap !== "number" || !Number.isFinite(gap)) {
    return null;
  }

  if (gap === 0) {
    return "Leader";
  }

  return `+${gap.toFixed(3)}s`;
}

function getResultStatus(result: OpenF1SessionResult): Formula1RaceResultStatus {
  if (result.dsq) {
    return "dsq";
  }

  if (result.dns) {
    return "dns";
  }

  if (result.dnf) {
    return "dnf";
  }

  return "classified";
}

function getResultStatusLabel(status: Formula1RaceResultStatus): string {
  switch (status) {
    case "dnf":
      return "DNF";
    case "dns":
      return "DNS";
    case "dsq":
      return "DSQ";
    case "classified":
    default:
      return "Finished";
  }
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function sortByDateAscending<T extends { date_start?: string | null; date_end?: string | null }>(
  left: T,
  right: T
): number {
  const leftDate = parseDate(left.date_start)?.getTime() ?? parseDate(left.date_end)?.getTime() ?? 0;
  const rightDate =
    parseDate(right.date_start)?.getTime() ?? parseDate(right.date_end)?.getTime() ?? 0;

  return leftDate - rightDate;
}

function sortByDateDescending<T extends { date_end?: string | null; date_start?: string | null }>(
  left: T,
  right: T
): number {
  return sortByDateAscending(right, left);
}

function isGrandPrixMeeting(meeting: OpenF1Meeting): boolean {
  const meetingName = meeting.meeting_name?.trim() ?? "";
  const officialName = meeting.meeting_official_name?.trim() ?? "";
  return meetingName.includes("Grand Prix") || officialName.includes("GRAND PRIX");
}

function isRaceSession(session: OpenF1Session): boolean {
  return (session.session_name?.trim() ?? "") === "Race";
}

function isSprintWeekend(sessions: OpenF1Session[]): boolean {
  return sessions.some((session) => {
    const name = `${session.session_name ?? ""} ${session.session_type ?? ""}`.toLowerCase();
    return name.includes("sprint");
  });
}

function getMeetingStatus(meeting: OpenF1Meeting, now: Date): Formula1MeetingStatus {
  const startDate = parseDate(meeting.date_start);
  const endDate = parseDate(meeting.date_end);
  const nowTimestamp = now.getTime();

  if (startDate && nowTimestamp < startDate.getTime()) {
    return "upcoming";
  }

  if (endDate && nowTimestamp > endDate.getTime()) {
    return "completed";
  }

  return "live";
}

function normalizeSession(session: OpenF1Session): Formula1SessionSummary | null {
  const sessionKey = session.session_key;
  const sessionName = session.session_name?.trim();
  const sessionType = session.session_type?.trim();
  const startAt = session.date_start?.trim();
  const endAt = session.date_end?.trim();

  if (
    typeof sessionKey !== "number" ||
    !sessionName ||
    !sessionType ||
    !startAt ||
    !endAt
  ) {
    return null;
  }

  return {
    key: String(sessionKey),
    name: sessionName,
    type: sessionType,
    startAt,
    endAt,
  };
}

function normalizeRaceResult(
  result: OpenF1SessionResult,
  driverLookup: Map<number, DriverDirectoryEntry>
): Formula1RaceResultEntry | null {
  const driverNumber = result.driver_number;
  if (typeof driverNumber !== "number" || !Number.isFinite(driverNumber)) {
    return null;
  }

  const driver = driverLookup.get(driverNumber);
  const status = getResultStatus(result);

  return {
    position: typeof result.position === "number" ? result.position : null,
    driverNumber,
    driverName: driver?.driverName ?? `Driver ${driverNumber}`,
    broadcastName: driver?.broadcastName ?? null,
    acronym: driver?.acronym ?? null,
    teamName: driver?.teamName ?? null,
    teamColor: driver?.teamColor ?? null,
    headshotUrl: driver?.headshotUrl ?? null,
    lapsCompleted: typeof result.number_of_laps === "number" ? result.number_of_laps : 0,
    points: typeof result.points === "number" ? result.points : 0,
    status,
    statusLabel: getResultStatusLabel(status),
    gapToLeaderLabel: formatGapToLeader(result.gap_to_leader),
    durationLabel: formatDuration(result.duration),
  };
}

function normalizeDriverStanding(
  standing: OpenF1DriverStanding,
  driverLookup: Map<number, DriverDirectoryEntry>
): Formula1DriverStanding | null {
  const driverNumber = standing.driver_number;
  const position = standing.position_current;
  if (
    typeof driverNumber !== "number" ||
    !Number.isFinite(driverNumber) ||
    typeof position !== "number" ||
    !Number.isFinite(position)
  ) {
    return null;
  }

  const driver = driverLookup.get(driverNumber);
  const pointsBeforeRace = typeof standing.points_start === "number" ? standing.points_start : 0;
  const points = typeof standing.points_current === "number" ? standing.points_current : pointsBeforeRace;

  return {
    position,
    previousPosition:
      typeof standing.position_start === "number" ? standing.position_start : null,
    driverNumber,
    driverName: driver?.driverName ?? `Driver ${driverNumber}`,
    broadcastName: driver?.broadcastName ?? null,
    acronym: driver?.acronym ?? null,
    teamName: driver?.teamName ?? "Unknown team",
    teamColor: driver?.teamColor ?? null,
    headshotUrl: driver?.headshotUrl ?? null,
    points,
    pointsBeforeRace,
    pointsDelta: points - pointsBeforeRace,
  };
}

function normalizeConstructorStanding(
  standing: OpenF1ConstructorStanding,
  teamColorLookup: Map<string, string | null>
): Formula1ConstructorStanding | null {
  const teamName = standing.team_name?.trim();
  const position = standing.position_current;

  if (!teamName || typeof position !== "number" || !Number.isFinite(position)) {
    return null;
  }

  const pointsBeforeRace = typeof standing.points_start === "number" ? standing.points_start : 0;
  const points = typeof standing.points_current === "number" ? standing.points_current : pointsBeforeRace;

  return {
    position,
    previousPosition:
      typeof standing.position_start === "number" ? standing.position_start : null,
    teamName,
    teamColor: teamColorLookup.get(teamName) ?? null,
    points,
    pointsBeforeRace,
    pointsDelta: points - pointsBeforeRace,
  };
}

function buildTeamColorLookup(driverLookup: Map<number, DriverDirectoryEntry>): Map<string, string | null> {
  const teamColorLookup = new Map<string, string | null>();

  for (const driver of driverLookup.values()) {
    if (!driver.teamName || teamColorLookup.has(driver.teamName)) {
      continue;
    }

    teamColorLookup.set(driver.teamName, driver.teamColor);
  }

  return teamColorLookup;
}

function createOpenF1Requester(
  fetchImpl: typeof fetch,
  minIntervalMs: number
): <T>(pathname: string, params?: Record<string, string | number>) => Promise<T> {
  let lastRequestStartedAt = 0;

  return async function request<T>(
    pathname: string,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    const nowTimestamp = Date.now();
    const waitTime = Math.max(0, minIntervalMs - (nowTimestamp - lastRequestStartedAt));
    if (waitTime > 0) {
      await sleep(waitTime);
    }

    lastRequestStartedAt = Date.now();

    const normalizedPathname = pathname.replace(/^\/+/, "");
    const url = new URL(normalizedPathname, `${OPEN_F1_API_BASE_URL}/`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetchImpl(url.toString(), {
        headers: {
          accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw createFormula1DataError(
          `Formula 1 data request failed with status ${response.status}.`,
          response.status
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (isObject(error) && error.name === "AbortError") {
        throw createFormula1DataError("Formula 1 data request timed out.", 504);
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  };
}

async function requestCollection<T>(
  request: <T>(pathname: string, params?: Record<string, string | number>) => Promise<T>,
  pathname: string,
  params?: Record<string, string | number>,
  options: {
    allow404?: boolean;
  } = {}
): Promise<T[]> {
  try {
    const payload = await request<unknown>(pathname, params);
    return Array.isArray(payload) ? (payload as T[]) : [];
  } catch (error) {
    if (options.allow404 && isObject(error) && error.status === 404) {
      return [];
    }

    throw error;
  }
}

async function resolveSeasonMeetings(
  request: <T>(pathname: string, params?: Record<string, string | number>) => Promise<T>,
  preferredYear: number
): Promise<{ seasonYear: number; meetings: OpenF1Meeting[] }> {
  for (let year = preferredYear; year >= OPEN_F1_MIN_YEAR; year -= 1) {
    const meetings = (await requestCollection<OpenF1Meeting>(request, "/meetings", { year }))
      .filter(isGrandPrixMeeting)
      .sort(sortByDateAscending);

    if (meetings.length > 0) {
      return { seasonYear: year, meetings };
    }
  }

  throw createFormula1DataError("No Formula 1 season meetings were available to build a snapshot.", 502);
}

function getDefaultMeetingKey(meetings: Formula1MeetingSummary[]): string | null {
  const nextMeeting = meetings.find((meeting) => meeting.status === "upcoming");
  if (nextMeeting) {
    return nextMeeting.key;
  }

  const completedMeetings = meetings.filter((meeting) => meeting.status === "completed");
  if (completedMeetings.length > 0) {
    return completedMeetings.at(-1)?.key ?? null;
  }

  return meetings.find((meeting) => meeting.status === "live")?.key ?? meetings[0]?.key ?? null;
}

export async function buildFormula1SnapshotData(
  options: BuildFormula1SnapshotDataOptions = {}
): Promise<Formula1Snapshot> {
  const now = options.now ?? new Date();
  const seasonYear = options.seasonYear ?? now.getUTCFullYear();
  const fetchImpl = options.fetchImpl ?? fetch;
  const minIntervalMs = options.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
  const request = createOpenF1Requester(fetchImpl, minIntervalMs);
  const { seasonYear: resolvedSeasonYear, meetings: seasonMeetings } = await resolveSeasonMeetings(
    request,
    seasonYear
  );

  const meetingKeySet = new Set(
    seasonMeetings
      .map((meeting) => (typeof meeting.meeting_key === "number" ? meeting.meeting_key : null))
      .filter((meetingKey): meetingKey is number => meetingKey !== null)
  );

  const allSessions = (await requestCollection<OpenF1Session>(request, "/sessions", {
    year: resolvedSeasonYear,
  }))
    .filter((session) => meetingKeySet.has(session.meeting_key ?? -1))
    .sort(sortByDateAscending);

  const sessionsByMeetingKey = new Map<number, OpenF1Session[]>();
  for (const session of allSessions) {
    const meetingKey = session.meeting_key;
    if (typeof meetingKey !== "number") {
      continue;
    }

    const currentSessions = sessionsByMeetingKey.get(meetingKey) ?? [];
    currentSessions.push(session);
    sessionsByMeetingKey.set(meetingKey, currentSessions);
  }

  const raceSessionsDescending = allSessions
    .filter((session) => isRaceSession(session) && parseDate(session.date_end) !== null)
    .filter((session) => (parseDate(session.date_end) ?? now).getTime() <= now.getTime())
    .sort(sortByDateDescending);

  const rawResultsBySessionKey = new Map<number, OpenF1SessionResult[]>();
  let standingsSession: OpenF1Session | null = null;

  for (const session of raceSessionsDescending) {
    const sessionKey = session.session_key;
    if (typeof sessionKey !== "number") {
      continue;
    }

    const results = await requestCollection<OpenF1SessionResult>(
      request,
      "/session_result",
      {
        session_key: sessionKey,
      },
      { allow404: true }
    );
    rawResultsBySessionKey.set(sessionKey, results);

    if (results.length > 0) {
      standingsSession = session;
      break;
    }
  }

  const standingsSessionKey =
    typeof standingsSession?.session_key === "number" ? standingsSession.session_key : null;

  const driverDirectory = new Map<number, DriverDirectoryEntry>();
  if (standingsSessionKey !== null) {
    const drivers = await requestCollection<OpenF1Driver>(request, "/drivers", {
      session_key: standingsSessionKey,
    });

    for (const driver of drivers) {
      const driverNumber = driver.driver_number;
      if (typeof driverNumber !== "number" || !Number.isFinite(driverNumber)) {
        continue;
      }

      driverDirectory.set(driverNumber, {
        driverName: driver.full_name?.trim() || `Driver ${driverNumber}`,
        broadcastName: driver.broadcast_name?.trim() || null,
        acronym: driver.name_acronym?.trim() || null,
        teamName: driver.team_name?.trim() || null,
        teamColor: normalizeColor(driver.team_colour),
        headshotUrl: driver.headshot_url?.trim() || null,
      });
    }
  }

  const teamColorLookup = buildTeamColorLookup(driverDirectory);

  const driverStandings =
    standingsSessionKey === null
      ? []
      : (
          await requestCollection<OpenF1DriverStanding>(request, "/championship_drivers", {
            session_key: standingsSessionKey,
          })
        )
          .map((standing) => normalizeDriverStanding(standing, driverDirectory))
          .filter((standing): standing is Formula1DriverStanding => standing !== null)
          .sort((left, right) => left.position - right.position);

  const constructorStandings =
    standingsSessionKey === null
      ? []
      : (
          await requestCollection<OpenF1ConstructorStanding>(request, "/championship_teams", {
            session_key: standingsSessionKey,
          })
        )
          .map((standing) => normalizeConstructorStanding(standing, teamColorLookup))
          .filter(
            (standing): standing is Formula1ConstructorStanding => standing !== null
          )
          .sort((left, right) => left.position - right.position);

  for (const meeting of seasonMeetings) {
    if (getMeetingStatus(meeting, now) !== "completed") {
      continue;
    }

    const meetingKey = meeting.meeting_key;
    if (typeof meetingKey !== "number") {
      continue;
    }

    const raceSession = (sessionsByMeetingKey.get(meetingKey) ?? []).find(isRaceSession);
    const raceSessionKey = raceSession?.session_key;
    if (
      typeof raceSessionKey !== "number" ||
      rawResultsBySessionKey.has(raceSessionKey)
    ) {
      continue;
    }

    const results = await requestCollection<OpenF1SessionResult>(
      request,
      "/session_result",
      {
        session_key: raceSessionKey,
      },
      { allow404: true }
    );
    rawResultsBySessionKey.set(raceSessionKey, results);
  }

  const normalizedMeetings = seasonMeetings
    .map((meeting) => {
      const meetingKey = meeting.meeting_key;
      const rawSessions =
        typeof meetingKey === "number" ? sessionsByMeetingKey.get(meetingKey) ?? [] : [];
      const normalizedSessions = rawSessions
        .map((session) => normalizeSession(session))
        .filter((session): session is Formula1SessionSummary => session !== null)
        .sort((left, right) => left.startAt.localeCompare(right.startAt));
      const raceSession = rawSessions.find(isRaceSession) ?? null;
      const raceSessionKey =
        typeof raceSession?.session_key === "number" ? raceSession.session_key : null;
      const rawClassification =
        raceSessionKey !== null ? rawResultsBySessionKey.get(raceSessionKey) ?? [] : [];
      const classification = rawClassification
        .map((result) => normalizeRaceResult(result, driverDirectory))
        .filter((result): result is Formula1RaceResultEntry => result !== null)
        .sort((left, right) => {
          const leftPosition = left.position ?? Number.MAX_SAFE_INTEGER;
          const rightPosition = right.position ?? Number.MAX_SAFE_INTEGER;
          return leftPosition - rightPosition || left.driverNumber - right.driverNumber;
        });
      const podium = classification.filter((result) => result.position !== null).slice(0, 3);

      if (
        typeof meetingKey !== "number" ||
        !meeting.meeting_name?.trim() ||
        !meeting.date_start?.trim() ||
        !meeting.date_end?.trim()
      ) {
        return null;
      }

      return {
        key: String(meetingKey),
        name: meeting.meeting_name.trim(),
        officialName: meeting.meeting_official_name?.trim() || meeting.meeting_name.trim(),
        location: meeting.location?.trim() || "Unknown location",
        countryName: meeting.country_name?.trim() || "Unknown country",
        countryCode: meeting.country_code?.trim() || null,
        countryFlag: meeting.country_flag?.trim() || null,
        circuitKey:
          typeof meeting.circuit_key === "number" ? String(meeting.circuit_key) : null,
        circuitShortName: meeting.circuit_short_name?.trim() || "Unknown circuit",
        circuitType: meeting.circuit_type?.trim() || null,
        circuitImage: meeting.circuit_image?.trim() || null,
        gmtOffset: meeting.gmt_offset?.trim() || null,
        startAt: meeting.date_start.trim(),
        endAt: meeting.date_end.trim(),
        status: getMeetingStatus(meeting, now),
        hasSprint: isSprintWeekend(rawSessions),
        raceSessionKey: raceSessionKey !== null ? String(raceSessionKey) : null,
        raceStartsAt: raceSession?.date_start?.trim() || null,
        sessions: normalizedSessions,
        classification,
        podium,
        resultPublished: classification.length > 0,
      } satisfies Formula1MeetingSummary;
    })
    .filter((meeting): meeting is Formula1MeetingSummary => meeting !== null)
    .sort((left, right) => left.startAt.localeCompare(right.startAt));

  const totalRaces = normalizedMeetings.length;
  const completedRaces = normalizedMeetings.filter((meeting) => meeting.status === "completed").length;
  const upcomingRaces = normalizedMeetings.filter((meeting) => meeting.status === "upcoming").length;
  const sprintWeekends = normalizedMeetings.filter((meeting) => meeting.hasSprint).length;
  const seasonMetrics: Formula1SeasonMetrics = {
    season: resolvedSeasonYear,
    totalRaces,
    completedRaces,
    upcomingRaces,
    sprintWeekends,
  };

  const nextMeeting = normalizedMeetings.find((meeting) => meeting.status === "upcoming") ?? null;
  const lastCompletedMeeting =
    normalizedMeetings.filter((meeting) => meeting.status === "completed").at(-1) ?? null;
  const defaultMeetingKey = getDefaultMeetingKey(normalizedMeetings);

  return {
    sourceLabel: "OpenF1 historical snapshot",
    sourceUrls: {
      docs: OPEN_F1_DOCS_URL,
      apiBase: OPEN_F1_PROJECT_URL,
      meetings: `${OPEN_F1_API_BASE_URL}/meetings?year=${resolvedSeasonYear}`,
      sessions: `${OPEN_F1_API_BASE_URL}/sessions?year=${resolvedSeasonYear}`,
      drivers:
        standingsSessionKey === null
          ? `${OPEN_F1_API_BASE_URL}/drivers`
          : `${OPEN_F1_API_BASE_URL}/drivers?session_key=${standingsSessionKey}`,
      driverStandings:
        standingsSessionKey === null
          ? `${OPEN_F1_API_BASE_URL}/championship_drivers`
          : `${OPEN_F1_API_BASE_URL}/championship_drivers?session_key=${standingsSessionKey}`,
      constructorStandings:
        standingsSessionKey === null
          ? `${OPEN_F1_API_BASE_URL}/championship_teams`
          : `${OPEN_F1_API_BASE_URL}/championship_teams?session_key=${standingsSessionKey}`,
    },
    season: resolvedSeasonYear,
    generatedAt: now.toISOString(),
    defaultMeetingKey,
    standingsMeetingKey:
      typeof standingsSession?.meeting_key === "number" ? String(standingsSession.meeting_key) : null,
    meetings: normalizedMeetings,
    driverStandings,
    constructorStandings,
    seasonMetrics,
    nextMeeting,
    lastCompletedMeeting,
  };
}
