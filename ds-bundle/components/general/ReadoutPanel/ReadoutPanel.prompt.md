ReadoutPanel from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.ReadoutPanel` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

ReadoutPanel — the signature "live index" instrument: a paper panel capped
with a 3px signal bezel, a mono cap row (left label / right stamp), a
stack of readout rows (label + big mono tabular value), an optional chart
slot, and an optional footer line.

Colors resolve through --hp-* custom properties so an ancestor "plate"
wrapper can rebind them to invert the panel for its context (see the
module CSS doc comment); standalone use falls back to the plain --home-*
tokens.

## Props

```ts
interface ReadoutPanelProps {
  label?: React.ReactNode;
  stamp?: React.ReactNode;
  rows?: Array<{ label: string; value: React.ReactNode }>;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
```

## Examples

### LiveIndex

```jsx
() => (
  <div className="max-w-md">
    <ReadoutPanel
      label={liveLabel}
      stamp={<span>12:00:04 UTC</span>}
      rows={heroRows}
      footer={footerNote}
    />
  </div>
);

const sparkValues = [2.1, 3.4, 2.8, 4.6, 3.1, 2.2, 5.0, 3.7, 2.9, 4.1];

const magnitudeSpark = (
  <div style={{ padding: "14px 16px 6px" }}>
    <svg
      viewBox="0 0 300 26"
      preserveAspectRatio="none"
      style={{ width: "100%", height: 26, display: "block" }}
      aria-hidden="true"
    >
      {sparkValues.map((value, index) => {
        const barHeight = Math.max(2, (value / 5) * 26);
        return (
          <rect
            key={index}
            x={index * 30}
            y={26 - barHeight}
            width={27}
            height={barHeight}
            fill={
              index === sparkValues.length - 1
                ? "var(--home-signal)"
                : "var(--home-rule)"
            }
          />
        );
      })}
    </svg>
  </div>
)
```

### WithSparkline

```jsx
() => (
  <div className="max-w-md">
    <ReadoutPanel
      label={liveLabel}
      stamp={<span>Feed 3 min old</span>}
      rows={[
        { label: "Latest quake", value: "M 4.6" },
        { label: "Depth", value: "11 km" },
      ]}
      footer={footerNote}
    >
      {magnitudeSpark}
    </ReadoutPanel>
  </div>
);

// The homepage hero plate rebinds the --hp-* aliases so the panel inverts for
// that context (ported from src/app/page.module.css .plate).
const plateVars = {
  "--hp-ink": "var(--home-paper-alt)",
  "--hp-paper": "var(--home-ink)",
  "--hp-muted": "color-mix(in srgb, var(--home-paper-alt) 60%, transparent)",
  "--hp-rule": "color-mix(in srgb, var(--home-paper-alt) 18%, transparent)",
  "--hp-rule-soft": "color-mix(in srgb, var(--home-paper-alt) 10%, transparent)",
  background: "var(--hp-ink)",
  color: "var(--hp-paper)",
  border: "1px solid var(--home-rule)",
  padding: "1.75rem 1.25rem",
} as React.CSSProperties
```

### OnHeroPlate

```jsx
() => (
  <div className="max-w-md" style={plateVars}>
    <ReadoutPanel
      label={liveLabel}
      stamp={<span>12:00:04 UTC</span>}
      rows={heroRows}
    />
  </div>
)
```
