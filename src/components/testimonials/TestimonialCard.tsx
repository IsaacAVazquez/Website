"use client";

import { WarmCard } from "@/components/ui/WarmCard";
import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { IconStar, IconUser, IconBuilding, IconQuote } from "@tabler/icons-react";
import type { Testimonial } from "@/constants/testimonials";

interface TestimonialCardProps {
  testimonial: Testimonial;
  variant?: 'default' | 'compact' | 'featured';
  showProject?: boolean;
}

export function TestimonialCard({ 
  testimonial, 
  variant = 'default',
  showProject = true 
}: TestimonialCardProps) {
  const getCategoryColor = (category: Testimonial['category']) => {
    switch (category) {
      case 'qa-engineering':
        return 'electric';
      case 'fantasy-football':
        return 'matrix';
      case 'software-development':
        return 'cyber';
      case 'collaboration':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getCategoryLabel = (category: Testimonial['category']) => {
    switch (category) {
      case 'qa-engineering':
        return 'QA Engineering';
      case 'fantasy-football':
        return 'Fantasy Football';
      case 'software-development':
        return 'Software Development';
      case 'collaboration':
        return 'Collaboration';
      default:
        return category;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <IconStar
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? 'text-warning-amber fill-warning-amber'
            : 'text-slate-300 dark:text-slate-600'
        }`}
      />
    ));
  };

  if (variant === 'compact') {
    return (
      <WarmCard hover={false} padding="md" className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <IconQuote className="w-4 h-4 text-electric-blue flex-shrink-0" />
                <div className="flex">{renderStars(testimonial.rating)}</div>
              </div>
              <Paragraph size="sm" className="text-slate-600 dark:text-slate-400 line-clamp-3">
                "{testimonial.content}"
              </Paragraph>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {testimonial.name}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {testimonial.role} at {testimonial.company}
              </p>
            </div>
            <Badge variant={getCategoryColor(testimonial.category)} size="sm">
              {getCategoryLabel(testimonial.category)}
            </Badge>
          </div>
        </div>
      </WarmCard>
    );
  }

  if (variant === 'featured') {
    return (
      <WarmCard hover={false} padding="md" className="p-8 relative overflow-hidden">
        {/* Featured Badge */}
        <div className="absolute top-4 right-4">
          <Badge variant="electric" size="sm">
            Featured
          </Badge>
        </div>
        
        <div className="space-y-6">
          {/* Quote */}
          <div className="relative">
            <IconQuote className="absolute -top-2 -left-2 w-8 h-8 text-electric-blue/20" />
            <Paragraph size="lg" className="text-slate-700 dark:text-slate-300 italic pl-6">
              "{testimonial.content}"
            </Paragraph>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex">{renderStars(testimonial.rating)}</div>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {testimonial.rating}/5 stars
            </span>
          </div>

          {/* Author Info */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div>
                <Heading level={4} className="text-slate-900 dark:text-slate-100">
                  {testimonial.name}
                </Heading>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <IconUser className="w-4 h-4" />
                  <span>{testimonial.role}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <IconBuilding className="w-4 h-4" />
                  <span>{testimonial.company}</span>
                </div>
              </div>
              
              {showProject && testimonial.project && (
                <div className="pt-2">
                  <Badge variant="outline" size="sm">
                    Project: {testimonial.project}
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <Badge variant={getCategoryColor(testimonial.category)} size="sm">
                {getCategoryLabel(testimonial.category)}
              </Badge>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {new Date(testimonial.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </WarmCard>
    );
  }

  // Default variant
  return (
    <WarmCard hover={false} padding="md" className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex">{renderStars(testimonial.rating)}</div>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {testimonial.rating}/5
            </span>
          </div>
          <Badge variant={getCategoryColor(testimonial.category)} size="sm">
            {getCategoryLabel(testimonial.category)}
          </Badge>
        </div>

        {/* Quote */}
        <div className="relative">
          <IconQuote className="absolute -top-1 -left-1 w-6 h-6 text-electric-blue/30" />
          <Paragraph className="text-slate-700 dark:text-slate-300 pl-5">
            "{testimonial.content}"
          </Paragraph>
        </div>

        {/* Author */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {testimonial.name}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {testimonial.role} at {testimonial.company}
              </p>
              {showProject && testimonial.project && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Project: {testimonial.project}
                </p>
              )}
            </div>
            <div className="text-right text-xs text-slate-500 dark:text-slate-400">
              {new Date(testimonial.date).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </WarmCard>
  );
}