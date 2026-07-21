ThemeToggle from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.ThemeToggle` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface ThemeToggleProps {
  className?: string;
}
```

## Examples

### Default

```jsx
() => <ThemeToggle />
```

### InHeaderRow

```jsx
() => (
  <div
    className="flex items-center justify-between px-4 border rounded-lg"
    style={{
      maxWidth: 420,
      borderColor: "var(--home-rule)",
      background: "var(--home-paper)",
      paddingTop: 6,
      paddingBottom: 6,
    }}
  >
    <span
      style={{
        fontWeight: 650,
        fontSize: 14,
        color: "var(--home-ink)",
        letterSpacing: "0.01em",
      }}
    >
      Isaac Vazquez
    </span>
    <div className="flex items-center gap-3">
      <span className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
        Portfolio
      </span>
      <span className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
        Writing
      </span>
      <ThemeToggle />
    </div>
  </div>
)
```
