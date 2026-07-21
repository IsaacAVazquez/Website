import * as React from "react";
import { MetricCallout, MetricGrid } from "isaac-vazquez-portfolio";

const TrendIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 14l5-5 3 3 8-8" />
    <path d="M13 4h5v5" />
  </svg>
);

export const Variants = () => (
  <div
    className="max-w-2xl"
    style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
  >
    <MetricCallout
      value="42"
      label="Data sources tracked"
      variant="default"
      animateValue={false}
    />
    <MetricCallout
      value="99.2%"
      label="Snapshot refresh success"
      variant="success"
      animateValue={false}
    />
    <MetricCallout
      value="215"
      label="Players ranked this week"
      variant="primary"
      animateValue={false}
    />
    <MetricCallout
      value="6"
      label="Feeds flagged stale"
      variant="warning"
      animateValue={false}
    />
  </div>
);

export const Sizes = () => (
  <div className="flex max-w-2xl flex-wrap gap-3">
    <MetricCallout
      value="$1.2M"
      label="Median outcome, sm"
      size="sm"
      animateValue={false}
    />
    <MetricCallout
      value="$1.2M"
      label="Median outcome, md"
      size="md"
      animateValue={false}
    />
    <MetricCallout
      value="$1.2M"
      label="Median outcome, lg"
      size="lg"
      animateValue={false}
    />
  </div>
);

export const WithIconAndImprovement = () => (
  <div
    className="max-w-xl"
    style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
  >
    <MetricCallout
      value="96%"
      label="ADP match rate"
      improvement="4 pts since the v6 schema"
      icon={TrendIcon}
      variant="primary"
      animateValue={false}
    />
    <MetricCallout
      value="1,240"
      label="Mock drafts parsed"
      improvement="310 added this cycle"
      variant="success"
      animateValue={false}
    />
  </div>
);

export const ProjectImpactGrid = () => (
  <div className="max-w-2xl">
    <MetricGrid columns={2}>
      <MetricCallout
        value="60%"
        label="Regression suite runtime cut"
        improvement="From 50 min to 20 min"
        variant="primary"
        animateValue={false}
      />
      <MetricCallout
        value="1,800+"
        label="Automated checks per release"
        animateValue={false}
      />
      <MetricCallout
        value="12"
        label="Release blockers caught pre-prod"
        improvement="Zero escaped to users"
        animateValue={false}
      />
      <MetricCallout
        value="3x"
        label="Faster triage on flaky tests"
        animateValue={false}
      />
    </MetricGrid>
  </div>
);
