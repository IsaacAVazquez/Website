InlineSectionLead from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.InlineSectionLead` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

Small section lead-in used below card titles or section headers to pair a
kicker label with a short explanation. Follows the editorial typography
(Instrument Sans, muted color, tight tracking on the kicker).

## Props

```ts
interface InlineSectionLeadProps {
  kicker: string;
  children: React.ReactNode;
  maxWidthClassName?: string;
}
```

## Examples

### Canonical

```jsx
() => (
  <div className="max-w-2xl">
    <InlineSectionLead kicker="Coverage map">
      Which stories every newsroom picked up, and which ones only one desk chased. I read the
      overlap as the day&apos;s actual news and the gaps as editorial taste.
    </InlineSectionLead>
  </div>
)
```

### UnderSectionHeading

```jsx
() => (
  <div
    className="max-w-2xl rounded-lg border p-4"
    style={{
      borderColor: "var(--home-rule)",
      background: "color-mix(in srgb, var(--home-paper-alt) 78%, var(--home-elev-mix))",
    }}
  >
    <h3
      style={{
        fontFamily: "var(--font-home-sans)",
        color: "var(--home-ink)",
        fontSize: "1.05rem",
        fontWeight: 600,
        margin: 0,
      }}
    >
      Headline sentiment
    </h3>
    <InlineSectionLead kicker="How it reads">
      A simple lexicon pass over every headline, so the split is directional rather than precise.
      Negative usually wins on hard-news days.
    </InlineSectionLead>
  </div>
)
```

### NarrowMeasure

```jsx
() => (
  <InlineSectionLead kicker="Sample note" maxWidthClassName="max-w-md">
    Odds shown here come from a single pinned book, so the de-vig step matters more than it would
    against a consensus line.
  </InlineSectionLead>
)
```
