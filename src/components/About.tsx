"use client";
import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { JourneyTimeline } from "@/components/ui/JourneyTimeline";
import {
  IconUser,
  IconTimeline,
} from "@tabler/icons-react";
import { SectionIntro } from "@/components/ui/SectionIntro";

type TabType = "overview" | "journey";

export default function About() {
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: IconUser },
    { id: "journey" as TabType, label: "Journey", icon: IconTimeline },
  ];

  return (
    <section className="min-h-screen bg-[var(--surface-primary)] page-section">
      <div className="page-shell space-y-10">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
        >
          <SectionIntro
            eyebrow="About"
            align="center"
            size="md"
            headingLevel={1}
            title="I'm an MBA candidate at Berkeley Haas with six years across QA, analytics, and product work."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          className="mx-auto w-full max-w-5xl"
        >
          <div className="mb-8 flex justify-center">
          <div
            role="tablist"
            aria-label="About sections"
            className="flex flex-wrap justify-center gap-2 rounded-[1.5rem] border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-2.5 shadow-sm"
          >
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                id={`${tab.id}-tab`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") {
                    const nextIndex = (index + 1) % tabs.length;
                    setActiveTab(tabs[nextIndex].id);
                  } else if (e.key === "ArrowLeft") {
                    const prevIndex =
                      (index - 1 + tabs.length) % tabs.length;
                    setActiveTab(tabs[prevIndex].id);
                  }
                }}
                className={`flex min-h-[48px] items-center gap-2 rounded-xl px-6 py-3 font-medium transition-[background-color,color,box-shadow] duration-200 ${
                  activeTab === tab.id
                    ? "bg-[var(--text-primary)] text-[var(--text-inverse)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-primary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <tab.icon className="w-5 h-5" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              id="overview-panel"
              role="tabpanel"
              aria-labelledby="overview-tab"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -20 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
            >
              <OverviewContent />
            </motion.div>
          )}
          {activeTab === "journey" && (
            <motion.div
              key="journey"
              id="journey-panel"
              role="tabpanel"
              aria-labelledby="journey-tab"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -20 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
            >
              <JourneyTimeline />
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

const OverviewContent = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <WarmCard hover={true} padding="xl" className="shadow-sm">
        <div className="space-y-6">
          <Heading level={2} className="text-2xl lg:text-3xl mb-6">
            Overview
          </Heading>

          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
            I&apos;m a full-time MBA Candidate at UC Berkeley Haas with a background in QA and analytics. Before business school, I spent six years at two companies in civic technology, starting in campaign analytics and working my way into quality engineering and product ownership.
          </p>

          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
            What a QA background actually teaches you is to distrust your own assumptions. I don&apos;t write product requirements by imagining how users will behave. I look at what the system is doing, find where the gaps are, and work from there. I&apos;m comfortable with automation, SQL, and APIs, and I lean on them because they keep my product decisions connected to how things actually work rather than how I imagine they do. Data is how I check my assumptions and make measurement legible to the people doing the work, not a substitute for judgment.
          </p>

          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
            At Civitech, I started in QA owning reliability for SaaS platforms that reached millions of voters. Over three years the role grew into something closer to product management. I led the pricing strategy that brought in $4M in new revenue, owned the product vision for a peer-to-peer texting platform that drove a 35% engagement increase, and built a real-time event system in Google Cloud that cut client onboarding time by 60%. By the end I was running user interviews, translating cross-functional feedback into requirements for a new platform launch, and shipping biweekly instead of monthly.
          </p>

          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
            Before that, I ran client services at Open Progress, managing 80+ digital programs that reached over 50 million voters. I built the ETL pipelines and dashboards that turned campaign analytics from manual reporting into something teams could actually use to make decisions.
          </p>

          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
            Right now I&apos;m building investment research and fintech tools because I&apos;m genuinely curious about how product design and decision support come together. That curiosity is why I ended up in product work in the first place, and it&apos;s what keeps me building things outside of class.
          </p>

          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
            I&apos;m at Haas to sharpen the strategy side of product work while I continue to build things I find interesting. Those two things are related.
          </p>

          <p className="text-base md:text-lg text-[var(--text-primary)] leading-relaxed font-medium">
            I&apos;m most interested in products at the intersection of analytics, trust, and clear user decision-making.
          </p>
        </div>
      </WarmCard>
    </div>
  );
};
