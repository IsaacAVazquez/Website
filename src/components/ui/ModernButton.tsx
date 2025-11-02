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
 * ModernButton - Clean, warm button component for 2025 portfolio
 * Replaces MorphButton with purposeful animations and warm styling
 *
 * Features:
 * - Warm color variants (orange, yellow, coral)
 * - Subtle hover lift effect
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
    "inline-flex items-center justify-center rounded-xl font-semibold",
    "transition-all duration-300",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500",
    !shouldReduceMotion && !disabled && "hover:-translate-y-0.5",
    fullWidth && "w-full"
  );

  const variants = {
    primary: cn(
      "bg-[#FF6B35] hover:bg-[#E85A28] dark:bg-[#FF8E53] dark:hover:bg-[#FFA876] text-white",
      "shadow-warm-lg hover:shadow-warm-xl"
    ),
    secondary: cn(
      "bg-[#F7B32B] hover:bg-[#E0A220] dark:bg-[#FFD666] dark:hover:bg-[#FFD98E] text-[#4A3426] dark:text-[#2D1B12]",
      "shadow-warm-lg hover:shadow-warm-xl"
    ),
    outline: cn(
      "border-2 border-[#FF6B35] dark:border-[#FF8E53] text-[#FF6B35] dark:text-[#FF8E53]",
      "hover:bg-[#FFF8F0] dark:hover:bg-[#4A3426]/30 hover:border-[#E85A28] dark:hover:border-[#FFA876]"
    ),
    ghost: cn(
      "text-[#6B4F3D] dark:text-[#D4A88E] hover:bg-[#FFF8F0] dark:hover:bg-[#4A3426]/30"
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
