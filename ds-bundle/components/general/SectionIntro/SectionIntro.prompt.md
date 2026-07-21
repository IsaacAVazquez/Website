SectionIntro from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.SectionIntro` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface SectionIntroProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  align?: "center" | "left";
  size?: "md" | "lg";
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}
```

## Examples

### LeftWithEyebrow

```jsx
() => (
  <div className="max-w-2xl">
    <SectionIntro
      eyebrow="Methodology"
      headingLevel={2}
      title="Why this model is different"
      description="Most brackets stop at seed lines and generic power ratings. This one blends consensus analytics with committee errors, roster context, and travel penalties that change game-day output."
    />
  </div>
)
```

### CenteredWithActions

```jsx
() => (
  <div className="max-w-2xl">
    <SectionIntro
      eyebrow="Contact"
      align="center"
      headingLevel={2}
      title="Interested in working together?"
      description="If you're working on something where product judgment and execution both matter, I'd like to hear about it."
      actions={
        <>
          <ModernButton variant="primary" size="sm">
            Email me
          </ModernButton>
          <ModernButton variant="outline" size="sm">
            View resume
          </ModernButton>
        </>
      }
    />
  </div>
)
```

### HeroSizeLg

```jsx
() => (
  <div className="max-w-2xl">
    <SectionIntro
      size="lg"
      eyebrow="Investments"
      headingLevel={1}
      title="A portfolio you can audit"
      description="Every holding, every rebalance, and every assumption behind the retirement projection lives on this page. I think showing the work matters more than showing the returns."
    />
  </div>
)
```
