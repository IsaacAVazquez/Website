import React from "react";
import { render, screen } from "@testing-library/react";

import type { Player } from "@/types";

import { PlayerDetailDrawer } from "../PlayerDetailDrawer";

// As published in ppr.json. The redraft board stopped moving at kickoff, so
// these stamps compare September 10 with the week before it.
const publishedPlayer: Player = {
  id: "fp-19799",
  name: "Amon-Ra St. Brown",
  team: "DET",
  position: "WR",
  averageRank: 5,
  standardDeviation: 1.41,
  rankEcr: 5,
  rankAverage: 4.7,
  tier: 1,
  positionRank: 3,
  minRank: 3,
  maxRank: 11,
  byeWeek: 6,
  ownership: 99.9,
  adp: 6.9,
  adpHigh: 2,
  adpLow: 11,
  adpStandardDeviation: 1.5,
  adpTimesDrafted: 449,
  lastUpdated: "2026-09-10T00:19:11.000Z",
  rankMove7d: 1,
  rankMove14d: 1,
  adpMove7d: -0.4,
  adpMove14d: -0.5,
};

describe("player drawer board movement", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("prints movement while the board it was measured on is current", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-11T17:00:00.000Z"));

    render(<PlayerDetailDrawer player={publishedPlayer} onClose={jest.fn()} />);

    expect(screen.getByRole("button", { name: "What is Movement?" })).toBeInTheDocument();
    expect(
      screen.getByText(/rank ↑1 in 7d · ↑1 in 14d · ADP ↓0\.4 in 7d · ↓0\.5 in 14d/)
    ).toBeInTheDocument();
  });

  it("hides movement once the board is stale, since the 7 days ended when it froze", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-27T19:45:00.000Z"));

    render(<PlayerDetailDrawer player={publishedPlayer} onClose={jest.fn()} />);

    expect(screen.getByRole("heading", { name: "Amon-Ra St. Brown" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "What is Movement?" })).not.toBeInTheDocument();
    expect(screen.queryByText(/in 7d/)).not.toBeInTheDocument();
    expect(screen.queryByText(/in 14d/)).not.toBeInTheDocument();
  });

  it("hides movement when the player carries no source date to measure it from", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-11T17:00:00.000Z"));
    const { lastUpdated: _lastUpdated, ...undated } = publishedPlayer;

    render(<PlayerDetailDrawer player={undated} onClose={jest.fn()} />);

    expect(screen.queryByText(/in 7d/)).not.toBeInTheDocument();
  });
});
