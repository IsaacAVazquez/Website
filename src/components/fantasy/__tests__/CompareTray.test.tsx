import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { useCompareTray } from "@/hooks/useCompareTray";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { FANTASY_COMPARE_STORAGE_KEY } from "@/lib/fantasyLocal";
import type { Player } from "@/types";

import { CompareTray } from "../CompareTray";

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

const currentPlayer: Player = {
  id: "current-player",
  name: "Current Player",
  team: "ATL",
  position: "RB",
  averageRank: 1,
  standardDeviation: 1,
};

const resolvePlayer = (id: string) => (id === currentPlayer.id ? currentPlayer : undefined);

function CompareCapacityHarness({ playerDataReady }: { playerDataReady: boolean }) {
  const compare = useCompareTray();
  const selected = compare.inCompare(currentPlayer.id);

  return (
    <>
      <button
        type="button"
        disabled={!selected && compare.isFull}
        onClick={() => compare.toggle(currentPlayer.id)}
      >
        Pin current player
      </button>
      <CompareTray
        resolvePlayer={resolvePlayer}
        playerDataReady={playerDataReady}
      />
    </>
  );
}

describe("CompareTray persisted IDs", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  afterEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  it("waits for player data, then prunes stale IDs and releases compare capacity", async () => {
    const staleIds = ["old-1", "old-2", "old-3"];
    window.localStorage.setItem(FANTASY_COMPARE_STORAGE_KEY, JSON.stringify(staleIds));

    const { rerender } = render(<CompareCapacityHarness playerDataReady={false} />);
    expect(screen.getByRole("button", { name: "Pin current player" })).toBeDisabled();
    expect(JSON.parse(window.localStorage.getItem(FANTASY_COMPARE_STORAGE_KEY) ?? "[]"))
      .toEqual(staleIds);

    rerender(<CompareCapacityHarness playerDataReady />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Pin current player" })).toBeEnabled()
    );
    expect(JSON.parse(window.localStorage.getItem(FANTASY_COMPARE_STORAGE_KEY) ?? "[]"))
      .toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Pin current player" }));
    expect(screen.getByText("Current Player")).toBeInTheDocument();
  });
});
