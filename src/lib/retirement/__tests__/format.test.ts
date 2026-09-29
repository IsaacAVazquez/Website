/**
 * @jest-environment node
 */
import { formatCompactCurrency } from "../format";

// Node 20 prints "$100.0K" where browsers print "$100K", so these pin the text
// both sides of hydration have to agree on.
describe("formatCompactCurrency", () => {
  it("prints whole thousands and millions without a trailing .0", () => {
    expect(formatCompactCurrency(0)).toBe("$0");
    expect(formatCompactCurrency(100_000)).toBe("$100K");
    expect(formatCompactCurrency(200_000)).toBe("$200K");
    expect(formatCompactCurrency(2_000_000)).toBe("$2M");
  });

  it("keeps one decimal where it carries information", () => {
    expect(formatCompactCurrency(1_500_000)).toBe("$1.5M");
    expect(formatCompactCurrency(22_513)).toBe("$22.5K");
    expect(formatCompactCurrency(999.6)).toBe("$999.6");
  });

  it("steps up a unit when rounding reaches a thousand", () => {
    expect(formatCompactCurrency(999_950)).toBe("$1M");
    expect(formatCompactCurrency(999.97)).toBe("$1K");
  });

  it("signs negatives and leaves small values unscaled", () => {
    expect(formatCompactCurrency(-22_513)).toBe("-$22.5K");
    expect(formatCompactCurrency(950)).toBe("$950");
  });
});
