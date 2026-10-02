/**
 * Inventory guard for the project UI redesign. Every portfolio project that
 * links to a live route must print in its own inks, open on its lead-ink hero,
 * leave the one `main` to the shell, and never bring back the generic stats
 * panel. It also classifies every page route on the site, so a new route has
 * to be placed on purpose. `e2e/project-routes.spec.ts` checks the rendered
 * side (one h1, one main, the hero on its lead ink, no hydration errors).
 */
import fs from "node:fs";
import path from "node:path";
import { getAllCaseStudies } from "../caseStudies";
import { catalog97NavLinks, isCatalog97Route } from "../catalog97Nav";
import { PROJECT_PRESS } from "../projectPress";

const ROOT = path.join(__dirname, "..", "..", "..");
const APP = path.join(ROOT, "src", "app");

/** Page routes that are neither designed Catalog 97 routes nor project routes. */
const UTILITY_ROUTES = new Set([
  "/accessibility",
  "/agent-build-index",
  "/analytics-reference",
  "/arcade",
  "/changelog",
  "/design/catalog-pages",
  "/now",
  "/portfolio/[slug]",
  "/score-pools",
  "/score-pools/settings",
  "/score-pools/tracker",
  "/search",
  "/writing/[slug]",
  "/writing/topics/[topic]",
]);

function pageRoutes(): string[] {
  const routes: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "__tests__" || entry.name === "api") continue;
        walk(full);
      } else if (entry.name === "page.tsx") {
        const rel = path.relative(APP, dir).split(path.sep).join("/");
        routes.push(rel ? `/${rel}` : "/");
      }
    }
  };
  walk(APP);
  return routes.sort();
}

function resolveImport(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = path.join(ROOT, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const candidate of [base, `${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts")]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** The page file and everything it imports, followed three levels deep, skipping shared shells. */
function routeSources(route: string): Map<string, string> {
  const entry = path.join(APP, ...route.split("/").filter(Boolean), "page.tsx");
  const seen = new Map<string, string>();
  const visit = (file: string, depth: number) => {
    if (seen.has(file) || depth > 3 || !/\.(tsx?|css)$/.test(file)) return;
    const source = fs.readFileSync(file, "utf8");
    seen.set(file, source);
    for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
      const resolved = resolveImport(file, match[1]);
      if (resolved && !resolved.includes(`${path.sep}catalog97${path.sep}Catalog97`)) visit(resolved, depth + 1);
    }
  };
  visit(entry, 0);
  return seen;
}

const liveProjects = getAllCaseStudies().filter((study) => study.link?.startsWith("/"));

describe("project route inventory", () => {
  it("covers all 33 portfolio projects with a live route", () => {
    expect(liveProjects).toHaveLength(33);
  });

  it.each(liveProjects.map((study) => [study.slug, study.link as string]))("%s (%s)", (_slug, link) => {
    // (a) a press row, so the shell prints the route's own ink pair
    expect(PROJECT_PRESS[link]).toBeDefined();
    // the route exists and is wrapped by Catalog97ToolShell, which owns the one main
    expect(fs.existsSync(path.join(APP, ...link.split("/").filter(Boolean), "page.tsx"))).toBe(true);
    expect(isCatalog97Route(link)).toBe(false);

    const sources = routeSources(link);
    const all = [...sources.values()].join("\n");
    // (c) the hero: the shared project hero, or a lead-ink sheet with the poster h1
    expect(all).toMatch(/Catalog97ProjectHero|c97-project-hero|<h1 className="c97-poster/);
    // (b) no route-level main, since the shell renders the only one
    expect(all).not.toMatch(/<main[\s>]/);
    // (d) the deleted generic stats panel stays gone (name split so the close-out guard's text scan skips this file)
    expect(all).not.toContain("Home" + "StatsPanel");
  });

  it("has no press row for a route that does not exist", () => {
    const routes = new Set(pageRoutes());
    expect(Object.keys(PROJECT_PRESS).filter((route) => !routes.has(route))).toEqual([]);
  });

  it("places every page route as designed, project, or utility, with no orphans", () => {
    const designed = new Set(catalog97NavLinks.map((link) => link.href));
    const orphans = pageRoutes().filter(
      (route) => !designed.has(route) && !(route in PROJECT_PRESS) && !UTILITY_ROUTES.has(route)
    );
    expect(orphans).toEqual([]);
  });

  it("lists project routes that no portfolio card links to, so each one is deliberate", () => {
    const linked = new Set(liveProjects.map((study) => study.link));
    const unlinked = Object.keys(PROJECT_PRESS).filter((route) => !linked.has(route));
    // The fantasy suite is one portfolio project spread over eight routes.
    expect(unlinked.every((route) => route.startsWith("/fantasy-football/"))).toBe(true);
  });
});
