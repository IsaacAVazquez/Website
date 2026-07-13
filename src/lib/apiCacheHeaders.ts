export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

/**
 * Netlify does not include the public query string in its default cache key
 * for Next.js route handlers. Query-dependent responses must opt in so one
 * request cannot populate the edge cache for every parameter combination.
 */
export function buildQueryCacheHeaders(cacheControl: string) {
  return {
    "Cache-Control": cacheControl,
    "Netlify-Vary": "query",
  } as const;
}
