"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Paragraph } from "@/components/Paragraph";
import { GlassCard } from "@/components/ui/GlassCard";
import { JourneyTimeline } from "@/components/ui/JourneyTimeline";
import { useTypingAnimation } from "@/hooks/useTypingAnimation";
import { personalMetrics } from "@/constants/personal";
import { 
  IconUser, 
  IconTimeline,
  IconHeart
} from "@tabler/icons-react";

type TabType = "overview" | "journey";

export default function About() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  
  const { displayedText, startTyping } = useTypingAnimation({
    text: personalMetrics.philosophy.qa,
    speed: 30,
    delay: 1000
  });

  const tabs = [
    { id: "overview", label: "Overview", icon: IconUser },
    { id: "journey", label: "Journey", icon: IconTimeline }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewContent displayedText={displayedText} startTyping={startTyping} />;
      case "journey":
        return <JourneyTimeline />;
      default:
        return <OverviewContent displayedText={displayedText} startTyping={startTyping} />;
    }
  };

  return (
    <section className="relative z-10 min-h-screen py-20 px-6 md:px-8 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-700/20">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-electric-blue rounded-full"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 11) % 100}%`,
            }}
            animate={{
              y: [-10, 10],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: i * 0.3,
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
            QA Engineer • Data Whisperer • Civic Tech Advocate
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

interface OverviewContentProps {
  displayedText: string;
  startTyping: () => void;
}

const OverviewContent = ({ displayedText, startTyping }: OverviewContentProps) => {
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
              Hi, I'm Isaac. I build reliable, impactful software at the intersection of tech and democracy.
            </Paragraph>

            <Paragraph className="text-slate-300 leading-relaxed">
              My journey started in political organizing and grew into a passion for civic technology. As a QA Engineer and product builder, I obsess over every detail—because building trustworthy tools isn't just about code, it's about empowering real people.
            </Paragraph>

            <Paragraph className="text-slate-300 leading-relaxed">
              Whether I'm leading cross-functional QA efforts at a political tech startup or collaborating on data-driven product launches, I focus on clarity, accessibility, and creative problem-solving. My career is defined by my commitment to making complex systems understandable and impactful for the communities they serve.
            </Paragraph>

            <Paragraph className="text-slate-300 leading-relaxed">
              Outside of work, you'll find me cooking up new recipes, hiking Texas trails, or volunteering to help organize local elections. I believe in technology's power to build stronger, more representative communities—and I'm just getting started.
            </Paragraph>
          </div>
        </GlassCard>
      </motion.div>

      {/* Philosophy Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-4xl mx-auto"
      >
        <GlassCard
          elevation={4}
          interactive={true}
          cursorGlow={true}
          noiseTexture={true}
          className="p-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-500/10 breathing-gradient" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-400/20 to-pink-500/20">
                <IconHeart className="w-6 h-6 text-neon-purple" />
              </div>
              <h3 className="text-2xl font-bold text-primary">My QA Philosophy</h3>
              <button
                onClick={startTyping}
                className="ml-auto px-4 py-2 rounded-lg bg-neon-purple/20 text-neon-purple text-xs font-terminal hover:bg-neon-purple/30 transition-colors"
              >
                RETYPE
              </button>
            </div>
            
            <div className="text-lg text-slate-300 leading-relaxed font-terminal">
              {displayedText}
              <motion.span
                className="inline-block w-3 h-6 bg-electric-blue ml-1"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

