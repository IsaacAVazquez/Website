"use client";

import React from "react";
import { cn } from "@/lib/utils";
import styles from "./TerminalPanel.module.css";

interface TerminalPanelProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  ariaLabel?: string;
  ariaDescription?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Drop-in replacement for `WarmCard` scoped to the investments "terminal"
 * surface: a fused hairline plate (1px `--home-rule` border, `--radius-sm`
 * 2px corners, no shadow) instead of a floating rounded/shadowed card. Same
 * prop shape as WarmCard so it can be swapped in without touching call-site
 * children — the terminal identity forbids floating cards and shadows
 * everywhere WarmCard was previously used inside /investments.
 */
export const TerminalPanel = React.memo(function TerminalPanel({
  children,
  className,
  padding = "md",
  ariaLabel,
  ariaDescription,
  onClick,
}: TerminalPanelProps) {
  const paddingClasses = {
    none: "",
    sm: "p-5 sm:p-6",
    md: "p-6 sm:p-8",
    lg: "p-8 sm:p-10 lg:p-12",
    xl: "p-10 sm:p-12 lg:p-16",
  };

  return (
    <div
      className={cn(styles.panel, paddingClasses[padding], className)}
      role="article"
      aria-label={ariaLabel}
      {...(ariaDescription ? { title: ariaDescription } : {})}
      onClick={onClick}
    >
      {children}
    </div>
  );
});
