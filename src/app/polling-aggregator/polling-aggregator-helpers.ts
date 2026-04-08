import type { CSSProperties } from "react";
import type { RaceRating, Party } from "@/types/polling";

// ─── Formatting ────────────────────────────────────────────────────────────────

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const SHORT_DATE_FMT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const UPDATED_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : DATE_FMT.format(d);
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : SHORT_DATE_FMT.format(d);
}

export function formatUpdated(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "Unavailable" : UPDATED_FMT.format(d);
}

export function formatMargin(margin: number): string {
  if (Math.abs(margin) < 0.05) return "Even";
  const party = margin > 0 ? "D" : "R";
  return `${party}+${Math.abs(margin).toFixed(1)}`;
}

export function formatNet(net: number): string {
  if (net === 0) return "Even";
  return `${net > 0 ? "+" : ""}${net.toFixed(1)}`;
}

// ─── Party colors ──────────────────────────────────────────────────────────────

export const DEM_COLOR = "#2563EB";   // blue-600
export const REP_COLOR = "#DC2626";   // red-600
export const TUP_COLOR = "#D97706";   // amber-600 (toss-up)

export function partyColor(party: Party): string {
  if (party === "D") return DEM_COLOR;
  if (party === "R") return REP_COLOR;
  return "#64748B";
}

export function partyLabel(party: Party): string {
  if (party === "D") return "Dem.";
  if (party === "R") return "Rep.";
  if (party === "I") return "Ind.";
  return party;
}

// ─── Rating styles ─────────────────────────────────────────────────────────────

export function getRatingBg(rating: RaceRating): string {
  switch (rating) {
    case "Safe D":    return "#1D4ED8";
    case "Likely D":  return "#3B82F6";
    case "Lean D":    return "#93C5FD";
    case "Toss-up":   return "#D97706";
    case "Lean R":    return "#FCA5A5";
    case "Likely R":  return "#EF4444";
    case "Safe R":    return "#B91C1C";
  }
}

export function getRatingTextColor(rating: RaceRating): string {
  switch (rating) {
    case "Safe D":   return "#fff";
    case "Likely D": return "#fff";
    case "Lean D":   return "#1e3a5f";
    case "Toss-up":  return "#fff";
    case "Lean R":   return "#5c1a1a";
    case "Likely R": return "#fff";
    case "Safe R":   return "#fff";
  }
}

export function getRatingPillStyle(rating: RaceRating): CSSProperties {
  return {
    background: getRatingBg(rating),
    color: getRatingTextColor(rating),
    borderColor: getRatingBg(rating),
  };
}

export function getActiveViewStyle(isActive: boolean): CSSProperties {
  if (isActive) {
    return {
      borderColor: "color-mix(in srgb, var(--color-primary) 35%, var(--border-primary))",
      background: "color-mix(in srgb, var(--color-primary) 9%, var(--surface-secondary))",
      boxShadow: "var(--shadow-sm)",
    };
  }
  return {
    borderColor: "var(--border-primary)",
    background: "var(--surface-secondary)",
  };
}

export function getRowStyle(isSelected: boolean): CSSProperties {
  if (isSelected) {
    return {
      borderColor: "color-mix(in srgb, var(--color-primary) 35%, var(--border-primary))",
      background: "color-mix(in srgb, var(--color-primary) 9%, var(--surface-secondary))",
    };
  }
  return { borderColor: "var(--border-primary)", background: "var(--surface-secondary)" };
}

// ─── SVG trend chart helpers ───────────────────────────────────────────────────

interface Point { x: number; y: number }

export function buildPolyline(
  values: number[],
  width: number,
  height: number,
  padding = 8
): string {
  if (values.length < 2) return "";
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const pts: Point[] = values.map((v, i) => ({
    x: padding + (i / (values.length - 1)) * (width - padding * 2),
    y: height - padding - ((v - minVal) / range) * (height - padding * 2),
  }));
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}
