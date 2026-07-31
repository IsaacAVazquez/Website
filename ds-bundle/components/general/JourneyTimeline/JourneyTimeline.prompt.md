JourneyTimeline from isaac-vazquez-portfolio. Use via `window.WorkingInstrument.JourneyTimeline` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<PreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface JourneyTimelineProps {
  items?: Array<{ year: number; role: string; company: string; logo?: string; description: string; techStack: Array<string> }>;
}
```

## Examples

### CareerJourney

```jsx
() => (
  <div className="max-w-2xl">
    <JourneyTimeline
      items={[
        {
          year: 2020,
          role: "Digital and Data Associate",
          company: "Open Progress",
          logo: logo("OP", "#2f5d50"),
          description:
            "Moved client analytics from manual reporting to automated pipelines with interactive dashboards.",
          techStack: ["SQL", "Tableau", "ETL Pipelines"],
        },
        {
          year: 2023,
          role: "QA Engineer",
          company: "Civitech",
          logo: logo("CT", "#1f3d7a"),
          description:
            "Built the test infrastructure behind voter contact tools used across national campaigns.",
          techStack: ["Playwright", "TypeScript", "CI/CD"],
        },
      ]}
    />
  </div>
);

// Logo is optional: entries without one fall back to a company-derived icon.
```

### IconFallback

```jsx
() => (
  <div className="max-w-2xl">
    <JourneyTimeline
      items={[
        {
          year: 2018,
          role: "Bachelor of Arts Graduate",
          company: "Florida State University",
          description:
            "Political Science and International Affairs, where the research habits started.",
          techStack: ["Research", "Policy Analysis"],
        },
        {
          year: 2026,
          role: "MBA Candidate",
          company: "Berkeley Haas",
          description:
            "Product management and analytics, with a focus on how data changes team decisions.",
          techStack: ["Strategy", "Product", "Analytics"],
        },
      ]}
    />
  </div>
)
```
