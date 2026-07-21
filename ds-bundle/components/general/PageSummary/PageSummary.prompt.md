PageSummary from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.PageSummary` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface PageSummaryProps {
  title?: string;
  summary: React.ReactNode;
  tldr?: React.ReactNode;
  context?: React.ReactNode;
  variant?: "default" | "compact" | "featured";
  showIcon?: boolean;
  className?: string;
}
```

## Examples

### Featured

```jsx
() => (
  <div className="max-w-2xl">
    <PageSummary
      variant="featured"
      title="Draft strategy, tested against real ADP"
      tldr="Tier breaks matter more than pick order. I'd rather reach a round early for the last player in a tier than take the best name available after it snaps."
      summary="I rebuilt the draft board around tier gaps instead of overall rank. The rankings come from a FantasyPros consensus snapshot, and the ADP baseline comes from mock drafts, so every reach and steal is measured against what real drafters actually do."
      context="Numbers refresh weekly during the season. Treat the tiers as the signal and the exact ranks as noise."
    />
  </div>
)
```

### Default

```jsx
() => (
  <div className="max-w-2xl">
    <PageSummary
      title="How the retirement planner thinks"
      summary="The projection engine is deliberately boring: dated capital-market assumptions, a seeded Monte Carlo run, and no hidden levers. I think the honest move is showing the assumptions next to the output, so the page does exactly that."
    />
  </div>
)
```

### Compact

```jsx
() => (
  <div className="max-w-2xl">
    <PageSummary
      variant="compact"
      title="About this dashboard"
      summary="Scores land as committed snapshots, not live API calls, so the page stays fast and the data stays auditable."
    />
  </div>
)
```
