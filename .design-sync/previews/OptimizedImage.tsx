import * as React from "react";
import { OptimizedImage, ProjectImage } from "isaac-vazquez-portfolio";

const chartShot =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='600' height='400' fill='%23d8d5cc'/></svg>";

const screenshot =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='533'><rect width='800' height='533' fill='%23b9b5aa'/></svg>";

export const ArticleCover = () => (
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
);

export const ProjectScreenshot = () => (
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
);

export const ErrorFallback = () => (
  <div className="max-w-md">
    <OptimizedImage
      src="data:image/png;base64,AAAAA"
      alt="Snapshot chart that failed to load"
      width={480}
      height={200}
      lazy={false}
    />
  </div>
);
