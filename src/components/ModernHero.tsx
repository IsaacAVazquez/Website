"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
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
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.7,
        ease: [0.25, 0.46, 0.45, 0.94]
      },
    },
  };

  return (
    <section
      className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden bg-white dark:bg-black py-16 md:py-20"
      role="main"
      aria-label="Isaac Vazquez - Technical Product Manager and UC Berkeley Haas MBA Candidate"
    >
      {/* Ultra-subtle monochrome accent - Mouthwash style */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(at 20% 30%, rgba(0, 0, 0, 0.03) 0px, transparent 50%), radial-gradient(at 80% 70%, rgba(0, 0, 0, 0.02) 0px, transparent 50%)'
        }}
      />

      <motion.div
        className="relative z-10 w-full container-wide"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Mouthwash Studio layout - generous whitespace */}
        <div className="max-w-[90rem] mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 items-start">

          {/* Left Column - Bold Monochrome Typography */}
          <div className="space-y-6 lg:space-y-8">
            {/* Oversized Grotesk Heading - Pure Black */}
            <motion.div variants={itemVariants}>
              <h1 className="editorial-heading text-black dark:text-white">
                Isaac Vazquez
              </h1>
              <p className="editorial-subheading text-neutral-500 dark:text-neutral-400 mt-3">
                Technical Product Manager & UC Berkeley Haas MBA Candidate
              </p>
            </motion.div>

            {/* Thin Monochrome Divider */}
            <motion.div
              variants={itemVariants}
              className="w-16 h-px bg-neutral-900 dark:bg-neutral-50"
              aria-hidden="true"
            />

            {/* Editorial Body Copy - Monochrome */}
            <motion.p
              variants={itemVariants}
              className="editorial-body text-neutral-600 dark:text-neutral-300"
            >
              Bay Area-based and pursuing my MBA full-time at UC Berkeley Haas, I build mission-driven products that
              balance user insight, data, and disciplined execution. I move comfortably between product discovery,
              analytics, and release quality—then pull the right stakeholders along for the ride.
            </motion.p>

            <motion.p
              variants={itemVariants}
              className="editorial-body text-neutral-600 dark:text-neutral-300"
            >
              Haas is sharpening that toolkit, and I'm applying it to every roadmap, experiment, and delivery sprint I touch.
            </motion.p>

            {/* Minimal Monochrome CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-4 pt-2"
            >
              <Link href="/resume">
                <ModernButton variant="primary" size="lg">
                  View Resume
                </ModernButton>
              </Link>
              <Link href="/contact">
                <ModernButton variant="outline" size="lg">
                  Get In Touch
                </ModernButton>
              </Link>
            </motion.div>
          </div>

          {/* Right Column - Clean Image Block */}
          <motion.div
            variants={itemVariants}
            className="relative order-first lg:order-last"
          >
            {/* Mouthwash Studio Image Block - thin border */}
            <div className="pentagram-image-wrapper pentagram-aspect-portrait lg:pentagram-aspect-square overflow-hidden border border-neutral-200 dark:border-neutral-600">
              <Image
                src="/images/headshot-new.png"
                alt="Isaac Vazquez - Technical Product Manager and UC Berkeley Haas MBA Candidate"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover object-top"
              />
            </div>

            {/* Minimal Caption - Mid Grey */}
            <p className="editorial-caption mt-3 text-neutral-500 dark:text-neutral-400">
              Isaac Vazquez, MBA Candidate at UC Berkeley Haas School of Business
            </p>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
}
