"use client";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { motion } from "framer-motion";
import {
  IconMail,
  IconBrandLinkedin,
  IconMapPin,
} from "@tabler/icons-react";

export function ContactContent() {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 max-w-4xl mx-auto"
      >
        <Heading level={1} className="mb-8">
          Let's Work Together
        </Heading>
        <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed">
          Open to full-time product roles, advisory projects, and honest
          conversations about building meaningful products.
        </p>
      </motion.div>

      <div className="flex flex-col items-center max-w-5xl mx-auto space-y-8">
        <WarmCard hover={false} padding="xl" className="text-center w-full">
          <Heading level={2} className="font-bold mb-4 text-3xl">
            Ready to Connect?
          </Heading>
          <p className="mb-6 max-w-2xl mx-auto text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
            I'm pursuing product management roles where I can pair QA roots
            with the strategy work I'm doing at Haas. I also take on
            consulting projects and I'm always up for trading notes on
            technology, business strategy, or shipping products that actually
            help people.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <a href="mailto:isaacavazquez95@gmail.com">
              <ModernButton variant="accent" size="lg" className="w-full sm:w-auto">
                <IconMail className="h-5 w-5" />
                Email me -- I usually reply within a day
              </ModernButton>
            </a>
            <a
              href="https://www.linkedin.com/in/isaac-vazquez"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ModernButton variant="outline" size="lg" className="w-full sm:w-auto">
                <IconBrandLinkedin className="h-5 w-5" />
                Connect on LinkedIn
              </ModernButton>
            </a>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-success)]">
            <div
              className="w-2 h-2 bg-[var(--color-success)] rounded-full animate-pulse"
              aria-hidden="true"
            />
            <span>
              Friendly replies, no pressure conversations, and plenty of
              follow-through
            </span>
          </div>
        </WarmCard>

        <div className="grid md:grid-cols-3 gap-6 w-full">
          {[
            {
              title: "Product Leadership",
              description:
                "Blend technical depth with MBA strategy work and six years of building products that scale.",
            },
            {
              title: "Proven Results",
              description:
                "Shipped platforms with 60M+ voters reached, 99.999% uptime, and measurable jumps in NPS and defect rates.",
            },
            {
              title: "Quick Responder",
              description:
                "I make time for thoughtful replies -- whether it's a call, a coffee chat, or a quick video sync.",
            },
          ].map((card) => (
            <WarmCard
              key={card.title}
              hover={true}
              padding="lg"
              className="text-center"
            >
              <Heading level={3} className="text-lg font-bold mb-2">
                {card.title}
              </Heading>
              <p className="text-sm text-[var(--text-secondary)]">
                {card.description}
              </p>
            </WarmCard>
          ))}
        </div>

        <WarmCard hover={false} padding="lg" className="w-full">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <IconMapPin className="h-5 w-5 text-[var(--color-primary)]" />
              <Heading level={3} className="text-xl font-bold">
                Berkeley, CA
              </Heading>
            </div>
            <p className="text-base text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Based in Berkeley while finishing my UC Berkeley Haas MBA (May
              2027). I split time between the Bay Area and Austin and love
              digging into products that mix creativity, data, and
              civic-minded impact.
            </p>
          </div>
        </WarmCard>
      </div>
    </div>
  );
}
