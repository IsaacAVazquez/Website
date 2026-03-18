import { transformSection } from "../investmentTransforms";

describe("transformSection info", () => {
  it("preserves provider company names when available", () => {
    const result = transformSection("info", [
      {
        symbol: "V",
        short_name: "Visa",
        long_name: "Visa Inc.",
        sector: "Financial Services",
        industry: "Credit Services",
      },
    ]) as {
      shortName?: string;
      longName?: string;
      sector?: string;
      industry?: string;
    };

    expect(result).toMatchObject({
      shortName: "Visa",
      longName: "Visa Inc.",
      sector: "Financial Services",
      industry: "Credit Services",
    });
  });

  it("falls back safely to the symbol when provider names are missing", () => {
    const result = transformSection("info", [
      {
        symbol: "BRK-B",
      },
    ]) as {
      shortName?: string;
      longName?: string;
    };

    expect(result.shortName).toBe("BRK-B");
    expect(result.longName).toBe("BRK-B");
  });
});
