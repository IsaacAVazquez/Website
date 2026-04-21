import { formula1Snapshot } from "@/data/formula1Snapshot";
import type { Formula1MeetingSummary, Formula1Snapshot } from "@/types/formula1";

interface Formula1SnapshotError extends Error {
  status: number;
}

function createFormula1SnapshotError(
  message: string,
  status: number
): Formula1SnapshotError {
  return Object.assign(new Error(message), { status });
}

export function createEmptyFormula1Snapshot(): Formula1Snapshot {
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

export async function getFormula1Snapshot(): Promise<Formula1Snapshot> {
  return formula1Snapshot;
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
