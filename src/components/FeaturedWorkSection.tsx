"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { Badge } from "@/components/ui/Badge";
import { IconArrowRight } from "@tabler/icons-react";
import { getHomepageFeaturedCaseStudies } from "@/constants/caseStudies";
import { SectionIntro } from "@/components/ui/SectionIntro";

export function FeaturedWorkSection() {
  const shouldReduceMotion = useReducedMotion();
  const featured = getHomepageFeaturedCaseStudies();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.5 },
    },
  };

  return (
    <section
      className="page-section bg-[var(--surface-primary)]"
      aria-label="Projects"
    >
      <div className="page-shell">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="mb-10">
            <SectionIntro
              eyebrow="Projects"
              headingLevel={2}
              title="Selected work built around hard tradeoffs and measurable outcomes."
              description="A quick scan of the portfolio: platform scale, decision support, and analytics-heavy products where the role, problem space, and outcome are easy to see."
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mb-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {featured.map((study) => (
              <Link
                key={study.slug}
                href={study.link ?? `/portfolio/${study.slug}`}
                className="group block h-full"
              >
                <WarmCard padding="none" hover className="h-full overflow-hidden">
                  <div className="space-y-5 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <span className="section-kicker">Project</span>
                      <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                        {study.timeline}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-[var(--text-primary)] transition-colors group-hover:text-[var(--color-primary)]">
                        {study.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                        {study.overview.summary || study.description}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="surface-muted px-4 py-3">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                          Role
                        </p>
                        <p className="mb-0 text-sm leading-relaxed text-[var(--text-primary)]">
                          {study.role}
                        </p>
                      </div>
                      <div className="surface-muted px-4 py-3">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                          Outcome
                        </p>
                        <p className="mb-0 text-sm leading-relaxed text-[var(--text-primary)]">
                          {study.metrics}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(study.detailedMetrics?.slice(0, 2) ?? []).map((metric) => (
                        <Badge key={metric.label} variant="outline">
                          {metric.value} {metric.label}
                        </Badge>
                      ))}
                    </div>

                    <div className="border-t border-[var(--border-primary)] pt-4">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                        Problem space
                      </p>
                      <p className="mb-0 text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-2">
                        {study.problem.context}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-[var(--border-primary)] pt-4">
                      <p className="mb-0 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                        {study.tools.slice(0, 2).join(" · ")}
                      </p>
                      <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]">
                        View project
                        <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </WarmCard>
              </Link>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              A broader set of product and analytics work lives in the projects section, with full case-study context and project details.
            </p>
            <ModernButton href="/portfolio" variant="outline" size="lg">
              View all projects
            </ModernButton>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
