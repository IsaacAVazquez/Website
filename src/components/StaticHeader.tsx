"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/constants/navlinks";
import { Menu2, X } from "@/components/ui/ServerIcons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

function isRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StaticHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

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

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-[background-color,border-color,box-shadow] duration-300",
        isScrolled ? "border-b border-[var(--border-primary)] shadow-sm" : ""
      )}
      style={{
        backgroundColor: isScrolled
          ? "color-mix(in srgb, var(--surface-primary) 92%, transparent)"
          : "color-mix(in srgb, var(--surface-primary) 78%, transparent)",
        backdropFilter: "blur(16px)",
      }}
    >
      <nav className="page-shell" aria-label="Main navigation">
        <div className="flex min-h-[72px] items-center justify-between gap-4 py-3">
          <Link
            href="/"
            className="min-h-[44px] rounded-xl px-1 py-1 text-lg font-semibold tracking-tight text-[var(--text-primary)] transition-colors hover:text-[var(--color-primary)]"
            onClick={closeMobileMenu}
          >
            Isaac Vazquez
          </Link>

          <div className="hidden lg:flex items-center gap-3">
            <ul className="flex items-center gap-1" aria-label="Primary navigation">
              {navLinks.map((link) => {
                const active = isRouteActive(pathname, link.href);

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-[var(--surface-secondary)] text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-primary)]">
              <ThemeToggle />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-primary)]">
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-primary)] text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-secondary)]"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu2 className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      <div
        id="mobile-menu"
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-300 ease-out lg:hidden",
          isMobileMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="page-shell pb-5">
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] p-3 shadow-sm">
            <ul className="space-y-1" aria-label="Mobile navigation">
              {navLinks.map((link) => {
                const active = isRouteActive(pathname, link.href);

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      onClick={closeMobileMenu}
                      className={cn(
                        "flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors",
                        active
                          ? "bg-[var(--surface-secondary)] text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
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

      {isMobileMenuOpen ? (
        <button
          type="button"
          aria-hidden="true"
          className="fixed inset-0 z-[-1] bg-[var(--surface-overlay)] lg:hidden"
          onClick={closeMobileMenu}
          tabIndex={-1}
        />
      ) : null}
    </header>
  );
}
