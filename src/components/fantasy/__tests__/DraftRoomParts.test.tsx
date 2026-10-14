import React, { createRef } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import {
  DraftLastPicks,
  DraftPickGrid,
  DraftRoster,
  DraftScorebug,
  DraftScorebugCell,
  type RoomPick,
} from "../DraftRoomParts";
import type { Player } from "@/types";

function player(partial: Partial<Player> & Pick<Player, "id" | "name" | "position">): Player {
  return { team: "FA", averageRank: 1, ...partial };
}

/** Five picks of a four-team room, by the slot that made each. */
function picks(slots: number[]): RoomPick[] {
  const names = ["Ja'Marr Chase", "Bijan Robinson", "Josh Allen", "Travis Kelce", "Nico Collins"];
  const positions = ["WR", "RB", "QB", "TE", "WR"] as const;
  const teams = ["CIN", "ATL", "BUF", "KC", "HOU"];
  return slots.map((teamNumber, index) => ({
    pickNumber: index + 1,
    teamNumber,
    player: player({
      id: `p${index + 1}`,
      name: names[index],
      position: positions[index],
      team: teams[index],
      positionRank: index === 4 ? 2 : 1,
    }),
  }));
}

const snake = (teams: number) => (pick: number) => {
  const round = Math.ceil(pick / teams);
  const position = ((pick - 1) % teams) + 1;
  return round % 2 === 1 ? position : teams - position + 1;
};
const linear = (teams: number) => (pick: number) => ((pick - 1) % teams) + 1;

/** The cells of one round, left to right, as their accessible names. */
function roundCells(grid: HTMLElement, teams: number, round: number): string[] {
  return within(grid)
    .getAllByRole("img")
    .slice((round - 1) * teams, round * teams)
    .map((cell) => cell.getAttribute("aria-label") ?? "");
}

describe("DraftPickGrid", () => {
  it("lays a snake round out right to left, and marks the cell on the clock", () => {
    const { container } = render(
      <DraftPickGrid
        picks={picks([1, 2, 3, 4, 4])}
        totalTeams={4}
        userTeam={3}
        rounds={3}
        slotForPick={snake(4)}
        currentPick={6}
        currentRound={2}
        isComplete={false}
      />
    );
    const grid = container.querySelector(".ffb-grid") as HTMLElement;

    // It stops at the current round, and the second round carries the reversed mark.
    expect(within(grid).getByText("R1")).toBeInTheDocument();
    expect(within(grid).getByText("R2")).toBeInTheDocument();
    expect(within(grid).queryByText("R3")).not.toBeInTheDocument();
    expect(within(grid).getByText("R1").querySelector(".ffb-grid-dir")).not.toHaveClass("ffb-is-rev");
    expect(within(grid).getByText("R2").querySelector(".ffb-grid-dir")).toHaveClass("ffb-is-rev");

    expect(roundCells(grid, 4, 1)).toEqual([
      "Pick 1, slot 1, Ja'Marr Chase, WR",
      "Pick 2, slot 2, Bijan Robinson, RB",
      "Pick 3, slot 3, yours, Josh Allen, QB",
      "Pick 4, slot 4, Travis Kelce, TE",
    ]);
    // Pick 5 is slot 4's, so it is the fourth cell of round two, and pick 6 is slot 3's.
    expect(roundCells(grid, 4, 2)).toEqual([
      "Pick 8, slot 1, open",
      "Pick 7, slot 2, open",
      "Pick 6, slot 3, yours, on the clock",
      "Pick 5, slot 4, Nico Collins, WR",
    ]);
    expect(screen.getByRole("img", { name: "Pick 6, slot 3, yours, on the clock" })).toHaveClass("ffb-is-live");
    expect(screen.getByRole("img", { name: "Pick 5, slot 4, Nico Collins, WR" })).toHaveTextContent("WR2");
    expect(screen.getByText(/Odd rounds run left to right and even rounds run right to left\./)).toBeInTheDocument();
  });

  it("lays every round of a linear draft out left to right", () => {
    const { container } = render(
      <DraftPickGrid
        picks={picks([1, 2, 3, 4, 1])}
        totalTeams={4}
        userTeam={1}
        rounds={3}
        slotForPick={linear(4)}
        currentPick={6}
        currentRound={2}
        isComplete={false}
      />
    );
    const grid = container.querySelector(".ffb-grid") as HTMLElement;

    expect(within(grid).getByText("R2").querySelector(".ffb-grid-dir")).not.toHaveClass("ffb-is-rev");
    expect(roundCells(grid, 4, 2)).toEqual([
      "Pick 5, slot 1, yours, Nico Collins, WR",
      "Pick 6, slot 2, on the clock",
      "Pick 7, slot 3, open",
      "Pick 8, slot 4, open",
    ]);
    expect(screen.getByText(/Every round runs left to right\./)).toBeInTheDocument();
  });

  it("shows every round of a finished draft with no cell on the clock", () => {
    const { container } = render(
      <DraftPickGrid
        picks={picks([1, 2, 3, 4, 4])}
        totalTeams={4}
        userTeam={2}
        rounds={3}
        slotForPick={snake(4)}
        currentPick={13}
        currentRound={3}
        isComplete
      />
    );

    expect(container.querySelectorAll(".ffb-grid-round")).toHaveLength(3);
    expect(container.querySelector(".ffb-is-live")).toBeNull();
  });

  it("lists every pick by round under the grid, with the user's own marked", () => {
    render(
      <DraftPickGrid
        picks={picks([1, 2, 3, 4, 4])}
        totalTeams={4}
        userTeam={4}
        rounds={3}
        slotForPick={snake(4)}
        currentPick={6}
        currentRound={2}
        isComplete={false}
      />
    );
    const all = screen.getByText("All picks").closest("details") as HTMLDetailsElement;

    expect(all.open).toBe(false);
    expect(within(all).getAllByRole("heading", { level: 4 }).map((heading) => heading.textContent)).toEqual([
      "Round 1",
      "Round 2",
    ]);
    const lines = within(all).getAllByRole("listitem", { hidden: true });
    expect(lines.map((line) => line.textContent)).toEqual([
      "#1 · Slot 1 · Ja'Marr Chase · WR1 · CIN",
      "#2 · Slot 2 · Bijan Robinson · RB1 · ATL",
      "#3 · Slot 3 · Josh Allen · QB1 · BUF",
      "#4 · Slot 4 (you) · Travis Kelce · TE1 · KC",
      "#5 · Slot 4 (you) · Nico Collins · WR2 · HOU",
    ]);
    expect(lines[3]).toHaveClass("ffb-rm-is-mine");
    expect(lines[0]).not.toHaveClass("ffb-rm-is-mine");
  });

  it("gives two grids on one page headings of their own", () => {
    const props = {
      picks: picks([1, 2]),
      totalTeams: 4,
      userTeam: 1,
      rounds: 3,
      slotForPick: snake(4),
      currentPick: 3,
      currentRound: 1,
      isComplete: false,
    };
    render(
      <>
        <DraftPickGrid {...props} />
        <DraftPickGrid {...props} />
      </>
    );

    const ids = screen.getAllByRole("heading", { name: "Pick grid" }).map((heading) => heading.id);
    expect(new Set(ids).size).toBe(2);
    expect(screen.getAllByRole("region", { name: "Pick grid" })).toHaveLength(2);
  });

  it("is a rail block headed Pick grid at level 3, with no names in its cells, unless a page says otherwise", () => {
    render(
      <DraftPickGrid
        picks={picks([1, 2])}
        totalTeams={4}
        userTeam={1}
        rounds={3}
        slotForPick={snake(4)}
        currentPick={3}
        currentRound={1}
        isComplete={false}
      />
    );

    const heading = screen.getByRole("heading", { level: 3, name: "Pick grid" });
    expect(heading).toHaveClass("ffb-h3");
    expect(heading.parentElement).toHaveClass("ffb-sechead");
    expect(heading.parentElement).not.toHaveClass("ffb-sechead-lg");
    const cell = screen.getByRole("img", { name: "Pick 1, slot 1, yours, Ja'Marr Chase, WR" });
    expect(cell).toHaveTextContent(/^WR1$/);
    expect(cell.closest(".ffb-grid")).not.toHaveClass("ffb-grid-names");
  });

  it("takes a page's heading and level, the section head, and prints each player's name where asked", () => {
    render(
      <DraftPickGrid
        picks={picks([1, 2])}
        totalTeams={4}
        userTeam={1}
        rounds={3}
        slotForPick={snake(4)}
        currentPick={3}
        currentRound={3}
        isComplete
        heading="The board"
        headingLevel={2}
        sectionHead
        names
      />
    );

    // One heading names the grid and its region, in the look a section of the page takes.
    const heading = screen.getByRole("heading", { level: 2, name: "The board" });
    expect(heading).toHaveClass("ffb-h2");
    expect(heading.parentElement).toHaveClass("ffb-sechead", "ffb-sechead-lg");
    expect(screen.getByRole("region", { name: "The board" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Pick grid" })).not.toBeInTheDocument();

    // A made cell prints its label and then the name. Its accessible name is unchanged.
    const cell = screen.getByRole("img", { name: "Pick 2, slot 2, Bijan Robinson, RB" });
    expect(cell.closest(".ffb-grid")).toHaveClass("ffb-grid-names");
    expect(cell.querySelector(".ffb-cell-name")).toHaveTextContent(/^Bijan Robinson$/);
    // An open cell has nobody to name.
    expect(screen.getByRole("img", { name: "Pick 3, slot 3, open" }).querySelector(".ffb-cell-name")).toBeNull();
  });
});

describe("DraftScorebug", () => {
  it("is a named section with one announcement, the room's cells, and its actions", () => {
    const cellRef = createRef<HTMLDivElement>();
    render(
      <DraftScorebug
        label="Live mock draft status"
        announcement="Pick 3 of 48."
        className="room-bug"
        actions={<button type="button" className="ffb-bug-btn">Take back</button>}
      >
        <DraftScorebugCell label="Pick" note="Round 1">3</DraftScorebugCell>
        <DraftScorebugCell label="On the clock" live ref={cellRef} tabIndex={-1} title="The Long Team Name">
          The Long Team Name
        </DraftScorebugCell>
        <DraftScorebugCell label="Clock" role="timer" aria-label="30 seconds left" className="ffb-is-quiet">
          0:30
        </DraftScorebugCell>
      </DraftScorebug>
    );
    const bar = screen.getByRole("region", { name: "Live mock draft status" });

    expect(bar).toHaveClass("ffb-sticky");
    expect(within(bar).getByRole("status")).toHaveTextContent("Pick 3 of 48.");
    expect(bar.querySelector(".ffb-bug")).toHaveClass("room-bug");
    expect(within(bar).getByRole("button", { name: "Take back" }).parentElement).toHaveClass("ffb-bug-actions");

    // A cell is a label over a value, with an optional small line under it.
    const pick = within(bar).getByText("Pick").closest("div") as HTMLElement;
    expect(pick).toHaveClass("ffb-bug-seg");
    expect(pick).not.toHaveClass("ffb-bug-live");
    expect(pick.querySelector(".ffb-bug-value")).toHaveTextContent("3");
    expect(pick.querySelector(".ffb-bug-note")).toHaveTextContent("Round 1");

    // The live cell is the highlighter cell, and a room can focus it.
    const live = within(bar).getByText("On the clock").closest("div") as HTMLElement;
    expect(live).toHaveClass("ffb-bug-seg", "ffb-bug-live");
    expect(live).toHaveAttribute("title", "The Long Team Name");
    expect(cellRef.current).toBe(live);
    cellRef.current?.focus();
    expect(live).toHaveFocus();

    // Anything else a room passes lands on the cell.
    expect(within(bar).getByRole("timer", { name: "30 seconds left" })).toHaveClass("ffb-bug-seg", "ffb-is-quiet");
  });

  it("prints no status sentence of its own when a room keeps one", () => {
    render(
      <DraftScorebug label="Live draft status">
        <DraftScorebugCell label="Pick">1</DraftScorebugCell>
      </DraftScorebug>
    );

    const bar = screen.getByRole("region", { name: "Live draft status" });
    expect(within(bar).queryByRole("status")).not.toBeInTheDocument();
    expect(within(bar).getByText("Pick")).toBeInTheDocument();
  });

  it("leaves the actions out when a room passes none", () => {
    const { container } = render(
      <DraftScorebug label="Live draft status" announcement="">
        <DraftScorebugCell label="Pick">1</DraftScorebugCell>
      </DraftScorebug>
    );

    expect(container.querySelector(".ffb-bug-actions")).toBeNull();
  });
});

describe("DraftLastPicks", () => {
  it("makes each sticker the button that undoes back to its pick", () => {
    const onUndoToPick = jest.fn();
    render(<DraftLastPicks picks={picks([1, 2, 3]).reverse()} userTeam={3} onUndoToPick={onUndoToPick} />);

    expect(screen.getByRole("heading", { level: 3, name: "Last picks" })).toBeInTheDocument();
    expect(screen.getByText("Select one to undo back to it")).toBeInTheDocument();
    const mine = screen.getByRole("button", { name: "Undo back to pick 3 (Josh Allen)" });
    expect(mine).toHaveClass("ffb-sticker", "ffb-pos-qb", "ffb-is-mine");
    expect(mine).toHaveTextContent("#3 · You");
    fireEvent.click(screen.getByRole("button", { name: "Undo back to pick 2 (Bijan Robinson)" }));
    expect(onUndoToPick).toHaveBeenCalledWith(2);
  });

  it("prints plain stickers under a room's own heading when there is no undo", () => {
    render(<DraftLastPicks picks={picks([1, 2]).reverse()} userTeam={1} heading="Since your pick" headingLevel={2} />);

    expect(screen.getByRole("heading", { level: 2, name: "Since your pick" })).toHaveClass("ffb-h3");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("Select one to undo back to it")).not.toBeInTheDocument();
    const stickers = screen.getAllByRole("listitem");
    expect(stickers).toHaveLength(2);
    expect(stickers[0]).toHaveClass("ffb-sticker", "ffb-pos-rb");
    expect(stickers[1]).toHaveClass("ffb-sticker", "ffb-pos-wr", "ffb-is-mine");
    expect(stickers[0]).toHaveTextContent("#2 · Slot 2");
  });

  it("renders nothing before the first pick", () => {
    const { container } = render(<DraftLastPicks picks={[]} userTeam={1} />);

    expect(container.firstChild).toBeNull();
  });
});

describe("DraftRoster", () => {
  it("keys an open slot with its position, the flex slot with the flex thirds, and fills a slot with its sticker", () => {
    render(
      <DraftRoster
        assignment={{
          slots: [
            { slot: "QB", eligible: ["QB"], player: null },
            { slot: "WR", eligible: ["WR"], player: player({ id: "w", name: "Ja'Marr Chase", position: "WR", team: "CIN", byeWeek: 6 }) },
            { slot: "FLX", eligible: ["RB", "WR", "TE"], player: null },
          ],
          bench: 5,
        }}
        picked={6}
        rounds={7}
      />
    );
    const slots = screen.getAllByRole("listitem");

    expect(screen.getByRole("region", { name: "Your roster" })).toHaveClass("ffb-rail-lead");
    expect(screen.getByText("6 of 7 picked")).toBeInTheDocument();
    expect(slots[0]).toHaveClass("ffb-slot", "ffb-pos-qb");
    expect(slots[0]).toHaveTextContent("QB Open");
    expect(slots[1]).toHaveClass("ffb-slot", "ffb-is-filled", "ffb-pos-wr");
    expect(slots[1]).toHaveTextContent("WR J. Chase CIN · Bye 6");
    // The team and the bye are a span each, in that order, so the kit drops the bye first where the slot is narrow.
    expect(Array.from(slots[1].querySelectorAll(".ffb-slot-meta > span"), (part) => part.textContent?.trim())).toEqual([
      "CIN",
      "· Bye 6",
    ]);
    expect(slots[2]).toHaveClass("ffb-slot", "ffb-pos-flex");
    // The lineup leaves four bench spots, and a fifth player is there, so the total follows the count.
    expect(slots[3]).toHaveTextContent("BN Bench 5 of 5");
  });
});
