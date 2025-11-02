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
 * WarmCard - Modern card component with warm, inviting styling
 * Replaces the cyberpunk GlassCard with clean, professional design
 *
 * Features:
 * - Warm cream/white backgrounds instead of glass transparency
 * - Soft peachy borders instead of neon
 * - Warm shadows with orange/golden glow
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
        // Base styling - warm, clean, modern
        "bg-white dark:bg-[#2D1B12]/80 rounded-2xl border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30",
        "shadow-subtle dark:shadow-warm-lg",
        "backdrop-blur-sm",
        // Hover effects - subtle lift and warm glow
        hover && "transition-all duration-300 hover:shadow-warm-lg dark:hover:shadow-warm-xl hover:-translate-y-1 cursor-pointer",
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
