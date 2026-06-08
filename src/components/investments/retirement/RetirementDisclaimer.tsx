"use client";

import React from "react";
import { IconInfoCircle } from "@tabler/icons-react";

/**
 * Educational / general-information disclaimer (spec §9). Keeps the tool out of
 * regulated personalized-advice territory. Final language should be reviewed
 * before any production launch.
 */
export function RetirementDisclaimer() {
  return (
    <div className="invest-retire-disclaimer" role="note" aria-label="Important disclaimer">
      <IconInfoCircle size={16} aria-hidden="true" className="shrink-0 mt-0.5" />
      <p>
        For illustrative and educational purposes only. Not investment, tax, or financial advice.
        Projections are hypothetical, rely on the assumptions shown above, and do not guarantee
        future results. Capital-market assumptions are estimates that change over time. Consult a
        qualified financial professional before making decisions.
      </p>
    </div>
  );
}
