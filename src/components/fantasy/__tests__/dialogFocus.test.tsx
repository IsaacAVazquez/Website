import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { usePlayerNotes } from "@/hooks/usePlayerNotes";
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

const players: Player[] = [
  {
    id: "rb-1",
    name: "First Back",
    team: "ATL",
    position: "RB",
    averageRank: 1,
    rankEcr: 1,
    positionRank: 1,
    standardDeviation: 1,
  },
  {
    id: "rb-2",
    name: "Second Back",
    team: "PHI",
    position: "RB",
    averageRank: 2,
    rankEcr: 2,
    positionRank: 2,
    standardDeviation: 1,
  },
];

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, [tabindex]:not([tabindex="-1"])';

function expectImmediateBackwardWrap(dialog: HTMLElement) {
  expect(dialog).toHaveFocus();
  const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  const last = focusable.at(-1);
  expect(last).toBeDefined();

  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

  expect(last).toHaveFocus();
}

function PlayerDetailHarness() {
  const [player, setPlayer] = useState<Player | null>(null);
  const notes = usePlayerNotes();

  return (
    <>
      <button type="button" onClick={() => setPlayer(players[0])}>
        {notes.hasNote(players[0].id) ? "Edit player detail" : "Open player detail"}
      </button>
      <PlayerDetailDrawer
        player={player}
        onClose={() => setPlayer(null)}
      />
    </>
  );
}

describe("fantasy dialog focus traps", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  afterEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  it("wraps immediate Shift+Tab to the end of the compare modal", () => {
    render(
      <CompareModal
        players={players}
        onClose={jest.fn()}
        onRemove={jest.fn()}
      />
    );

    expectImmediateBackwardWrap(screen.getByRole("dialog", { name: "Compare players" }));
  });

  it("wraps immediate Shift+Tab to the end of the player drawer", () => {
    render(
      <PlayerDetailDrawer
        player={players[0]}
        onClose={jest.fn()}
      />
    );

    expectImmediateBackwardWrap(screen.getByRole("dialog", { name: "First Back detail" }));
  });

  it("keeps compare focus through a parent re-render that hands it a new onClose", () => {
    // CompareTray passes an inline arrow and subscribes to the compare store, so
    // every store write gave the modal a fresh onClose. Depending on it restarted
    // the trap and threw focus back to the panel mid-interaction.
    function CompareHarness() {
      const [, forceRender] = useState(0);
      return (
        <>
          <button type="button" onClick={() => forceRender((n) => n + 1)}>
            Force parent render
          </button>
          <CompareModal
            players={players}
            onClose={() => undefined}
            onRemove={() => undefined}
          />
        </>
      );
    }

    render(<CompareHarness />);

    const removeButtons = screen.getAllByRole("button", { name: /remove .* from compare/i });
    const target = removeButtons[removeButtons.length - 1];
    target.focus();
    expect(target).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Force parent render" }));

    expect(target).toHaveFocus();
  });

  it("keeps note focus through store-driven parent renders and restores the opener on close", async () => {
    const user = userEvent.setup();
    render(<PlayerDetailHarness />);

    const opener = screen.getByRole("button", { name: "Open player detail" });
    await user.click(opener);

    const note = screen.getByRole("textbox", { name: "Private note" });
    await user.type(note, "Target round 6");

    expect(note).toHaveValue("Target round 6");
    expect(note).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "First Back detail" })).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
