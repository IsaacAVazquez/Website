#!/usr/bin/env node
/**
 * Confirms a production deploy actually published the Next.js static assets.
 *
 * The ledger check next door passes on a broken publish, because
 * /api/data-revisions is served by the Next.js function whether or not a single
 * static asset uploaded. That is how the 2026-08-20 deploy reported success
 * while serving an unstyled site, with the raw .next tree at the CDN root and
 * every /_next/static URL 404ing.
 *
 * Two earlier versions of this check fetched the site from the runner and both
 * were inert. Cloudflare fronts the custom domain and answers 403 to runner IPs
 * on HTML paths, with or without a browser user agent, while leaving alone the
 * API path the ledger check uses. isaacvazquez.netlify.app does not resolve from
 * runners at all. So this asks Netlify what it stored rather than asking the CDN
 * what it serves, which needs no egress to the site, is deterministic, and can
 * fail honestly.
 *
 * Verified against both real deploys. The broken 6a876fece3516dcfc6b3bdd5 has
 * 5,613 files, 0 of them under /_next/static/css/, and 3,060 raw build artifacts
 * at the root. A healthy deploy has 582 files, 7 stylesheets, and no root
 * artifacts.
 */

const API = "https://api.netlify.com/api/v1";

/** Root-level paths that only appear when the raw .next tree was published. */
const ROOT_BUILD_ARTIFACTS = new Set([
  "/BUILD_ID",
  "/build-manifest.json",
  "/required-server-files.json",
  "/routes-manifest.json",
  "/prerender-manifest.json",
  "/export-marker.json",
  "/images-manifest.json",
]);

/**
 * @param {string[]} paths deploy file paths, each rooted at "/"
 * @returns {{ ok: boolean, stylesheets: number, artifacts: string[] }}
 */
export function inspectDeployFiles(paths) {
  const stylesheets = paths.filter((p) =>
    /^\/_next\/static\/css\/.+\.css$/.test(p)
  ).length;
  const artifacts = paths.filter(
    (p) => ROOT_BUILD_ARTIFACTS.has(p) || p.startsWith("/server/")
  );
  return { ok: stylesheets > 0 && artifacts.length === 0, stylesheets, artifacts };
}

async function api(path, token) {
  const response = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`GET ${path} returned HTTP ${response.status}`);
  }
  return response.json();
}

async function main() {
  const token = process.env.NETLIFY_AUTH_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID;
  const expectedCommit = process.env.EXPECTED_COMMIT;
  if (!token || !siteId) {
    console.log("::error::NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID are required.");
    process.exit(1);
  }

  const site = await api(`/sites/${siteId}`, token);
  const deploy = site.published_deploy;
  if (!deploy?.id) {
    console.log("::error::The site has no published deploy to check.");
    process.exit(1);
  }

  // The deploy message carries the commit, so a published deploy from some other
  // run means this job's upload never went live and the check would otherwise
  // pass against someone else's work.
  if (expectedCommit && deploy.title && !deploy.title.includes(expectedCommit)) {
    console.log(
      `::error::Published deploy ${deploy.id} is "${deploy.title}", which does not carry commit ${expectedCommit}.`
    );
    process.exit(1);
  }

  const files = await api(`/deploys/${deploy.id}/files`, token);
  const paths = files.map((file) => file.path);
  const { ok, stylesheets, artifacts } = inspectDeployFiles(paths);

  if (ok) {
    console.log(
      `Deploy ${deploy.id} published ${paths.length} files including ${stylesheets} stylesheets, with no raw build artifacts at the root.`
    );
    return;
  }

  if (stylesheets === 0) {
    console.log(
      `::error::Deploy ${deploy.id} published ${paths.length} files and none of them is a /_next/static/css stylesheet. The deploy published the raw .next directory instead of the plugin's static output, which serves the site unstyled.`
    );
  }
  if (artifacts.length > 0) {
    console.log(
      `::error::Deploy ${deploy.id} exposes ${artifacts.length} build artifacts at the site root, starting with ${artifacts.slice(0, 5).join(", ")}.`
    );
  }
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.log(`::error::Could not verify the deploy's files. ${error.message}`);
    process.exit(1);
  });
}
