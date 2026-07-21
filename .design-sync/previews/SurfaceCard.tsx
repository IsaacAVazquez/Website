import * as React from "react";
import { SurfaceCard } from "isaac-vazquez-portfolio";

export const BriefingPanel = () => (
  <div className="max-w-md">
    <SurfaceCard className="p-4">
      <p
        className="text-xs"
        style={{
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          fontWeight: 600,
          color: "var(--home-ink-muted)",
        }}
      >
        Matchday 37 briefing
      </p>
      <p className="text-sm" style={{ marginTop: 10, fontWeight: 600, color: "var(--home-ink)" }}>
        Arsenal can clinch the title on Saturday
      </p>
      <p className="text-sm" style={{ marginTop: 6, lineHeight: 1.6, color: "var(--home-ink-muted)" }}>
        A home draw against Liverpool is enough if Man City drop points at Brighton. I would not
        plan the parade around City dropping points.
      </p>
    </SurfaceCard>
  </div>
);

const raceRows = [
  { club: "Arsenal", points: "86 pts" },
  { club: "Man City", points: "83 pts" },
  { club: "Liverpool", points: "79 pts" },
];

export const WithRuledList = () => (
  <div className="max-w-md">
    <SurfaceCard className="p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm" style={{ fontWeight: 600, color: "var(--home-ink)" }}>
          Title race
        </p>
        <span className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
          1 round left
        </span>
      </div>
      <div style={{ marginTop: 12, borderTop: "1px solid var(--home-rule)" }}>
        {raceRows.map((row) => (
          <div
            key={row.club}
            className="flex items-center justify-between text-sm"
            style={{ padding: "10px 0", borderBottom: "1px solid var(--home-rule)" }}
          >
            <span style={{ color: "var(--home-ink)" }}>{row.club}</span>
            <span style={{ color: "var(--home-ink-muted)", fontVariantNumeric: "tabular-nums" }}>
              {row.points}
            </span>
          </div>
        ))}
      </div>
    </SurfaceCard>
  </div>
);
