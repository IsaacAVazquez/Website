import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { PersonalTeams } from "../PersonalTeams";
import {
  resetBrowserStorageMemory,
  writeBrowserStorageJson,
} from "@/lib/browserStorage";

const team = {
  id: "1",
  name: "Example",
  conference: "East",
  rank: 2,
  wins: 4,
  losses: 1,
  ties: 0,
};
beforeEach(() => {
  localStorage.clear();
  resetBrowserStorageMemory();
});
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});
it("retains favorites and shows their returned schedule ahead of standings changes", async () => {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      upcomingFixtures: [
        {
          id: "game",
          // A week out from the real clock, since the schedule download drops past fixtures.
          utcDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
          status: "SCHEDULED",
          homeTeam: { shortName: "Example" },
          awayTeam: { shortName: "Visitor" },
        },
      ],
    }),
  } as Response);
  global.fetch = fetchMock;
  render(
    <PersonalTeams
      league="nba"
      season="2026"
      sourceAt="2026-10-23T12:00:00Z"
      teams={[team]}
      onOpen={jest.fn()}
    />,
  );
  fireEvent.click(screen.getByText("My teams and standings changes"));
  fireEvent.change(screen.getByLabelText("Favorite team"), {
    target: { value: "1" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save favorite team" }));
  await waitFor(() =>
    expect(screen.getByText(/Visitor at Example/)).toBeVisible(),
  );
  expect(JSON.parse(localStorage.getItem("nba-favorite-teams-v1")!)).toEqual([
    "1",
  ]);
  expect(fetchMock).toHaveBeenCalledWith("/api/nba/teams/1", expect.anything());
  expect(
    screen.getByRole("button", { name: "Download Example schedule" }),
  ).toBeVisible();
});
it("compares only a preceding observation from the same season", () => {
  act(() =>
    writeBrowserStorageJson("nfl-observed-standings-v1", [
      {
        season: "2026",
        sourceAt: "2026-10-20T12:00:00Z",
        teams: [{ ...team, rank: 4, wins: 2 }],
      },
    ]),
  );
  render(
    <PersonalTeams
      league="nfl"
      season="2026"
      sourceAt="2026-10-23T12:00:00Z"
      teams={[team]}
      onOpen={jest.fn()}
    />,
  );
  fireEvent.click(screen.getByText("My teams and standings changes"));
  expect(
    screen.getByRole("region", { name: "Standings changes" }),
  ).toHaveTextContent("Up 2");
  expect(
    JSON.parse(localStorage.getItem("nfl-observed-standings-v1")!),
  ).toHaveLength(2);
});

it("reads MLB's upcomingGames and labels division rank", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ upcomingGames: [{ id: "next", utcDate: "2027-04-01T20:00:00Z", status: "SCHEDULED", homeTeam: { shortName: "Example" }, awayTeam: { shortName: "Visitors" } }] }) });
  writeBrowserStorageJson("mlb-favorite-teams-v1", ["1"]);
  render(<PersonalTeams league="mlb" season="2027" sourceAt="2027-03-25T12:00:00Z" teams={[team]} onOpen={jest.fn()} />);
  await waitFor(() => expect(screen.getByText(/Visitors at Example/)).toBeVisible());
  expect(screen.getByText(/Division rank/)).toBeVisible();
});

it("keeps missing favorite teams visible and removable", () => {
  writeBrowserStorageJson("premier-league-favorite-teams-v1", ["missing"]);
  render(<PersonalTeams league="premier-league" season="2026" sourceAt="2026-10-26T12:00:00Z" teams={[team]} onOpen={jest.fn()} />);
  fireEvent.click(screen.getByText("My teams and standings changes"));
  expect(screen.getByText(/missing.*unavailable in this snapshot/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Remove favorite missing" }));
  expect(localStorage.getItem("premier-league-favorite-teams-v1")).toBe("[]");
});
