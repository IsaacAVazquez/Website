import { formatCurrencyCompact } from "../formatters";

describe("SpaceX formatters", () => {
  it("formats compact launch costs without trailing zero hydration drift", () => {
    expect(formatCurrencyCompact(52_000_000)).toBe("$52M");
    expect(formatCurrencyCompact(52_500_000)).toBe("$52.5M");
  });

  it("keeps small currency values as standard dollar amounts", () => {
    expect(formatCurrencyCompact(950)).toBe("$950");
    expect(formatCurrencyCompact(null)).toBe("Unavailable");
  });
});
