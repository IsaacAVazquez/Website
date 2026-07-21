ExpertSignal from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.ExpertSignal` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface ExpertSignalProps {
  type?: "credential" | "achievement" | "expertise" | "education" | "experience" | "award";
  label: string;
  value?: React.ReactNode;
  icon?: React.ReactNode;
  verified?: boolean;
  variant?: "default" | "inline" | "compact" | "badge";
  className?: string;
}
```

## Examples

### DefaultCard

```jsx
() => (
  <div className="max-w-md">
    <ExpertSignal
      type="education"
      label="UC Berkeley, Haas School of Business"
      value="MBA candidate, expected 2027"
      verified
    />
  </div>
)
```

### CompactRows

```jsx
() => (
  <div className="max-w-md space-y-2">
    <ExpertSignal
      variant="compact"
      type="experience"
      label="Six years in QA and product"
      value="Civitech and Open Progress"
    />
    <ExpertSignal
      variant="compact"
      type="achievement"
      label="99.999% platform uptime"
      value="TextOut, reaching millions of voters"
      verified
    />
    <ExpertSignal
      variant="compact"
      type="award"
      label="$4M pricing initiative"
      value="Cross-functional lead at Civitech"
    />
  </div>
)
```

### InlineAndBadge

```jsx
() => (
  <div className="max-w-xl space-y-4">
    <div className="flex flex-wrap items-center gap-4">
      <ExpertSignal variant="inline" type="expertise" label="Product strategy" />
      <ExpertSignal variant="inline" type="education" label="UC Berkeley Haas" value="MBA" verified />
      <ExpertSignal variant="inline" type="experience" label="Civic tech QA" value="6 yrs" />
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <ExpertSignal variant="badge" type="credential" label="FantasyPros consensus data" verified />
      <ExpertSignal variant="badge" type="expertise" label="Draft analytics" />
      <ExpertSignal variant="badge" type="award" label="Top-decile Q4 accuracy" />
    </div>
  </div>
)
```

### Group

```jsx
() => (
  <div className="max-w-2xl">
    <ExpertSignalGroup
      title="Where the analysis comes from"
      columns={2}
      signals={[
        {
          type: "education",
          label: "UC Berkeley, Haas School of Business",
          value: "MBA candidate",
        },
        {
          type: "experience",
          label: "Quality engineering at Civitech",
          value: "Civic tech platforms at scale",
          verified: true,
        },
        {
          type: "expertise",
          label: "Data analytics and dashboards",
          value: "SQL, Tableau, ETL pipelines",
        },
        {
          type: "achievement",
          label: "80+ digital programs delivered",
          value: "Client services at Open Progress",
        },
      ]}
    />
  </div>
)
```
