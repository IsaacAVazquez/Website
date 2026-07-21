FixtureCard from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.FixtureCard` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface FixtureCardProps {
  fixture: { id: string; utcDate: string; status: string; matchday: null | number; homeTeam: { id: string; shortName: string; crest: null | string }; awayTeam: { id: string; shortName: string; crest: null | string }; score: { winner: null | string; home: null | number; away: null | number; shootoutHome?: null | number; shootoutAway?: null | number } };
  contextTeamId?: null | string;
  onOpenTeam?: (teamId: string) => void;
  compact?: boolean;
  style?: React.CSSProperties;
  periodLabel?: string;
  fallbackLabel?: string;
}
```

## Examples

### Finished

```jsx
() => (
  <div className="max-w-md">
    <FixtureCard fixture={finished} />
  </div>
)
```

### Upcoming

```jsx
() => (
  <div className="max-w-md">
    <FixtureCard fixture={upcoming} />
  </div>
);

const finishedDraw = {
  id: "pl-433",
  utcDate: "2026-05-10T14:00:00Z",
  status: "FINISHED",
  matchday: 36,
  homeTeam: { id: "t-liv", shortName: "Liverpool", crest: null },
  awayTeam: { id: "t-tot", shortName: "Tottenham", crest: null },
  score: { winner: "DRAW", home: 1, away: 1 },
}
```

### CompactWithTeamContext

```jsx
() => (
  <div className="max-w-md space-y-2">
    <FixtureCard fixture={finished} compact contextTeamId="t-ars" />
    <FixtureCard fixture={finishedDraw} compact contextTeamId="t-liv" />
    <FixtureCard fixture={finished} compact contextTeamId="t-liv" />
  </div>
)
```

### ShootoutDecided

```jsx
() => (
  <div className="max-w-md">
    <FixtureCard fixture={shootout} periodLabel="Round of 16" fallbackLabel="Knockout tie" />
  </div>
)
```
