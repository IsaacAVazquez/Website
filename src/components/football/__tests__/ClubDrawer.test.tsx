import { render, screen } from "@testing-library/react";
import { ClubDrawer, type ClubDrawerClub } from "../ClubDrawer";
import type { GenericFixture } from "../FixtureCard";

const club: ClubDrawerClub = {
  id: "57",
  name: "Arsenal FC",
  crest: null,
  position: 1,
  points: 19,
  played: 7,
  won: 6,
  draw: 1,
  lost: 0,
  goalsFor: 14,
  goalsAgainst: 3,
  goalDifference: 11,
};

function fixture(overrides: Partial<GenericFixture> = {}): GenericFixture {
  return {
    id: "match-1",
    utcDate: "2026-10-18T15:30:00Z",
    status: "TIMED",
    matchday: 8,
    homeTeam: { id: "57", shortName: "Arsenal", crest: null },
    awayTeam: { id: "351", shortName: "Nottingham", crest: null },
    score: { winner: null, home: null, away: null },
    ...overrides,
  };
}

describe("ClubDrawer fixtures", () => {
  it("dates every fixture, so two Sundays at the same hour read apart", () => {
    render(
      <ClubDrawer
        club={club}
        formSequence={[]}
        topScorers={[]}
        recentFixtures={[
          fixture({
            id: "match-0",
            utcDate: "2026-10-04T14:00:00Z",
            status: "FINISHED",
            score: { winner: "HOME_TEAM", home: 2, away: 0 },
          }),
        ]}
        upcomingFixtures={[
          fixture(),
          fixture({
            id: "match-2",
            utcDate: "2026-11-01T16:30:00Z",
            awayTeam: { id: "64", shortName: "Liverpool", crest: null },
          }),
        ]}
        onClose={() => {}}
      />
    );

    expect(screen.getByText("Oct 4")).toBeVisible();
    expect(screen.getByText("Oct 18, 11:30 AM EDT")).toBeVisible();
    expect(screen.getByText("Nov 1, 11:30 AM EST")).toBeVisible();
  });
});
