import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Formula1Snapshot } from "@/types/formula1";
import { Formula1Client } from "../formula-1-client";
import { DEFAULT_FORMULA1_STATE } from "../formula-1-state";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

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
      sessions: [
        {
          key: "11253",
          name: "Race",
          type: "Race",
          startAt: "2026-03-29T05:00:00+00:00",
          endAt: "2026-03-29T07:00:00+00:00",
        },
      ],
      classification: [
        {
          position: 1,
          driverNumber: 63,
          driverName: "George RUSSELL",
          broadcastName: "G RUSSELL",
          acronym: "RUS",
          teamName: "Mercedes",
          teamColor: "#00D7B6",
          headshotUrl: null,
          lapsCompleted: 53,
          points: 25,
          status: "classified",
          statusLabel: "Finished",
          gapToLeaderLabel: "Leader",
          durationLabel: "1:28:03.403",
        },
      ],
      podium: [
        {
          position: 1,
          driverNumber: 63,
          driverName: "George RUSSELL",
          broadcastName: "G RUSSELL",
          acronym: "RUS",
          teamName: "Mercedes",
          teamColor: "#00D7B6",
          headshotUrl: null,
          lapsCompleted: 53,
          points: 25,
          status: "classified",
          statusLabel: "Finished",
          gapToLeaderLabel: "Leader",
          durationLabel: "1:28:03.403",
        },
      ],
      resultPublished: true,
    },
    {
      key: "1282",
      name: "Bahrain Grand Prix",
      officialName: "FORMULA 1 BAHRAIN GRAND PRIX 2026",
      location: "Sakhir",
      countryName: "Bahrain",
      countryCode: "BRN",
      countryFlag: null,
      circuitKey: "63",
      circuitShortName: "Sakhir",
      circuitType: "Permanent",
      circuitImage: null,
      gmtOffset: "03:00:00",
      startAt: "2026-04-10T11:30:00+00:00",
      endAt: "2026-04-12T17:00:00+00:00",
      status: "completed",
      hasSprint: true,
      raceSessionKey: "11261",
      raceStartsAt: "2026-04-12T15:00:00+00:00",
      sessions: [
        {
          key: "11261",
          name: "Race",
          type: "Race",
          startAt: "2026-04-12T15:00:00+00:00",
          endAt: "2026-04-12T17:00:00+00:00",
        },
      ],
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
      sessions: [
        {
          key: "11269",
          name: "Race",
          type: "Race",
          startAt: "2026-04-19T17:00:00+00:00",
          endAt: "2026-04-19T19:00:00+00:00",
        },
      ],
      classification: [],
      podium: [],
      resultPublished: false,
    },
  ],
  driverStandings: [
    {
      position: 1,
      previousPosition: 2,
      driverNumber: 4,
      driverName: "Lando NORRIS",
      broadcastName: "L NORRIS",
      acronym: "NOR",
      teamName: "McLaren",
      teamColor: "#F47600",
      headshotUrl: null,
      points: 76,
      pointsBeforeRace: 51,
      pointsDelta: 25,
    },
    {
      position: 2,
      previousPosition: 1,
      driverNumber: 63,
      driverName: "George RUSSELL",
      broadcastName: "G RUSSELL",
      acronym: "RUS",
      teamName: "Mercedes",
      teamColor: "#00D7B6",
      headshotUrl: null,
      points: 74,
      pointsBeforeRace: 59,
      pointsDelta: 15,
    },
  ],
  constructorStandings: [
    {
      position: 1,
      previousPosition: 2,
      teamName: "McLaren",
      teamColor: "#F47600",
      points: 132,
      pointsBeforeRace: 89,
      pointsDelta: 43,
    },
    {
      position: 2,
      previousPosition: 1,
      teamName: "Mercedes",
      teamColor: "#00D7B6",
      points: 113,
      pointsBeforeRace: 98,
      pointsDelta: 15,
    },
  ],
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

describe("Formula1Client", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  it("renders the hero without rewriting the default route", async () => {
    render(<Formula1Client initialState={DEFAULT_FORMULA1_STATE} snapshot={snapshotFixture} />);

    expect(screen.getByRole("heading", { name: "Formula 1 Pulse" })).toBeInTheDocument();
    await waitFor(() => expect(mockReplace).not.toHaveBeenCalled());
  });

  it("canonicalizes invalid query params back to the default route", async () => {
    currentSearchParams = new URLSearchParams("view=bad&meeting=nope");

    render(<Formula1Client initialState={DEFAULT_FORMULA1_STATE} snapshot={snapshotFixture} />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/formula-1", { scroll: false })
    );
  });

  it("keeps the selected meeting when switching views", async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams("meeting=1281");

    render(<Formula1Client initialState={DEFAULT_FORMULA1_STATE} snapshot={snapshotFixture} />);

    await user.click(screen.getByRole("button", { name: "Drivers" }));

    const [href, options] = mockPush.mock.calls.at(-1) ?? [];
    expect(options).toEqual({ scroll: false });
    expect(href).toMatch(/^\/formula-1\?/);

    const nextParams = new URLSearchParams(href.split("?")[1] ?? "");
    expect(nextParams.get("view")).toBe("drivers");
    expect(nextParams.get("meeting")).toBe("1281");
  });

  it("updates the URL when selecting a different race strip meeting", async () => {
    const user = userEvent.setup();

    render(<Formula1Client initialState={DEFAULT_FORMULA1_STATE} snapshot={snapshotFixture} />);

    await user.click(screen.getByRole("button", { name: /Japanese Grand Prix/i }));

    expect(mockPush).toHaveBeenCalledWith("/formula-1?meeting=1281", {
      scroll: false,
    });
  });
});
