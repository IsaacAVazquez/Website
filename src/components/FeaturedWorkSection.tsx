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
              title="A few projects across analytics, research, and platform work."
              description="These examples show the kinds of problems I like working on, from high-scale systems to data and investment research experiences."
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10"
          >
            {featured.map((study) => (
              <Link key={study.slug} href={study.link ?? `/portfolio/${study.slug}`}>
                <WarmCard
                  padding="lg"
                  hover
                  className="h-full group border-[var(--border-primary)] bg-[var(--surface-elevated)] shadow-sm"
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="section-kicker">Project</span>
                      <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                        {study.timeline}
                      </span>
                    </div>

                    <h3 className="font-bold text-xl text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                      {study.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                      {study.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {study.detailedMetrics?.slice(0, 3).map((metric) => (
                        <Badge key={metric.label} variant="outline">
                          {metric.value} {metric.label}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-[var(--border-primary)] pt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                        {study.metrics}
                      </p>
                      <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]">
                        View project
                        <IconArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </WarmCard>
              </Link>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              A broader set of product and analytics work lives in the projects section.
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
