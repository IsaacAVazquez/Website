import * as React from "react";
import { Heading } from "isaac-vazquez-portfolio";

export const LevelScale = () => (
  <div className="max-w-2xl space-y-2">
    <Heading level={1}>The draft board</Heading>
    <Heading level={2}>Tiers, then names</Heading>
    <Heading level={3}>Reaches, steals, and runs</Heading>
    <Heading level={4}>How ADP matching works</Heading>
    <Heading level={5}>Snapshot freshness rules</Heading>
    <Heading level={6}>Schema v6 field notes</Heading>
  </div>
);

export const PageTitle = () => (
  <div className="max-w-2xl space-y-4">
    <Heading level={1}>I build tools I actually use</Heading>
    <p
      style={{
        color: "var(--home-ink-muted)",
        fontSize: "1.05rem",
        lineHeight: 1.65,
        maxWidth: "48ch",
      }}
    >
      QA engineer turned MBA. Most of this site is me working through draft
      boards, retirement math, and match data in public, because I think the
      honest way to learn a system is to ship one.
    </p>
    <div style={{ height: 1, background: "var(--home-rule)", maxWidth: "48ch" }} />
  </div>
);

export const CardHeadings = () => (
  <div className="flex max-w-2xl gap-4">
    <div className="flex-1 rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4 space-y-2">
      <Heading level={5} as="h3">
        Premier League form
      </Heading>
      <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
        Last five matchdays, weighted toward away results.
      </p>
    </div>
    <div className="flex-1 rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4 space-y-2">
      <Heading level={6} as="h3">
        Monte Carlo runs
      </Heading>
      <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
        1,000 seeded paths against the dated capital-market assumptions.
      </p>
    </div>
  </div>
);
