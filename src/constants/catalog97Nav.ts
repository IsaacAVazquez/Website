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
