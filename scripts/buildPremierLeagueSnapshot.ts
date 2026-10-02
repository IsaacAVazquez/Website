import path from "path";
import { buildPremierLeagueSnapshot, sumPlayedGames } from "../src/lib/premierLeagueData";
import type { PremierLeagueSnapshot } from "../src/types/premier-league";
import { buildOrKeepExisting, writeFileAtomic } from "./snapshotFallback";

const PROJECT_ROOT = process.cwd();
const OUTPUT_FILE = path.join(PROJECT_ROOT, "src", "data", "premierLeagueSnapshot.json");

// A valid table has rows AND at least one game played. A rolled-over season
// returns a zeroed 20-row placeholder (rows present, 0 played); treating that
// as "no standings" routes it through the keep-previous fallback rather than
// overwriting the good committed table.
function hasStandings(snapshot: PremierLeagueSnapshot | null): boolean {
  const standings = snapshot?.summary.standings ?? [];
  return standings.length > 0 && sumPlayedGames(standings) > 0;
}

async function main() {
  console.log("Fetching Premier League snapshot from football-data.org…");

  const snapshot = await buildOrKeepExisting(
    OUTPUT_FILE,
    "Premier League",
    () => buildPremierLeagueSnapshot(),
    hasStandings
  );
  if (!snapshot) return;

  const fileContents = JSON.stringify(snapshot, null, 2) + "\n";

  writeFileAtomic(OUTPUT_FILE, fileContents);
  console.log(
    `Done. Wrote ${snapshot.summary.standings.length} standings rows, ${snapshot.summary.scorers.length} scorers, ${Object.keys(snapshot.teamSnapshots).length} team snapshots.`
  );
}

main().catch((error) => {
  console.error("Failed to build Premier League snapshot:", error);
  process.exitCode = 1;
});
