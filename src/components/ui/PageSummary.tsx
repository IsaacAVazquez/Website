"use client";

import { motion, useReducedMotion } from "framer-motion";
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
  // Framer entrances must respect prefers-reduced-motion — the global CSS
  // guard does not stop JS-driven animation (DESIGN_CHECKLIST.md, Motion).
  const reduceMotion = useReducedMotion();
  const entrance = reduceMotion
    ? { initial: false as const }
    : { initial: { opacity: 0, y: 20 } };

  if (variant === "compact") {
    return (
      <div className={`mb-8 ${className}`}>
        {title && (
          <h2 className="text-lg font-semibold text-[var(--home-ink)] mb-3">
            {title}
          </h2>
        )}
        <div className="editorial-body text-[var(--home-ink-muted)]">
          {summary}
        </div>
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <motion.div
        {...entrance}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`card bg-[var(--home-paper-alt)] border-l-4 border-l-[var(--home-signal)] ${className}`}
      >
        {title && (
          <div className="flex items-center gap-3 mb-4">
            {showIcon && (
              <IconSparkles className="w-6 h-6 text-[var(--home-ink)]" aria-hidden="true" />
            )}
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--home-ink)]">
              {title}
            </h2>
          </div>
        )}

        {/* TL;DR Section */}
        {tldr && (
          <div className="mb-6 pl-4 border-l-2 border-l-[var(--home-signal)]">
            <p className="text-xs font-semibold text-[var(--home-signal)] uppercase tracking-wider mb-1">
              TL;DR
            </p>
            <div className="text-lg font-medium text-[var(--home-ink)] leading-relaxed">
              {tldr}
            </div>
          </div>
        )}

        {/* Main Summary */}
        <div className="editorial-body text-[var(--home-ink-muted)] space-y-4 mb-6">
          {summary}
        </div>

        {/* Additional Context */}
        {context && (
          <div className="pt-4 border-t border-[var(--home-rule)]">
            <div className="flex items-start gap-2 text-sm text-[var(--home-ink-soft)]">
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
      {...entrance}
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
            <IconSparkles className="w-5 h-5 text-[var(--home-ink)]" aria-hidden="true" />
          )}
          <h2 className="text-xl md:text-2xl font-bold text-[var(--home-ink)]">
            {title}
          </h2>
        </div>
      )}

      {/* TL;DR Section */}
      {tldr && (
        <div className="mb-4 p-3 bg-[var(--home-paper-alt)] border-l-2 border-l-[var(--home-signal)]">
          <p className="text-xs font-semibold text-[var(--home-ink)] uppercase tracking-wider mb-1">
            TL;DR
          </p>
          <div className="text-base font-medium text-[var(--home-ink)]">
            {tldr}
          </div>
        </div>
      )}

      {/* Main Summary */}
      <div className="editorial-body text-[var(--home-ink-muted)] space-y-3">
        {summary}
      </div>

      {/* Additional Context */}
      {context && (
        <div className="mt-4 pt-4 border-t border-[var(--home-rule)]">
          <div className="text-sm text-[var(--home-ink-soft)]">
            {context}
          </div>
        </div>
      )}
    </motion.div>
  );
}
