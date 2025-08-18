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
    <>
      {/* Page Header Banner */}
      <header role="banner" className="relative z-20 bg-gradient-to-r from-terminal-bg via-slate-900 to-terminal-bg border-b border-electric-blue/20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-bold gradient-text mb-2 font-heading">
              About Isaac Vazquez
            </h1>
            <p className="text-slate-300 text-lg">
              Product Manager • UC Berkeley MBA • Technical Foundation
            </p>
          </motion.div>
        </div>
      </header>

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
    </>
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
              Hi, I'm Isaac — a product manager with a unique technical foundation. I'm passionate about building products that users love and businesses value, bridging the gap between engineering excellence and strategic vision.
            </Paragraph>
            
            <Paragraph className="text-slate-300 leading-relaxed">
              Currently pursuing my MBA at UC Berkeley Haas, I'm developing world-class product management skills while leveraging 6+ years of technical experience. I've contributed to products serving 60M+ users across Austin and California markets, giving me deep insight into both user needs and technical constraints.
            </Paragraph>

            <Paragraph className="text-slate-300 leading-relaxed">
              My product journey spans Austin civic tech to Silicon Valley innovation. I've collaborated closely with engineering teams while developing business strategy frameworks. I understand what it takes to ship products that perform under pressure.
            </Paragraph>
            
            <Paragraph className="text-slate-300 leading-relaxed">
              <strong>My unique product management foundation:</strong>
            </Paragraph>
            <ul className="list-disc ml-6 space-y-2 text-slate-300">
              <li>Technical product management with engineering credibility</li>
              <li>Cross-functional team leadership and stakeholder management</li>
              <li>Data-driven decision making and product analytics</li>
              <li>User-centered design thinking and problem solving</li>
              <li>Strategic business planning and market analysis</li>
            </ul>
            
            <Paragraph className="text-slate-300 leading-relaxed">
              This technical foundation gives me a competitive edge in product management — I can speak engineering languages while thinking strategically about user value and business outcomes.
            </Paragraph>

            <Paragraph className="text-slate-300 leading-relaxed">
              At UC Berkeley's Haas School of Business, I'm developing advanced product management and strategic leadership capabilities. My MBA coursework in product strategy, innovation management, and business analytics directly complements my technical background.
            </Paragraph>
            
            <Paragraph className="text-slate-300 leading-relaxed">
              As a Consortium Fellow, I'm exploring how technical product managers can drive innovation at scale. I'm particularly interested in how data-driven product decisions and user research can create breakthrough products from Silicon Valley to emerging global markets.
            </Paragraph>

            <Paragraph className="text-slate-300 leading-relaxed">
              Beyond product management, I'm passionate about mentoring aspiring technical PMs and contributing to the product community. I believe the best products come from teams that understand both user needs and technical possibilities.
            </Paragraph>
            
            <Paragraph className="text-slate-300 leading-relaxed">
              Whether hiking Austin trails or networking in California's innovation ecosystem, I'm constantly learning about product strategy and user behavior. My goal: become a product leader who builds experiences that genuinely improve people's lives while driving sustainable business growth.
            </Paragraph>
          </div>
        </GlassCard>
      </motion.div>

    </div>
  );
};

