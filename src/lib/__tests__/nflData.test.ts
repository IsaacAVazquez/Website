/**
 * @jest-environment node
 */
import { buildNflSnapshot } from "../nflData";

const STANDINGS_URL =
  "https://github.com/nflverse/nfldata/raw/master/data/standings.csv";
const GAMES_URL =
  "https://github.com/nflverse/nfldata/raw/master/data/games.csv";
const TEAMS_LOGOS_URL =
  "https://github.com/nflverse/nflfastR-data/raw/master/teams_colors_logos.csv";

const SEASON = "2025";

function csvResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { "content-type": "text/csv" },
  });
}

/**
 * A compact, valid teams_colors_logos.csv covering both conferences. We only
 * need enough teams so standings + fixtures have metadata to join against.
 */
function teamsCsv(): string {
  const header =
    "team_abbr,team_name,team_nick,team_conf,team_division,team_color,team_color2,team_logo_espn,team_logo_wikipedia,team_wordmark";
  const rows = [
    "KC,Kansas City Chiefs,Chiefs,AFC,AFC West,#E31837,#FFB81C,https://logo/kc.png,,https://wm/kc.png",
    "BUF,Buffalo Bills,Bills,AFC,AFC East,#00338D,#C60C30,https://logo/buf.png,,https://wm/buf.png",
    "PHI,Philadelphia Eagles,Eagles,NFC,NFC East,#004C54,#A5ACAF,https://logo/phi.png,,https://wm/phi.png",
    "DAL,Dallas Cowboys,Cowboys,NFC,NFC East,#003594,#869397,https://logo/dal.png,,https://wm/dal.png",
  ];
  return [header, ...rows].join("\n");
}

function standingsCsv(): string {
  const header =
    "season,team,conf,division,div_rank,wins,losses,ties,pct,scored,allowed,net,seed,playoff";
  const rows = [
    // current season
    `${SEASON},KC,AFC,AFC West,1,14,3,0,0.824,480,350,130,1,SB`,
    `${SEASON},BUF,AFC,AFC East,1,13,4,0,0.765,460,360,100,2,DIV`,
    `${SEASON},PHI,NFC,NFC East,1,15,2,0,0.882,500,330,170,1,SB`,
    `${SEASON},DAL,NFC,NFC East,2,9,8,0,0.529,400,390,10,,`,
    // a prior season with fewer total games so selectLatestSeason picks SEASON
    `2024,KC,AFC,AFC West,1,1,0,0,1.000,30,10,20,1,`,
  ];
  return [header, ...rows].join("\n");
}

function gamesCsv(): string {
  const header =
    "season,week,game_type,home_team,away_team,home_score,away_score,gameday,gametime,game_id";
  const rows = [
    // finished regular-season games
    `${SEASON},1,REG,KC,BUF,27,24,2025-09-07,20:20,${SEASON}_01_BUF_KC`,
    `${SEASON},2,REG,PHI,DAL,31,17,2025-09-14,13:00,${SEASON}_02_DAL_PHI`,
    `${SEASON},3,REG,BUF,PHI,21,21,2025-09-21,13:00,${SEASON}_03_PHI_BUF`,
    // upcoming (no scores)
    `${SEASON},18,REG,DAL,KC,,,2026-01-04,13:00,${SEASON}_18_KC_DAL`,
    // a different season - should be ignored
    `2024,1,REG,KC,BUF,10,7,2024-09-08,13:00,2024_01_BUF_KC`,
  ];
  return [header, ...rows].join("\n");
}

function playerStatsCsv(): string {
  const header =
    "player_display_name,player_name,recent_team,position,games,passing_yards,rushing_yards,receiving_yards,def_sacks";
  const rows = [
    "Patrick Mahomes,P.Mahomes,KC,QB,17,4800,250,0,0",
    "Josh Allen,J.Allen,BUF,QB,17,4200,520,0,0",
    "Saquon Barkley,S.Barkley,PHI,RB,16,80,1900,300,0",
    "CeeDee Lamb,C.Lamb,DAL,WR,17,0,40,1400,0",
    "Micah Parsons,M.Parsons,DAL,LB,16,0,0,0,14",
  ];
  return [header, ...rows].join("\n");
}

function mockFetch(
  overrides: Partial<{
    standings: string;
    games: string;
    teams: string;
    stats: string;
  }> = {}
) {
  return jest
    .spyOn(global, "fetch")
    .mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === TEAMS_LOGOS_URL) {
        return Promise.resolve(csvResponse(overrides.teams ?? teamsCsv()));
      }
      if (url === STANDINGS_URL) {
        return Promise.resolve(
          csvResponse(overrides.standings ?? standingsCsv())
        );
      }
      if (url === GAMES_URL) {
        return Promise.resolve(csvResponse(overrides.games ?? gamesCsv()));
      }
      if (url.includes("stats_player_reg_")) {
        return Promise.resolve(
          csvResponse(overrides.stats ?? playerStatsCsv())
        );
      }
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });
}

describe("buildNflSnapshot", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("builds standings, divisions, fixtures, and stat leaders (happy path)", async () => {
    mockFetch();

    const snapshot = await buildNflSnapshot({ skipTeamSnapshots: true });

    // Season is selected as the one with the most games played.
    expect(snapshot.season).toBe(SEASON);
    expect(snapshot.sourceLabel).toBe("NFLverse");

    // Standings populated for all four teams.
    expect(snapshot.teams).toHaveLength(4);
    const kc = snapshot.teams.find((t) => t.abbr === "KC");
    expect(kc).toBeDefined();
    expect(kc?.name).toBe("Kansas City Chiefs");
    expect(kc?.conference).toBe("AFC");
    expect(kc?.division).toBe("AFC West");
    expect(kc?.wins).toBe(14);
    expect(kc?.losses).toBe(3);
    expect(kc?.seed).toBe(1);
    expect(kc?.playoffResult).toBe("SB");

    // A team with a blank seed yields null, not 0.
    const dal = snapshot.teams.find((t) => t.abbr === "DAL");
    expect(dal?.seed).toBeNull();

    // Both conferences are represented (division coverage).
    const conferences = new Set(snapshot.teams.map((t) => t.conference));
    expect(conferences).toEqual(new Set(["AFC", "NFC"]));

    // Conference rank is assigned by seed within each conference.
    expect(kc?.conferenceRank).toBe(1);

    // Team options sorted by name.
    expect(snapshot.teamOptions.map((o) => o.name)).toEqual([
      "Buffalo Bills",
      "Dallas Cowboys",
      "Kansas City Chiefs",
      "Philadelphia Eagles",
    ]);

    // Fixtures: three finished regular-season games + one upcoming.
    expect(snapshot.recentFixtures.length).toBe(3);
    expect(snapshot.upcomingFixtures.length).toBe(1);

    // The current week is the max finished REG week (week 3).
    expect(snapshot.week).toBe(3);

    // A tie game records a TIE winner.
    const tie = snapshot.recentFixtures.find(
      (f) => f.homeTeam.abbr === "BUF" && f.awayTeam.abbr === "PHI"
    );
    expect(tie?.score.winner).toBe("TIE");

    // A finished game derives the correct winner.
    const kcGame = snapshot.recentFixtures.find(
      (f) => f.homeTeam.abbr === "KC" && f.awayTeam.abbr === "BUF"
    );
    expect(kcGame?.status).toBe("FINISHED");
    expect(kcGame?.score.winner).toBe("HOME_TEAM");

    // Upcoming game has null scores and SCHEDULED status.
    const upcoming = snapshot.upcomingFixtures[0];
    expect(upcoming.status).toBe("SCHEDULED");
    expect(upcoming.score.home).toBeNull();
    expect(upcoming.score.away).toBeNull();

    // Leaders are normalized and ranked.
    expect(snapshot.leaders.passing[0].name).toBe("Patrick Mahomes");
    expect(snapshot.leaders.passing[0].rank).toBe(1);
    expect(snapshot.leaders.passing[0].teamCode).toBe("KC");
    expect(snapshot.leaders.passing[0].total).toBe(4800);
    // Passing leaders are QB-only; the WR/RB/LB do not appear.
    expect(snapshot.leaders.passing.map((l) => l.position)).toEqual([
      "QB",
      "QB",
    ]);

    expect(snapshot.leaders.rushing[0].name).toBe("Saquon Barkley");
    expect(snapshot.leaders.receiving[0].name).toBe("CeeDee Lamb");
    expect(snapshot.leaders.sacks[0].name).toBe("Micah Parsons");
    expect(snapshot.leaders.sacks[0].total).toBe(14);

    // perGame is derived from games played.
    expect(snapshot.leaders.passing[0].perGame).toBeCloseTo(4800 / 17);

    // skipTeamSnapshots was honored.
    expect(snapshot.teamSnapshots).toEqual({});
  });

  it("can skip player leaders without touching the stats endpoint", async () => {
    const spy = mockFetch();

    const snapshot = await buildNflSnapshot({
      skipTeamSnapshots: true,
      skipPlayerLeaders: true,
    });

    expect(snapshot.leaders).toEqual({
      passing: [],
      rushing: [],
      receiving: [],
      sacks: [],
    });

    // The stats endpoint must not be requested.
    const fetchedStats = spy.mock.calls.some((call) => {
      const url =
        typeof call[0] === "string" ? call[0] : (call[0] as URL).toString();
      return url.includes("stats_player_reg_");
    });
    expect(fetchedStats).toBe(false);
  });

  it("degrades gracefully when player stats are empty", async () => {
    mockFetch({
      stats: "player_display_name,recent_team,position,games,passing_yards",
    });

    const snapshot = await buildNflSnapshot({ skipTeamSnapshots: true });

    expect(snapshot.leaders.passing).toEqual([]);
    expect(snapshot.leaders.rushing).toEqual([]);
    expect(snapshot.leaders.receiving).toEqual([]);
    expect(snapshot.leaders.sacks).toEqual([]);
    // Standings still build fine.
    expect(snapshot.teams.length).toBeGreaterThan(0);
  });

  it("throws when standings have no games played", async () => {
    mockFetch({
      standings:
        "season,team,conf,division,div_rank,wins,losses,ties,pct,scored,allowed,net,seed,playoff",
    });

    await expect(
      buildNflSnapshot({ skipTeamSnapshots: true, skipPlayerLeaders: true })
    ).rejects.toThrow(/no standings rows with games played/i);
  });

  it("builds per-team snapshots with form when not skipped", async () => {
    mockFetch();

    const snapshot = await buildNflSnapshot();

    expect(Object.keys(snapshot.teamSnapshots).length).toBe(4);
    const kcSnap = snapshot.teamSnapshots["kc"];
    expect(kcSnap).toBeDefined();
    expect(kcSnap.team?.abbr).toBe("KC");
    // KC won its only finished game -> one W in the form sequence.
    expect(kcSnap.form.sequence).toEqual(["W"]);
    expect(kcSnap.form.wins).toBe(1);
    expect(kcSnap.recentFixtures.length).toBe(1);
    expect(kcSnap.upcomingFixtures.length).toBe(1);
  });
});
