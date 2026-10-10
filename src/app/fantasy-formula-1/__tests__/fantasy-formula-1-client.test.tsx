import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Formula1DriverStanding, Formula1Summary } from "@/types/formula1";
import { getFantasyFormula1StorageKey } from "@/lib/fantasyFormula1";
import { FantasyFormula1Client } from "../fantasy-formula-1-client";
import { DEFAULT_FANTASY_FORMULA1_STATE } from "../fantasy-formula-1-state";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";

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

function createSummary(overrides: Partial<Formula1Summary> = {}): Formula1Summary {
  const summary: Formula1Summary = {
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

  return { ...summary, ...overrides };
}

describe("FantasyFormula1Client", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockClear();
    mockReplace.mockClear();
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  it("selects, removes, and persists lineup assets", async () => {
    const user = userEvent.setup();
    render(
      <FantasyFormula1Client
        initialState={DEFAULT_FANTASY_FORMULA1_STATE}
        summary={createSummary()}
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

    // The slate's Remove carries the same name, so the lineup's is the one clicked.
    await user.click(
      within(screen.getByTestId("fantasy-formula-1-lineup")).getByLabelText("Remove Valtteri Bottas")
    );

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
        summary={createSummary()}
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

  it("keeps team edits usable when durable storage is blocked", async () => {
    const user = userEvent.setup();
    render(<FantasyFormula1Client initialState={DEFAULT_FANTASY_FORMULA1_STATE} summary={createSummary()} />);
    const write = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage is full", "QuotaExceededError");
    });
    try {
      await user.click(screen.getByLabelText("Add Valtteri Bottas"));
      await user.click(screen.getByLabelText("Add Cadillac"));
      expect(screen.getByTestId("fantasy-formula-1-lineup")).toHaveTextContent("Valtteri Bottas");
      expect(screen.getByTestId("fantasy-formula-1-lineup")).toHaveTextContent("Cadillac");
    } finally {
      write.mockRestore();
    }
  });

  it("receives another tab's edit and includes it in the next save", async () => {
    const user = userEvent.setup();
    render(<FantasyFormula1Client initialState={DEFAULT_FANTASY_FORMULA1_STATE} summary={createSummary()} />);
    const key = getFantasyFormula1StorageKey(2026);
    const value = JSON.stringify({ driverIds: ["driver-77"], constructorIds: [], lockedAssetIds: [] });
    act(() => {
      window.localStorage.setItem(key, value);
      window.dispatchEvent(new StorageEvent("storage", { key, newValue: value }));
    });
    expect(screen.getByTestId("fantasy-formula-1-lineup")).toHaveTextContent("Valtteri Bottas");
    await user.click(screen.getByLabelText("Add Cadillac"));
    expect(JSON.parse(window.localStorage.getItem(key)!)).toMatchObject({
      driverIds: ["driver-77"], constructorIds: ["constructor-cadillac"],
    });
  });

  it("prints the unofficial-model qualifier with the projected points", () => {
    render(<FantasyFormula1Client initialState={DEFAULT_FANTASY_FORMULA1_STATE} summary={createSummary()} />);

    const readout = screen.getByText("Projected points", { selector: "dt" }).parentElement as HTMLElement;
    expect(within(readout).getByText("Unofficial model estimate · 0/7 picked")).toBeInTheDocument();
    // The longer note stays under the hero.
    expect(screen.getByText(/It is\s+not the official F1 Fantasy game\./)).toBeInTheDocument();
  });

  it("offers one suggested lineup in the hero and makes it the team", async () => {
    const user = userEvent.setup();
    // The optimizer returns no lineup for the base slate's six drivers, so
    // this one adds three more for it to fill a team from.
    const base = createSummary();
    const deeperSlate = createSummary({
      driverStandings: [
        ...base.driverStandings,
        driver(7, 11, "Sergio Perez", "PER", "Cadillac", 4, 1),
        driver(8, 18, "Lance Stroll", "STR", "Aston Martin", 2, 0),
        driver(9, 22, "Yuki Tsunoda", "TSU", "Red Bull Racing", 1, 0),
      ],
    });
    render(<FantasyFormula1Client initialState={DEFAULT_FANTASY_FORMULA1_STATE} summary={deeperSlate} />);

    const suggestion = screen.getByTestId("fantasy-formula-1-suggestion");
    expect(within(suggestion).getByText(/unofficial model estimate/)).toBeInTheDocument();
    await user.click(within(suggestion).getByRole("button", { name: "Use this lineup" }));

    const lineup = screen.getByTestId("fantasy-formula-1-lineup");
    expect(within(lineup).getAllByRole("button", { name: /^Remove / })).toHaveLength(7);
    expect(within(suggestion).getByText("This is your current team.")).toBeInTheDocument();
    expect(within(suggestion).queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps an asset's price and projection in its own cell for a phone, with the rest behind More", () => {
    render(<FantasyFormula1Client initialState={DEFAULT_FANTASY_FORMULA1_STATE} summary={createSummary()} />);

    const row = screen.getByLabelText("Add Valtteri Bottas").closest("tr") as HTMLElement;
    const assetCell = within(row).getAllByRole("cell")[0];
    const more = assetCell.querySelector("details") as HTMLDetailsElement;

    // The stylesheet hides this below 640px only, so the class is what is checked.
    expect(more).toHaveClass("sm:hidden");
    expect(more.querySelector("summary")).toHaveTextContent(/^Valtteri Bottas, \$[\d.]+m · [\d.]+ projected/);
    for (const label of ["Type", "Standing", "Value", "Form", "Risk"]) {
      expect(within(more).getByText(label, { selector: "dt" })).toBeInTheDocument();
    }
    // One Add button per asset, whatever the width.
    expect(within(row).getAllByRole("button", { name: /^Add / })).toHaveLength(1);
  });

  it("renders an empty-state when the snapshot has no usable assets", () => {
    render(
      <FantasyFormula1Client
        initialState={DEFAULT_FANTASY_FORMULA1_STATE}
        summary={createSummary({ driverStandings: [], constructorStandings: [] })}
      />
    );

    expect(screen.getByText("No Formula 1 fantasy assets are available.")).toBeInTheDocument();
  });
});
