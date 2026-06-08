import type { WorldCupSnapshot } from "@/types/worldCup";

// Hand-authored seed. The dynamic sections (groups, knockout, fixtures,
// scorers, teamOptions, teamSnapshots) ship empty and are filled by
// scripts/buildWorldCupSnapshot.ts from ESPN's public soccer/fifa.world
// endpoints, mirroring the NBA seed. The tournament block carries the stable,
// pre-confirmed facts (host nations, venues, format, dates) so the page is a
// useful tournament hub before the first whistle. Keys are JSON-shaped so the
// refresher's fallback reader can parse this file when an upstream fetch fails.
export const worldCupSnapshot: WorldCupSnapshot = {
  "tournament": {
    "name": "2026 FIFA World Cup",
    "season": "2026",
    "hosts": ["Mexico", "United States", "Canada"],
    "startDate": "2026-06-11",
    "endDate": "2026-07-19",
    "phase": "Upcoming",
    "status": "Group standings, the bracket, and scorers fill in here once the tournament kicks off on June 11.",
    "format": "48 teams across 12 groups of four. The top two from each group plus the eight best third-placed teams advance to a new 32-team knockout round.",
    "teamCount": 48,
    "groupCount": 12,
    "matchCount": 104,
    "venues": [
      { "city": "Mexico City", "country": "Mexico", "stadium": "Estadio Azteca" },
      { "city": "Guadalajara", "country": "Mexico", "stadium": "Estadio Akron" },
      { "city": "Monterrey", "country": "Mexico", "stadium": "Estadio BBVA" },
      { "city": "Atlanta", "country": "United States", "stadium": "Mercedes-Benz Stadium" },
      { "city": "Boston", "country": "United States", "stadium": "Gillette Stadium" },
      { "city": "Dallas", "country": "United States", "stadium": "AT&T Stadium" },
      { "city": "Houston", "country": "United States", "stadium": "NRG Stadium" },
      { "city": "Kansas City", "country": "United States", "stadium": "Arrowhead Stadium" },
      { "city": "Los Angeles", "country": "United States", "stadium": "SoFi Stadium" },
      { "city": "Miami", "country": "United States", "stadium": "Hard Rock Stadium" },
      { "city": "New York New Jersey", "country": "United States", "stadium": "MetLife Stadium" },
      { "city": "Philadelphia", "country": "United States", "stadium": "Lincoln Financial Field" },
      { "city": "San Francisco Bay Area", "country": "United States", "stadium": "Levi's Stadium" },
      { "city": "Seattle", "country": "United States", "stadium": "Lumen Field" },
      { "city": "Toronto", "country": "Canada", "stadium": "BMO Field" },
      { "city": "Vancouver", "country": "Canada", "stadium": "BC Place" }
    ],
    "generatedAt": "2026-06-08T00:00:00.000Z"
  },
  "groups": [],
  "knockout": [],
  "recentFixtures": [],
  "upcomingFixtures": [],
  "scorers": [],
  "teamOptions": [],
  "teamSnapshots": {}
};
