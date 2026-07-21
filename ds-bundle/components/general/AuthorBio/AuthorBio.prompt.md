AuthorBio from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.AuthorBio` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface AuthorBioProps {
  name?: string;
  title?: string;
  image?: string;
  bio?: string;
  credentials?: Array<string>;
  expertise?: Array<string>;
  social?: { linkedin?: string; github?: string; email?: string; website?: string };
  variant?: "inline" | "compact" | "full" | "light";
  showImage?: boolean;
  showSocial?: boolean;
  className?: string;
}
```

## Examples

### Full

```jsx
() => (
  <div className="max-w-2xl">
    <AuthorBio image={headshot} />
  </div>
)
```

### Compact

```jsx
() => (
  <div className="max-w-md">
    <AuthorBio variant="compact" image={headshot} />
  </div>
)
```

### LightEndOfArticle

```jsx
() => (
  <div className="max-w-2xl">
    <AuthorBio variant="light" image={headshot} />
  </div>
)
```

### InlineByline

```jsx
() => (
  <div
    className="flex max-w-xl items-center justify-between gap-3 py-3"
    style={{ borderTop: "1px solid var(--home-rule)", borderBottom: "1px solid var(--home-rule)" }}
  >
    <AuthorBio variant="inline" image={headshot} />
    <span className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
      May 15, 2024 · 9 min read
    </span>
  </div>
)
```
