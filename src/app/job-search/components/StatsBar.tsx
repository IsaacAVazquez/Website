"use client";

import type { JobTrackerStats } from "@/types/jobsearch";

interface StatsBarProps {
  stats: JobTrackerStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { label: "Total Tracked", value: stats.total.toString() },
    { label: "In Progress", value: stats.inProgress.toString() },
    {
      label: "Response Rate",
      value: stats.total > 0 ? `${Math.round(stats.responseRate * 100)}%` : "—",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="home-card px-4 py-3 text-center"
          style={{ borderRadius: "14px" }}
        >
          <p
            className="text-2xl font-semibold mb-0"
            style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
          >
            {item.value}
          </p>
          <p
            className="text-xs mb-0 mt-1"
            style={{
              color: "color-mix(in srgb, var(--home-ink) 50%, var(--home-paper))",
              fontFamily: "var(--font-home-sans)",
            }}
          >
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
