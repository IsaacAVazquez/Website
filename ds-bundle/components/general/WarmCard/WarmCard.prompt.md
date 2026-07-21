WarmCard from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.WarmCard` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface WarmCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg" | "none" | "xl";
  ariaLabel?: string;
  ariaDescription?: string;
  onClick?: (e: React.MouseEvent<Element, MouseEvent>) => void;
}
```

## Examples

### Default

```jsx
() => (
  <div className="max-w-md">
    <WarmCard padding="md" ariaLabel="Case study card">
      <p style={kicker}>Case study</p>
      <h3
        style={{
          margin: "10px 0 6px",
          fontSize: "1.15rem",
          fontWeight: 600,
          color: "var(--home-ink)",
        }}
      >
        Draft tiers, not draft ranks
      </h3>
      <p
        className="text-sm"
        style={{ margin: 0, color: "var(--home-ink-muted)", lineHeight: 1.6 }}
      >
        I clustered the FantasyPros consensus into tiers so a pick reads as a
        gap decision, and the board updates from a committed weekly snapshot.
      </p>
    </WarmCard>
  </div>
)
```

### PaddingScale

```jsx
() => (
  <div className="max-w-md space-y-4">
    {(["sm", "md", "lg"] as const).map((padding) => (
      <WarmCard key={padding} padding={padding}>
        <p style={kicker}>padding · {padding}</p>
        <p className="text-sm" style={{ margin: "6px 0 0", color: "var(--home-ink)" }}>
          Snapshot refreshed weekly by CI.
        </p>
      </WarmCard>
    ))}
  </div>
)
```

### HoverPair

```jsx
() => (
  <div className="grid gap-4 max-w-xl" style={{ gridTemplateColumns: "1fr 1fr" }}>
    <WarmCard padding="md" hover ariaLabel="Email contact card">
      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--home-ink)" }}>
        Email
      </h3>
      <p className="text-sm" style={{ margin: "6px 0 0", color: "var(--home-ink-muted)" }}>
        The fastest way to reach me about product work.
      </p>
    </WarmCard>
    <WarmCard padding="md" hover ariaLabel="LinkedIn contact card">
      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--home-ink)" }}>
        LinkedIn
      </h3>
      <p className="text-sm" style={{ margin: "6px 0 0", color: "var(--home-ink-muted)" }}>
        Where the Haas and Civitech chapters live in more detail.
      </p>
    </WarmCard>
  </div>
)
```
