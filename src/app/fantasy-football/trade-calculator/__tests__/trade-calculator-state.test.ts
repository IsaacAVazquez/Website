import {
  buildTradeCalculatorHref,
  buildTradeCalculatorShareHref,
  DEFAULT_TRADE_CALCULATOR_STATE,
  normalizeTradeCalculatorState,
  parseTradeCalculatorShare,
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

  it("keeps the shared deal params when a league setting changes", () => {
    const base = new URLSearchParams("scoring=ppr&give=fp-1%2Cfp-2&get=fp-3");

    expect(
      buildTradeCalculatorHref(
        { ...DEFAULT_TRADE_CALCULATOR_STATE, scoring: "standard" },
        base,
      ),
    ).toContain("give=fp-1%2Cfp-2&get=fp-3");
  });
});

describe("trade calculator shared deals", () => {
  it("returns null when neither share param is present, so old links keep the stored deal", () => {
    expect(parseTradeCalculatorShare({})).toBeNull();
    expect(parseTradeCalculatorShare(new URLSearchParams("scoring=ppr&teams=12"))).toBeNull();
  });

  it("treats one present side as a full share with the other side empty", () => {
    expect(parseTradeCalculatorShare(new URLSearchParams("give=fp-1"))).toEqual({
      givePlayerIds: ["fp-1"],
      getPlayerIds: [],
    });
    expect(parseTradeCalculatorShare(new URLSearchParams("give=&get=fp-2"))).toEqual({
      givePlayerIds: [],
      getPlayerIds: ["fp-2"],
    });
  });

  it("repairs the shared lists: trims, dedupes, caps each side, and lets give win a cross-side duplicate", () => {
    expect(
      parseTradeCalculatorShare(
        new URLSearchParams(
          "give=fp-1,fp-1, fp-2 ,,&get=fp-1,fp-3,fp-4,fp-5,fp-6,fp-7,fp-8,fp-9",
        ),
      ),
    ).toEqual({
      givePlayerIds: ["fp-1", "fp-2"],
      getPlayerIds: ["fp-3", "fp-4", "fp-5", "fp-6", "fp-7", "fp-8"],
    });
  });

  it("round-trips a deal through the share href", () => {
    const share = {
      givePlayerIds: ["fp-19788", "fp-22968"],
      getPlayerIds: ["fp-23180"],
    };
    const href = buildTradeCalculatorShareHref(
      share,
      new URLSearchParams("scoring=half_ppr&teams=10"),
    );

    expect(href).toBe(
      "/fantasy-football/trade-calculator?scoring=half_ppr&teams=10&give=fp-19788%2Cfp-22968&get=fp-23180",
    );
    expect(parseTradeCalculatorShare(new URLSearchParams(href.split("?")[1]))).toEqual(share);
  });

  it("drops the share params for empty sides and leaves the rest of the query alone", () => {
    expect(
      buildTradeCalculatorShareHref(
        { givePlayerIds: [], getPlayerIds: [] },
        new URLSearchParams("scoring=ppr&give=fp-1&get=fp-2"),
      ),
    ).toBe("/fantasy-football/trade-calculator?scoring=ppr");

    expect(
      buildTradeCalculatorShareHref({ givePlayerIds: [], getPlayerIds: [] }),
    ).toBe("/fantasy-football/trade-calculator");
  });
});
