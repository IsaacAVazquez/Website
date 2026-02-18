import { Metadata } from "next";
import Link from "next/link";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { IconArrowRight, IconExternalLink } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Portfolio | Isaac Vazquez",
  description: "Case studies showcasing product management expertise through strategic thinking, cross-functional leadership, and measurable business outcomes.",
};

interface CaseStudy {
  slug: string;
  title: string;
  description: string;
  role: string;
  timeline: string;
  tools: string[];
  metrics: string;
  thumbnail?: string;
  featured?: boolean;
}

const caseStudies: CaseStudy[] = [
  {
    slug: "civic-engagement-platform",
    title: "Civic Engagement Platform",
    description: "Built a scalable QA framework for voter outreach tools reaching 60M+ voters during the 2022 midterm elections.",
    role: "QA Lead & Product Contributor",
    timeline: "8 months (2022)",
    tools: ["Cypress", "Jest", "React", "Node.js"],
    metrics: "99.9% uptime • 30% faster releases",
    featured: true,
  },
  {
    slug: "test-automation-suite",
    title: "Test Automation Suite",
    description: "Led design and implementation of unified automation framework enabling same-day validation across 5 different tech stacks.",
    role: "Automation Architect",
    timeline: "6 months (2023)",
    tools: ["Selenium", "Python", "Docker", "CI/CD"],
    metrics: "50% defect reduction • 300% ROI",
    featured: true,
  },
  {
    slug: "data-analytics-dashboard",
    title: "Data Analytics Dashboard",
    description: "Designed and launched interactive performance dashboards transforming client reporting from manual Excel exports to automated, real-time insights.",
    role: "Product Manager & Data Lead",
    timeline: "4 months (2020-2021)",
    tools: ["SQL", "Tableau", "Python", "APIs"],
    metrics: "40% faster decisions • 25% conversion lift",
    featured: true,
  },
  {
    slug: "api-testing-framework",
    title: "API Testing Framework",
    description: "Architected comprehensive API testing suite catching 95% of integration issues pre-production.",
    role: "QA Engineer",
    timeline: "3 months (2023)",
    tools: ["Postman", "JMeter", "JavaScript", "CI/CD"],
    metrics: "95% defect detection • 45% faster releases",
  },
  {
    slug: "performance-monitoring",
    title: "Performance Monitoring",
    description: "Launched real-time performance monitoring system reducing page load times by 60% and preventing outages.",
    role: "Performance Engineer",
    timeline: "4 months (2022-2023)",
    tools: ["New Relic", "Grafana", "JMeter"],
    metrics: "60% faster load times • 99.95% uptime",
  },
];

export default function PortfolioPage() {
  const featuredCaseStudies = caseStudies.filter((cs) => cs.featured);
  const otherCaseStudies = caseStudies.filter((cs) => !cs.featured);

  return (
    <main className="min-h-screen bg-white dark:bg-black py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <Heading level={1} className="mb-6">
            Portfolio
          </Heading>
          <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-3xl">
            Case studies showcasing product management expertise through strategic thinking,
            cross-functional leadership, and measurable business outcomes. Each follows the
            Problem-Process-Result framework.
          </p>
        </div>

        {featuredCaseStudies.length > 0 && (
          <div className="mb-20">
            <h2 className="text-2xl font-bold mb-8 text-neutral-900 dark:text-neutral-100">
              Featured Work
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCaseStudies.map((study) => (
                <Link key={study.slug} href={`/portfolio/${study.slug}`}>
                  <WarmCard
                    padding="none"
                    hover={true}
                    className="h-full border border-neutral-200 dark:border-neutral-700 overflow-hidden group"
                  >
                    {study.thumbnail && (
                      <div className="aspect-video bg-neutral-100 dark:bg-neutral-800" />
                    )}

                    <div className="p-6 space-y-4">
                      <h3 className="font-bold text-xl text-neutral-900 dark:text-neutral-100 group-hover:text-[var(--color-primary)] transition-colors">
                        {study.title}
                      </h3>

                      <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">
                        {study.description}
                      </p>

                      <div className="space-y-1">
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
                          Role: {study.role}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-600">
                          {study.timeline}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {study.tools.slice(0, 3).map((tool) => (
                          <span
                            key={tool}
                            className="px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                          >
                            {tool}
                          </span>
                        ))}
                        {study.tools.length > 3 && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            +{study.tools.length - 3}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-[var(--color-primary)]">
                        {study.metrics}
                      </p>

                      <div className="flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-[var(--color-primary)] transition-colors pt-2">
                        View Case Study
                        <IconArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </WarmCard>
                </Link>
              ))}
            </div>
          </div>
        )}

        {otherCaseStudies.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-8 text-neutral-900 dark:text-neutral-100">
              More Work
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {otherCaseStudies.map((study) => (
                <Link key={study.slug} href={`/portfolio/${study.slug}`}>
                  <WarmCard
                    padding="lg"
                    hover={true}
                    className="h-full border border-neutral-200 dark:border-neutral-700 group"
                  >
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 group-hover:text-[var(--color-primary)] transition-colors">
                        {study.title}
                      </h3>

                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {study.description}
                      </p>

                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
                        {study.role} • {study.timeline}
                      </p>

                      <p className="text-xs font-semibold text-[var(--color-primary)]">
                        {study.metrics}
                      </p>

                      <div className="flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-[var(--color-primary)] transition-colors pt-2">
                        View Case Study
                        <IconArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </WarmCard>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-20 text-center">
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
            Interested in working together?
          </p>
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-warning)] transition-colors"
          >
            Get In Touch
            <IconExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
