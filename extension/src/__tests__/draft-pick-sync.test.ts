import {
  detectDraftSyncProvider,
  extractSleeperDraftId,
  extractUnderdogDraftPicks,
  extractEspnDraftContext,
  parseEspnDraftPicks,
  parseEspnPlayerIndex,
  parseSleeperDraftPicks,
  parseUnderdogDraftPickLabel,
} from "../draft-pick-sync";

describe("provider draft pick extraction", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("detects ESPN, Sleeper, and Underdog draft hosts", () => {
    expect(detectDraftSyncProvider("fantasy.espn.com")).toBe("espn");
    expect(detectDraftSyncProvider("sleeper.com")).toBe("sleeper");
    expect(detectDraftSyncProvider("app.underdogsports.com")).toBe("underdog");
    expect(detectDraftSyncProvider("api.sleeper.app")).toBeNull();
  });

  it("parses and de-duplicates Underdog board cells", () => {
    const label = "Highly Experienced userAvatar VAZQUEZI 1.5|5 J. Smith-Njigba WR - SEA";
    expect(parseUnderdogDraftPickLabel(label)).toEqual({
      pickNumber: 5,
      name: "J. Smith-Njigba",
      position: "WR",
      team: "SEA",
    });
    document.body.innerHTML = `
      <button aria-label="${label}"></button>
      <div role="button">${label}</div>
      <button>
        <div><p>HVSU</p><p>1.6<span>|</span>6</p></div>
        <div><p>J. Taylor</p><div><span>RB - IND</span></div></div>
      </button>
      <button>
        <div><p>RUFFGORILLA</p><p>1.7<span>|</span>7</p></div>
        <div><p>J. Blue</p><div><span></span></div></div>
      </button>
    `;
    expect(extractUnderdogDraftPicks()).toEqual([
      { pickNumber: 5, name: "J. Smith-Njigba", position: "WR", team: "SEA" },
      { pickNumber: 6, name: "J. Taylor", position: "RB", team: "IND" },
      { pickNumber: 7, name: "J. Blue" },
    ]);
  });

  it("reads the ESPN league and season from a draft-room URL only", () => {
    expect(
      extractEspnDraftContext(
        "https://fantasy.espn.com/football/draft?leagueId=1788927341&seasonId=2026"
      )
    ).toEqual({ leagueId: "1788927341", season: 2026 });
    expect(
      extractEspnDraftContext("https://fantasy.espn.com/football/draft?leagueId=42")
    ).toEqual({ leagueId: "42", season: new Date().getFullYear() });
    expect(
      extractEspnDraftContext("https://fantasy.espn.com/football/team?leagueId=42")
    ).toBeNull();
    expect(extractEspnDraftContext("not a url")).toBeNull();
  });

  it("maps ESPN draft detail picks onto named players and skips empty slots", () => {
    const players = new Map([
      [4429795, { name: "Jahmyr Gibbs", position: "RB", team: "DET" }],
      [-16034, { name: "Texans D/ST", position: "DST", team: "HOU" }],
    ]);
    expect(
      parseEspnDraftPicks(
        {
          draftDetail: {
            picks: [
              { overallPickNumber: 2, roundId: 1, roundPickNumber: 2, playerId: -16034 },
              { overallPickNumber: 1, roundId: 1, roundPickNumber: 1, playerId: 4429795 },
              { overallPickNumber: 3, roundId: 1, roundPickNumber: 3, playerId: -1 },
              { overallPickNumber: 4, roundId: 1, roundPickNumber: 4, playerId: 999 },
            ],
          },
        },
        players
      )
    ).toEqual([
      { pickNumber: 1, name: "Jahmyr Gibbs", position: "RB", team: "DET" },
      { pickNumber: 2, name: "Texans D/ST", position: "DST", team: "HOU" },
      { pickNumber: 4, name: "ESPN player 999" },
    ]);
    expect(parseEspnDraftPicks({ draftDetail: {} }, players)).toEqual([]);
    expect(parseEspnDraftPicks(null, players)).toEqual([]);
  });

  it("indexes the ESPN player list by id with plain positions and team codes", () => {
    expect(
      parseEspnPlayerIndex({
        players: [
          { id: 4429795, fullName: "Jahmyr Gibbs", defaultPositionId: 2, proTeamId: 8 },
          { id: 12, firstName: "Jake", lastName: "Bates", defaultPositionId: 5, proTeamId: 8 },
          { id: -16034, fullName: "Texans D/ST", defaultPositionId: 16, proTeamId: 34 },
          { fullName: "no id" },
        ],
      })
    ).toEqual(
      new Map([
        [4429795, { name: "Jahmyr Gibbs", position: "RB", team: "DET" }],
        [12, { name: "Jake Bates", position: "K", team: "DET" }],
        [-16034, { name: "Texans D/ST", position: "DST", team: "HOU" }],
      ])
    );
    expect(parseEspnPlayerIndex([{ id: 1, fullName: "Array Form", defaultPositionId: 1, proTeamId: 2 }])).toEqual(
      new Map([[1, { name: "Array Form", position: "QB", team: "BUF" }]])
    );
  });

  it("reads Sleeper draft IDs and official pick payloads", () => {
    expect(
      extractSleeperDraftId("https://sleeper.com/draft/nfl/257270643320426496")
    ).toBe("257270643320426496");
    expect(
      extractSleeperDraftId("https://sleeper.com/leagues/257270643320426496/team")
    ).toBeNull();
    expect(
      parseSleeperDraftPicks([
        {
          pick_no: 1,
          metadata: {
            first_name: "Amon-Ra",
            last_name: "St. Brown",
            position: "WR",
            team: "DET",
          },
        },
      ])
    ).toEqual([
      {
        pickNumber: 1,
        name: "Amon-Ra St. Brown",
        position: "WR",
        team: "DET",
      },
    ]);
  });
});
