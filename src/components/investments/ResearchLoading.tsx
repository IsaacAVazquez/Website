/** The panel shown while a symbol's research is on its way. */
export function ResearchLoading({ symbol }: { symbol: string }) {
  return (
    <div role="status" className="border border-[var(--c97-rule)] bg-[color-mix(in_srgb,var(--c97-surface)_92%,var(--c97-panel))] px-6 py-16 text-center ">
      <p className="text-sm font-semibold text-[var(--c97-ink)]">
        Loading research data…
      </p>
      <p className="mt-2 text-sm text-[var(--c97-label)]">
        Pulling the latest curated snapshot for {symbol.toUpperCase()}.
      </p>
    </div>
  );
}
