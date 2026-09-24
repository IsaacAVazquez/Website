"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderSearchPanel } from "@/components/search/HeaderSearchPanel";
import { DeferredThemeToggle } from "@/components/ui/DeferredThemeToggle";
import { catalog97NavLinks } from "@/constants/catalog97Nav";
import { trackNavigationClick } from "@/lib/analytics";

/**
 * The Catalog 97 header, printed as a saffron sheet whose bottom edge tears
 * over the page. The wordmark is Anton poster type with the second ink off
 * register, and the current route is marked by an ink block behind its link.
 * Accepted in Impeccable live mode on 2026-09-23; styles are `.c97-header*`
 * in catalog97.css.
 */
export function Catalog97Header() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Close search after navigation
    setIsSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      if (
        event.key === "/" &&
        !isTypingTarget &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  return (
    <header data-c97-surface="ink-saffron" className="c97-header">
      <div className="c97-shell c97-header-row">
        <Link href="/" className="c97-brand c97-header-brand">
          Isaac Vazquez
        </Link>
        {/*
          The row gap is --c97-sp-5 so wrapped rows of `.c97-microlink` hit
          boxes (50px tall) never overlap on a phone; see `.c97-header-nav`.
        */}
        <nav aria-label="Main" className="c97-header-nav">
          {catalog97NavLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className="c97-microlink c97-header-link"
                onClick={() =>
                  trackNavigationClick({
                    link_text: link.label,
                    link_url: link.href,
                    nav_location: "header_primary",
                  })
                }
              >
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            aria-label="Search the site (press / or Ctrl+K)"
            aria-haspopup="dialog"
            aria-expanded={isSearchOpen}
            className="c97-microlink c97-header-util"
            onClick={() => setIsSearchOpen((current) => !current)}
          >
            Search
          </button>
          <DeferredThemeToggle className="!rounded-none !text-[var(--c97-ink-2)] hover:!text-[var(--c97-ink)]" />
        </nav>
      </div>
      {isSearchOpen ? (
        <HeaderSearchPanel onClose={() => setIsSearchOpen(false)} />
      ) : null}
    </header>
  );
}
