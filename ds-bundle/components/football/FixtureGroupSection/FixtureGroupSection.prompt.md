FixtureGroupSection from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.FixtureGroupSection` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface FixtureGroupSectionProps {
  title: string;
  description: string;
  fixtures: Array<{ id: string; utcDate: string; status: string; matchday: null | number; homeTeam: { id: string; shortName: string; crest: null | string }; awayTeam: { id: string; shortName: string; crest: null | string }; score: { winner: null | string; home: null | number; away: null | number; shootoutHome?: null | number; shootoutAway?: null | number } }>;
  contextTeamId?: null | string;
  onOpenTeam?: (teamId: string) => void;
  getFallbackLabel?: (fixture: { id: string; utcDate: string; status: string; matchday: null | number; homeTeam: { id: string; shortName: string; crest: null | string }; awayTeam: { id: string; shortName: string; crest: null | string }; score: { winner: null | string; home: null | number; away: null | number; shootoutHome?: null | number; shootoutAway?: null | number } }) => string;
}
```

## Examples

### UpcomingMatches

```jsx
() => (
  <div className="max-w-xl">
    <FixtureGroupSection
      title="Next up"
      description="Upcoming matches"
      fixtures={worldCupUpcoming}
      getFallbackLabel={(fixture) => groupLabels[fixture.id]}
    />
  </div>
);

const premierLeagueResults: GenericFixture[] = [
  {
    id: "pl-361",
    utcDate: "2026-05-09T14:00:00Z",
    status: "FINISHED",
    matchday: 36,
    homeTeam: { id: "t-ars", shortName: "Arsenal", crest: null },
    awayTeam: { id: "t-new", shortName: "Newcastle", crest: null },
    score: { winner: "HOME_TEAM", home: 3, away: 1 },
  },
  {
    id: "pl-362",
    utcDate: "2026-05-09T16:30:00Z",
    status: "FINISHED",
    matchday: 36,
    homeTeam: { id: "t-tot", shortName: "Tottenham", crest: null },
    awayTeam: { id: "t-che", shortName: "Chelsea", crest: null },
    score: { winner: "DRAW", home: 2, away: 2 },
  },
]
```

### LatestResults

```jsx
() => (
  <div className="max-w-xl">
    <FixtureGroupSection
      title="Recent slate"
      description="Latest results"
      fixtures={premierLeagueResults}
    />
  </div>
)
```

### EmptyState

```jsx
() => (
  <div className="max-w-xl">
    <FixtureGroupSection
      title="Next up"
      description="Upcoming matches"
      fixtures={[]}
    />
  </div>
)
```
