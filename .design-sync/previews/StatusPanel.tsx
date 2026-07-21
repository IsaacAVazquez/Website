import * as React from "react";
import { StatusPanel } from "isaac-vazquez-portfolio";

const searchIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const alertIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const EmptyState = () => (
  <div className="max-w-2xl">
    <StatusPanel
      title="No applications match."
      message="Try a different search or status filter, or clear both to see the full pipeline again."
      icon={searchIcon}
    />
  </div>
);

export const ErrorWithRetry = () => (
  <div className="max-w-2xl">
    <StatusPanel
      tone="error"
      title="I could not load the feeds."
      message="The RSS refresh timed out before any source responded. The last good snapshot is still on disk, so a retry usually clears this."
      icon={alertIcon}
      action={
        <button type="button" className="home-button home-button-secondary">
          Try again
        </button>
      }
    />
  </div>
);

export const StaleSnapshotWarning = () => (
  <div className="max-w-2xl">
    <StatusPanel
      tone="warning"
      title="Snapshot is running stale."
      message="The last refresh landed nine days ago, so treat the standings below as a rough guide until the next scheduled action commits."
    />
  </div>
);
