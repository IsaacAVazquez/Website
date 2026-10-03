import { fireEvent, render, screen } from "@testing-library/react";
import type { WorldCupFixture, WorldCupKnockoutRound } from "@/types/worldCup";
import { bracketTree } from "../bracketTree";
import { WorldCupBracket } from "../WorldCupBracket";

function team(id: string, code = id.slice(0, 3).toUpperCase()) {
  return { id, code, shortName: id[0].toUpperCase() + id.slice(1), crest: null };
}

function fixture(
  id: string,
  home: string,
  away: string,
  score: Partial<WorldCupFixture["score"]> = {},
  status = "FINISHED"
): WorldCupFixture {
  return {
    id,
    utcDate: "2026-07-10T19:00Z",
    status,
    stage: "Knockout",
    group: null,
    matchday: null,
    venue: null,
    homeTeam: team(home),
    awayTeam: team(away),
    score: { winner: null, home: null, away: null, ...score },
  };
}

const SEMIS: WorldCupKnockoutRound = {
  id: "semifinals",
  name: "Semifinals",
  order: 3,
  fixtures: [
    fixture("s1", "spain", "france", { winner: "HOME_TEAM", home: 2, away: 1 }),
    fixture("s2", "brazil", "argentina", { winner: "AWAY_TEAM", home: 1, away: 1, shootoutHome: 2, shootoutAway: 4 }),
  ],
};

const FINAL: WorldCupKnockoutRound = {
  id: "final",
  name: "Final",
  order: 5,
  fixtures: [fixture("f1", "spain", "argentina", { winner: "AWAY_TEAM", home: 0, away: 1 })],
};

function svgTexts(container: HTMLElement) {
  return Array.from(container.querySelectorAll("svg text")).map((node) => node.textContent);
}

describe("WorldCupBracket", () => {
  it("shows a placeholder before any knockout fixture exists", () => {
    const { rerender } = render(<WorldCupBracket tree={bracketTree([])} />);
    expect(screen.getByText("The bracket fills in once the knockout stage is drawn.")).toBeInTheDocument();

    rerender(<WorldCupBracket tree={bracketTree([{ ...FINAL, fixtures: [] }])} />);
    expect(screen.getByText("The bracket fills in once the knockout stage is drawn.")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeNull();
  });

  it("draws every round with scores, shootouts, and the champion in the title", () => {
    const { container } = render(<WorldCupBracket tree={bracketTree([FINAL, SEMIS])} />);

    expect(screen.getByRole("region", { name: /knockout bracket/i })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("img", { name: /Argentina won it\./ })).toBeInTheDocument();

    const texts = svgTexts(container);
    expect(texts).toEqual(expect.arrayContaining(["Semifinals", "Final", "SPA", "FRA", "2", "1 (2)", "1 (4)"]));
    // The champion box sits after the final and names the winner.
    expect(texts.at(-1)).toBe("Argentina");
    // Two semifinal feed lines plus the final's line to the champion box.
    expect(container.querySelectorAll("path.c97-bracket-line")).toHaveLength(3);
  });

  it("marks winners and losers and dims the losing score", () => {
    const { container } = render(<WorldCupBracket tree={bracketTree([FINAL, SEMIS])} />);

    const france = Array.from(container.querySelectorAll("text")).find((node) => node.textContent === "FRA");
    expect(france).toHaveClass("c97-bracket-name-loser");
    const spain = Array.from(container.querySelectorAll("text")).filter((node) => node.textContent === "SPA");
    expect(spain[0]).toHaveClass("c97-bracket-name-winner");
    const franceScore = france?.nextElementSibling;
    expect(franceScore).toHaveClass("c97-bracket-score", "c97-bracket-name-loser");
  });

  it("prints a dash for unplayed scores and TBD for an undecided final", () => {
    const pending: WorldCupKnockoutRound = {
      ...FINAL,
      fixtures: [fixture("f1", "spain", "argentina", {}, "SCHEDULED")],
    };
    const { container } = render(<WorldCupBracket tree={bracketTree([pending])} />);

    const texts = svgTexts(container);
    expect(texts.filter((text) => text === "–")).toHaveLength(2);
    expect(texts.at(-1)).toBe("TBD");
    expect(screen.getByRole("img", { name: "The knockout bracket from the Round of 32 to the final." })).toBeInTheDocument();
    // Without a winner neither side is styled as winner or loser.
    expect(container.querySelector(".c97-bracket-name-winner, .c97-bracket-name-loser")).toBeNull();
  });

  it("falls back to the short name when a team has no code", () => {
    const noCode: WorldCupKnockoutRound = {
      ...FINAL,
      fixtures: [{ ...FINAL.fixtures[0], homeTeam: { ...team("spain"), code: "" } }],
    };
    const { container } = render(<WorldCupBracket tree={bracketTree([noCode])} />);
    expect(svgTexts(container)).toContain("Spain");
  });

  it("opens a team when its name is clicked, and stays inert without a handler", () => {
    const onOpenTeam = jest.fn();
    const { container, rerender } = render(
      <WorldCupBracket tree={bracketTree([FINAL, SEMIS])} onOpenTeam={onOpenTeam} />
    );

    const brazil = Array.from(container.querySelectorAll("text")).find((node) => node.textContent === "BRA");
    fireEvent.click(brazil as Element);
    expect(onOpenTeam).toHaveBeenCalledWith("brazil");
    expect(container.querySelectorAll("g.c97-bracket-team").length).toBeGreaterThan(0);

    rerender(<WorldCupBracket tree={bracketTree([FINAL, SEMIS])} />);
    expect(container.querySelector("g.c97-bracket-team")).toBeNull();
  });
});
