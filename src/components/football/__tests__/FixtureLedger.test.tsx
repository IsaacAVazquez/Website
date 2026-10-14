import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import type { GenericFixture } from "../FixtureCard";
import { FixtureLedgerSection } from "../FixtureLedger";

function fixture(overrides: Partial<GenericFixture> = {}): GenericFixture {
  return {
    id: "game-1",
    utcDate: "2026-09-27T17:25:00Z",
    status: "SCHEDULED",
    matchday: null,
    homeTeam: { id: "home", shortName: "Home", crest: null },
    awayTeam: { id: "away", shortName: "Away", crest: null },
    score: { winner: null, home: null, away: null },
    ...overrides,
  };
}

function renderLedger(
  fixtures: GenericFixture[],
  props: Partial<ComponentProps<typeof FixtureLedgerSection>> = {}
) {
  return render(
    <FixtureLedgerSection groups={[{ key: "stage", label: "Regular season", fixtures }]} {...props} />
  );
}

describe("FixtureLedgerSection dates", () => {
  it("distinguishes upcoming games on consecutive Sundays within one stage", () => {
    renderLedger([
      fixture(),
      fixture({ id: "game-2", utcDate: "2026-10-04T17:25:00Z" }),
    ]);

    expect(screen.getByText("Sep 27")).toBeVisible();
    expect(screen.getByText("Oct 4")).toBeVisible();
    expect(screen.getAllByText("1:25 PM EDT")).toHaveLength(2);
  });

  it("keeps a finished game's day alongside its score and shootout", () => {
    const { container } = renderLedger([
      fixture({
        status: "FINISHED",
        score: { winner: "HOME_TEAM", home: 0, away: 0, shootoutHome: 4, shootoutAway: 3 },
      }),
    ]);

    expect(screen.getByText("Sep 27")).toBeVisible();
    expect(container).toHaveTextContent("0–0");
    expect(screen.getByText("4–3 pens")).toBeVisible();
    expect(screen.queryByText("1:25 PM EDT")).not.toBeInTheDocument();
  });

  it("stacks the day, the missing time, and the if necessary flag as lines of their own", () => {
    // One line of all three ran about 155px and took the room from the team names on a phone.
    renderLedger([
      fixture({ utcDate: "2026-10-18T00:00:00Z", startTimeTbd: true, ifNecessary: true }),
    ]);

    for (const line of ["Oct 18", "time TBD", "if necessary"]) {
      expect(screen.getByText(line)).toHaveClass("whitespace-nowrap");
    }
  });

  it("prints only the day for a finished game whose placeholder flags were never cleared", () => {
    renderLedger([
      fixture({ utcDate: "2026-10-18T00:00:00Z", status: "FINISHED", startTimeTbd: true, ifNecessary: true }),
    ]);

    expect(screen.getByText("Oct 18")).toBeVisible();
    expect(screen.queryByText("time TBD")).not.toBeInTheDocument();
    expect(screen.queryByText("if necessary")).not.toBeInTheDocument();
  });

  it("keeps the if necessary flag once the game has a start time", () => {
    renderLedger([fixture({ utcDate: "2026-10-17T01:00:00Z", ifNecessary: true })]);

    expect(screen.getByText("Oct 16")).toBeVisible();
    expect(screen.getByText("9:00 PM EDT")).toBeVisible();
    expect(screen.getByText("if necessary")).toBeVisible();
  });

  it("leaves the day to the group label when the label names it", () => {
    renderLedger(
      [
        fixture(),
        fixture({ id: "game-2", status: "FINISHED", score: { winner: "DRAW", home: 1, away: 1 } }),
      ],
      { dayInLabel: true }
    );

    expect(screen.queryByText("Sep 27")).not.toBeInTheDocument();
    expect(screen.getAllByText("1:25 PM EDT")).toHaveLength(1);
  });
});

describe("FixtureLedgerSection rows", () => {
  it("prints the group label without counting its rows", () => {
    // The lists are capped, so a count read as the size of the whole round.
    const { container } = renderLedger(
      ["a", "b", "c", "d"].map((id) => fixture({ id }))
    );

    expect(screen.getByText("Regular season")).toBeVisible();
    expect(screen.getAllByText("Home")).toHaveLength(4);
    expect(container).not.toHaveTextContent(/\d+ games?/);
  });

  it("reads a finished game with no score as final and names the winner", () => {
    const { container } = renderLedger([
      fixture({ status: "FINISHED", score: { winner: "AWAY_TEAM", home: null, away: null } }),
    ]);

    expect(screen.getByText("Final")).toBeVisible();
    expect(screen.getByText(", Away won")).toBeInTheDocument();
    expect(container).not.toHaveTextContent("–");
  });

  it("marks the rows of the team in context and prints its result", () => {
    renderLedger(
      [
        fixture({ status: "FINISHED", score: { winner: "HOME_TEAM", home: 2, away: 1 } }),
        fixture({
          id: "game-2",
          status: "FINISHED",
          homeTeam: { id: "third", shortName: "Third", crest: null },
          score: { winner: "AWAY_TEAM", home: 0, away: 1 },
        }),
      ],
      { contextTeamId: "home" }
    );

    const marked = document.querySelectorAll("[data-selected]");
    expect(marked).toHaveLength(1);
    expect(within(marked[0] as HTMLElement).getByText("Win")).toBeInTheDocument();
    expect(screen.queryByText("Loss")).not.toBeInTheDocument();
  });

  it("lets a long team name take a second line, aligned to its own side", () => {
    // One line cut names like Crystal Palace at the width of a phone.
    renderLedger([fixture()]);

    expect(screen.getByText("Home")).toHaveClass("line-clamp-2", "break-words", "text-left");
    expect(screen.getByText("Away")).toHaveClass("line-clamp-2", "break-words", "text-right");
    expect(screen.getByText("Home")).not.toHaveClass("truncate");
  });
});

describe("FixtureLedgerSection team buttons", () => {
  it("opens either team when no test is passed", () => {
    const onOpenTeam = jest.fn();
    renderLedger([fixture()], { onOpenTeam });

    fireEvent.click(screen.getByRole("button", { name: "Away" }));
    expect(onOpenTeam).toHaveBeenCalledWith("away");
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("prints a team the page cannot open as text", () => {
    // A bracket placeholder such as "NL Champion" has no detail to open.
    renderLedger([fixture()], { onOpenTeam: jest.fn(), canOpenTeam: (teamId) => teamId !== "away" });

    expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Away" })).not.toBeInTheDocument();
    expect(screen.getByText("Away")).toBeVisible();
  });

  it("prints no buttons without a handler, whatever the test says", () => {
    renderLedger([fixture()], { canOpenTeam: () => true });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
