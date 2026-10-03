/**
 * The seven routes that render in the Catalog 97 design language, and the
 * header nav that runs across all of them.
 *
 * This is the single source of truth for "is this a designed Catalog 97
 * route". `ConditionalLayout` and `error.tsx` read `isCatalog97Route` to pass
 * these seven through untouched, since their page components render
 * `Catalog97Shell` themselves, and to wrap every other route in
 * `Catalog97ToolShell`. Adding a route here
 * moves it into the design language; it does not need any other
 * registration.
 */

export interface Catalog97NavLink {
  href: string;
  /** Nav label. Diverges from the route name where the design says so. */
  label: string;
}

export const catalog97NavLinks: Catalog97NavLink[] = [
  { href: "/", label: "Home" },
  // The route stays /portfolio; the design labels it "Work".
  { href: "/portfolio", label: "Work" },
  { href: "/writing", label: "Writing" },
  { href: "/dashboards", label: "Dashboards" },
  { href: "/about", label: "About" },
  { href: "/resume", label: "Résumé" },
  { href: "/contact", label: "Contact" },
];

const catalog97Routes = new Set(catalog97NavLinks.map((link) => link.href));

/**
 * True for the seven designed routes only. Deliberately an exact match rather
 * than a prefix test: /portfolio/[slug] and /writing/[slug] are detail pages
 * with their own layouts, so they render inside Catalog97ToolShell like every
 * other route.
 */
export function isCatalog97Route(pathname: string): boolean {
  return catalog97Routes.has(pathname);
}

/**
 * Every live tool that /dashboards lists, so the header can mark Dashboards as
 * the section on those routes even though they do not sit under /dashboards.
 * It mirrors the internal `link` of each case study, and
 * `project-routes-complete.test.ts` fails when the two drift. A copy rather than
 * an import because the header ships to the client and caseStudies is large.
 */
export const DASHBOARD_ROUTES: readonly string[] = [
  "/ai-dev-tools",
  "/bay-area-transit",
  "/decision-lab",
  "/earthquake-pulse",
  "/enablement-assistant",
  "/fantasy-football",
  "/fantasy-formula-1",
  "/fintech-tools/budget-planner",
  "/fintech-tools/interchange-iq",
  "/fintech-tools/rent-vs-buy",
  "/food-map",
  "/formula-1",
  "/frontier-models",
  "/github-trending-pulse",
  "/golf",
  "/investments",
  "/investments/before-you-buy",
  "/la-liga",
  "/march-madness-2026",
  "/mba-internship-notifications",
  "/mlb",
  "/museum-log",
  "/nba",
  "/news-pulse",
  "/nfl",
  "/polling-aggregator",
  "/premier-league",
  "/recipe-finder",
  "/spacex-mission-control",
  "/tech-startup-tracker",
  "/travel",
  "/travel-deals",
  "/wine-cellar",
  "/world-cup-2026",
];

/** True on a listed tool or any page below one (the fantasy boards, for instance). */
export function isDashboardRoute(pathname: string): boolean {
  return DASHBOARD_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * The dense tools that print on the wide column (`--c97-container-wide`).
 * `ConditionalLayout` marks these pages, and every shell on them widens, the
 * header's and footer's included, so the title, the tool, and the wordmark
 * share one edge. A route list rather than a marker inside the page, so the
 * loading and error states widen too. Exact matches, so the score pools
 * tracker and settings stay on the standard column.
 */
export const WIDE_TOOL_ROUTES: ReadonlySet<string> = new Set([
  "/fantasy-football/trade-calculator",
  "/fantasy-football/best-ball/draft-tracker",
  "/investments",
  "/score-pools",
]);
