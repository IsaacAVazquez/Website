"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ModernButton } from "@/components/ui/ModernButton";

const heroSignals = [
  {
    label: "Scale",
    value: "60M+",
    detail: "users supported across civic-tech platforms",
  },
  {
    label: "Focus",
    value: "QA → PM",
    detail: "bridging reliability, analytics, and execution",
  },
  {
    label: "Current",
    value: "Haas MBA",
    detail: "UC Berkeley, Class of 2027",
  },
];

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
      className="relative overflow-hidden bg-[var(--surface-primary)] py-12 md:py-16 lg:py-20"
      aria-label="Isaac Vazquez - product manager portfolio"
      data-testid="hero"
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b to-transparent"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent)",
          }}
        />
        <div
          className="absolute -left-24 top-24 h-72 w-72 rounded-full blur-3xl"
          style={{
            background: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
          }}
        />
      </div>

      <motion.div
        className="page-shell relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="section-panel overflow-hidden px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
          <div className="grid items-start gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
            <div className="space-y-7">
              <motion.div variants={itemVariants} className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="section-kicker">Product manager portfolio</span>
                  <span className="inline-flex items-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
                    Berkeley, CA · UC Berkeley Haas MBA Candidate
                  </span>
                </div>

                <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl lg:leading-[1.03]">
                  Building thoughtful products with a foundation in QA, analytics,
                  and execution.
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg md:text-xl">
                  I work across product strategy, research, and delivery, with
                  experience spanning high-scale SaaS platforms, analytics-heavy
                  workflows, and investment research tools built for clearer
                  decisions.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
                <ModernButton href="/portfolio" variant="accent" size="lg">
                  View projects
                </ModernButton>
                <ModernButton href="/about" variant="outline" size="lg">
                  Learn more
                </ModernButton>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="grid gap-3 sm:grid-cols-3"
              >
                {heroSignals.map((signal) => (
                  <div key={signal.label} className="surface-muted px-4 py-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      {signal.label}
                    </p>
                    <p className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                      {signal.value}
                    </p>
                    <p className="mb-0 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {signal.detail}
                    </p>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="relative lg:pt-2">
              <div className="mx-auto max-w-sm">
                <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-lg)]">
                  <div
                    className="absolute inset-x-10 top-4 h-20 rounded-full blur-3xl"
                    style={{
                      background:
                        "color-mix(in srgb, var(--color-primary) 14%, transparent)",
                    }}
                  />
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] border border-[var(--border-primary)] bg-[var(--surface-secondary)]">
                    <Image
                      src="/images/headshot-new.png"
                      alt="Isaac Vazquez - Technical Product Manager and UC Berkeley Haas MBA Candidate"
                      fill
                      priority
                      sizes="(min-width: 1024px) 34vw, (min-width: 640px) 70vw, 82vw"
                      className="object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
