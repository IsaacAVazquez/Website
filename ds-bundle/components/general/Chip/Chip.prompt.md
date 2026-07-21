Chip from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.Chip` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

Chip — small mono, uppercase, squared metadata tag (résumé skills,
article tags). Consolidates the `.resume-chip` and `.tag` ad hoc
duplicates into one shared primitive.

## Props

```ts
interface ChipProps {
  tone?: "default" | "signal";
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}
```

## Examples

### Tones

```jsx
() => (
  <div className="flex flex-wrap items-center gap-3">
    <Chip>Snapshot data</Chip>
    <Chip>Half PPR</Chip>
    <Chip tone="signal">Draft day</Chip>
    <Chip tone="signal">Live refresh</Chip>
  </div>
)
```

### SkillTags

```jsx
() => (
  <div className="max-w-md space-y-2">
    <p
      className="text-xs"
      style={{
        color: "var(--home-ink-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      Core skills
    </p>
    <div className="flex flex-wrap gap-2">
      <Chip>QA automation</Chip>
      <Chip>Playwright</Chip>
      <Chip>SQL</Chip>
      <Chip>Product analytics</Chip>
      <Chip>A/B testing</Chip>
      <Chip>Roadmapping</Chip>
      <Chip>Stakeholder comms</Chip>
      <Chip tone="signal">Data storytelling</Chip>
    </div>
  </div>
)
```

### ArticleTags

```jsx
() => (
  <div className="max-w-md rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4 space-y-2">
    <p className="text-sm font-semibold" style={{ color: "var(--home-ink)" }}>
      Tier breaks matter more than pick order
    </p>
    <p className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
      June 12, 2026 · 8 min read
    </p>
    <div className="flex flex-wrap gap-2" style={{ paddingTop: 4 }}>
      <Chip>fantasy football</Chip>
      <Chip>draft strategy</Chip>
      <Chip>adp</Chip>
    </div>
  </div>
)
```
