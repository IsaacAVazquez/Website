/** The panel shown while a symbol's research is on its way. */
export function ResearchLoading({ symbol }: { symbol: string }) {
  return (
    <div role="status" className="border border-[var(--c97-rule)] bg-[color-mix(in_srgb,var(--c97-surface)_92%,var(--c97-panel))] text-center" style={{ paddingInline: "var(--c97-sp-3)", paddingBlock: "var(--c97-sp-5)" }}>
      <p className="text-sm font-semibold text-[var(--c97-ink)]">
        Loading research data…
      </p>
      <p className="text-sm text-[var(--c97-label)]" style={{ marginTop: "var(--c97-sp-1)" }}>
        Pulling the latest curated snapshot for {symbol.toUpperCase()}.
      </p>
    </div>
  );
}
