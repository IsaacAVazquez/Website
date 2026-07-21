import * as React from "react";
import { AuthorBio } from "isaac-vazquez-portfolio";

const headshot =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23d8d5cc'/></svg>";

export const Full = () => (
  <div className="max-w-2xl">
    <AuthorBio image={headshot} />
  </div>
);

export const Compact = () => (
  <div className="max-w-md">
    <AuthorBio variant="compact" image={headshot} />
  </div>
);

export const LightEndOfArticle = () => (
  <div className="max-w-2xl">
    <AuthorBio variant="light" image={headshot} />
  </div>
);

export const InlineByline = () => (
  <div
    className="flex max-w-xl items-center justify-between gap-3 py-3"
    style={{ borderTop: "1px solid var(--home-rule)", borderBottom: "1px solid var(--home-rule)" }}
  >
    <AuthorBio variant="inline" image={headshot} />
    <span className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
      May 15, 2024 · 9 min read
    </span>
  </div>
);
