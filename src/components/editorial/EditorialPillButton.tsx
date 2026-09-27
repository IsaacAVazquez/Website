"use client";
/* eslint-disable react-refresh/only-export-components -- co-located helper is intentional */

import type { CSSProperties, ReactNode } from "react";

/**
 * Returns the inline style for an editorial pill button or pill-shaped trigger.
 * Active pills use solid --c97-ink; inactive pills use the panel tint.
 * Exported so dropdown triggers, filter chips, and other pill-like controls can
 * share the exact same treatment without duplicating color logic.
 */
export function getPillStyle(active: boolean): CSSProperties {
  if (active) {
    return {
      background: "var(--c97-ink)",
      color: "var(--c97-surface)",
      borderColor: "var(--c97-ink)",
    };
  }

  return {
    background: "var(--c97-panel)",
    color: "var(--c97-ink-2)",
    borderColor: "var(--c97-rule)",
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
 * Uppercase-ready pill button used for tabs, filter toggles, and segmented
 * controls throughout the editorial pages. Guarantees the 44px minimum touch
 * target and uses the editorial color system.
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
      className={`inline-flex min-h-[44px] items-center justify-center border font-semibold transition-[background-color,border-color,color] duration-200 ease ${
        size === "sm" ? "px-4 py-2 text-xs sm:text-sm" : "px-5 py-2.5 text-sm"
      }`}
      style={getPillStyle(active)}
    >
      {children}
    </button>
  );
}
