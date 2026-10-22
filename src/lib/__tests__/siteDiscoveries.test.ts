import { addReceiptVisit, isRegistered, isScoutQuery, parseGuestbook, parseReceipt } from "../siteDiscoveries";

describe("site discoveries", () => {
  it("restores only bounded visits to known public routes", () => {
    expect(parseReceipt(JSON.stringify([
      { path: "/wine-cellar", count: 2, extra: "discard" },
      { path: "/wine-cellar", count: 1 },
      { path: "constructor", count: 1 },
      { path: "/contact?email=private", count: 1 },
      { path: "/about", count: -1 },
      { path: "/", count: 1000 },
      { path: "/writing", count: "2" },
      null,
    ]))).toEqual([{ path: "/wine-cellar", count: 2 }]);
    expect(parseReceipt("broken")).toEqual([]);
    expect(parseReceipt('{"path":"/"}')).toEqual([]);
  });

  it("counts repeat visits and ignores unregistered and private routes", () => {
    const entries = addReceiptVisit([], "/wine-cellar");
    expect(addReceiptVisit(entries, "/wine-cellar")).toEqual([{ path: "/wine-cellar", count: 2 }]);
    expect(addReceiptVisit(entries, "/job-search")).toBe(entries);
    expect(addReceiptVisit([{ path: "/", count: 999 }], "/")[0].count).toBe(999);
  });

  it("bounds and normalizes guestbook strings from browser storage", () => {
    expect(parseGuestbook('[null,1,"  Hello\\nthere  ",""]')).toEqual(["Hello there"]);
    expect(parseGuestbook(JSON.stringify(Array(20).fill("x".repeat(200))))).toHaveLength(12);
    expect(parseGuestbook(JSON.stringify(["x".repeat(200)]))[0]).toHaveLength(160);
    expect(parseGuestbook("invalid")).toEqual([]);
  });

  it("reveals the scout only for Isaac's exact name", () => {
    expect(isScoutQuery(" ISAAC  Vazquez ")).toBe(true);
    expect(isScoutQuery("Isaac")).toBe(true);
    expect(isScoutQuery("Isaac Smith")).toBe(false);
  });

  it("requires every ink axis to be within one unit of register", () => {
    expect(isRegistered([0, 1, -1, 0])).toBe(true);
    expect(isRegistered([0, 0, 2, 0])).toBe(false);
    expect(isRegistered([0, 0, NaN, 0])).toBe(false);
    expect(isRegistered([])).toBe(false);
  });
});
