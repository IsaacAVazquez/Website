"use client";

import { Heading } from "@/components/ui/Heading";
import { motion } from "framer-motion";
import { 
  IconTrendingUp, 
  IconChartBar, 
  IconTarget, 
  IconBookmark,
  IconClock,
  IconExternalLink,
  IconStar,
  IconUsers,
  IconBrain,
  IconFilter,
  IconX
} from "@tabler/icons-react";
import { WarmCard } from "@/components/ui/WarmCard";
import { Badge } from "@/components/ui/Badge";
import { ModernButton } from "@/components/ui/ModernButton";
import Link from "next/link";
import { BlogPost } from "@/lib/blog";
import { useState, useMemo } from "react";

interface FantasyContentGridProps {
  posts: BlogPost[];
}

// Define category themes and icons
const categoryThemes: Record<string, { 
  color: string; 
  icon: React.ComponentType<{ className?: string }>; 
  bgGradient: string;
}> = {
  "Fantasy Football Analytics": {
    color: "from-electric-blue to-cyber-teal",
    icon: IconChartBar,
    bgGradient: "from-electric-blue/20 to-cyber-teal/20"
  },
  "Fantasy Football Strategy": {
    color: "from-matrix-green to-electric-blue",
    icon: IconTarget,
    bgGradient: "from-matrix-green/20 to-electric-blue/20"
  },
  "Draft Strategy": {
    color: "from-neon-purple to-matrix-green",
    icon: IconTrendingUp,
    bgGradient: "from-neon-purple/20 to-matrix-green/20"
  },
  "Data Science": {
    color: "from-warning-amber to-electric-blue",
    icon: IconBrain,
    bgGradient: "from-warning-amber/20 to-electric-blue/20"
  },
  "default": {
    color: "from-slate-600 to-slate-800",
    icon: IconBookmark,
    bgGradient: "from-slate-600/20 to-slate-800/20"
  }
};

// Get layout type based on content priority
function getLayoutType(post: BlogPost, index: number): "featured" | "normal" | "small" {
  if (post.featured && index < 2) return "featured";
  if (index < 6) return "normal";
  return "small";
}

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
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  },
};

export function FantasyContentGrid({ posts }: FantasyContentGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique categories and tags
  const categories = useMemo(() => {
    const cats = Array.from(new Set(posts.map(post => post.category).filter(Boolean)));
    return ['All', ...cats.sort()];
  }, [posts]);

  const tags = useMemo(() => {
    const allTags = Array.from(new Set(posts.flatMap(post => post.tags || []).filter(Boolean)));
    return ['All', ...allTags.sort()];
  }, [posts]);

  // Filter posts based on selected category and tag
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const categoryMatch = selectedCategory === 'All' || post.category === selectedCategory;
      const tagMatch = selectedTag === 'All' || (post.tags && post.tags.includes(selectedTag));
      return categoryMatch && tagMatch;
    });
  }, [posts, selectedCategory, selectedTag]);

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedTag('All');
  };

  return (
    <>
      <div className="mb-12">
        <Heading className="font-heading font-black text-5xl mb-4 tracking-tight gradient-text">
          Fantasy Football Writing
        </Heading>
        <p className="text-lg text-secondary max-w-3xl mb-8">
          Deep dives into fantasy football analytics, strategy, and data science. 
          From draft preparation to advanced statistical modeling, explore the intersection of sports and technology.
        </p>

        {/* Filter Toggle and Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <ModernButton 
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <IconFilter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </ModernButton>
            
            {(selectedCategory !== 'All' || selectedTag !== 'All') && (
              <ModernButton 
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <IconX className="h-4 w-4 mr-2" />
                Clear Filters
              </ModernButton>
            )}
          </div>
          
          <div className="text-sm text-slate-400">
            Showing {filteredPosts.length} of {posts.length} articles
          </div>
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <WarmCard hover={false} padding="md" elevation={2} className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Category Filter */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">Filter by Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                          selectedCategory === category
                            ? 'bg-electric-blue/20 text-electric-blue border-electric-blue/50'
                            : 'bg-terminal-bg/50 text-slate-400 border-terminal-border hover:border-electric-blue/30 hover:text-electric-blue'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tag Filter */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">Filter by Topic</h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 8).map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                          selectedTag === tag
                            ? 'bg-matrix-green/20 text-matrix-green border-matrix-green/50'
                            : 'bg-terminal-bg/50 text-slate-400 border-terminal-border hover:border-matrix-green/30 hover:text-matrix-green'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                    {tags.length > 8 && (
                      <span className="px-3 py-1 text-xs text-slate-400">
                        +{tags.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </WarmCard>
          </motion.div>
        )}
      </div>

      {/* Bento Box Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[200px]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {filteredPosts.map((post, index) => {
          const layoutType = getLayoutType(post, index);
          const theme = categoryThemes[post.category || 'default'] || categoryThemes.default;
          const Icon = theme.icon;
          
          const gridClass = 
            layoutType === "featured" 
              ? "md:col-span-2 md:row-span-2" 
              : layoutType === "normal"
              ? "md:row-span-2"
              : "md:row-span-1";

          return (
            <motion.div key={post.slug} variants={itemVariants}>
              <Link href={`/writing/${post.slug}`} className="block h-full">
                <WarmCard hover={false} padding="md"
                  elevation={layoutType === "featured" ? 4 : 3}
                  interactive={true}
                  cursorGlow={true}
                  noiseTexture={true}
                  floating={layoutType === "featured"}
                  className={`${gridClass} overflow-hidden group`}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />
                  
                  {/* Content */}
                  <div className="relative h-full p-6 flex flex-col">
                    {/* Header with Icon and Badges */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-8 w-8 text-electric-blue" />
                        {post.featured && (
                          <Badge variant="electric" size="sm" glow>
                            <IconStar className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center">
                        <IconClock className="h-3 w-3 mr-1" />
                        {post.readingTime}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-heading font-bold text-xl mb-3 text-primary line-clamp-2 group-hover:text-electric-blue transition-colors">
                      {post.title}
                    </h3>
                    
                    <p className="text-sm text-secondary mb-4 flex-grow line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>

                    {/* Category Badge */}
                    <div className="mb-4">
                      <Badge variant="outline" size="sm">
                        {post.category}
                      </Badge>
                    </div>

                    {/* Tags - show for featured/normal only */}
                    {layoutType !== "small" && post.tags && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, layoutType === "featured" ? 4 : 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs font-medium rounded-full bg-terminal-bg/80 text-matrix-green border border-matrix-green/20"
                          >
                            {tag}
                          </span>
                        ))}
                        {post.tags && post.tags.length > (layoutType === "featured" ? 4 : 3) && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-terminal-bg/80 text-slate-400">
                            +{post.tags.length - (layoutType === "featured" ? 4 : 3)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer with date and read link */}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-terminal-border">
                      <span className="text-xs text-slate-400">
                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <div className="flex items-center text-xs text-electric-blue font-medium group-hover:text-matrix-green transition-colors">
                        Read Article
                        <IconExternalLink className="h-3 w-3 ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-electric-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </WarmCard>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <WarmCard hover={false} padding="md" elevation={2} className="text-center p-6">
          <IconBookmark className="h-8 w-8 text-electric-blue mx-auto mb-2" />
          <div className="text-2xl font-bold text-white mb-1">
            {filteredPosts.length}
          </div>
          <div className="text-sm text-slate-400">
            {(selectedCategory !== 'All' || selectedTag !== 'All') ? 'Filtered Articles' : 'Total Articles'}
          </div>
        </WarmCard>

        <WarmCard hover={false} padding="md" elevation={2} className="text-center p-6">
          <IconChartBar className="h-8 w-8 text-matrix-green mx-auto mb-2" />
          <div className="text-2xl font-bold text-white mb-1">
            {filteredPosts.filter(p => p.category?.includes('Analytics')).length}
          </div>
          <div className="text-sm text-slate-400">
            Analytics Articles
          </div>
        </WarmCard>

        <WarmCard hover={false} padding="md" elevation={2} className="text-center p-6">
          <IconTarget className="h-8 w-8 text-neon-purple mx-auto mb-2" />
          <div className="text-2xl font-bold text-white mb-1">
            {filteredPosts.filter(p => p.tags && p.tags.includes('Draft Strategy')).length}
          </div>
          <div className="text-sm text-slate-400">
            Strategy Guides
          </div>
        </WarmCard>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-16 text-center"
      >
        <WarmCard hover={false} padding="md" elevation={3} className="p-8 bg-gradient-to-br from-electric-blue/10 to-matrix-green/10 border-electric-blue/30">
          <IconUsers className="h-12 w-12 text-electric-blue mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to Dominate Your League?
          </h3>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Dive deeper into fantasy football analytics with our interactive tools and real-time player data.
            Combine these insights with advanced tier calculations and draft tracking.
          </p>
          <div className="flex justify-center">
            <Badge href="/fantasy-football" variant="electric" glow>
              Explore Analytics Tools
            </Badge>
          </div>
        </WarmCard>
      </motion.div>
    </>
  );
}