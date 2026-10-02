import React from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "accent";
type ButtonSize = "sm" | "md" | "lg";

interface ModernButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  ariaLabel?: string;
  fullWidth?: boolean;
  className?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-[var(--c97-ink)] hover:bg-[color-mix(in_srgb,var(--c97-ink)_88%,var(--c97-surface))]",
    "text-[var(--c97-surface)]"
  ),
  secondary: cn(
    "bg-[var(--c97-panel)] hover:bg-[color-mix(in_srgb,var(--c97-panel)_85%,var(--c97-ink))]",
    "text-[var(--c97-ink)]",
    "border border-[var(--c97-rule)]"
  ),
  outline: cn(
    "border border-[var(--c97-rule)]",
    "text-[var(--c97-ink)]",
    "hover:bg-[var(--c97-panel)]",
    "hover:border-[var(--c97-ink-2)]"
  ),
  ghost: cn(
    "text-[var(--c97-ink-2)]",
    "hover:text-[var(--c97-ink)]",
    "hover:bg-[var(--c97-panel)]"
  ),
  accent: cn(
    "bg-[var(--c97-accent)] hover:bg-[color-mix(in_srgb,var(--c97-accent)_88%,var(--c97-ink))]",
    "text-[var(--c97-surface)]"
  ),
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm min-h-[44px] gap-1.5",
  md: "px-6 py-2.5 text-base min-h-[48px] gap-2",
  lg: "px-8 py-3.5 text-lg min-h-[54px] gap-2.5",
};

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
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold",
        "transition-[background-color,border-color,color,transform] duration-200",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--c97-accent)]",
        !disabled && "active:scale-[0.98]",
        fullWidth && "w-full",
        sizes[size],
        variants[variant],
        className
      )}
      aria-label={ariaLabel}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
