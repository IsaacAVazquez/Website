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

  it("keeps fetch recovery separate from delayed and partial data flags", () => {
    const result = normalizeInvestmentIndexEntry({
      symbol: "AAPL",
      shortName: "Apple",
      longName: "Apple Inc.",
      searchText: "aapl apple apple inc",
      priceDelayed: true,
      partial: true,
      retainedSections: ["news"],
    });

    expect(result.stale).toBeUndefined();
    expect(result).toMatchObject({
      priceDelayed: true,
      partial: true,
      retainedSections: ["news"],
    });
  });
});
