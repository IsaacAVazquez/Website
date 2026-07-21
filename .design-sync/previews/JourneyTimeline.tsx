import * as React from "react";
import { JourneyTimeline } from "isaac-vazquez-portfolio";

// JourneyTimeline takes no props: content comes from src/constants/personal.ts
// (careerTimeline), including hardcoded /images/logos/* paths that 404 in the
// capture harness. This is the single canonical render; the broken-logo
// limitation is recorded in the batch learnings file.
export const CareerJourney = () => (
  <div className="max-w-2xl">
    <JourneyTimeline />
  </div>
);
