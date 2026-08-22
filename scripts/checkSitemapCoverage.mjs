#!/usr/bin/env node
/**
 * Fails when a routable page is missing from the sitemap. The static route list
 * in src/lib/sitemap.js is hand-kept, so a new page.tsx reaches the sitemap only
 * when someone remembers to add it, and this is the reminder.
 *
 * Pages that opt out are skipped automatically: anything with `noIndex: true`
 * or `index: false` in its metadata, and anything whose only job is to call
 * `redirect()`. Everything else has to be listed, or be named in EXCLUDED with
 * a reason.
 *
 *   npm run check:sitemap
 */

import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { PUBLIC_SITEMAP_PATHS, PUBLIC_SITEMAP_ENTRIES } = require("../src/lib/sitemap.js");

const appDirectory = path.join(process.cwd(), "src", "app");

const EXCLUDED = {
  "/admin": "NextAuth-gated admin surface, deliberately unlisted",
  "/portfolio/[slug]":
    "every case study in caseStudies.ts sets `link:` and redirects, so the builder emits no slug entries by design",
};

async function findPageRoutes(directory, route = "") {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const routes = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      // API handlers are not pages and private folders never route.
      if (route === "" && entry.name === "api") continue;
      if (entry.name.startsWith("_")) continue;
      // Route groups like (marketing) do not appear in the URL.
      const segment = /^\(.*\)$/.test(entry.name) ? "" : `/${entry.name}`;
      routes.push(...(await findPageRoutes(target, `${route}${segment}`)));
    } else if (entry.name === "page.tsx") {
      routes.push({ route: route || "/", file: target });
    }
  }
  return routes;
}

const isOptedOut = (source) =>
  /noIndex:\s*true|index:\s*false/.test(source) ||
  // A redirect-only page renders nothing worth indexing.
  (/from ["']next\/navigation["']/.test(source) &&
    /\bredirect\(/.test(source) &&
    !/export default function \w+\([\s\S]*?return \(/.test(source));

const routes = await findPageRoutes(appDirectory);
const gaps = [];

for (const { route, file } of routes) {
  if (EXCLUDED[route]) continue;
  if (isOptedOut(await fs.readFile(file, "utf8"))) continue;

  if (route.includes("[")) {
    // A dynamic route is covered when its static prefix has at least one entry.
    const prefix = `${route.slice(0, route.indexOf("["))}`;
    const covered = PUBLIC_SITEMAP_ENTRIES.some(
      (entry) => entry.loc.startsWith(prefix) && entry.loc !== prefix.replace(/\/$/, "")
    );
    if (!covered) gaps.push({ route, file, reason: `no sitemap entries under ${prefix}` });
    continue;
  }

  if (!PUBLIC_SITEMAP_PATHS.has(route)) {
    gaps.push({ route, file, reason: "not in PUBLIC_SITEMAP_ENTRIES" });
  }
}

if (gaps.length) {
  console.error(`${gaps.length} route(s) missing from the sitemap:\n`);
  for (const gap of gaps) {
    console.error(`  ${gap.route}  (${gap.reason})`);
    console.error(`    ${path.relative(process.cwd(), gap.file)}`);
  }
  console.error(
    "\nAdd the route to src/lib/sitemap.js, mark the page noIndex, or add it to EXCLUDED in scripts/checkSitemapCoverage.mjs with a reason."
  );
  process.exit(1);
}

console.log(`Sitemap covers all ${routes.length} page routes.`);
