"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Returns the inline style for an editorial pill button or pill-shaped trigger.
 * Active pills use solid --home-ink; inactive pills use a soft paper-alt blend.
 * Exported so dropdown triggers, filter chips, and other pill-like controls can
 * share the exact same treatment without duplicating color logic.
 */
export function getPillStyle(active: boolean): CSSProperties {
  if (active) {
    return {
      background: "var(--home-ink)",
      color: "var(--home-paper)",
      borderColor: "var(--home-ink)",
      boxShadow: "var(--shadow-sm)",
    };
  }

  return {
    background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
    color: "var(--home-ink-muted)",
    borderColor: "var(--home-rule)",
  };
}

interface EditorialPillButtonProps {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  title?: string;
  role?: "tab";
  ariaSelected?: boolean;
  size?: "sm" | "md";
}

/**
 * Rounded, uppercase-ready pill button used for tabs, filter toggles, and
 * segmented controls throughout the editorial pages. Guarantees the 44px
 * minimum touch target and uses the editorial color system.
 */
export function EditorialPillButton({
  active,
  children,
  onClick,
  title,
  role,
  ariaSelected,
  size = "md",
}: EditorialPillButtonProps) {
  return (
    <button
      type="button"
      role={role}
      aria-selected={ariaSelected}
      onClick={onClick}
      title={title}
      className={`inline-flex min-h-[44px] items-center justify-center rounded-full border font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease ${
        size === "sm" ? "px-4 py-2 text-xs sm:text-sm" : "px-5 py-2.5 text-sm"
      }`}
      style={getPillStyle(active)}
    >
      {children}
    </button>
  );
}
