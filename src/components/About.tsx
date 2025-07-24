"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Paragraph } from "@/components/ui/Paragraph";
import { GlassCard } from "@/components/ui/GlassCard";
import { JourneyTimeline } from "@/components/ui/JourneyTimeline";
import { 
  IconUser, 
  IconTimeline
} from "@tabler/icons-react";

type TabType = "overview" | "journey";

export default function About() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: IconUser },
    { id: "journey", label: "Journey", icon: IconTimeline }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewContent />;
      case "journey":
        return <JourneyTimeline />;
      default:
        return <OverviewContent />;
    }
  };

  return (
    <section className="relative z-10 min-h-screen py-20 px-6 md:px-8 bg-gradient-to-br from-slate-900/40 via-slate-800/20 to-slate-700/10">
      {/* Simplified Background Effects */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 245, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 245, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>
      
      {/* Subtle Particles */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-electric-blue/60 rounded-full"
            style={{
              left: `${(i * 15 + 10) % 90}%`,
              top: `${(i * 20 + 15) % 80}%`,
            }}
            animate={{
              y: [-10, 10],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4 font-heading">
            About Isaac Vazquez
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto">
            Product Strategist • Business Leader • UC Berkeley Haas MBA • Technical Executive • Austin ↔ Bay Area
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="flex flex-wrap justify-center bg-terminal-bg/30 p-2 rounded-2xl border border-electric-blue/20 backdrop-blur-md">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-electric-blue/20 text-electric-blue shadow-lg border border-electric-blue/40'
                    : 'text-slate-400 hover:text-electric-blue hover:bg-electric-blue/5'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </section>
  );
}


const OverviewContent = () => {
  return (
    <div className="space-y-12">
      {/* Personal Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto"
      >
        <GlassCard
          elevation={4}
          interactive={true}
          cursorGlow={true}
          noiseTexture={true}
          className="p-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/10 to-matrix-green/10 breathing-gradient" />
          
          <div className="relative z-10 space-y-6">
            <Paragraph className="text-lg md:text-xl text-slate-300 leading-relaxed">
              Hi, I'm Isaac — a product strategist and business leader who solves complex problems at the intersection of technology, strategy, and impact. With 6+ years of experience building and leading teams that deliver quality at scale across Austin and California markets, I've helped safeguard systems serving 60M+ users while driving product innovation and business growth.
            </Paragraph>

            <Paragraph className="text-slate-300 leading-relaxed">
              From Austin-based civic tech to Silicon Valley-style innovation, I've led cross-functional product teams, developed strategic business frameworks, and shipped reliable platforms under pressure. My expertise spans technical product management, business strategy development, and organizational leadership — combining deep technical knowledge with strategic business thinking to drive measurable results across Texas and California markets.
            </Paragraph>

            <Paragraph className="text-slate-300 leading-relaxed">
              Currently pursuing my MBA at UC Berkeley's Haas School of Business, I'm developing advanced capabilities in product strategy, business leadership, and innovation management. As a Consortium Fellow, I'm exploring how strategic business thinking, product management excellence, and leadership development can solve mission-critical challenges from Silicon Valley to emerging global markets.
            </Paragraph>

            <Paragraph className="text-slate-300 leading-relaxed">
              Beyond technology, I'm passionate about developing future business leaders, building strategic partnerships, and creating products that empower communities. Whether I'm hiking trails or networking in California's innovation ecosystem, I bring strategic thinking, leadership excellence, and a drive to build businesses that create lasting impact across both coasts.
            </Paragraph>
          </div>
        </GlassCard>
      </motion.div>

    </div>
  );
};

