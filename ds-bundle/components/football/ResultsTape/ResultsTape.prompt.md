ResultsTape from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.ResultsTape` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

League results tape — the investments terminal's quote-tape device ported
into the matchday sheet: recent scorelines (winner/loser in the W/D/L
semantic colors) followed by upcoming kickoffs, on the shared
`InstrumentTape` fused-hairline track. Purely presentational; callers
supply the already-fetched recent/upcoming fixture arrays.

## Props

```ts
interface ResultsTapeProps {
  recentFixtures: Array<{ id: string; utcDate: string; status: string; homeTeam: { shortName: string; tla?: null | string }; awayTeam: { shortName: string; tla?: null | string }; score: { winner: null | "HOME_TEAM" | "AWAY_TEAM" | "DRAW"; home: null | number; away: null | number } }>;
  upcomingFixtures: Array<{ id: string; utcDate: string; status: string; homeTeam: { shortName: string; tla?: null | string }; awayTeam: { shortName: string; tla?: null | string }; score: { winner: null | "HOME_TEAM" | "AWAY_TEAM" | "DRAW"; home: null | number; away: null | number } }>;
  label?: React.ReactNode;
  emptyFallback?: React.ReactNode;
  className?: string;
}
```

## Examples

### MatchdayLatest

```jsx
() => (
  <div style={tapeShell}>
    <ResultsTape
      recentFixtures={recentResults}
      upcomingFixtures={upcomingFixtures.slice(0, 1)}
      label={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {signalDot}
          Matchday 37 · latest
        </span>
      }
    />
  </div>
)
```

### ResultsOnly

```jsx
() => (
  <div style={tapeShell}>
    <ResultsTape
      recentFixtures={recentResults}
      upcomingFixtures={[]}
      label="Full time"
    />
  </div>
)
```

### UpcomingOnly

```jsx
() => (
  <div style={tapeShell}>
    <ResultsTape
      recentFixtures={[]}
      upcomingFixtures={upcomingFixtures}
      label="Next kickoffs"
    />
  </div>
)
```
