ClubDrawer from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.ClubDrawer` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

Club detail drawer — the standings' drill-down, opened by selecting a
clickable club row. Built on the same pattern as
`src/components/fantasy/PlayerDetailDrawer.tsx` (Framer Motion,
`useReducedMotion`, manual focus trap, Escape + backdrop close,
`role="dialog" aria-modal="true"`), with a body-scroll lock added to match
the design mirror's overlay behavior. `club` is `null` when nothing is
selected, which also fully unmounts the drawer via `AnimatePresence`.

## Props

```ts
interface ClubDrawerProps {
  club: null | { id: string; name: string; crest: null | string; accentColor?: null | string; position: number; points: number; played: number; won: number; draw: number; lost: number; goalsFor: number; goalsAgainst: number; goalDifference: number; manager?: null | string; venue?: null | string };
  formSequence: Array<"W" | "D" | "L">;
  topScorers: Array<{ name: string; goals: number; assists: number }>;
  recentFixtures: Array<{ id: string; utcDate: string; status: string; matchday: null | number; homeTeam: { id: string; shortName: string; crest: null | string }; awayTeam: { id: string; shortName: string; crest: null | string }; score: { winner: null | string; home: null | number; away: null | number; shootoutHome?: null | number; shootoutAway?: null | number } }>;
  upcomingFixtures: Array<{ id: string; utcDate: string; status: string; matchday: null | number; homeTeam: { id: string; shortName: string; crest: null | string }; awayTeam: { id: string; shortName: string; crest: null | string }; score: { winner: null | string; home: null | number; away: null | number; shootoutHome?: null | number; shootoutAway?: null | number } }>;
  isLoadingDetail?: boolean;
  detailError?: null | string;
  onClose: () => void;
  testId?: string;
}
```

## Examples

### OpenClubDetail

```jsx
() => (
  <Frame height={700}>
    <ClubDrawer
      club={arsenal}
      formSequence={["W", "W", "D", "W", "L"]}
      topScorers={arsenalScorers}
      recentFixtures={arsenalRecent}
      upcomingFixtures={arsenalUpcoming}
      onClose={noop}
    />
  </Frame>
);

const realBetis: ClubDrawerClub = {
  id: "90",
  name: "Real Betis",
  crest: null,
  accentColor: "#00954C",
  position: 6,
  points: 57,
  played: 35,
  won: 16,
  draw: 9,
  lost: 10,
  goalsFor: 52,
  goalsAgainst: 44,
  goalDifference: 8,
  manager: "Manuel Pellegrini",
  venue: "Estadio Benito Villamarín",
}
```

### LoadingDetail

```jsx
() => (
  <Frame height={480}>
    <ClubDrawer
      club={realBetis}
      formSequence={["D", "W", "L", "W", "D"]}
      topScorers={[]}
      recentFixtures={[]}
      upcomingFixtures={[]}
      isLoadingDetail
      onClose={noop}
    />
  </Frame>
)
```
