import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { ModernHero } from "@/components/ModernHero";
import { PageSummary } from "@/components/ui/PageSummary";
import { ExpertSignalGroup } from "@/components/ui/ExpertSignal";

export const metadata: Metadata = constructMetadata();

export default function Home() {
  return (
    <main
      className="min-h-screen w-full bg-white dark:bg-[#1C1410]"
      id="main-content"
      role="main"
      aria-label="Isaac Vazquez - Technical Product Manager Portfolio"
    >
      <header>
        <ModernHero />
      </header>

      <section className="pentagram-section bg-white dark:bg-black">
        <div className="container-wide space-y-8">
          <PageSummary
            variant="featured"
            tldr="Technical product manager and UC Berkeley Haas MBA candidate. I translate QA, analytics, and stakeholder signals into clear product bets."
            summary={
              <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6 text-center shadow-sm">
                  <p className="text-neutral-800 dark:text-neutral-100 leading-relaxed">
                    I’m an MBA candidate at UC Berkeley Haas after six years in QA and product-adjacent roles. I love diagnosing messy user journeys, turning signal into roadmaps, and making sure launches actually work as promised.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6 text-center shadow-sm">
                  <p className="text-neutral-800 dark:text-neutral-100 leading-relaxed">
                    I’ve led QA and product delivery at Civitech, built ETL and reporting pipelines at Open Progress, and wrapped that execution experience with formal strategy work at Haas.
                  </p>
                </div>
              </div>
            }
            context="Based in the Bay Area • Open to product manager roles"
          />

          <ExpertSignalGroup
            title="Credentials & Expertise"
            variant="compact"
            columns={2}
            signals={[
              {
                type: "education",
                label: "UC Berkeley Haas",
                value: "MBA Candidate ’27 • Consortium Fellow • MLT Fellow",
                verified: true,
              },
              {
                type: "experience",
                label: "QA + Product Execution",
                value: "Led reliability and delivery across multi-product platforms",
              },
              {
                type: "achievement",
                label: "Results",
                value: "60M+ users reached • 56% NPS lift • 90% drop in critical defects",
              },
              {
                type: "expertise",
                label: "Toolbox",
                value: "User research, roadmap prioritization, SQL, automation, stakeholder comms",
              },
            ]}
          />
        </div>
      </section>

      <StructuredData type="ProfilePage" />
    </main>
  );
}
