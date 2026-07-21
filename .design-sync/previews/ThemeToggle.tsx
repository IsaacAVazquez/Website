import * as React from "react";
import { ThemeToggle } from "isaac-vazquez-portfolio";

export const Default = () => <ThemeToggle />;

export const InHeaderRow = () => (
  <div
    className="flex items-center justify-between px-4 border rounded-lg"
    style={{
      maxWidth: 420,
      borderColor: "var(--home-rule)",
      background: "var(--home-paper)",
      paddingTop: 6,
      paddingBottom: 6,
    }}
  >
    <span
      style={{
        fontWeight: 650,
        fontSize: 14,
        color: "var(--home-ink)",
        letterSpacing: "0.01em",
      }}
    >
      Isaac Vazquez
    </span>
    <div className="flex items-center gap-3">
      <span className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
        Portfolio
      </span>
      <span className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
        Writing
      </span>
      <ThemeToggle />
    </div>
  </div>
);
