import { premierLeagueSnapshot } from "../../src/data/premierLeagueSnapshot";
import { normalizeTeamName } from "../../src/lib/scorePoolsData";
import { SCORE_POOL_LEAGUES } from "../data/scorePoolsConfig";

describe("score pools league config", () => {
  it("only aliases clubs in the committed Premier League table", () => {
    const clubs = premierLeagueSnapshot.summary.standings.map((row) =>
      normalizeTeamName(row.team.name),
    );
    const source = SCORE_POOL_LEAGUES.find((league) => league.key === "premier-league");
    const stale = Object.entries(source?.teamAliases ?? {})
      // The fixtures provider's short name leads the full name, as in Brighton.
      .filter(([, target]) => !clubs.some((club) => club.startsWith(normalizeTeamName(target))))
      .map(([oddsName]) => oddsName);

    expect(clubs).toHaveLength(20);
    expect(stale).toEqual([]);
  });
});
