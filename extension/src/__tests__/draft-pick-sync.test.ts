import {
  detectDraftSyncProvider,
  extractSleeperDraftId,
  extractUnderdogDraftPicks,
  parseEspnDraftPickLabel,
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

  it("parses common ESPN draft-log label orders", () => {
    expect(parseEspnDraftPickLabel("1. (1) Jahmyr Gibbs RB - DET")).toEqual({
      pickNumber: 1,
      name: "Jahmyr Gibbs",
      position: "RB",
      team: "DET",
    });
    expect(parseEspnDraftPickLabel("2. (14) Amon-Ra St. Brown DET, WR")).toEqual({
      pickNumber: 14,
      name: "Amon-Ra St. Brown",
      position: "WR",
      team: "DET",
    });
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
