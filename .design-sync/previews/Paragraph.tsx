import * as React from "react";
import { Heading, Paragraph } from "isaac-vazquez-portfolio";

export const Editorial = () => (
  <div className="max-w-2xl">
    <Paragraph>
      Most draft advice treats average draft position like a law of nature. I
      treat it like a market price, and markets get things wrong in ways you
      can measure. The mock-draft data updates weekly, so the gap between a
      player&apos;s consensus rank and where people actually take him is a
      real, observable number.
    </Paragraph>
    <Paragraph>
      That gap is where the edge lives. When a tier is about to snap, I&apos;d
      rather reach half a round early than take the best remaining name after
      it does, because the dropoff between tiers is almost always bigger than
      the dropoff inside one.
    </Paragraph>
    <Paragraph>
      None of this is exotic. It is the same reasoning I used testing voter
      outreach tools at Civitech: find the assumption everyone stopped
      checking, then check it.
    </Paragraph>
  </div>
);

export const LedeAndBody = () => (
  <div className="max-w-2xl">
    <Paragraph className="text-base lg:text-lg text-[var(--home-ink)]">
      The retirement planner is deliberately boring, and I think that is its
      best feature.
    </Paragraph>
    <Paragraph>
      Every projection starts from dated capital-market assumptions you can
      read on the page, runs through a seeded Monte Carlo engine, and lands
      with the caveats still attached. If the output looks confident, the
      assumptions page tells you exactly how confident you should actually be.
    </Paragraph>
  </div>
);

export const UnderHeading = () => (
  <div className="max-w-2xl space-y-2">
    <Heading level={3} as="h2">
      How the snapshots stay honest
    </Heading>
    <div>
      <Paragraph>
        Every dashboard on this site reads from a committed snapshot, not a
        live API. A failed refresh keeps the previous data instead of wiping
        it, so the worst case is a page that is a day stale and says so.
      </Paragraph>
      <Paragraph>
        The tradeoff is real: you give up the last hour of freshness to get
        pages that never break at request time. I have taken that trade every
        time it has come up.
      </Paragraph>
    </div>
  </div>
);
