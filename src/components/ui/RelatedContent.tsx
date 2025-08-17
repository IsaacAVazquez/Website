"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { IconArrowRight, IconStar, IconTrendingUp } from "@tabler/icons-react";
import { GlassCard } from "./GlassCard";

interface RelatedItem {
  title: string;
  description: string;
  href: string;
  category: "blog" | "project" | "fantasy" | "portfolio";
  featured?: boolean;
  external?: boolean;
}

interface RelatedContentProps {
  title?: string;
  items: RelatedItem[];
  className?: string;
  layout?: "grid" | "list";
  showCategory?: boolean;
}

const categoryConfig = {
  blog: {
    color: "text-electric-blue",
    borderColor: "border-electric-blue/20 hover:border-electric-blue/50",
    bgColor: "bg-electric-blue/5",
    icon: "📄"
  },
  project: {
    color: "text-matrix-green", 
    borderColor: "border-matrix-green/20 hover:border-matrix-green/50",
    bgColor: "bg-matrix-green/5",
    icon: "🛠️"
  },
  fantasy: {
    color: "text-neon-purple",
    borderColor: "border-neon-purple/20 hover:border-neon-purple/50", 
    bgColor: "bg-neon-purple/5",
    icon: "🏈"
  },
  portfolio: {
    color: "text-cyber-teal",
    borderColor: "border-cyber-teal/20 hover:border-cyber-teal/50",
    bgColor: "bg-cyber-teal/5", 
    icon: "👤"
  }
};

export function RelatedContent({ 
  title = "Related Content",
  items,
  className = "",
  layout = "grid",
  showCategory = true
}: RelatedContentProps) {
  if (!items.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`space-y-6 ${className}`}
    >
      {/* Section Header */}
      <div className="flex items-center space-x-3">
        <h2 className="text-xl font-bold text-electric-blue font-heading uppercase tracking-wider">
          {title}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-electric-blue/30 to-transparent"></div>
      </div>

      {/* Content Grid/List */}
      <div className={
        layout === "grid" 
          ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" 
          : "space-y-3"
      }>
        {items.map((item, index) => {
          const config = categoryConfig[item.category];
          
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <GlassCard
                elevation={2}
                interactive={true}
                className={`p-4 h-full border ${config.borderColor} transition-all duration-300 group hover:${config.bgColor}`}
              >
                <Link 
                  href={item.href}
                  className="block h-full focus-ring rounded-lg"
                  {...(item.external && { 
                    target: "_blank", 
                    rel: "noopener noreferrer" 
                  })}
                >
                  <div className="flex flex-col h-full">
                    {/* Header with category and featured indicator */}
                    <div className="flex items-center justify-between mb-3">
                      {showCategory && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{config.icon}</span>
                          <span className={`text-xs font-mono uppercase tracking-wider ${config.color}`}>
                            {item.category}
                          </span>
                        </div>
                      )}
                      
                      {item.featured && (
                        <div className="flex items-center space-x-1">
                          <IconStar className="w-4 h-4 text-warning-amber" />
                          <span className="text-xs font-mono text-warning-amber uppercase">Featured</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2 group-hover:text-electric-blue transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    {/* Action indicator */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/30">
                      <span className="text-xs font-mono text-slate-500 group-hover:text-slate-400 transition-colors">
                        {item.external ? 'External Link' : 'Continue Reading'}
                      </span>
                      <IconArrowRight className="w-4 h-4 text-slate-500 group-hover:text-electric-blue transform group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </Link>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Optional trending indicator for dynamic content */}
      {items.some(item => item.featured) && (
        <div className="flex items-center justify-center space-x-2 text-xs font-mono text-slate-500 mt-6">
          <IconTrendingUp className="w-4 h-4" />
          <span>Trending content updated weekly</span>
        </div>
      )}
    </motion.section>
  );
}

// Predefined content collections for easy reuse
export const relatedContentSets = {
  qaEngineering: [
    {
      title: "Complete Guide to QA Engineering",
      description: "Comprehensive overview of QA practices, tools, and methodologies for modern software development.",
      href: "/blog/complete-guide-qa-engineering",
      category: "blog" as const
    },
    {
      title: "Building Reliable Software Systems",
      description: "Learn how to architect and test systems that can handle millions of users with confidence.",
      href: "/blog/building-reliable-software-systems", 
      category: "blog" as const
    },
    {
      title: "Professional Resume",
      description: "6+ years of experience in QA engineering, test automation, and system reliability.",
      href: "/resume",
      category: "portfolio" as const
    }
  ],

  fantasyAnalytics: [
    {
      title: "Fantasy Football Analytics Hub",
      description: "ML-powered player rankings, tier calculations, and advanced analytics tools.",
      href: "/fantasy-football",
      category: "fantasy" as const,
      featured: true
    },
    {
      title: "Mastering Fantasy Football Analytics",
      description: "Deep dive into data science techniques for fantasy football success.",
      href: "/blog/mastering-fantasy-football-analytics",
      category: "blog" as const
    },
    {
      title: "Draft Tracker Tool",
      description: "Interactive draft board with real-time tier updates and strategic insights.",
      href: "/fantasy-football/draft-tracker",
      category: "fantasy" as const
    }
  ],

  dataVisualization: [
    {
      title: "Building AI-Powered Analytics",
      description: "From fantasy football to enterprise - lessons in scaling analytics platforms.",
      href: "/blog/building-ai-powered-analytics-fantasy-football-to-enterprise",
      category: "blog" as const
    },
    {
      title: "Interactive Tier Visualizations",
      description: "D3.js powered charts with real-time data updates and clustering algorithms.",
      href: "/draft-tiers",
      category: "fantasy" as const
    }
  ]
};