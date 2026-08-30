import {
  getFantasyProsVorpUrl,
  parseFantasyProsVorpPage,
} from "@/lib/fantasyProsVorpSource";

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
