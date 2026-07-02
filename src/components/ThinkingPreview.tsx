import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import {
  Search,
  Target,
  ChartBar,
  Database,
} from "@/components/ui/ServerIcons";
import { SectionIntro } from "@/components/ui/SectionIntro";

const pillars = [
  {
    icon: Search,
    title: "Discovery & Research",
    description:
      "I start with users, context, and the problem itself before jumping into solutions.",
  },
  {
    icon: Database,
    title: "Data-Informed Decisions",
    description:
      "I use data to sharpen judgment, validate assumptions, and understand whether the work is moving the right metrics.",
  },
  {
    icon: Target,
    title: "Strategy & Prioritization",
    description:
      "I care about choosing the right problems, narrowing scope thoughtfully, and helping teams stay aligned on outcomes.",
  },
  {
    icon: ChartBar,
    title: "Execution & Measurement",
    description:
      "I like building simple feedback loops so teams can ship, learn, and improve without losing sight of the bigger goal.",
  },
];

export function ThinkingPreview() {
  return (
    <section
      className="page-section bg-[var(--home-paper-alt)]"
      aria-label="How I think about product"
    >
      <div className="page-shell">
        <div>
          <div className="mb-10">
            <SectionIntro
              eyebrow="How I think"
              headingLevel={2}
              title="How I work through ambiguous product problems."
              description="The through-line is consistent: get specific about the problem, use evidence without overfitting to it, and keep execution tied to outcomes people can actually feel."
              actions={
                <ModernButton href="/writing" variant="ghost" size="md">
                  Browse writing
                </ModernButton>
              }
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar) => (
              <WarmCard key={pillar.title} padding="lg" className="h-full">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-2xl)] bg-[var(--home-paper-alt)] text-[var(--home-signal)]">
                  <pillar.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-lg font-bold text-[var(--home-ink)]">
                  {pillar.title}
                </h3>
                <p className="mb-0 text-[var(--home-ink-muted)]">
                  {pillar.description}
                </p>
              </WarmCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
