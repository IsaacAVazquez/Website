import {
  buildTradeCalculatorHref,
  DEFAULT_TRADE_CALCULATOR_STATE,
  normalizeTradeCalculatorState,
  TRADE_CALCULATOR_LINEUP_PRESETS,
  TRADE_CALCULATOR_ROSTER_SIZES,
  TRADE_CALCULATOR_TEAM_COUNTS,
} from "../trade-calculator-state";

describe("trade calculator route state", () => {
  it("normalizes an empty request to the canonical league defaults", () => {
    expect(normalizeTradeCalculatorState({})).toEqual(
      DEFAULT_TRADE_CALCULATOR_STATE,
    );
  });

  it("normalizes supported aliases, casing, and numeric strings", () => {
    expect(
      normalizeTradeCalculatorState({
        scoring: "HALF-PPR",
        teams: "14",
        rosterSize: "18",
        lineup: " THREE-WR-NO-KDST ",
      }),
    ).toEqual({
      scoring: "half_ppr",
      teams: 14,
      rosterSize: 18,
      lineup: "three-wr-no-kdst",
    });
  });

  it("falls back field by field for unsupported values", () => {
    expect(
      normalizeTradeCalculatorState({
        scoring: "superflex",
        teams: "11",
        rosterSize: "19",
        lineup: "custom",
      }),
    ).toEqual(DEFAULT_TRADE_CALCULATOR_STATE);
  });

  it.each(TRADE_CALCULATOR_TEAM_COUNTS)("accepts %i teams", (teams) => {
    expect(normalizeTradeCalculatorState({ teams: String(teams) }).teams).toBe(teams);
  });

  it.each(TRADE_CALCULATOR_ROSTER_SIZES)(
    "accepts a roster size of %i",
    (rosterSize) => {
      expect(
        normalizeTradeCalculatorState({ rosterSize: String(rosterSize) }).rosterSize,
      ).toBe(rosterSize);
    },
  );

  it.each(TRADE_CALCULATOR_LINEUP_PRESETS)(
    "accepts the %s lineup preset",
    (lineup) => {
      expect(normalizeTradeCalculatorState({ lineup }).lineup).toBe(lineup);
    },
  );

  it("reads the first value from repeated server search params", () => {
    expect(
      normalizeTradeCalculatorState({
        scoring: ["standard", "ppr"],
        teams: ["16", "8"],
        rosterSize: ["13", "18"],
        lineup: ["three-wr", "traditional"],
      }),
    ).toEqual({
      scoring: "standard",
      teams: 16,
      rosterSize: 13,
      lineup: "three-wr",
    });
  });

  it("builds a canonical default href", () => {
    expect(buildTradeCalculatorHref(DEFAULT_TRADE_CALCULATOR_STATE)).toBe(
      "/fantasy-football/trade-calculator?scoring=ppr&teams=12&rosterSize=15&lineup=traditional",
    );
  });

  it("preserves unrelated params and replaces every managed setting", () => {
    const base = new URLSearchParams(
      "ref=rankings&scoring=invalid&teams=9&rosterSize=20&lineup=custom&campaign=draft",
    );

    expect(
      buildTradeCalculatorHref(
        {
          scoring: "standard",
          teams: 16,
          rosterSize: 18,
          lineup: "three-wr-no-kdst",
        },
        base,
      ),
    ).toBe(
      "/fantasy-football/trade-calculator?ref=rankings&scoring=standard&teams=16&rosterSize=18&lineup=three-wr-no-kdst&campaign=draft",
    );
  });
});
