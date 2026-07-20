import {
  buildCdnCacheHeaders,
  buildDurableCdnCacheControl,
  buildQueryCacheHeaders,
} from "@/lib/apiCacheHeaders";

describe("buildDurableCdnCacheControl", () => {
  it("derives a durable s-maxage header from max-age plus SWR", () => {
    expect(
      buildDurableCdnCacheControl(
        "public, max-age=300, stale-while-revalidate=900"
      )
    ).toBe("public, durable, s-maxage=300, stale-while-revalidate=900");
  });

  it("prefers an explicit s-maxage over max-age", () => {
    expect(
      buildDurableCdnCacheControl(
        "public, max-age=60, s-maxage=1800, stale-while-revalidate=3600"
      )
    ).toBe("public, durable, s-maxage=1800, stale-while-revalidate=3600");
  });

  it("returns null for non-cacheable values so error paths gain no CDN header", () => {
    expect(buildDurableCdnCacheControl("no-store")).toBeNull();
    expect(buildDurableCdnCacheControl("private, max-age=60")).toBeNull();
    expect(buildDurableCdnCacheControl("public")).toBeNull();
  });
});

describe("buildCdnCacheHeaders", () => {
  it("emits both headers for cacheable values", () => {
    expect(buildCdnCacheHeaders("public, max-age=60")).toEqual({
      "Cache-Control": "public, max-age=60",
      "Netlify-CDN-Cache-Control": "public, durable, s-maxage=60",
    });
  });

  it("emits only Cache-Control for no-store", () => {
    expect(buildCdnCacheHeaders("no-store")).toEqual({
      "Cache-Control": "no-store",
    });
  });
});

describe("buildQueryCacheHeaders", () => {
  it("keeps the query cache-key opt-in alongside the durable header", () => {
    expect(
      buildQueryCacheHeaders("public, max-age=30, stale-while-revalidate=60")
    ).toEqual({
      "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
      "Netlify-CDN-Cache-Control":
        "public, durable, s-maxage=30, stale-while-revalidate=60",
      "Netlify-Vary": "query",
    });
  });
});
