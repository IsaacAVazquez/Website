"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navlinks } from "@/constants/navlinks";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function StaticHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href.startsWith("/#")) {
      return pathname === "/" && typeof window !== "undefined" && window.location.hash === href.slice(1);
    }
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? "shadow-sm" : "bg-transparent"
      }`}
      style={
        isScrolled
          ? {
              backgroundColor: "var(--surface-primary)",
              borderBottom: "1px solid var(--border-primary)",
              opacity: 0.97,
            }
          : undefined
      }
    >
      <nav className="container-wide mx-auto" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo / Name */}
          <Link
            href="/"
            className="text-xl md:text-2xl font-bold tracking-tight transition-colors"
            style={{ color: "var(--text-primary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          >
            Isaac Vazquez
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <ul className="flex items-center gap-1">
              {navlinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                      style={{
                        color: active ? "var(--text-primary)" : "var(--text-secondary)",
                        backgroundColor: active ? "var(--surface-secondary)" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.color = "var(--text-primary)";
                          e.currentTarget.style.backgroundColor = "var(--surface-secondary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.color = "var(--text-secondary)";
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <ThemeToggle />
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <IconX className="h-6 w-6" />
              ) : (
                <IconMenu2 className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden pb-4 mt-2"
            style={{ borderTop: "1px solid var(--border-primary)" }}
          >
            <ul className="space-y-1 pt-4">
              {navlinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-colors"
                      style={{
                        color: active ? "var(--text-primary)" : "var(--text-secondary)",
                        backgroundColor: active ? "var(--surface-secondary)" : "transparent",
                      }}
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}
