import type { Formula1Snapshot } from "@/types/formula1";
import {
  buildFormula1Href,
  DEFAULT_FORMULA1_STATE,
  normalizeFormula1State,
  resolveFormula1State,
} from "../formula-1-state";

const snapshotFixture: Formula1Snapshot = {
  sourceLabel: "OpenF1 historical snapshot",
  sourceUrls: {
    docs: "https://openf1.org/docs/",
    apiBase: "https://openf1.org/",
    meetings: "https://api.openf1.org/v1/meetings?year=2026",
    sessions: "https://api.openf1.org/v1/sessions?year=2026",
    drivers: "https://api.openf1.org/v1/drivers?session_key=11261",
    driverStandings: "https://api.openf1.org/v1/championship_drivers?session_key=11261",
    constructorStandings: "https://api.openf1.org/v1/championship_teams?session_key=11261",
  },
  season: 2026,
  generatedAt: "2026-04-15T00:00:00.000Z",
  defaultMeetingKey: "1283",
  standingsMeetingKey: "1282",
  meetings: [
    {
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
      sessions: [],
      classification: [],
      podium: [],
      resultPublished: false,
    },
    {
      key: "1283",
      name: "Saudi Arabian Grand Prix",
      officialName: "FORMULA 1 SAUDI ARABIAN GRAND PRIX 2026",
      location: "Jeddah",
      countryName: "Saudi Arabia",
      countryCode: "KSA",
      countryFlag: null,
      circuitKey: "149",
      circuitShortName: "Jeddah",
      circuitType: "Street",
      circuitImage: null,
      gmtOffset: "03:00:00",
      startAt: "2026-04-17T15:00:00+00:00",
      endAt: "2026-04-19T19:00:00+00:00",
      status: "upcoming",
      hasSprint: false,
      raceSessionKey: "11269",
      raceStartsAt: "2026-04-19T17:00:00+00:00",
      sessions: [],
      classification: [],
      podium: [],
      resultPublished: false,
    },
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
  nextMeeting: null,
  lastCompletedMeeting: null,
};

describe("formula-1-state", () => {
  it("normalizes invalid values back to the default route state", () => {
    expect(
      normalizeFormula1State({
        view: "bad",
        meeting: "not-a-meeting",
      })
    ).toEqual(DEFAULT_FORMULA1_STATE);
  });

  it("preserves valid view and meeting values", () => {
    expect(
      normalizeFormula1State({
        view: "drivers",
        meeting: "1281",
      })
    ).toEqual({
      view: "drivers",
      meeting: "1281",
    });
  });

  it("resolves an invalid meeting back to the snapshot default", () => {
    expect(
      resolveFormula1State(
        {
          view: "calendar",
          meeting: "9999",
        },
        snapshotFixture
      )
    ).toEqual({
      view: "calendar",
      meeting: "1283",
    });
  });

  it("builds clean hrefs while preserving unrelated query params", () => {
    expect(
      buildFormula1Href(
        {
          view: "drivers",
          meeting: "1281",
        },
        new URLSearchParams("ref=portfolio"),
        "1283"
      )
    ).toBe("/formula-1?ref=portfolio&view=drivers&meeting=1281");

    expect(
      buildFormula1Href(
        {
          view: "overview",
          meeting: "1283",
        },
        new URLSearchParams("ref=portfolio&view=drivers&meeting=1281"),
        "1283"
      )
    ).toBe("/formula-1?ref=portfolio");
  });
});
