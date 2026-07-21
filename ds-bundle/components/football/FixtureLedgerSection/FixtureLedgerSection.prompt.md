FixtureLedgerSection from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.FixtureLedgerSection` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

The scoreboard ledger: fixtures grouped by matchday inside a bordered
panel per group, each fixture a single 3-column row (home | score-or-time
| away) rather than `FixtureCard`'s stacked two-row layout.

## Props

```ts
interface FixtureLedgerSectionProps {
  groups: Array<{ key: string; label: string; fixtures: Array<{ id: string; utcDate: string; status: string; matchday: null | number; homeTeam: { id: string; shortName: string; crest: null | string }; awayTeam: { id: string; shortName: string; crest: null | string }; score: { winner: null | string; home: null | number; away: null | number; shootoutHome?: null | number; shootoutAway?: null | number } }> }>;
  onOpenTeam?: (teamId: string) => void;
}
```

## Examples

### RecentResults

```jsx
() => (
  <div className="max-w-xl">
    <FixtureLedgerSection groups={groupFixturesByMatchday(recentFixtures)} />
  </div>
);

const upcomingFixtures: GenericFixture[] = [
  {
    id: "pl-381",
    utcDate: "2026-05-24T14:00:00Z",
    status: "TIMED",
    matchday: 38,
    homeTeam: { id: "t-new", shortName: "Newcastle", crest: null },
    awayTeam: { id: "t-avl", shortName: "Aston Villa", crest: null },
    score: { winner: null, home: null, away: null },
  },
  {
    id: "pl-382",
    utcDate: "2026-05-24T14:00:00Z",
    status: "TIMED",
    matchday: 38,
    homeTeam: { id: "t-bha", shortName: "Brighton", crest: null },
    awayTeam: { id: "t-whu", shortName: "West Ham", crest: null },
    score: { winner: null, home: null, away: null },
  },
  {
    id: "pl-383",
    utcDate: "2026-05-24T14:00:00Z",
    status: "TIMED",
    matchday: 38,
    homeTeam: { id: "t-ful", shortName: "Fulham", crest: null },
    awayTeam: { id: "t-cry", shortName: "Crystal Palace", crest: null },
    score: { winner: null, home: null, away: null },
  },
  {
    id: "pl-399",
    utcDate: "2026-05-27T18:45:00Z",
    status: "TIMED",
    matchday: null,
    homeTeam: { id: "t-bou", shortName: "Bournemouth", crest: null },
    awayTeam: { id: "t-wol", shortName: "Wolves", crest: null },
    score: { winner: null, home: null, away: null },
  },
]
```

### UpcomingSlate

```jsx
() => (
  <div className="max-w-xl">
    <FixtureLedgerSection
      groups={groupFixturesByMatchday(upcomingFixtures, {
        suffix: "upcoming",
        fallbackLabel: "Rearranged",
      })}
    />
  </div>
)
```
