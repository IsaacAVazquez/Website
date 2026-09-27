import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "accent" | "mono";
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
    "inline-flex items-center justify-center font-semibold",
    "transition-[background-color,border-color,color,transform] duration-200",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--c97-accent)]",
    !disabled && "active:scale-[0.98]",
    fullWidth && "w-full"
  );

  const variants = {
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
    // Squared instrument-plate treatment (resume, ink plates). Catalog 97 has
    // no radius anywhere, so this variant no longer needs to override a pill
    // base — only the font/border treatment is variant-specific now.
    mono: cn(
      "border border-[var(--c97-ink)]",
      "font-mono text-[0.75rem] font-normal uppercase tracking-[0.09em]",
      "bg-transparent text-[var(--c97-ink)]",
      "hover:bg-[var(--c97-accent)] hover:text-[var(--c97-surface)] hover:border-[var(--c97-accent)]"
    ),
  };

  const sizes = {
    sm: "px-4 py-2 text-sm min-h-[44px] gap-1.5",
    md: "px-6 py-2.5 text-base min-h-[48px] gap-2",
    lg: "px-8 py-3.5 text-lg min-h-[54px] gap-2.5",
  };

  // Variant classes are placed after size classes so a variant (e.g. `mono`'s
  // fixed font-size) can override a size default via twMerge's last-one-wins
  // resolution; sizes never carry color/radius, so this reorder is a no-op
  // for every other variant.
  const combinedClassName = cn(baseStyles, sizes[size], variants[variant], className);

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
