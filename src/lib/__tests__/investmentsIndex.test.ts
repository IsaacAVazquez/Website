import { normalizeInvestmentIndexEntry } from "../investmentsIndex";

describe("normalizeInvestmentIndexEntry", () => {
  it("fills curated company names into symbol-only entries", () => {
    const result = normalizeInvestmentIndexEntry({
      symbol: "AVGO",
      shortName: "AVGO",
      longName: "AVGO",
      searchText: "avgo avgo avgo",
    });

    expect(result.shortName).toBe("Broadcom Inc.");
    expect(result.longName).toBe("Broadcom Inc.");
    expect(result.searchText).toContain("broadcom");
  });
});
