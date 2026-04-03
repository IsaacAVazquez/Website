"use client";

import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { motion, useReducedMotion } from "framer-motion";
import {
  IconMail,
  IconBrandLinkedin,
  IconMapPin,
} from "@tabler/icons-react";
import { SectionIntro } from "@/components/ui/SectionIntro";

export function ContactContent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
        className="mx-auto max-w-4xl text-center"
      >
        <SectionIntro
          eyebrow="Contact"
          align="center"
          size="lg"
          headingLevel={1}
          title="Get in touch."
          description="If you&apos;re working on product, analytics, or investment-focused tools, I&apos;d be glad to connect."
        />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <WarmCard hover={false} padding="xl" className="w-full text-center lg:text-left">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              Good fit
            </p>
            <h2 className="text-3xl font-bold text-[var(--text-primary)]">
              Roles and projects where product judgment and execution both matter.
            </h2>
          </div>
          <p className="mb-6 mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] md:text-lg lg:mx-0">
            I&apos;m especially interested in analytics, fintech, workflow, and
            decision-support products, along with teams that care about clear
            strategy, reliable delivery, and practical product thinking.
          </p>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row lg:justify-start">
            <ModernButton
              href="mailto:IsaacVazquez@berkeley.edu"
              variant="accent"
              size="lg"
              className="w-full sm:w-auto"
            >
              <IconMail className="h-5 w-5" />
              Email me
            </ModernButton>
            <ModernButton
              href="https://www.linkedin.com/in/isaac-vazquez"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <IconBrandLinkedin className="h-5 w-5" />
              Connect on LinkedIn
            </ModernButton>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-success)] lg:justify-start">
            <div
              className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-success)]"
              aria-hidden="true"
            />
            <span>Based in Berkeley and available by email or LinkedIn</span>
          </div>
        </WarmCard>

        <div className="space-y-6">
          <WarmCard hover={false} padding="lg" className="w-full">
            <div className="text-center lg:text-left">
              <div className="mb-4 flex items-center justify-center gap-2 lg:justify-start">
                <IconMapPin className="h-5 w-5 text-[var(--color-primary)]" />
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  Berkeley, CA
                </h3>
              </div>
              <p className="mb-0 text-base leading-relaxed text-[var(--text-secondary)]">
                Based in the Bay Area while attending UC Berkeley Haas. I enjoy
                working on products that help people make clearer decisions,
                whether the setting is civic tech, SaaS operations, or investment research.
              </p>
            </div>
          </WarmCard>

          <div className="surface-muted p-6 text-left">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              Best conversations
            </p>
            <p className="mb-0 text-sm leading-relaxed text-[var(--text-secondary)]">
              Product roles, analytics-heavy tools, fintech-style workflows,
              platform reliability, and product work where execution quality
              materially changes the outcome.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
