import React from "react";
import { render, screen, within } from "@testing-library/react";

import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import type { Player } from "@/types";

import { CompareModal } from "../CompareModal";
import { PlayerDetailDrawer } from "../PlayerDetailDrawer";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
    }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => true,
}));

/**
 * The published rank a board hands the drawer and the modal is not always the
 * consensus. The redraft boards pass rankEcr, so the default label stays
 * "Consensus rank"; the best ball board passes its ADP-ordered board rank and
 * names it, and a withheld consensus has to stop the modal awarding Best.
 */
const players: Player[] = [
  {
    id: "rb-1",
    name: "First Back",
    team: "DET",
    position: "RB",
    averageRank: 54,
    rankEcr: 54,
    rankAverage: 1.33,
    minRank: 1,
    maxRank: 2,
    tier: 7,
    positionRank: 19,
    standardDeviation: 0.5,
    adp: 1,
  },
  {
    id: "wr-1",
    name: "First Receiver",
    team: "CIN",
    position: "WR",
    averageRank: 1,
    rankEcr: 1,
    rankAverage: 3,
    minRank: 1,
    maxRank: 5,
    tier: 1,
    positionRank: 1,
    standardDeviation: 1,
    adp: 3.1,
  },
];

const boardRank = (player: Player) => (player.id === "rb-1" ? "1" : "3");

function rowCells(label: string): string[] {
  const header = screen.getByRole("rowheader", { name: label });
  const row = header.closest("tr") as HTMLElement;
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent?.replace(/\s+/g, " ").trim() ?? "");
}

describe("published rank labels", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  it("keeps a single consensus row under the default label for the redraft boards", () => {
    render(
      <CompareModal
        players={players}
        publishedRank={(player) => String(player.rankEcr)}
        onClose={jest.fn()}
        onRemove={jest.fn()}
      />
    );

    expect(screen.getByRole("rowheader", { name: "Consensus rank" })).toBeInTheDocument();
    expect(screen.queryByRole("rowheader", { name: "Board rank" })).not.toBeInTheDocument();
    expect(rowCells("Consensus rank")).toEqual(["54", "1Best"]);
  });

  it("names a caller-labeled published rank and adds a separate consensus row", () => {
    render(
      <CompareModal
        players={players}
        publishedRank={boardRank}
        publishedRankLabel="Board rank"
        onClose={jest.fn()}
        onRemove={jest.fn()}
      />
    );

    expect(rowCells("Board rank")).toEqual(["1Best", "3"]);
    expect(rowCells("Consensus rank")).toEqual(["54", "1Best"]);
  });

  it("prints Withheld and awards no Best on the consensus rows for a withheld player", () => {
    render(
      <CompareModal
        players={players}
        publishedRank={boardRank}
        publishedRankLabel="Board rank"
        consensusWithheld={(player) => player.id === "rb-1"}
        onClose={jest.fn()}
        onRemove={jest.fn()}
      />
    );

    expect(rowCells("Board rank")).toEqual(["1Best", "3"]);
    expect(rowCells("Consensus rank")).toEqual(["Withheld", "1"]);
    expect(rowCells("Position rank")).toEqual(["Withheld", "WR 1"]);
    expect(rowCells("Tier")).toEqual(["Withheld", "1"]);
    expect(rowCells("Market ADP")[0]).toBe("1.0");
    expect(screen.getByText(/Withheld marks a player whose published consensus rank/)).toBeInTheDocument();
  });

  it("labels the drawer chip after the caller's rank, defaulting to Rank", () => {
    const { rerender } = render(
      <PlayerDetailDrawer player={players[1]} publishedRank="12" onClose={jest.fn()} />
    );
    expect(screen.getByText("Rank 12")).toBeInTheDocument();

    rerender(
      <PlayerDetailDrawer
        player={players[1]}
        publishedRank="12"
        publishedRankLabel="Board rank"
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText("Board rank 12")).toBeInTheDocument();
    expect(screen.queryByText("Rank 12")).not.toBeInTheDocument();
  });
});
