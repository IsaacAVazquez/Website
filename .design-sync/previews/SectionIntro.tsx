import * as React from "react";
import { ModernButton, SectionIntro } from "isaac-vazquez-portfolio";

export const LeftWithEyebrow = () => (
  <div className="max-w-2xl">
    <SectionIntro
      eyebrow="Methodology"
      headingLevel={2}
      title="Why this model is different"
      description="Most brackets stop at seed lines and generic power ratings. This one blends consensus analytics with committee errors, roster context, and travel penalties that change game-day output."
    />
  </div>
);

export const CenteredWithActions = () => (
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
);

export const HeroSizeLg = () => (
  <div className="max-w-2xl">
    <SectionIntro
      size="lg"
      eyebrow="Investments"
      headingLevel={1}
      title="A portfolio you can audit"
      description="Every holding, every rebalance, and every assumption behind the retirement projection lives on this page. I think showing the work matters more than showing the returns."
    />
  </div>
);
