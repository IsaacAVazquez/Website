/**
 * @jest-environment node
 */
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { sanitizeExistingSnapshot } from "../buildInvestmentsSnapshots";
import type { InvestmentSnapshot } from "../../src/types/investment";

const BUILT_AT = "2026-10-20T14:00:00.000Z";
const ASSESSED_AT = "2026-10-23T14:00:00.000Z";

const prior: InvestmentSnapshot = {
  symbol: "AAPL",
  source: "prefetched",
  lastUpdated: BUILT_AT,
  freshness: {
    snapshotBuiltAt: BUILT_AT,
    sections: { price: "2026-10-20" },
  },
  capabilities: { price: true, fundamentals: true },
  sections: {
    price: [{ date: "2026-10-20", open: 9, high: 10, low: 8, close: 9, volume: 90 }],
    fundamentals: { ttmPe: 25 },
  },
};

function bulkRow(date: string) {
  return { report_date: date, open: 10, high: 11, low: 9, close: 10, volume: 100 };
}

describe("sanitizeExistingSnapshot", () => {
  let root: string;
  let rawDir: string;
  let publicDir: string;
  let snapshotPath: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "investments-snapshots-"));
    rawDir = path.join(root, "raw");
    publicDir = path.join(root, "public");
    snapshotPath = path.join(publicDir, "AAPL", "snapshot.json");
    await fs.mkdir(path.join(rawDir, "AAPL"), { recursive: true });
    await fs.mkdir(path.join(publicDir, "AAPL"), { recursive: true });
    await fs.writeFile(snapshotPath, JSON.stringify(prior));
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fs.rm(root, { recursive: true, force: true });
  });

  async function writeBulkPrice(rows: unknown) {
    await fs.writeFile(path.join(rawDir, "AAPL", "bulk_price.json"), JSON.stringify(rows));
  }

  async function readSnapshot(): Promise<InvestmentSnapshot> {
    return JSON.parse(await fs.readFile(snapshotPath, "utf8")) as InvestmentSnapshot;
  }

  it("advances a stale symbol's price from the bulk file and leaves its build time alone", async () => {
    await writeBulkPrice([bulkRow("2026-10-21"), bulkRow("2026-10-22")]);

    await sanitizeExistingSnapshot("AAPL", ASSESSED_AT, rawDir, publicDir);

    const result = await readSnapshot();
    expect(result.freshness?.sections?.price).toBe("2026-10-22");
    expect(result.sections.price).toHaveLength(2);
    expect(result.sections.fundamentals).toEqual({ ttmPe: 25 });
    expect(result.freshness?.snapshotBuiltAt).toBe(BUILT_AT);
    expect(result.lastUpdated).toBe(BUILT_AT);
  });

  it("keeps the saved price when the bulk price is older than the age rule allows", async () => {
    await writeBulkPrice([bulkRow("2026-09-01")]);

    await sanitizeExistingSnapshot("AAPL", ASSESSED_AT, rawDir, publicDir);

    const result = await readSnapshot();
    expect(result.freshness?.sections?.price).toBe("2026-10-20");
    expect(result.sections.price).toEqual(prior.sections.price);
  });

  it("keeps the saved price when the bulk file is not a list of rows", async () => {
    await writeBulkPrice({ rows: [bulkRow("2026-10-22")] });

    await sanitizeExistingSnapshot("AAPL", ASSESSED_AT, rawDir, publicDir);

    expect((await readSnapshot()).freshness?.sections?.price).toBe("2026-10-20");
  });

  it("fails for a stale symbol with no snapshot to keep", async () => {
    await expect(
      sanitizeExistingSnapshot("MSFT", ASSESSED_AT, rawDir, publicDir)
    ).rejects.toThrow("Missing retained snapshot for stale symbol MSFT");
  });
});
