import * as React from "react";
import { SegmentedTabs } from "isaac-vazquez-portfolio";

const noop = () => {};

export const ClubDetailTabs = () => (
  <div>
    <SegmentedTabs
      tabs={[
        { id: "club", label: "Club Detail" },
        { id: "fixtures", label: "Fixtures" },
        { id: "scorers", label: "Top Scorers" },
      ]}
      activeId="club"
      onChange={noop}
      ariaLabel="Club and league details"
      idPrefix="pl-detail-tab"
      panelId="pl-detail-panel"
    />
    <div
      id="pl-detail-panel"
      role="tabpanel"
      aria-labelledby="pl-detail-tab-club"
      className="text-sm"
      style={{ marginTop: 16, color: "var(--home-ink-muted)", maxWidth: "36ch" }}
    >
      Arsenal sit top on 82 points with two matchdays left, four clear of Man
      City on goal difference.
    </div>
  </div>
);

export const MiddleTabActive = () => (
  <SegmentedTabs
    tabs={[
      { id: "overview", label: "Overview" },
      { id: "table", label: "Table" },
      { id: "fixtures", label: "Fixtures" },
      { id: "scorers", label: "Scorers" },
      { id: "form", label: "Form" },
    ]}
    activeId="fixtures"
    onChange={noop}
    ariaLabel="League sections"
    idPrefix="liga-tab"
    panelId="liga-panel"
  />
);

export const WrappedTabs = () => (
  <div style={{ maxWidth: 300 }}>
    <SegmentedTabs
      tabs={[
        { id: "club", label: "Club Detail" },
        { id: "fixtures", label: "Fixtures" },
        { id: "scorers", label: "Top Scorers" },
        { id: "form", label: "Form Guide" },
      ]}
      activeId="scorers"
      onChange={noop}
      ariaLabel="Club and league details"
      idPrefix="wrap-tab"
      panelId="wrap-panel"
    />
  </div>
);
