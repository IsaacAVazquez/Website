LeaderLedger from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.LeaderLedger` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

Denser mono leaderboard row list — the design mirror's `.lead-row` (mono
rank, bold name, mono club code, mono value + unit) inside one shared
panel border, as opposed to `LeaderList`'s individually-bordered cards.
Used for the scorers/assists boards on the league pages; `LeaderList`
itself is untouched since NBA/MLB/NFL/World Cup already depend on it.

## Props

```ts
interface LeaderLedgerProps {
  title: string;
  entries: Array<{ rank: number; name: string; clubCode: string; value: number }>;
  unit: string;
  emptyLabel?: string;
}
```

## Examples

### TopScorers

```jsx
() => (
  <div className="max-w-md">
    <LeaderLedger title="Top scorers" unit="G" entries={topScorers} />
  </div>
);

const mostAssists: LeaderLedgerEntry[] = [
  { rank: 1, name: "Mohamed Salah", clubCode: "LIV", value: 13 },
  { rank: 2, name: "Bukayo Saka", clubCode: "ARS", value: 11 },
  { rank: 3, name: "Bruno Fernandes", clubCode: "MUN", value: 10 },
  { rank: 4, name: "Cole Palmer", clubCode: "CHE", value: 9 },
  { rank: 5, name: "Morgan Rogers", clubCode: "AVL", value: 8 },
]
```

### MostAssists

```jsx
() => (
  <div className="max-w-md">
    <LeaderLedger title="Most assists" unit="A" entries={mostAssists} />
  </div>
)
```

### EmptySeason

```jsx
() => (
  <div className="max-w-md">
    <LeaderLedger title="Clean sheets" unit="CS" entries={[]} />
  </div>
)
```
