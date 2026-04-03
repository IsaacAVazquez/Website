"use client";

import { motion, useReducedMotion } from "framer-motion";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import {
  IconSearch,
  IconTarget,
  IconChartBar,
  IconDatabase,
} from "@tabler/icons-react";
import { SectionIntro } from "@/components/ui/SectionIntro";

const pillars = [
  {
    icon: IconSearch,
    title: "Discovery & Research",
    description:
      "I start with users, context, and the problem itself before jumping into solutions.",
  },
  {
    icon: IconDatabase,
    title: "Data-Informed Decisions",
    description:
      "I use data to sharpen judgment, validate assumptions, and understand whether the work is moving the right metrics.",
  },
  {
    icon: IconTarget,
    title: "Strategy & Prioritization",
    description:
      "I care about choosing the right problems, narrowing scope thoughtfully, and helping teams stay aligned on outcomes.",
  },
  {
    icon: IconChartBar,
    title: "Execution & Measurement",
    description:
      "I like building simple feedback loops so teams can ship, learn, and improve without losing sight of the bigger goal.",
  },
];

export function ThinkingPreview() {
  const shouldReduceMotion = useReducedMotion();

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
      className="page-section bg-[var(--surface-secondary)]"
      aria-label="How I think about product"
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
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {pillars.map((pillar) => (
              <WarmCard key={pillar.title} padding="lg" className="h-full">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--color-primary)]">
                  <pillar.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-lg font-bold text-[var(--text-primary)]">
                  {pillar.title}
                </h3>
                <p className="mb-0 text-[var(--text-secondary)]">
                  {pillar.description}
                </p>
              </WarmCard>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
