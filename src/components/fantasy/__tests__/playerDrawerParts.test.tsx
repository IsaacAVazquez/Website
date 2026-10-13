import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { PlayerNoteField } from "../PlayerNoteField";
import { PlayerPointsPerGame } from "../PlayerPointsPerGame";

/**
 * The two parts every player drawer renders. The shared drawer's own tests
 * cover them in place, and these hold the parts' own props for the rankings
 * drawer, which passes a different id and always passes the scoring.
 */
describe("PlayerNoteField", () => {
  it("labels the field, reports each edit, and counts against the limit", () => {
    const onChange = jest.fn();
    render(<PlayerNoteField id="board-player-note" value="Round 2" maxLength={280} onChange={onChange} persistent />);

    const field = screen.getByRole("textbox", { name: "Private note" });
    expect(field).toHaveAttribute("id", "board-player-note");
    expect(field).toHaveAttribute("name", "board-player-note");
    expect(field).toHaveAttribute("maxlength", "280");
    expect(screen.getByText("7/280 · saved on this device")).toBeInTheDocument();

    fireEvent.change(field, { target: { value: "Round 2 target" } });
    expect(onChange).toHaveBeenCalledWith("Round 2 target");
  });

  it("never says saved when the note lives only in this tab", () => {
    const { container } = render(
      <PlayerNoteField id="player-note" value="" maxLength={280} onChange={jest.fn()} persistent={false} />
    );

    expect(screen.getByText("0/280 · kept in this tab only")).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/saved/);
  });
});

describe("PlayerPointsPerGame", () => {
  const gameLog = { season: 2025, games: 17, low: 5.8, median: 19.4, average: 21.6, high: 55.4 };
  const valueOf = (label: string) => screen.getByText(label).nextElementSibling;

  it("prints the four figures to one decimal under a heading that carries the help", () => {
    render(<PlayerPointsPerGame gameLog={gameLog} scoringLabel="PPR" />);

    expect(screen.getByRole("heading", { level: 3, name: "Points per game" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "What is Points per game?" })).toHaveTextContent("Points per game");
    expect(screen.getByText("2025 season · PPR · 17 games")).toBeInTheDocument();
    expect(valueOf("Low")).toHaveTextContent(/^5\.8$/);
    expect(valueOf("Median")).toHaveTextContent(/^19\.4$/);
    expect(valueOf("Avg")).toHaveTextContent(/^21\.6$/);
    expect(valueOf("High")).toHaveTextContent(/^55\.4$/);
  });

  it("leaves the scoring out when the caller does not know it, and counts one game as one game", () => {
    render(<PlayerPointsPerGame gameLog={{ ...gameLog, games: 1 }} />);

    expect(screen.getByText("2025 season · 1 game")).toBeInTheDocument();
  });
});
