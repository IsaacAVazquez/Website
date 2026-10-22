import { RECEIPT_KEY } from "../siteDiscoveries";

beforeEach(() => { sessionStorage.clear(); jest.resetModules(); });
afterEach(() => { jest.restoreAllMocks(); });

it("deduplicates strict-mode effects and counts later return visits", async () => {
  const ledger = await import("../visitReceipt");
  ledger.recordVisit("/"); ledger.recordVisit("/");
  ledger.recordVisit("/wine-cellar"); ledger.recordVisit("/");
  ledger.recordVisit("/contact?email=private");
  expect(ledger.readVisits()).toEqual([{ path: "/", count: 2 }, { path: "/wine-cellar", count: 1 }]);
  expect(sessionStorage.getItem(RECEIPT_KEY)).not.toContain("private");
});

it("keeps the newest visits when storage becomes full and clears them in memory", async () => {
  const ledger = await import("../visitReceipt");
  ledger.recordVisit("/");
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
  ledger.recordVisit("/wine-cellar"); ledger.recordVisit("/about");
  expect(ledger.readVisits()).toHaveLength(3);
  ledger.clearVisits();
  expect(ledger.readVisits()).toEqual([]);
});
