import React from "react";
import { cn } from "@/lib/utils";

interface KickerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** `dot` = mono with a signal-orange dot prefix (signature). `plain` = sans uppercase eyebrow. */
  variant?: "dot" | "plain";
  children?: React.ReactNode;
}

/**
 * Kicker — the small label that sits above a heading. `dot` is the
 * signature Fragment Mono treatment with a signal-orange dot prefix
 * (`.home-kicker-dot`); `plain` is the quiet Instrument Sans uppercase
 * eyebrow already used site-wide as `.home-kicker`.
 */
export function Kicker({ variant = "dot", children, className, ...props }: KickerProps) {
  return (
    <span
      className={cn(variant === "plain" ? "home-kicker" : "home-kicker-dot", className)}
      {...props}
    >
      {children}
    </span>
  );
}
