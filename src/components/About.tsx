"use client";
import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { JourneyTimeline } from "@/components/ui/JourneyTimeline";
import { IconUser, IconTimeline } from "@tabler/icons-react";

type TabType = "overview" | "journey";

export default function About() {
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: IconUser },
    { id: "journey" as TabType, label: "Journey", icon: IconTimeline },
  ];

  return (
    <section className="home-page min-h-screen">
      <div className="home-shell home-section space-y-10">
        {/* Page heading */}
        <motion.div
          className="space-y-3 pt-4"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
        >
          <p className="home-kicker">About</p>
          <h1
            className="mx-auto w-full max-w-5xl text-center"
            style={{
              fontFamily: "var(--font-home-sans)",
              fontSize: "clamp(2.6rem, 6vw, 5rem)",
              fontWeight: 600,
              lineHeight: 0.94,
              letterSpacing: "-0.07em",
              color: "var(--home-ink)",
            }}
          >
            I&apos;m an MBA candidate at Berkeley Haas with six years across QA, analytics, and product work.
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5, delay: 0.1 }}
          className="w-full"
        >
          {/* Tab bar */}
          <div className="mb-8 flex justify-center">
            <div
              role="tablist"
              aria-label="About sections"
              className="flex flex-wrap justify-center gap-2 rounded-[1.5rem] p-2"
              style={{
                border: "1px solid var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper-alt) 90%, var(--home-elev-mix))",
              }}
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
                      const prevIndex = (index - 1 + tabs.length) % tabs.length;
                      setActiveTab(tabs[prevIndex].id);
                    }
                  }}
                  className="flex min-h-[44px] items-center gap-2 rounded-xl px-6 py-2.5 font-semibold transition-[background-color,color,box-shadow] duration-200"
                  style={
                    activeTab === tab.id
                      ? {
                          background: "var(--home-ink)",
                          color: "var(--home-paper)",
                          fontFamily: "var(--font-home-sans)",
                          fontSize: "0.88rem",
                          letterSpacing: "0.02em",
                        }
                      : {
                          color: "var(--home-ink-muted)",
                          fontFamily: "var(--font-home-sans)",
                          fontSize: "0.88rem",
                          letterSpacing: "0.02em",
                        }
                  }
                >
                  <tab.icon className="w-4 h-4" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab panels */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                id="overview-panel"
                role="tabpanel"
                aria-labelledby="overview-tab"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -16 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
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
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -16 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
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
    <div className="max-w-5xl mx-auto">
      <div className="home-card home-project-card space-y-5">
        <p className="home-kicker">Overview</p>

        <p className="home-body max-w-none">
          I&apos;m a full-time MBA Candidate at UC Berkeley Haas with a background in QA and analytics. Before business school, I spent six years at two companies in civic technology, starting in campaign analytics and working my way into quality engineering and product ownership.
        </p>

        <p className="home-body max-w-none">
          What a QA background actually teaches you is to distrust your own assumptions. I don&apos;t write product requirements by imagining how users will behave. I look at what the system is doing, find where the gaps are, and work from there. I&apos;m comfortable with automation, SQL, and APIs, and I lean on them because they keep my product decisions connected to how things work rather than how I imagine they do. Data is how I check my assumptions and make measurement legible to the people doing the work, not a substitute for judgment.
        </p>

        <p className="home-body max-w-none">
          At Civitech, I started in QA owning reliability for SaaS platforms that reached millions of voters. Over three years the role grew into something closer to product management. I led the pricing strategy that brought in $4M in new revenue, owned the product vision for a peer-to-peer texting platform that drove a 35% engagement increase, and built a real-time event system in Google Cloud that cut client onboarding time by 60%. By the end I was running user interviews, translating cross-functional feedback into requirements for a new platform launch, and shipping biweekly instead of monthly.
        </p>

        <p className="home-body max-w-none">
          Before that, I ran client services at Open Progress, managing 80+ digital programs that reached over 50 million voters. I built the ETL pipelines and dashboards that turned campaign analytics from manual reporting into something teams could actually use to make decisions.
        </p>

        <p className="home-body max-w-none">
          Right now I&apos;m building investment research and fintech tools because I&apos;m genuinely curious about how product design and decision support come together. That curiosity is why I ended up in product work in the first place, and it&apos;s what keeps me building things outside of class.
        </p>

        <p className="home-body max-w-none">
          I&apos;m at Haas to sharpen the strategy side of product work while I continue to build things I find interesting. Those two things are related.
        </p>

        <p className="home-body home-body-strong font-semibold max-w-none">
          I&apos;m most interested in products at the intersection of analytics, trust, and clear user decision-making.
        </p>
      </div>
    </div>
  );
};
