DropdownMenu from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.DropdownMenu` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface DropdownMenuProps {
  children?: React.ReactNode;
  dir?: "ltr" | "rtl";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
}
```

## Examples

### TriggerClosed

```jsx
() => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button type="button" style={triggerStyle}>
        <span
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--home-ink-muted)",
          }}
        >
          Source
        </span>
        <span>All feeds</span>
        <Chevron />
      </button>
    </DropdownMenuTrigger>
  </DropdownMenu>
)
```

### OpenMenu

```jsx
() => (
  <div style={{ minHeight: 320 }}>
    <DropdownMenu open modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" style={triggerStyle}>
          <span>Scoring format</span>
          <Chevron />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} style={{ minWidth: 220 }}>
        <DropdownMenuLabel>Scoring format</DropdownMenuLabel>
        <DropdownMenuRadioGroup value="half-ppr">
          <DropdownMenuRadioItem value="ppr">PPR</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="half-ppr">Half PPR</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="standard">Standard</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked>Show tier breaks</DropdownMenuCheckboxItem>
        <DropdownMenuItem>
          Export board
          <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)
```
