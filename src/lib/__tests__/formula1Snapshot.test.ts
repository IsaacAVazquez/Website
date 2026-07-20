/**
 * @jest-environment node
 */
import type { Formula1MeetingSummary, Formula1RaceResultEntry } from "@/types/formula1";

function buildResultEntry(overrides: Partial<Formula1RaceResultEntry> = {}): Formula1RaceResultEntry {
  return {
    position: 1,
    driverNumber: 4,
    driverName: "Lando Norris",
    broadcastName: "L NORRIS",
    acronym: "NOR",
    teamName: "McLaren",
    teamColor: "#F47600",
    headshotUrl: null,
    lapsCompleted: 57,
    points: 25,
    status: "classified",
    statusLabel: "Finished",
    gapToLeaderLabel: "Leader",
    durationLabel: "1:30:00.000",
    ...overrides,
  };
}

function buildMeeting(overrides: Partial<Formula1MeetingSummary> = {}): Formula1MeetingSummary {
  return {
    key: "1281",
    name: "Japanese Grand Prix",
    officialName: "FORMULA 1 JAPANESE GRAND PRIX 2026",
    location: "Suzuka",
    countryName: "Japan",
    countryCode: "JPN",
    countryFlag: null,
    circuitKey: "46",
    circuitShortName: "Suzuka",
    circuitType: "Permanent",
    circuitImage: null,
    gmtOffset: "09:00:00",
    startAt: "2026-03-27T02:30:00+00:00",
    endAt: "2026-03-29T07:00:00+00:00",
    status: "completed",
    hasSprint: false,
    raceSessionKey: "11253",
    raceStartsAt: "2026-03-29T05:00:00+00:00",
    sessions: [
      {
        key: "11253",
        name: "Race",
        type: "Race",
        startAt: "2026-03-29T05:00:00+00:00",
        endAt: "2026-03-29T07:00:00+00:00",
      },
    ],
    classification: [buildResultEntry()],
    podium: [buildResultEntry()],
    resultPublished: true,
    ...overrides,
  };
}

jest.mock("@/data/formula1Snapshot", () => ({
  formula1Snapshot: {
    sourceLabel: "OpenF1 historical snapshot",
    sourceUrls: {
      docs: "https://openf1.org/docs/",
      apiBase: "https://openf1.org/",
      meetings: "https://api.openf1.org/v1/meetings?year=2026",
      sessions: "https://api.openf1.org/v1/sessions?year=2026",
      drivers: "https://api.openf1.org/v1/drivers?session_key=11253",
      driverStandings: "https://api.openf1.org/v1/championship_drivers?session_key=11253",
      constructorStandings: "https://api.openf1.org/v1/championship_teams?session_key=11253",
    },
    season: 2026,
    generatedAt: "2026-04-15T00:00:00.000Z",
    defaultMeetingKey: "1283",
    standingsMeetingKey: "1281",
    meetings: [
      buildMeeting(),
      buildMeeting({
        key: "1283",
        name: "Saudi Arabian Grand Prix",
        status: "upcoming",
        sessions: [],
        classification: [],
        podium: [],
        resultPublished: false,
      }),
    ],
    driverStandings: [],
    constructorStandings: [],
    seasonMetrics: {
      season: 2026,
      totalRaces: 24,
      completedRaces: 4,
      upcomingRaces: 20,
      sprintWeekends: 6,
    },
    nextMeeting: buildMeeting({
      key: "1283",
      name: "Saudi Arabian Grand Prix",
      status: "upcoming",
      classification: [],
      podium: [],
      resultPublished: false,
    }),
    lastCompletedMeeting: buildMeeting(),
  },
}));

import {
  createEmptyFormula1Meeting,
  createEmptyFormula1Summary,
  getFormula1Meeting,
  getFormula1Summary,
  isFormula1MeetingKeyShape,
  isValidFormula1MeetingKey,
} from "@/lib/formula1Snapshot";

describe("formula1Snapshot accessors", () => {
  it("returns a slim summary whose meetings carry no classification or podium arrays", async () => {
    const summary = await getFormula1Summary();

    expect(summary.meetings).toHaveLength(2);
    for (const meeting of summary.meetings) {
      expect(meeting).not.toHaveProperty("classification");
      expect(meeting).not.toHaveProperty("podium");
    }
    expect(summary.meetings[0]).toEqual(
      expect.objectContaining({
        key: "1281",
        name: "Japanese Grand Prix",
        status: "completed",
        resultPublished: true,
      })
    );
  });

  it("keeps the full next and last-completed meeting detail for first paint", async () => {
    const summary = await getFormula1Summary();

    expect(summary.lastCompletedMeeting?.classification).toHaveLength(1);
    expect(summary.lastCompletedMeeting?.podium).toHaveLength(1);
    expect(summary.nextMeeting?.key).toBe("1283");
    expect(summary.season).toBe(2026);
    expect(summary.generatedAt).toBe("2026-04-15T00:00:00.000Z");
  });

  it("returns one meeting's full detail by key", async () => {
    const meeting = await getFormula1Meeting("1281");

    expect(meeting.name).toBe("Japanese Grand Prix");
    expect(meeting.classification).toHaveLength(1);
    expect(meeting.sessions).toHaveLength(1);
  });

  it("throws a 404-status error for a well-formed but unknown meeting key", async () => {
    await expect(getFormula1Meeting("9999")).rejects.toMatchObject({
      message: expect.stringMatching(/not found/i),
      status: 404,
    });
  });

  it("accepts only positive-integer meeting key shapes", () => {
    expect(isFormula1MeetingKeyShape("1281")).toBe(true);
    expect(isFormula1MeetingKeyShape("9999")).toBe(true);

    expect(isFormula1MeetingKeyShape("")).toBe(false);
    expect(isFormula1MeetingKeyShape("abc")).toBe(false);
    expect(isFormula1MeetingKeyShape("0")).toBe(false);
    expect(isFormula1MeetingKeyShape("01281")).toBe(false);
    expect(isFormula1MeetingKeyShape("-1")).toBe(false);
    expect(isFormula1MeetingKeyShape("1.5")).toBe(false);
    expect(isFormula1MeetingKeyShape("12345678901")).toBe(false);
  });

  it("validates membership only for well-formed keys", () => {
    expect(isValidFormula1MeetingKey("1281")).toBe(true);
    expect(isValidFormula1MeetingKey("1283")).toBe(true);
    expect(isValidFormula1MeetingKey("9999")).toBe(false);
    expect(isValidFormula1MeetingKey("abc")).toBe(false);
  });

  it("provides stable empty payload factories", () => {
    const summary = createEmptyFormula1Summary();
    expect(summary.meetings).toEqual([]);
    expect(summary.driverStandings).toEqual([]);
    expect(summary.constructorStandings).toEqual([]);
    expect(summary.nextMeeting).toBeNull();

    const meeting = createEmptyFormula1Meeting();
    expect(meeting.classification).toEqual([]);
    expect(meeting.podium).toEqual([]);
    expect(meeting.resultPublished).toBe(false);
  });
});
