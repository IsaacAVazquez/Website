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
    sm: "p-5 sm:p-6",
    md: "p-6 sm:p-8",
    lg: "p-8 sm:p-10 lg:p-12",
    xl: "p-10 sm:p-12 lg:p-16",
  };

  return (
    <div
      className={cn(
        "rounded-xl",
        "bg-[var(--surface-elevated)]",
        "border border-[var(--border-primary)]",
        hover && "transition-all duration-250 ease-out hover:-translate-y-0.5 hover:border-[var(--border-accent)] cursor-pointer",
        paddingClasses[padding],
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
