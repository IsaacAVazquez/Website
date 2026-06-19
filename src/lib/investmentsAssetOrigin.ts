export interface AssetOriginOptions {
  /** Explicit origin override (e.g. the current request origin). */
  assetOrigin?: string | null;
}

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
 * Returns `null` when no origin can be determined (e.g. local dev with the file
 * present on disk, where the HTTP fallback is unnecessary).
 */
export function getInvestmentsAssetOrigin(
  options: AssetOriginOptions = {}
): string | null {
  const configuredOrigin =
    options.assetOrigin ??
    process.env.URL ??
    process.env.DEPLOY_PRIME_URL ??
    process.env.DEPLOY_URL ??
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  return configuredOrigin ? configuredOrigin.replace(/\/$/, "") : null;
}
