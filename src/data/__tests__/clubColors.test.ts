import {
  getLaLigaClubAccentColor,
  getPremierLeagueClubAccentColor,
  LA_LIGA_CLUB_ACCENT_COLORS,
  PREMIER_LEAGUE_CLUB_ACCENT_COLORS,
} from "../clubColors";

describe("getPremierLeagueClubAccentColor", () => {
  it("resolves a known TLA to its accent hex", () => {
    expect(getPremierLeagueClubAccentColor("ARS")).toBe("#EF0107");
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(getPremierLeagueClubAccentColor(" ars ")).toBe("#EF0107");
    expect(getPremierLeagueClubAccentColor("liv")).toBe(
      PREMIER_LEAGUE_CLUB_ACCENT_COLORS.LIV
    );
  });

  it("returns null for an unknown or missing TLA instead of a default hex", () => {
    expect(getPremierLeagueClubAccentColor("ZZZ")).toBeNull();
    expect(getPremierLeagueClubAccentColor(null)).toBeNull();
    expect(getPremierLeagueClubAccentColor(undefined)).toBeNull();
    expect(getPremierLeagueClubAccentColor("")).toBeNull();
  });
});

describe("getLaLigaClubAccentColor", () => {
  it("resolves a known TLA to its accent hex", () => {
    expect(getLaLigaClubAccentColor("RMA")).toBe("#00529F");
    expect(getLaLigaClubAccentColor("FCB")).toBe("#A50044");
  });

  it("resolves both Atlético Madrid TLA variants to the same color", () => {
    expect(getLaLigaClubAccentColor("ATM")).toBe(getLaLigaClubAccentColor("ATL"));
    expect(getLaLigaClubAccentColor("ATM")).toBe(LA_LIGA_CLUB_ACCENT_COLORS.ATM);
  });

  it("returns null for an unknown or missing TLA instead of a default hex", () => {
    expect(getLaLigaClubAccentColor("ZZZ")).toBeNull();
    expect(getLaLigaClubAccentColor(null)).toBeNull();
    expect(getLaLigaClubAccentColor(undefined)).toBeNull();
  });
});
