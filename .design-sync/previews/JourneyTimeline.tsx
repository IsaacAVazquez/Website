import * as React from "react";
import { JourneyTimeline } from "isaac-vazquez-portfolio";

// JourneyTimeline defaults to the site's own careerTimeline, whose logo paths
// are app-relative (/images/logos/*) and 404 outside the app. Previews pass the
// `items` prop with SVG data-URI logos so the card is self-contained.
const logo = (initials: string, bg: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">` +
      `<rect width="36" height="36" fill="${bg}"/>` +
      `<text x="18" y="23" font-family="Helvetica,Arial,sans-serif" font-size="13" ` +
      `font-weight="700" fill="#ffffff" text-anchor="middle">${initials}</text>` +
      `</svg>`
  );

// Two entries per cell: the capture grid clips past ~530px of content height.
export const CareerJourney = () => (
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
export const IconFallback = () => (
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
);
