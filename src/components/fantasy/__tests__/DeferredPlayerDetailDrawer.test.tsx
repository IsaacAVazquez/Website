import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import type { Player } from "@/types";

import { DeferredPlayerDetailDrawer } from "../DeferredPlayerDetailDrawer";

const player: Player = {
  id: "rb-1",
  name: "First Back",
  team: "ATL",
  position: "RB",
  averageRank: 1,
  rankEcr: 1,
  positionRank: 1,
  standardDeviation: 1,
};

function Harness() {
  const [open, setOpen] = useState<Player | null>(null);
  return (
    <>
      <button type="button" onClick={() => setOpen(player)}>
        Open
      </button>
      <DeferredPlayerDetailDrawer player={open} onClose={() => setOpen(null)} />
    </>
  );
}

describe("DeferredPlayerDetailDrawer", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  it("renders nothing until a player is opened, then the drawer", async () => {
    render(<Harness />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    expect(await screen.findByRole("dialog", { name: "First Back detail" })).toBeVisible();
  });

  it("takes focus when it arrives and hands it back when it closes", async () => {
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Open" });
    opener.focus();
    fireEvent.click(opener);

    expect(await screen.findByRole("dialog")).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  // The drawer stays mounted once it has opened, so nothing has to load again
  // and its exit animation has an element to run on.
  it("opens at once the second time", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    expect(screen.getByRole("dialog", { name: "First Back detail" })).toBeVisible();
  });
});
