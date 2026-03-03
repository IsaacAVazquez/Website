"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { Badge } from "@/components/ui/Badge";
import { IconArrowRight } from "@tabler/icons-react";
import { getFeaturedCaseStudies } from "@/constants/caseStudies";

export function FeaturedWorkSection() {
  const shouldReduceMotion = useReducedMotion();
  const featured = getFeaturedCaseStudies();

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
      className="py-16 md:py-24 bg-[var(--surface-primary)]"
      aria-label="Selected work"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="mb-10">
            <Heading level={2} className="mb-4">
              Selected Work
            </Heading>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
              Case studies demonstrating product thinking, cross-functional
              leadership, and measurable outcomes.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
          >
            {featured.map((study) => (
              <Link key={study.slug} href={study.link ?? `/portfolio/${study.slug}`}>
                <WarmCard
                  padding="lg"
                  hover
                  className="h-full group"
                >
                  <div className="space-y-4">
                    <h3 className="font-bold text-xl text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                      {study.title}
                    </h3>

                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                      {study.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {study.detailedMetrics?.slice(0, 3).map((metric) => (
                        <Badge key={metric.label} variant="outline">
                          {metric.value} {metric.label}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] pt-2">
                      Read Case Study
                      <IconArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </WarmCard>
              </Link>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="text-center">
            <ModernButton href="/portfolio" variant="outline" size="lg">
              View All Work
            </ModernButton>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
