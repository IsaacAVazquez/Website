import {
  appendOddsEntry,
  normalizeTeamName,
  MAX_ODDS_HISTORY,
} from "../scorePoolsData";
import {
  manualOddsToEntry,
  parseScorePoolsCsv,
} from "../scorePools/providers/manual";
import type { SnapshotOddsEntry } from "@/types/scorePools";

function entry(home: number, fetchedAt: string): SnapshotOddsEntry {
  return {
    fetchedAt,
    bookmaker: "book",
    manual: false,
    moneyline: { home, draw: 3.2, away: 2.9 },
    totals: { line: 2.5, over: 1.9, under: 1.9 },
  };
}

describe("team name normalization (tiered exact, never fuzzy)", () => {
  it("strips punctuation, diacritics, and club suffixes", () => {
    expect(normalizeTeamName("Atlético Madrid")).toBe("atletico madrid");
    expect(normalizeTeamName("Brighton & Hove Albion FC")).toBe("brighton hove albion");
    expect(normalizeTeamName("A.F.C. Bournemouth")).toBe("a f c bournemouth");
    expect(normalizeTeamName("Sevilla FC")).toBe(normalizeTeamName("Sevilla"));
  });

  it("does not equate genuinely different names", () => {
    expect(normalizeTeamName("Manchester United")).not.toBe(
      normalizeTeamName("Manchester City"),
    );
  });
});

describe("odds history append", () => {
  it("appends when prices move and keeps the old entry", () => {
    const history = appendOddsEntry([entry(2.6, "t1")], entry(2.5, "t2"));
    expect(history).toHaveLength(2);
    expect(history[0].moneyline.home).toBe(2.6);
    expect(history[1].moneyline.home).toBe(2.5);
  });

  it("refreshes the timestamp instead of duplicating unchanged prices", () => {
    const history = appendOddsEntry([entry(2.6, "t1")], entry(2.6, "t2"));
    expect(history).toHaveLength(1);
    expect(history[0].fetchedAt).toBe("t2");
  });

  it("caps the history at the newest entries", () => {
    let history: SnapshotOddsEntry[] = [];
    for (let i = 0; i < MAX_ODDS_HISTORY + 10; i++) {
      history = appendOddsEntry(history, entry(2 + i * 0.01, `t${i}`));
    }
    expect(history).toHaveLength(MAX_ODDS_HISTORY);
    expect(history[history.length - 1].fetchedAt).toBe(`t${MAX_ODDS_HISTORY + 9}`);
  });
});

describe("manual odds conversion", () => {
  it("converts non-decimal formats at entry time", () => {
    // One format per entry, applied to every price in it.
    const american = manualOddsToEntry(
      { moneyline: { home: "+150", draw: "+240", away: "-120" }, format: "american" },
      "now",
    );
    expect(american.moneyline.home).toBeCloseTo(2.5, 10);
    expect(american.moneyline.draw).toBeCloseTo(3.4, 10);
    expect(american.manual).toBe(true);
    expect(american.fetchedAt).toBe("now");

    const fractional = manualOddsToEntry(
      { moneyline: { home: "6/4", draw: "12/5", away: "15/8" }, format: "fractional" },
      "now",
    );
    expect(fractional.moneyline.home).toBeCloseTo(2.5, 10);
    expect(fractional.moneyline.draw).toBeCloseTo(3.4, 10);
  });

  it("keeps two-way markets two-way", () => {
    const converted = manualOddsToEntry({ moneyline: { home: 1.8, away: 2.1 } }, "now");
    expect(converted.moneyline.draw).toBeNull();
    expect(converted.totals).toBeNull();
  });
});

describe("CSV fallback parsing", () => {
  const header =
    "fixtureId,homeTeam,awayTeam,kickoff,knockout,stage,mlHome,mlDraw,mlAway,totalLine,totalOver,totalUnder,format,bookmaker,fetchedAt";

  it("parses fixtures with odds from a well-formed sheet", () => {
    const rows = parseScorePoolsCsv(
      [
        header,
        "f1,Alpha,Beta,2026-08-01T19:00:00Z,true,Semifinal,2.4,3.2,3.1,2.5,1.95,1.87,decimal,book,2026-07-30T09:00:00Z",
        "f2,Gamma,Delta,2026-08-02T19:00:00Z,,,1.5,4.2,7.0,,,,,,",
      ].join("\n"),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].knockout).toBe(true);
    expect(rows[0].odds?.totals?.line).toBe(2.5);
    expect(rows[1].knockout).toBe(false);
    expect(rows[1].odds?.totals).toBeUndefined();
  });

  it("fails loudly on missing required columns or cells", () => {
    expect(() => parseScorePoolsCsv("homeTeam,awayTeam\nA,B")).toThrow(/fixtureId/);
    expect(() =>
      parseScorePoolsCsv([header, "f1,Alpha,,2026-08-01T19:00:00Z,,,2.4,3.2,3.1,,,,,,"].join("\n")),
    ).toThrow(/row 2/);
  });

  it("ignores comments and blank lines", () => {
    const rows = parseScorePoolsCsv(
      ["# hand-entered before the semi", header, "", "f1,Alpha,Beta,2026-08-01T19:00:00Z,,,2.4,3.2,3.1,,,,,,"].join(
        "\n",
      ),
    );
    expect(rows).toHaveLength(1);
  });
});
