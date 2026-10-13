"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { scrollChildIntoViewX } from "./scrollChildIntoViewX";

/**
 * The eight tools in three groups: the redraft tools, the best ball pair, and
 * the in-season pair. Link text is in the case the pages' own links use, and
 * the stylesheet sets the capitals.
 */
const FANTASY_PRODUCT_LINKS: ReadonlyArray<ReadonlyArray<{ label: string; href: string }>> = [
  [
    { label: "Rankings", href: "/fantasy-football" },
    { label: "Draft tracker", href: "/fantasy-football/draft-tracker" },
    { label: "Mock draft", href: "/fantasy-football/mock-draft" },
    { label: "Trade calculator", href: "/fantasy-football/trade-calculator" },
  ],
  [
    { label: "Best ball", href: "/fantasy-football/best-ball" },
    { label: "Best ball tracker", href: "/fantasy-football/best-ball/draft-tracker" },
  ],
  [
    { label: "Weekly", href: "/fantasy-football/weekly" },
    { label: "Waivers", href: "/fantasy-football/waivers" },
  ],
];

/**
 * The product bar above every fantasy route. One 40px row on a desktop. On a
 * phone the links scroll sideways and the current one is brought into view on
 * mount, by moving the list only, so the page does not jump. It is not sticky,
 * because every page has measured sticky bars of its own at the top.
 */
export function FantasyProductBar() {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (list && current) scrollChildIntoViewX(list, current);
  }, [pathname]);

  return (
    <div className="c97-shell c97-frame">
      <nav className="ffb-bar" aria-label="Fantasy football">
        <span className="ffb-bar-name">Fantasy Football</span>
        <ul className="ffb-bar-links" ref={listRef}>
          {FANTASY_PRODUCT_LINKS.map((group, groupIndex) =>
            group.map((link, index) => (
              <li key={link.href} className={groupIndex > 0 && index === 0 ? "ffb-bar-gap" : undefined}>
                <Link
                  href={link.href}
                  className="ffb-bar-link"
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            )),
          )}
        </ul>
      </nav>
    </div>
  );
}
