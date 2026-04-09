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

export function ExpertSignal({
  type = "credential",
  label,
  value,
  icon,
  verified = false,
  variant = "default",
  className = "",
}: ExpertSignalProps) {
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

  if (variant === "badge") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--home-paper-alt)] text-[var(--home-ink)] border border-[var(--home-rule)] rounded-full ${className}`}
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

  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-2 text-sm ${className}`}>
        <span className="text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
          {displayIcon}
        </span>
        <span className="text-[var(--home-ink)]">
          {label}
          {value && <span className="text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))] ml-1">· {value}</span>}
        </span>
        {verified && (
          <IconCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400" aria-label="Verified" />
        )}
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={`flex items-center gap-3 p-3 bg-[var(--home-paper-alt)] border border-[var(--home-rule)] rounded-sm ${className}`}
        itemProp={type === "education" ? "alumniOf" : type === "credential" ? "hasCredential" : undefined}
      >
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[var(--home-paper)] border border-[var(--home-rule)] rounded-sm text-[var(--home-ink)]">
          {displayIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--home-ink)]">
            {label}
          </p>
          {value && (
            <p className="text-xs text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
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

  return (
    <div
      className={`card ${className}`}
      itemProp={type === "education" ? "alumniOf" : type === "credential" ? "hasCredential" : undefined}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[var(--home-paper-alt)] border border-[var(--home-rule)] rounded-sm text-[var(--home-ink)]">
          {displayIcon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-[var(--home-ink)] mb-1">
                {label}
              </h3>
              {value && (
                <p className="text-sm text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
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
  const gridClass = columns === 1 ? "grid-cols-1" : columns === 3 ? "grid md:grid-cols-3" : "grid md:grid-cols-2";

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-[var(--home-ink)] mb-4">
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
