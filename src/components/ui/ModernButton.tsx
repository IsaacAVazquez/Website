import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "accent";
type ButtonSize = "sm" | "md" | "lg";

interface ModernButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  ariaLabel?: string;
  fullWidth?: boolean;
  className?: string;
}

interface ModernButtonAsButton
  extends ModernButtonBaseProps,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ModernButtonBaseProps> {
  href?: undefined;
}

interface ModernButtonAsLink
  extends ModernButtonBaseProps,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ModernButtonBaseProps> {
  href: string;
  disabled?: boolean;
}

type ModernButtonProps = ModernButtonAsButton | ModernButtonAsLink;

export const ModernButton = React.memo(function ModernButton({
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
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--home-signal)]",
    !disabled && "active:scale-[0.98]",
    fullWidth && "w-full"
  );

  const variants = {
    primary: cn(
      "bg-[var(--home-ink)] hover:bg-[color-mix(in_srgb,var(--home-ink)_88%,var(--home-paper))]",
      "text-[var(--home-paper)]",
      "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
    ),
    secondary: cn(
      "bg-[color-mix(in_srgb,var(--home-paper-alt)_78%,white)]",
      "hover:bg-[color-mix(in_srgb,var(--home-paper-alt)_90%,white)]",
      "text-[var(--home-ink)]",
      "border border-[var(--home-rule)]",
      "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
    ),
    outline: cn(
      "border border-[var(--home-rule)]",
      "text-[var(--home-ink)]",
      "hover:bg-[color-mix(in_srgb,var(--home-paper-alt)_78%,white)]",
      "hover:border-[color-mix(in_srgb,var(--home-stone)_58%,var(--home-rule))]"
    ),
    ghost: cn(
      "text-[var(--home-ink-muted)]",
      "hover:text-[var(--home-ink)]",
      "hover:bg-[color-mix(in_srgb,var(--home-paper-alt)_78%,white)]"
    ),
    accent: cn(
      "bg-[var(--home-signal)] hover:bg-[color-mix(in_srgb,var(--home-signal)_88%,var(--home-ink))]",
      "text-[var(--home-paper)]",
      "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
    ),
  };

  const sizes = {
    sm: "px-4 py-2 text-sm min-h-[44px] gap-1.5",
    md: "px-6 py-2.5 text-base min-h-[44px] gap-2",
    lg: "px-8 py-3.5 text-lg min-h-[52px] gap-2.5",
  };

  const combinedClassName = cn(baseStyles, variants[variant], sizes[size], className);

  // Render as link when href is provided
  if ("href" in props && props.href) {
    const { href, ...linkProps } = props as ModernButtonAsLink;
    const isExternal = href.startsWith("http") || href.startsWith("//");

    if (isExternal) {
      return (
        <a
          href={href}
          className={combinedClassName}
          aria-label={ariaLabel}
          target="_blank"
          rel="noopener noreferrer"
          {...linkProps}
        >
          {children}
        </a>
      );
    }

    return (
      <Link
        href={href}
        className={combinedClassName}
        aria-label={ariaLabel}
        {...linkProps}
      >
        {children}
      </Link>
    );
  }

  const buttonProps = props as ModernButtonAsButton;
  return (
    <button
      className={combinedClassName}
      aria-label={ariaLabel}
      disabled={disabled}
      {...buttonProps}
    >
      {children}
    </button>
  );
});
