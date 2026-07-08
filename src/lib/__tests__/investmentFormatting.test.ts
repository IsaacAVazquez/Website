import {
  formatBalance,
  formatSignedCurrency,
  formatPercent,
  isLowerBetterMetric,
  isPercentMetric,
  formatComparisonMetricValue,
} from "../investmentFormatting";

describe("formatBalance", () => {
  it("rounds to total cents first so fractional cents carry into the whole-dollar part", () => {
    expect(formatBalance(12.999)).toEqual({ whole: "$13", cents: ".00" });
  });

  it("splits whole dollars and cents with a thousands separator", () => {
    expect(formatBalance(12345.67)).toEqual({ whole: "$12,345", cents: ".67" });
  });

  it("prefixes a U+2212 minus sign for negative balances", () => {
    expect(formatBalance(-1234.5)).toEqual({ whole: "−$1,234", cents: ".50" });
  });

  it("falls back to a zero balance for non-finite input", () => {
    expect(formatBalance(NaN)).toEqual({ whole: "$0", cents: ".00" });
    expect(formatBalance(Infinity)).toEqual({ whole: "$0", cents: ".00" });
  });
});

describe("formatSignedCurrency", () => {
  it("prefixes '+' for positive values", () => {
    expect(formatSignedCurrency(1234.56)).toBe("+$1,234.56");
  });

  it("prefixes a U+2212 minus sign for negative values using the absolute amount", () => {
    expect(formatSignedCurrency(-1234.56)).toBe("−$1,234.56");
  });

  it("omits the sign for zero", () => {
    expect(formatSignedCurrency(0)).toBe("$0.00");
  });
});

describe("formatPercent", () => {
  it("prefixes '+' for positive percentages", () => {
    expect(formatPercent(12.34)).toBe("+12.34%");
  });

  it("prefixes a U+2212 minus sign for negative percentages using the absolute value", () => {
    expect(formatPercent(-5.5)).toBe("−5.50%");
  });

  it("omits the sign for zero", () => {
    expect(formatPercent(0)).toBe("0.00%");
  });

  it("returns an em dash for non-finite input", () => {
    expect(formatPercent(NaN)).toBe("—");
    expect(formatPercent(Infinity)).toBe("—");
  });
});

describe("industry-comparison metric helpers", () => {
  const cases: Array<{
    label: string;
    lowerBetter: boolean;
    percent: boolean;
  }> = [
    { label: "P/E", lowerBetter: true, percent: false },
    { label: "PEG", lowerBetter: true, percent: false },
    { label: "Beta", lowerBetter: true, percent: false },
    { label: "WACC", lowerBetter: true, percent: true },
    { label: "Net Margin", lowerBetter: false, percent: true },
    { label: "ROE", lowerBetter: false, percent: true },
    { label: "Revenue Growth", lowerBetter: false, percent: true },
    { label: "Dividend Yield", lowerBetter: false, percent: true },
  ];

  it.each(cases)(
    "$label -> lowerBetter=$lowerBetter, percent=$percent",
    ({ label, lowerBetter, percent }) => {
      expect(isLowerBetterMetric(label)).toBe(lowerBetter);
      expect(isPercentMetric(label)).toBe(percent);
    }
  );
});

describe("formatComparisonMetricValue", () => {
  it("renders ratio metrics with two decimals and no unit", () => {
    expect(formatComparisonMetricValue("P/E", 37.18)).toBe("37.18");
  });

  it("appends a percent sign for percentage metrics", () => {
    expect(formatComparisonMetricValue("Net Margin", 26.6)).toBe("26.60%");
  });

  it("returns an em dash for missing or non-finite values", () => {
    expect(formatComparisonMetricValue("P/E", undefined)).toBe("—");
    expect(formatComparisonMetricValue("P/E", NaN)).toBe("—");
  });
});
