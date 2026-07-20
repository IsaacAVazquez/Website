import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { DecisionLabClient } from "./decision-lab-client";
import { normalizeDecisionLabState } from "./decision-lab-state";

export const metadata = constructMetadata({
  title: "Decision Lab",
  description:
    "Product-bet triage tool for scoring impact, confidence, effort, and reversibility before calling ship, test, or hold.",
  canonicalUrl: "/decision-lab",
  dateModified: "2026-04-17",
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
