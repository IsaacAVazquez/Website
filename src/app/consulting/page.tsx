import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { ConsultingContent } from "@/components/ConsultingContent";
import type { ConsultingService } from "@/components/ConsultingContent";

export const metadata = constructMetadata({
  title: "Consulting",
  description:
    "Product strategy and technical advisory that blends QA depth, product leadership, and Berkeley Haas insight.",
  canonicalUrl: "/consulting",
});

const services: ConsultingService[] = [
  {
    title: "Product Strategy & Roadmaps",
    description:
      "Clarify who you're serving, align on the bets that matter, and turn strategy into a roadmap the whole org can rally behind.",
    icon: "🧭",
  },
  {
    title: "Technical Product Management",
    description:
      "Translate technical constraints into clear tradeoffs, keep stakeholders aligned, and make sure we're shipping what users actually need.",
    icon: "🔌",
  },
  {
    title: "Quality & Process Optimization",
    description:
      "Bring quality upstream with testing strategies, automation, and rituals that bake reliability into the build—not bolted on later.",
    icon: "🛠️",
  },
];

export default function ConsultingPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Consulting", url: "/consulting" },
  ];

  return (
    <>
      {/* Breadcrumb Structured Data */}
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (generateBreadcrumbStructuredData(breadcrumbs) as any).itemListElement,
        }}
      />

      {/* Service Schema */}
      <StructuredData
        type="ProfessionalService"
        data={{
          name: "Isaac Vazquez Consulting",
          description:
            "Product strategy and technical advisory services blending QA expertise with MBA-level business strategy.",
          areaServed: ["Austin, TX", "San Francisco, CA", "New York, NY", "Remote"],
          serviceType: services.map((service) => service.title),
          provider: {
            "@type": "Person",
            name: "Isaac Vazquez",
            jobTitle: "Product Strategist & MBA Candidate",
            email: "isaacavazquez95@gmail.com",
            url: "https://isaacavazquez.com",
          },
        }}
      />

      <div className="min-h-screen w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#FFFCF7] dark:bg-gradient-to-br dark:from-[#1C1410] dark:via-[#2D1B12] dark:to-[#1C1410]">
        <ConsultingContent services={services} />
      </div>
    </>
  );
}
