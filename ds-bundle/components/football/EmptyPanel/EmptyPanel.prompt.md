EmptyPanel from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.EmptyPanel` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface EmptyPanelProps {
  title: string;
  description: string;
}
```

## Examples

### GroupStage

```jsx
() => (
  <div className="max-w-xl">
    <EmptyPanel
      title="Group standings open with the first whistle"
      description="All 12 group tables populate here once the group stage begins on June 11. Until then, browse the host venues and the tournament format."
    />
  </div>
)
```

### QuietMatchweek

```jsx
() => (
  <div className="max-w-md">
    <EmptyPanel
      title="No fixtures in this window"
      description="The next Premier League matchday kicks off Saturday. Results land here as soon as the snapshot refreshes."
    />
  </div>
)
```
