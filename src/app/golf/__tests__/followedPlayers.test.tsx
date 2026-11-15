import { fireEvent, render, screen, within } from "@testing-library/react";
import { FollowedPlayers } from "../FollowedPlayers";
import type { GolfSummary } from "@/types/golf";

it("pins a followed player and keeps missing rounds separate from zero", () => {
  const summary = {
    tournament: { name: "Test tournament" },
    players: [{ id: "one", name: "Player One" }],
    leaderboard: [
      {
        playerId: "one",
        playerName: "Player One",
        position: "1",
        totalToPar: -5,
        roundScores: [67],
        thru: "F",
        status: "Active",
      },
    ],
  } as unknown as GolfSummary;
  render(<FollowedPlayers summary={summary} onSelect={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Follow a player"), {
    target: { value: "one" },
  });
  const table = screen.getByRole("table");
  expect(within(table).getByText("67")).toBeVisible();
  expect(within(table).getAllByText("Not reported")).toHaveLength(3);
});
