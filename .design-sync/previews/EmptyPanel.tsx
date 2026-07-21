import * as React from "react";
import { EmptyPanel } from "isaac-vazquez-portfolio";

export const GroupStage = () => (
  <div className="max-w-xl">
    <EmptyPanel
      title="Group standings open with the first whistle"
      description="All 12 group tables populate here once the group stage begins on June 11. Until then, browse the host venues and the tournament format."
    />
  </div>
);

export const QuietMatchweek = () => (
  <div className="max-w-md">
    <EmptyPanel
      title="No fixtures in this window"
      description="The next Premier League matchday kicks off Saturday. Results land here as soon as the snapshot refreshes."
    />
  </div>
);
