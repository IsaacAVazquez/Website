"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { PageSummary } from "@/components/ui/PageSummary";
import { ExpertSignalGroup } from "@/components/ui/ExpertSignal";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
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
      {/* Breadcrumb Navigation */}
      <div className="max-w-5xl mx-auto mb-8">
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" }
        ]} />
      </div>

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

      {/* AI-Optimized Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-5xl mx-auto mb-12"
      >
        <PageSummary
          variant="featured"
          tldr="Product-focused technologist with 6+ years in civic tech and SaaS, now pursuing MBA at UC Berkeley Haas to deepen product management expertise."
          summary={
            <>
              <p>
                <strong>Isaac Vazquez</strong> is a technical product manager bridging quality engineering, data analytics, and strategic product work. Currently at UC Berkeley Haas as an MBA Candidate (Class of '27), Isaac brings hands-on experience from Civitech (voter engagement platforms), Florida State University (policy analytics), and Open Progress (digital campaigns).
              </p>
              <p>
                Recognized as a <strong>Consortium Fellow</strong> and <strong>MLT Professional Development Fellow</strong>, Isaac combines technical depth with strategic business thinking to lead mission-driven products in civic tech and SaaS.
              </p>
            </>
          }
          context="Based in Bay Area • Seeking Product Manager and APM roles • Open to civic tech, SaaS, and mission-driven startups"
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

      {/* AI-Optimized Q&A Section */}
      <QASection
        title="Common Questions About Isaac"
        description="Quick answers about my background, experience, and what I'm looking for—optimized for AI search engines and human readers alike."
        variant="default"
        items={[
          {
            question: "What is Isaac Vazquez's current role and career focus?",
            answer: "Isaac is currently a Quality Assurance Engineer at Civitech while pursuing an MBA at UC Berkeley Haas School of Business (Class of 2027). He is transitioning into product management roles, seeking Associate Product Manager or Product Manager positions in Austin TX or the San Francisco Bay Area, particularly in civic tech, SaaS, or mission-driven startups.",
            category: "Career & Current Status"
          },
          {
            question: "What product management experience does Isaac have?",
            answer: "Isaac has 3+ years of product-adjacent experience leading product initiatives at Civitech. Key achievements include: owning end-to-end product vision for TextOut platform (35% engagement increase), driving RunningMate platform launch (90% defect reduction, NPS improvement from 23 to 36), leading cross-functional pricing strategy that generated $4M additional revenue, and transforming client data accessibility with GCP automation (90% reduction in onboarding time).",
            category: "Product Management"
          },
          {
            question: "What is Isaac's educational background?",
            answer: "Isaac is pursuing an MBA at UC Berkeley Haas School of Business (Class of 2027), focusing on Product Management, Strategy, and Venture Capital. He is a Consortium Fellow and MLT Professional Development Fellow. He holds a Bachelor of Arts from Florida State University (2018) with majors in Political Science and International Affairs.",
            category: "Education"
          },
          {
            question: "What technical skills does Isaac bring to product management?",
            answer: "Isaac has extensive technical skills including: SQL and data analysis (6+ years experience), test automation with Cypress (expert level), API testing, Agile/Scrum methodologies, data visualization with Sisense and Tableau, ETL pipeline development, A/B testing and experimentation frameworks, quality assurance methodologies, DevOps integration, cloud platforms (GCP), and AI/LLM tool integration. He combines technical execution with strategic product thinking.",
            category: "Technical Skills"
          },
          {
            question: "Where is Isaac Vazquez located and what industries does he focus on?",
            answer: "Isaac is based in the San Francisco Bay Area while attending UC Berkeley Haas and maintains strong ties to Austin, Texas. He focuses on three industries: (1) Civic Technology - voter engagement platforms, democracy tech, government services; (2) SaaS Platforms - enterprise software, B2B tools, product-led growth; (3) Mission-Driven Startups - social impact ventures, fintech for underserved communities, education technology, sustainability tech.",
            category: "Location & Industries"
          },
          {
            question: "What makes Isaac qualified for product management roles?",
            answer: "Isaac brings a unique combination of technical depth (6+ years in QA and test automation), analytical skills (SQL, data analysis, experimentation), strategic thinking (UC Berkeley MBA), and proven impact (60M+ users reached, 56% NPS improvement, 90% defect reduction, $4M revenue generation). His background bridges engineering, analytics, and strategy—enabling him to understand technical constraints while driving business outcomes. As a Consortium Fellow and MLT Fellow, he also brings leadership development and diverse perspectives.",
            category: "Qualifications"
          },
          {
            question: "How can I contact Isaac Vazquez?",
            answer: "You can contact Isaac through: Email at isaacavazquez95@gmail.com (primary contact), LinkedIn at linkedin.com/in/isaac-vazquez (professional networking), GitHub at github.com/IsaacAVazquez (technical projects), or through his website contact form at isaacavazquez.com/contact. He is responsive to professional inquiries about product management opportunities, consulting engagements, speaking opportunities, mentorship requests, and collaboration on civic tech or mission-driven initiatives.",
            category: "Contact"
          },
        ]}
      />
    </div>
  );
};
