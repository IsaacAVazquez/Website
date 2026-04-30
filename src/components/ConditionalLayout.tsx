"use client";

import { usePathname } from "next/navigation";
import {
  Footer,
  type FooterVariant,
} from "@/components/Footer";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const selfShellRoutes = new Set([
    "/about",
    "/ai-dev-tools",
    "/changelog",
    "/contact",
    "/decision-lab",
    "/fantasy-football",
    "/fantasy-football/draft-tracker",
    "/fintech-tools/budget-planner",
    "/fintech-tools/interchange-iq",
    "/food-map",
    "/formula-1",
    "/golf",
    "/github-trending-pulse",
    "/investments",
    "/la-liga",
    "/march-madness-2026",
    "/mba-internship-notifications",
    "/museum-log",
    "/news-pulse",
    "/now",
    "/polling-aggregator",
    "/premier-league",
    "/portfolio",
    "/recipe-finder",
    "/resume",
    "/spacex-mission-control",
    "/wine-cellar",
    "/writing",
  ]);
  const isSelfShellRoute =
    selfShellRoutes.has(pathname) ||
    pathname.startsWith("/portfolio/") ||
    pathname.startsWith("/writing/");
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
