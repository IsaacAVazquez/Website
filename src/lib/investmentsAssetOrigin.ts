export interface AssetOriginOptions {
  /** Explicit origin override (e.g. the current request origin). */
  assetOrigin?: string | null;
}

/** The site's canonical production origin (matches seo.ts). */
const CANONICAL_PRODUCTION_ORIGIN = "https://isaacavazquez.com";

/**
 * Resolve the origin to fetch committed `/public/data/investments` assets from
 * when they are not present on the local filesystem.
 *
 * Inside the deployed Netlify function the investments snapshots are stripped
 * from the bundle (`outputFileTracingExcludes` in `next.config.mjs` plus the
 * `rm -rf` of the standalone `public/data` directory in `netlify.toml`), so the
 * only way server code can read them is over HTTP from the deploy origin. This
 * is the single source of truth for that origin so the precedence can't drift
 * between the curated-data loader and the Finnhub allowlist.
 *
 * Always resolves to an origin: an explicit override or env var when present,
 * otherwise the canonical production origin. (The disk-first callers only reach
 * the HTTP fallback when the bundled file is missing, i.e. in the deployed
 * function, so a non-null origin in local dev is harmless.)
 */
export function getInvestmentsAssetOrigin(
  options: AssetOriginOptions = {}
): string | null {
  const trustedConfiguredOrigin =
    process.env.URL ??
    process.env.DEPLOY_PRIME_URL ??
    process.env.DEPLOY_URL ??
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    // Canonical production origin as a last resort. Inside the deployed Netlify
    // function none of the env vars above are present at runtime, so the origin
    // resolved to null and the curated-investments loaders failed closed: the
    // allowlist came back empty (every symbol "not eligible for live pricing")
    // and the index route 503'd. The committed public assets are identical on
    // every deploy, so the canonical origin is always a safe source. Mirrors
    // the same hardcoded fallback in seo.ts.
    CANONICAL_PRODUCTION_ORIGIN;

  const normalizeOrigin = (value: string | null | undefined): string | null => {
    if (!value) return null;
    try {
      return new URL(value).origin;
    } catch {
      return null;
    }
  };

  const trustedOrigins = new Set(
    [
      CANONICAL_PRODUCTION_ORIGIN,
      trustedConfiguredOrigin,
      process.env.URL,
      process.env.DEPLOY_PRIME_URL,
      process.env.DEPLOY_URL,
      process.env.SITE_URL,
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      ...(process.env.NODE_ENV !== "production"
        ? ["http://localhost:3000", "http://127.0.0.1:3000"]
        : []),
    ]
      .map(normalizeOrigin)
      .filter((value): value is string => value !== null)
  );

  const requestedOrigin = normalizeOrigin(options.assetOrigin);
  const configuredOrigin =
    requestedOrigin && trustedOrigins.has(requestedOrigin)
      ? requestedOrigin
      : normalizeOrigin(trustedConfiguredOrigin);

  return configuredOrigin;
}
