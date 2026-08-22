import React from "react";
import { render, screen } from "@testing-library/react";

import { FANTASY_VALUE_TOOLTIP } from "@/lib/fantasyUtils";
import type { Player } from "@/types";

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

// Ranked 1st, drafted around pick 40 on a deep mock sample, so the value gate
// fires and the drawer has to explain both the ADP number and the chip.
const valuePlayer: Player = {
  id: "rb-1",
  name: "First Back",
  team: "ATL",
  position: "RB",
  averageRank: 1,
  rankEcr: 1,
  positionRank: 1,
  standardDeviation: 1,
  adp: 40,
  adpTimesDrafted: 500,
  adpStandardDeviation: 2,
};

describe("player drawer metric explanations", () => {
  it("explains market ADP, the expert spread, and the value chip", () => {
    render(<PlayerDetailDrawer player={valuePlayer} onClose={jest.fn()} />);

    expect(screen.getByRole("button", { name: "What is Market ADP?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "What is Expert spread?" })).toBeInTheDocument();
    expect(screen.getByTitle(FANTASY_VALUE_TOOLTIP)).toHaveTextContent("Value");
  });
});
