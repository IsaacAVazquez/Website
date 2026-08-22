import type { Metadata } from "next";
import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { fantasySnapshotRevision } from "@/data/fantasySnapshotRevision.generated";
import { TradeCalculatorClient } from "./trade-calculator-client";

export const metadata: Metadata = constructMetadata({
  title: "Fantasy Football Trade Calculator",
  description:
    "Compare one-QB redraft trades using expert consensus, mock-draft ADP, and your league settings, with visible source dates and data limits.",
  canonicalUrl: "/fantasy-football/trade-calculator",
  image: "/fantasy-football/trade-calculator/opengraph-image",
  dateModified: fantasySnapshotRevision.slice(0, 10),
});

const breadcrumbs = [
  { name: "Home", url: "/" },
  { name: "Fantasy Football", url: "/fantasy-football" },
  { name: "Trade Calculator", url: "/fantasy-football/trade-calculator" },
];

export default function TradeCalculatorPage() {
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
