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
 * ModernButton (now EditorialButton) - Clean, minimal button for editorial portfolio
 * Pentagram-inspired design with bold red accents
 *
 * Features:
 * - Editorial red color variants
 * - Subtle hover effects
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
    "transition-all duration-300",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF3B30]",
    !shouldReduceMotion && !disabled && "hover:-translate-y-0.5",
    fullWidth && "w-full"
  );

  const variants = {
    primary: cn(
      "bg-[#FF3B30] hover:bg-[#D32F2F] dark:bg-[#FF5247] dark:hover:bg-[#FF6B61] text-white",
      "shadow-primary hover:shadow-elevated"
    ),
    secondary: cn(
      "bg-[#111111] hover:bg-[#000000] dark:bg-[#FAFAFA] dark:hover:bg-[#FFFFFF] text-white dark:text-[#111111]",
      "shadow-primary hover:shadow-elevated"
    ),
    outline: cn(
      "border-2 border-[#FF3B30] dark:border-[#FF5247] text-[#FF3B30] dark:text-[#FF5247]",
      "hover:bg-[#FAFAFA] dark:hover:bg-[#171717] hover:border-[#D32F2F] dark:hover:border-[#FF6B61]"
    ),
    ghost: cn(
      "text-[#525252] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#171717]"
    ),
  };

  const sizes = {
    sm: "px-4 py-2 text-sm min-h-[40px]",
    md: "px-6 py-3 text-base min-h-[44px]",
    lg: "px-8 py-4 text-lg min-h-[52px]",
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
