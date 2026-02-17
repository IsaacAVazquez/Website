"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { PageSummary } from "@/components/ui/PageSummary";
import { ExpertSignalGroup } from "@/components/ui/ExpertSignal";
import { JourneyTimeline } from "@/components/ui/JourneyTimeline";
import { QASection } from "@/components/ui/QASection";
import {
  IconUser,
  IconTimeline
} from "@tabler/icons-react";

type TabType = "overview" | "journey";

export default function About() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: IconUser },
    { id: "journey" as TabType, label: "Journey", icon: IconTimeline }
  ];

  return (
    <div className="min-h-screen py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 max-inline-size-wide mx-auto"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text-warm mb-4 display-heading">
          About Isaac Vazquez
        </h1>
        <p className="text-lg md:text-xl text-[#4A3426] dark:text-[#D4A88E]">
          Berkeley Haas MBA Candidate '27 | Consortium Fellow | MLT Professional Development Fellow
        </p>
      </motion.div>

      {/* AI-Optimized Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-5xl mx-auto mb-12"
      >
        <PageSummary
          variant="featured"
          tldr="Technical product manager who pairs QA rigor with product strategy. Currently at Berkeley Haas sharpening how I scale data-heavy, user-facing products."
          summary={
            <>
              <p>
                I bridge quality engineering, data storytelling, and strategic product work. At Civitech I owned testing for voter engagement platforms across 60M+ users; before that I built policy analytics at Florida State University and managed digital programs at Open Progress.
              </p>
              <p>
                As a <strong>Consortium Fellow</strong> and <strong>MLT Professional Development Fellow</strong>, I’m now at UC Berkeley Haas (MBA ’27) expanding the product toolkit I bring to civic tech, SaaS, and impact-minded teams.
              </p>
            </>
          }
          context="Based in the Bay • Open to PM/APM roles"
        />

        {/* Expert Credentials */}
        <div className="mt-8">
          <ExpertSignalGroup
            title="Credentials & Expertise"
            variant="compact"
            columns={2}
            signals={[
              {
                type: "education",
                label: "UC Berkeley Haas School of Business",
                value: "MBA Candidate, Class of 2027 • Consortium Fellow • MLT Professional Development Fellow",
                verified: true,
              },
              {
                type: "education",
                label: "Florida State University",
                value: "Bachelor of Arts: Political Science & International Affairs",
              },
              {
                type: "experience",
                label: "Civitech - Quality Assurance Engineer",
                value: "Leading testing for voter engagement platforms reaching 60M+ users",
              },
              {
                type: "expertise",
                label: "Product Management & Strategy",
                value: "User Research • Roadmapping • Cross-functional Leadership • Experimentation • Go-to-Market",
              },
              {
                type: "expertise",
                label: "Technical Skills",
                value: "Test Automation (Cypress) • SQL • API Testing • Data Analytics • Agile/Scrum",
              },
              {
                type: "achievement",
                label: "Impact & Results",
                value: "99.999% platform uptime • 56% NPS improvement • 90% reduction in critical defects",
              },
            ]}
          />
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex justify-center mb-8">
          <div
            role="tablist"
            aria-label="About sections"
            className="flex flex-wrap justify-center bg-white/80 dark:bg-[#2D1B12]/90 p-2 rounded-2xl border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30 shadow-warm-lg backdrop-blur-sm"
          >
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') {
                    const nextIndex = (index + 1) % tabs.length;
                    setActiveTab(tabs[nextIndex].id);
                  } else if (e.key === 'ArrowLeft') {
                    const prevIndex = (index - 1 + tabs.length) % tabs.length;
                    setActiveTab(tabs[prevIndex].id);
                  }
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 min-h-[48px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7B32B] ${
                  activeTab === tab.id
                    ? 'bg-[#FF6B35] dark:bg-[#FF8E53] text-white shadow-warm-lg scale-105'
                    : 'text-[#6B4F3D] dark:text-[#FFE4D6] hover:text-[#FF6B35] dark:hover:text-[#FF8E53] hover:bg-[#FFF8F0] dark:hover:bg-[#4A3426]/50 hover:scale-102'
                }`}
              >
                <tab.icon className="w-5 h-5" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content with Animation */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              id="overview-panel"
              role="tabpanel"
              aria-labelledby="overview-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
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
          <Heading level={2} className="text-[#FF6B35] text-2xl lg:text-3xl mb-6">
            Overview
          </Heading>

          <p className="text-base md:text-lg text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
            I’m a technical product manager who treats QA and analytics as inputs to better bets. At Civitech I lead testing for voter engagement platforms that serve millions, translating what we learn in quality work into concrete roadmap shifts.
          </p>

          <div>
            <p className="text-[#2D1B12] dark:text-[#FFE4D6] font-semibold mb-3 text-base md:text-lg">
              What I bring to the table:
            </p>
            <ul className="list-disc ml-6 space-y-3 text-[#4A3426] dark:text-[#D4A88E] text-base md:text-lg">
              <li><strong className="text-[#2D1B12] dark:text-[#FFE4D6]">Product & Strategy:</strong> Ground bets in user research, stack-rank ruthlessly, and keep cross-functional partners pointed at the same outcome.</li>
              <li><strong className="text-[#2D1B12] dark:text-[#FFE4D6]">Technical:</strong> Build and maintain automation, dive into SQL or APIs myself, and facilitate Agile rituals that actually unblock shipping.</li>
              <li><strong className="text-[#2D1B12] dark:text-[#FFE4D6]">Analytics:</strong> Define the metric that proves success, run experiments, and convert signal into decisions the business can feel.</li>
              <li><strong className="text-[#2D1B12] dark:text-[#FFE4D6]">Leadership:</strong> Mentor teammates, de-risk complex launches, and advocate for inclusive, mission-led teams.</li>
            </ul>
          </div>

          <p className="text-base md:text-lg text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
            Before Civitech I combed through statewide datasets for the State of Florida to inform policy, and I ran client services at Open Progress where I translated campaign goals into digital programs that actually resonated with the people we served.
          </p>

          <p className="text-base md:text-lg text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
            I’m earning my MBA at UC Berkeley Haas to pair hands-on execution with sharper product strategy and explore how I can support civic tech, SaaS, and other mission-driven founders as an operator or investor.
          </p>

          <p className="text-base md:text-lg text-[#2D1B12] dark:text-[#FFE4D6] leading-relaxed font-medium">
            If this sparks ideas, let’s connect—I’m always up for swapping notes on product, strategy, or social impact.
          </p>
        </div>
      </WarmCard>

      {/* FAQ already covers personal background; redundant QASection removed */}
    </div>
  );
};
