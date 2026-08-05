"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { catalog97NavLinks } from "@/constants/catalog97Nav";
import { trackNavigationClick } from "@/lib/analytics";

/**
 * The Catalog 97 header: serif wordmark on the left, seven uppercase micro
 * links on the right, and a 2px accent rule under the current route.
 *
 * Baseline-aligned rather than centered — the design sits the wordmark and the
 * nav on a shared baseline, which is why this is `align-items: baseline` and
 * the active rule is a grid row under the label rather than a border.
 */
export function Catalog97Header() {
  const pathname = usePathname();

  return (
    <header
      data-c97-surface="paper"
      style={{ padding: "var(--c97-sp-3) var(--c97-gutter)" }}
    >
      <div
        className="c97-shell"
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "var(--c97-sp-2)",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          className="c97-serif c97-lead c97-brand"
          style={{ letterSpacing: "0.02em", color: "var(--c97-ink)" }}
        >
          Isaac Vazquez
        </Link>

        {/*
          The row gap is --c97-sp-5 and the column gap stays --c97-sp-3.

          At 390 the seven links wrap to two rows, and a single --c97-sp-3 gap
          clamps to 22px there, which put the rows 39px apart while each
          `.c97-microlink` hit box is 50px tall. Measured, that overlapped five
          pairs: Home with About by 10px vertically and 52px horizontally, Work
          with Résumé, Writing with both Résumé and Contact, and Dashboards with
          Contact. Every one of those is a mis-tap on the site's primary
          navigation, on all seven routes. --c97-sp-5 is 40px at 390 and puts
          the rows 57px apart, clear of the 50px boxes.

          The column gap is deliberately left alone. The links do not fit on one
          row at any phone width, so tightening it buys nothing and only crowds
          them horizontally.
        */}
        <nav
          aria-label="Main"
          style={{
            display: "flex",
            alignItems: "flex-start",
            columnGap: "var(--c97-sp-3)",
            rowGap: "var(--c97-sp-5)",
            flexWrap: "wrap",
          }}
        >
          {catalog97NavLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className="c97-microlink"
                style={
                  active
                    ? {
                        display: "grid",
                        gap: "var(--c97-sp-1)",
                        color: "var(--c97-accent)",
                      }
                    : undefined
                }
                onClick={() =>
                  trackNavigationClick({
                    link_text: link.label,
                    link_url: link.href,
                    nav_location: "header_primary",
                  })
                }
              >
                {link.label}
                {active ? (
                  <span
                    aria-hidden="true"
                    style={{
                      display: "block",
                      height: 2,
                      /*
                        The negative bottom margin cancels the rule's own height
                        and the grid gap above it, so the active link's hit box
                        matches the other six at 50px instead of running to
                        60px. Without this the active box overhangs the row
                        below it even at a 57px row separation, and which link
                        is active changes per route, so the defect moved around
                        rather than staying put. The rule still paints under the
                        label; only its contribution to the box is removed.
                      */
                      marginBottom: "calc(-2px - var(--c97-sp-1))",
                      background: "var(--c97-accent)",
                    }}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
