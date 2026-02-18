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

export function ModernButton({
  variant = "primary",
  size = "md",
  children,
  className,
  ariaLabel,
  fullWidth = false,
  disabled = false,
  style,
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

  const sizes = {
    sm: "px-5 py-2 text-sm min-h-[40px]",
    md: "px-7 py-3 text-base min-h-[44px]",
    lg: "px-9 py-4 text-lg min-h-[52px]",
  };

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--text-primary)",
      color: "var(--surface-primary)",
    },
    secondary: {
      backgroundColor: "var(--surface-elevated)",
      color: "var(--text-primary)",
      border: "1px solid var(--border-primary)",
    },
    outline: {
      backgroundColor: "transparent",
      color: "var(--text-primary)",
      border: "1px solid var(--text-primary)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--text-secondary)",
    },
  };

  return (
    <button
      className={cn(baseStyles, sizes[size], "shadow-subtle hover:shadow-primary", className)}
      aria-label={ariaLabel}
      disabled={disabled}
      style={{ ...variantStyles[variant], ...style }}
      onMouseEnter={(e) => {
        if (disabled) return;
        const el = e.currentTarget;
        if (variant === "primary") {
          el.style.backgroundColor = "var(--text-secondary)";
        } else if (variant === "secondary") {
          el.style.backgroundColor = "var(--surface-secondary)";
        } else if (variant === "outline") {
          el.style.backgroundColor = "var(--surface-secondary)";
        } else if (variant === "ghost") {
          el.style.color = "var(--text-primary)";
          el.style.backgroundColor = "var(--surface-secondary)";
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        const el = e.currentTarget;
        const base = variantStyles[variant];
        el.style.backgroundColor = base.backgroundColor as string;
        el.style.color = base.color as string;
      }}
      {...props}
    >
      {children}
    </button>
  );
}
