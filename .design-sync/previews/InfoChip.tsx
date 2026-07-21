import * as React from "react";
import { InfoChip } from "isaac-vazquez-portfolio";

export const MatchTags = () => (
  <div className="flex flex-wrap items-center gap-2 text-sm">
    <InfoChip label="Matchday 37" />
    <InfoChip label="Emirates Stadium" />
    <InfoChip label="Attendance 60,384" />
    <InfoChip label="Sold out" />
  </div>
);

export const VenueList = () => (
  <div className="max-w-md">
    <p
      className="text-xs"
      style={{
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        fontWeight: 600,
        color: "var(--home-ink-muted)",
      }}
    >
      Group A venues
    </p>
    <div className="flex flex-wrap gap-2 text-sm" style={{ marginTop: 10 }}>
      <InfoChip label="Estadio Azteca · Mexico City" />
      <InfoChip label="Estadio Akron · Guadalajara" />
      <InfoChip label="BC Place · Vancouver" />
    </div>
  </div>
);
