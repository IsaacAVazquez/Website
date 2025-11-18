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
      className="relative min-h-screen flex items-center overflow-hidden bg-white dark:bg-[#111111]"
      role="main"
      aria-label="Isaac Vazquez - Technical Product Manager and UC Berkeley Haas MBA Candidate"
    >
      {/* Subtle editorial accent - very minimal */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(at 20% 30%, rgba(255, 59, 48, 0.1) 0px, transparent 50%), radial-gradient(at 80% 70%, rgba(0, 0, 0, 0.03) 0px, transparent 50%)'
        }}
      />

      <motion.div
        className="relative z-10 w-full container-wide pentagram-section"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left-anchored bold editorial layout */}
        <div className="max-w-[90rem] mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20 items-start">

          {/* Left Column - Bold Typography */}
          <div className="space-y-10 lg:space-y-12">
            {/* Oversized Editorial Heading */}
            <motion.div variants={itemVariants}>
              <h1 className="editorial-heading text-[#111111] dark:text-[#FAFAFA]">
                Isaac Vazquez
              </h1>
              <p className="editorial-subheading text-[#FF3B30] dark:text-[#FF5247] mt-4">
                Technical Product Manager & UC Berkeley Haas MBA Candidate
              </p>
            </motion.div>

            {/* Divider */}
            <motion.div
              variants={itemVariants}
              className="w-20 h-[2px] bg-[#FF3B30] dark:bg-[#FF5247]"
              aria-hidden="true"
            />

            {/* Editorial Body Copy */}
            <motion.p
              variants={itemVariants}
              className="editorial-body text-[#525252] dark:text-[#A3A3A3]"
            >
              Bay Area-based and pursuing my MBA full-time at UC Berkeley Haas, I build mission-driven products that
              balance user insight, data, and disciplined execution. I move comfortably between product discovery,
              analytics, and release quality—then pull the right stakeholders along for the ride.
            </motion.p>

            <motion.p
              variants={itemVariants}
              className="editorial-body text-[#525252] dark:text-[#A3A3A3]"
            >
              Haas is sharpening that toolkit, and I'm applying it to every roadmap, experiment, and delivery sprint I touch.
            </motion.p>

            {/* Clean CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-4 pt-4"
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

          {/* Right Column - High-impact Image */}
          <motion.div
            variants={itemVariants}
            className="relative order-first lg:order-last"
          >
            {/* Premium Image Block */}
            <div className="pentagram-image-wrapper pentagram-aspect-portrait lg:pentagram-aspect-square rounded-sm overflow-hidden border border-black/[0.08] dark:border-white/[0.1]">
              <Image
                src="/images/headshot-new.jpg"
                alt="Isaac Vazquez - Technical Product Manager and UC Berkeley Haas MBA Candidate"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover object-top"
              />
            </div>

            {/* Editorial Caption */}
            <p className="editorial-caption mt-4 text-[#737373] dark:text-[#737373]">
              Isaac Vazquez, MBA Candidate at UC Berkeley Haas School of Business
            </p>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
}
