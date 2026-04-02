"use client";

import { usePathname } from "next/navigation";
import { Footer, type FooterVariant } from "@/components/Footer";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const selfShellRoutes = new Set([
    "/about",
    "/contact",
    "/fantasy-football",
    "/fantasy-football/draft-tracker",
    "/investments",
    "/march-madness-2026",
    "/news-pulse",
    "/portfolio",
    "/spacex-mission-control",
    "/writing",
  ]);
  const isSelfShellRoute = selfShellRoutes.has(pathname);
  const compactFooterRoutes = new Set(["/", "/contact"]);
  const footerVariant: FooterVariant = compactFooterRoutes.has(pathname)
    ? "compact"
    : "full";

  return (
    <>
      <div className="min-h-screen">
        <main
          id="main-content"
          role="main"
          aria-label={isHomePage ? "Isaac Vazquez Portfolio Homepage" : "Portfolio Content"}
          tabIndex={-1}
        >
          {isHomePage ? (
            children
          ) : isSelfShellRoute ? (
            children
          ) : (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
              {children}
            </div>
          )}
        </main>
      </div>

      <Footer variant={footerVariant} />
    </>
  );
}
