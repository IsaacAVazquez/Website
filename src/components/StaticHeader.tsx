"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navlinks } from "@/constants/navlinks";
import { IconMenu2, IconX } from "@tabler/icons-react";

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
        isScrolled
          ? "bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="container-wide mx-auto" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo / Name */}
          <Link
            href="/"
            className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Isaac Vazquez
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-1">
            {navlinks.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 dark:border-gray-800 mt-2">
            <ul className="space-y-1 pt-4">
              {navlinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                        active
                          ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
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
