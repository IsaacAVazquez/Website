import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import FantasyFootballClient from "./fantasy-football-client";

export const metadata = constructMetadata({
  title: "Fantasy Football Tier Rankings",
  description: "Interactive fantasy football tier rankings using data visualization and clustering algorithms. View player tiers, expert consensus rankings, and make informed draft decisions.",
  canonicalUrl: "/fantasy-football",
});

export default function FantasyFootballPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Fantasy Football", url: "/fantasy-football" }
  ];

  return (
    <>
      {/* Breadcrumb Structured Data */}
      <StructuredData 
        type="BreadcrumbList" 
        data={{ items: (generateBreadcrumbStructuredData(breadcrumbs) as any).itemListElement }}
      />

      {/* Fantasy Sports Application Schema */}
      <StructuredData 
        type="SportsApplication"
        data={{
          name: "Interactive Fantasy Football Tier Visualizations",
          description: "Advanced clustering algorithms analyze 300+ players with real-time data visualization for fantasy football draft strategy",
          featureList: [
            "Real-time NFL player data integration",
            "K-Means clustering tier analysis", 
            "Interactive D3.js visualizations",
            "Position-specific player rankings",
            "Expert consensus aggregation",
            "Mobile-responsive design"
          ],
          screenshot: "https://isaacavazquez.com/fantasy-football-screenshot.png"
        }}
      />

      {/* FAQ Schema for Fantasy Football */}
      <StructuredData 
        type="FAQPage"
        data={{
          questions: [
            {
              "@type": "Question",
              "name": "How are fantasy football tiers calculated?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our fantasy football tiers use K-Means clustering algorithms to analyze 300+ NFL players across multiple ranking sources, grouping players with similar projected performance into tiers for easier draft decision-making."
              }
            },
            {
              "@type": "Question", 
              "name": "How often is fantasy football data updated?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Fantasy football player data is updated daily through automated integration with FantasyPros API, ensuring you have the most current rankings and projections for your draft decisions."
              }
            },
            {
              "@type": "Question",
              "name": "What positions are included in fantasy football tiers?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our fantasy football tier system includes all major positions: Quarterbacks (QB), Running Backs (RB), Wide Receivers (WR), Tight Ends (TE), Team Defenses (DST), and Kickers (K)."
              }
            }
          ]
        }}
      />

      <FantasyFootballClient />
    </>
  );
}