StatCard from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.StatCard` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

Unified stat card used by both the Premier League and La Liga dashboards.

Both variants share the canonical card radius (var(--radius-2xl)) and the
theme-aware --shadow-sm token; they differ in surface, density, and scale:
- variant="compact"  → PL style: raised surface, metric at text-lg
- variant="full"     → La Liga style: paper-alt surface, title + metric at text-3xl

## Props

```ts
interface StatCardProps {
  eyebrow: string;
  title?: string;
  metric: string;
  detail: string;
  icon: React.ReactNode;
  variant?: "compact" | "full";
}
```

## Examples

### CompactGrid

```jsx
() => (
  <div
    className="max-w-xl"
    style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}
  >
    <StatCard
      variant="compact"
      eyebrow="Leader"
      metric="Arsenal · 86 pts"
      detail="3 clear with one round to play"
      icon={trophyIcon}
    />
    <StatCard
      variant="compact"
      eyebrow="Top scorer"
      metric="24 goals"
      detail="Haaland, Man City"
      icon={targetIcon}
    />
    <StatCard
      variant="compact"
      eyebrow="Best defense"
      metric="27 conceded"
      detail="Arsenal, 17 clean sheets"
      icon={shieldIcon}
    />
    <StatCard
      variant="compact"
      eyebrow="Matchday"
      metric="37 of 38"
      detail="Final round Sunday 16:00"
      icon={calendarIcon}
    />
  </div>
)
```

### FullWithTitle

```jsx
() => (
  <div className="max-w-md">
    <StatCard
      eyebrow="Pichichi race"
      title="Lewandowski holds the lead"
      metric="27 goals"
      detail="Three clear of Vinícius Júnior with four matchdays left in La Liga."
      icon={targetIcon}
    />
  </div>
)
```

### FullMetricOnly

```jsx
() => (
  <div className="max-w-md">
    <StatCard
      eyebrow="Goals per match"
      metric="2.84"
      detail="Up from 2.69 across the same 37 matchdays last season."
      icon={calendarIcon}
    />
  </div>
)
```
