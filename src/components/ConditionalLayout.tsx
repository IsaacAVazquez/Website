"use client";

import { usePathname } from "next/navigation";
import {
  Footer,
  type FooterVariant,
} from "@/components/Footer";
import { ProjectBuildNote } from "@/components/ProjectBuildNote";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const projectBuildNotes: Record<string, string> = {
  "/ai-dev-tools": "/writing/mapping-the-ai-dev-tool-ecosystem",
  "/bay-area-transit": "/writing/building-a-bart-transit-dashboard",
  "/decision-lab": "/writing/building-decision-lab",
  "/earthquake-pulse": "/writing/building-an-earthquake-dashboard",
  "/fantasy-formula-1": "/writing/building-a-fantasy-formula-1-optimizer",
  "/fantasy-football": "/writing/building-a-fantasy-football-rankings-platform",
  "/fintech-tools/budget-planner": "/writing/building-a-budget-planner",
  "/fintech-tools/interchange-iq": "/writing/interchange-iq-payment-fee-analyzer",
  "/food-map": "/writing/building-an-austin-food-map",
  "/formula-1": "/writing/building-a-formula-1-dashboard",
  "/frontier-models": "/writing/building-a-frontier-model-tracker",
  "/golf": "/writing/building-a-pga-tour-dashboard",
  "/github-trending-pulse": "/writing/building-a-github-trending-dashboard",
  "/investments": "/writing/building-an-investment-research-platform",
  "/la-liga": "/writing/building-a-la-liga-dashboard",
  "/mba-internship-notifications": "/writing/building-an-mba-recruiting-tracker",
  "/mlb": "/writing/building-an-mlb-dashboard",
  "/museum-log": "/writing/building-a-museum-log",
  "/nba": "/writing/building-an-nba-dashboard",
  "/news-pulse": "/writing/building-news-pulse-dashboard",
  "/nfl": "/writing/building-an-nfl-dashboard",
  "/polling-aggregator": "/writing/building-a-polling-aggregator",
  "/premier-league": "/writing/building-a-premier-league-dashboard",
  "/recipe-finder": "/writing/building-a-pantry-aware-recipe-finder",
  "/spacex-mission-control": "/writing/building-spacex-mission-control",
  "/tech-startup-tracker": "/writing/building-a-tech-startup-tracker",
  "/travel": "/writing/building-a-travel-planner",
  "/wine-cellar": "/writing/building-a-wine-cellar-app",
  "/world-cup-2026": "/writing/building-a-world-cup-dashboard",
};

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const selfShellRoutes = new Set([
    "/about",
    "/accessibility",
    "/ai-dev-tools",
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
    pathname.startsWith("/writing/");
  const compactFooterRoutes = new Set(["/", "/contact"]);
  const footerVariant: FooterVariant = compactFooterRoutes.has(pathname)
    ? "compact"
    : "full";
  const buildNoteHref = projectBuildNotes[pathname];
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
          {buildNoteHref ? <ProjectBuildNote href={buildNoteHref} /> : null}
        </main>
      </div>

      <Footer variant={footerVariant} />
    </>
  );
}
