"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { IconArrowRight, IconStar, IconTrendingUp } from "@tabler/icons-react";
import { WarmCard } from "./WarmCard";

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
    color: "text-blue-500",
    borderColor: "border-blue-500/20 hover:border-blue-500/50",
    bgColor: "bg-blue-500/5",
    icon: "📄"
  },
  project: {
    color: "text-emerald-500",
    borderColor: "border-emerald-500/20 hover:border-emerald-500/50",
    bgColor: "bg-emerald-500/5",
    icon: "🛠️"
  },
  fantasy: {
    color: "text-violet-500",
    borderColor: "border-violet-500/20 hover:border-violet-500/50",
    bgColor: "bg-violet-500/5",
    icon: "🏈"
  },
  portfolio: {
    color: "text-cyan-500",
    borderColor: "border-cyan-500/20 hover:border-cyan-500/50",
    bgColor: "bg-cyan-500/5",
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
        <h2 className="text-xl font-bold text-[var(--color-secondary)] uppercase tracking-wider">
          {title}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-[var(--color-secondary)]/30 to-transparent"></div>
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
              <WarmCard hover={false} padding="md"
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
                          <IconStar className="w-4 h-4 text-[var(--color-warning)]" />
                          <span className="text-xs font-mono text-[var(--color-warning)] uppercase">Featured</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-[var(--color-secondary)] transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    {/* Action indicator */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-200/30 dark:border-neutral-700/30">
                      <span className="text-xs font-mono text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-400 transition-colors">
                        {item.external ? 'External Link' : 'Continue Reading'}
                      </span>
                      <IconArrowRight className="w-4 h-4 text-neutral-500 dark:text-neutral-500 group-hover:text-[var(--color-secondary)] transform group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </Link>
              </WarmCard>
            </motion.div>
          );
        })}
      </div>

      {/* Optional trending indicator for dynamic content */}
      {items.some(item => item.featured) && (
        <div className="flex items-center justify-center space-x-2 text-xs font-mono text-neutral-500 dark:text-neutral-500 mt-6">
          <IconTrendingUp className="w-4 h-4" />
          <span>Trending content updated weekly</span>
        </div>
      )}
    </motion.section>
  );
}

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
      title: "Interactive Fantasy Football Tools",
      description: "Real-time player rankings with advanced clustering algorithms and data visualization.",
      href: "/fantasy-football",
      category: "fantasy" as const
    }
  ]
};
