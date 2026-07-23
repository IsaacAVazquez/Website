import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { getNewsPulseData } from "@/lib/newsPulseServer";
import { NewsPulseClient } from "./news-pulse-client";
import { normalizeNewsPulseState } from "./news-pulse-state";

export const metadata = constructMetadata({
  title: "News Pulse Dashboard",
  description:
    "Live news media analytics dashboard aggregating RSS feeds from 6 major outlets. Visualizes coverage patterns, extracts trending topics, and performs lightweight sentiment analysis.",
  canonicalUrl: "/news-pulse",
  dateModified: "2026-07-23",
  image: "/news-pulse/opengraph-image",
});

interface NewsPulsePageProps {
  searchParams: Promise<{
    view?: string;
    source?: string;
  }>;
}

export default async function NewsPulsePage({ searchParams }: NewsPulsePageProps) {
  const initialState = normalizeNewsPulseState(await searchParams);
  const initialFeed = (await getNewsPulseData()).body;
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "News Pulse", url: "/news-pulse" },
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
        type="SoftwareApplication"
        data={{
          name: "News Pulse Dashboard",
          description:
            "Live news media analytics dashboard aggregating RSS feeds from major outlets with coverage pattern visualization, topic extraction, and sentiment analysis.",
          url: "https://isaacavazquez.com/news-pulse",
          image: "https://isaacavazquez.com/news-pulse/opengraph-image",
          dateModified: "2026-07-23",
          applicationCategory: "NewsApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "news analytics",
            "media coverage",
            "RSS aggregation",
            "sentiment analysis",
            "topic extraction",
          ],
        }}
      />
      <NewsPulseClient initialFeed={initialFeed} initialState={initialState} />
    </>
  );
}
