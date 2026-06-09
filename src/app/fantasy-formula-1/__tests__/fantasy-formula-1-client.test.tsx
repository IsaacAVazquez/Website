import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Formula1DriverStanding, Formula1Snapshot } from "@/types/formula1";
import { getFantasyFormula1StorageKey } from "@/lib/fantasyFormula1";
import { FantasyFormula1Client } from "../fantasy-formula-1-client";
import { DEFAULT_FANTASY_FORMULA1_STATE } from "../fantasy-formula-1-state";

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

function driver(
  position: number,
  driverNumber: number,
  driverName: string,
  acronym: string,
  teamName: string,
  points: number,
  pointsDelta: number
): Formula1DriverStanding {
  return {
    position,
    previousPosition: position + 1,
    driverNumber,
    driverName,
    broadcastName: `${driverName.charAt(0)} ${driverName.split(" ").at(-1) ?? driverName}`,
    acronym,
    teamName,
    teamColor: null,
    headshotUrl: null,
    points,
    pointsBeforeRace: points - pointsDelta,
    pointsDelta,
  };
}

function createSnapshot(overrides: Partial<Formula1Snapshot> = {}): Formula1Snapshot {
  const snapshot: Formula1Snapshot = {
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
    season: 2026,
    generatedAt: "2026-04-15T00:00:00.000Z",
    defaultMeetingKey: "1283",
    standingsMeetingKey: "1282",
    meetings: [],
    driverStandings: [
      driver(1, 4, "Lando Norris", "NOR", "McLaren", 90, 25),
      driver(2, 63, "George Russell", "RUS", "Mercedes", 72, 18),
      driver(3, 16, "Charles Leclerc", "LEC", "Ferrari", 55, 12),
      driver(4, 12, "Kimi Antonelli", "ANT", "Mercedes", 40, 8),
      driver(5, 87, "Oliver Bearman", "BEA", "Haas", 25, 6),
      driver(6, 77, "Valtteri Bottas", "BOT", "Cadillac", 8, 2),
    ],
    constructorStandings: [
      {
        position: 1,
        previousPosition: 1,
        teamName: "McLaren",
        teamColor: null,
        points: 130,
        pointsBeforeRace: 90,
        pointsDelta: 40,
      },
      {
        position: 2,
        previousPosition: 2,
        teamName: "Mercedes",
        teamColor: null,
        points: 112,
        pointsBeforeRace: 86,
        pointsDelta: 26,
      },
      {
        position: 3,
        previousPosition: 4,
        teamName: "Cadillac",
        teamColor: null,
        points: 18,
        pointsBeforeRace: 12,
        pointsDelta: 6,
      },
    ],
    seasonMetrics: {
      season: 2026,
      totalRaces: 24,
      completedRaces: 4,
      upcomingRaces: 20,
      sprintWeekends: 6,
    },
    nextMeeting: {
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
      hasSprint: true,
      raceSessionKey: "11269",
      raceStartsAt: "2026-04-19T17:00:00+00:00",
      sessions: [],
      classification: [],
      podium: [],
      resultPublished: false,
    },
    lastCompletedMeeting: null,
  };

  return { ...snapshot, ...overrides };
}

describe("FantasyFormula1Client", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockClear();
    mockReplace.mockClear();
    window.localStorage.clear();
  });

  it("selects, removes, and persists lineup assets", async () => {
    const user = userEvent.setup();
    render(
      <FantasyFormula1Client
        initialState={DEFAULT_FANTASY_FORMULA1_STATE}
        snapshot={createSnapshot()}
      />
    );

    await user.click(screen.getByLabelText("Add Valtteri Bottas"));
    await user.click(screen.getByLabelText("Add Cadillac"));

    expect(screen.getByTestId("fantasy-formula-1-lineup")).toHaveTextContent(
      "Valtteri Bottas"
    );
    expect(screen.getByTestId("fantasy-formula-1-lineup")).toHaveTextContent("Cadillac");

    await waitFor(() => {
      expect(window.localStorage.getItem(getFantasyFormula1StorageKey(2026))).toContain(
        "driver-77"
      );
    });

    await user.click(screen.getByLabelText("Remove Valtteri Bottas"));

    expect(screen.getByTestId("fantasy-formula-1-lineup")).not.toHaveTextContent(
      "Valtteri Bottas"
    );
  });

  it("restores and resets persisted lineup state", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      getFantasyFormula1StorageKey(2026),
      JSON.stringify({
        driverIds: ["driver-77"],
        constructorIds: ["constructor-cadillac"],
        lockedAssetIds: ["driver-77"],
      })
    );

    render(
      <FantasyFormula1Client
        initialState={DEFAULT_FANTASY_FORMULA1_STATE}
        snapshot={createSnapshot()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("fantasy-formula-1-lineup")).toHaveTextContent(
        "Valtteri Bottas"
      );
    });
    expect(screen.getByLabelText("Unlock Valtteri Bottas")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    await waitFor(() => {
      expect(screen.getByTestId("fantasy-formula-1-lineup")).not.toHaveTextContent(
        "Valtteri Bottas"
      );
    });
  });

  it("renders an empty-state when the snapshot has no usable assets", () => {
    render(
      <FantasyFormula1Client
        initialState={DEFAULT_FANTASY_FORMULA1_STATE}
        snapshot={createSnapshot({ driverStandings: [], constructorStandings: [] })}
      />
    );

    expect(screen.getByText("No Formula 1 fantasy assets are available.")).toBeInTheDocument();
  });
});
