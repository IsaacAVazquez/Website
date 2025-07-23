"use client";

import { Heading } from "@/components/ui/Heading";
import { motion } from "framer-motion";
import { IconTrendingUp, IconTarget, IconChartBar, IconDatabase, IconEye, IconBolt, IconBrain, IconDeviceMobile } from "@tabler/icons-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { MorphButton } from "@/components/ui/MorphButton";
import Link from "next/link";

interface FantasyOffering {
  id: number;
  title: string;
  description: string;
  features: string[];
  type: "featured" | "normal" | "small";
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
  metrics?: string;
  status: "live" | "beta" | "coming-soon";
}

const fantasyOfferings: FantasyOffering[] = [
  {
    id: 1,
    title: "Interactive Tier Visualizations",
    description: "Advanced clustering algorithms analyze 300+ players across all positions with real-time data visualization",
    features: ["K-Means clustering", "D3.js visualizations", "Real-time data sync", "Position-specific analysis"],
    type: "featured",
    color: "from-electric-blue to-matrix-green",
    icon: IconTrendingUp,
    link: "/fantasy-football",
    metrics: "6-tier system, 92% expert consensus",
    status: "live"
  },
  {
    id: 2,
    title: "Static Tier Pages",
    description: "Clean, fast-loading tier lists optimized for quick reference during drafts",
    features: ["Instant loading", "Mobile optimized", "Printable format", "Position filters"],
    type: "normal",
    color: "from-matrix-green to-cyber-teal",
    icon: IconTarget,
    link: "/fantasy-football/tiers/overall",
    metrics: "Sub-100ms load times",
    status: "live"
  },
  {
    id: 3,
    title: "Draft Command Center",
    description: "Comprehensive draft interface with tier visualization and real-time player tracking",
    features: ["Live tier updates", "Draft position tracking", "Player comparison", "Strategic insights"],
    type: "normal", 
    color: "from-neon-purple to-electric-blue",
    icon: IconChartBar,
    link: "/draft-tiers",
    metrics: "Full draft simulation",
    status: "live"
  },
  {
    id: 4,
    title: "Real-time Data Pipeline",
    description: "Automated data collection and processing from FantasyPros with smart caching",
    features: ["API integration", "Intelligent caching", "Error handling", "Performance optimization"],
    type: "small",
    color: "from-cyber-teal to-matrix-green",
    icon: IconDatabase,
    link: "/fantasy-football",
    metrics: "Daily updates",
    status: "live"
  },
  {
    id: 5,
    title: "Player Analytics",
    description: "Advanced clustering algorithms reveal hidden patterns in player performance data",
    features: ["Machine learning", "Statistical analysis", "Pattern recognition", "Predictive modeling"],
    type: "small",
    color: "from-warning-amber to-error-red",
    icon: IconBrain,
    link: "/fantasy-football",
    metrics: "ML-powered insights",
    status: "live"
  },
  {
    id: 6,
    title: "Mobile-Optimized Experience",
    description: "Responsive design ensures optimal performance across all devices and screen sizes",
    features: ["Touch interactions", "Responsive layouts", "Fast loading", "Offline capable"],
    type: "small",
    color: "from-electric-blue to-neon-purple",
    icon: IconDeviceMobile,
    link: "/fantasy-football",
    metrics: "100% mobile responsive",
    status: "live"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  },
};

export function FantasyFootballLandingContent() {
  return (
    <>
      {/* Hero Section */}
      <div className="mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Heading className="font-heading font-black text-5xl lg:text-6xl mb-6 tracking-tight">
            <span className="gradient-text">Fantasy Football</span>
            <br />
            <span className="text-primary">Command Center</span>
          </Heading>
          <p className="text-xl text-secondary max-w-3xl mb-8">
            Advanced data visualization and analytics tools built with cutting-edge technology. 
            Featuring machine learning algorithms, real-time data processing, and interactive visualizations 
            to give you the competitive edge in fantasy football.
          </p>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-matrix-green rounded-full animate-pulse"></div>
              <span className="text-sm font-mono text-matrix-green">300+ Players Analyzed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-electric-blue rounded-full animate-pulse"></div>
              <span className="text-sm font-mono text-electric-blue">6-Tier Clustering System</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyber-teal rounded-full animate-pulse"></div>
              <span className="text-sm font-mono text-cyber-teal">Real-time Data Sync</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Offerings Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[200px] mb-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {fantasyOfferings.map((offering) => {
          const Icon = offering.icon;
          const gridClass = 
            offering.type === "featured" 
              ? "md:col-span-2 md:row-span-2" 
              : offering.type === "normal"
              ? "md:row-span-2"
              : "md:row-span-1";

          return (
            <motion.div key={offering.id} variants={itemVariants}>
              <GlassCard
                elevation={offering.type === "featured" ? 4 : 3}
                interactive={true}
                cursorGlow={true}
                noiseTexture={true}
                floating={offering.type === "featured"}
                className={`${gridClass} overflow-hidden h-full`}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${offering.color} opacity-10 group-hover:opacity-20 transition-opacity breathing-gradient`} />
                
                {/* Content */}
                <div className="relative h-full p-6 flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-8 w-8 text-electric-blue" />
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          offering.status === 'live' ? 'bg-matrix-green' :
                          offering.status === 'beta' ? 'bg-warning-amber' :
                          'bg-slate-400'
                        } animate-pulse`}></div>
                        <span className={`text-xs font-mono uppercase tracking-wider ${
                          offering.status === 'live' ? 'text-matrix-green' :
                          offering.status === 'beta' ? 'text-warning-amber' :
                          'text-slate-400'
                        }`}>
                          {offering.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-heading font-bold text-xl mb-3 text-primary">
                    {offering.title}
                  </h3>
                  <p className="text-sm text-secondary mb-4 flex-grow">
                    {offering.description}
                  </p>

                  {/* Metrics */}
                  {offering.metrics && (
                    <div className="mb-4">
                      <span className="text-xs font-accent font-semibold text-electric-blue">
                        {offering.metrics}
                      </span>
                    </div>
                  )}

                  {/* Features - only show for featured/normal */}
                  {(offering.type === "featured" || offering.type === "normal") && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {offering.features.slice(0, offering.type === "featured" ? 4 : 2).map((feature) => (
                          <span
                            key={feature}
                            className="px-2 py-1 text-xs font-medium rounded-full bg-terminal-bg/50 border border-electric-blue/20 text-electric-blue"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-auto">
                    <Link href={offering.link}>
                      <MorphButton
                        variant="outline"
                        size="sm"
                        className="w-full justify-center group"
                      >
                        <span>Explore Tool</span>
                        <IconBolt className="h-4 w-4 ml-2 group-hover:text-matrix-green transition-colors" />
                      </MorphButton>
                    </Link>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Technical Showcase Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mb-16"
      >
        <GlassCard elevation={3} className="p-8">
          <div className="text-center mb-8">
            <h2 className="font-heading font-bold text-3xl mb-4 gradient-text">
              Technical Excellence
            </h2>
            <p className="text-lg text-secondary max-w-2xl mx-auto">
              Built with modern web technologies and advanced algorithms to deliver 
              professional-grade fantasy football analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-electric-blue to-matrix-green rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <IconChartBar className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2 text-primary">Data Visualization</h3>
              <p className="text-sm text-secondary">D3.js powered interactive charts with clustering algorithms and real-time updates</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-matrix-green to-cyber-teal rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <IconDatabase className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2 text-primary">Real-time Processing</h3>
              <p className="text-sm text-secondary">Automated data pipeline with smart caching and error handling for optimal performance</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-neon-purple to-electric-blue rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <IconDeviceMobile className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2 text-primary">Mobile Optimization</h3>
              <p className="text-sm text-secondary">Responsive design with touch interactions and offline capabilities for any device</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/fantasy-football">
            <MorphButton
              variant="primary"
              size="lg"
              icon={<IconTrendingUp className="h-5 w-5" />}
              iconPosition="right"
            >
              Explore Interactive Tiers
            </MorphButton>
          </Link>
          <Link href="/draft-tiers">
            <MorphButton
              variant="outline"
              size="lg"
              icon={<IconTarget className="h-5 w-5" />}
              iconPosition="right"
            >
              View Draft Tiers
            </MorphButton>
          </Link>
        </div>
        <p className="mt-6 text-sm text-secondary">
          Experience advanced fantasy football analytics with machine learning and real-time data processing
        </p>
      </motion.div>
    </>
  );
}