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
        duration: shouldReduceMotion ? 0 : 0.6,
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
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
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      role="main"
      aria-label="Isaac Vazquez - Technical Product Manager and UC Berkeley Haas MBA Candidate"
    >
      {/* Warm gradient mesh background */}
      <div className="absolute inset-0 gradient-mesh-warm opacity-60" aria-hidden="true" />

      <motion.div
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Title / Subtitle */}
        <motion.h1
          variants={itemVariants}
          className="text-display-xl md:text-display-xxl font-black leading-none gradient-text-warm mb-6 display-heading"
        >
          Isaac
          <br />
          Vazquez
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-2xl sm:text-3xl md:text-4xl text-[#4A3426] dark:text-[#FFD666] max-w-3xl mb-10 font-semibold"
        >
          Technical Product Manager & UC Berkeley Haas MBA Candidate
        </motion.p>

        {/* Text + Photo (aligned) */}
<motion.div
  variants={itemVariants}
  className="
    grid grid-cols-1 md:grid-cols-[1fr_auto]
    items-center gap-12 md:gap-16
    mb-12 md:mb-20 max-w-6xl
  "
>
  {/* Left: text */}
  <div className="max-w-[600px]">
    <p className="text-base sm:text-lg md:text-xl text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
      Bay Area-based and pursuing my MBA full-time at UC Berkeley Haas, I build mission-driven products that
      balance user insight, data, and disciplined execution. I move comfortably between product discovery,
      analytics, and release quality—then pull the right stakeholders along for the ride. Haas is sharpening
      that toolkit, and I'm applying it to every roadmap, experiment, and delivery sprint I touch.
    </p>
  </div>

  {/* Right: optimized headshot */}
  <motion.div
    variants={itemVariants}
    className="
      relative justify-self-center md:justify-self-end
      w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72
      rounded-2xl overflow-hidden border-[3px] border-[#FFE4D6] dark:border-[#FF8E53]/30 shadow-warm-xl
      shrink-0
    "
  >
    <Image
      src="/images/headshot-new.jpg"
      alt="Isaac Vazquez - Technical Product Manager and UC Berkeley Haas MBA Candidate"
      fill
      priority
      sizes="(min-width: 768px) 18rem, (min-width: 640px) 16rem, 14rem"
      className="object-cover object-top rounded-2xl"
    />
  </motion.div>
</motion.div>



        {/* CTAs */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mb-6">
          <Link href="/resume">
            <ModernButton variant="primary" size="lg" fullWidth>
              Resume
            </ModernButton>
          </Link>
          <Link href="/contact">
            <ModernButton variant="outline" size="lg" fullWidth>
              Get In Touch
            </ModernButton>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
