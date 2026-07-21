import * as React from "react";
import { InlineSectionLead } from "isaac-vazquez-portfolio";

export const Canonical = () => (
  <div className="max-w-2xl">
    <InlineSectionLead kicker="Coverage map">
      Which stories every newsroom picked up, and which ones only one desk chased. I read the
      overlap as the day&apos;s actual news and the gaps as editorial taste.
    </InlineSectionLead>
  </div>
);

export const UnderSectionHeading = () => (
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
);

export const NarrowMeasure = () => (
  <InlineSectionLead kicker="Sample note" maxWidthClassName="max-w-md">
    Odds shown here come from a single pinned book, so the de-vig step matters more than it would
    against a consensus line.
  </InlineSectionLead>
);
