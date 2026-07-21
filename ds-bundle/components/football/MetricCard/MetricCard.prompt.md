MetricCard from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.MetricCard` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

Shared metric stat card used across dashboards (Premier League, La Liga,
Formula 1). Pass `detail`/`icon` for the editorial variant; omit for the
compact football-table variant.

## Props

```ts
interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
  icon?: React.ReactNode;
  className?: string;
}
```

## Examples

### Editorial

```jsx
() => (
  <div
    className="max-w-xl"
    style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}
  >
    <MetricCard
      label="Matches tracked"
      value="104"
      detail="Every World Cup 2026 fixture from the June 11 opener at Estadio Azteca."
      icon={calendarIcon}
    />
    <MetricCard
      label="Goals logged"
      value="289"
      detail="2.78 per match across the group stage and knockouts."
      icon={targetIcon}
    />
  </div>
)
```

### CompactStrip

```jsx
() => (
  <div
    className="max-w-md"
    style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}
  >
    <MetricCard label="Points" value="86" />
    <MetricCard label="Goal diff" value="+57" />
    <MetricCard label="Clean sheets" value="17" />
  </div>
)
```
