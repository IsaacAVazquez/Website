"use client";

import React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "accent";
type ButtonSize = "sm" | "md" | "lg";

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  ariaLabel?: string;
  fullWidth?: boolean;
}

export function ModernButton({
  variant = "primary",
  size = "md",
  children,
  className,
  ariaLabel,
  fullWidth = false,
  disabled = false,
  ...props
}: ModernButtonProps) {
  const baseStyles = cn(
    "inline-flex items-center justify-center font-semibold rounded-lg",
    "transition-all duration-200",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]",
    !disabled && "active:scale-[0.98]",
    fullWidth && "w-full"
  );

  const variants = {
    primary: cn(
      "bg-[var(--neutral-900)] hover:bg-[var(--neutral-800)]",
      "text-[var(--neutral-50)]",
      "shadow-sm hover:shadow-md"
    ),
    secondary: cn(
      "bg-[var(--surface-elevated)] hover:bg-[var(--neutral-100)]",
      "text-[var(--text-primary)]",
      "border border-[var(--border-primary)]",
      "shadow-sm hover:shadow-md"
    ),
    outline: cn(
      "border border-[var(--neutral-300)]",
      "text-[var(--text-primary)]",
      "hover:bg-[var(--neutral-100)] hover:border-[var(--neutral-400)]"
    ),
    ghost: cn(
      "text-[var(--text-secondary)]",
      "hover:text-[var(--text-primary)]",
      "hover:bg-[var(--neutral-100)]"
    ),
    accent: cn(
      "bg-[var(--color-primary)] hover:bg-[var(--color-secondary)]",
      "text-white",
      "shadow-sm hover:shadow-md"
    ),
  };

  const sizes = {
    sm: "px-4 py-2 text-sm min-h-[40px] gap-1.5",
    md: "px-6 py-2.5 text-base min-h-[44px] gap-2",
    lg: "px-8 py-3.5 text-lg min-h-[52px] gap-2.5",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      aria-label={ariaLabel}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
