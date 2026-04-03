import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { PremierLeagueClient } from "./premier-league-client";
import { normalizePremierLeagueState } from "./premier-league-state";

// eslint-disable-next-line react-refresh/only-export-components -- Next.js route modules export metadata alongside the page component.
export const metadata = constructMetadata({
  title: "Premier League Pulse | Isaac Vazquez",
  description:
    "Live Premier League dashboard with standings, recent and upcoming fixtures, and club-level drilldowns powered by a server-side football-data proxy.",
  canonicalUrl: "/premier-league",
  dateModified: "2026-04-03",
  aiMetadata: {
    profession: "Product Manager",
    specialty: "Interactive sports dashboards, API-backed product surfaces, and exploratory data UX",
    expertise: [
      "Next.js",
      "Sports data products",
      "Dashboard design",
      "API normalization",
      "Deep-linkable UI state",
    ],
    industry: ["Sports", "Media", "Analytics"],
    topics: [
      "Premier League standings",
      "soccer dashboard",
      "fixture tracker",
      "club form explorer",
    ],
    contentType: "Software Application",
    context:
      "Standalone Premier League tool by Isaac Vazquez that packages live football-data.org competition data into a deep-linkable product surface.",
    summary:
      "Premier League dashboard for standings, fixtures, and club-level recent-form drilldowns.",
    primaryFocus:
      "API-backed sports exploration, fast dashboard UX, and shareable league views",
  },
});

interface PremierLeaguePageProps {
  searchParams: Promise<{
    view?: string;
    team?: string;
  }>;
}

export default async function PremierLeaguePage({ searchParams }: PremierLeaguePageProps) {
  const initialState = normalizePremierLeagueState(await searchParams);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Premier League Pulse", url: "/premier-league" },
  ];

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (generateBreadcrumbStructuredData(breadcrumbs) as { itemListElement: object[] })
            .itemListElement,
        }}
      />
      <StructuredData
        type="SportsApplication"
        data={{
          name: "Premier League Pulse",
          description:
            "Live Premier League dashboard with standings, fixture tracking, and club-level form drilldowns.",
          url: "https://isaacavazquez.com/premier-league",
          applicationCategory: "SportsApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Deep-linkable overview, fixtures, and club views",
            "League standings with quick club drilldowns",
            "Recent and upcoming fixture tracking",
            "Club form summaries powered by a server-side API proxy",
          ],
        }}
      />
      <PremierLeagueClient initialState={initialState} />
    </>
  );
}
