import { formula1Snapshot } from "@/data/formula1Snapshot";
import type {
  Formula1MeetingMeta,
  Formula1MeetingSummary,
  Formula1Summary,
} from "@/types/formula1";

interface Formula1SnapshotError extends Error {
  status: number;
}

function createFormula1SnapshotError(
  message: string,
  status: number
): Formula1SnapshotError {
  return Object.assign(new Error(message), { status });
}

export function createEmptyFormula1Summary(): Formula1Summary {
  return {
    sourceLabel: "OpenF1 historical snapshot",
    sourceUrls: {
      docs: "https://openf1.org/docs/",
      apiBase: "https://openf1.org/",
      meetings: "https://api.openf1.org/v1/meetings",
      sessions: "https://api.openf1.org/v1/sessions",
      drivers: "https://api.openf1.org/v1/drivers",
      driverStandings: "https://api.openf1.org/v1/championship_drivers",
      constructorStandings: "https://api.openf1.org/v1/championship_teams",
    },
    season: new Date().getUTCFullYear(),
    generatedAt: new Date().toISOString(),
    defaultMeetingKey: null,
    standingsMeetingKey: null,
    meetings: [],
    driverStandings: [],
    constructorStandings: [],
    seasonMetrics: {
      season: new Date().getUTCFullYear(),
      totalRaces: 0,
      completedRaces: 0,
      upcomingRaces: 0,
      sprintWeekends: 0,
    },
    nextMeeting: null,
    lastCompletedMeeting: null,
  };
}

export function createEmptyFormula1Meeting(): Formula1MeetingSummary {
  return {
    key: "",
    name: "Formula 1 meeting",
    officialName: "",
    location: "",
    countryName: "",
    countryCode: null,
    countryFlag: null,
    circuitKey: null,
    circuitShortName: "",
    circuitType: null,
    circuitImage: null,
    gmtOffset: null,
    startAt: "",
    endAt: "",
    status: "upcoming",
    hasSprint: false,
    raceSessionKey: null,
    raceStartsAt: null,
    sessions: [],
    classification: [],
    podium: [],
    resultPublished: false,
  };
}

function toFormula1MeetingMeta(meeting: Formula1MeetingSummary): Formula1MeetingMeta {
  const { classification: _classification, podium: _podium, ...meta } = meeting;
  return meta;
}

let cachedSummary: Formula1Summary | null = null;

function buildFormula1Summary(): Formula1Summary {
  return {
    ...formula1Snapshot,
    meetings: formula1Snapshot.meetings.map(toFormula1MeetingMeta),
  };
}

/**
 * Slim view of the committed snapshot: hero stats, standings, the meetings
 * list as metadata only, plus the full next/last-completed meeting for first
 * paint. This is the only shape the pages should serialize to the client —
 * per-meeting classifications load on demand via getFormula1Meeting.
 */
export async function getFormula1Summary(): Promise<Formula1Summary> {
  cachedSummary ??= buildFormula1Summary();
  return cachedSummary;
}

// Formula 1 meeting keys are OpenF1 numeric meeting_key values serialized as
// strings ("1279"): positive integers, capped at 10 digits so the regex cannot
// be abused. The shape check runs before membership so route handlers can
// return 400 (bad input) vs 404 (well-formed but unknown key).
const FORMULA1_MEETING_KEY_PATTERN = /^[1-9]\d{0,9}$/;

export function isFormula1MeetingKeyShape(meetingKey: string): boolean {
  return FORMULA1_MEETING_KEY_PATTERN.test(meetingKey);
}

let cachedMeetingKeys: Set<string> | null = null;

function getMeetingKeys(): Set<string> {
  cachedMeetingKeys ??= new Set(formula1Snapshot.meetings.map((meeting) => meeting.key));
  return cachedMeetingKeys;
}

export function isValidFormula1MeetingKey(meetingKey: string): boolean {
  return FORMULA1_MEETING_KEY_PATTERN.test(meetingKey) && getMeetingKeys().has(meetingKey);
}

export async function getFormula1Meeting(
  meetingKey: string
): Promise<Formula1MeetingSummary> {
  const meeting = formula1Snapshot.meetings.find((candidate) => candidate.key === meetingKey);
  if (!meeting) {
    throw createFormula1SnapshotError("Formula 1 meeting snapshot was not found.", 404);
  }

  return meeting;
}
