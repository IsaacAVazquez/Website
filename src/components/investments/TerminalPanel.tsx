"use client";

import React from "react";
import { cn } from "@/lib/cn";
import styles from "./TerminalPanel.module.css";

interface TerminalPanelProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

/**
 * The investments "terminal" plate: a fused hairline panel (a 1px
 * `--c97-rule` border, square corners, no shadow), since the terminal identity
 * forbids floating cards and shadows inside /investments.
 */
export const TerminalPanel = React.memo(function TerminalPanel({
  children,
  className,
  ariaLabel,
}: TerminalPanelProps) {
  return (
    // Only a named panel is exposed as an article, since an unnamed one adds an
    // anonymous entry to a screen reader's landmark list.
    <div
      className={cn(styles.panel, "p-[var(--c97-sp-2)] sm:p-[var(--c97-sp-3)]", className)}
      role={ariaLabel ? "article" : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
});
