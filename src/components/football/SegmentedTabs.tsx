export interface SegmentedTabItem {
  id: string;
  label: string;
}

/**
 * Mono fused segmented tab control — ink-fill active state, soft-paper hover
 * on inactive tabs, joined by a 1px `--home-rule` background gap (the same
 * fused-hairline technique as `StatFascia`). Renders the `role="tablist"`
 * wrapper and `role="tab"` buttons; callers own the tab panel(s) and pass a
 * single `panelId` since both league pages use one panel container that
 * swaps content per active tab.
 */
export function SegmentedTabs({
  tabs,
  activeId,
  onChange,
  ariaLabel,
  idPrefix,
  panelId,
  className = "",
}: {
  tabs: SegmentedTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  idPrefix: string;
  panelId: string;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex flex-wrap gap-px overflow-hidden border border-[var(--home-rule)] bg-[var(--home-rule)] ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            id={`${idPrefix}-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`inline-flex min-h-[44px] items-center whitespace-nowrap px-5 font-mono text-2xs uppercase tracking-[0.08em] transition-colors ${
              isActive
                ? "bg-[var(--home-ink)] text-[var(--home-paper)]"
                : "bg-[var(--home-paper)] text-[var(--home-ink-muted)] hover:bg-[var(--home-paper-raised)] hover:text-[var(--home-ink)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
