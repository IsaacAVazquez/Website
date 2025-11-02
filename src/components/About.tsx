"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { JourneyTimeline } from "@/components/ui/JourneyTimeline";
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
        className="text-center mb-12 max-w-4xl mx-auto"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text-warm mb-4 display-heading">
          About Isaac Vazquez
        </h1>
        <p className="text-lg md:text-xl text-[#4A3426] dark:text-[#D4A88E]">
          Berkeley Haas MBA Candidate '27 | Consortium Fellow | MLT Professional Development Fellow
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap justify-center bg-white/80 dark:bg-[#2D1B12]/90 p-2 rounded-2xl border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30 shadow-warm-lg backdrop-blur-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-[#FF6B35] dark:bg-[#FF8E53] text-white shadow-warm-lg'
                    : 'text-[#6B4F3D] dark:text-[#FFE4D6] hover:text-[#FF6B35] dark:hover:text-[#FF8E53] hover:bg-[#FFF8F0] dark:hover:bg-[#4A3426]/50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
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
    <div className="max-w-4xl mx-auto">
      <WarmCard hover={true} padding="xl">
        <div className="space-y-6">
          <Heading level={2} className="text-[#FF6B35] text-2xl lg:text-3xl mb-6">
            Overview
          </Heading>

          <p className="text-base md:text-lg text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
            I'm a technical product manager with a QA and analytics foundation. At Civitech I lead testing for voter engagement platforms that reach millions of people, turning what we uncover in quality work into smarter product bets.
          </p>

          <div>
            <p className="text-[#2D1B12] dark:text-[#FFE4D6] font-semibold mb-3 text-base md:text-lg">
              What I bring to the table:
            </p>
            <ul className="list-disc ml-6 space-y-3 text-[#4A3426] dark:text-[#D4A88E] text-base md:text-lg">
              <li><strong className="text-[#2D1B12] dark:text-[#FFE4D6]">Product & Strategy:</strong> Pair user research with prioritization, keep cross-functional teams aligned, and ship what actually moves metrics</li>
              <li><strong className="text-[#2D1B12] dark:text-[#FFE4D6]">Technical:</strong> Build Cypress suites, dig through SQL, break APIs, and run Agile rituals that keep velocity healthy</li>
              <li><strong className="text-[#2D1B12] dark:text-[#FFE4D6]">Analytics:</strong> Define the metrics, run the experiments, and translate the findings into product decisions</li>
              <li><strong className="text-[#2D1B12] dark:text-[#FFE4D6]">Leadership:</strong> Mentor teammates, manage complex projects, and champion inclusive, mission-driven teams</li>
            </ul>
          </div>

          <p className="text-base md:text-lg text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
            Before Civitech, I combed through statewide datasets for the State of Florida to support policy decisions, and I ran client services at Open Progress—translating campaign goals into digital programs that actually resonated.
          </p>

          <p className="text-base md:text-lg text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
            These days I'm earning my MBA at UC Berkeley Haas to pair hands-on execution with sharper product strategy and explore how I can support civic tech, SaaS, and other mission-driven founders as an operator or investor.
          </p>

          <p className="text-base md:text-lg text-[#2D1B12] dark:text-[#FFE4D6] leading-relaxed font-medium">
            If any of this sparks ideas, let's connect—I'm always up for swapping notes on product, strategy, or social impact.
          </p>
        </div>
      </WarmCard>
    </div>
  );
};
