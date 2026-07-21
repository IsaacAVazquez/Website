Kicker from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.Kicker` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

Kicker — the small label that sits above a heading. `dot` is the
signature Fragment Mono treatment with a signal-orange dot prefix
(`.home-kicker-dot`); `plain` is the quiet Instrument Sans uppercase
eyebrow already used site-wide as `.home-kicker`.

## Props

```ts
interface KickerProps {
  variant?: "dot" | "plain";
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}
```

## Examples

### Variants

```jsx
() => (
  <div className="max-w-2xl space-y-4">
    <div className="flex flex-wrap items-center gap-4">
      <Kicker>Draft analytics</Kicker>
      <span className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
        dot, the mono signature with the signal prefix
      </span>
    </div>
    <div className="flex flex-wrap items-center gap-4">
      <Kicker variant="plain">Methodology</Kicker>
      <span className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
        plain, the quiet uppercase eyebrow
      </span>
    </div>
  </div>
)
```

### DotAboveHeading

```jsx
() => (
  <div className="max-w-2xl space-y-2">
    <Kicker>Score pools</Kicker>
    <Heading level={2} as="h2">
      Exact scores, priced from the odds
    </Heading>
    <Paragraph className="mb-0">
      The pool picks come from a de-vigged market baseline, then a Dixon-Coles
      layer nudges the scorelines the market systematically underprices. I
      would rather show the calibration compromises than hide them.
    </Paragraph>
  </div>
)
```

### PlainEyebrowHeader

```jsx
() => (
  <div className="max-w-2xl rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
    <div className="flex items-center justify-between gap-3">
      <div className="space-y-2">
        <Kicker variant="plain">Live feeds</Kicker>
        <Heading level={4} as="h2">
          Internship postings tracker
        </Heading>
      </div>
      <Chip tone="signal">14 sources</Chip>
    </div>
    <p className="text-sm" style={{ color: "var(--home-ink-muted)", marginTop: 12 }}>
      Refreshed nightly from the committed snapshot. A failed pull keeps
      yesterday&apos;s postings rather than an empty page.
    </p>
  </div>
)
```
