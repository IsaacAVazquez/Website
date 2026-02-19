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

export function PageSummary({
  title,
  summary,
  tldr,
  context,
  variant = "default",
  showIcon = true,
  className = "",
}: PageSummaryProps) {

  if (variant === "compact") {
    return (
      <div className={`mb-8 ${className}`}>
        {title && (
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
            {title}
          </h2>
        )}
        <div className="editorial-body text-[var(--text-secondary)]">
          {summary}
        </div>
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`card bg-[var(--surface-secondary)] border-l-4 border-l-[var(--color-primary)] ${className}`}
      >
        {title && (
          <div className="flex items-center gap-3 mb-4">
            {showIcon && (
              <IconSparkles className="w-6 h-6 text-[var(--text-primary)]" aria-hidden="true" />
            )}
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
              {title}
            </h2>
          </div>
        )}

        {/* TL;DR Section */}
        {tldr && (
          <div className="mb-6 pl-4 border-l-2 border-l-[var(--color-primary)]">
            <p className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-1">
              TL;DR
            </p>
            <div className="text-lg font-medium text-[var(--text-primary)] leading-relaxed">
              {tldr}
            </div>
          </div>
        )}

        {/* Main Summary */}
        <div className="editorial-body text-[var(--text-secondary)] space-y-4 mb-6">
          {summary}
        </div>

        {/* Additional Context */}
        {context && (
          <div className="pt-4 border-t border-[var(--border-primary)]">
            <div className="flex items-start gap-2 text-sm text-[var(--text-tertiary)]">
              <IconInfoCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div>{context}</div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`card ${className}`}
      role="region"
      aria-label={title || "Page Summary"}
    >
      {/* Title */}
      {title && (
        <div className="flex items-center gap-3 mb-4">
          {showIcon && (
            <IconSparkles className="w-5 h-5 text-[var(--text-primary)]" aria-hidden="true" />
          )}
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            {title}
          </h2>
        </div>
      )}

      {/* TL;DR Section */}
      {tldr && (
        <div className="mb-4 p-3 bg-[var(--surface-secondary)] border-l-2 border-l-[var(--color-primary)]">
          <p className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-1">
            TL;DR
          </p>
          <div className="text-base font-medium text-[var(--text-primary)]">
            {tldr}
          </div>
        </div>
      )}

      {/* Main Summary */}
      <div className="editorial-body text-[var(--text-secondary)] space-y-3">
        {summary}
      </div>

      {/* Additional Context */}
      {context && (
        <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
          <div className="text-sm text-[var(--text-tertiary)]">
            {context}
          </div>
        </div>
      )}
    </motion.div>
  );
}
