"use client";

import { useTablistKeyboard } from "@/hooks/useTablistKeyboard";

export interface SegmentedTabItem {
  id: string;
  label: string;
}

/**
 * The detail tabs for both league pages, printed as the same underlined
 * `.c97-segmented` control the view filters and the other sports pages use,
 * so they wrap cleanly on a phone. Arrow keys move through the tabs, with
 * the selected tab as the group's one stop in the Tab order. Renders the `role="tablist"`
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
  const handleTabKeyDown = useTablistKeyboard(tabs, (tab) => onChange(tab.id));

  return (
    <div
      // Its callers stack it in a flex column, so the parent's gap spaces it.
      className={`c97-segmented ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab, index) => {
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
            onKeyDown={(event) => handleTabKeyDown(event, index)}
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
