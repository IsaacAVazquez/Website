import React from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** `signal` adds a soft accent tint; `default` is a neutral paper tag. */
  tone?: "default" | "signal";
  children?: React.ReactNode;
}

/**
 * Chip — small mono, uppercase, squared metadata tag (résumé skills,
 * article tags). Consolidates the `.resume-chip` and `.tag` ad hoc
 * duplicates into one shared primitive.
 */
export function Chip({ tone = "default", children, className, ...props }: ChipProps) {
  return (
    <span
      className={cn("home-chip", tone === "signal" && "home-chip-signal", className)}
      {...props}
    >
      {children}
    </span>
  );
}
