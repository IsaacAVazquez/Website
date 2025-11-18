import React from "react";
import { cn } from "@/lib/utils";

interface WarmCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  ariaLabel?: string;
  ariaDescription?: string;
}

/**
 * WarmCard (now EditorialCard) - Clean, minimal card component with editorial styling
 * Modern Pentagram-inspired design for portfolio
 *
 * Features:
 * - Pure white/light gray backgrounds
 * - Subtle minimal borders
 * - Clean gray shadows
 * - Subtle hover lift effect
 * - Touch-friendly and accessible
 */
export function WarmCard({
  children,
  className,
  hover = false,
  padding = "md",
  ariaLabel,
  ariaDescription,
}: WarmCardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-10",
  };

  return (
    <div
      className={cn(
        // Base styling - clean, minimal, editorial
        "bg-white dark:bg-[#171717] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)]",
        "shadow-subtle",
        // Hover effects - subtle lift and shadow
        hover && "transition-all duration-400 hover:shadow-elevated hover:-translate-y-0.5 hover:border-[rgba(0,0,0,0.12)] dark:hover:border-[rgba(255,255,255,0.15)] cursor-pointer",
        // Padding
        paddingClasses[padding],
        // Custom classes
        className
      )}
      role="article"
      aria-label={ariaLabel}
      aria-description={ariaDescription}
    >
      {children}
    </div>
  );
}
