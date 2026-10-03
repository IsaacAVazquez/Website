export interface SegmentedTabItem {
  id: string;
  label: string;
}

/**
 * The detail tabs for both league pages, printed as the same underlined
 * `.c97-segmented` control the view filters and the other sports pages use,
 * so they wrap cleanly on a phone. Every tab stays in the tab order, since
 * there is no arrow-key handler. Renders the `role="tablist"`
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
      // Its callers stack it in a flex column, so the parent's gap spaces it.
      className={`c97-segmented ${className}`.trim()}
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
            onClick={() => onChange(tab.id)}
            className="min-h-[44px] text-sm font-semibold"
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
