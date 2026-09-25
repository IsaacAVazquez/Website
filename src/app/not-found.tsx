import type { Metadata } from "next";
import Link from "next/link";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: {
    absolute: "Page Not Found | Isaac Vazquez",
  },
  description:
    "The requested page is not available. Use the site links to return home or continue to projects and writing.",
  alternates: {
    canonical: undefined,
    languages: {},
  },
  robots: {
    index: false,
    follow: true,
  },
};

const waysBack = [
  { href: "/writing", label: "Writing" },
  { href: "/portfolio", label: "Work" },
  { href: "/dashboards", label: "Dashboards" },
  { href: "/search", label: "Search" },
];

/*
 * The 404 is a misprint: a blue sheet that came off the press skewed, torn at
 * both edges, with the second ink printed well off register and an ink smudge
 * in the corner. All of that is decoration. The text sits above it in the
 * sheet's own ink, and the ways back live on plain paper under the sheet.
 *
 * `ConditionalLayout` wraps this in `Catalog97ToolShell`, which supplies the
 * header, the only `main`, and the footer, so this renders bands only.
 */
export default function NotFound() {
  return (
    <section className={`c97-band ${styles.band}`} data-c97-surface="paper">
      <div className="c97-shell">
        <div
          className={`c97-sheet ${styles.misprint}`}
          data-c97-surface="ink-blue"
          data-seam="torn"
        >
          <span aria-hidden="true" className="c97-halftone c97-halftone-corner" />
          <span aria-hidden="true" className={styles.smudge} />
          <h1 className={`c97-poster ${styles.headline}`}>
            <span className={styles.numeral}>404</span>{" "}
            <span className={styles.line}>This page came off the press wrong</span>
          </h1>
          <p className={`c97-lead ${styles.lead}`}>
            I don&apos;t have anything at this address. The link may be old or
            have a typo in it, but the pages below are all still here.
          </p>
        </div>

        <nav aria-label="Ways back" className={styles.ways}>
          <Link href="/" className="c97-btn c97-offset">
            Back to the home page
          </Link>
          {waysBack.map((link) => (
            <Link key={link.href} href={link.href} className="c97-btn-ghost">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
