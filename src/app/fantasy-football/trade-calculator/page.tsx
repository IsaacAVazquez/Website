import type { Metadata } from "next";
import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { TradeCalculatorClient } from "./trade-calculator-client";

export const metadata: Metadata = constructMetadata({
  title: "Fantasy Football Trade Calculator",
  description:
    "Compare one-QB redraft trades using expert consensus, mock-draft ADP, and your league settings, with visible source dates and data limits.",
  canonicalUrl: "/fantasy-football/trade-calculator",
  dateModified: "2026-08-13",
});

const breadcrumbs = [
  { name: "Home", url: "/" },
  { name: "Fantasy Football", url: "/fantasy-football" },
  { name: "Trade Calculator", url: "/fantasy-football/trade-calculator" },
];

const directionContract = `<!--
THESIS: A fantasy trade should read like a deal desk, with both sides, the evidence, and the limits visible at once.
OWN-WORLD: The Working Instrument, using limestone paper, graphite ink, hairline rules, sharp plates, mono readouts, and one Signal Orange action color.
STORY: Set the league, build the offer, read the balance and source mix, then revise the deal without leaving the workspace.
FIRST VIEWPORT: Breadcrumb, Build a Trade Calculator, the preseason scope, league settings, both trade ledgers, and the verdict rail.
FORM: Operational deal desk derived from concept seed 3bea6a71, with a narrow settings rail, split ledger, and pinned evaluation rail.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

export default function TradeCalculatorPage() {
  return (
    <>
      <div aria-hidden="true" className="hidden" dangerouslySetInnerHTML={{ __html: directionContract }} />
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
          name: "Fantasy Football Trade Calculator",
          description:
            "A preseason one-quarterback redraft trade estimator using expert consensus, mock-draft ADP, and league settings",
          url: "https://isaacvazquez.com/fantasy-football/trade-calculator",
          applicationCategory: "Sports",
          operatingSystem: "Web Browser",
        }}
      />

      <TradeCalculatorClient />
    </>
  );
}
