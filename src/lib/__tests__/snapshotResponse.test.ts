import { createSnapshotResponseHeaders } from "@/lib/snapshotResponse";

describe("createSnapshotResponseHeaders", () => {
  it("adds one consistent revision and freshness contract", () => {
    const headers = createSnapshotResponseHeaders({
      surface: "earthquake",
      payload: { count: 12 },
      sourceAsOf: new Date().toISOString(),
      cacheControl: "public, max-age=60",
    });

    expect(headers["Cache-Control"]).toBe("public, max-age=60");
    expect(headers["X-Data-Revision"]).toHaveLength(64);
    expect(headers["X-Data-Status"]).toBe("fresh");
    expect(headers["X-Data-Source-As-Of"]).toBeDefined();
    expect(headers.ETag).toBe(`"${headers["X-Data-Revision"]}"`);
  });
});
