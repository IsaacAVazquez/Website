"use client";

import { motion } from "framer-motion";
import { IconSparkles, IconInfoCircle } from "@tabler/icons-react";
import { ReactNode } from "react";

export interface PageSummaryProps {
  title?: string;
  summary: string | ReactNode;
  tldr?: string | ReactNode;
  context?: string | ReactNode;
  variant?: "default" | "compact" | "featured";
  showIcon?: boolean;
  className?: string;
}

/**
 * PageSummary - AI-optimized component for page introductions
 *
 * Provides clear, scannable summaries at the top of pages to help
 * AI systems (ChatGPT, Claude, Perplexity, etc.) understand page content.
 *
 * Features:
 * - Clear TL;DR sections
 * - Structured content hierarchy
 * - Semantic HTML for AI parsing
 * - Multiple variants for different contexts
 */
export function PageSummary({
  title,
  summary,
  tldr,
  context,
  variant = "default",
  showIcon = true,
  className = "",
}: PageSummaryProps) {

  // Compact variant - minimal styling
  if (variant === "compact") {
    return (
      <div className={`mb-8 ${className}`}>
        {title && (
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            {title}
          </h2>
        )}
        <div className="editorial-body text-neutral-700 dark:text-neutral-300">
          {summary}
        </div>
      </div>
    );
  }

  // Featured variant - prominent display
  if (variant === "featured") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`pentagram-card bg-neutral-50 dark:bg-neutral-900 border-l-4 border-neutral-900 dark:border-neutral-100 ${className}`}
      >
        {title && (
          <div className="flex items-center gap-3 mb-4">
            {showIcon && (
              <IconSparkles className="w-6 h-6 text-neutral-900 dark:text-neutral-100" aria-hidden="true" />
            )}
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              {title}
            </h2>
          </div>
        )}

        {/* TL;DR Section */}
        {tldr && (
          <div className="mb-6 p-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-sm">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-2">
              TL;DR
            </p>
            <div className="text-lg font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed">
              {tldr}
            </div>
          </div>
        )}

        {/* Main Summary */}
        <div className="editorial-body text-neutral-700 dark:text-neutral-300 space-y-4 mb-6">
          {summary}
        </div>

        {/* Additional Context */}
        {context && (
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <IconInfoCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div>{context}</div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Default variant - standard card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`pentagram-card ${className}`}
      role="region"
      aria-label={title || "Page Summary"}
    >
      {/* Title */}
      {title && (
        <div className="flex items-center gap-3 mb-4">
          {showIcon && (
            <IconSparkles className="w-5 h-5 text-neutral-900 dark:text-neutral-100" aria-hidden="true" />
          )}
          <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {title}
          </h2>
        </div>
      )}

      {/* TL;DR Section */}
      {tldr && (
        <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-900 border-l-2 border-neutral-900 dark:border-neutral-100">
          <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-1">
            TL;DR
          </p>
          <div className="text-base font-medium text-neutral-900 dark:text-neutral-100">
            {tldr}
          </div>
        </div>
      )}

      {/* Main Summary */}
      <div className="editorial-body text-neutral-700 dark:text-neutral-300 space-y-3">
        {summary}
      </div>

      {/* Additional Context */}
      {context && (
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {context}
          </div>
        </div>
      )}
    </motion.div>
  );
}
