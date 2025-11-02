"use client";

import { ModernHero } from "@/components/ModernHero";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { StructuredData } from "@/components/StructuredData";
import { motion, AnimatePresence } from "framer-motion";
import { personalMetrics } from "@/constants/personal";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  IconBriefcase,
  IconSchool,
  IconTrendingUp,
  IconCode,
  IconRocket,
  IconUser,
  IconTimeline
} from "@tabler/icons-react";

type TabType = "overview" | "journey";

// Timeline Item Component
const TimelineItem = ({ item, isLast }: { item: typeof personalMetrics.careerTimeline[0]; isLast: boolean }) => {
  const getIcon = () => {
    const company = item.company.toLowerCase();
    if (company.includes('florida state')) return IconSchool;
    if (company.includes('open progress')) return IconTrendingUp;
    if (company.includes('civitech')) return IconBriefcase;
    if (company.includes('berkeley') || company.includes('haas')) return IconRocket;
    return IconBriefcase;
  };

  const Icon = getIcon();

  return (
    <div className="relative flex items-start gap-6 group">

      {/* Timeline line */}
      <div className="relative flex flex-col items-center">
        {/* Year badge with logo */}
        <div className="relative z-10 w-16 h-16 rounded-full bg-white dark:bg-[#2D1B12] p-2 mb-4 shadow-warm-lg border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30">
          {item.logo ? (
            <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-white dark:bg-[#2D1B12]">
              <Image
                src={item.logo}
                alt={`${item.company} logo`}
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FF6B35] to-[#F7B32B] flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Vertical line */}
        {!isLast && (
          <div className="w-0.5 h-32 bg-gradient-to-b from-[#FF6B35]/50 to-transparent" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-12">
        <WarmCard hover={true} padding="lg">
            <div>
              {/* Header */}
              <div className="flex items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-[#FF6B35]">
                      {item.role}
                    </h3>
                    <div className="text-sm text-[#F7B32B] font-mono">
                      {item.year}
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-[#2D1B12] dark:text-[#FFE4D6] mb-2">
                    {item.company}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-[#4A3426] dark:text-[#D4A88E] mb-4 leading-relaxed">
                {item.description}
              </p>

              {/* Tech Stack */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <IconCode className="w-4 h-4 text-[#FF6B35]" />
                  <span className="text-sm font-semibold text-[#FF6B35]">
                    Tech Stack
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 text-xs rounded-full bg-[#FFF8F0] border border-[#FF6B35]/30 text-[#FF6B35] font-mono"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </WarmCard>
      </div>
    </div>
  );
};


export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: IconUser },
    { id: "journey" as TabType, label: "Journey", icon: IconTimeline }
  ];

  const productHighlights = [
    {
      title: "Discovery & Positioning",
      description: "Translate user research and market signals into a focused roadmap for civic tech and SaaS teams.",
      bullets: [
        "Lead customer interviews and synthesize insights into opportunity briefs",
        "Define product positioning and narrative for stakeholders",
        "Frame hypotheses that guide experiments and prioritization"
      ]
    },
    {
      title: "Data & Experimentation",
      description: "Run data-informed bets that keep learning loops tight and measurable.",
      bullets: [
        "Develop dashboards that connect activation, retention, and revenue metrics",
        "Shape experimentation backlogs and partner with analysts on instrumentation",
        "Model impact scenarios for executive decision-making"
      ]
    },
    {
      title: "Delivery & Quality",
      description: "Keep cross-functional teams aligned from opportunity sizing through launch.",
      bullets: [
        "Facilitate sprint rituals that keep design, engineering, and GTM in sync",
        "Pair release planning with QA strategies to protect reliability",
        "Close the loop with learnings that feed the next discovery cycle"
      ]
    }
  ];

  const professionalServiceData = {
    name: "Isaac Vazquez Product Management Consulting",
    description: "Technical product manager and UC Berkeley Haas MBA helping civic tech and SaaS teams ship user-loved products.",
    serviceType: [
      "Product Strategy",
      "Product Discovery",
      "Experimentation & Analytics",
      "Product Operations",
      "Quality Engineering Advisory"
    ],
    areaServed: ["Austin, TX", "San Francisco Bay Area, CA", "Remote"],
    url: "https://isaacavazquez.com",
  };

  return (
    <>
      <StructuredData type="ProfessionalService" data={professionalServiceData} />
      <div className="min-h-screen w-full bg-[#FFFCF7] dark:bg-gradient-to-br dark:from-[#1C1410] dark:via-[#2D1B12] dark:to-[#1C1410]">
        {/* Modern Editorial Hero Section */}
        <ModernHero />

        {/* Secondary Content */}
        <div className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
          {/* About Section with Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto"
          >
            {/* Tab Navigation */}
            <div className="flex justify-center mb-8 relative z-20">
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

          {/* Tab Content Container with Min Height */}
          <div className="min-h-[600px]">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
          <WarmCard
            hover={true}
            padding="xl"
          >
            <div className="space-y-8">
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
                </motion.div>
              )}

              {activeTab === "journey" && (
                <motion.div
                  key="journey"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <WarmCard hover={true} padding="xl">
                    <div className="space-y-10">
          {/* Header */}
          <div className="text-center">
            <Heading level={2} className="text-[#FF6B35] text-2xl lg:text-3xl mb-6">
              Career Journey
            </Heading>
            <p className="text-base md:text-lg text-[#4A3426] dark:text-[#D4A88E] leading-relaxed max-w-3xl mx-auto">
              From Political Science graduate to QA engineer, and now an MBA candidate at UC Berkeley, my career has been a journey of continuous learning and impact. Here's a snapshot of my professional timeline.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline items */}
            <div className="relative space-y-4">
              {personalMetrics.careerTimeline.map((item, index) => (
                <TimelineItem
                  key={`${item.year}-${item.role}`}
                  item={item}
                  isLast={index === personalMetrics.careerTimeline.length - 1}
                />
              ))}
            </div>
          </div>
                    </div>
                  </WarmCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-20 space-y-8 max-w-6xl mx-auto"
        >
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <Heading level={2} className="text-[#FF6B35] text-2xl lg:text-3xl">
              Product Management Focus Areas
            </Heading>
            <p className="text-base md:text-lg text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
              I'm recruiting for product management roles where a technical foundation, MBA training, and a civic tech lens are advantages. These are the muscles I lean on most often.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {productHighlights.map((highlight) => (
              <WarmCard key={highlight.title} hover padding="lg" className="h-full flex flex-col">
                <Heading level={3} className="text-lg font-semibold mb-3 text-[#FF6B35]">
                  {highlight.title}
                </Heading>
                <p className="text-sm md:text-base text-[#4A3426] dark:text-[#D4A88E] mb-4">
                  {highlight.description}
                </p>
                <ul className="list-disc ml-4 space-y-2 text-sm md:text-base text-[#4A3426] dark:text-[#D4A88E] flex-1">
                  {highlight.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </WarmCard>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/resume">
              <ModernButton variant="primary" size="md">
                Review My Resume
              </ModernButton>
            </Link>
            <Link href="/contact">
              <ModernButton variant="outline" size="md">
                Start a Conversation
              </ModernButton>
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  </>
  );
}
