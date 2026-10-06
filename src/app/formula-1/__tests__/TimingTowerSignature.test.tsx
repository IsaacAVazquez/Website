import { render, screen } from "@testing-library/react";
import type { Formula1ConstructorStanding } from "@/types/formula1";
import { TimingTowerSignature } from "../TimingTowerSignature";

function teams(count: number): Formula1ConstructorStanding[] {
  return Array.from({ length: count }, (_, index) => ({
    position: index + 1,
    previousPosition: index + 1,
    teamName: `Team ${index + 1}`,
    teamColor: null,
    points: 200 - index * 10,
    pointsBeforeRace: 190 - index * 10,
    pointsDelta: 10,
  }));
}

// The stylesheet is what hides a marked row on a phone, so these check the mark.
const pastPhone = () =>
  screen.getAllByRole("listitem").filter((row) => row.className.includes("towerRowPastPhone"));

describe("TimingTowerSignature on a phone", () => {
  it("marks the rows past the tenth and links to the full table", () => {
    render(<TimingTowerSignature standings={teams(23)} kind="constructors" fullTableHref="/formula-1?view=constructors#season" />);

    expect(pastPhone()).toHaveLength(13);
    expect(screen.getByText("Top 10 of 23")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See all 23 teams" })).toHaveAttribute(
      "href",
      "/formula-1?view=constructors#season"
    );
  });

  it("prints a tower of eleven whole", () => {
    render(<TimingTowerSignature standings={teams(11)} kind="constructors" fullTableHref="/formula-1" />);

    expect(pastPhone()).toHaveLength(0);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
