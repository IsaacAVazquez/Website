StatFascia from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.StatFascia` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

Fused hairline stat strip: a CSS grid with a 1px `--home-rule` background
showing through the grid gap, so adjoining cards read as one strip with
shared hairlines instead of separately-bordered cards. Used both at the
page level (4 cells: leader / top scorer / most goals / best defense) and
inside `ClubDrawer` (8 cells, wraps to two rows) — always 2-up on mobile,
4-up from `sm:` up, matching the design mirror's `.stat-strip`.

## Props

```ts
interface StatFasciaProps {
  items: Array<{ eyebrow: string; metric: string; detail?: string }>;
  dense?: boolean;
  className?: string;
}
```

## Examples

### SeasonPulse

```jsx
() => (
  <div className="max-w-2xl">
    <StatFascia items={seasonPulse} />
  </div>
);

const clubSeason = [
  { eyebrow: "Points", metric: "86", detail: "1st of 20" },
  { eyebrow: "Record", metric: "26-8-4" },
  { eyebrow: "Goals for", metric: "84" },
  { eyebrow: "Goals against", metric: "27" },
  { eyebrow: "Goal diff", metric: "+57" },
  { eyebrow: "Clean sheets", metric: "17" },
  { eyebrow: "Home", metric: "14-3-2" },
  { eyebrow: "Away", metric: "12-5-2" },
]
```

### DenseClubGrid

```jsx
() => (
  <div className="max-w-2xl">
    <StatFascia items={clubSeason} dense />
  </div>
)
```
