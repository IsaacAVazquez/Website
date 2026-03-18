"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ModernButton } from "@/components/ui/ModernButton";

export function ModernHero() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.8,
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.55,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <section
      className="relative overflow-hidden bg-[var(--surface-primary)] py-16 md:py-20 lg:py-24"
      aria-label="Isaac Vazquez - product manager portfolio"
      data-testid="hero"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b to-transparent"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent)",
          }}
        />
      </div>

      <motion.div
        className="page-shell relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <div className="space-y-7">
            <motion.div variants={itemVariants} className="space-y-5">
              <span className="section-kicker">Product manager portfolio</span>
              <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-[var(--text-primary)] sm:text-6xl lg:text-7xl lg:leading-[1.04]">
                Building thoughtful products with a foundation in QA, analytics,
                and execution.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)] md:text-xl">
                I work across product strategy, research, and delivery, with
                experience spanning high-scale SaaS platforms, analytics projects,
                and investment research tools.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
              <ModernButton href="/portfolio" variant="accent" size="lg">
                View projects
              </ModernButton>
              <ModernButton href="/about" variant="outline" size="lg">
                Learn more
              </ModernButton>
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="relative order-first lg:order-last">
            <div className="section-panel relative overflow-hidden p-4 sm:p-5">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] border border-[var(--border-primary)] shadow-lg">
                <Image
                  src="/images/headshot-new.png"
                  alt="Isaac Vazquez - Technical Product Manager and UC Berkeley Haas MBA Candidate"
                  fill
                  priority
                  sizes="(min-width: 1024px) 38vw, 100vw"
                  className="object-cover object-top"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
