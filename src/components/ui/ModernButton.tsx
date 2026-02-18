"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "framer-motion";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  ariaLabel?: string;
  fullWidth?: boolean;
}

/**
 * ModernButton - Mouthwash Studio Minimal Button
 * Pure monochrome design with simple, clean interactions
 *
 * Features:
 * - Pure black/white monochrome variants
 * - Text-only or outlined button styles
 * - Very subtle hover effects
 * - Touch-friendly (44px minimum)
 * - Accessible with proper ARIA
 * - Respects reduced motion preferences
 */
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
  const shouldReduceMotion = useReducedMotion();

  const baseStyles = cn(
    "inline-flex items-center justify-center font-semibold",
    "transition-all duration-200",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]",
    !shouldReduceMotion && !disabled && "hover:-translate-y-px",
    fullWidth && "w-full"
  );

  const variants = {
    // Primary: Black background, white text
    primary: cn(
      "bg-neutral-900 hover:bg-neutral-700 dark:bg-neutral-100 dark:hover:bg-neutral-200",
      "text-white dark:text-neutral-900",
      "shadow-subtle hover:shadow-primary"
    ),
    // Secondary: White background, dark text
    secondary: cn(
      "bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700",
      "text-neutral-900 dark:text-neutral-100",
      "border border-neutral-200 dark:border-neutral-600",
      "shadow-subtle hover:shadow-primary"
    ),
    // Outline: Thin border, no fill
    outline: cn(
      "border border-neutral-900 dark:border-neutral-200",
      "text-neutral-900 dark:text-neutral-100",
      "hover:bg-neutral-100 dark:hover:bg-neutral-800"
    ),
    // Ghost: No border, text only
    ghost: cn(
      "text-neutral-500 dark:text-neutral-400",
      "hover:text-neutral-900 dark:hover:text-neutral-100",
      "hover:bg-neutral-100 dark:hover:bg-neutral-800"
    ),
  };

  const sizes = {
    sm: "px-5 py-2 text-sm min-h-[40px]",
    md: "px-7 py-3 text-base min-h-[44px]",
    lg: "px-9 py-4 text-lg min-h-[52px]",
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
