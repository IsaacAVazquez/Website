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
            size="lg"
            headingLevel={1}
            title="A product manager with roots in QA, analytics, and execution."
            description="My background combines product strategy with hands-on experience in quality, systems thinking, and cross-functional delivery."
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
            I&apos;m a technical product manager with a background in QA and
            analytics. At Civitech I work across quality and product for
            platforms that serve 60M+ users, helping teams turn complex system
            and user signals into practical decisions.
          </p>

          <div>
            <p className="text-[var(--text-primary)] font-semibold mb-3 text-base md:text-lg">
              What I bring:
            </p>
            <ul className="list-disc ml-6 space-y-3 text-[var(--text-secondary)] text-base md:text-lg">
              <li>
                <strong className="text-[var(--text-primary)]">
                  Product & Strategy:
                </strong>{" "}
                Define the problem clearly, balance user and business needs, and
                keep teams aligned around the right outcome.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">
                  Technical:
                </strong>{" "}
                Work comfortably with automation, SQL, and APIs so product
                decisions stay connected to how the system actually works.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">
                  Analytics:
                </strong>{" "}
                Use data to understand what&apos;s working, test assumptions, and
                make measurement useful to the team doing the work.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">
                  Fintech Curiosity:
                </strong>{" "}
                Build investment research and analytics projects to stay close to
                how product design and decision support come together.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">
                  Leadership:
                </strong>{" "}
                Support launches, mentor teammates, and help create the clarity
                teams need to ship well.
              </li>
            </ul>
          </div>

          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
            Before Civitech I led client services at Open Progress, running 80+
            digital programs, building data pipelines, and using audience
            analytics to make campaigns resonate with the people on the other
            end.
          </p>

          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
            I&apos;m earning my MBA at UC Berkeley Haas to deepen the strategy
            side of the work while continuing to build products that help people
            make better decisions.
          </p>

          <p className="text-base md:text-lg text-[var(--text-primary)] leading-relaxed font-medium">
            I&apos;m especially interested in products that sit at the intersection
            of analytics, trust, and clear user decision-making.
          </p>
        </div>
      </WarmCard>
    </div>
  );
};
