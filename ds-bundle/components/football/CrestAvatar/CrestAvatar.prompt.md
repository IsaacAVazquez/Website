CrestAvatar from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.CrestAvatar` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface CrestAvatarProps {
  crest: null | string;
  name: string;
  size?: "sm" | "md" | "lg";
}
```

## Examples

### InitialsFallback

```jsx
() => (
  <div className="flex items-center gap-4" style={{ alignItems: "flex-end" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <CrestAvatar crest={null} name="Arsenal" size="sm" />
      <p style={sizeCaption}>sm</p>
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <CrestAvatar crest={null} name="Man City" size="md" />
      <p style={sizeCaption}>md</p>
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <CrestAvatar crest={null} name="Real Madrid" size="lg" />
      <p style={sizeCaption}>lg</p>
    </div>
  </div>
)
```

### WithCrestImage

```jsx
() => (
  <div className="flex items-center gap-4">
    <CrestAvatar crest={crestDataUri} name="Newcastle United" size="md" />
    <CrestAvatar crest={crestDataUri} name="Newcastle United" size="lg" />
  </div>
)
```

### InStandingsRow

```jsx
() => (
  <div className="max-w-md">
    {[
      { pos: 1, name: "Real Madrid", points: "89 pts" },
      { pos: 2, name: "Barcelona", points: "85 pts" },
      { pos: 3, name: "Atlético Madrid", points: "74 pts" },
    ].map((row) => (
      <div
        key={row.pos}
        className="flex items-center justify-between gap-3 text-sm"
        style={{ padding: "8px 0", borderBottom: "1px solid var(--home-rule)" }}
      >
        <div className="flex items-center gap-3">
          <span
            style={{
              width: 16,
              color: "var(--home-ink-muted)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {row.pos}
          </span>
          <CrestAvatar crest={null} name={row.name} size="sm" />
          <span style={{ fontWeight: 600, color: "var(--home-ink)" }}>{row.name}</span>
        </div>
        <span style={{ color: "var(--home-ink-muted)", fontVariantNumeric: "tabular-nums" }}>
          {row.points}
        </span>
      </div>
    ))}
  </div>
)
```
