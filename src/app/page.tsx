"use client";

import { ModernHero } from "@/components/ModernHero";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { motion, AnimatePresence } from "framer-motion";
import { personalMetrics } from "@/constants/personal";
import Image from "next/image";
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
      <div className="flex-1 pb-8">
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

  return (
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
          <div className="min-h-[400px] md:min-h-[600px]">
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
                Product-focused technologist transitioning into product management, bringing 6+ years of experience in quality assurance, data analytics, and technology. At Civitech, I've led testing initiatives for voter engagement platforms, bridging technical execution with strategic product outcomes.
              </p>

              <div>
                <p className="text-[#2D1B12] dark:text-[#FFE4D6] font-semibold mb-3 text-base md:text-lg">
                  Core Competencies:
                </p>
                <ul className="list-disc ml-6 space-y-3 text-[#4A3426] dark:text-[#D4A88E] text-base md:text-lg">
                  <li><strong className="text-[#2D1B12] dark:text-[#FFE4D6]">Product & Strategy:</strong> User experience optimization, feature prioritization, cross-functional collaboration, stakeholder management</li>
                  <li><strong className="text-[#2D1B12] dark:text-[#FFE4D6]">Technical:</strong> Test automation (Cypress), SQL, data analysis, API testing, Agile/Scrum methodologies</li>
                  <li><strong className="text-[#2D1B12] dark:text-[#FFE4D6]">Analytics:</strong> Data-driven decision making, metrics definition, A/B testing, performance optimization</li>
                  <li><strong className="text-[#2D1B12] dark:text-[#FFE4D6]">Leadership:</strong> Team mentorship, project management, diverse community advocacy</li>
                </ul>
              </div>

              <p className="text-base md:text-lg text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
                At the State of Florida, I analyzed large datasets to inform policy decisions, developing dashboards and reports that improved operational efficiency. As Client Services Manager at Open Progress, I managed digital campaigns for progressive causes, translating client needs into actionable strategies.
              </p>

              <p className="text-base md:text-lg text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
                Currently pursuing an MBA at UC Berkeley Haas to deepen my product management expertise and explore venture capital opportunities in civic tech, SaaS, and mission-driven startups. Passionate about leveraging technology to create social impact and democratize access to essential services.
              </p>

              <p className="text-base md:text-lg text-[#2D1B12] dark:text-[#FFE4D6] leading-relaxed font-medium">
                Let's connect if you're interested in technology, product strategy, or social impact.
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
      </div>
    </div>
  );
}