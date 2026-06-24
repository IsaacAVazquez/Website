"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/constants/navlinks";
import { Menu2, Search, X } from "@/components/ui/ServerIcons";
import { DeferredThemeToggle } from "@/components/ui/DeferredThemeToggle";
import { HeaderSearchPanel } from "@/components/search/HeaderSearchPanel";
import { cn } from "@/lib/utils";
import { trackNavigationClick } from "@/lib/analytics";

function isRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StaticHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  // Close the search dropdown on navigation so a result click never leaves it open.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Dismiss the search dropdown when the route changes
    setIsSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Global search shortcuts: Cmd/Ctrl+K is the conventional "open search"
  // chord, and "/" is the single-key shortcut common on content sites. "/" is
  // ignored while the user is typing in a field so it never swallows input.
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
        setIsMobileMenuOpen(false);
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
        setIsMobileMenuOpen(false);
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {isMobileMenuOpen ? (
        <button
          type="button"
          aria-hidden="true"
          className="fixed inset-0 z-40 lg:hidden bg-[var(--home-overlay)]"
          onClick={closeMobileMenu}
          tabIndex={-1}
        />
      ) : null}
      <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow] duration-300 header-home",
        isScrolled && "shadow-[var(--shadow-sm)]"
      )}
      style={{
        backgroundColor: isScrolled
          ? "color-mix(in srgb, var(--home-paper) 88%, transparent)"
          : "color-mix(in srgb, var(--home-paper) 72%, transparent)",
        backdropFilter: "blur(16px)",
      }}
    >
      <nav className="page-shell" aria-label="Main navigation">
        <div className="flex min-h-[72px] items-center justify-between gap-4 py-3">
          <Link
            href="/"
            className="header-home-brand inline-flex min-h-[44px] items-center gap-3 px-1 py-1"
            onClick={() => {
              trackNavigationClick({
                link_text: "Isaac Vazquez",
                link_url: "/",
                nav_location: "header_brand",
              });
              closeMobileMenu();
            }}
          >
            Isaac Vazquez
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            <ul className="header-home-nav-list flex items-center gap-0" aria-label="Primary navigation">
              {navLinks.map((link) => {
                const active = isRouteActive(pathname, link.href);

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className="inline-flex min-h-[44px] items-center px-4 py-2 header-home-link"
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
                  </li>
                );
              })}
            </ul>
            <div className="header-home-controls flex items-center gap-1">
              <button
                type="button"
                aria-label="Search the site (press / or Ctrl+K)"
                title="Search — press / or ⌘K"
                aria-haspopup="dialog"
                aria-expanded={isSearchOpen}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors text-[var(--home-ink-muted)] hover:bg-[var(--home-paper-alt)] hover:text-[var(--home-ink)]"
                onClick={() => {
                  closeMobileMenu();
                  setIsSearchOpen((current) => !current);
                }}
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>
              <DeferredThemeToggle />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              aria-label="Search the site"
              aria-haspopup="dialog"
              aria-expanded={isSearchOpen}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border transition-colors header-home-control text-[var(--home-ink)] hover:bg-[var(--home-paper-alt)]"
              onClick={() => {
                closeMobileMenu();
                setIsSearchOpen((current) => !current);
              }}
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
            <DeferredThemeToggle />
            <button
              type="button"
              onClick={() => {
                trackNavigationClick({
                  link_text: isMobileMenuOpen ? "Close menu" : "Open menu",
                  link_url: pathname,
                  nav_location: "header_mobile_toggle",
                });
                setIsMobileMenuOpen((current) => !current);
              }}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border transition-colors header-home-control text-[var(--home-ink)] hover:bg-[var(--home-paper-alt)]"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu2 className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {isSearchOpen && <HeaderSearchPanel onClose={() => setIsSearchOpen(false)} />}

      <div
        id="mobile-menu"
        // Collapsed menu stays in the DOM for the height transition, so mark it
        // inert + aria-hidden to keep its links out of the tab order and the
        // accessibility tree until it's actually open.
        inert={!isMobileMenuOpen}
        aria-hidden={!isMobileMenuOpen}
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-300 ease-out lg:hidden",
          isMobileMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="page-shell pb-5">
          <div className="rounded-2xl border p-3 shadow-[var(--shadow-md)] header-home-menu">
            <ul className="space-y-1" aria-label="Mobile navigation">
              {navLinks.map((link) => {
                const active = isRouteActive(pathname, link.href);

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => {
                        trackNavigationClick({
                          link_text: link.label,
                          link_url: link.href,
                          nav_location: "header_mobile",
                        });
                        closeMobileMenu();
                      }}
                      className={cn(
                        "flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 transition-colors header-home-mobile-link",
                        active
                          ? "bg-[var(--home-paper-alt)] text-[var(--home-ink)]"
                          : "text-[var(--home-ink-muted)] hover:bg-[var(--home-paper-alt)] hover:text-[var(--home-ink)]"
                      )}
                    >
                      <link.icon className="h-5 w-5 shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

    </header>
    </>
  );
}
