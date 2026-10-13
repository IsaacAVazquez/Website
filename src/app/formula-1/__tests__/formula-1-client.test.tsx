import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Formula1Snapshot, Formula1Summary } from "@/types/formula1";
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

const summaryFixture: Formula1Summary = {
  ...snapshotFixture,
  meetings: snapshotFixture.meetings.map(
    ({ classification: _classification, podium: _podium, ...meta }) => meta
  ),
};

const defaultMeetingDetail =
  snapshotFixture.meetings.find((meeting) => meeting.key === "1283") ?? null;

// The fixture names no next or latest race, so the masthead follows the pick.
// This one seeds both, as the live snapshot does.
const seededSummary: Formula1Summary = {
  ...summaryFixture,
  nextMeeting: snapshotFixture.meetings[2],
  lastCompletedMeeting: snapshotFixture.meetings[0],
};

function createMeetingFetchMock() {
  return jest.fn(async (input: RequestInfo | URL) => {
    const key = String(input).split("/").pop() ?? "";
    const meeting = snapshotFixture.meetings.find((candidate) => candidate.key === key);

    if (!meeting) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: "Formula 1 meeting snapshot was not found." }),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => meeting,
    };
  });
}

describe("Formula1Client", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
    global.fetch = createMeetingFetchMock() as unknown as typeof fetch;
  });

  it("renders the hero without rewriting the default route", async () => {
    render(
      <Formula1Client
        initialState={DEFAULT_FORMULA1_STATE}
        summary={summaryFixture}
        initialMeeting={defaultMeetingDetail}
      />
    );

    expect(screen.getByRole("heading", { name: "Formula 1 Pulse" })).toBeInTheDocument();
    await waitFor(() => expect(mockReplace).not.toHaveBeenCalled());
    // The default meeting is seeded server-side, so no detail fetch fires.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("canonicalizes invalid query params back to the default route", async () => {
    currentSearchParams = new URLSearchParams("view=bad&meeting=nope");

    render(
      <Formula1Client
        initialState={DEFAULT_FORMULA1_STATE}
        summary={summaryFixture}
        initialMeeting={defaultMeetingDetail}
      />
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/formula-1", { scroll: false })
    );
  });

  it("keeps the selected meeting when switching views", async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams("meeting=1281");

    render(
      <Formula1Client
        initialState={DEFAULT_FORMULA1_STATE}
        summary={summaryFixture}
        initialMeeting={defaultMeetingDetail}
      />
    );

    await user.click(screen.getByRole("button", { name: "Drivers" }));

    const [href, options] = mockPush.mock.calls.at(-1) ?? [];
    expect(options).toEqual({ scroll: false });
    expect(href).toMatch(/^\/formula-1\?/);

    const nextParams = new URLSearchParams(href.split("?")[1] ?? "");
    expect(nextParams.get("view")).toBe("drivers");
    expect(nextParams.get("meeting")).toBe("1281");
  });

  it("names a city-circuit venue once and keeps a live weekend on the race strip", () => {
    const liveSummary: Formula1Summary = {
      ...summaryFixture,
      meetings: summaryFixture.meetings.map((meeting) =>
        meeting.key === "1281" ? { ...meeting, status: "live" as const } : meeting
      ),
    };

    render(
      <Formula1Client
        initialState={DEFAULT_FORMULA1_STATE}
        summary={liveSummary}
        initialMeeting={defaultMeetingDetail}
      />
    );

    // OpenF1 names the Jeddah circuit after its city, so the venue line is city and country.
    expect(screen.getAllByText(/^Jeddah, /).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Jeddah in Jeddah/)).not.toBeInTheDocument();
    // The weekend in progress is neither completed nor upcoming, and it still shows.
    expect(screen.getByRole("button", { name: /Japanese Grand Prix/i })).toBeInTheDocument();
  });

  it("updates the URL when selecting a different race strip meeting", async () => {
    const user = userEvent.setup();

    render(
      <Formula1Client
        initialState={DEFAULT_FORMULA1_STATE}
        summary={summaryFixture}
        initialMeeting={defaultMeetingDetail}
      />
    );

    await user.click(screen.getByRole("button", { name: /Japanese Grand Prix/i }));

    expect(mockPush).toHaveBeenCalledWith("/formula-1?meeting=1281", {
      scroll: false,
    });
  });

  it("links a phone's shortened tower to the full table's heading", () => {
    const grid: Formula1Summary = {
      ...summaryFixture,
      driverStandings: Array.from({ length: 14 }, (_, index) => ({
        ...summaryFixture.driverStandings[0],
        position: index + 1,
        driverNumber: index + 1,
        driverName: `Driver ${index + 1}`,
      })),
    };

    const { unmount } = render(
      <Formula1Client initialState={DEFAULT_FORMULA1_STATE} summary={grid} initialMeeting={defaultMeetingDetail} />
    );
    expect(screen.getByRole("link", { name: "See all 14 drivers" })).toHaveAttribute(
      "href",
      "/formula-1?view=drivers#f1-drivers-heading"
    );
    unmount();

    currentSearchParams = new URLSearchParams("view=drivers");
    render(<Formula1Client initialState={DEFAULT_FORMULA1_STATE} summary={grid} initialMeeting={defaultMeetingDetail} />);
    expect(document.getElementById("f1-drivers-heading")).toHaveTextContent("Driver championship");
    // The class carries the scroll margin that lands the heading below the sticky switch.
    expect(document.getElementById("f1-drivers-heading")).toHaveClass("anchor");
  });

  it("brings a race strip button that takes focus fully into the strip", () => {
    const scrollIntoView = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    try {
      render(
        <Formula1Client
          initialState={DEFAULT_FORMULA1_STATE}
          summary={summaryFixture}
          initialMeeting={defaultMeetingDetail}
        />
      );
      const japan = screen.getByRole("button", { name: /Japanese Grand Prix/i });

      act(() => japan.focus());

      expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "nearest" });
      expect(scrollIntoView.mock.contexts).toEqual([japan]);
    } finally {
      delete (Element.prototype as Partial<Element>).scrollIntoView;
    }
  });

  describe("a view switch from further down the page", () => {
    const scrollIntoView = jest.fn();

    beforeEach(() => {
      scrollIntoView.mockClear();
      Element.prototype.scrollIntoView = scrollIntoView;
    });

    afterEach(() => {
      delete (Element.prototype as Partial<Element>).scrollIntoView;
    });

    function renderWithBoardAt(top: number) {
      render(
        <Formula1Client
          initialState={DEFAULT_FORMULA1_STATE}
          summary={summaryFixture}
          initialMeeting={defaultMeetingDetail}
        />
      );
      const board = document.getElementById("f1-board") as HTMLElement;
      jest.spyOn(board, "getBoundingClientRect").mockReturnValue({ top } as DOMRect);
      return board;
    }

    it("brings the board back to the top when it has scrolled past", async () => {
      const user = userEvent.setup();
      const board = renderWithBoardAt(-900);

      await user.click(screen.getByRole("button", { name: "Drivers" }));

      expect(scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: "start" }));
      expect(scrollIntoView.mock.contexts[0]).toBe(board);
    });

    it("leaves the page where it is while the board's top is on screen", async () => {
      const user = userEvent.setup();
      renderWithBoardAt(200);

      await user.click(screen.getByRole("button", { name: "Drivers" }));

      expect(mockPush).toHaveBeenCalled();
      expect(scrollIntoView).not.toHaveBeenCalled();
    });
  });

  it("prints a driver's team and last-race gain outside the columns a phone hides", () => {
    currentSearchParams = new URLSearchParams("view=drivers");

    render(
      <Formula1Client
        initialState={DEFAULT_FORMULA1_STATE}
        summary={summaryFixture}
        initialMeeting={defaultMeetingDetail}
      />
    );

    const norris = within(screen.getByRole("table", { name: "Driver championship" }))
      .getByText("Lando NORRIS")
      .closest("tr") as HTMLElement;
    // The stylesheet hides .wideOnly under 560px, so the copy outside it is what a phone reads.
    const onPhone = (text: string | RegExp) =>
      within(norris)
        .queryAllByText(text)
        .filter((node) => !node.closest(".wideOnly"));
    expect(onPhone("McLaren")).toHaveLength(1);
    expect(onPhone(/^\+25/)).toHaveLength(1);
  });

  it("labels a picked weekend by its own status", () => {
    currentSearchParams = new URLSearchParams("meeting=1281");

    render(
      <Formula1Client
        initialState={{ view: "overview", meeting: "1281" }}
        summary={seededSummary}
        initialMeeting={snapshotFixture.meetings[0]}
      />
    );

    // Japan is one of two finished rounds here and not the latest of them.
    const detail = screen.getByRole("article", { name: "Japanese Grand Prix weekend" });
    expect(within(detail).getByText("completed")).toBeInTheDocument();
    expect(within(detail).queryByText("Latest result")).not.toBeInTheDocument();
  });

  it("prints laps completed and the finishing time on a classification row", () => {
    currentSearchParams = new URLSearchParams("meeting=1281");

    render(
      <Formula1Client
        initialState={{ view: "overview", meeting: "1281" }}
        summary={seededSummary}
        initialMeeting={snapshotFixture.meetings[0]}
      />
    );

    const row = screen.getByText(/1 · George RUSSELL/).closest("li") as HTMLElement;
    expect(row).toHaveTextContent("Mercedes · Finished · 53 laps · Leader · 1:28:03.403");
  });

  it("names the next race's weekend in the calendar and leaves it to the masthead in the overview", () => {
    const { unmount } = render(
      <Formula1Client initialState={DEFAULT_FORMULA1_STATE} summary={seededSummary} initialMeeting={defaultMeetingDetail} />
    );
    expect(screen.getByRole("heading", { level: 3, name: "Saudi Arabian Grand Prix weekend" })).toHaveClass("sr-only");
    unmount();

    // A calendar pick scrolls the detail to the top, past the masthead that names the race.
    currentSearchParams = new URLSearchParams("view=calendar");
    render(
      <Formula1Client initialState={DEFAULT_FORMULA1_STATE} summary={seededSummary} initialMeeting={defaultMeetingDetail} />
    );
    expect(screen.getByRole("heading", { level: 3, name: "Saudi Arabian Grand Prix" })).not.toHaveClass("sr-only");
  });

  it("switches the board with one view switch", async () => {
    const user = userEvent.setup();

    render(
      <Formula1Client
        initialState={DEFAULT_FORMULA1_STATE}
        summary={summaryFixture}
        initialMeeting={defaultMeetingDetail}
      />
    );

    const views = screen.getByRole("group", { name: "Season view" });
    expect(within(views).getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Overview",
      "Drivers",
      "Constructors",
      "Calendar",
    ]);
    expect(within(views).getByRole("button", { name: "Overview" })).toHaveAttribute("aria-pressed", "true");
    await user.click(within(views).getByRole("button", { name: "Calendar" }));
    expect(mockPush).toHaveBeenCalledWith("/formula-1?view=calendar", { scroll: false });
  });

  it("prints a row level on points with the leader as Level in the standings table", () => {
    currentSearchParams = new URLSearchParams("view=constructors");
    const level: Formula1Summary = {
      ...summaryFixture,
      constructorStandings: summaryFixture.constructorStandings.map((row) => ({ ...row, points: 132 })),
    };

    render(
      <Formula1Client initialState={DEFAULT_FORMULA1_STATE} summary={level} initialMeeting={defaultMeetingDetail} />
    );

    const mercedes = within(screen.getByRole("table", { name: "Constructor championship" }))
      .getByText("Mercedes")
      .closest("tr") as HTMLElement;
    expect(within(mercedes).getByText("Level")).toBeInTheDocument();
    expect(within(mercedes).queryByText("−0")).not.toBeInTheDocument();
  });

  it("fetches a deep-linked meeting's detail on demand and renders its classification", async () => {
    currentSearchParams = new URLSearchParams("meeting=1281");

    render(
      <Formula1Client
        initialState={{ view: "overview", meeting: "1281" }}
        summary={summaryFixture}
        initialMeeting={null}
      />
    );

    expect(screen.getByText(/loading race weekend detail/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText(/1 · George RUSSELL/)).toBeInTheDocument()
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/formula-1/meetings/1281",
      expect.objectContaining({ signal: expect.anything() })
    );
  });

  it("shows an error state when the meeting detail fetch fails", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({ error: "Unable to load the Formula 1 meeting snapshot" }),
    })) as unknown as typeof fetch;
    currentSearchParams = new URLSearchParams("meeting=1281");

    render(
      <Formula1Client
        initialState={{ view: "overview", meeting: "1281" }}
        summary={summaryFixture}
        initialMeeting={null}
      />
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/unable to load/i)
    );
    // The placeholder labels the weekend by its own status, as the loaded detail does.
    const fallback = screen.getByRole("alert").closest("article") as HTMLElement;
    expect(within(fallback).getByText("completed")).toBeInTheDocument();
  });
});
