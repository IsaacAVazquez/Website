OptimizedImage from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.OptimizedImage` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  lazy?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  objectFit?: "none" | "contain" | "cover" | "fill" | "scale-down";
  objectPosition?: string;
  onLoad?: () => void;
  onError?: () => void;
}
```

## Examples

### ArticleCover

```jsx
() => (
  <div className="max-w-md">
    <OptimizedImage
      src={chartShot}
      alt="Tier breaks across the July PPR consensus rankings"
      width={480}
      height={320}
      lazy={false}
      priority
    />
  </div>
)
```

### ProjectScreenshot

```jsx
() => (
  <figure className="max-w-md">
    <div
      style={{
        border: "1px solid var(--home-rule)",
        borderRadius: "0.5rem",
        overflow: "hidden",
      }}
    >
      <ProjectImage
        src={screenshot}
        alt="Fantasy draft tracker case study screenshot"
        width={800}
        height={533}
        lazy={false}
        priority={false}
      />
    </div>
    <figcaption
      className="text-xs"
      style={{ color: "var(--home-ink-muted)", marginTop: "0.5rem" }}
    >
      The draft tracker mid-draft, with reaches and steals graded against ADP.
    </figcaption>
  </figure>
)
```

### ErrorFallback

```jsx
() => (
  <div className="max-w-md">
    <OptimizedImage
      src="data:image/png;base64,AAAAA"
      alt="Snapshot chart that failed to load"
      width={480}
      height={200}
      lazy={false}
    />
  </div>
)
```
