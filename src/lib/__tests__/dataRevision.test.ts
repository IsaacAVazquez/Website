import {
  createDataResponseHeaders,
  createDataRevision,
  createDataRevisionEntry,
  getDataDeliveryStatus,
} from "@/lib/dataRevision";

describe("data revision metadata", () => {
  it("creates a deterministic content revision", () => {
    const payload = { generatedAt: "2026-07-10T12:00:00.000Z", count: 4 };

    expect(createDataRevision(payload)).toBe(createDataRevision(payload));
    expect(createDataRevision({ ...payload, count: 5 })).not.toBe(
      createDataRevision(payload)
    );
  });

  it("distinguishes fresh, stale, and unavailable data", () => {
    const now = Date.parse("2026-07-10T14:00:00.000Z");

    expect(
      getDataDeliveryStatus("2026-07-10T13:30:00.000Z", 60 * 60 * 1000, now)
    ).toEqual({ status: "fresh", ageSeconds: 1800 });
    expect(
      getDataDeliveryStatus("2026-07-10T12:00:00.000Z", 60 * 60 * 1000, now)
    ).toEqual({ status: "stale-fallback", ageSeconds: 7200 });
    expect(getDataDeliveryStatus(null, 60 * 60 * 1000, now)).toEqual({
      status: "unavailable",
      ageSeconds: null,
    });
  });

  it("emits revision and freshness response headers", () => {
    const entry = createDataRevisionEntry({
      surface: "earthquake",
      payload: { count: 4 },
      sourceAsOf: "2026-07-10T13:30:00.000Z",
      maxAgeMs: 60 * 60 * 1000,
      now: Date.parse("2026-07-10T14:00:00.000Z"),
    });

    expect(createDataResponseHeaders(entry)).toEqual(
      expect.objectContaining({
        ETag: `"${entry.revision}"`,
        "X-Data-Revision": entry.revision,
        "X-Data-Source": "git-snapshot",
        "X-Data-Status": "fresh",
        "X-Data-Source-As-Of": "2026-07-10T13:30:00.000Z",
      })
    );
  });

  it("does not hide a stale snapshot behind a degraded section status", () => {
    const entry = createDataRevisionEntry({
      surface: "transit",
      payload: { elevator: [] },
      sourceAsOf: "2026-07-10T10:00:00.000Z",
      maxAgeMs: 60 * 60 * 1000,
      now: Date.parse("2026-07-10T14:00:00.000Z"),
      status: "degraded",
    });

    expect(entry.status).toBe("stale-fallback");
  });
});
