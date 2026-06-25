# Portfolio Best Practices

**Last updated:** 2026-06-25
**Companion to:** `PAGES.md` (route behavior), `WRITING_VOICE.md` (copy), `CASE_STUDY_PLAYBOOK.md`

Strategy and content guidance for the portfolio-first surfaces — homepage, about, portfolio,
contact. The unifying principle: a portfolio's job is to make a busy person *trust your work
fast*. Optimize for the 5–60 second skim, then reward the reader who goes deeper.

---

## The core mental model

Hiring managers and clients skim. The field's consistent finding: a reviewer spends well
under a minute deciding whether to keep reading. So the site must answer three questions
**above the fold, without a scroll**:

1. **Who is this?** (name + a one-line, specific identity)
2. **Is this person credible?** (proof — recognizable work, results, or a strong sample)
3. **What do I do next?** (one obvious action)

Everything below the fold exists to deepen trust for the reader who chose to stay.

---

## Homepage & hero

The hero is the first (and often only) impression. Best practice converges on **focus over
density**.

**Do:**

- Lead with a **specific** identity line, not a generic title. "Builds data-driven products
  in fintech and sports analytics" beats "Software Engineer." Specificity is credibility.
- Make everything essential — headline, sub-line, primary visual, primary CTA — visible
  *without scrolling*.
- Ship **one** primary CTA. At most add one quiet secondary action that doesn't compete.
  (See CTAs below.)
- Let typography carry the hero (on-brand for this site's editorial system) rather than a
  heavy stock image.

**Don't:**

- Bury the value proposition under a long intro paragraph.
- Offer three or four equally-weighted buttons — competing CTAs reduce action.
- Rely on a slow hero image or animation that delays first paint (the hero is almost always
  the LCP element — see `PERFORMANCE_ACCESSIBILITY.md`).

**This site:** the homepage uses the `compact` footer (no stacked closing CTA) and exposes
exactly one page-level `h1` on portfolio-shell routes — keep that. Confirm current behavior
from `src/app/page.tsx` and `ConditionalLayout.tsx`, not from memory.

---

## CTAs (calls to action)

- **One primary action per view.** A focused CTA outperforms competing ones.
- **Verb-first, concrete copy:** "See the work," "Read the case study," "Get in touch" —
  not "Submit" or "Click here."
- **First-person framing** ("Start my…") can increase ownership and conversion vs.
  second-person, where it fits the voice. Keep it consistent with `WRITING_VOICE.md`.
- **Visible contrast.** The CTA must stand out via the editorial accent
  (`var(--home-acid)`), and meet contrast + 44px touch-target minimums.
- **Place CTAs where intent peaks:** in the hero, at the end of each case study, and on the
  about page after the credibility content — not only in the footer.

---

## About page

The about page is where a skim turns into trust. It tells the *second* story — not just
what you built, but who you are and how you work.

- Open with a tight positioning statement, then earn it with specifics (domains, the kinds
  of problems you solve, a thread that connects the work).
- Show personality and a human element — 2026 design explicitly prizes the "more human" web —
  but keep it in `WRITING_VOICE.md` voice.
- Include a **photo** (people trust faces) and a clear path onward (to the work or to
  contact). End with a CTA; don't dead-end.
- Make credibility scannable: a short, honest list of domains/tools beats a sprawling skills
  cloud.

---

## Project selection & presentation

The single most repeated piece of portfolio advice in 2026:

> **Three deep case studies beat eight shallow ones.** Include 3–6 of your *best* projects,
> each demonstrating a *different* challenge or skill dimension.

- **Curate ruthlessly.** Every weak project drags the average. Cut anything you wouldn't
  defend in an interview.
- **Show range deliberately.** Pick projects so that, together, they prove breadth — e.g. one
  data/analytics build, one product/UX build, one systems/infra build.
- **Each card must earn a click.** Card = outcome-oriented title + one-line problem/result +
  the stack. The detail page does the depth (see `CASE_STUDY_PLAYBOOK.md`).
- **Link both the live demo and the source** where they exist — proof beats description.
- **Keep it current.** A portfolio is never static; remove outdated work and surface recent
  wins. Stale projects quietly erode credibility.

**This site:** project data lives in `src/constants/caseStudies.ts`, and `/portfolio` renders
cards directly from the route page (`src/app/portfolio/page.tsx`) — `ProjectsContent.tsx`
exists but is **not** the live path. Edit the data and the route page, and confirm behavior
from the route, not old docs.

---

## Personal branding

- **Consistency is the brand:** one custom domain, one name treatment, one color palette
  (the editorial palette), one voice across every surface. Don't let dashboards drift into a
  different visual language than the portfolio.
- A **concise, specific bio** that reads the same (in spirit) across the homepage, about,
  and any external profiles.
- Authority content (writing, the analytics tools) reinforces the brand only if it's
  visibly *yours* and consistent with the rest of the site — which is why the editorial
  system spans every live route except `/admin`.

---

## Contact

- Make contact *frictionless*: the fewer fields, the more messages. Ask only for what you'll
  actually use.
- Provide a non-form path too (email/social) for people who won't fill a form.
- Set expectations ("I usually reply within…") to reduce hesitation.
- **This site:** `/contact` uses the `compact` footer intentionally — avoid stacking a second
  closing CTA beneath the contact content.

---

## A pre-ship portfolio checklist

Run this *in addition to* `DESIGN_CHECKLIST.md` (the visual/a11y gate) whenever you touch a
portfolio surface:

- [ ] Above the fold answers who/credible/what-next without scrolling.
- [ ] Exactly one primary CTA in the hero; secondary action (if any) is visibly quieter.
- [ ] 3–6 projects, each showing a *distinct* skill; no filler.
- [ ] Every project card has an outcome-oriented title and a reason to click.
- [ ] Case studies lead with the result/problem, not the tech (see playbook).
- [ ] Live demo + source linked wherever they exist.
- [ ] About page has a face, a specific positioning statement, and an onward CTA.
- [ ] No stale projects or dead "coming soon" entries.
- [ ] Copy conforms to `WRITING_VOICE.md`.
- [ ] Hero element doesn't block LCP; CTAs meet contrast + 44px targets.

---

## Sources

- [How to Build a Web Developer Portfolio That Gets You Hired — Scrimba](https://scrimba.com/articles/how-to-build-a-web-developer-portfolio-that-gets-you-hired/)
- [Developer Portfolio Guide 2026 — Hakia](https://hakia.com/skills/building-portfolio/)
- [Website Hero Section Best Practices + Examples — Prismic](https://prismic.io/blog/website-hero-section)
- [Hero Sections That Really Convert — Hype4 Academy](https://hype4.academy/articles/design/hero-sections-that-really-convert)
- [The Best CTA Placement Strategies For 2026 — LandingPageFlow](https://www.landingpageflow.com/post/best-cta-placement-strategies-for-landing-pages)
- [Website CTA Best Practices — Brand Llama](https://www.brandllama.com/website-cta-best-practices-quick-wins-for-better-conversions/)
- [How to Build a Developer Portfolio Website in March 2026 — Learni](https://learni-group.com/en/blog/how-to-build-developer-portfolio-website-march-2026)
