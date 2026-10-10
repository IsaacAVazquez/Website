"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { ResearchLoading } from "./ResearchLoading";
import type { ResearchSectionProps } from "./ResearchWorkspace";

// Everything a picked symbol needs, which is nine panels and the research
// charts. The default is no symbol, so it loads when one is picked.
// A link that names a symbol still renders it on the server. It takes no
// `loading` option, so it suspends to the boundary below, whose fallback can
// name the symbol.
const ResearchWorkspace = dynamic(() =>
  import("./ResearchWorkspace").then((module) => module.ResearchWorkspace),
);

export function ResearchSection(props: ResearchSectionProps) {
  const { symbol } = props;

  if (!symbol) {
    return (
      <section
        id="research-section"
        aria-label="Stock research"
        className="invest-rail-target border border-dashed border-[var(--c97-rule)] bg-[color-mix(in_srgb,var(--c97-surface)_92%,var(--c97-panel))] text-center" style={{ paddingInline: "var(--c97-sp-3)", paddingBlock: "var(--c97-sp-5)" }}
      >
        <p className="invest-rail-section-label">Research</p>
        <p className="text-sm font-semibold text-[var(--c97-ink)]">
          Pick a holding to research
        </p>
        <p className="max-w-md text-sm text-[var(--c97-ink-2)]" style={{ marginInline: "auto", marginTop: "var(--c97-sp-1)" }}>
          Search for a company in the box above, or use Research on any holding in your
          portfolio, to load fundamentals, valuation, growth, and a price chart.
        </p>
      </section>
    );
  }

  return (
    <Suspense
      fallback={
        <section
          id="research-section"
          aria-label={`Research · ${symbol.toUpperCase()}`}
          className="flex flex-col invest-rail-target" style={{ rowGap: "var(--c97-sp-2)" }}
        >
          <ResearchLoading symbol={symbol} />
        </section>
      }
    >
      <ResearchWorkspace {...props} />
    </Suspense>
  );
}
