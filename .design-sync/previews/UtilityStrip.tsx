import * as React from "react";
import { UtilityStrip } from "isaac-vazquez-portfolio";

export const RefreshMeta = () => (
  <div style={{ display: "flex", justifyContent: "center" }}>
    <UtilityStrip>128 roles shown · Refreshed May 15, 10:42 AM · Polls every 30 min</UtilityStrip>
  </div>
);

export const WithEmphasis = () => (
  <div style={{ display: "flex", justifyContent: "center" }}>
    <UtilityStrip>
      <strong style={{ color: "var(--home-ink)", fontWeight: 600 }}>Curated snapshot</strong> · 42
      symbols · Reviewed against the May broker statements
    </UtilityStrip>
  </div>
);
