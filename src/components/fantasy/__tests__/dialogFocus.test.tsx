import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

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
});
