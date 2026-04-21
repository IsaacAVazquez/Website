import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { DecisionLabClient } from "./decision-lab-client";
import { normalizeDecisionLabState } from "./decision-lab-state";

export const metadata = constructMetadata({
  title: "Decision Lab | Isaac Vazquez",
  description:
    "Product-bet triage tool for scoring impact, confidence, effort, and reversibility before calling ship, test, or hold.",
  canonicalUrl: "/decision-lab",
  dateModified: "2026-04-17",
  aiMetadata: {
    profession: "Product Manager",
    specialty: "Decision-support tooling, product strategy, and roadmap triage",
    expertise: [
      "Product Bet Evaluation",
      "Roadmap Prioritization",
      "Decision Support UX",
      "Next.js",
    ],
    industry: ["Product Management", "SaaS", "Decision Intelligence"],
    topics: [
      "product bet triage",
      "roadmap decision support",
      "impact confidence effort reversibility",
      "ship test hold framework",
    ],
    contentType: "Software Application",
    context:
      "Standalone product project by Isaac Vazquez that turns product-bet judgment into a transparent decision workspace.",
    summary:
      "Interactive Decision Lab for scoring product bets across impact, confidence, effort, and reversibility with a deterministic ship, test, or hold recommendation.",
    primaryFocus:
      "Product triage, decision-support interfaces, and transparent recommendation logic",
  },
});

interface DecisionLabPageProps {
  searchParams: Promise<{
    preset?: string;
    impact?: string;
    confidence?: string;
    effort?: string;
    reversibility?: string;
  }>;
}

export default async function DecisionLabPage({ searchParams }: DecisionLabPageProps) {
  const initialState = normalizeDecisionLabState(await searchParams);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Decision Lab", url: "/decision-lab" },
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
          name: "Decision Lab",
          description:
            "Interactive product-bet triage workspace that scores impact, confidence, effort, and reversibility before recommending ship, test, or hold.",
          url: "https://isaacavazquez.com/decision-lab",
          applicationCategory: "BusinessApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "product strategy",
            "decision support",
            "roadmap prioritization",
            "ship test hold",
          ],
        }}
      />
      <DecisionLabClient initialState={initialState} />
    </>
  );
}
