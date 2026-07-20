/**
 * @jest-environment node
 */
import { GET } from "../route";
import { GET as getTransitSummary } from "@/app/api/bay-area-transit/summary/route";
import { bayAreaTransitSnapshot } from "@/data/bayAreaTransitSnapshot";
import { earthquakeSnapshot } from "@/data/earthquakeSnapshot";
import { createDataRevision, type DataRevisionEntry } from "@/lib/dataRevision";
import { DATA_SURFACE_IDS } from "@/lib/dataFreshnessPolicy";

async function getLedgerEntry(surface: string): Promise<DataRevisionEntry> {
  const response = await GET();
  const body = (await response.json()) as { entries: DataRevisionEntry[] };
  const entry = body.entries.find((item) => item.surface === surface);

  expect(entry).toBeDefined();
  return entry as DataRevisionEntry;
}

describe("GET /api/data-revisions", () => {
  it("publishes one health entry for every registered snapshot surface", async () => {
    const response = await GET();
    const body = (await response.json()) as { entries: DataRevisionEntry[] };

    expect(body.entries.map((entry) => entry.surface).sort()).toEqual(
      [...DATA_SURFACE_IDS].sort()
    );
  });
  it("tracks the committed transit summary while the live route identifies its delivered payload", async () => {
    const entry = await getLedgerEntry("bay-area-transit");

    // The ledger identifies the committed fallback used for publication checks.
    // The runtime route may overlay newer BART data, so its revision must hash
    // the payload it actually delivered instead of pretending it is the snapshot.
    expect(entry.revision).toBe(
      createDataRevision(bayAreaTransitSnapshot.summary)
    );

    const summaryResponse = await getTransitSummary();
    const deliveredSummary = await summaryResponse.json();
    expect(summaryResponse.headers.get("X-Data-Revision")).toBe(
      createDataRevision(deliveredSummary)
    );
  });

  it("keeps earthquake at summary grain", async () => {
    const entry = await getLedgerEntry("earthquake");

    expect(entry.revision).toBe(createDataRevision(earthquakeSnapshot.summary));
  });

  it("gives weekday investment refreshes a weekend-safe freshness window", async () => {
    const entry = await getLedgerEntry("investments");

    expect(entry.maxAgeSeconds).toBe(102 * 60 * 60);
  });

  it("reports runtime-fetch surfaces as unavailable until a durable heartbeat exists", async () => {
    // The test runtime is not Netlify, so the durable heartbeat store returns
    // nothing and both request-time surfaces fall through to unavailable with a
    // null source time rather than being omitted from the ledger.
    for (const surface of ["news-pulse", "mba-jobs"] as const) {
      const entry = await getLedgerEntry(surface);
      expect(entry.source).toBe("runtime-fetch");
      expect(entry.status).toBe("unavailable");
      expect(entry.sourceAsOf).toBeNull();
    }
  });
});
