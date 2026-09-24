import Link from "next/link";
import { Catalog97Header } from "./Catalog97Header";

/**
 * The script lockup. One per page, in the footer's first column.
 *
 * It used to sit on its own full-bleed pine band between the page and the
 * footer, and it renders the emblem alone now so the footer can place it. The
 * band went with it, so a route ends on its own last band and then the footer.
 *
 * Drawn as SVG rather than as rotated HTML. The rotation lives inside the
 * viewBox, so the mark never depends on layout to come out right and the rules
 * cannot escape the frame the way a rotated 150%-wide div does.
 *
 * The two rules are 2.5 units on a 560 viewBox, which is 0.45% of the frame
 * width and stays a hairline at every rendered size because the viewBox scales
 * them with everything else. They are contained rather than bled: the widths
 * taper from the script, which overhangs both, down through the lower rule at
 * 366, the upper rule at 340, and the caps line, which is narrowest. The
 * script's ascenders stop above the upper rule instead of crossing it.
 *
 * `currentColor` resolves through `color: var(--c97-ink)` on `.c97-wordmark`,
 * so the mark takes the ink of whatever surface it sits on.
 */
export function Catalog97Wordmark() {
  return (
    /*
      aria-hidden: the name is already the header wordmark on every page that
      renders this, so announcing it again is noise. The caps line is decorative
      for the same reason.

      `currentColor` resolves through `color: var(--c97-ink)` on `.c97-wordmark`,
      and --c97-ink is redeclared per surface, so moving the mark from pine to
      the espresso footer re-inks it with no change here.
    */
    <svg
      className="c97-wordmark"
      viewBox="0 0 560 300"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="rotate(-19 280 150)">
        <rect x="110" y="78" width="340" height="2.5" fill="currentColor" />
        <text
          x="280"
          y="154"
          textAnchor="middle"
          fontSize="72"
          fill="currentColor"
          style={{ fontFamily: "var(--c97-font-script)" }}
        >
          Isaac Vazquez
        </text>
        <rect x="97" y="200" width="366" height="2.5" fill="currentColor" />
        <text
          x="280"
          y="224"
          textAnchor="middle"
          fontSize="11.5"
          letterSpacing="0.95"
          fill="currentColor"
          style={{ fontFamily: "var(--c97-font-body)" }}
        >
          BERKELEY, CALIFORNIA · PRODUCT AND ANALYTICS
        </text>
      </g>
    </svg>
  );
}

const footerPages = [
  { href: "/portfolio", label: "Work" },
  { href: "/writing", label: "Writing" },
  { href: "/dashboards", label: "Dashboards" },
];

const footerElsewhere = [
  { href: "https://github.com/IsaacAVazquez", label: "GitHub", external: true },
  {
    href: "https://www.linkedin.com/in/isaac-vazquez/",
    label: "LinkedIn",
    external: true,
  },
  { href: "/resume", label: "Résumé", external: false },
];

const footerSite = [
  { href: "/now", label: "Now" },
  { href: "/changelog", label: "Changelog" },
  { href: "/accessibility", label: "Accessibility" },
];

/*
 * The footer's three link groups, each printed on its own ink sheet and pasted
 * onto the espresso footer on an offset. Accepted in Impeccable live mode on
 * 2026-09-24; styles are `.c97-footer-*` in catalog97.css.
 */
const footerGroups = [
  { name: "Pages", links: footerPages, surface: "ink-saffron" },
  { name: "Elsewhere", links: footerElsewhere, surface: "ink-peach" },
  { name: "Site", links: footerSite, surface: "bone" },
] as const;

function Catalog97Footer({ wordmark }: { wordmark: boolean }) {
  return (
    <footer
      role="contentinfo"
      aria-label="Site footer"
      data-c97-surface="espresso"
      className="c97-sheet c97-footer"
      data-seam="torn"
    >
      <div className="c97-shell">
        <div className="c97-footer-tiles">
          {footerGroups.map(({ name, links, surface }) => (
            <nav
              key={name}
              aria-label={name}
              className="c97-footer-tile"
              data-c97-surface={surface}
            >
              {/* The nav's aria-label already names the group for assistive tech. */}
              <p className="c97-footer-tile-name" aria-hidden="true">
                {name}
              </p>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="c97-footer-link"
                  {...("external" in link && link.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <div className="c97-footer-colophon">
          {wordmark ? <Catalog97Wordmark /> : null}
          <p className="c97-footer-copy">
            &copy; {new Date().getFullYear()} Isaac Vazquez
          </p>
        </div>
      </div>
    </footer>
  );
}

interface Catalog97ShellProps {
  children: React.ReactNode;
  /**
   * Set false to drop the script emblem from the footer's first column, which
   * leaves the copyright line there on its own. Defaults to true, which is what
   * every designed route does; no route passes this today.
   *
   * It used to gate a full-bleed pine band between the page and the footer, for
   * routes that ended in their own band and did not want the mark repeated.
   * That band is gone, so the flag now only governs the mark itself.
   */
  wordmark?: boolean;
}

/**
 * Page wrapper shared by the seven Catalog 97 routes and, as the base of
 * `Catalog97ToolShell`, every other route besides.
 *
 * Owns the `.c97-page` scope that every `--c97-*` token hangs off, and renders
 * the header and the footer around the page's bands. The route itself supplies
 * only the bands between them. The script emblem lives inside the footer now
 * rather than on its own band above it.
 *
 * `ConditionalLayout` stands down on these routes (see `isCatalog97Route`),
 * so this is the only header and footer on the page. The `<main>` landmark
 * lives here for the same reason.
 */
export function Catalog97Shell({
  children,
  wordmark = true,
}: Catalog97ShellProps) {
  return (
    <div className="c97-page" data-c97 data-c97-surface="paper">
      <Catalog97Header />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Catalog97Footer wordmark={wordmark} />
    </div>
  );
}
