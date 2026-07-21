import * as React from "react";
import { MetricCard } from "isaac-vazquez-portfolio";

const calendarIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    aria-hidden="true"
  >
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M4 11h16" />
  </svg>
);

const targetIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const Editorial = () => (
  <div
    className="max-w-xl"
    style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}
  >
    <MetricCard
      label="Matches tracked"
      value="104"
      detail="Every World Cup 2026 fixture from the June 11 opener at Estadio Azteca."
      icon={calendarIcon}
    />
    <MetricCard
      label="Goals logged"
      value="289"
      detail="2.78 per match across the group stage and knockouts."
      icon={targetIcon}
    />
  </div>
);

export const CompactStrip = () => (
  <div
    className="max-w-md"
    style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}
  >
    <MetricCard label="Points" value="86" />
    <MetricCard label="Goal diff" value="+57" />
    <MetricCard label="Clean sheets" value="17" />
  </div>
);
