"use client";

import React from "react";
import { cn } from "@/lib/cn";
import styles from "./TerminalPanel.module.css";

interface TerminalPanelProps {
  children: React.ReactNode;
  className?: string;
  padding: "none" | "sm";
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
  padding,
  ariaLabel,
}: TerminalPanelProps) {
  return (
    <div
      className={cn(styles.panel, padding === "sm" && "p-5 sm:p-6", className)}
      role="article"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
});
