"use client";

import { motion } from "framer-motion";
import { IconQuestionMark, IconCheck } from "@tabler/icons-react";
import { ReactNode } from "react";

export interface QAItem {
  question: string;
  answer: string | ReactNode;
  category?: string;
}

export interface QASectionProps {
  title?: string;
  description?: string;
  items: QAItem[];
  variant?: "default" | "compact" | "featured";
  showIcons?: boolean;
  className?: string;
}

/**
 * QASection - AI-optimized Q&A component
 *
 * Displays questions and answers in a format that's easy for AI systems
 * to parse and extract for citations. Follows Google's People Also Ask
 * format and includes proper schema.org microdata.
 *
 * Features:
 * - Semantic HTML with microdata
 * - Clear question/answer structure
 * - AI-friendly formatting
 * - Multiple display variants
 * - Category grouping support
 */
export function QASection({
  title = "Frequently Asked Questions",
  description,
  items,
  variant = "default",
  showIcons = true,
  className = "",
}: QASectionProps) {
  // Group items by category if provided
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, QAItem[]>);

  const categories = Object.keys(groupedItems);

  return (
    <section
      className={`${className}`}
      itemScope
      itemType="https://schema.org/FAQPage"
      aria-labelledby="qa-section-title"
    >
      {/* Header */}
      <div className="mb-8">
        <h2
          id="qa-section-title"
          className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-3"
        >
          {title}
        </h2>
        {description && (
          <p className="text-base text-neutral-600 dark:text-neutral-400 max-w-3xl">
            {description}
          </p>
        )}
      </div>

      {/* Q&A Items */}
      <div className="space-y-6">
        {categories.map((category, categoryIndex) => (
          <div key={category}>
            {categories.length > 1 && (
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {category}
              </h3>
            )}

            <div className="space-y-4">
              {groupedItems[category].map((item, index) => (
                <motion.div
                  key={`${category}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: (categoryIndex * 3 + index) * 0.05 }}
                  className={`
                    ${variant === "compact" ? "p-4" : "p-5 md:p-6"}
                    ${variant === "featured" ? "pentagram-card bg-neutral-50 dark:bg-neutral-900" : "pentagram-card"}
                  `}
                  itemScope
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                >
                  {/* Question */}
                  <div className="flex items-start gap-3 mb-3">
                    {showIcons && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-6 h-6 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center">
                          <IconQuestionMark
                            className="w-4 h-4 text-white dark:text-black"
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                    )}
                    <h3
                      className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-neutral-100"
                      itemProp="name"
                    >
                      {item.question}
                    </h3>
                  </div>

                  {/* Answer */}
                  <div
                    className={`${showIcons ? "ml-9" : ""}`}
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <div
                      className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed editorial-body"
                      itemProp="text"
                    >
                      {typeof item.answer === "string" ? (
                        <p>{item.answer}</p>
                      ) : (
                        item.answer
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Citation-friendly summary */}
      <div className="sr-only" aria-hidden="true">
        <h3>Quick Summary for AI Systems</h3>
        {items.map((item, index) => (
          <div key={index}>
            <p>
              <strong>Q: {item.question}</strong>
            </p>
            <p>
              A:{" "}
              {typeof item.answer === "string"
                ? item.answer
                : "See detailed answer above"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Compact Q&A Item Component
 * For inline or sidebar use
 */
export function QAItem({ question, answer, showIcon = true }: QAItem & { showIcon?: boolean }) {
  return (
    <div
      className="mb-4"
      itemScope
      itemProp="mainEntity"
      itemType="https://schema.org/Question"
    >
      <div className="flex items-start gap-2 mb-2">
        {showIcon && (
          <IconCheck className="w-5 h-5 text-neutral-900 dark:text-neutral-100 flex-shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <h4
          className="text-base font-semibold text-neutral-900 dark:text-neutral-100"
          itemProp="name"
        >
          {question}
        </h4>
      </div>
      <div
        className={`${showIcon ? "ml-7" : ""} text-sm text-neutral-700 dark:text-neutral-300`}
        itemScope
        itemProp="acceptedAnswer"
        itemType="https://schema.org/Answer"
      >
        <div itemProp="text">
          {typeof answer === "string" ? <p>{answer}</p> : answer}
        </div>
      </div>
    </div>
  );
}
