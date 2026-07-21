ModernButton from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.ModernButton` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface ModernButtonProps {
  href?: string;
  variant?: "outline" | "primary" | "secondary" | "ghost" | "accent" | "mono";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  ariaLabel?: string;
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}
```

## Examples

### Variants

```jsx
() => (
  <div className="flex flex-wrap items-center gap-3">
    <ModernButton variant="primary">Run projection</ModernButton>
    <ModernButton variant="secondary">Save draft board</ModernButton>
    <ModernButton variant="outline">Compare tiers</ModernButton>
    <ModernButton variant="ghost">Dismiss</ModernButton>
    <ModernButton variant="accent">Refresh snapshot</ModernButton>
    <ModernButton variant="mono">Download resume</ModernButton>
  </div>
)
```

### Sizes

```jsx
() => (
  <div className="flex flex-wrap items-center gap-3">
    <ModernButton variant="primary" size="sm">
      sm · Add pick
    </ModernButton>
    <ModernButton variant="primary" size="md">
      md · Add pick
    </ModernButton>
    <ModernButton variant="primary" size="lg">
      lg · Add pick
    </ModernButton>
  </div>
)
```

### AsLinks

```jsx
() => (
  <div className="flex flex-wrap items-center gap-3">
    <ModernButton href="/portfolio" variant="accent" size="lg">
      See the work
    </ModernButton>
    <ModernButton href="/about" variant="outline" size="lg">
      More about me
    </ModernButton>
    <ModernButton href="https://github.com/IsaacAVazquez" variant="ghost" size="md">
      GitHub profile
    </ModernButton>
  </div>
)
```

### States

```jsx
() => (
  <div className="max-w-md space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      <ModernButton variant="primary" disabled>
        Refreshing snapshot
      </ModernButton>
      <ModernButton variant="accent" disabled>
        Locked until kickoff
      </ModernButton>
    </div>
    <ModernButton type="submit" variant="primary" size="lg" fullWidth>
      Sign in
    </ModernButton>
  </div>
)
```
