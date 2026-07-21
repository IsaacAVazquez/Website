import * as React from "react";
import { ReadoutPanel } from "isaac-vazquez-portfolio";

const liveLabel = (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: 9999,
        background: "var(--home-signal)",
        flexShrink: 0,
      }}
    />
    Live index
  </span>
);

const footerNote = (
  <p
    style={{
      margin: 0,
      padding: "11px 16px",
      fontFamily: "var(--font-mono, monospace)",
      fontSize: "0.7rem",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--home-ink-muted)",
    }}
  >
    USGS · SpaceX · Stooq · refreshed by CI
  </p>
);

const heroRows = [
  { label: "Latest quake", value: "M 4.6" },
  { label: "Next launch", value: "T− 02:14:36" },
  { label: "SPY day move", value: "+0.42%" },
];

export const LiveIndex = () => (
  <div className="max-w-md">
    <ReadoutPanel
      label={liveLabel}
      stamp={<span>12:00:04 UTC</span>}
      rows={heroRows}
      footer={footerNote}
    />
  </div>
);

const sparkValues = [2.1, 3.4, 2.8, 4.6, 3.1, 2.2, 5.0, 3.7, 2.9, 4.1];

const magnitudeSpark = (
  <div style={{ padding: "14px 16px 6px" }}>
    <svg
      viewBox="0 0 300 26"
      preserveAspectRatio="none"
      style={{ width: "100%", height: 26, display: "block" }}
      aria-hidden="true"
    >
      {sparkValues.map((value, index) => {
        const barHeight = Math.max(2, (value / 5) * 26);
        return (
          <rect
            key={index}
            x={index * 30}
            y={26 - barHeight}
            width={27}
            height={barHeight}
            fill={
              index === sparkValues.length - 1
                ? "var(--home-signal)"
                : "var(--home-rule)"
            }
          />
        );
      })}
    </svg>
  </div>
);

export const WithSparkline = () => (
  <div className="max-w-md">
    <ReadoutPanel
      label={liveLabel}
      stamp={<span>Feed 3 min old</span>}
      rows={[
        { label: "Latest quake", value: "M 4.6" },
        { label: "Depth", value: "11 km" },
      ]}
      footer={footerNote}
    >
      {magnitudeSpark}
    </ReadoutPanel>
  </div>
);

// The homepage hero plate rebinds the --hp-* aliases so the panel inverts for
// that context (ported from src/app/page.module.css .plate).
const plateVars = {
  "--hp-ink": "var(--home-paper-alt)",
  "--hp-paper": "var(--home-ink)",
  "--hp-muted": "color-mix(in srgb, var(--home-paper-alt) 60%, transparent)",
  "--hp-rule": "color-mix(in srgb, var(--home-paper-alt) 18%, transparent)",
  "--hp-rule-soft": "color-mix(in srgb, var(--home-paper-alt) 10%, transparent)",
  background: "var(--hp-ink)",
  color: "var(--hp-paper)",
  border: "1px solid var(--home-rule)",
  padding: "1.75rem 1.25rem",
} as React.CSSProperties;

export const OnHeroPlate = () => (
  <div className="max-w-md" style={plateVars}>
    <ReadoutPanel
      label={liveLabel}
      stamp={<span>12:00:04 UTC</span>}
      rows={heroRows}
    />
  </div>
);
