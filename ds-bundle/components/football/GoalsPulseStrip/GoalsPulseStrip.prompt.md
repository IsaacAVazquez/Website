GoalsPulseStrip from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.GoalsPulseStrip` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

Goals-per-matchday pulse — the dashboard's namesake device: one bar per
matchday, height scaled to the season's highest-scoring matchday, the most
recent bar picked out in --home-signal. `data` is season-to-date and can
legitimately be empty (a pre-season snapshot has no FINISHED matches yet),
so this renders a plain, on-brand empty state instead of an empty chart —
the page should ship now and light up once the first matchday completes.

## Props

```ts
interface GoalsPulseStripProps {
  data: Array<{ matchday: number; totalGoals: number }>;
  capLabel?: string;
  className?: string;
}
```

## Examples

### MidSeason

```jsx
() => (
  <div style={{ width: 200 }}>
    <GoalsPulseStrip data={midSeason} capLabel="MD 01–14" />
  </div>
);

const fullSeason: GoalsPulseEntry[] = [
  31, 28, 35, 24, 30, 27, 33, 29, 22, 38, 26, 31, 25, 34, 28, 32, 23, 36, 29,
  27, 31, 24, 33, 30, 26, 35, 28, 21, 32, 29, 34, 25, 30, 37, 27, 31, 26, 39,
].map((totalGoals, index) => ({ matchday: index + 1, totalGoals }))
```

### FullSeason

```jsx
() => (
  <div style={{ width: 420 }}>
    <GoalsPulseStrip data={fullSeason} capLabel="MD 01–38" />
  </div>
)
```

### PreSeasonEmpty

```jsx
() => (
  <div style={{ width: 220 }}>
    <GoalsPulseStrip data={[]} />
  </div>
)
```
