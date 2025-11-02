"use client";
import { Heading } from "@/components/ui/Heading";
import { FaLinkedin, FaEnvelope } from "react-icons/fa";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { motion } from "framer-motion";

export function ContactContent() {
  return (
    <div className="min-h-screen py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 max-w-4xl mx-auto"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text-warm mb-4 display-heading">
          Let's Work Together
        </h1>
        <p className="text-lg md:text-xl text-[#4A3426] dark:text-[#D4A88E]">
          Open to product roles, advisory projects, and honest conversations about building meaningful products
        </p>
      </motion.div>

      <div className="flex flex-col items-center max-w-5xl mx-auto space-y-8">
        {/* Primary CTA Card */}
        <WarmCard hover={false} padding="xl" className="text-center w-full">
          <span className="text-5xl mb-4 block" aria-hidden="true">🚀</span>
          <Heading level={2} className="font-bold mb-4 text-3xl text-[#FF6B35]">
            Ready to Connect?
          </Heading>
          <p className="mb-6 max-w-2xl mx-auto text-base md:text-lg text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
            I'm looking for product management roles where I can pair my QA roots with the strategy work I'm doing at Haas. I also take on consulting projects and I'm always up for trading notes on technology, business strategy, or shipping products that actually help people.
          </p>

          {/* Strategic CTA Placement */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            {/* Primary CTA */}
            <a href="mailto:isaacavazquez95@gmail.com" className="group">
              <ModernButton
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                <FaEnvelope className="inline mr-2 text-lg" />
                Email me — I usually reply within a day
              </ModernButton>
            </a>

            {/* Secondary CTA */}
            <a href="https://www.linkedin.com/in/isaac-vazquez" target="_blank" rel="noopener noreferrer" className="group">
              <ModernButton
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <FaLinkedin className="inline mr-2 text-lg" />
                Connect on LinkedIn
              </ModernButton>
            </a>
          </div>

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-[#6BCF7F] dark:text-[#8FE39E]">
            <div className="w-2 h-2 bg-[#6BCF7F] dark:bg-[#8FE39E] rounded-full animate-pulse" aria-hidden="true"></div>
            <span>Friendly replies, no pressure conversations, and plenty of follow-through</span>
          </div>
        </WarmCard>

        {/* Value Proposition Cards */}
        <div className="grid md:grid-cols-3 gap-6 w-full">
          <WarmCard hover={true} padding="lg" className="text-center">
            <div className="text-3xl mb-3" aria-hidden="true">💼</div>
            <Heading level={3} className="text-lg font-bold mb-2 text-[#FF6B35]">
              Product Leadership
            </Heading>
            <p className="text-sm text-[#4A3426] dark:text-[#D4A88E]">
              Blend technical depth with MBA strategy and six years of building products that scale
            </p>
          </WarmCard>

          <WarmCard hover={true} padding="lg" className="text-center">
            <div className="text-3xl mb-3" aria-hidden="true">📊</div>
            <Heading level={3} className="text-lg font-bold mb-2 text-[#FF6B35]">
              Proven Results
            </Heading>
            <p className="text-sm text-[#4A3426] dark:text-[#D4A88E]">
              
            </p>
          </WarmCard>

          <WarmCard hover={true} padding="lg" className="text-center">
            <div className="text-3xl mb-3" aria-hidden="true">⚡</div>
            <Heading level={3} className="text-lg font-bold mb-2 text-[#FF6B35]">
              Quick Responder
            </Heading>
            <p className="text-sm text-[#4A3426] dark:text-[#D4A88E]">
              I make time for thoughtful replies, whether it's a call, coffee chat, or quick video sync
            </p>
          </WarmCard>
        </div>

        {/* Locations & Availability */}
        <WarmCard hover={false} padding="lg" className="w-full">
          <div className="text-center">
            <Heading level={3} className="text-xl font-bold mb-4 text-[#FF6B35]">
              📍 Based in Berkeley, CA • Open to Cool Opportunities
            </Heading>
            <p className="text-base text-[#4A3426] dark:text-[#D4A88E] max-w-2xl mx-auto leading-relaxed">
              I'm based in the East Bay during my MBA at UC Berkeley Haas (graduating May 2027).
              I love working on products that push boundaries and solving real problems through creativity, data, and technology.
            </p>
          </div>
        </WarmCard>
      </div>
    </div>
  );
}
