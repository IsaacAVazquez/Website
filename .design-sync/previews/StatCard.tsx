import * as React from "react";
import { StatCard } from "isaac-vazquez-portfolio";

const trophyIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z" />
    <path d="M7 6H4a3 3 0 0 0 3 5M17 6h3a3 3 0 0 1-3 5" />
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

const shieldIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z" />
  </svg>
);

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

export const CompactGrid = () => (
  <div
    className="max-w-xl"
    style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}
  >
    <StatCard
      variant="compact"
      eyebrow="Leader"
      metric="Arsenal · 86 pts"
      detail="3 clear with one round to play"
      icon={trophyIcon}
    />
    <StatCard
      variant="compact"
      eyebrow="Top scorer"
      metric="24 goals"
      detail="Haaland, Man City"
      icon={targetIcon}
    />
    <StatCard
      variant="compact"
      eyebrow="Best defense"
      metric="27 conceded"
      detail="Arsenal, 17 clean sheets"
      icon={shieldIcon}
    />
    <StatCard
      variant="compact"
      eyebrow="Matchday"
      metric="37 of 38"
      detail="Final round Sunday 16:00"
      icon={calendarIcon}
    />
  </div>
);

export const FullWithTitle = () => (
  <div className="max-w-md">
    <StatCard
      eyebrow="Pichichi race"
      title="Lewandowski holds the lead"
      metric="27 goals"
      detail="Three clear of Vinícius Júnior with four matchdays left in La Liga."
      icon={targetIcon}
    />
  </div>
);

export const FullMetricOnly = () => (
  <div className="max-w-md">
    <StatCard
      eyebrow="Goals per match"
      metric="2.84"
      detail="Up from 2.69 across the same 37 matchdays last season."
      icon={calendarIcon}
    />
  </div>
);
