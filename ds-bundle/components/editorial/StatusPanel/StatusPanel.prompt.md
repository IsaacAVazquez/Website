StatusPanel from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.StatusPanel` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

Centered editorial status card used for loading, empty, and error states.
Tone controls border/background accent while keeping the --home-* palette
so it works in both light and dark mode without extra work.

## Props

```ts
interface StatusPanelProps {
  title: string;
  message: string;
  tone?: "default" | "warning" | "error";
  icon?: React.ReactNode;
  statusRole?: "alert" | "status";
  action?: React.ReactNode;
}
```

## Examples

### EmptyState

```jsx
() => (
  <div className="max-w-2xl">
    <StatusPanel
      title="No applications match."
      message="Try a different search or status filter, or clear both to see the full pipeline again."
      icon={searchIcon}
    />
  </div>
)
```

### ErrorWithRetry

```jsx
() => (
  <div className="max-w-2xl">
    <StatusPanel
      tone="error"
      title="I could not load the feeds."
      message="The RSS refresh timed out before any source responded. The last good snapshot is still on disk, so a retry usually clears this."
      icon={alertIcon}
      action={
        <button type="button" className="home-button home-button-secondary">
          Try again
        </button>
      }
    />
  </div>
)
```

### StaleSnapshotWarning

```jsx
() => (
  <div className="max-w-2xl">
    <StatusPanel
      tone="warning"
      title="Snapshot is running stale."
      message="The last refresh landed nine days ago, so treat the standings below as a rough guide until the next scheduled action commits."
    />
  </div>
)
```
