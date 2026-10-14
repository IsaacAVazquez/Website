"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
 * The product bar above every fantasy route. One 40px row on a desktop. Below
 * 1200px the links scroll sideways and the current one is brought into view on
 * mount, by moving the list only, so the page does not jump. On a phone it comes
 * in at the nearer edge, so its neighbours stay in view and the scroll snapping
 * settles it. From 768px it goes to the list's left edge, where nothing is cut
 * against the name tab. A link that keyboard focus lands on goes to the left
 * edge too, since the browser scrolls only for a link that is wholly out of view.
 * A pointer press does not move the list, because the press would then land on
 * whatever slid under it. While more links sit past the right edge, the bar
 * carries `data-more` and the kit draws a cue there from 768px. It is not
 * sticky, because every page has measured sticky bars of its own at the top.
 */
export function FantasyProductBar() {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    const list = listRef.current;
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]')?.closest("li");
    if (!list || !current) return;
    // The 4px is the list's own start padding, where the phone's scroll snapping rests.
    const phone = window.matchMedia?.("(max-width: 767.98px)").matches ?? false;
    if (!phone) {
      scrollChildIntoViewX(list, current, 4, "start");
      return;
    }
    // On a phone the list snaps each link's start to its left edge, so "nearest" here is the earliest
    // link that can sit there with the current one still whole, which keeps the most neighbours in view.
    if (list.scrollWidth <= list.clientWidth) return;
    const box = list.getBoundingClientRect();
    const end = current.getBoundingClientRect().right;
    const items = Array.from(list.children) as HTMLElement[];
    let lead: HTMLElement = current;
    for (let index = items.indexOf(current) - 1; index >= 0; index--) {
      if (end - items[index].getBoundingClientRect().left > box.width - 8) break;
      lead = items[index];
    }
    list.scrollLeft += lead.getBoundingClientRect().left - box.left - 4;
  }, [pathname]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const update = () => setMore(list.scrollLeft + list.clientWidth < list.scrollWidth - 1);
    update();
    list.addEventListener("scroll", update, { passive: true });
    // The links are watched too, since they widen when the face loads and the list's own box does not change.
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(list);
    for (const item of Array.from(list.children)) observer?.observe(item);
    return () => {
      list.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, []);

  return (
    <div className="c97-shell c97-frame">
      <nav className="ffb-bar" aria-label="Fantasy football" data-more={more ? "end" : undefined}>
        <span className="ffb-bar-name">Fantasy Football</span>
        <ul
          className="ffb-bar-links"
          ref={listRef}
          onFocus={(event) => {
            const target = event.target as HTMLElement;
            const item = target.closest("li");
            if (item && target.matches(":focus-visible")) scrollChildIntoViewX(event.currentTarget, item, 4, "start");
          }}
        >
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
