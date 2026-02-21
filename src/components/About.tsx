"use client";
import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { PageSummary } from "@/components/ui/PageSummary";
import { ExpertSignalGroup } from "@/components/ui/ExpertSignal";
import { JourneyTimeline } from "@/components/ui/JourneyTimeline";
import {
  IconUser,
  IconTimeline,
} from "@tabler/icons-react";

type TabType = "overview" | "journey";

export default function About() {
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: IconUser },
    { id: "journey" as TabType, label: "Journey", icon: IconTimeline },
  ];

  return (
    <div className="py-6 sm:py-10">
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
        className="text-center mb-12 max-w-4xl mx-auto"
      >
        <Heading level={1} className="mb-4">
          About Isaac Vazquez
        </Heading>
        <p className="text-lg md:text-xl text-[var(--text-secondary)]">
          Berkeley Haas MBA Candidate '27 | Consortium Fellow | MLT
          Professional Development Fellow
        </p>
      </motion.div>

   
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex justify-center mb-8">
          <div
            role="tablist"
            aria-label="About sections"
            className="flex flex-wrap justify-center bg-[var(--surface-elevated)] p-2 rounded-2xl border border-[var(--border-primary)]"
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
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 min-h-[48px] ${
                  activeTab === tab.id
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]"
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
  );
}

const OverviewContent = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <WarmCard hover={true} padding="xl">
        <div className="space-y-6">
          <Heading level={2} className="text-2xl lg:text-3xl mb-6">
            Overview
          </Heading>

          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
            I'm a technical product manager who treats QA and analytics as
            inputs to better bets. At Civitech I lead testing for voter
            engagement platforms that serve millions, translating what we
            learn in quality work into concrete roadmap shifts.
          </p>

          <div>
            <p className="text-[var(--text-primary)] font-semibold mb-3 text-base md:text-lg">
              What I bring to the table:
            </p>
            <ul className="list-disc ml-6 space-y-3 text-[var(--text-secondary)] text-base md:text-lg">
              <li>
                <strong className="text-[var(--text-primary)]">
                  Product & Strategy:
                </strong>{" "}
                Ground bets in user research, stack-rank ruthlessly, and keep
                cross-functional partners pointed at the same outcome.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">
                  Technical:
                </strong>{" "}
                Build and maintain automation, dive into SQL or APIs myself,
                and facilitate Agile rituals that actually unblock shipping.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">
                  Analytics:
                </strong>{" "}
                Define the metric that proves success, run experiments, and
                convert signal into decisions the business can feel.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">
                  Leadership:
                </strong>{" "}
                Mentor teammates, de-risk complex launches, and advocate for
                inclusive, mission-led teams.
              </li>
            </ul>
          </div>

          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
            Before Civitech I combed through statewide datasets for the State
            of Florida to inform policy, and I ran client services at Open
            Progress where I translated campaign goals into digital programs
            that actually resonated with the people we served.
          </p>

          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
            I'm earning my MBA at UC Berkeley Haas to pair hands-on execution
            with sharper product strategy and explore how I can support civic
            tech, SaaS, and other mission-driven founders as an operator or
            investor.
          </p>

          <p className="text-base md:text-lg text-[var(--text-primary)] leading-relaxed font-medium">
            If this sparks ideas, let's connect -- I'm always up for swapping
            notes on product, strategy, or social impact.
          </p>
        </div>
      </WarmCard>
    </div>
  );
};
