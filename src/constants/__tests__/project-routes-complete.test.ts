/**
 * Inventory guard for the project routes. Every portfolio project that links
 * to a live route must exist, leave the one `main` to the shell, and never
 * bring back the generic stats panel. It also classifies every page route on
 * the site, so a new route has to be placed on purpose. Since the 2026-10-11
 * project-sovereign spec a project route owns its own design inside the site
 * frame, so nothing here requires the Catalog 97 hero, the poster h1, or a
 * press row; `DASHBOARD_ROUTES` is the registry. `e2e/project-routes.spec.ts`
 * checks the rendered side (one h1, one main, no hydration errors).
 */
import fs from "node:fs";
import path from "node:path";
import { caseStudiesData } from "../caseStudies";
import { catalog97NavLinks, DASHBOARD_ROUTES, isCatalog97Route, isDashboardRoute } from "../catalog97Nav";

const ROOT = path.join(__dirname, "..", "..", "..");
const APP = path.join(ROOT, "src", "app");

/** Page routes that are neither designed Catalog 97 routes nor project routes. */
const UTILITY_ROUTES = new Set([
  "/accessibility",
  "/agent-build-index",
  "/arcade",
  "/back-room/[discovery]",
  "/changelog",
  "/now",
  "/portfolio/[slug]",
  "/privacy",
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

const liveProjects = Object.values(caseStudiesData).filter((study) => study.link?.startsWith("/"));

describe("project route inventory", () => {
  it("covers all 34 portfolio projects with a live route", () => {
    expect(liveProjects).toHaveLength(34);
  });

  it.each(liveProjects.map((study) => [study.slug, study.link as string]))("%s (%s)", (_slug, link) => {
    // the route exists and is wrapped by Catalog97ToolShell, which owns the one main
    expect(fs.existsSync(path.join(APP, ...link.split("/").filter(Boolean), "page.tsx"))).toBe(true);
    expect(isCatalog97Route(link)).toBe(false);

    const sources = routeSources(link);
    const all = [...sources.values()].join("\n");
    // no route-level main, since the shell renders the only one
    expect(all).not.toMatch(/<main[\s>]/);
    // the deleted generic stats panel stays gone (name split so the close-out guard's text scan skips this file)
    expect(all).not.toContain("Home" + "StatsPanel");
  });


  it("places every page route as designed, project, or utility, with no orphans", () => {
    const designed = new Set(catalog97NavLinks.map((link) => link.href));
    const orphans = pageRoutes().filter(
      (route) => !designed.has(route) && !isDashboardRoute(route) && !UTILITY_ROUTES.has(route)
    );
    expect(orphans).toEqual([]);
  });


  it("marks Dashboards in the header on every live tool, and on nothing else", () => {
    expect([...DASHBOARD_ROUTES].sort()).toEqual(liveProjects.map((study) => study.link).sort());
    expect(isDashboardRoute("/fantasy-football/weekly")).toBe(true);
    expect(isDashboardRoute("/score-pools")).toBe(false);
    expect(isDashboardRoute("/nbax")).toBe(false);
  });

  // The browser spec spreads DASHBOARD_ROUTES and names every other project
  // page by hand, so a page added below a project gets no two-zone hydration
  // check and no header-edge check until it is named there.
  it("names every project page outside the registry in the browser spec", () => {
    const spec = fs.readFileSync(path.join(ROOT, "e2e", "project-routes.spec.ts"), "utf8");
    const outsideRegistry = [
      ...pageRoutes().filter((route) => isDashboardRoute(route) && !DASHBOARD_ROUTES.includes(route)),
      "/score-pools",
      "/score-pools/tracker",
      "/score-pools/settings",
      "/agent-build-index",
    ];
    expect(spec).toContain("...DASHBOARD_ROUTES");
    expect(outsideRegistry.filter((route) => !spec.includes(`"${route}"`))).toEqual([]);
  });
});
