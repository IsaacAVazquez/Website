"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { IconSearch, IconTarget, IconChartBar, IconDatabase } from "@tabler/icons-react";

const pillars = [
  {
    icon: IconSearch,
    title: "Discovery & Research",
    description:
      "I start with users. Research, interviews, and data define the problem before solutions.",
  },
  {
    icon: IconDatabase,
    title: "Data-Driven Decisions",
    description:
      "Quantitative insights guide every call. I instrument, analyze, and let the numbers sharpen intuition.",
  },
  {
    icon: IconTarget,
    title: "Strategy & Prioritization",
    description:
      "Every feature is a bet. I use frameworks to stack-rank ruthlessly and align stakeholders.",
  },
  {
    icon: IconChartBar,
    title: "Execution & Measurement",
    description:
      "Ship, measure, learn. I define the north star metric and build feedback loops.",
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
      className="py-16 md:py-24 bg-[var(--surface-secondary)]"
      aria-label="How I think about product"
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
              How I Think About Product
            </Heading>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {pillars.map((pillar) => (
              <WarmCard key={pillar.title} padding="lg">
                <pillar.icon className="h-8 w-8 text-[var(--color-primary)] mb-4" />
                <h3 className="font-bold text-lg mb-3 text-[var(--text-primary)]">
                  {pillar.title}
                </h3>
                <p className="text-[var(--text-secondary)]">
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
