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
      className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden py-16 md:py-20"
      style={{ backgroundColor: 'var(--surface-primary)' }}
      role="main"
      aria-label="Isaac Vazquez - Technical Product Manager and UC Berkeley Haas MBA Candidate"
    >
      <motion.div
        className="relative z-10 w-full container-wide"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-[90rem] mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 items-start">

          {/* Left Column */}
          <div className="space-y-6 lg:space-y-8">
            <motion.div variants={itemVariants}>
              <h1
                className="editorial-heading"
                style={{ color: "var(--text-primary)" }}
              >
                Isaac Vazquez
              </h1>
              <p
                className="editorial-subheading mt-3"
                style={{ color: "var(--text-tertiary)" }}
              >
                Product Manager | MBA Candidate | Builder
              </p>
              <p
                className="text-sm mt-2 font-mono"
                style={{ color: "var(--text-tertiary)" }}
              >
                Bay Area • 5+ years in Product & QA
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="w-16 h-px"
              style={{ backgroundColor: "var(--text-primary)" }}
              aria-hidden="true"
            />

            <motion.p
              variants={itemVariants}
              className="editorial-body"
              style={{ color: "var(--text-secondary)" }}
            >
              I build mission-driven products that balance user insight, data, and disciplined execution—moving
              comfortably between discovery, analytics, and delivery. Currently sharpening my strategic toolkit
              at UC Berkeley Haas while applying it to every roadmap and sprint I touch.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-4 pt-2"
            >
              <Link href="/#contact">
                <ModernButton variant="primary" size="lg">
                  Get In Touch
                </ModernButton>
              </Link>
              <Link href="/#about">
                <ModernButton variant="outline" size="lg">
                  Learn More
                </ModernButton>
              </Link>
            </motion.div>
          </div>

          {/* Right Column - Image */}
          <motion.div
            variants={itemVariants}
            className="relative order-first lg:order-last"
          >
            <div
              className="pentagram-image-wrapper pentagram-aspect-portrait lg:pentagram-aspect-square overflow-hidden border"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <Image
                src="/images/headshot-new.png"
                alt="Isaac Vazquez - Technical Product Manager and UC Berkeley Haas MBA Candidate"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover object-top"
              />
            </div>

            <p
              className="editorial-caption mt-3"
              style={{ color: "var(--text-tertiary)" }}
            >
              Isaac Vazquez, MBA Candidate at UC Berkeley Haas School of Business
            </p>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
}
