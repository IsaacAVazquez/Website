import {
  FANTASY_VORP_TEAM_SIZES,
  fetchFantasyProsVorpBoard,
  getFantasyProsVorpUrl,
  parseFantasyProsVorpPage,
} from "@/lib/fantasyProsVorpSource";
import { FANTASY_PROS_PUBLIC_USER_AGENT } from "@/lib/fantasyProsPublicSource";

function page({
  scoring = "PPR",
  teamSize = 12,
  rows = [
    { id: 101, name: "Alpha Back", team: "SF", pos: "RB1", value: 120, raw: 120 },
    { id: 102, name: "Bravo Wideout", team: "DAL", pos: "WR1", value: 80, raw: 80 },
    { id: 103, name: "Charlie Quarterback", team: "BUF", pos: "QB1", value: 0, raw: -12 },
  ],
}: {
  scoring?: string;
  teamSize?: number;
  rows?: Array<{
    id: number;
    name: string;
    team: string;
    pos: string;
    value: number;
    raw: number;
  }>;
} = {}): string {
  return `
    <div id="main-container">
      <h1>NFL Value Over Replacement Player (VORP) Rankings</h1>
      <h2>2026 Overall Projections</h2>
      <select aria-label="Filter rankings by Scoring">
        <option selected>${scoring}</option>
      </select>
      <select name="team-size">
        <option selected>${teamSize} Teams</option>
      </select>
      <table id="data">
        <thead><tr><th>Rank</th><th>Player</th><th>POS</th><th>VORP</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (row, index) => `
                <tr class="player-row" data-id="${row.id}">
                  <td>${index + 1}</td>
                  <td><a class="player-name">${row.name}</a> (${row.team})</td>
                  <td>${row.pos}</td>
                  <td data-value="${row.raw}">${row.value}</td>
                </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

describe("FantasyPros VORP source", () => {
  it("parses projected points above replacement and preserves the published order", () => {
    const board = parseFantasyProsVorpPage(page(), {
      scoringFormat: "PPR",
      teamSize: 12,
      accessedAt: "2026-08-25T12:00:00.000Z",
      minimumRows: 3,
    });

    expect(board).toMatchObject({
      scoringFormat: "PPR",
      teamSize: 12,
      season: 2026,
      accessedAt: "2026-08-25T12:00:00.000Z",
    });
    expect(board.players).toEqual([
      {
        playerId: "fp-101",
        name: "Alpha Back",
        team: "SF",
        position: "RB",
        positionRank: 1,
        rank: 1,
        value: 120,
      },
      {
        playerId: "fp-102",
        name: "Bravo Wideout",
        team: "DAL",
        position: "WR",
        positionRank: 1,
        rank: 2,
        value: 80,
      },
      {
        playerId: "fp-103",
        name: "Charlie Quarterback",
        team: "BUF",
        position: "QB",
        positionRank: 1,
        rank: 3,
        value: 0,
      },
    ]);
  });

  it("pins scoring and league size instead of accepting the wrong board", () => {
    expect(() =>
      parseFantasyProsVorpPage(page({ scoring: "HALF" }), {
        scoringFormat: "PPR",
        teamSize: 12,
        minimumRows: 3,
      })
    ).toThrow(/HALF scoring for PPR/);

    expect(() =>
      parseFantasyProsVorpPage(page({ teamSize: 10 }), {
        scoringFormat: "PPR",
        teamSize: 12,
        minimumRows: 3,
      })
    ).toThrow(/10 teams.*12-team request/);
  });

  it("rejects a displayed VORP that does not match the source value or zero floor", () => {
    expect(() =>
      parseFantasyProsVorpPage(
        page({
          rows: [
            { id: 101, name: "Alpha Back", team: "SF", pos: "RB1", value: 99, raw: 120 },
          ],
        }),
        { scoringFormat: "PPR", teamSize: 12, minimumRows: 1 }
      )
    ).toThrow(/inconsistent displayed value/);
  });

  it("builds distinct URLs for the supported scoring and team-size boards", () => {
    expect(getFantasyProsVorpUrl("PPR", 12)).toBe(
      "https://www.fantasypros.com/nfl/rankings/ppr-vorp.php"
    );
    expect(getFantasyProsVorpUrl("HALF_PPR", 10)).toContain(
      "half-ppr-vorp.php?team_size=10"
    );
    expect(getFantasyProsVorpUrl("STANDARD", 14)).toContain(
      "vorp.php?team_size=14"
    );
  });
});

const PPR_12 = { scoringFormat: "PPR" as const, teamSize: 12 as const, minimumRows: 3 };

function descendingRows(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: 1000 + index,
    name: `Player ${index + 1}`,
    team: "SF",
    pos: `WR${index + 1}`,
    value: count - index,
    raw: count - index,
  }));
}

describe("FantasyPros VORP page validation", () => {
  it("re-exports the supported league sizes", () => {
    expect(FANTASY_VORP_TEAM_SIZES).toEqual([10, 12, 14]);
  });

  it("decodes named and numeric HTML entities in player names", () => {
    const board = parseFantasyProsVorpPage(
      page({
        rows: [
          { id: 1, name: "Ja&#39;Marr Chase", team: "CIN", pos: "WR1", value: 9, raw: 9 },
          { id: 2, name: "Amon&#x2D;Ra St. Brown", team: "DET", pos: "WR2", value: 8, raw: 8 },
          { id: 3, name: "Smith &amp; Sons &bogus;", team: "NYJ", pos: "TE1", value: 7, raw: 7 },
        ],
      }),
      PPR_12
    );

    expect(board.players.map((player) => player.name)).toEqual([
      "Ja'Marr Chase",
      "Amon-Ra St. Brown",
      "Smith & Sons &bogus;",
    ]);
  });

  it("accepts the standard board under its STD label and a non-default league size", () => {
    const board = parseFantasyProsVorpPage(page({ scoring: "std", teamSize: 10 }), {
      ...PPR_12,
      scoringFormat: "STANDARD",
      teamSize: 10,
    });
    expect(board.scoringFormat).toBe("STANDARD");
    expect(board.sourceUrl).toBe(getFantasyProsVorpUrl("STANDARD", 10));
    expect(Number.isNaN(Date.parse(board.accessedAt))).toBe(false);
  });

  it.each([
    ["the heading is missing", (html: string) => html.replace(/<h1>[^<]*<\/h1>/, ""), /missing the report heading/],
    ["the heading names another report", (html: string) => html.replace("NFL Value Over Replacement Player (VORP) Rankings", "NFL Rankings"), /wrong report/],
    ["the season heading is missing", (html: string) => html.replace(/<h2>[^<]*<\/h2>/, ""), /missing the projection season/],
    ["the season heading has another shape", (html: string) => html.replace("2026 Overall Projections", "Week 1 Projections"), /missing the projection season/],
    ["the scoring control is missing", (html: string) => html.replace('aria-label="Filter rankings by Scoring"', ""), /missing the scoring control/],
    ["no scoring option is selected", (html: string) => html.replace("<option selected>PPR</option>", "<option>PPR</option>"), /missing the selected scoring format/],
    ["the scoring option is blank", (html: string) => html.replace("<option selected>PPR</option>", "<option selected></option>"), /unknown scoring for PPR/],
    ["the team-size control is missing", (html: string) => html.replace('name="team-size"', ""), /missing the team-size control/],
    ["the team size is not a number", (html: string) => html.replace("<option selected>12 Teams</option>", "<option selected>Twelve</option>"), /invalid team size/],
    ["the rankings table is missing", (html: string) => html.replace('id="data"', 'id="other"'), /missing the rankings table/],
    ["the column header row is missing", (html: string) => html.replace(/<thead>[\s\S]*?<\/thead>/, ""), /missing the ranking columns/],
    ["the columns changed", (html: string) => html.replace("<th>VORP</th>", "<th>Points</th>"), /changed its ranking columns/],
    ["the body is missing", (html: string) => html.replace(/<tbody>[\s\S]*?<\/tbody>/, ""), /missing the ranking rows/],
  ])("throws when %s", (_label, mutate, message) => {
    expect(() => parseFantasyProsVorpPage(mutate(page()), PPR_12)).toThrow(message);
  });

  it.each([
    ["a row has too few cells", (html: string) => html.replace(/<td data-value="120">120<\/td>/, ""), /too few cells at row 1/],
    ["a row has no player link", (html: string) => html.replace('<a class="player-name">Alpha Back</a>', "Alpha Back"), /row 1 player name/],
    ["a row has no team", (html: string) => html.replace("(SF)", ""), /invalid player at row 1/],
    ["a row has an unknown position", (html: string) => html.replace("<td>RB1</td>", "<td>LB1</td>"), /invalid player at row 1/],
    ["a rank is not a number", (html: string) => html.replace("<td>1</td>", "<td>one</td>"), /invalid row 1 rank/],
    ["a rank skips ahead", (html: string) => html.replace("<td>1</td>", "<td>2</td>"), /nonsequential rank at row 1/],
    ["a raw value is missing", (html: string) => html.replace('data-value="120"', ""), /invalid row 1 raw VORP/],
    ["a displayed value is not a number", (html: string) => html.replace(">120</td>", ">n/a</td>"), /invalid row 1 VORP/],
  ])("throws when %s", (_label, mutate, message) => {
    expect(() => parseFantasyProsVorpPage(mutate(page()), PPR_12)).toThrow(message);
  });

  it("enforces the row floor, unique ids, and descending value order", () => {
    expect(() => parseFantasyProsVorpPage(page(), { ...PPR_12, minimumRows: 4 })).toThrow(
      /returned 3 players, below the 4-player floor/
    );

    const duplicate = descendingRows(2).map((row) => ({ ...row, id: 7 }));
    expect(() =>
      parseFantasyProsVorpPage(page({ rows: duplicate }), { ...PPR_12, minimumRows: 2 })
    ).toThrow(/duplicate player ids/);

    const unordered = descendingRows(2).reverse();
    expect(() =>
      parseFantasyProsVorpPage(page({ rows: unordered }), { ...PPR_12, minimumRows: 2 })
    ).toThrow(/not ordered from highest to lowest/);
  });
});

describe("fetchFantasyProsVorpBoard", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function mockFetchResponse(body: string, status = 200) {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: async () => body,
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
  }

  it("requests the board with the public user agent and parses a full page", async () => {
    const fetchMock = mockFetchResponse(page({ teamSize: 14, rows: descendingRows(300) }));

    const board = await fetchFantasyProsVorpBoard("PPR", 14, 2026);

    expect(fetchMock).toHaveBeenCalledWith(getFantasyProsVorpUrl("PPR", 14), {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": FANTASY_PROS_PUBLIC_USER_AGENT,
      },
    });
    expect(board.players).toHaveLength(300);
    expect(board.teamSize).toBe(14);
    expect(board.season).toBe(2026);
  });

  it("rejects a board for a different season", async () => {
    mockFetchResponse(page({ rows: descendingRows(300) }));
    await expect(fetchFantasyProsVorpBoard("PPR", 12, 2027)).rejects.toThrow(
      /returned season 2026; expected 2027/
    );
  });

  it("rejects a page below the default 300-row floor", async () => {
    mockFetchResponse(page());
    await expect(fetchFantasyProsVorpBoard("PPR", 12, 2026)).rejects.toThrow(/300-player floor/);
  });

  it("surfaces an HTTP failure with its status", async () => {
    mockFetchResponse("blocked", 403);
    await expect(fetchFantasyProsVorpBoard("PPR", 12, 2026)).rejects.toThrow(
      "FantasyPros VORP request failed (403)."
    );
  });
});
