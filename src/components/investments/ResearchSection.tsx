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
        className="scroll-mt-12 min-[901px]:scroll-mt-0 border border-dashed border-[var(--c97-rule)] bg-[color-mix(in_srgb,var(--c97-surface)_92%,var(--c97-panel))] px-6 py-12 text-center "
      >
        <p className="invest-rail-section-label">Research</p>
        <p className="text-sm font-semibold text-[var(--c97-ink)]">
          Pick a holding to research
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--c97-ink-2)]">
          Click <strong className="text-[var(--c97-ink)]">Research</strong> on any holding above
          to load the deep-dive view with fundamentals, valuation, growth, and a price chart.
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
          className="scroll-mt-12 min-[901px]:scroll-mt-0 space-y-5"
        >
          <ResearchLoading symbol={symbol} />
        </section>
      }
    >
      <ResearchWorkspace {...props} />
    </Suspense>
  );
}
