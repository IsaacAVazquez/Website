import type { MlbSnapshot, MlbStandingsRow, MlbTeamOption } from "@/types/mlb";

const LOGO_BASE = "https://www.mlbstatic.com/team-logos";

interface SeedTeam {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  league: "AL" | "NL";
  division: string;
  venue: string;
}

const SEED_TEAMS: SeedTeam[] = [
  { id: "110", name: "Baltimore Orioles", shortName: "Orioles", abbreviation: "BAL", league: "AL", division: "AL East", venue: "Oriole Park at Camden Yards" },
  { id: "111", name: "Boston Red Sox", shortName: "Red Sox", abbreviation: "BOS", league: "AL", division: "AL East", venue: "Fenway Park" },
  { id: "147", name: "New York Yankees", shortName: "Yankees", abbreviation: "NYY", league: "AL", division: "AL East", venue: "Yankee Stadium" },
  { id: "139", name: "Tampa Bay Rays", shortName: "Rays", abbreviation: "TB", league: "AL", division: "AL East", venue: "Tropicana Field" },
  { id: "141", name: "Toronto Blue Jays", shortName: "Blue Jays", abbreviation: "TOR", league: "AL", division: "AL East", venue: "Rogers Centre" },
  { id: "145", name: "Chicago White Sox", shortName: "White Sox", abbreviation: "CWS", league: "AL", division: "AL Central", venue: "Guaranteed Rate Field" },
  { id: "114", name: "Cleveland Guardians", shortName: "Guardians", abbreviation: "CLE", league: "AL", division: "AL Central", venue: "Progressive Field" },
  { id: "116", name: "Detroit Tigers", shortName: "Tigers", abbreviation: "DET", league: "AL", division: "AL Central", venue: "Comerica Park" },
  { id: "118", name: "Kansas City Royals", shortName: "Royals", abbreviation: "KC", league: "AL", division: "AL Central", venue: "Kauffman Stadium" },
  { id: "142", name: "Minnesota Twins", shortName: "Twins", abbreviation: "MIN", league: "AL", division: "AL Central", venue: "Target Field" },
  { id: "117", name: "Houston Astros", shortName: "Astros", abbreviation: "HOU", league: "AL", division: "AL West", venue: "Daikin Park" },
  { id: "108", name: "Los Angeles Angels", shortName: "Angels", abbreviation: "LAA", league: "AL", division: "AL West", venue: "Angel Stadium" },
  { id: "133", name: "Athletics", shortName: "Athletics", abbreviation: "ATH", league: "AL", division: "AL West", venue: "Sutter Health Park" },
  { id: "136", name: "Seattle Mariners", shortName: "Mariners", abbreviation: "SEA", league: "AL", division: "AL West", venue: "T-Mobile Park" },
  { id: "140", name: "Texas Rangers", shortName: "Rangers", abbreviation: "TEX", league: "AL", division: "AL West", venue: "Globe Life Field" },
  { id: "144", name: "Atlanta Braves", shortName: "Braves", abbreviation: "ATL", league: "NL", division: "NL East", venue: "Truist Park" },
  { id: "146", name: "Miami Marlins", shortName: "Marlins", abbreviation: "MIA", league: "NL", division: "NL East", venue: "loanDepot park" },
  { id: "121", name: "New York Mets", shortName: "Mets", abbreviation: "NYM", league: "NL", division: "NL East", venue: "Citi Field" },
  { id: "143", name: "Philadelphia Phillies", shortName: "Phillies", abbreviation: "PHI", league: "NL", division: "NL East", venue: "Citizens Bank Park" },
  { id: "120", name: "Washington Nationals", shortName: "Nationals", abbreviation: "WSH", league: "NL", division: "NL East", venue: "Nationals Park" },
  { id: "112", name: "Chicago Cubs", shortName: "Cubs", abbreviation: "CHC", league: "NL", division: "NL Central", venue: "Wrigley Field" },
  { id: "113", name: "Cincinnati Reds", shortName: "Reds", abbreviation: "CIN", league: "NL", division: "NL Central", venue: "Great American Ball Park" },
  { id: "158", name: "Milwaukee Brewers", shortName: "Brewers", abbreviation: "MIL", league: "NL", division: "NL Central", venue: "American Family Field" },
  { id: "134", name: "Pittsburgh Pirates", shortName: "Pirates", abbreviation: "PIT", league: "NL", division: "NL Central", venue: "PNC Park" },
  { id: "138", name: "St. Louis Cardinals", shortName: "Cardinals", abbreviation: "STL", league: "NL", division: "NL Central", venue: "Busch Stadium" },
  { id: "109", name: "Arizona Diamondbacks", shortName: "D-backs", abbreviation: "ARI", league: "NL", division: "NL West", venue: "Chase Field" },
  { id: "115", name: "Colorado Rockies", shortName: "Rockies", abbreviation: "COL", league: "NL", division: "NL West", venue: "Coors Field" },
  { id: "119", name: "Los Angeles Dodgers", shortName: "Dodgers", abbreviation: "LAD", league: "NL", division: "NL West", venue: "Dodger Stadium" },
  { id: "135", name: "San Diego Padres", shortName: "Padres", abbreviation: "SD", league: "NL", division: "NL West", venue: "Petco Park" },
  { id: "137", name: "San Francisco Giants", shortName: "Giants", abbreviation: "SF", league: "NL", division: "NL West", venue: "Oracle Park" },
];

const teams: MlbTeamOption[] = SEED_TEAMS.map((team) => ({
  id: team.id,
  name: team.name,
  shortName: team.shortName,
  abbreviation: team.abbreviation,
  league: team.league,
  division: team.division,
  venue: team.venue,
  logo: `${LOGO_BASE}/${team.id}.svg`,
})).sort((a, b) => a.shortName.localeCompare(b.shortName));

function divisionRankFor(division: string, idx: number): number {
  return SEED_TEAMS.filter((t) => t.division === division).findIndex(
    (t) => t.id === SEED_TEAMS[idx].id
  ) + 1;
}

const standings: MlbStandingsRow[] = SEED_TEAMS.map((team, idx) => ({
  id: team.id,
  code: team.abbreviation,
  name: team.name,
  shortName: team.shortName,
  league: team.league,
  division: team.division,
  divisionRank: divisionRankFor(team.division, idx),
  leagueRank: 0,
  wildCardRank: null,
  gamesBack: 0,
  wildCardGamesBack: null,
  wins: 0,
  losses: 0,
  pct: 0,
  runsScored: 0,
  runsAllowed: 0,
  runDifferential: 0,
  streak: "",
  last10: "0-0",
}));

// Auto-generated by scripts/updateMlbSnapshot.ts. Initial seed includes the 30
// teams so the dashboard renders before the first script run; standings,
// games, and leaders are filled in once the script runs.
export const mlbSnapshot: MlbSnapshot = {
  season: "2026",
  updatedAt: new Date(0).toISOString().slice(0, 10),
  sourceLabel: "MLB Stats API",
  sourceUrls: {
    standings: "https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=2026",
    schedule: "https://statsapi.mlb.com/api/v1/schedule?sportId=1",
    leaders: "https://statsapi.mlb.com/api/v1/stats/leaders?sportId=1",
  },
  teams,
  standings,
  recentGames: [],
  upcomingGames: [],
  hittingLeaders: { homeRuns: [], runsBattedIn: [], battingAverage: [] },
  pitchingLeaders: { earnedRunAverage: [], wins: [], strikeouts: [] },
  teamSnapshots: {},
};
