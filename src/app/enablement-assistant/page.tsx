import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { EnablementAssistantClient } from "./enablement-assistant-client";

export const metadata = constructMetadata({
  title: "Automation Enablement Assistant",
  description:
    "Interactive platform enablement tool that recommends a standard test stack, builds an onboarding plan, answers setup questions, and tracks documentation gaps.",
  canonicalUrl: "/enablement-assistant",
  dateModified: "2026-07-30",
});

export default function EnablementAssistantPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Automation Enablement Assistant", url: "/enablement-assistant" },
  ];

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (generateBreadcrumbStructuredData(breadcrumbs) as {
            itemListElement: object[];
          }).itemListElement,
        }}
      />
      <StructuredData
        type="SoftwareApplication"
        data={{
          name: "Automation Enablement Assistant",
          description:
            "Deterministic internal platform enablement demo for test automation recommendations, onboarding plans, troubleshooting retrieval, escalation handoffs, and program reporting.",
          url: "https://isaacvazquez.com/enablement-assistant",
          applicationCategory: "BusinessApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "platform enablement",
            "test automation",
            "quality engineering",
            "developer tooling",
            "onboarding assistant",
          ],
        }}
      />
      <EnablementAssistantClient />
    </>
  );
}
