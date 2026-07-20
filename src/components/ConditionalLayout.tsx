"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  Footer,
  type FooterVariant,
} from "@/components/Footer";
import { projectBuildNoteLinks } from "@/components/projectBuildNoteLinks";

const ProjectBuildNote = dynamic(() =>
  import("@/components/ProjectBuildNote").then((mod) => mod.ProjectBuildNote),
);

interface ConditionalLayoutProps {
  children: React.ReactNode;
}


export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const selfShellRoutes = new Set([
    "/about",
    "/accessibility",
    "/ai-dev-tools",
    "/analytics-reference",
    "/arcade",
    "/bay-area-transit",
    "/changelog",
    "/contact",
    "/decision-lab",
    "/earthquake-pulse",
    "/fantasy-formula-1",
    "/fantasy-football",
    "/fantasy-football/draft-tracker",
    "/fintech-tools/budget-planner",
    "/fintech-tools/interchange-iq",
    "/fintech-tools/rent-vs-buy",
    "/food-map",
    "/formula-1",
    "/frontier-models",
    "/golf",
    "/github-trending-pulse",
    "/investments",
    "/la-liga",
    "/march-madness-2026",
    "/mba-internship-notifications",
    "/mlb",
    "/museum-log",
    "/nba",
    "/news-pulse",
    "/nfl",
    "/now",
    "/polling-aggregator",
    "/premier-league",
    "/portfolio",
    "/recipe-finder",
    "/resume",
    "/score-pools",
    "/search",
    "/spacex-mission-control",
    "/tech-startup-tracker",
    "/travel",
    "/travel-deals",
    "/wine-cellar",
    "/world-cup-2026",
    "/writing",
  ]);
  const isSelfShellRoute =
    selfShellRoutes.has(pathname) ||
    pathname.startsWith("/portfolio/") ||
    pathname.startsWith("/score-pools/") ||
    pathname.startsWith("/writing/");
  const compactFooterRoutes = new Set(["/", "/contact"]);
  const footerVariant: FooterVariant = compactFooterRoutes.has(pathname)
    ? "compact"
    : "full";
  const buildNoteHref = projectBuildNoteLinks[pathname];
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
          {buildNoteHref ? (
            <ProjectBuildNote href={buildNoteHref} route={pathname} />
          ) : null}
        </main>
      </div>

      <Footer variant={footerVariant} />
    </>
  );
}
