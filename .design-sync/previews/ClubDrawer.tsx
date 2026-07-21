import * as React from "react";
import {
  ClubDrawer,
  type ClubDrawerClub,
  type ClubDrawerScorer,
  type GenericFixture,
} from "isaac-vazquez-portfolio";

const noop = () => {};

/**
 * The drawer renders position: fixed against the viewport. A transformed
 * ancestor turns the frame into its containing block so the open state stays
 * inside the capture card.
 */
function Frame({ height, children }: { height: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        height,
        overflow: "hidden",
        transform: "translateZ(0)",
        borderRadius: 12,
      }}
    >
      {children}
    </div>
  );
}

const arsenal: ClubDrawerClub = {
  id: "57",
  name: "Arsenal",
  crest: null,
  accentColor: "#EF0107",
  position: 1,
  points: 82,
  played: 36,
  won: 25,
  draw: 7,
  lost: 4,
  goalsFor: 78,
  goalsAgainst: 28,
  goalDifference: 50,
  manager: "Mikel Arteta",
  venue: "Emirates Stadium",
};

const arsenalScorers: ClubDrawerScorer[] = [
  { name: "Bukayo Saka", goals: 16, assists: 11 },
  { name: "Kai Havertz", goals: 14, assists: 5 },
];

const arsenalRecent: GenericFixture[] = [
  {
    id: "pl-361",
    utcDate: "2026-05-09T14:00:00Z",
    status: "FINISHED",
    matchday: 36,
    homeTeam: { id: "57", shortName: "Arsenal", crest: null },
    awayTeam: { id: "67", shortName: "Newcastle", crest: null },
    score: { winner: "HOME_TEAM", home: 3, away: 1 },
  },
  {
    id: "pl-343",
    utcDate: "2026-04-25T14:00:00Z",
    status: "FINISHED",
    matchday: 34,
    homeTeam: { id: "57", shortName: "Arsenal", crest: null },
    awayTeam: { id: "64", shortName: "Liverpool", crest: null },
    score: { winner: "DRAW", home: 2, away: 2 },
  },
];

const arsenalUpcoming: GenericFixture[] = [
  {
    id: "pl-374",
    utcDate: "2026-05-17T15:30:00Z",
    status: "TIMED",
    matchday: 37,
    homeTeam: { id: "62", shortName: "Everton", crest: null },
    awayTeam: { id: "57", shortName: "Arsenal", crest: null },
    score: { winner: null, home: null, away: null },
  },
];

export const OpenClubDetail = () => (
  <Frame height={700}>
    <ClubDrawer
      club={arsenal}
      formSequence={["W", "W", "D", "W", "L"]}
      topScorers={arsenalScorers}
      recentFixtures={arsenalRecent}
      upcomingFixtures={arsenalUpcoming}
      onClose={noop}
    />
  </Frame>
);

const realBetis: ClubDrawerClub = {
  id: "90",
  name: "Real Betis",
  crest: null,
  accentColor: "#00954C",
  position: 6,
  points: 57,
  played: 35,
  won: 16,
  draw: 9,
  lost: 10,
  goalsFor: 52,
  goalsAgainst: 44,
  goalDifference: 8,
  manager: "Manuel Pellegrini",
  venue: "Estadio Benito Villamarín",
};

export const LoadingDetail = () => (
  <Frame height={480}>
    <ClubDrawer
      club={realBetis}
      formSequence={["D", "W", "L", "W", "D"]}
      topScorers={[]}
      recentFixtures={[]}
      upcomingFixtures={[]}
      isLoadingDetail
      onClose={noop}
    />
  </Frame>
);
