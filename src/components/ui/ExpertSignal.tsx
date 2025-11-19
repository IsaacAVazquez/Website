"use client";

import { IconCheck, IconStar, IconAward, IconSchool, IconBriefcase, IconTrophy } from "@tabler/icons-react";
import { ReactNode } from "react";

export interface ExpertSignalProps {
  type?: "credential" | "achievement" | "expertise" | "education" | "experience" | "award";
  label: string;
  value?: string | ReactNode;
  icon?: ReactNode;
  verified?: boolean;
  variant?: "default" | "compact" | "inline" | "badge";
  className?: string;
}

/**
 * ExpertSignal - Component for displaying credentials and expertise markers
 *
 * Helps AI systems identify and understand expert credentials, achievements,
 * and qualifications. Improves discoverability in AI-driven search.
 *
 * Features:
 * - Multiple signal types (credentials, achievements, expertise)
 * - Verification indicators
 * - Schema.org microdata support
 * - Flexible display variants
 */
export function ExpertSignal({
  type = "credential",
  label,
  value,
  icon,
  verified = false,
  variant = "default",
  className = "",
}: ExpertSignalProps) {
  // Get default icon based on type
  const getDefaultIcon = () => {
    switch (type) {
      case "credential":
        return <IconCheck className="w-4 h-4" aria-hidden="true" />;
      case "achievement":
        return <IconTrophy className="w-4 h-4" aria-hidden="true" />;
      case "expertise":
        return <IconStar className="w-4 h-4" aria-hidden="true" />;
      case "education":
        return <IconSchool className="w-4 h-4" aria-hidden="true" />;
      case "experience":
        return <IconBriefcase className="w-4 h-4" aria-hidden="true" />;
      case "award":
        return <IconAward className="w-4 h-4" aria-hidden="true" />;
      default:
        return <IconCheck className="w-4 h-4" aria-hidden="true" />;
    }
  };

  const displayIcon = icon || getDefaultIcon();

  // Badge variant - minimal pill display
  if (variant === "badge") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-full ${className}`}
        itemProp={type === "education" ? "alumniOf" : type === "credential" ? "hasCredential" : undefined}
      >
        {displayIcon}
        <span>{label}</span>
        {verified && (
          <IconCheck className="w-3 h-3 text-green-600 dark:text-green-400" aria-label="Verified" />
        )}
      </span>
    );
  }

  // Inline variant - text-based with icon
  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-2 text-sm ${className}`}>
        <span className="text-neutral-500 dark:text-neutral-400">
          {displayIcon}
        </span>
        <span className="text-neutral-900 dark:text-neutral-100">
          {label}
          {value && <span className="text-neutral-600 dark:text-neutral-400 ml-1">· {value}</span>}
        </span>
        {verified && (
          <IconCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400" aria-label="Verified" />
        )}
      </span>
    );
  }

  // Compact variant - small card
  if (variant === "compact") {
    return (
      <div
        className={`flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-sm ${className}`}
        itemProp={type === "education" ? "alumniOf" : type === "credential" ? "hasCredential" : undefined}
      >
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-sm text-neutral-900 dark:text-neutral-100">
          {displayIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {label}
          </p>
          {value && (
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {value}
            </p>
          )}
        </div>
        {verified && (
          <IconCheck className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" aria-label="Verified" />
        )}
      </div>
    );
  }

  // Default variant - full card
  return (
    <div
      className={`pentagram-card ${className}`}
      itemProp={type === "education" ? "alumniOf" : type === "credential" ? "hasCredential" : undefined}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-neutral-900 dark:text-neutral-100">
          {displayIcon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                {label}
              </h3>
              {value && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {value}
                </p>
              )}
            </div>
            {verified && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-sm">
                <IconCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400" aria-hidden="true" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                  Verified
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ExpertSignalGroup - Container for multiple expert signals
 */
export interface ExpertSignalGroupProps {
  title?: string;
  signals: Omit<ExpertSignalProps, "variant">[];
  variant?: ExpertSignalProps["variant"];
  columns?: 1 | 2 | 3;
  className?: string;
}

export function ExpertSignalGroup({
  title,
  signals,
  variant = "compact",
  columns = 2,
  className = "",
}: ExpertSignalGroupProps) {
  const gridClass = columns === 1 ? "grid-cols-1" : columns === 3 ? "pentagram-grid-3" : "pentagram-grid-2";

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {title}
        </h3>
      )}
      <div className={`grid ${gridClass} gap-4`}>
        {signals.map((signal, index) => (
          <ExpertSignal
            key={index}
            {...signal}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
}
