import * as React from "react";
import { Chip, Heading, Kicker, Paragraph } from "isaac-vazquez-portfolio";

export const Variants = () => (
  <div className="max-w-2xl space-y-4">
    <div className="flex flex-wrap items-center gap-4">
      <Kicker>Draft analytics</Kicker>
      <span className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
        dot, the mono signature with the signal prefix
      </span>
    </div>
    <div className="flex flex-wrap items-center gap-4">
      <Kicker variant="plain">Methodology</Kicker>
      <span className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
        plain, the quiet uppercase eyebrow
      </span>
    </div>
  </div>
);

export const DotAboveHeading = () => (
  <div className="max-w-2xl space-y-2">
    <Kicker>Score pools</Kicker>
    <Heading level={2} as="h2">
      Exact scores, priced from the odds
    </Heading>
    <Paragraph className="mb-0">
      The pool picks come from a de-vigged market baseline, then a Dixon-Coles
      layer nudges the scorelines the market systematically underprices. I
      would rather show the calibration compromises than hide them.
    </Paragraph>
  </div>
);

export const PlainEyebrowHeader = () => (
  <div className="max-w-2xl rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
    <div className="flex items-center justify-between gap-3">
      <div className="space-y-2">
        <Kicker variant="plain">Live feeds</Kicker>
        <Heading level={4} as="h2">
          Internship postings tracker
        </Heading>
      </div>
      <Chip tone="signal">14 sources</Chip>
    </div>
    <p className="text-sm" style={{ color: "var(--home-ink-muted)", marginTop: 12 }}>
      Refreshed nightly from the committed snapshot. A failed pull keeps
      yesterday&apos;s postings rather than an empty page.
    </p>
  </div>
);
