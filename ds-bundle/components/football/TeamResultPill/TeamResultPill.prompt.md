TeamResultPill from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.TeamResultPill` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface TeamResultPillProps {
  result: "W" | "D" | "L";
}
```

## Examples

### Results

```jsx
() => (
  <div className="flex items-center gap-3">
    <TeamResultPill result="W" />
    <TeamResultPill result="D" />
    <TeamResultPill result="L" />
  </div>
);

const arsenalForm: Array<"W" | "D" | "L"> = ["W", "W", "D", "W", "W"];
const sevillaForm: Array<"W" | "D" | "L"> = ["L", "D", "L", "W", "L"]
```

### FormStrip

```jsx
() => (
  <div className="max-w-md space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm" style={{ fontWeight: 600, color: "var(--home-ink)" }}>
          Arsenal
        </p>
        <p className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
          Last five, Premier League
        </p>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {arsenalForm.map((result, i) => (
          <TeamResultPill key={i} result={result} />
        ))}
      </div>
    </div>
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm" style={{ fontWeight: 600, color: "var(--home-ink)" }}>
          Sevilla
        </p>
        <p className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
          Last five, La Liga
        </p>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {sevillaForm.map((result, i) => (
          <TeamResultPill key={i} result={result} />
        ))}
      </div>
    </div>
  </div>
)
```
