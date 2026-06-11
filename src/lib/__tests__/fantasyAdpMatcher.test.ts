/**
 * @jest-environment node
 */
import {
  buildFantasyAdpIndex,
  matchPlayerAdp,
  normalizeAdpPlayerName,
  normalizeAdpTeam,
} from "@/lib/fantasyAdpMatcher";
import type { FantasyAdpEntry } from "@/lib/fantasyAdpSource";

function entry(overrides: Partial<FantasyAdpEntry>): FantasyAdpEntry {
  return {
    name: "Test Player",
    team: "SF",
    position: "RB",
    adp: 10,
    ...overrides,
  };
}

describe("normalizeAdpPlayerName", () => {
  it("lowercases, strips punctuation, and removes diacritics", () => {
    expect(normalizeAdpPlayerName("Ja'Marr Chase")).toBe("jamarr chase");
    expect(normalizeAdpPlayerName("José Ramírez")).toBe("jose ramirez");
    expect(normalizeAdpPlayerName("D.J. Moore")).toBe("dj moore");
  });

  it("strips generational suffixes without touching real surnames", () => {
    expect(normalizeAdpPlayerName("Marvin Harrison Jr.")).toBe("marvin harrison");
    expect(normalizeAdpPlayerName("Patrick Mahomes II")).toBe("patrick mahomes");
    expect(normalizeAdpPlayerName("Kenneth Walker III")).toBe("kenneth walker");
    // A lone suffix-looking token is a name, not a suffix.
    expect(normalizeAdpPlayerName("V")).toBe("v");
  });
});

describe("normalizeAdpTeam", () => {
  it("canonicalizes known alias abbreviations", () => {
    expect(normalizeAdpTeam("JAC")).toBe("JAX");
    expect(normalizeAdpTeam("WSH")).toBe("WAS");
    expect(normalizeAdpTeam("kc")).toBe("KC");
    expect(normalizeAdpTeam(null)).toBe("");
  });
});

describe("matchPlayerAdp", () => {
  it("matches on name, team, and position first", () => {
    const index = buildFantasyAdpIndex([
      entry({ name: "Bijan Robinson", team: "ATL", position: "RB", adp: 2.2 }),
    ]);

    const match = matchPlayerAdp({ name: "Bijan Robinson", team: "ATL", position: "RB" }, index);
    expect(match?.adp).toBe(2.2);
  });

  it("falls back to name plus position when the team lags a trade", () => {
    const index = buildFantasyAdpIndex([
      entry({ name: "Kenneth Walker III", team: "SEA", position: "RB", adp: 44.9 }),
    ]);

    const match = matchPlayerAdp({ name: "Kenneth Walker III", team: "HOU", position: "RB" }, index);
    expect(match?.adp).toBe(44.9);
  });

  it("matches suffixed names across suffix styles", () => {
    const index = buildFantasyAdpIndex([
      entry({ name: "Marvin Harrison", team: "ARI", position: "WR", adp: 28.6 }),
    ]);

    const match = matchPlayerAdp({ name: "Marvin Harrison Jr.", team: "ARI", position: "WR" }, index);
    expect(match?.adp).toBe(28.6);
  });

  it("refuses an ambiguous name-position fallback instead of guessing", () => {
    const index = buildFantasyAdpIndex([
      entry({ name: "Josh Allen", team: "BUF", position: "QB", adp: 25 }),
      entry({ name: "Josh Allen", team: "NO", position: "QB", adp: 180 }),
    ]);

    // Exact team still resolves.
    expect(matchPlayerAdp({ name: "Josh Allen", team: "BUF", position: "QB" }, index)?.adp).toBe(25);
    // A third team can't be disambiguated, so no match.
    expect(matchPlayerAdp({ name: "Josh Allen", team: "KC", position: "QB" }, index)).toBeNull();
  });

  it("never matches across positions or on merely similar names", () => {
    const index = buildFantasyAdpIndex([
      entry({ name: "Lamar Jackson", team: "BAL", position: "QB", adp: 30 }),
    ]);

    expect(matchPlayerAdp({ name: "Lamar Jackson", team: "BAL", position: "WR" }, index)).toBeNull();
    expect(matchPlayerAdp({ name: "Lamar Jacksen", team: "BAL", position: "QB" }, index)).toBeNull();
  });

  it("matches DST entries by team abbreviation", () => {
    const index = buildFantasyAdpIndex([
      entry({ name: "Pittsburgh Defense", team: "PIT", position: "DST", adp: 162.8 }),
    ]);

    const match = matchPlayerAdp({ name: "Pittsburgh Steelers", team: "PIT", position: "DST" }, index);
    expect(match?.adp).toBe(162.8);
  });

  it("derives the DST team from a nickname when the abbreviation is missing", () => {
    const index = buildFantasyAdpIndex([
      entry({ name: "San Francisco Defense", team: "", position: "DST", adp: 140.5 }),
    ]);

    const match = matchPlayerAdp({ name: "San Francisco 49ers", team: "", position: "DST" }, index);
    expect(match?.adp).toBe(140.5);
  });
});
