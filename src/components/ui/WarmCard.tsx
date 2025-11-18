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
 * WarmCard - Mouthwash Studio Minimal Card Component
 * Clean, monochrome design with generous whitespace
 *
 * Features:
 * - Pure white backgrounds with subtle borders
 * - Ultra-subtle grey shadows
 * - Minimal hover lift effect
 * - Border-based design (not filled)
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
    sm: "p-6",           // More generous minimum padding
    md: "p-8",           // Default: generous padding
    lg: "p-12",          // Large: very generous
    xl: "p-16",          // XL: maximum whitespace
  };

  return (
    <div
      className={cn(
        // Mouthwash Studio Base - pure white with thin border
        "bg-white dark:bg-black",
        "border border-neutral-200 dark:border-neutral-600",
        // Ultra-subtle shadow
        "shadow-subtle",
        // Hover effects - very subtle
        hover && "transition-all duration-300 ease-out hover:shadow-primary hover:-translate-y-px hover:border-neutral-900 dark:hover:border-neutral-50 cursor-pointer",
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
