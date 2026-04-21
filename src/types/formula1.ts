export type Formula1View = "overview" | "drivers" | "constructors" | "calendar";

export interface Formula1RouteState {
  view: Formula1View;
  meeting: string | null;
}

export type Formula1MeetingStatus = "completed" | "upcoming" | "live";

export interface Formula1SessionSummary {
  key: string;
  name: string;
  type: string;
  startAt: string;
  endAt: string;
}

export type Formula1RaceResultStatus = "classified" | "dnf" | "dns" | "dsq";

export interface Formula1RaceResultEntry {
  position: number | null;
  driverNumber: number;
  driverName: string;
  broadcastName: string | null;
  acronym: string | null;
  teamName: string | null;
  teamColor: string | null;
  headshotUrl: string | null;
  lapsCompleted: number;
  points: number;
  status: Formula1RaceResultStatus;
  statusLabel: string;
  gapToLeaderLabel: string | null;
  durationLabel: string | null;
}

export interface Formula1MeetingSummary {
  key: string;
  name: string;
  officialName: string;
  location: string;
  countryName: string;
  countryCode: string | null;
  countryFlag: string | null;
  circuitKey: string | null;
  circuitShortName: string;
  circuitType: string | null;
  circuitImage: string | null;
  gmtOffset: string | null;
  startAt: string;
  endAt: string;
  status: Formula1MeetingStatus;
  hasSprint: boolean;
  raceSessionKey: string | null;
  raceStartsAt: string | null;
  sessions: Formula1SessionSummary[];
  classification: Formula1RaceResultEntry[];
  podium: Formula1RaceResultEntry[];
  resultPublished: boolean;
}

export interface Formula1DriverStanding {
  position: number;
  previousPosition: number | null;
  driverNumber: number;
  driverName: string;
  broadcastName: string | null;
  acronym: string | null;
  teamName: string;
  teamColor: string | null;
  headshotUrl: string | null;
  points: number;
  pointsBeforeRace: number;
  pointsDelta: number;
}

export interface Formula1ConstructorStanding {
  position: number;
  previousPosition: number | null;
  teamName: string;
  teamColor: string | null;
  points: number;
  pointsBeforeRace: number;
  pointsDelta: number;
}

export interface Formula1SeasonMetrics {
  season: number;
  totalRaces: number;
  completedRaces: number;
  upcomingRaces: number;
  sprintWeekends: number;
}

export interface Formula1SnapshotSourceUrls {
  docs: string;
  apiBase: string;
  meetings: string;
  sessions: string;
  drivers: string;
  driverStandings: string;
  constructorStandings: string;
}

export interface Formula1Snapshot {
  sourceLabel: string;
  sourceUrls: Formula1SnapshotSourceUrls;
  season: number;
  generatedAt: string;
  defaultMeetingKey: string | null;
  standingsMeetingKey: string | null;
  meetings: Formula1MeetingSummary[];
  driverStandings: Formula1DriverStanding[];
  constructorStandings: Formula1ConstructorStanding[];
  seasonMetrics: Formula1SeasonMetrics;
  nextMeeting: Formula1MeetingSummary | null;
  lastCompletedMeeting: Formula1MeetingSummary | null;
}
