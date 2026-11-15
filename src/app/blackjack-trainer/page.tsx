import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { BlackjackTrainerClient } from "./blackjack-trainer-client";

const DESCRIPTION =
  "A blackjack basic strategy trainer that deals hands, grades every decision against the chart for the table's rules, and drills card counting. Progress is saved locally in your browser.";

export const metadata = constructMetadata({
  title: "Blackjack Trainer",
  description: DESCRIPTION,
  canonicalUrl: "/blackjack-trainer",
  dateModified: "2026-11-10",
});

export default function BlackjackTrainerPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Blackjack Trainer", url: "/blackjack-trainer" },
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
          name: "Blackjack Trainer",
          description: DESCRIPTION,
          url: "https://isaacvazquez.com/blackjack-trainer",
          applicationCategory: "GameApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "blackjack trainer",
            "blackjack basic strategy",
            "basic strategy chart",
            "card counting practice",
            "Hi-Lo count",
          ],
        }}
      />
      <BlackjackTrainerClient />
    </>
  );
}
