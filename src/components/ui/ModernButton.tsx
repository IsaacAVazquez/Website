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
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white",
    !shouldReduceMotion && !disabled && "hover:-translate-y-px",
    fullWidth && "w-full"
  );

  const variants = {
    // Primary: Black background, white text
    primary: cn(
      "bg-black hover:bg-neutral-600 dark:bg-white dark:hover:bg-neutral-100",
      "text-white dark:text-black",
      "shadow-subtle hover:shadow-primary"
    ),
    // Secondary: White background, black text
    secondary: cn(
      "bg-white hover:bg-neutral-100 dark:bg-black dark:hover:bg-neutral-600",
      "text-black dark:text-white",
      "border border-neutral-200 dark:border-neutral-600",
      "shadow-subtle hover:shadow-primary"
    ),
    // Outline: Thin black border, no fill
    outline: cn(
      "border border-black dark:border-white",
      "text-black dark:text-white",
      "hover:bg-neutral-50 dark:hover:bg-neutral-900"
    ),
    // Ghost: No border, text only
    ghost: cn(
      "text-neutral-500 dark:text-neutral-400",
      "hover:text-black dark:hover:text-white",
      "hover:bg-neutral-50 dark:hover:bg-neutral-900"
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
