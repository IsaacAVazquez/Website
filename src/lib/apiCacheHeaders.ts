export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

/**
 * Derives the Netlify CDN companion for a success Cache-Control value.
 * `durable` opts the response into Netlify's shared, region-independent cache
 * so concurrent CDN misses across nodes collapse into one function
 * invocation, and the durable cache is invalidated automatically on deploys,
 * so snapshot-backed routes never outlive their data. Returns null for
 * non-cacheable values (no-store/private/no TTL) so error paths never gain a
 * CDN header.
 */
export function buildDurableCdnCacheControl(
  cacheControl: string
): string | null {
  if (/no-store|private/i.test(cacheControl)) return null;
  const sMaxAge = cacheControl.match(/(?:^|[,\s])s-maxage=(\d+)/i)?.[1];
  const maxAge = cacheControl.match(/(?:^|[,\s])max-age=(\d+)/i)?.[1];
  const ttl = sMaxAge ?? maxAge;
  if (!ttl) return null;
  const swr = cacheControl.match(
    /(?:^|[,\s])stale-while-revalidate=(\d+)/i
  )?.[1];
  const parts = ["public", "durable", `s-maxage=${ttl}`];
  if (swr) parts.push(`stale-while-revalidate=${swr}`);
  return parts.join(", ");
}

/** Cache-Control plus its durable Netlify CDN companion when cacheable. */
export function buildCdnCacheHeaders(
  cacheControl: string
): Record<string, string> {
  const cdnCacheControl = buildDurableCdnCacheControl(cacheControl);
  return {
    "Cache-Control": cacheControl,
    ...(cdnCacheControl
      ? { "Netlify-CDN-Cache-Control": cdnCacheControl }
      : {}),
  };
}

/**
 * Netlify does not include the public query string in its default cache key
 * for Next.js route handlers. Query-dependent responses must opt in so one
 * request cannot populate the edge cache for every parameter combination.
 */
export function buildQueryCacheHeaders(cacheControl: string) {
  return {
    ...buildCdnCacheHeaders(cacheControl),
    "Netlify-Vary": "query",
  } as const;
}
