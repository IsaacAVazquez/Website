import { render, screen } from "@testing-library/react";
import type { GolfPlayerSnapshot, GolfRouteState, GolfSummary } from "@/types/golf";
import { getGolfSummary } from "@/lib/golfSnapshot";
import GolfPage from "../page";

type GolfClientProps = {
  initialState: GolfRouteState;
  summary: GolfSummary;
  initialPlayerSnapshot: GolfPlayerSnapshot | null;
};

const mockGolfClient = jest.fn<void, [GolfClientProps]>();

jest.mock("../golf-client", () => ({
  GolfClient: (props: GolfClientProps) => {
    mockGolfClient(props);
    return <div data-testid="golf-client" />;
  },
}));

jest.mock("@/lib/golfSnapshot", () => ({
  getGolfSummary: jest.fn(),
  getGolfPlayerSnapshot: jest.fn().mockResolvedValue(null),
}));

// A final board as it was committed before the builder worked Today out:
// every player at 0, beside a closing 68 and a closing 64 on a par 71.
const committedBoard: GolfSummary = {
  tournament: {
    id: "baycurrent-classic-2026",
    name: "Baycurrent Classic",
    tour: "PGA Tour",
    course: "Yokohama Country Club",
    coursePar: 71,
    location: "Yokohama, Japan",
    startDate: "2026-10-08",
    endDate: "2026-10-11",
    roundLabel: "Round 4",
    status: "Final",
    completed: true,
    fieldSize: 2,
    cutLine: null,
    cutState: "none",
    cutCount: null,
    generatedAt: "2026-10-12T18:09:53.426Z",
  },
  heroStats: {
    leaderName: "Michael Brennan",
    leaderScore: -16,
    playersUnderPar: 2,
    cutLine: null,
    cutState: "none",
    cutCount: null,
    fieldSize: 2,
  },
  leaderboard: [
    {
      playerId: "michael-brennan",
      playerName: "Michael Brennan",
      country: "USA",
      position: "1",
      totalToPar: -16,
      today: 0,
      thru: "F",
      status: "Finish",
      roundScores: [68, 67, 65, 68],
      movement: 0,
    },
    {
      playerId: "ren-yonezawa",
      playerName: "Ren Yonezawa",
      country: "Japan",
      position: "T9",
      totalToPar: -12,
      today: 0,
      thru: "F",
      status: "Finish",
      roundScores: [68, 69, 71, 64],
      movement: -20,
    },
  ],
  players: [
    { id: "michael-brennan", name: "Michael Brennan", country: "USA", position: "1" },
    { id: "ren-yonezawa", name: "Ren Yonezawa", country: "Japan", position: "T9" },
  ],
};

describe("GolfPage", () => {
  beforeEach(() => {
    mockGolfClient.mockReset();
  });

  it("hands the client each player's closing round as Today when the committed board carries zero for all", async () => {
    jest.mocked(getGolfSummary).mockResolvedValue(committedBoard);

    render(await GolfPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("golf-client")).toBeVisible();
    const props = mockGolfClient.mock.calls.at(-1)?.[0];
    expect(props?.summary.leaderboard.map((row) => row.today)).toEqual([-3, -7]);
  });
});
