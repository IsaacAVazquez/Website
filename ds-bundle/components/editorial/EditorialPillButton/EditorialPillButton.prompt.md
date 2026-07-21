EditorialPillButton from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.EditorialPillButton` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

Rounded, uppercase-ready pill button used for tabs, filter toggles, and
segmented controls throughout the editorial pages. Guarantees the 44px
minimum touch target and uses the editorial color system.

## Props

```ts
interface EditorialPillButtonProps {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  role?: "tab";
  ariaSelected?: boolean;
  size?: "sm" | "md";
}
```

## Examples

### ScoringFormatTabs

```jsx
() => (
  <div className="flex flex-wrap gap-2" role="tablist" aria-label="Scoring format">
    <EditorialPillButton active onClick={noop} role="tab" ariaSelected size="sm">
      PPR
    </EditorialPillButton>
    <EditorialPillButton active={false} onClick={noop} role="tab" ariaSelected={false} size="sm">
      Half PPR
    </EditorialPillButton>
    <EditorialPillButton active={false} onClick={noop} role="tab" ariaSelected={false} size="sm">
      Standard
    </EditorialPillButton>
  </div>
)
```

### States

```jsx
() => (
  <div className="flex flex-wrap items-center gap-3">
    <EditorialPillButton active onClick={noop}>
      Tracked roles
    </EditorialPillButton>
    <EditorialPillButton active={false} onClick={noop}>
      Archived
    </EditorialPillButton>
  </div>
)
```

### Sizes

```jsx
() => (
  <div className="flex flex-wrap items-center gap-3">
    <EditorialPillButton active size="sm" onClick={noop}>
      sm · Live table
    </EditorialPillButton>
    <EditorialPillButton active size="md" onClick={noop}>
      md · Draft board
    </EditorialPillButton>
  </div>
)
```

### ViewSwitcher

```jsx
() => (
  <div className="max-w-md">
    <p
      className="text-sm"
      style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)", margin: 0 }}
    >
      Switch between the live feed and the applications you are tracking.
    </p>
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label="Job tracker view"
      style={{ borderTop: "1px solid var(--home-rule)", marginTop: 16, paddingTop: 16 }}
    >
      <EditorialPillButton active onClick={noop} role="tab" ariaSelected size="sm">
        Feed
      </EditorialPillButton>
      <EditorialPillButton active={false} onClick={noop} role="tab" ariaSelected={false} size="sm">
        Applications
      </EditorialPillButton>
    </div>
  </div>
)
```
