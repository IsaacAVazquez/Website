LeaderList from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.LeaderList` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface LeaderListProps {
  leaders: Array<{ rank: number; name: string; clubId: string; clubCode: string; total: number; appearances: number; perMatch: number }>;
  statLabel: string;
  clubLookup?: Map<string, string>;
}
```

## Examples

### GoldenBootRace

```jsx
() => (
  <div className="max-w-md">
    <LeaderList leaders={goldenBoot} statLabel="goals" clubLookup={countryLookup} />
  </div>
);

const assistLeaders: LeaderEntry[] = [
  { rank: 1, name: "Lamine Yamal", clubId: "t-bar", clubCode: "BAR", total: 12, appearances: 33, perMatch: 0.36 },
  { rank: 2, name: "Antoine Griezmann", clubId: "t-atm", clubCode: "ATM", total: 10, appearances: 34, perMatch: 0.29 },
  { rank: 3, name: "Jude Bellingham", clubId: "t-rma", clubCode: "RMA", total: 9, appearances: 31, perMatch: 0.29 },
]
```

### AssistLeadersClubCodes

```jsx
() => (
  <div className="max-w-md">
    <LeaderList leaders={assistLeaders} statLabel="assists" />
  </div>
)
```
