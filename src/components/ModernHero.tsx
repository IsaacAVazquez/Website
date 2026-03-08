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
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <section
      className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden py-16 md:py-24 bg-[var(--surface-primary)]"
      aria-label="Isaac Vazquez - Technical Product Manager and UC Berkeley Haas MBA Candidate"
    >
      <motion.div
        className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-center">
          <div className="space-y-6 lg:space-y-8">
            <motion.div variants={itemVariants}>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.05]">
                Isaac Vazquez
              </h1>
              <p className="text-xl sm:text-2xl text-[var(--text-secondary)] mt-4 font-medium">
                Product Manager | MBA Candidate | Builder
              
    </p>          </motion.div>



            <motion.p
              variants={itemVariants}
              className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl"
            >
              I build mission-driven products that balance user insight, data, and disciplined
              execution. My path from QA engineering to product management gives me a rare ability
              to own quality end-to-end — from discovery through delivery.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-4 pt-2"
            >
              <ModernButton href="/portfolio" variant="accent" size="lg">
                View My Work
              </ModernButton>
              <ModernButton href="/about" variant="outline" size="lg">
                Learn More
              </ModernButton>
            </motion.div>
          </div>

          <motion.div
            variants={itemVariants}
            className="relative order-first lg:order-last"
          >
            <div className="relative aspect-[4/5] lg:aspect-square overflow-hidden rounded-2xl border border-[var(--border-primary)] shadow-lg">
              <Image
                src="/images/headshot-new.png"
                alt="Isaac Vazquez - Technical Product Manager and UC Berkeley Haas MBA Candidate"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover object-top"
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
