"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { WarmCard } from "@/components/ui/WarmCard";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { ModernButton } from "@/components/ui/ModernButton";

export interface ConsultingService {
  title: string;
  description: string;
  icon: string;
}

interface ConsultingContentProps {
  services: ConsultingService[];
}

export function ConsultingContent({ services }: ConsultingContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-5xl mx-auto space-y-12"
    >
      <WarmCard padding="xl" className="text-center">
        <Heading level={1} className="mb-4 text-[#FF6B35]">
          Product Management Consulting & Advisory
        </Heading>
        <Paragraph className="text-base md:text-lg text-[#4A3426] dark:text-[#D4A88E] mx-auto max-w-3xl">
          I partner with teams to build products people believe in. The work blends QA discipline, product strategy, and the toolkit I'm sharpening at Berkeley Haas—grounded in six-plus years of shipping alongside engineers, analysts, and stakeholders.
        </Paragraph>
        <Paragraph className="text-base md:text-lg text-[#4A3426] dark:text-[#D4A88E] mx-auto max-w-3xl">
          Whether you're moving from prototype to product-market fit or leveling up a mature delivery process, I help translate vision into experiments, rituals, and roadmaps your team can execute.
        </Paragraph>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/contact">
            <ModernButton variant="primary" size="lg">
              Start a Conversation
            </ModernButton>
          </Link>
          <a href="mailto:isaacavazquez95@gmail.com">
            <ModernButton variant="outline" size="lg">
              Email Isaac
            </ModernButton>
          </a>
        </div>
      </WarmCard>

      <section>
        <Heading level={2} className="mb-6 text-center text-[#FF6B35]">
          How I Can Help
        </Heading>
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <WarmCard key={service.title} hover padding="lg" className="text-center h-full">
              <span className="text-4xl mb-3 block" aria-hidden="true">
                {service.icon}
              </span>
              <Heading level={3} className="text-lg font-semibold mb-3 text-[#FF6B35]">
                {service.title}
              </Heading>
              <Paragraph className="text-sm md:text-base text-[#4A3426] dark:text-[#D4A88E]">
                {service.description}
              </Paragraph>
            </WarmCard>
          ))}
        </div>
      </section>

      <WarmCard padding="xl" className="space-y-4">
        <Heading level={2} className="text-[#FF6B35]">
          Advisory & Mentoring
        </Heading>
        <Paragraph className="text-base text-[#4A3426] dark:text-[#D4A88E]">
          I coach technical builders stepping into product roles and early founders shaping their first offering. Sessions are candid and tactical, drawing on lessons from Austin civic tech and Bay Area startups alike.
        </Paragraph>
        <Paragraph className="text-base text-[#4A3426] dark:text-[#D4A88E]">
          We often work through validating product-market fit, making pragmatic architecture decisions, building healthy teams, and setting up product rhythms that scale with growth.
        </Paragraph>
      </WarmCard>

      <WarmCard padding="xl" className="space-y-4">
        <Heading level={2} className="text-[#FF6B35]">
          Background & Approach
        </Heading>
        <Paragraph className="text-base text-[#4A3426] dark:text-[#D4A88E]">
          I'm completing my MBA at UC Berkeley Haas while staying hands-on in product and QA work. I've contributed to platforms supporting more than 60 million voters across Austin and California, giving me a clear view of both user needs and technical constraints.
        </Paragraph>
        <Paragraph className="text-base text-[#4A3426] dark:text-[#D4A88E]">
          The QA and software roots bring credibility with engineering teams; Haas sharpens the strategic layer across market positioning, financial outcomes, and competitive advantage.
        </Paragraph>
      </WarmCard>

      <WarmCard padding="lg" className="text-center">
        <Heading level={3} className="text-xl text-[#FF6B35] mb-3">
          Let's Build Together
        </Heading>
        <Paragraph className="text-base text-[#4A3426] dark:text-[#D4A88E] max-w-2xl mx-auto">
          I keep engagements intentionally small so every client gets focus and follow-through. Reach out and we'll explore how I can support what you're building.
        </Paragraph>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/contact">
            <ModernButton variant="primary" size="md">
              Share Your Project
            </ModernButton>
          </Link>
          <a href="mailto:isaacavazquez95@gmail.com">
            <ModernButton variant="outline" size="md">
              Email Isaac
            </ModernButton>
          </a>
        </div>
      </WarmCard>
    </motion.div>
  );
}

