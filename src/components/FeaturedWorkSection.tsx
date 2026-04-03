"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ModernButton } from "@/components/ui/ModernButton";
import { getHomepageFeaturedCaseStudies } from "@/constants/caseStudies";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { PortfolioProjectCard } from "@/components/PortfolioProjectCard";

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
          <motion.div variants={itemVariants} className="mb-8 lg:mb-10">
            <SectionIntro
              headingLevel={2}
              title="Selected Projects"
              description="A quick scan of platform, analytics, and product work with clear role, scope, and outcomes."
              titleClassName="text-3xl leading-[1.05] sm:text-4xl lg:text-[2.9rem]"
              descriptionClassName="max-w-2xl text-base lg:text-lg"
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mb-10 grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {featured.map((study) => (
              <PortfolioProjectCard key={study.slug} study={study} />
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
