import ReactDOM from "react-dom";
import { StructuredData } from "@/components/StructuredData";
import { absoluteUrl, constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { fantasySnapshotRevision } from "@/data/fantasySnapshotRevision.generated";
import { loadFantasySnapshotSeed } from "@/lib/fantasySnapshotServer";
import { FANTASY_FOOTBALL_FAQ } from "./fantasy-faq";
import { FantasyFootballClient } from "./fantasy-football-client";
import { normalizeFantasyState } from "./fantasy-state";

export const metadata = constructMetadata({
  title: "Fantasy Football Rankings",
  description:
    "Fantasy football consensus and VORP rankings from published FantasyPros snapshots, with scoring and league-size controls and a linked draft assistant.",
  canonicalUrl: "/fantasy-football",
  image: "/fantasy-football/opengraph-image",
  dateModified: fantasySnapshotRevision.slice(0, 10),
});

interface FantasyFootballPageProps {
  searchParams: Promise<{
    position?: string;
    scoring?: string;
    view?: string;
    ranking?: string;
    teams?: string;
    q?: string;
  }>;
}

export default async function FantasyFootballPage({ searchParams }: FantasyFootballPageProps) {
  const initialState = normalizeFantasyState(await searchParams);
  // The board's fetch cannot start until the client bundle has downloaded and
  // hydrated, so the critical path ran HTML, then JS, then JSON in series. This
  // URL matches useFantasySnapshot's request exactly, so the in-flight preload
  // is reused rather than duplicated.
  ReactDOM.preload(`/data/fantasy/${initialState.scoring}.json?v=${fantasySnapshotRevision}`, {
    as: "fetch",
  });
  // The first page of rows rides in the HTML so the board is readable without
  // JavaScript (the answer engines robots.txt admits do not run it). A failed
  // read falls back to today's client fetch.
  const initialSnapshot = await loadFantasySnapshotSeed(initialState).catch(() => null);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Fantasy Football", url: "/fantasy-football" },
  ];

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (generateBreadcrumbStructuredData(breadcrumbs) as { itemListElement: object[] }).itemListElement,
        }}
      />
      <StructuredData
        type="SportsApplication"
        data={{
          name: "Fantasy Football Rankings",
          url: absoluteUrl("/fantasy-football"),
          description:
            "Published fantasy football rankings and draft assistant with sourced overall and position boards.",
          applicationCategory: "SportsApplication",
          operatingSystem: "Web browser",
          featureList: [
            "Overall and position-specific rankings",
            "PPR, Half PPR, and Standard scoring",
            "Published snapshot timestamps",
            "Manual draft tracker with local persistence",
            "Room-relative draft value and expected return calculator",
          ],
        }}
      />
      <StructuredData
        type="FAQPage"
        data={{
          questions: FANTASY_FOOTBALL_FAQ.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }}
      />
      <FantasyFootballClient initialState={initialState} initialSnapshot={initialSnapshot} />
    </>
  );
}
