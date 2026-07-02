import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  /** Legacy props accepted but ignored for backwards compat */
  glow?: boolean;
  href?: string;
}

export function Badge({
  variant = "default",
  size = "sm",
  className = "",
  children,
  glow: _glow,
  href: _href,
  ...props
}: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-md font-medium transition-colors";

  const variantClasses = {
    default: "bg-[var(--home-signal)]/10 text-[var(--home-signal)] border border-[var(--home-signal)]/20",
    success: "bg-[var(--home-positive)]/10 text-[var(--home-positive)] border border-[var(--home-positive)]/20",
    warning: "bg-[var(--home-warning)]/10 text-[var(--home-warning)] border border-[var(--home-warning)]/20",
    outline: "border border-[var(--home-rule)] text-[var(--home-ink-muted)]",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)} {...props}>
      {children}
    </div>
  );
}
