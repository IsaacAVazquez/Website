import * as React from "react";
import { Badge } from "isaac-vazquez-portfolio";

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Badge variant="default">Signal</Badge>
    <Badge variant="success">Feed live</Badge>
    <Badge variant="warning">Snapshot stale</Badge>
    <Badge variant="error">Source down</Badge>
    <Badge variant="outline">Archived</Badge>
  </div>
);

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Badge variant="default" size="sm">
      sm · v6 schema
    </Badge>
    <Badge variant="default" size="md">
      md · PPR rankings
    </Badge>
    <Badge variant="default" size="lg">
      lg · Draft day
    </Badge>
  </div>
);

export const InContext = () => (
  <div className="flex max-w-md items-center justify-between gap-3 rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-4 py-3">
    <div>
      <p className="text-sm font-semibold text-[var(--home-ink)]">Quarterly rebalance</p>
      <p className="text-xs text-[var(--home-ink-muted)]">Ran against the July snapshot</p>
    </div>
    <Badge variant="success">Verified</Badge>
  </div>
);
