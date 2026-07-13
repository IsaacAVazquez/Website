/**
 * @jest-environment node
 */
import { GET } from "../route";
import { GET as getTransitSummary } from "@/app/api/bay-area-transit/summary/route";
import { bayAreaTransitSnapshot } from "@/data/bayAreaTransitSnapshot";
import { earthquakeSnapshot } from "@/data/earthquakeSnapshot";
import { createDataRevision, type DataRevisionEntry } from "@/lib/dataRevision";

async function getLedgerEntry(surface: string): Promise<DataRevisionEntry> {
  const response = await GET();
  const body = (await response.json()) as { entries: DataRevisionEntry[] };
  const entry = body.entries.find((item) => item.surface === surface);

  expect(entry).toBeDefined();
  return entry as DataRevisionEntry;
}

describe("GET /api/data-revisions", () => {
  it("hashes bay-area-transit at the same summary grain as the summary route", async () => {
    const entry = await getLedgerEntry("bay-area-transit");

    // The ledger and /api/bay-area-transit/summary must publish the same
    // identifier for the surface, so both hash the summary object.
    expect(entry.revision).toBe(
      createDataRevision(bayAreaTransitSnapshot.summary)
    );

    const summaryResponse = await getTransitSummary();
    expect(summaryResponse.headers.get("X-Data-Revision")).toBe(entry.revision);
  });

  it("keeps earthquake at summary grain", async () => {
    const entry = await getLedgerEntry("earthquake");

    expect(entry.revision).toBe(createDataRevision(earthquakeSnapshot.summary));
  });

  it("gives investments a freshness window that covers the Thu -> Mon refresh gap", async () => {
    const entry = await getLedgerEntry("investments");

    // The refresh runs Mon+Thu 22:15 UTC; the longest on-schedule gap is 96h,
    // so the window must exceed it or every Monday reads stale-fallback.
    expect(entry.maxAgeSeconds).toBe(5 * 24 * 60 * 60);
  });
});
