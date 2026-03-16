"use client";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { motion, useReducedMotion } from "framer-motion";
import {
  IconMail,
  IconBrandLinkedin,
  IconMapPin,
} from "@tabler/icons-react";

export function ContactContent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
        className="text-center mb-12 max-w-4xl mx-auto"
      >
        <Heading level={1} className="mb-8">
          Let's Work Together
        </Heading>
        <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed">
          Open to product roles, fintech conversations, and advisory work on
          products where analytics and trust both matter.
        </p>
      </motion.div>

      <div className="space-y-6">
        <WarmCard hover={false} padding="xl" className="text-center w-full">
          <Heading level={2} className="font-bold mb-4 text-3xl">
            Ready to Connect?
          </Heading>
          <p className="mb-6 max-w-2xl mx-auto text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
            I'm pursuing product roles where I can pair QA roots with the
            strategy work I'm doing at Haas. I'm especially interested in
            teams building decision-support, analytics, fintech, and workflow
            products that need both strong execution and clear product
            judgment.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <ModernButton href="mailto:IsaacVazquez@berkeley.edu" variant="accent" size="lg" className="w-full sm:w-auto">
              <IconMail className="h-5 w-5" />
              Email me
            </ModernButton>
            <ModernButton href="https://www.linkedin.com/in/isaac-vazquez" variant="outline" size="lg" className="w-full sm:w-auto">
              <IconBrandLinkedin className="h-5 w-5" />
              Connect on LinkedIn
            </ModernButton>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-success)]">
            <div
              className="w-2 h-2 bg-[var(--color-success)] rounded-full animate-pulse"
              aria-hidden="true"
            />
            <span>Open to conversations about product, fintech, and analytics</span>
          </div>
        </WarmCard>

     
        <WarmCard hover={false} padding="lg" className="w-full">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <IconMapPin className="h-5 w-5 text-[var(--color-primary)]" />
              <Heading level={3} className="text-xl font-bold">
                Berkeley, CA
              </Heading>
            </div>
            <p className="text-base text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Based in the Bay Area while attending UC Berkeley Haas (Class of
              2027). I like working on products that turn messy data into
              clearer decisions, whether the use case is civic engagement,
              SaaS operations, or investment research.
            </p>
          </div>
        </WarmCard>
      </div>
    </div>
  );
}
