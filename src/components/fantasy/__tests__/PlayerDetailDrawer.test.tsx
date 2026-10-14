import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { FANTASY_REACH_TOOLTIP, FANTASY_VALUE_TOOLTIP } from "@/lib/fantasyUtils";
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

// Ranked 1st and drafted around pick 40 on a deep mock sample, so the gap
// clears the threshold and the drawer reads him as a value.
const valuePlayer: Player = {
  id: "rb-1",
  name: "First Back",
  team: "ATL",
  position: "RB",
  averageRank: 1,
  rankEcr: 1,
  positionRank: 1,
  tier: 1,
  standardDeviation: 1,
  minRank: 1,
  maxRank: 7,
  rankAverage: 2.4,
  adp: 40,
  adpTimesDrafted: 500,
  adpStandardDeviation: 2,
};

const ANY_VERDICT = /Rooms take him|Take him on schedule|Too few mock selections/;

function freshStorage() {
  window.localStorage.clear();
  resetBrowserStorageMemory();
}

describe("player drawer market verdict", () => {
  beforeEach(freshStorage);
  afterEach(freshStorage);

  it("prints the value sentence beside the Value word for a player the market lets fall", () => {
    render(<PlayerDetailDrawer player={valuePlayer} onClose={jest.fn()} />);

    expect(screen.getByTitle(FANTASY_VALUE_TOOLTIP)).toHaveTextContent("Value +39");
    const verdict = screen.getByText(
      "Rooms take him about 39 picks after the consensus rank. Value if he lasts to your pick."
    );
    expect(verdict).toHaveClass("ffb-notice-good");
  });

  it("prints the reach sentence for a player the market takes early", () => {
    render(
      <PlayerDetailDrawer
        player={{ ...valuePlayer, averageRank: 40, rankEcr: 40, adp: 20 }}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByTitle(FANTASY_REACH_TOOLTIP)).toHaveTextContent("Reach −20");
    expect(
      screen.getByText("Rooms take him about 20 picks before the consensus rank. Plan the reach or let him go.")
    ).toHaveClass("ffb-notice-warn");
  });

  it("prints the neutral sentence, and no Value or Reach word, inside the noise band", () => {
    render(<PlayerDetailDrawer player={{ ...valuePlayer, adp: 2 }} onClose={jest.fn()} />);

    expect(
      screen.getByText("Market and consensus sit inside this player's noise band. Take him on schedule.")
    ).toBeInTheDocument();
    expect(screen.queryByTitle(FANTASY_VALUE_TOOLTIP)).not.toBeInTheDocument();
    expect(screen.queryByTitle(FANTASY_REACH_TOOLTIP)).not.toBeInTheDocument();
  });

  it("holds the read back on a thin sample and never calls that agreement", () => {
    render(<PlayerDetailDrawer player={{ ...valuePlayer, adp: 2, adpTimesDrafted: 5 }} onClose={jest.fn()} />);

    const held = screen.getByText(
      "Too few mock selections behind his ADP to judge the market gap yet, so no market read."
    );
    // The kit's held notice, the form a withheld read takes on every page.
    expect(held).toHaveClass("ffb-notice-held");
    expect(screen.queryByText(/Take him on schedule/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Rooms take him/)).not.toBeInTheDocument();
    expect(screen.queryByTitle(FANTASY_VALUE_TOOLTIP)).not.toBeInTheDocument();
  });

  it("prints none of the sentences when the ADP source is unavailable", () => {
    render(<PlayerDetailDrawer player={valuePlayer} adpAvailable={false} onClose={jest.fn()} />);

    expect(screen.queryByText(ANY_VERDICT)).not.toBeInTheDocument();
    expect(screen.queryByTitle(FANTASY_VALUE_TOOLTIP)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "What is Market ADP?" })).not.toBeInTheDocument();
  });

  it("prints none of the sentences on a board whose ranks are not on the overall scale", () => {
    render(<PlayerDetailDrawer player={valuePlayer} valueSignalAvailable={false} onClose={jest.fn()} />);

    expect(screen.queryByText(ANY_VERDICT)).not.toBeInTheDocument();
    expect(screen.queryByTitle(FANTASY_VALUE_TOOLTIP)).not.toBeInTheDocument();
    // The ADP figure itself still prints.
    expect(screen.getByRole("button", { name: "What is Market ADP?" })).toBeInTheDocument();
  });

  it("drops the sentence and keeps the Value word when the caller withholds recommendations", () => {
    const { rerender } = render(
      <PlayerDetailDrawer player={valuePlayer} verdictAvailable={false} onClose={jest.fn()} />
    );

    expect(screen.queryByText(ANY_VERDICT)).not.toBeInTheDocument();
    expect(screen.getByTitle(FANTASY_VALUE_TOOLTIP)).toHaveTextContent("Value +39");

    // The same switch drops the neutral instruction, which carries no word beside it.
    rerender(
      <PlayerDetailDrawer player={{ ...valuePlayer, adp: 2 }} verdictAvailable={false} onClose={jest.fn()} />
    );
    expect(screen.queryByText(ANY_VERDICT)).not.toBeInTheDocument();
  });
});

describe("player drawer facts", () => {
  beforeEach(freshStorage);
  afterEach(freshStorage);

  const valueOf = (label: string) => screen.getByText(label).nextElementSibling;

  it("prints VORP with its league size when the caller passes it", () => {
    const { rerender } = render(<PlayerDetailDrawer player={valuePlayer} onClose={jest.fn()} />);
    expect(screen.queryByRole("button", { name: "What is VORP?" })).not.toBeInTheDocument();

    rerender(
      <PlayerDetailDrawer player={valuePlayer} vorp={{ value: 204.6, label: "12-team" }} onClose={jest.fn()} />
    );
    const trigger = screen.getByRole("button", { name: "What is VORP?" });
    expect(trigger).toHaveTextContent("VORP · 12-team");
    expect(trigger.closest("dt")?.nextElementSibling).toHaveTextContent(/^205$/);
  });

  it("says Withheld in the position rank and tier facts when the board withholds the consensus", () => {
    const { rerender } = render(<PlayerDetailDrawer player={valuePlayer} boardTierCount={16} onClose={jest.fn()} />);
    expect(valueOf("Position rank")).toHaveTextContent(/^RB 1$/);
    expect(valueOf("Tier")).toHaveTextContent(/^1 of 16$/);

    rerender(
      <PlayerDetailDrawer player={valuePlayer} boardTierCount={16} consensusWithheld onClose={jest.fn()} />
    );
    expect(valueOf("Position rank")).toHaveTextContent(/^Withheld$/);
    expect(valueOf("Tier")).toHaveTextContent(/^Withheld$/);
    expect(valueOf("Rostered")).not.toHaveTextContent("Withheld");
  });

  it("names the scoring in the points per game basis line when the caller passes it", () => {
    const scored: Player = {
      ...valuePlayer,
      gameLog: { season: 2025, games: 17, low: 5.8, median: 19.4, average: 21.6, high: 55.4 },
    };
    const { rerender } = render(<PlayerDetailDrawer player={scored} onClose={jest.fn()} />);
    expect(screen.getByText("2025 season · 17 games")).toBeInTheDocument();
    expect(valueOf("Median")).toHaveTextContent(/^19\.4$/);

    rerender(<PlayerDetailDrawer player={scored} scoringLabel="PPR" onClose={jest.fn()} />);
    expect(screen.getByText("2025 season · PPR · 17 games")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "What is Points per game?" })).toBeInTheDocument();
  });

  it("says once what a division of the spread plot is, and only when there is a plot", () => {
    const { rerender } = render(<PlayerDetailDrawer player={valuePlayer} onClose={jest.fn()} />);
    expect(screen.getAllByText("Each division is a round of a 12-team draft.")).toHaveLength(1);

    rerender(
      <PlayerDetailDrawer player={{ ...valuePlayer, minRank: undefined, maxRank: undefined }} onClose={jest.fn()} />
    );
    expect(screen.queryByText(/round of a 12-team draft/)).not.toBeInTheDocument();
    expect(screen.getByText("Expert range unavailable for this board.")).toBeInTheDocument();
  });

  it("marks Queue and Compare as pressed toggles", () => {
    render(<PlayerDetailDrawer player={valuePlayer} onClose={jest.fn()} />);

    const queue = screen.getByRole("button", { name: "Add to queue" });
    expect(queue).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(queue);
    expect(screen.getByRole("button", { name: "Queued" })).toHaveAttribute("aria-pressed", "true");

    const compare = screen.getByRole("button", { name: "Compare" });
    expect(compare).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(compare);
    expect(screen.getByRole("button", { name: "Comparing" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("player drawer storage wording", () => {
  beforeEach(freshStorage);
  afterEach(() => {
    jest.restoreAllMocks();
    freshStorage();
  });

  function blockStorage() {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
  }

  it("says the note is saved on this device while storage works", () => {
    render(<PlayerDetailDrawer player={valuePlayer} onClose={jest.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Private note" }), { target: { value: "Round 2 target" } });
    expect(screen.getByText("14/280 · saved on this device")).toBeInTheDocument();
    expect(screen.getByText(/Queue, notes, and compare stay on this device\./)).toBeInTheDocument();
  });

  it("says nothing is saved when storage is blocked", () => {
    blockStorage();
    render(<PlayerDetailDrawer player={valuePlayer} onClose={jest.fn()} />);

    expect(screen.getByText("0/280 · kept in this tab only")).toBeInTheDocument();
    expect(screen.getByText(/Queue, notes, and compare last only in this tab\./)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).not.toHaveTextContent(/saved|stay on this device/);

    // The note still works for the length of the visit.
    fireEvent.change(screen.getByRole("textbox", { name: "Private note" }), { target: { value: "Round 2 target" } });
    expect(screen.getByRole("textbox", { name: "Private note" })).toHaveValue("Round 2 target");
    expect(screen.getByText("14/280 · kept in this tab only")).toBeInTheDocument();
  });

  it("leaves compare out of the blocked sentence where the caller has no tray", () => {
    blockStorage();
    render(<PlayerDetailDrawer player={valuePlayer} compareAvailable={false} onClose={jest.fn()} />);

    expect(screen.getByText(/Queue and notes last only in this tab\./)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).not.toHaveTextContent(/compare/i);
  });
});
