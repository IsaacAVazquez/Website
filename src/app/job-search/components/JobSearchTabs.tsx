"use client";

import type { JobSearchView } from "@/types/jobsearch";

const TABS: { key: JobSearchView; label: string }[] = [
  { key: "tracker", label: "Application Tracker" },
  { key: "cover-letter", label: "Cover Letter" },
  { key: "interview-prep", label: "Interview Prep" },
];

interface JobSearchTabsProps {
  activeView: JobSearchView;
  onTabChange: (view: JobSearchView) => void;
}

export function JobSearchTabs({ activeView, onTabChange }: JobSearchTabsProps) {
  return (
    <nav aria-label="Job search sections" className="flex gap-1 border-b" style={{ borderColor: "var(--home-rule)" }}>
      {TABS.map((tab) => {
        const isActive = activeView === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            role="tab"
            aria-selected={isActive}
            className="px-4 py-3 text-sm font-medium transition-colors relative"
            style={{
              fontFamily: "var(--font-home-sans)",
              color: isActive ? "var(--home-haze)" : "color-mix(in srgb, var(--home-ink) 55%, var(--home-paper))",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            {tab.label}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: "var(--home-haze)" }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
