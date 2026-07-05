import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import {
  MARCH_MADNESS_DESCRIPTION,
  MARCH_MADNESS_FAQ,
  MARCH_MADNESS_THESIS,
  MARCH_MADNESS_TITLE,
  MARCH_MADNESS_UPDATED_AT,
} from "./march-madness-data";
import { MarchMadnessClient } from "./march-madness-client";
import { normalizeMarchMadnessState } from "./march-madness-state";

export const metadata = constructMetadata({
  title: "March Madness 2026 Bracket Analysis",
  description: MARCH_MADNESS_DESCRIPTION,
  canonicalUrl: "/march-madness-2026",
  dateModified: MARCH_MADNESS_UPDATED_AT,
  image: "/march-madness-2026/opengraph-image",
  aiMetadata: {
    profession: "Product Manager",
    specialty: "Sports analytics storytelling, data visualization, and interactive product packaging",
    expertise: [
      "March Madness Bracket Analysis",
      "Sports Analytics",
      "Data Storytelling",
      "Interactive Product Design",
      "Next.js",
    ],
    industry: ["Sports Analytics", "Media", "Product Management"],
    topics: [
      "March Madness bracket",
      "NCAA tournament upset picks",
      "Final Four predictions",
      "Sports analytics UX",
    ],
    contentType: "Interactive Sports Analysis",
    context:
      "Hybrid portfolio project and editorial sports-analysis page by Isaac Vazquez that turns a bracket model into an interactive page you can click through by region.",
    summary:
      "Interactive 2026 March Madness bracket with upset picks, Final Four predictions, and a time-zone travel penalty model.",
    primaryFocus:
      "Search-friendly sports analysis, interactive storytelling, and analytics-driven bracket picks",
  },
});

interface MarchMadnessPageProps {
  searchParams: Promise<{
    view?: string;
    region?: string;
    analytics?: string;
  }>;
}

export default async function MarchMadnessPage({ searchParams }: MarchMadnessPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialState = normalizeMarchMadnessState(resolvedSearchParams);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "March Madness 2026", url: "/march-madness-2026" },
  ];

  const faqQuestions = MARCH_MADNESS_FAQ.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  }));

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
        type="Article"
        data={{
          headline: MARCH_MADNESS_TITLE,
          description: MARCH_MADNESS_DESCRIPTION,
          url: "https://isaacavazquez.com/march-madness-2026",
          image: "https://isaacavazquez.com/march-madness-2026/opengraph-image",
          datePublished: MARCH_MADNESS_UPDATED_AT,
          dateModified: MARCH_MADNESS_UPDATED_AT,
          authorName: "Isaac Vazquez",
          keywords: [
            "March Madness bracket analysis",
            "2026 March Madness upset picks",
            "Final Four predictions",
            "time zone bracket model",
            "KenPom bracket analysis",
          ],
          articleSection: "Sports Analytics",
        }}
      />

      <StructuredData
        type="FAQPage"
        data={{
          questions: faqQuestions,
        }}
      />

      <StructuredData
        type="SportsApplication"
        data={{
          name: "March Madness 2026 Bracket Analysis",
          description: MARCH_MADNESS_DESCRIPTION,
          url: "https://isaacavazquez.com/march-madness-2026",
          featureList: [
            "Interactive bracket by region",
            "Best upset picks and Final Four predictions",
            "KenPom and consensus rankings",
            "S-curve seed error review",
            "Injury context and time-zone penalty modeling",
          ],
          screenshot: "https://isaacavazquez.com/march-madness-2026/opengraph-image",
          about: {
            "@type": "Thing",
            name: "March Madness bracket analysis",
            description: MARCH_MADNESS_THESIS,
          },
          audience: {
            "@type": "Audience",
            audienceType: "College basketball fans and sports analytics readers",
          },
        }}
      />

      <MarchMadnessClient
        key={`${initialState.view}-${initialState.region}-${initialState.analytics}`}
        initialState={initialState}
      />
    </>
  );
}
