import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { NewsPulseClient } from "./news-pulse-client";
import { normalizeNewsPulseState } from "./news-pulse-state";

export const metadata = constructMetadata({
  title: "News Pulse Dashboard | Isaac Vazquez",
  description:
    "Live news media analytics dashboard aggregating RSS feeds from 6 major outlets. Visualizes coverage patterns, extracts trending topics, and performs lightweight sentiment analysis.",
  canonicalUrl: "/news-pulse",
  dateModified: "2026-04-01",
  image: "/news-pulse/opengraph-image",
  aiMetadata: {
    profession: "Product Manager",
    specialty: "News media analytics, AI-adjacent tooling for editorial workflows, and media industry strategy",
    expertise: [
      "News Media Analytics",
      "RSS Feed Aggregation",
      "Sentiment Analysis",
      "Topic Extraction",
      "Next.js",
    ],
    industry: ["News Media", "Media Technology", "Product Management"],
    topics: [
      "News aggregation dashboard",
      "Media coverage analysis",
      "Headline sentiment analysis",
      "Cross-outlet topic tracking",
    ],
    contentType: "Software Application",
    context:
      "Portfolio project by Isaac Vazquez demonstrating news media analytics thinking, relevant to media strategy roles focused on AI integration and editorial innovation.",
    summary:
      "Live dashboard pulling RSS feeds from The Atlantic, NYT, The Guardian, BBC, NPR, and Washington Post to visualize coverage patterns, trending topics, and headline sentiment.",
    primaryFocus:
      "News media analytics, cross-outlet coverage visualization, and lightweight NLP for editorial intelligence",
  },
});

interface NewsPulsePageProps {
  searchParams: Promise<{
    view?: string;
    source?: string;
  }>;
}

export default async function NewsPulsePage({ searchParams }: NewsPulsePageProps) {
  const initialState = normalizeNewsPulseState(await searchParams);
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
      <NewsPulseClient
        key={`${initialState.view}-${initialState.source}`}
        initialState={initialState}
      />
    </>
  );
}
