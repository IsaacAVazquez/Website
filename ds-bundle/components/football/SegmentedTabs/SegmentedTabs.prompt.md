SegmentedTabs from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.SegmentedTabs` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

Mono fused segmented tab control — ink-fill active state, soft-paper hover
on inactive tabs, joined by a 1px `--home-rule` background gap (the same
fused-hairline technique as `StatFascia`). Renders the `role="tablist"`
wrapper and `role="tab"` buttons; callers own the tab panel(s) and pass a
single `panelId` since both league pages use one panel container that
swaps content per active tab.

## Props

```ts
interface SegmentedTabsProps {
  tabs: Array<{ id: string; label: string }>;
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  idPrefix: string;
  panelId: string;
  className?: string;
}
```

## Examples

### ClubDetailTabs

```jsx
() => (
  <div>
    <SegmentedTabs
      tabs={[
        { id: "club", label: "Club Detail" },
        { id: "fixtures", label: "Fixtures" },
        { id: "scorers", label: "Top Scorers" },
      ]}
      activeId="club"
      onChange={noop}
      ariaLabel="Club and league details"
      idPrefix="pl-detail-tab"
      panelId="pl-detail-panel"
    />
    <div
      id="pl-detail-panel"
      role="tabpanel"
      aria-labelledby="pl-detail-tab-club"
      className="text-sm"
      style={{ marginTop: 16, color: "var(--home-ink-muted)", maxWidth: "36ch" }}
    >
      Arsenal sit top on 82 points with two matchdays left, four clear of Man
      City on goal difference.
    </div>
  </div>
)
```

### MiddleTabActive

```jsx
() => (
  <SegmentedTabs
    tabs={[
      { id: "overview", label: "Overview" },
      { id: "table", label: "Table" },
      { id: "fixtures", label: "Fixtures" },
      { id: "scorers", label: "Scorers" },
      { id: "form", label: "Form" },
    ]}
    activeId="fixtures"
    onChange={noop}
    ariaLabel="League sections"
    idPrefix="liga-tab"
    panelId="liga-panel"
  />
)
```

### WrappedTabs

```jsx
() => (
  <div style={{ maxWidth: 300 }}>
    <SegmentedTabs
      tabs={[
        { id: "club", label: "Club Detail" },
        { id: "fixtures", label: "Fixtures" },
        { id: "scorers", label: "Top Scorers" },
        { id: "form", label: "Form Guide" },
      ]}
      activeId="scorers"
      onChange={noop}
      ariaLabel="Club and league details"
      idPrefix="wrap-tab"
      panelId="wrap-panel"
    />
  </div>
)
```
