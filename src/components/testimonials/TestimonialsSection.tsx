"use client";

import { useState } from "react";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { Badge } from "@/components/ui/Badge";
import { ModernButton } from "@/components/ui/ModernButton";
import { TestimonialCard } from "./TestimonialCard";
import { testimonials, getFeaturedTestimonials, getTestimonialsByCategory } from "@/constants/testimonials";
import type { Testimonial } from "@/constants/testimonials";
import { IconStar, IconUsers, IconTrendingUp } from "@tabler/icons-react";

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  category?: Testimonial['category'] | 'all';
  variant?: 'default' | 'compact' | 'featured';
  showFilters?: boolean;
  maxItems?: number;
  showStats?: boolean;
}

export function TestimonialsSection({
  title = "Client Testimonials",
  subtitle = "What people are saying about working with Isaac",
  category = 'all',
  variant = 'default',
  showFilters = true,
  maxItems = 6,
  showStats = true
}: TestimonialsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<Testimonial['category'] | 'all'>(category);
  const [showAll, setShowAll] = useState(false);

  const categories = [
    { id: 'all' as const, label: 'All Testimonials', icon: IconUsers },
    { id: 'qa-engineering' as const, label: 'QA Engineering', icon: IconStar },
    { id: 'fantasy-football' as const, label: 'Fantasy Football', icon: IconTrendingUp },
    { id: 'software-development' as const, label: 'Development', icon: IconStar },
    { id: 'collaboration' as const, label: 'Collaboration', icon: IconUsers }
  ];

  const getFilteredTestimonials = () => {
    if (selectedCategory === 'all') {
      return variant === 'featured' ? getFeaturedTestimonials() : testimonials;
    }
    return getTestimonialsByCategory(selectedCategory);
  };

  const filteredTestimonials = getFilteredTestimonials();
  const displayedTestimonials = showAll 
    ? filteredTestimonials 
    : filteredTestimonials.slice(0, maxItems);

  // Statistics
  const stats = {
    total: testimonials.length,
    averageRating: testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length,
    categories: {
      'qa-engineering': getTestimonialsByCategory('qa-engineering').length,
      'fantasy-football': getTestimonialsByCategory('fantasy-football').length,
      'software-development': getTestimonialsByCategory('software-development').length,
      'collaboration': getTestimonialsByCategory('collaboration').length
    }
  };

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <Heading level={2} className="mb-4">
          {title}
        </Heading>
        <Paragraph size="lg" className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
          {subtitle}
        </Paragraph>
      </div>

      {/* Statistics */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50/50 dark:bg-slate-800/25 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
            <div className="text-2xl font-bold text-electric-blue">{stats.total}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Reviews</div>
          </div>
          <div className="text-center p-4 bg-slate-50/50 dark:bg-slate-800/25 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
            <div className="text-2xl font-bold text-matrix-green">{stats.averageRating.toFixed(1)}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Average Rating</div>
          </div>
          <div className="text-center p-4 bg-slate-50/50 dark:bg-slate-800/25 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
            <div className="text-2xl font-bold text-cyber-teal">{stats.categories['qa-engineering']}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">QA Projects</div>
          </div>
          <div className="text-center p-4 bg-slate-50/50 dark:bg-slate-800/25 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
            <div className="text-2xl font-bold text-warning-amber">{stats.categories['fantasy-football']}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Analytics Projects</div>
          </div>
        </div>
      )}

      {/* Category Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const count = cat.id === 'all' ? stats.total : stats.categories[cat.id as keyof typeof stats.categories] || 0;
            
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? 'transform scale-105'
                    : 'hover:scale-105'
                }`}
              >
                <Badge
                  variant={selectedCategory === cat.id ? 'electric' : 'outline'}
                  size="md"
                  className="cursor-pointer"
                >
                  <span className="flex items-center gap-1">
                    <Icon className="w-4 h-4" />
                    {cat.label}
                    <span className="ml-1 text-xs opacity-75">({count})</span>
                  </span>
                </Badge>
              </button>
            );
          })}
        </div>
      )}

      {/* Testimonials Grid */}
      {displayedTestimonials.length > 0 ? (
        <div className={`grid gap-6 ${
          variant === 'compact' 
            ? 'md:grid-cols-2 lg:grid-cols-3' 
            : variant === 'featured'
            ? 'lg:grid-cols-2'
            : 'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {displayedTestimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              variant={variant}
              showProject={variant !== 'compact'}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Paragraph className="text-slate-600 dark:text-slate-400">
            No testimonials found for the selected category.
          </Paragraph>
        </div>
      )}

      {/* Show More/Less Button */}
      {filteredTestimonials.length > maxItems && (
        <div className="text-center">
          <ModernButton
            onClick={() => setShowAll(!showAll)}
            variant="outline"
            size="md"
          >
            {showAll 
              ? `Show Less` 
              : `Show All ${filteredTestimonials.length} Testimonials`
            }
          </ModernButton>
        </div>
      )}

      {/* Social Proof Summary */}
      {variant === 'featured' && (
        <div className="text-center py-8 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="max-w-2xl mx-auto">
            <Heading level={3} className="mb-2">
              Trusted by Teams Across Austin & Beyond
            </Heading>
            <Paragraph className="text-slate-600 dark:text-slate-400 mb-4">
              From startups to enterprise companies, Isaac delivers reliable QA engineering 
              and analytics solutions that drive results.
            </Paragraph>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <IconStar className="w-4 h-4 text-warning-amber" />
                <span>{stats.averageRating.toFixed(1)}/5.0 Average Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <IconUsers className="w-4 h-4 text-electric-blue" />
                <span>{stats.total}+ Happy Clients</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}