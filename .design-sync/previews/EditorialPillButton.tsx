import * as React from "react";
import { EditorialPillButton } from "isaac-vazquez-portfolio";

const noop = () => {};

export const ScoringFormatTabs = () => (
  <div className="flex flex-wrap gap-2" role="tablist" aria-label="Scoring format">
    <EditorialPillButton active onClick={noop} role="tab" ariaSelected size="sm">
      PPR
    </EditorialPillButton>
    <EditorialPillButton active={false} onClick={noop} role="tab" ariaSelected={false} size="sm">
      Half PPR
    </EditorialPillButton>
    <EditorialPillButton active={false} onClick={noop} role="tab" ariaSelected={false} size="sm">
      Standard
    </EditorialPillButton>
  </div>
);

export const States = () => (
  <div className="flex flex-wrap items-center gap-3">
    <EditorialPillButton active onClick={noop}>
      Tracked roles
    </EditorialPillButton>
    <EditorialPillButton active={false} onClick={noop}>
      Archived
    </EditorialPillButton>
  </div>
);

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-3">
    <EditorialPillButton active size="sm" onClick={noop}>
      sm · Live table
    </EditorialPillButton>
    <EditorialPillButton active size="md" onClick={noop}>
      md · Draft board
    </EditorialPillButton>
  </div>
);

export const ViewSwitcher = () => (
  <div className="max-w-md">
    <p
      className="text-sm"
      style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)", margin: 0 }}
    >
      Switch between the live feed and the applications you are tracking.
    </p>
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label="Job tracker view"
      style={{ borderTop: "1px solid var(--home-rule)", marginTop: 16, paddingTop: 16 }}
    >
      <EditorialPillButton active onClick={noop} role="tab" ariaSelected size="sm">
        Feed
      </EditorialPillButton>
      <EditorialPillButton active={false} onClick={noop} role="tab" ariaSelected={false} size="sm">
        Applications
      </EditorialPillButton>
    </div>
  </div>
);
