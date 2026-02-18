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
    sm: "p-6",
    md: "p-8",
    lg: "p-12",
    xl: "p-16",
  };

  return (
    <div
      className={cn(
        "border shadow-subtle",
        hover && "transition-all duration-300 ease-out hover:shadow-primary hover:-translate-y-px cursor-pointer",
        paddingClasses[padding],
        className
      )}
      style={{
        backgroundColor: "var(--surface-elevated)",
        borderColor: "var(--border-primary)",
      }}
      role="article"
      aria-label={ariaLabel}
      aria-description={ariaDescription}
    >
      {children}
    </div>
  );
}
