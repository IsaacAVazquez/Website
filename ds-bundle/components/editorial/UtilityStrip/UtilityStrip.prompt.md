UtilityStrip from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.UtilityStrip` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

Thin pill-shaped container used for meta/status strips above or below a
section (e.g. "Last refreshed...", "N items across M sources"). Paired with
the editorial palette so it blends into any --home-* page.

## Props

```ts
interface UtilityStripProps {
  children: React.ReactNode;
}
```

## Examples

### RefreshMeta

```jsx
() => (
  <div style={{ display: "flex", justifyContent: "center" }}>
    <UtilityStrip>128 roles shown · Refreshed May 15, 10:42 AM · Polls every 30 min</UtilityStrip>
  </div>
)
```

### WithEmphasis

```jsx
() => (
  <div style={{ display: "flex", justifyContent: "center" }}>
    <UtilityStrip>
      <strong style={{ color: "var(--home-ink)", fontWeight: 600 }}>Curated snapshot</strong> · 42
      symbols · Reviewed against the May broker statements
    </UtilityStrip>
  </div>
)
```
